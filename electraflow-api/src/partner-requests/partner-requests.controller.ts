import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, ForbiddenException,
} from '@nestjs/common';
import { PartnerRequestsService } from './partner-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PartnerAuthGuard } from '../referrals/partner-auth.guard';
import { ReferralsService } from '../referrals/referrals.service';

// ─── Guard helper: valida permissão 'partner-requests' no user admin ─────────
// admin sempre tem acesso; employee precisa ter 'partner-requests' em permissions
function checkAdminPermission(user: any, action: 'view' | 'respond') {
  if (!user) throw new ForbiddenException('Não autenticado');
  if (user.role === 'admin') return; // admin sempre pode tudo
  // Employees e outros roles: precisam da permissão específica
  const perms: string[] = user.permissions || [];
  if (!perms.includes('partner-requests')) {
    throw new ForbiddenException(
      'Sem permissão para o módulo de Requisições. Solicite ao administrador.'
    );
  }
}

@Controller('partner-requests')
export class PartnerRequestsController {
  constructor(
    private readonly service: PartnerRequestsService,
    private readonly referralsService: ReferralsService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // ROTAS DO PARCEIRO (PartnerAuthGuard)
  // ═══════════════════════════════════════════════════════

  /** Parceiro cria nova requisição */
  @UseGuards(PartnerAuthGuard)
  @Post('partner')
  async createRequest(@Request() req: any, @Body() body: any) {
    const profile = await this.referralsService.getPartnerProfile(req.user.consultantId);
    return this.service.createRequest(
      req.user.consultantId,
      profile?.name || req.user.email || 'Parceiro',
      {
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority,
      },
    );
  }

  /** Parceiro lista suas requisições */
  @UseGuards(PartnerAuthGuard)
  @Get('partner')
  getConsultantRequests(@Request() req: any) {
    return this.service.getConsultantRequests(req.user.consultantId);
  }

  /** Parceiro vê detalhes de uma requisição */
  @UseGuards(PartnerAuthGuard)
  @Get('partner/:id')
  getPartnerRequest(@Request() req: any, @Param('id') id: string) {
    return this.service.getRequest(id, req.user.consultantId);
  }

  /** Parceiro adiciona mensagem na thread */
  @UseGuards(PartnerAuthGuard)
  @Post('partner/:id/messages')
  async addPartnerMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    const profile = await this.referralsService.getPartnerProfile(req.user.consultantId);
    return this.service.addMessage(
      id,
      'partner',
      profile?.name || 'Parceiro',
      content,
      req.user.consultantId,
    );
  }

  // ═══════════════════════════════════════════════════════
  // ROTAS DO ADMIN/EMPLOYEE (JwtAuthGuard + permissão)
  // ═══════════════════════════════════════════════════════

  /** Admin/Employee com permissão lista todas as requisições */
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllRequests(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    checkAdminPermission(req.user, 'view');
    return this.service.getAllRequests({ status, category });
  }

  /** Contador de requisições abertas (para badge no menu) */
  @UseGuards(JwtAuthGuard)
  @Get('count/open')
  getOpenCount(@Request() req: any) {
    checkAdminPermission(req.user, 'view');
    return this.service.getOpenCount();
  }

  /** Admin/Employee com permissão vê detalhes */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getRequest(@Request() req: any, @Param('id') id: string) {
    checkAdminPermission(req.user, 'view');
    return this.service.getRequest(id);
  }

  /** Admin/Employee com permissão muda status e atribui responsável */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    checkAdminPermission(req.user, 'respond');
    return this.service.updateStatus(id, status, req.user.id, req.user.name || req.user.email);
  }

  /** Admin/Employee com permissão adiciona mensagem */
  @UseGuards(JwtAuthGuard)
  @Post(':id/messages')
  addAdminMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    checkAdminPermission(req.user, 'respond');
    const senderType = req.user.role === 'admin' ? 'admin' : 'employee';
    return this.service.addMessage(
      id,
      senderType,
      req.user.name || req.user.email || senderType,
      content,
    );
  }

  /** Admin: soft delete */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteRequest(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Apenas administradores podem excluir requisições');
    return this.service.deleteRequest(id);
  }
}
