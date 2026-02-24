import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
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

  @Get(':id')
  @ApiOperation({ summary: 'Buscar proposta por ID' })
  async findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar proposta' })
  async create(@Body() data: { proposal: Partial<Proposal>; items: any[] }) {
    return this.proposalsService.create(data.proposal, data.items);
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
  @ApiOperation({ summary: 'Remover proposta' })
  async remove(@Param('id') id: string) {
    await this.proposalsService.remove(id);
    return { message: 'Proposta removida com sucesso' };
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
