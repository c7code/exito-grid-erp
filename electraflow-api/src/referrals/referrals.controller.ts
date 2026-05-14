import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly service: ReferralsService) {}

  // ─── DASHBOARD ───────────────────────────────
  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  // ─── CONSULTORES ─────────────────────────────
  @Get('consultants')
  getConsultants(@Query() q: any) {
    return this.service.getConsultants(q);
  }

  @Get('consultants/:id')
  getConsultant(@Param('id') id: string) {
    return this.service.getConsultant(id);
  }

  @Post('consultants')
  createConsultant(@Body() body: any) {
    return this.service.createConsultant(body);
  }

  @Put('consultants/:id')
  updateConsultant(@Param('id') id: string, @Body() body: any) {
    return this.service.updateConsultant(id, body);
  }

  @Delete('consultants/:id')
  deleteConsultant(@Param('id') id: string) {
    return this.service.deleteConsultant(id);
  }

  // ─── LEADS ───────────────────────────────────
  @Get('leads')
  getLeads(@Query() q: any) {
    return this.service.getLeads(q);
  }

  @Get('leads/:id')
  getLead(@Param('id') id: string) {
    return this.service.getLead(id);
  }

  @Post('leads')
  createLead(@Body() body: any) {
    return this.service.createLead(body);
  }

  @Put('leads/:id')
  updateLead(@Param('id') id: string, @Body() body: any) {
    return this.service.updateLead(id, body);
  }

  @Delete('leads/:id')
  deleteLead(@Param('id') id: string) {
    return this.service.deleteLead(id);
  }

  @Post('leads/:id/link-proposal')
  linkLeadToProposal(@Param('id') id: string, @Body('proposalId') proposalId: string) {
    return this.service.linkLeadToProposal(id, proposalId);
  }

  // ─── COMPROMISSOS ─────────────────────────────
  @Get('commitments')
  getCommitments(@Query('consultantId') consultantId?: string) {
    return this.service.getCommitments(consultantId);
  }

  @Post('commitments')
  createCommitment(@Body() body: any) {
    return this.service.createCommitment(body);
  }

  @Put('commitments/:id')
  updateCommitment(@Param('id') id: string, @Body() body: any) {
    return this.service.updateCommitment(id, body);
  }

  @Delete('commitments/:id')
  deleteCommitment(@Param('id') id: string) {
    return this.service.deleteCommitment(id);
  }

  // ─── ACOMPANHAMENTOS ─────────────────────────
  @Get('followups')
  getFollowups(@Query() q: any) {
    return this.service.getFollowups(q);
  }

  @Post('followups')
  createFollowup(@Body() body: any, @Request() req: any) {
    return this.service.createFollowup({ ...body, createdById: req.user?.id });
  }

  @Put('followups/:id')
  updateFollowup(@Param('id') id: string, @Body() body: any) {
    return this.service.updateFollowup(id, body);
  }

  @Delete('followups/:id')
  deleteFollowup(@Param('id') id: string) {
    return this.service.deleteFollowup(id);
  }

  // ─── COMISSÕES ───────────────────────────────
  @Get('commissions')
  getCommissions(@Query() q: any) {
    return this.service.getCommissions(q);
  }

  @Post('commissions')
  createCommission(@Body() body: any) {
    return this.service.createCommission(body);
  }

  @Put('commissions/:id')
  updateCommission(@Param('id') id: string, @Body() body: any) {
    return this.service.updateCommission(id, body);
  }
}
