import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, Res, NotFoundException, ForbiddenException, Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { Document, DocumentFolder, DocumentType } from './document.entity';
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

  // ========== DOCUMENTOS ==========

  @Get()
  @ApiOperation({ summary: 'Listar documentos' })
  async findAll(
    @Query('workId') workId?: string,
    @Query('type') type?: DocumentType,
    @Query('folderId') folderId?: string,
    @Query('proposalId') proposalId?: string,
    @Query('contractId') contractId?: string,
    @Query('accessLevel') accessLevel?: string,
    @Request() req?,
  ) {
    const docs = await this.documentsService.findAll({ workId, type, folderId, proposalId, contractId });
    // Filter by accessLevel if requested
    let filtered = docs;
    if (accessLevel) {
      filtered = filtered.filter(d => (d.accessLevel || 'public') === accessLevel);
    }
    // Hide 'hidden' docs from non-admin users
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

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
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
    @Body() body: { name?: string; type?: string; workId?: string; folderId?: string; description?: string; purpose?: string; tags?: string; sourceOrganization?: string; contractId?: string; proposalId?: string; clientId?: string },
    @Request() req,
  ) {
    // Parse tags from JSON string (sent via FormData)
    let parsedTags: string[] | null = null;
    if (body.tags) {
      try { parsedTags = JSON.parse(body.tags); } catch { parsedTags = null; }
    }

    // Gerar path no storage: {uuid}/{originalFilename}
    const fileId = uuid();
    const ext = path.extname(file.originalname);
    const storagePath = `${fileId}/${file.originalname}`;

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

  // ========== DOWNLOAD ==========

  @Get(':fileNameOrId/file')
  @ApiOperation({ summary: 'Download de arquivo' })
  async downloadFile(@Param('fileNameOrId') fileNameOrId: string, @Res() res: Response, @Request() req) {
    let doc: Document | null = null;

    try {
      doc = await this.documentsService.findOne(fileNameOrId);
    } catch {
      // Not found by ID
    }

    if (!doc) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    // Block download for view_only or hidden docs (unless admin/authorized)
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
  async create(@Body() docData: Partial<Document>) {
    return this.documentsService.create(docData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar documento' })
  async update(@Param('id') id: string, @Body() docData: Partial<Document>) {
    return this.documentsService.update(id, docData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover documento' })
  async remove(@Param('id') id: string, @Request() req) {
    const doc = await this.documentsService.findOne(id);

    // Block delete for restricted docs if not admin
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
    @Body() body: { accessLevel: string },
    @Request() req,
  ) {
    // Only admin or users with documents-restricted permission can change access levels
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

  // ========== PASTAS ==========

  @Get('folders/list')
  @ApiOperation({ summary: 'Listar todas as pastas' })
  async findFolders(@Query('workId') workId?: string) {
    return this.documentsService.findFolders(workId);
  }

  @Get('folders/root')
  @ApiOperation({ summary: 'Listar pastas raiz (com subpastas)' })
  async findRootFolders(@Query('workId') workId?: string) {
    return this.documentsService.findRootFolders(workId);
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Buscar pasta por ID' })
  async findFolder(@Param('id') id: string) {
    return this.documentsService.findFolder(id);
  }

  @Post('folders')
  @ApiOperation({ summary: 'Criar pasta' })
  async createFolder(@Body() data: Partial<DocumentFolder>) {
    return this.documentsService.createFolder(data);
  }

  @Put('folders/:id')
  @ApiOperation({ summary: 'Atualizar pasta' })
  async updateFolder(@Param('id') id: string, @Body() data: Partial<DocumentFolder>) {
    return this.documentsService.updateFolder(id, data);
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Remover pasta' })
  async removeFolder(@Param('id') id: string) {
    await this.documentsService.removeFolder(id);
    return { message: 'Pasta removida com sucesso' };
  }
}
