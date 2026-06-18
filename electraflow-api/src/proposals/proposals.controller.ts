import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProposalsService } from './proposals.service';
import { Proposal, ProposalStatus } from './proposal.entity';
import { Request } from 'express';
import {
  CreateProposalDto,
  UpdateProposalDto,
  UpdateProposalItemsDto,
  RejectProposalDto,
  DuplicateProposalDto,
  UpdateProposalLabelDto,
  RestoreRevisionDto,
  DeleteRevisionDto,
  ConfirmProposalSignatureDto,
} from './dto';

@ApiTags('Propostas')
@Controller('proposals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) { }

  @Get()
  @ApiOperation({ summary: 'Listar propostas (paginado)' })
  async findAll(
    @Query('status') status?: ProposalStatus,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 50,
  ) {
    return this.proposalsService.findAll(status, Number(page), Number(pageSize));
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
  async restoreRevision(@Param('id') id: string, @Body() data: RestoreRevisionDto) {
    return this.proposalsService.restoreRevision(id, data.revisionId);
  }

  @Delete(':id/revisions')
  @ApiOperation({ summary: 'Excluir revisão (soft delete)' })
  async softDeleteRevision(@Param('id') id: string, @Body() data: DeleteRevisionDto) {
    await this.proposalsService.softDeleteRevision(id, data.revisionId);
    return { message: 'Revisão excluída com sucesso' };
  }

  @Post()
  @ApiOperation({ summary: 'Criar proposta' })
  async create(@Body() data: CreateProposalDto, @Req() req: any) {
    try {
      // Safely set createdById — skip if user info not available
      const proposalData = { ...data.proposal };
      const userId = req.user?.userId || req.user?.id || req.user?.sub;
      if (userId) {
        (proposalData as any).createdById = userId;
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
  async update(@Param('id') id: string, @Body() data: UpdateProposalDto) {
    // Aceita tanto { proposal, items } quanto Partial<Proposal> diretamente
    const proposalData = data.proposal || data;
    const result = await this.proposalsService.update(id, proposalData as any);
    // Se vieram itens, atualizar também
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      return this.proposalsService.updateItems(id, data.items as any);
    }
    return result;
  }

  @Put(':id/items')
  @ApiOperation({ summary: 'Atualizar itens da proposta' })
  async updateItems(@Param('id') id: string, @Body() data: UpdateProposalItemsDto) {
    return this.proposalsService.updateItems(id, data.items as any);
  }

  @Post(':id/recalculate')
  @ApiOperation({ summary: 'Recalcular totais da proposta' })
  async recalculate(@Param('id') id: string) {
    return this.proposalsService.recalculateTotals(id);
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

  @Post(':id/revert-acceptance')
  @ApiOperation({ summary: 'Reverter aprovação da proposta' })
  async revertAcceptance(@Param('id') id: string) {
    return this.proposalsService.revertAcceptance(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeitar proposta' })
  async reject(@Param('id') id: string, @Body() data: RejectProposalDto) {
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
  // ═══ Duplicar proposta ═══

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar proposta com novo número' })
  async duplicate(
    @Param('id') id: string,
    @Body() overrides?: DuplicateProposalDto,
  ) {
    return this.proposalsService.duplicate(id, overrides as any);
  }

  @Patch(':id/label')
  @ApiOperation({ summary: 'Atualizar rótulo personalizado da proposta' })
  async updateLabel(
    @Param('id') id: string,
    @Body() body: UpdateProposalLabelDto,
  ) {
    await this.proposalsService['proposalRepository']
      .createQueryBuilder()
      .update()
      .set({ customLabel: body.customLabel } as any)
      .where('id = :id', { id })
      .execute();
    return { id, customLabel: body.customLabel };
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
    @Body() data: ConfirmProposalSignatureDto,
    @Req() req: Request,
  ) {
    const ip = req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.proposalsService.signProposal(token, {
      name: data.name,
      document: data.document,
      signatureImage: data.signatureImage,
      ip,
      userAgent,
    });
  }
}
