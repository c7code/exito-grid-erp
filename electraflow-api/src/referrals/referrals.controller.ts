import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
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
  linkLeadToProposal(@Param('id') id: string, @Body('proposalId') proposalId: string) {
    return this.service.linkLeadToProposal(id, proposalId);
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

  // Deletar documento
  @UseGuards(JwtAuthGuard)
  @Delete('leads/documents/:docId')
  deleteLeadDocument(@Param('docId') docId: string) {
    return this.service.deleteLeadDocument(docId);
  }
}
