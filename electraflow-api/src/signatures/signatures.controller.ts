import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SignaturesService } from './signatures.service';

const signatureStorage = diskStorage({
  destination: './uploads/signatures',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `sig-${unique}${extname(file.originalname)}`);
  },
});

@Controller('signatures')
export class SignaturesController {
  constructor(private readonly service: SignaturesService) {}

  // ═══ SIGNATURE SLOTS ════════════════════════════════════════════════════════

  @Get()
  findAll(@Query('scope') scope?: string) {
    if (scope) return this.service.findSlotsByScope(scope);
    return this.service.findAllSlots();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findSlotById(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.createSlot(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.updateSlot(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.deleteSlot(id);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', { storage: signatureStorage }))
  async uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const imageUrl = `/uploads/signatures/${file.filename}`;
    return this.service.updateSlot(id, { imageUrl });
  }

  // ═══ DOCUMENT SIGNATURES ════════════════════════════════════════════════════

  @Get('document/:type/:id')
  getDocumentSignatures(@Param('type') type: string, @Param('id') id: string) {
    return this.service.getDocumentSignatures(type, id);
  }

  @Post('document/bind')
  setDocumentSignature(@Body() data: {
    documentType: string;
    documentId: string;
    slotPosition: string;
    signatureSlotId: string;
    overrideSignerName?: string;
    overrideSignerRole?: string;
  }) {
    return this.service.setDocumentSignature(data);
  }

  @Delete('document/:id')
  removeDocumentSignature(@Param('id') id: string) {
    return this.service.removeDocumentSignature(id);
  }

  @Get('resolve/:type/:id')
  resolveSignatures(
    @Param('type') type: string,
    @Param('id') id: string,
    @Query('slots') slots?: string,
  ) {
    const slotPositions = slots ? slots.split(',') : ['contratada', 'contratante', 'testemunha'];
    return this.service.resolveSignatures(type, id, slotPositions);
  }
}
