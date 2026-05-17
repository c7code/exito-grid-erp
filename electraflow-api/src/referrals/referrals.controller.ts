import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PartnerAuthGuard } from './partner-auth.guard';
import { SupabaseStorageService } from '../documents/supabase-storage.service';

@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly service: ReferralsService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  // ─── PORTAL DO PARCEIRO — ROTAS PÚBLICAS ─────
  @Post('partner/login')
  partnerLogin(@Body('email') email: string, @Body('password') password: string) {
    return this.service.partnerLogin(email, password);
  }

  // ─── PORTAL DO PARCEIRO — ROTAS PROTEGIDAS ───
  @UseGuards(PartnerAuthGuard)
  @Get('partner/me')
  getPartnerMe(@Request() req: any) {
    return this.service.getPartnerProfile(req.user.consultantId);
  }

  @UseGuards(PartnerAuthGuard)
  @Get('partner/leads')
  getPartnerLeads(@Request() req: any) {
    return this.service.getPartnerLeads(req.user.consultantId);
  }

  @UseGuards(PartnerAuthGuard)
  @Post('partner/leads')
  createPartnerLead(@Request() req: any, @Body() body: any) {
    return this.service.createLeadByPartner(req.user.consultantId, body);
  }

  @UseGuards(PartnerAuthGuard)
  @Get('partner/commissions')
  getPartnerCommissions(@Request() req: any) {
    return this.service.getPartnerCommissions(req.user.consultantId);
  }

  // ─── TODAS AS ROTAS ABAIXO EXIGEM JwtAuthGuard ─
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  // ─── GERAR ACESSO PARA CONSULTOR ─────────────
  @UseGuards(JwtAuthGuard)
  @Post('consultants/:id/generate-access')
  generateAccess(@Param('id') id: string) {
    return this.service.generateConsultantAccess(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('consultants/:id/toggle-portal')
  togglePortal(@Param('id') id: string, @Body('isPortalActive') isPortalActive: boolean) {
    return this.service.togglePortalAccess(id, isPortalActive);
  }

  // ─── CONSULTORES ─────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('consultants')
  getConsultants(@Query() q: any) {
    return this.service.getConsultants(q);
  }

  @UseGuards(JwtAuthGuard)
  @Get('consultants/:id')
  getConsultant(@Param('id') id: string) {
    return this.service.getConsultant(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('consultants')
  createConsultant(@Body() body: any) {
    return this.service.createConsultant(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('consultants/:id')
  updateConsultant(@Param('id') id: string, @Body() body: any) {
    return this.service.updateConsultant(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('consultants/:id')
  deleteConsultant(@Param('id') id: string) {
    return this.service.deleteConsultant(id);
  }

  // ─── LEADS ───────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('leads')
  getLeads(@Query() q: any) {
    return this.service.getLeads(q);
  }

  @UseGuards(JwtAuthGuard)
  @Get('leads/:id')
  getLead(@Param('id') id: string) {
    return this.service.getLead(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('leads')
  createLead(@Body() body: any) {
    return this.service.createLead(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('leads/:id')
  updateLead(@Param('id') id: string, @Body() body: any) {
    return this.service.updateLead(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('leads/:id')
  deleteLead(@Param('id') id: string) {
    return this.service.deleteLead(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('leads/:id/link-proposal')
  linkLeadToProposal(
    @Param('id') id: string,
    @Body('proposalId') proposalId: string,
    @Body('proposalVisible') proposalVisible: boolean,
  ) {
    return this.service.linkLeadToProposal(id, proposalId, proposalVisible);
  }

  /** Admin: adicionar proposta ao lead (suporte a múltiplas) */
  @UseGuards(JwtAuthGuard)
  @Post('leads/:id/proposals')
  addLeadProposal(
    @Param('id') id: string,
    @Body('proposalId') proposalId: string,
    @Body('visible') visible: boolean,
    @Body('allowDownload') allowDownload: boolean,
  ) {
    return this.service.addLeadProposal(id, proposalId, visible ?? false, allowDownload ?? false);
  }

  /** Admin: listar propostas vinculadas a um lead */
  @UseGuards(JwtAuthGuard)
  @Get('leads/:id/proposals')
  getLeadProposals(@Param('id') id: string) {
    return this.service.getLeadProposals(id);
  }

  /** Admin: remover proposta vinculada */
  @UseGuards(JwtAuthGuard)
  @Delete('leads/:id/proposals/:proposalId')
  removeLeadProposal(@Param('id') id: string, @Param('proposalId') proposalId: string) {
    return this.service.removeLeadProposal(id, proposalId);
  }

  /** Admin: toggle visibilidade de uma proposta vinculada */
  @UseGuards(JwtAuthGuard)
  @Patch('leads/:id/proposals/:proposalId/visibility')
  toggleLeadProposalVisibility(
    @Param('id') id: string,
    @Param('proposalId') proposalId: string,
    @Body('visible') visible: boolean,
  ) {
    return this.service.toggleLeadProposalVisibility(id, proposalId, visible);
  }

  /** Admin: atualiza visível + permissão de download de uma proposta */
  @UseGuards(JwtAuthGuard)
  @Patch('leads/:id/proposals/:proposalId/access')
  updateLeadProposalAccess(
    @Param('id') id: string,
    @Param('proposalId') proposalId: string,
    @Body('visible') visible: boolean,
    @Body('allowDownload') allowDownload: boolean,
  ) {
    return this.service.updateLeadProposalAccess(id, proposalId, visible ?? false, allowDownload ?? false);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('leads/:id/proposal-visibility')
  toggleProposalVisibility(@Param('id') id: string, @Body('visible') visible: boolean) {
    return this.service.toggleProposalVisibility(id, visible);
  }

  /** Parceiro vê propostas visíveis do seu lead */
  @UseGuards(PartnerAuthGuard)
  @Get('partner/leads/:id/proposal')
  async getPartnerLeadProposal(@Param('id') id: string, @Request() req: any) {
    return this.service.getPartnerLeadProposal(id, req.user.consultantId);
  }

  /** Parceiro vê propostas visíveis do seu lead (nova rota plural) */
  @UseGuards(PartnerAuthGuard)
  @Get('partner/leads/:id/proposals')
  async getPartnerLeadProposals(@Param('id') id: string, @Request() req: any) {
    return this.service.getPartnerLeadProposals(id, req.user.consultantId);
  }

  /** Parceiro obtém dados COMPLETOS de uma proposta vinculada (para visualização) */
  @UseGuards(PartnerAuthGuard)
  @Get('partner/proposals/:proposalId')
  async getPartnerProposal(@Param('proposalId') proposalId: string, @Request() req: any) {
    return this.service.getPartnerProposal(proposalId, req.user.consultantId);
  }

  // ─── COMPROMISSOS ─────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('commitments')
  getCommitments(@Query('consultantId') consultantId?: string) {
    return this.service.getCommitments(consultantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('commitments')
  createCommitment(@Body() body: any) {
    return this.service.createCommitment(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('commitments/:id')
  updateCommitment(@Param('id') id: string, @Body() body: any) {
    return this.service.updateCommitment(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('commitments/:id')
  deleteCommitment(@Param('id') id: string) {
    return this.service.deleteCommitment(id);
  }

  // ─── ACOMPANHAMENTOS ─────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('followups')
  getFollowups(@Query() q: any) {
    return this.service.getFollowups(q);
  }

  @UseGuards(JwtAuthGuard)
  @Post('followups')
  createFollowup(@Body() body: any, @Request() req: any) {
    return this.service.createFollowup({ ...body, createdById: req.user?.id });
  }

  @UseGuards(JwtAuthGuard)
  @Put('followups/:id')
  updateFollowup(@Param('id') id: string, @Body() body: any) {
    return this.service.updateFollowup(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('followups/:id')
  deleteFollowup(@Param('id') id: string) {
    return this.service.deleteFollowup(id);
  }

  // ─── COMISSÕES ───────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('commissions')
  getCommissions(@Query() q: any) {
    return this.service.getCommissions(q);
  }

  @UseGuards(JwtAuthGuard)
  @Post('commissions')
  createCommission(@Body() body: any) {
    return this.service.createCommission(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('commissions/:id')
  updateCommission(@Param('id') id: string, @Body() body: any) {
    return this.service.updateCommission(id, body);
  }

  // ─── CANAL DE DOCUMENTOS DO LEAD ─────────────────────────────────────

  // Lista documentos de um lead (admin)
  @UseGuards(JwtAuthGuard)
  @Get('leads/:id/documents')
  getLeadDocuments(
    @Param('id') leadId: string,
    @Query('consultantId') consultantId?: string,
  ) {
    return this.service.getLeadDocuments(leadId, consultantId);
  }

  // Lista documentos para o parceiro (filtra por visibilidade)
  @UseGuards(PartnerAuthGuard)
  @Get('partner/leads/:id/documents')
  getPartnerLeadDocuments(@Param('id') leadId: string, @Request() req: any) {
    return this.service.getLeadDocuments(leadId, req.user.consultantId);
  }

  // Upload de documento (admin ou time) — Supabase Storage
  @UseGuards(JwtAuthGuard)
  @Post('leads/:id/documents')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadLeadDocument(
    @Param('id') leadId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const storagePath = `lead-documents/${leadId}/${Date.now()}-${file.originalname}`;
    const publicUrl = await this.supabaseStorage.upload(storagePath, file.buffer, file.mimetype);
    return this.service.addLeadDocument(leadId, publicUrl, storagePath, file, {
      docType: body.docType || 'share',
      visibility: body.visibility || 'public',
      targetConsultantId: body.targetConsultantId || null,
      uploadedBy: req.user?.name || req.user?.email || 'Admin',
      uploadedByRole: 'admin',
      description: body.description || null,
    });
  }

  // Upload de documento (parceiro/consultor) — Supabase Storage
  @UseGuards(PartnerAuthGuard)
  @Post('partner/leads/:id/documents')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadPartnerLeadDocument(
    @Param('id') leadId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const storagePath = `lead-documents/${leadId}/${Date.now()}-${file.originalname}`;
    const publicUrl = await this.supabaseStorage.upload(storagePath, file.buffer, file.mimetype);
    return this.service.addLeadDocument(leadId, publicUrl, storagePath, file, {
      docType: 'upload',
      visibility: body.visibility || 'public',
      targetConsultantId: body.targetConsultantId || null,
      uploadedBy: req.user?.name || 'Consultor',
      uploadedByRole: 'consultant',
      description: body.description || null,
    });
  }

  // Alterar visibilidade de documento
  @UseGuards(JwtAuthGuard)
  @Put('leads/documents/:docId/visibility')
  updateDocVisibility(
    @Param('docId') docId: string,
    @Body('visibility') visibility: 'public' | 'private',
    @Body('targetConsultantId') targetConsultantId?: string,
  ) {
    return this.service.updateLeadDocumentVisibility(docId, visibility, targetConsultantId);
  }

  // Editar descrição de documento do lead
  @UseGuards(JwtAuthGuard)
  @Patch('leads/documents/:docId')
  updateLeadDocumentDescription(
    @Param('docId') docId: string,
    @Body('description') description: string,
  ) {
    return this.service.updateLeadDocumentDescription(docId, description);
  }

  // Deletar documento (soft delete)
  @UseGuards(JwtAuthGuard)
  @Delete('leads/documents/:docId')
  deleteLeadDocument(@Param('docId') docId: string) {
    return this.service.deleteLeadDocument(docId);
  }

  // ─── BROADCAST DE DOCUMENTOS ─────────────────────────────────────────

  // Listar documentos gerais (admin — sem filtro de canal)
  @UseGuards(JwtAuthGuard)
  @Get('broadcast-docs')
  getBroadcastDocuments(@Query('channel') channel?: string) {
    return this.service.getBroadcastDocuments(channel);
  }

  // Upload de documento geral (admin)
  @UseGuards(JwtAuthGuard)
  @Post('broadcast-docs')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadBroadcastDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const storagePath = `broadcast-documents/${Date.now()}-${file.originalname}`;
    const publicUrl = await this.supabaseStorage.upload(storagePath, file.buffer, file.mimetype);
    return this.service.addBroadcastDocument(publicUrl, storagePath, file, {
      targetChannel: body.targetChannel || 'all',
      uploadedBy: req.user?.name || req.user?.email || 'Admin',
      description: body.description || null,
    });
  }

  // Editar documento geral (descrição e/ou canal)
  @UseGuards(JwtAuthGuard)
  @Patch('broadcast-docs/:docId')
  updateBroadcastDocument(
    @Param('docId') docId: string,
    @Body() body: { description?: string; targetChannel?: string },
  ) {
    return this.service.updateBroadcastDocument(docId, body);
  }

  // Deletar documento geral (soft delete)
  @UseGuards(JwtAuthGuard)
  @Delete('broadcast-docs/:docId')
  deleteBroadcastDocument(@Param('docId') docId: string) {
    return this.service.deleteBroadcastDocument(docId);
  }

  // Listar todos os documentos do parceiro (broadcast + lead docs) em 3 categorias
  @UseGuards(PartnerAuthGuard)
  @Get('partner/all-documents')
  async getPartnerAllDocuments(@Request() req: any) {
    return this.service.getPartnerAllDocuments(req.user.consultantId);
  }

  // Listar documentos gerais para o parceiro (filtrado pelo accessChannel do consultor)
  @UseGuards(PartnerAuthGuard)
  @Get('partner/broadcast-docs')
  async getPartnerBroadcastDocs(@Request() req: any) {
    const profile = await this.service.getPartnerProfile(req.user.consultantId);
    return this.service.getBroadcastDocuments(profile.accessChannel || 'all');
  }

  // ─── DADOS BANCÁRIOS DO PARCEIRO ─────────────────────────────────────
  @UseGuards(PartnerAuthGuard)
  @Put('partner/bank-info')
  updatePartnerBankInfo(@Request() req: any, @Body() body: any) {
    return this.service.updatePartnerBankInfo(req.user.consultantId, body);
  }

  // ─── COMISSÕES DETALHADAS (parceiro) ─────────────────────────────────
  @UseGuards(PartnerAuthGuard)
  @Get('partner/commissions-detailed')
  getPartnerCommissionsDetailed(@Request() req: any) {
    return this.service.getPartnerCommissionsDetailed(req.user.consultantId);
  }

  // ─── SOLICITAÇÕES DE SAQUE — PARCEIRO ────────────────────────────────

  /** Parceiro solicita saque */
  @UseGuards(PartnerAuthGuard)
  @Post('partner/withdrawal-requests')
  requestWithdrawal(@Request() req: any, @Body() body: any) {
    return this.service.requestWithdrawal(req.user.consultantId, body);
  }

  /** Parceiro lista suas solicitações */
  @UseGuards(PartnerAuthGuard)
  @Get('partner/withdrawal-requests')
  getMyWithdrawalRequests(@Request() req: any) {
    return this.service.getWithdrawalRequestsByConsultant(req.user.consultantId);
  }

  // ─── SOLICITAÇÕES DE SAQUE — ADMIN ───────────────────────────────────

  /** Admin lista todas as solicitações de saque */
  @UseGuards(JwtAuthGuard)
  @Get('withdrawal-requests')
  getAllWithdrawalRequests(@Query('status') status?: string) {
    return this.service.getAllWithdrawalRequests(status);
  }

  /** Admin processa solicitação (aprova/rejeita/paga) — com upload de comprovante opcional */
  @UseGuards(JwtAuthGuard)
  @Put('withdrawal-requests/:id')
  @UseInterceptors(FileInterceptor('receipt', { storage: memoryStorage() }))
  async processWithdrawal(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req: any,
  ) {
    let receiptUrl: string | undefined;
    let receiptFileName: string | undefined;

    // Upload do comprovante se enviado
    if (file) {
      const storagePath = `withdrawal-receipts/${id}/${Date.now()}-${file.originalname}`;
      receiptUrl = await this.supabaseStorage.upload(storagePath, file.buffer, file.mimetype);
      receiptFileName = file.originalname;
    }

    return this.service.processWithdrawal(id, {
      status: body.status,
      adminNotes: body.adminNotes || null,
      receiptUrl,
      receiptFileName,
      processedBy: req.user?.name || req.user?.email || 'Admin',
    });
  }
}

