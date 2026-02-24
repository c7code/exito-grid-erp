import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, Res, NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { Document, DocumentFolder, DocumentType } from './document.entity';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents');

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('Documentos')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) { }

  // ========== DOCUMENTOS ==========

  @Get()
  @ApiOperation({ summary: 'Listar documentos' })
  async findAll(
    @Query('workId') workId?: string,
    @Query('type') type?: DocumentType,
    @Query('folderId') folderId?: string,
    @Query('proposalId') proposalId?: string,
  ) {
    return this.documentsService.findAll({ workId, type, folderId, proposalId });
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
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuid()}${ext}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name?: string; type?: string; workId?: string; folderId?: string; description?: string },
  ) {
    const docData: Partial<Document> = {
      name: body.name || file.originalname,
      fileName: file.originalname,
      originalName: file.originalname,
      url: `/api/documents/${file.filename}/file`,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      type: (body.type as DocumentType) || DocumentType.OTHER,
      workId: body.workId || null,
      folderId: body.folderId || null,
      description: body.description || null,
    };
    return this.documentsService.create(docData);
  }

  // ========== DOWNLOAD ==========

  @Get(':fileNameOrId/file')
  @ApiOperation({ summary: 'Download de arquivo' })
  async downloadFile(@Param('fileNameOrId') fileNameOrId: string, @Res() res: Response) {
    // Try to find by stored filename first
    let filePath = path.join(UPLOAD_DIR, fileNameOrId);

    if (!fs.existsSync(filePath)) {
      // If not found by filename, look up the document by ID
      const doc = await this.documentsService.findOne(fileNameOrId);
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        filePath = doc.filePath;
      } else {
        throw new NotFoundException('Arquivo não encontrado no servidor');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.dwg': 'application/acad',
      '.zip': 'application/zip',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
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
  async remove(@Param('id') id: string) {
    const doc = await this.documentsService.findOne(id);
    // Clean up file from disk if it exists
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    await this.documentsService.remove(id);
    return { message: 'Documento removido com sucesso' };
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
