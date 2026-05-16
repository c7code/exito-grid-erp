import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, ForbiddenException, UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PartnerRequestsService } from './partner-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PartnerAuthGuard } from '../referrals/partner-auth.guard';
import { ReferralsService } from '../referrals/referrals.service';
import { SupabaseStorageService } from '../documents/supabase-storage.service';

// ─── Guard helper: valida permissão 'partner-requests' no user admin ─────────
function checkAdminPermission(user: any) {
  if (!user) throw new ForbiddenException('Não autenticado');
  if (user.role === 'admin') return;
  const perms: string[] = user.permissions || [];
  if (!perms.includes('partner-requests')) {
    throw new ForbiddenException(
      'Sem permissão para o módulo de Requisições. Solicite ao administrador.'
    );
  }
}

// ─── Helper: upload de múltiplos arquivos para o Supabase ────────────────────
// Usa o bucket 'documentos' (padrão do SupabaseStorageService) com subfolder dedicado
async function uploadFiles(
  files: Express.Multer.File[],
  storage: SupabaseStorageService,
  folder: string,
): Promise<Array<{ url: string; name: string; mimeType: string; size: number }>> {
  if (!files || files.length === 0) return [];
  const results = await Promise.all(
    files.map(async (f) => {
      const safeName = f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${folder}/${Date.now()}-${safeName}`;
      const url = await storage.upload(path, f.buffer, f.mimetype);
      return { url, name: f.originalname, mimeType: f.mimetype, size: f.size };
    })
  );
  return results;
}

@Controller('partner-requests')
export class PartnerRequestsController {
  constructor(
    private readonly service: PartnerRequestsService,
    private readonly referralsService: ReferralsService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️ REGRA CRÍTICA DE ORDEM DAS ROTAS NO NESTJS:
  // Rotas com strings literais (ex: 'count/open', 'messages/:id')
  // SEMPRE antes de rotas com parâmetros genéricos (ex: ':id')
  // para evitar que NestJS capture 'count' ou 'messages' como :id
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── PARCEIRO: listar ────────────────────────────────────────────────────────
  @UseGuards(PartnerAuthGuard)
  @Get('partner')
  getConsultantRequests(@Request() req: any) {
    return this.service.getConsultantRequests(req.user.consultantId);
  }

  // ─── PARCEIRO: criar ─────────────────────────────────────────────────────────
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
        customCategory: body.customCategory,
      },
    );
  }

  // ─── PARCEIRO: adicionar mensagem (com até 5 arquivos) ───────────────────────
  // Rota 'partner/:id/messages' vem ANTES de 'partner/:id' (mais específica)
  @UseGuards(PartnerAuthGuard)
  @Post('partner/:id/messages')
  @UseInterceptors(FilesInterceptor('files', 5, { storage: memoryStorage() }))
  async addPartnerMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!content?.trim() && (!files || files.length === 0)) {
      throw new BadRequestException('Envie uma mensagem ou arquivo');
    }
    const profile = await this.referralsService.getPartnerProfile(req.user.consultantId);
    const attachments = await uploadFiles(files || [], this.supabaseStorage, 'requisicoes-parceiro');
    return this.service.addMessage(
      id, 'partner',
      profile?.name || 'Parceiro',
      content?.trim() || '',
      req.user.consultantId,
      attachments,
    );
  }

  // ─── PARCEIRO: soft-delete da mensagem ───────────────────────────────────────
  // 'partner/messages/:msgId' vem ANTES de 'partner/:id' para não conflitar
  @UseGuards(PartnerAuthGuard)
  @Delete('partner/messages/:msgId')
  deletePartnerMessage(@Request() req: any, @Param('msgId') msgId: string) {
    return this.service.deleteMessage(msgId, req.user.consultantId, 'partner');
  }

  // ─── PARCEIRO: detalhes de uma requisição ────────────────────────────────────
  // Rota genérica 'partner/:id' vem APÓS rotas específicas acima
  @UseGuards(PartnerAuthGuard)
  @Get('partner/:id')
  getPartnerRequest(@Request() req: any, @Param('id') id: string) {
    return this.service.getRequest(id, req.user.consultantId);
  }

  // ─── ADMIN: listar todas ─────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllRequests(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    checkAdminPermission(req.user);
    return this.service.getAllRequests({ status, category });
  }

  // ─── ADMIN: contador de abertas ──────────────────────────────────────────────
  // 'count/open' vem ANTES de ':id' para não ser capturado como :id='count'
  @UseGuards(JwtAuthGuard)
  @Get('count/open')
  getOpenCount(@Request() req: any) {
    checkAdminPermission(req.user);
    return this.service.getOpenCount();
  }

  // ─── ADMIN: soft-delete de mensagem ──────────────────────────────────────────
  // 'messages/:msgId' vem ANTES de ':id' para não ser capturado como :id='messages'
  @UseGuards(JwtAuthGuard)
  @Delete('messages/:msgId')
  deleteAdminMessage(@Request() req: any, @Param('msgId') msgId: string) {
    checkAdminPermission(req.user);
    return this.service.deleteMessage(msgId, req.user.id, 'admin');
  }

  // ─── ADMIN: adicionar mensagem (com até 5 arquivos) ──────────────────────────
  // ':id/messages' vem ANTES de ':id' e ':id/status'
  @UseGuards(JwtAuthGuard)
  @Post(':id/messages')
  @UseInterceptors(FilesInterceptor('files', 5, { storage: memoryStorage() }))
  async addAdminMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    checkAdminPermission(req.user);
    if (!content?.trim() && (!files || files.length === 0)) {
      throw new BadRequestException('Envie uma mensagem ou arquivo');
    }
    const senderType = req.user.role === 'admin' ? 'admin' : 'employee';
    const attachments = await uploadFiles(files || [], this.supabaseStorage, 'requisicoes-parceiro');
    return this.service.addMessage(
      id, senderType,
      req.user.name || req.user.email || senderType,
      content?.trim() || '',
      undefined,
      attachments,
    );
  }

  // ─── ADMIN: atualizar status ──────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    checkAdminPermission(req.user);
    return this.service.updateStatus(id, status, req.user.id, req.user.name || req.user.email);
  }

  // ─── ADMIN: detalhes de uma requisição ───────────────────────────────────────
  // Rota genérica ':id' vem APÓS todas as específicas acima
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getRequest(@Request() req: any, @Param('id') id: string) {
    checkAdminPermission(req.user);
    return this.service.getRequest(id);
  }

  // ─── ADMIN: soft delete da requisição ────────────────────────────────────────
  // Rota genérica ':id' vem APÓS 'messages/:msgId'
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteRequest(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Apenas administradores podem excluir requisições');
    return this.service.deleteRequest(id);
  }
}
