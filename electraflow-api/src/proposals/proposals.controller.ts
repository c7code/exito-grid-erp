import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProposalsService } from './proposals.service';
import { Proposal, ProposalStatus } from './proposal.entity';
import { Request } from 'express';

@ApiTags('Propostas')
@Controller('proposals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) { }

  @Get()
  @ApiOperation({ summary: 'Listar propostas' })
  async findAll(@Query('status') status?: ProposalStatus) {
    return this.proposalsService.findAll(status);
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Listar todas as propostas (incluindo excluídas)' })
  async findAllWithDeleted() {
    return this.proposalsService.findAllWithDeleted();
  }

  @Get('diagnose-schema')
  @ApiOperation({ summary: 'Diagnóstico do schema de propostas' })
  async diagnoseSchema() {
    return this.proposalsService.diagnoseSchema();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar proposta por ID' })
  async findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Listar revisões da proposta' })
  async getRevisions(@Param('id') id: string) {
    return this.proposalsService.getRevisions(id);
  }

  @Post(':id/restore-revision')
  @ApiOperation({ summary: 'Restaurar proposta para uma revisão anterior' })
  async restoreRevision(@Param('id') id: string, @Body() data: { revisionId: string }) {
    return this.proposalsService.restoreRevision(id, data.revisionId);
  }

  @Delete(':id/revisions')
  @ApiOperation({ summary: 'Excluir revisão (soft delete)' })
  async softDeleteRevision(@Param('id') id: string, @Body() data: { revisionId: string }) {
    await this.proposalsService.softDeleteRevision(id, data.revisionId);
    return { message: 'Revisão excluída com sucesso' };
  }

  @Post()
  @ApiOperation({ summary: 'Criar proposta' })
  async create(@Body() data: { proposal: Partial<Proposal>; items: any[] }, @Req() req: any) {
    try {
      // Safely set createdById — skip if user info not available
      const proposalData = { ...data.proposal };
      const userId = req.user?.userId || req.user?.id || req.user?.sub;
      if (userId) {
        proposalData.createdById = userId;
      }
      return await this.proposalsService.create(proposalData, data.items || []);
    } catch (err: any) {
      console.error('PROPOSAL CREATE ERROR:', err?.message, err?.stack);
      const errorMsg = err?.message || 'Erro desconhecido';
      const detail = err?.detail || err?.driverError?.detail || null;
      throw new HttpException(
        { message: 'Erro ao criar proposta: ' + errorMsg, detail },
        500,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar proposta' })
  async update(@Param('id') id: string, @Body() data: { proposal?: Partial<Proposal>; items?: any[] } & Partial<Proposal>) {
    // Aceita tanto { proposal, items } quanto Partial<Proposal> diretamente
    const proposalData = data.proposal || data;
    const result = await this.proposalsService.update(id, proposalData);
    // Se vieram itens, atualizar também
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      return this.proposalsService.updateItems(id, data.items);
    }
    return result;
  }

  @Put(':id/items')
  @ApiOperation({ summary: 'Atualizar itens da proposta' })
  async updateItems(@Param('id') id: string, @Body() data: { items: any[] }) {
    return this.proposalsService.updateItems(id, data.items);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Enviar proposta' })
  async send(@Param('id') id: string) {
    return this.proposalsService.send(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Aceitar proposta' })
  async accept(@Param('id') id: string) {
    return this.proposalsService.accept(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeitar proposta' })
  async reject(@Param('id') id: string, @Body() data: { reason?: string }) {
    return this.proposalsService.reject(id, data?.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover proposta (soft delete)' })
  async remove(@Param('id') id: string) {
    await this.proposalsService.remove(id);
    return { message: 'Proposta removida com sucesso' };
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Remover proposta permanentemente' })
  async permanentDelete(@Param('id') id: string) {
    await this.proposalsService.permanentDelete(id);
    return { message: 'Proposta removida permanentemente' };
  }

  // ═══ Assinatura Digital (endpoints protegidos) ═══

  @Post(':id/generate-signature-link')
  @ApiOperation({ summary: 'Gerar link de assinatura para o cliente' })
  async generateSignatureLink(@Param('id') id: string) {
    return this.proposalsService.generateSignatureLink(id);
  }

  @Get(':id/signature-status')
  @ApiOperation({ summary: 'Verificar status da assinatura' })
  async getSignatureStatus(@Param('id') id: string) {
    return this.proposalsService.getSignatureStatus(id);
  }
}

// ═══════════════════════════════════════════════════════════════
// Controller PÚBLICO (sem autenticação) — Assinatura do cliente
// ═══════════════════════════════════════════════════════════════

@ApiTags('Assinatura Pública')
@Controller('proposals/sign')
export class ProposalPublicController {
  constructor(private proposalsService: ProposalsService) { }

  @Get(':token')
  @ApiOperation({ summary: 'Acessar proposta por token de assinatura (público)' })
  async getByToken(@Param('token') token: string) {
    return this.proposalsService.getProposalByToken(token);
  }

  @Post(':token/confirm')
  @ApiOperation({ summary: 'Confirmar assinatura da proposta (público)' })
  async confirmSignature(
    @Param('token') token: string,
    @Body() data: { name: string; document: string },
    @Req() req: Request,
  ) {
    const ip = req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.proposalsService.signProposal(token, {
      name: data.name,
      document: data.document,
      ip,
      userAgent,
    });
  }
}
