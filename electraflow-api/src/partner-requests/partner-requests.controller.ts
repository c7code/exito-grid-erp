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
async function uploadFiles(
  files: Express.Multer.File[],
  storage: SupabaseStorageService,
  folder: string,
): Promise<Array<{ url: string; name: string; mimeType: string; size: number }>> {
  if (!files || files.length === 0) return [];
  const results = await Promise.all(
    files.map(async (f) => {
      const path = `${folder}/${Date.now()}-${f.originalname}`;
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
        customCategory: body.customCategory,
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

  /** Parceiro adiciona mensagem com até 5 arquivos */
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
    const attachments = await uploadFiles(files || [], this.supabaseStorage, 'partner-request-attachments');
    return this.service.addMessage(
      id, 'partner',
      profile?.name || 'Parceiro',
      content?.trim() || '',
      req.user.consultantId,
      attachments,
    );
  }

  /** Parceiro soft-deleta sua própria mensagem */
  @UseGuards(PartnerAuthGuard)
  @Delete('partner/messages/:msgId')
  deletePartnerMessage(@Request() req: any, @Param('msgId') msgId: string) {
    return this.service.deleteMessage(msgId, req.user.consultantId, 'partner');
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
    checkAdminPermission(req.user);
    return this.service.getAllRequests({ status, category });
  }

  /** Contador de requisições abertas (para badge no menu) */
  @UseGuards(JwtAuthGuard)
  @Get('count/open')
  getOpenCount(@Request() req: any) {
    checkAdminPermission(req.user);
    return this.service.getOpenCount();
  }

  /** Admin/Employee com permissão vê detalhes */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getRequest(@Request() req: any, @Param('id') id: string) {
    checkAdminPermission(req.user);
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
    checkAdminPermission(req.user);
    return this.service.updateStatus(id, status, req.user.id, req.user.name || req.user.email);
  }

  /** Admin/Employee com permissão adiciona mensagem com até 5 arquivos */
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
    const attachments = await uploadFiles(files || [], this.supabaseStorage, 'partner-request-attachments');
    return this.service.addMessage(
      id, senderType,
      req.user.name || req.user.email || senderType,
      content?.trim() || '',
      undefined,
      attachments,
    );
  }

  /** Admin soft-deleta qualquer mensagem */
  @UseGuards(JwtAuthGuard)
  @Delete('messages/:msgId')
  deleteAdminMessage(@Request() req: any, @Param('msgId') msgId: string) {
    checkAdminPermission(req.user);
    return this.service.deleteMessage(msgId, req.user.id, 'admin');
  }

  /** Admin: soft delete */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteRequest(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Apenas administradores podem excluir requisições');
    return this.service.deleteRequest(id);
  }
}
