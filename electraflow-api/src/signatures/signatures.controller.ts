import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { SignaturesService } from './signatures.service';
import { CreateSignatureSlotDto, UpdateSignatureSlotDto, BindDocumentSignatureDto } from './dto';

@ApiTags('Assinaturas')
@Controller('signatures')
export class SignaturesController {
  constructor(private readonly service: SignaturesService) {}

  // ═══ SPECIFIC ROUTES FIRST (before :id catch-all) ══════════════════════════

  @Get('resolve/:type/:docId')
  @ApiOperation({ summary: 'Resolver assinaturas de um documento' })
  resolveSignatures(
    @Param('type') type: string,
    @Param('docId') docId: string,
    @Query('slots') slots?: string,
  ) {
    const slotPositions = slots ? slots.split(',') : ['contratada', 'contratante', 'testemunha'];
    return this.service.resolveSignatures(type, docId, slotPositions);
  }

  @Get('document/:type/:docId')
  @ApiOperation({ summary: 'Listar assinaturas vinculadas ao documento' })
  getDocumentSignatures(@Param('type') type: string, @Param('docId') docId: string) {
    return this.service.getDocumentSignatures(type, docId);
  }

  @Post('document/bind')
  @ApiOperation({ summary: 'Vincular assinatura a um documento' })
  setDocumentSignature(@Body() data: BindDocumentSignatureDto) {
    return this.service.setDocumentSignature(data);
  }

  @Delete('document/:docId')
  @ApiOperation({ summary: 'Remover assinatura de documento' })
  removeDocumentSignature(@Param('docId') docId: string) {
    return this.service.removeDocumentSignature(docId);
  }

  // ═══ SIGNATURE SLOTS (generic :id routes LAST) ═════════════════════════════

  @Get()
  @ApiOperation({ summary: 'Listar assinaturas cadastradas' })
  findAll(@Query('scope') scope?: string) {
    if (scope) return this.service.findSlotsByScope(scope);
    return this.service.findAllSlots();
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova assinatura' })
  create(@Body() data: CreateSignatureSlotDto) {
    return this.service.createSlot(data);
  }

  /**
   * Upload signature image — stores as base64 data URL in database.
   * This avoids filesystem dependency (Railway ephemeral containers).
   */
  @Post(':id/upload')
  @ApiOperation({ summary: 'Upload de imagem de assinatura' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error('Arquivo não recebido');
    }
    // Convert buffer to base64 data URL — persists in database, not filesystem
    const mimeType = file.mimetype || 'image/png';
    const base64 = file.buffer.toString('base64');
    const imageUrl = `data:${mimeType};base64,${base64}`;
    const updated = await this.service.updateSlot(id, { imageUrl });
    return updated;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar assinatura por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findSlotById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar assinatura' })
  update(@Param('id') id: string, @Body() data: UpdateSignatureSlotDto) {
    return this.service.updateSlot(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover assinatura' })
  remove(@Param('id') id: string) {
    return this.service.deleteSlot(id);
  }
}
