import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService, UpdateDocumentDto } from './documents.service';
import { JwtAuthGuard, RolesGuard, RequireRoles } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { DocumentType } from './document.entity';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar todos os documentos' })
  async findAll() {
    return this.documentsService.findAll();
  }

  @Get('by-work/:workId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Documentos por obra' })
  async findByWork(@Param('workId') workId: string) {
    return this.documentsService.findByWork(workId);
  }

  @Get('by-task/:taskId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Documentos por tarefa' })
  async findByTask(@Param('taskId') taskId: string) {
    return this.documentsService.findByTask(taskId);
  }

  @Get('by-type/:type')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Documentos por tipo' })
  async findByType(@Param('type') type: DocumentType) {
    return this.documentsService.findByType(type);
  }

  @Get('by-folder/:folderId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Documentos por pasta' })
  async findByFolder(@Param('folderId') folderId: string) {
    return this.documentsService.findByFolder(folderId);
  }

  @Get('stats')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estatísticas de documentos' })
  async getStats() {
    return this.documentsService.getStats();
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar documento por ID' })
  async findById(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Get(':id/download')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Download do documento' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { stream, doc } = await this.documentsService.getFileStream(id);
    
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    
    stream.pipe(res);
  }

  @Post('upload')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de múltiplos documentos' })
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() data: { workId?: string; taskId?: string; type?: DocumentType; folderId?: string },
    @Request() req,
  ) {
    return this.documentsService.uploadMultiple(files, {
      ...data,
      uploadedById: req.user.sub,
    });
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar documento' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateDocumentDto) {
    return this.documentsService.update(id, updateDto);
  }

  @Put(':id/approve')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Aprovar documento' })
  async approve(@Param('id') id: string) {
    return this.documentsService.approve(id);
  }

  @Put(':id/reject')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Rejeitar documento' })
  async reject(@Param('id') id: string) {
    return this.documentsService.reject(id);
  }

  @Put(':id/archive')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Arquivar documento' })
  async archive(@Param('id') id: string) {
    return this.documentsService.archive(id);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover documento' })
  async delete(@Param('id') id: string) {
    await this.documentsService.delete(id);
    return { message: 'Documento removido com sucesso' };
  }
}
