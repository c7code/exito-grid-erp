import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { LaudosService } from './laudos.service';

@ApiTags('Laudos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('laudos')
export class LaudosController {
  constructor(private readonly svc: LaudosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar atendimentos (filtrado por acesso)' })
  findAll(@Req() req: any) {
    return this.svc.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar atendimento por ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.svc.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo atendimento' })
  create(@Body() data: any, @Req() req: any) {
    // Se vendedorId não informado, usar o usuário logado
    if (!data.vendedorId) data.vendedorId = req.user?.id;
    return this.svc.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar atendimento' })
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.svc.update(id, data, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover atendimento (soft-delete)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.svc.remove(id, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do atendimento' })
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.svc.updateStatus(id, status, req.user);
  }

  @Patch(':id/proposal')
  @ApiOperation({ summary: 'Vincular proposta ao atendimento' })
  linkProposal(@Param('id') id: string, @Body('proposalId') proposalId: string, @Req() req: any) {
    return this.svc.linkProposal(id, proposalId, req.user);
  }

  @Post(':id/upload')
  @ApiOperation({ summary: 'Upload de documento para o atendimento' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 52428800 } }))
  uploadDocument(@Param('id') id: string, @UploadedFile() file: any, @Req() req: any) {
    return this.svc.uploadDocument(id, file, req.user);
  }

  @Delete(':id/document')
  @ApiOperation({ summary: 'Remover documento do atendimento' })
  removeDocument(@Param('id') id: string, @Body('filePath') filePath: string, @Req() req: any) {
    return this.svc.removeDocument(id, filePath, req.user);
  }
}
