import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, Res, NotFoundException, ForbiddenException, BadRequestException, Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { Document, DocumentFolder, DocumentType } from './document.entity';
import {
  CreateDocumentFolderDto, UpdateDocumentFolderDto, CreateFolderCategoryDto,
  UploadDocumentDto, CreateDocumentDto, UpdateDocumentDto, ChangeDocumentAccessLevelDto,
} from './dto';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

@ApiTags('Documentos')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(
    private documentsService: DocumentsService,
    private supabaseStorage: SupabaseStorageService,
  ) { }

  // ========== DOCUMENTOS (rotas sem parâmetro dinâmico primeiro) ==========

  @Get()
  @ApiOperation({ summary: 'Listar documentos' })
  async findAll(
    @Request() req,
    @Query('workId') workId?: string,
    @Query('type') type?: DocumentType,
    @Query('folderId') folderId?: string,
    @Query('proposalId') proposalId?: string,
    @Query('contractId') contractId?: string,
    @Query('clientId') clientId?: string,
    @Query('accessLevel') accessLevel?: string,
  ) {
    const docs = await this.documentsService.findAll({ workId, type, folderId, proposalId, contractId, clientId });
    // Filtra por accessLevel se solicitado
    let filtered = docs;
    if (accessLevel) {
      filtered = filtered.filter(d => (d.accessLevel || 'public') === accessLevel);
    }
    // Oculta documentos 'hidden' para usuários não-admin
    const userRole = req?.user?.role;
    const userPermissions: string[] = req?.user?.permissions || [];
    const canSeeRestricted = userRole === 'admin' || userPermissions.includes('documents-restricted');
    if (!canSeeRestricted) {
      filtered = filtered.filter(d => (d.accessLevel || 'public') !== 'hidden');
    }
    return filtered;
  }

  @Get('by-work/:workId')
  @ApiOperation({ summary: 'Listar documentos por obra' })
  async findByWork(@Param('workId') workId: string) {
    return this.documentsService.findByWork(workId);
  }

  // ========== PASTAS (antes de qualquer rota :id) ==========

  @Get('folders/list')
  @ApiOperation({ summary: 'Listar todas as pastas' })
  async findFolders(
    @Query('workId') workId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.documentsService.findFolders(workId, clientId);
  }

  @Get('folders/root')
  @ApiOperation({ summary: 'Listar pastas raiz (com subpastas)' })
  async findRootFolders(
    @Query('workId') workId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.documentsService.findRootFolders(workId, clientId);
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Buscar pasta por ID' })
  async findFolder(@Param('id') id: string) {
    return this.documentsService.findFolder(id);
  }

  @Post('folders')
  @ApiOperation({ summary: 'Criar pasta' })
  async createFolder(@Body() data: CreateDocumentFolderDto) {
    return this.documentsService.createFolder(data);
  }

  @Put('folders/:id')
  @ApiOperation({ summary: 'Atualizar pasta' })
  async updateFolder(@Param('id') id: string, @Body() data: UpdateDocumentFolderDto) {
    return this.documentsService.updateFolder(id, data);
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Remover pasta' })
  async removeFolder(@Param('id') id: string, @Request() req) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Apenas administradores podem excluir');
    await this.documentsService.removeFolder(id);
    return { message: 'Pasta removida com sucesso' };
  }

  // ========== CATEGORIAS DE PASTA ==========

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias de pasta' })
  async findCategories() {
    return this.documentsService.findCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Criar categoria de pasta' })
  async createCategory(@Body() data: CreateFolderCategoryDto) {
    return this.documentsService.createCategory(data);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Remover categoria de pasta' })
  async deleteCategory(@Param('id') id: string, @Request() req) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Apenas administradores podem excluir');
    await this.documentsService.deleteCategory(id);
    return { message: 'Categoria removida' };
  }

  // ========== UPLOAD ==========

  @Post('upload')
  @ApiOperation({ summary: 'Upload de arquivo' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadDocumentDto,
    @Request() req,
  ) {
    // Verifica se o Supabase Storage está configurado
    if (!this.supabaseStorage.isConfigured()) {
      throw new BadRequestException('Supabase Storage não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_KEY.');
    }

    // Parse tags de string JSON (enviadas via FormData)
    let parsedTags: string[] | null = null;
    if (body.tags) {
      try { parsedTags = JSON.parse(body.tags); } catch { parsedTags = null; }
    }

    // Gerar path no storage: {uuid}/{sanitizedFilename}
    // Supabase Storage rejeita keys com caracteres especiais (colchetes, espaços, acentos)
    const fileId = uuid();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-zA-Z0-9._-]/g, '_')                // substitui caracteres especiais
      .replace(/_+/g, '_')                              // colapsa underscores duplos
      .replace(/^_|_$/g, '');                            // remove underscores nas pontas
    const storagePath = `${fileId}/${safeName}${ext}`;

    // Upload para o Supabase Storage
    const publicUrl = await this.supabaseStorage.upload(
      storagePath,
      file.buffer,
      file.mimetype,
    );

    const docData: Partial<Document> = {
      name: body.name || file.originalname,
      fileName: file.originalname,
      originalName: file.originalname,
      url: publicUrl,
      filePath: storagePath, // caminho no Supabase Storage (para delete futuro)
      mimeType: file.mimetype,
      size: file.size,
      type: (body.type as DocumentType) || DocumentType.OTHER,
      workId: body.workId || null,
      folderId: body.folderId || null,
      contractId: body.contractId || null,
      proposalId: body.proposalId || null,
      clientId: body.clientId || null,
      description: body.description || null,
      purpose: body.purpose || null,
      tags: parsedTags,
      sourceOrganization: body.sourceOrganization || null,
      createdById: req.user?.userId || req.user?.id,
    };
    return this.documentsService.create(docData);
  }

  // ========== ROTAS COM :id (por último para evitar conflito) ==========

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':fileNameOrId/file')
  @ApiOperation({ summary: 'Download de arquivo' })
  async downloadFile(@Param('fileNameOrId') fileNameOrId: string, @Res() res: Response, @Request() req) {
    let doc: Document | null = null;

    try {
      doc = await this.documentsService.findOne(fileNameOrId);
    } catch {
      // Não encontrado por ID
    }

    if (!doc) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    // Bloqueia download para documentos view_only ou hidden (exceto admin/autorizados)
    const docAccess = doc.accessLevel || 'public';
    if (docAccess !== 'public') {
      const userRole = req?.user?.role;
      const userPermissions: string[] = req?.user?.permissions || [];
      const canAccess = userRole === 'admin' || userPermissions.includes('documents-restricted');
      if (!canAccess) {
        throw new ForbiddenException('Você não tem permissão para baixar este documento.');
      }
    }

    // Se a URL é do Supabase (https://...), redireciona
    if (doc.url && doc.url.startsWith('http')) {
      return res.redirect(doc.url);
    }

    // Fallback: tentar ler do disco local (compatibilidade com arquivos antigos)
    const filePath = doc.filePath;
    if (filePath && fs.existsSync(filePath)) {
      let contentType = doc.mimeType || 'application/octet-stream';
      const downloadName = doc.originalName || doc.fileName || path.basename(filePath);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(downloadName)}"`);

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    throw new NotFoundException('Arquivo não encontrado no servidor');
  }

  @Post()
  @ApiOperation({ summary: 'Criar documento (registro manual via URL)' })
  async create(@Body() docData: CreateDocumentDto) {
    return this.documentsService.create(docData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar documento' })
  async update(@Param('id') id: string, @Body() docData: UpdateDocumentDto) {
    return this.documentsService.update(id, docData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover documento' })
  async remove(@Param('id') id: string, @Request() req) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Apenas administradores podem excluir');
    const doc = await this.documentsService.findOne(id);

    // Bloqueia exclusão de documentos restritos se não for admin
    const docAccess = doc.accessLevel || 'public';
    if (docAccess !== 'public') {
      const userRole = req?.user?.role;
      const userPermissions: string[] = req?.user?.permissions || [];
      const canAccess = userRole === 'admin' || userPermissions.includes('documents-restricted');
      if (!canAccess) {
        throw new ForbiddenException('Você não tem permissão para excluir este documento.');
      }
    }

    // Limpar do Supabase Storage se o filePath parece ser um path de storage (não absoluto)
    if (doc.filePath && !path.isAbsolute(doc.filePath)) {
      await this.supabaseStorage.delete(doc.filePath);
    }
    // Limpar do disco local se for path absoluto (compat com arquivos antigos)
    else if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await this.documentsService.remove(id);
    return { message: 'Documento removido com sucesso' };
  }

  // ========== CONTROLE DE ACESSO ==========

  @Patch(':id/access-level')
  @ApiOperation({ summary: 'Alterar nível de acesso do documento' })
  async changeAccessLevel(
    @Param('id') id: string,
    @Body() body: ChangeDocumentAccessLevelDto,
    @Request() req,
  ) {
    // Apenas admin ou usuários com permissão documents-restricted podem alterar nível de acesso
    const userRole = req?.user?.role;
    const userPermissions: string[] = req?.user?.permissions || [];
    const canManage = userRole === 'admin' || userPermissions.includes('documents-restricted');
    if (!canManage) {
      throw new ForbiddenException('Apenas administradores podem alterar o nível de acesso.');
    }

    const validLevels = ['public', 'view_only', 'hidden'];
    if (!validLevels.includes(body.accessLevel)) {
      throw new ForbiddenException(`Nível de acesso inválido. Use: ${validLevels.join(', ')}`);
    }

    return this.documentsService.update(id, {
      accessLevel: body.accessLevel,
      accessChangedById: req.user?.userId || req.user?.id,
    });
  }
}
