import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PartnerAuthGuard } from './partner-auth.guard';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly service: ReferralsService) {}

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
}
