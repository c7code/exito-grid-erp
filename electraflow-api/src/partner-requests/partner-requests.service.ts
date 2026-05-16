import { Injectable, NotFoundException, ForbiddenException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PartnerRequest, PartnerRequestMessage } from './partner-request.entity';

@Injectable()
export class PartnerRequestsService implements OnModuleInit {
  private readonly logger = new Logger(PartnerRequestsService.name);

  constructor(
    @InjectRepository(PartnerRequest)
    private requestRepo: Repository<PartnerRequest>,
    @InjectRepository(PartnerRequestMessage)
    private messageRepo: Repository<PartnerRequestMessage>,
    private dataSource: DataSource,
  ) {}

  // ─── Criação/migração das tabelas ───────────────────────────────────────────
  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS partner_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR DEFAULT 'other',
          "customCategory" VARCHAR,
          status VARCHAR DEFAULT 'open',
          priority VARCHAR DEFAULT 'medium',
          "consultantId" UUID NOT NULL,
          "consultantName" VARCHAR,
          "assignedToId" UUID,
          "assignedToName" VARCHAR,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          "deletedAt" TIMESTAMP
        );
      `);
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS partner_request_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content TEXT DEFAULT '',
          "senderType" VARCHAR DEFAULT 'admin',
          "senderName" VARCHAR,
          "requestId" UUID NOT NULL REFERENCES partner_requests(id) ON DELETE CASCADE,
          "createdAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      // Migrações seguras: ADD COLUMN IF NOT EXISTS
      const safeAlters = [
        `ALTER TABLE partner_request_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb`,
        `ALTER TABLE partner_request_messages ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN DEFAULT false`,
        `ALTER TABLE partner_requests ADD COLUMN IF NOT EXISTS "customCategory" VARCHAR`,
        `ALTER TABLE referral_leads ADD COLUMN IF NOT EXISTS "proposalVisible" BOOLEAN DEFAULT false`,
      ];
      for (const sql of safeAlters) {
        await this.dataSource.query(sql).catch(() => {});
      }
      this.logger.log('partner_requests tables ready (with attachments + isDeleted + customCategory)');
    } catch (err) {
      this.logger.error('Failed to create partner_requests tables', err);
    }
  }

  // ─── Helper: remove mensagens soft-deletadas do resultado ──────────────────
  private filterMessages(req: PartnerRequest) {
    if (req.messages) {
      req.messages = req.messages
        .filter((m: any) => !m.isDeleted)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return req;
  }

  // ─── PARCEIRO: cria requisição ──────────────────────────────────────────────
  async createRequest(
    consultantId: string,
    consultantName: string,
    dto: { title: string; description: string; category?: string; priority?: string; customCategory?: string },
  ) {
    const req = this.requestRepo.create({
      consultantId,
      consultantName,
      title: dto.title,
      description: dto.description,
      category: (dto.category as any) || 'other',
      customCategory: dto.customCategory || null,
      priority: (dto.priority as any) || 'medium',
      status: 'open',
    } as any);
    return this.requestRepo.save(req);
  }

  // ─── PARCEIRO: lista suas requisições ──────────────────────────────────────
  async getConsultantRequests(consultantId: string) {
    const list = await this.requestRepo.find({
      where: { consultantId, deletedAt: null as any },
      order: { createdAt: 'DESC' },
      relations: ['messages'],
    });
    return list.map(r => this.filterMessages(r));
  }

  // ─── PARCEIRO/ADMIN: detalhes + mensagens ──────────────────────────────────
  async getRequest(id: string, consultantId?: string) {
    const req = await this.requestRepo.findOne({
      where: { id, deletedAt: null as any },
      relations: ['messages'],
    });
    if (!req) throw new NotFoundException('Requisição não encontrada');
    if (consultantId && req.consultantId !== consultantId) throw new ForbiddenException('Acesso negado');
    return this.filterMessages(req);
  }

  // ─── ADMIN/EMPLOYEE: lista todas as requisições ────────────────────────────
  async getAllRequests(filters?: { status?: string; category?: string }) {
    const qb = this.requestRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.messages', 'm')
      .where('r."deletedAt" IS NULL')
      .orderBy('r."createdAt"', 'DESC');

    if (filters?.status) qb.andWhere('r.status = :status', { status: filters.status });
    if (filters?.category) qb.andWhere('r.category = :category', { category: filters.category });

    const requests = await qb.getMany();
    return requests.map(r => this.filterMessages(r));
  }

  // ─── ADMIN: atualiza status ─────────────────────────────────────────────────
  async updateStatus(id: string, status: string, assignedToId?: string, assignedToName?: string) {
    const req = await this.requestRepo.findOne({ where: { id, deletedAt: null as any } });
    if (!req) throw new NotFoundException('Requisição não encontrada');
    req.status = status as any;
    if (assignedToId) req.assignedToId = assignedToId;
    if (assignedToName) req.assignedToName = assignedToName;
    return this.requestRepo.save(req);
  }

  // ─── AMBOS: adicionar mensagem na thread ───────────────────────────────────
  async addMessage(
    requestId: string,
    senderType: 'partner' | 'admin' | 'employee',
    senderName: string,
    content: string,
    consultantId?: string,
    attachments?: Array<{ url: string; name: string; mimeType?: string; size?: number }>,
  ) {
    const req = await this.requestRepo.findOne({ where: { id: requestId, deletedAt: null as any } });
    if (!req) throw new NotFoundException('Requisição não encontrada');
    if (consultantId && req.consultantId !== consultantId) throw new ForbiddenException('Acesso negado');

    if ((senderType === 'admin' || senderType === 'employee') && req.status === 'open') {
      req.status = 'in_progress';
      await this.requestRepo.save(req);
    }

    const msg = this.messageRepo.create({
      requestId,
      senderType,
      senderName,
      content: content || '',
      attachments: attachments || [],
      isDeleted: false,
    } as any);
    return this.messageRepo.save(msg);
  }

  // ─── SOFT DELETE de mensagem (desabilitar sem excluir do banco) ─────────────
  async deleteMessage(messageId: string, requestorId: string, requestorType: 'partner' | 'admin') {
    const msg = await this.messageRepo.findOne({ where: { id: messageId } as any });
    if (!msg) throw new NotFoundException('Mensagem não encontrada');
    // Parceiro só pode apagar suas próprias mensagens
    if (requestorType === 'partner') {
      const req = await this.requestRepo.findOne({ where: { id: (msg as any).requestId } });
      if (!req || req.consultantId !== requestorId) throw new ForbiddenException('Acesso negado');
      if ((msg as any).senderType !== 'partner') throw new ForbiddenException('Você só pode remover suas próprias mensagens');
    }
    (msg as any).isDeleted = true;
    return this.messageRepo.save(msg);
  }

  // ─── ADMIN: contador de abertas ─────────────────────────────────────────────
  async getOpenCount() {
    const count = await this.requestRepo.count({ where: { status: 'open', deletedAt: null as any } });
    return { count };
  }

  // ─── ADMIN: soft delete da requisição ──────────────────────────────────────
  async deleteRequest(id: string) {
    const req = await this.requestRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Requisição não encontrada');
    req.deletedAt = new Date();
    return this.requestRepo.save(req);
  }
}
