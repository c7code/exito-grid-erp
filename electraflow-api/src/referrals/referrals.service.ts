import { Injectable, NotFoundException, UnauthorizedException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  ReferralConsultant,
  ReferralLead,
  ReferralCommitment,
  ReferralFollowup,
  ReferralCommission,
  LeadDocument,
} from './referral.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ReferralsService implements OnModuleInit {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    @InjectRepository(ReferralConsultant)
    private consultantRepo: Repository<ReferralConsultant>,
    @InjectRepository(ReferralLead)
    private leadRepo: Repository<ReferralLead>,
    @InjectRepository(ReferralCommitment)
    private commitmentRepo: Repository<ReferralCommitment>,
    @InjectRepository(ReferralFollowup)
    private followupRepo: Repository<ReferralFollowup>,
    @InjectRepository(ReferralCommission)
    private commissionRepo: Repository<ReferralCommission>,
    @InjectRepository(LeadDocument)
    private docRepo: Repository<LeadDocument>,
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS referral_consultants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        email VARCHAR,
        phone VARCHAR,
        whatsapp VARCHAR,
        document VARCHAR,
        status VARCHAR DEFAULT 'active',
        "zipCode" VARCHAR,
        street VARCHAR,
        city VARCHAR,
        state VARCHAR,
        region VARCHAR,
        "responsibleUserId" UUID,
        "weeklyGoal" INT DEFAULT 0,
        "monthlyGoal" INT DEFAULT 0,
        "commissionPercent" NUMERIC(5,2) DEFAULT 2.00,
        "accessChannel" VARCHAR DEFAULT 'all',
        "bankName" VARCHAR,
        "pixKey" VARCHAR,
        notes TEXT,
        "passwordHash" VARCHAR,
        "isPortalActive" BOOLEAN DEFAULT false,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS referral_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        phone VARCHAR,
        email VARCHAR,
        document VARCHAR,
        city VARCHAR,
        state VARCHAR,
        address VARCHAR,
        "consultantId" UUID,
        status VARCHAR DEFAULT 'new',
        "potentialKwp" NUMERIC(10,2),
        "potentialValue" NUMERIC(15,2),
        "proposalId" UUID,
        "clientId" UUID,
        "lostReason" VARCHAR,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS referral_commitments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "consultantId" UUID,
        type VARCHAR DEFAULT 'monthly',
        "targetCount" INT DEFAULT 0,
        "periodStart" TIMESTAMP,
        "periodEnd" TIMESTAMP,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS referral_followups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "consultantId" UUID,
        "leadId" UUID,
        type VARCHAR DEFAULT 'internal_note',
        description TEXT NOT NULL,
        outcome TEXT,
        "nextActionDate" TIMESTAMP,
        "nextActionDescription" VARCHAR,
        "createdById" UUID,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS referral_commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "consultantId" UUID,
        "leadId" UUID,
        "proposalId" UUID,
        "saleValue" NUMERIC(15,2),
        "commissionPercent" NUMERIC(5,2),
        "commissionValue" NUMERIC(15,2),
        status VARCHAR DEFAULT 'pending',
        "paidAt" TIMESTAMP,
        "paidBy" VARCHAR,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )`,
      // ─ lead_documents ───────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS lead_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "leadId" UUID NOT NULL,
        "fileName" VARCHAR NOT NULL,
        "originalName" VARCHAR NOT NULL,
        "mimeType" VARCHAR,
        "size" INT,
        "url" VARCHAR NOT NULL,
        "docType" VARCHAR DEFAULT 'upload',
        "visibility" VARCHAR DEFAULT 'public',
        "targetConsultantId" UUID,
        "uploadedBy" VARCHAR,
        "uploadedByRole" VARCHAR DEFAULT 'consultant',
        "description" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )`,
    ];

    for (const sql of tables) {
      try {
        await this.dataSource.query(sql);
      } catch (err) {
        this.logger.warn('Referrals table init: ' + err?.message);
      }
    }

    // Migrations — add new columns if not exist
    const alterations = [
      `ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS whatsapp VARCHAR`,
      `ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS "zipCode" VARCHAR`,
      `ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS street VARCHAR`,
      `ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS "bankName" VARCHAR`,
      `ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS "pixKey" VARCHAR`,
      `ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS "accessChannel" VARCHAR DEFAULT 'all'`,
      `ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR`,
      `ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS "isPortalActive" BOOLEAN DEFAULT false`,
      `ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP`,
      // Novos campos de lead
      `ALTER TABLE referral_leads ADD COLUMN IF NOT EXISTS "services" JSONB DEFAULT '[]'`,
      `ALTER TABLE referral_leads ADD COLUMN IF NOT EXISTS "zipCode" VARCHAR`,
      `ALTER TABLE referral_leads ADD COLUMN IF NOT EXISTS "neighborhood" VARCHAR`,
    ];

    for (const sql of alterations) {
      try {
        await this.dataSource.query(sql);
      } catch (err) {
        this.logger.warn('Referrals migration: ' + err?.message);
      }
    }

    this.logger.log('Referrals tables and migrations ensured');
  }

  // ═══════════════════════════════════════════════
  // PORTAL DO PARCEIRO — AUTH
  // ═══════════════════════════════════════════════

  async partnerLogin(email: string, password: string) {
    // Busca incluindo passwordHash (campo select: false)
    const consultant = await this.dataSource.query(
      `SELECT * FROM referral_consultants WHERE email = $1 AND "deletedAt" IS NULL LIMIT 1`,
      [email],
    );

    if (!consultant || consultant.length === 0) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const c = consultant[0];

    if (!c.isPortalActive) {
      throw new UnauthorizedException('Acesso ao portal não habilitado. Contate o administrador.');
    }

    if (!c.passwordHash) {
      throw new UnauthorizedException('Senha não configurada. Solicite acesso ao administrador.');
    }

    const valid = await bcrypt.compare(password, c.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Atualiza lastLoginAt
    await this.dataSource.query(
      `UPDATE referral_consultants SET "lastLoginAt" = NOW() WHERE id = $1`,
      [c.id],
    );

    const payload = {
      sub: c.id,
      email: c.email,
      role: 'partner',
      consultantId: c.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      consultant: {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        whatsapp: c.whatsapp,
        commissionPercent: c.commissionPercent,
        accessChannel: c.accessChannel,
        status: c.status,
      },
    };
  }

  async getPartnerProfile(consultantId: string) {
    const rows = await this.dataSource.query(
      `SELECT id, name, email, phone, whatsapp, document, city, state, region,
              "accessChannel", "commissionPercent", "bankName", "pixKey",
              "isPortalActive", "lastLoginAt", "createdAt"
       FROM referral_consultants WHERE id = $1 AND "deletedAt" IS NULL LIMIT 1`,
      [consultantId],
    );
    if (!rows || rows.length === 0) throw new NotFoundException('Consultor não encontrado');
    return rows[0];
  }

  async getPartnerLeads(consultantId: string) {
    return this.leadRepo.find({
      where: { consultantId, deletedAt: null as any },
      order: { createdAt: 'DESC' },
    });
  }

  async getPartnerCommissions(consultantId: string) {
    const qb = this.commissionRepo.createQueryBuilder('cm')
      .leftJoinAndSelect('cm.lead', 'l')
      .where('cm."consultantId" = :cid', { cid: consultantId })
      .orderBy('cm."createdAt"', 'DESC');
    return qb.getMany();
  }

  async createLeadByPartner(consultantId: string, data: Partial<ReferralLead>) {
    const l = this.leadRepo.create({ ...data, consultantId });
    return this.leadRepo.save(l);
  }

  async generateConsultantAccess(consultantId: string) {
    const consultant = await this.consultantRepo.findOne({ where: { id: consultantId } });
    if (!consultant) throw new NotFoundException('Consultor não encontrado');

    // Gera senha: Solar@ + 6 chars aleatórios
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const plainPassword = `Solar@${randomPart}`;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await this.dataSource.query(
      `UPDATE referral_consultants SET "passwordHash" = $1, "isPortalActive" = true, "updatedAt" = NOW() WHERE id = $2`,
      [passwordHash, consultantId],
    );

    return {
      email: consultant.email,
      password: plainPassword,
      message: 'Acesso gerado com sucesso. Guarde esta senha — ela não será exibida novamente.',
    };
  }

  // ═══════════════════════════════════════════════
  // CONSULTORES
  // ═══════════════════════════════════════════════

  async getConsultants(filters?: { status?: string; search?: string }) {
    const qb = this.consultantRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.leads', 'leads', 'leads."deletedAt" IS NULL')
      .where('c."deletedAt" IS NULL');

    if (filters?.status) {
      qb.andWhere('c.status = :status', { status: filters.status });
    }
    if (filters?.search) {
      qb.andWhere('(c.name ILIKE :q OR c.email ILIKE :q OR c.phone ILIKE :q)', {
        q: `%${filters.search}%`,
      });
    }
    return qb.orderBy('c."createdAt"', 'DESC').getMany();
  }

  async getConsultant(id: string) {
    const c = await this.consultantRepo.findOne({
      where: { id },
      relations: ['leads', 'commitments', 'followups', 'commissions'],
    });
    if (!c) throw new NotFoundException('Consultor não encontrado');
    return c;
  }

  async createConsultant(data: Partial<ReferralConsultant>) {
    const c = this.consultantRepo.create(data);
    return this.consultantRepo.save(c);
  }

  async updateConsultant(id: string, data: Partial<ReferralConsultant>) {
    await this.consultantRepo
      .createQueryBuilder()
      .update(ReferralConsultant)
      .set({ ...data, updatedAt: new Date() } as any)
      .where('id = :id', { id })
      .execute();
    return this.getConsultant(id);
  }

  async deleteConsultant(id: string) {
    await this.consultantRepo
      .createQueryBuilder()
      .update(ReferralConsultant)
      .set({ deletedAt: new Date() } as any)
      .where('id = :id', { id })
      .execute();
  }

  async togglePortalAccess(consultantId: string, isPortalActive: boolean) {
    await this.dataSource.query(
      `UPDATE referral_consultants SET "isPortalActive" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [isPortalActive, consultantId],
    );
    return this.getConsultant(consultantId);
  }

  // ═══════════════════════════════════════════════
  // LEADS
  // ═══════════════════════════════════════════════

  async getLeads(filters?: { consultantId?: string; status?: string; search?: string; startDate?: string; endDate?: string }) {
    const qb = this.leadRepo.createQueryBuilder('l')
      .leftJoinAndSelect('l.consultant', 'c')
      .where('l."deletedAt" IS NULL');

    if (filters?.consultantId) {
      qb.andWhere('l."consultantId" = :cid', { cid: filters.consultantId });
    }
    if (filters?.status) {
      qb.andWhere('l.status = :status', { status: filters.status });
    }
    if (filters?.search) {
      qb.andWhere('(l.name ILIKE :q OR l.email ILIKE :q OR l.phone ILIKE :q OR l.city ILIKE :q)', {
        q: `%${filters.search}%`,
      });
    }
    if (filters?.startDate) {
      qb.andWhere('l."createdAt" >= :start', { start: filters.startDate });
    }
    if (filters?.endDate) {
      qb.andWhere('l."createdAt" <= :end', { end: filters.endDate });
    }
    return qb.orderBy('l."createdAt"', 'DESC').getMany();
  }

  async getLead(id: string) {
    const l = await this.leadRepo.findOne({
      where: { id },
      relations: ['consultant', 'followups', 'commissions'],
    });
    if (!l) throw new NotFoundException('Lead não encontrado');
    return l;
  }

  async createLead(data: Partial<ReferralLead>) {
    const l = this.leadRepo.create(data);
    return this.leadRepo.save(l);
  }

  async updateLead(id: string, data: Partial<ReferralLead>) {
    const leadBefore = await this.getLead(id);

    await this.leadRepo
      .createQueryBuilder()
      .update(ReferralLead)
      .set({ ...data, updatedAt: new Date() } as any)
      .where('id = :id', { id })
      .execute();

    // ─── Auto-comissão ao fechar lead como ganho ──────────────────────────
    if ((data.status as string) === 'closed_won' && (leadBefore?.status as string) !== 'closed_won') {
      try {
        const consultant = await this.consultantRepo.findOne({ where: { id: leadBefore.consultantId } });
        if (consultant && leadBefore.proposalId) {
          const proposalRows = await this.dataSource.query(
            `SELECT "totalValue" FROM proposals WHERE id = $1 LIMIT 1`,
            [leadBefore.proposalId],
          );
          const proposalValue = proposalRows?.[0]?.totalValue ? Number(proposalRows[0].totalValue) : 0;
          const commissionPercent = Number(consultant.commissionPercent || 0);
          const commissionValue = proposalValue > 0 ? (proposalValue * commissionPercent) / 100 : 0;
          const existing = await this.commissionRepo.findOne({ where: { leadId: id } as any });
          if (!existing) {
            const commission = this.commissionRepo.create({
              consultantId: consultant.id,
              leadId: id,
              proposalId: leadBefore.proposalId,
              commissionPercent,
              commissionValue,
              status: 'pending',
              notes: `Gerada automaticamente ao fechar lead ${leadBefore.name}`,
            } as any);
            await this.commissionRepo.save(commission);
          }
        }
      } catch (e) {
        console.error('[Referrals] Erro ao auto-gerar comissão:', e.message);
      }
    }

    return this.getLead(id);
  }

  async deleteLead(id: string) {
    await this.leadRepo
      .createQueryBuilder()
      .update(ReferralLead)
      .set({ deletedAt: new Date() } as any)
      .where('id = :id', { id })
      .execute();
  }

  async linkLeadToProposal(id: string, proposalId: string) {
    await this.leadRepo
      .createQueryBuilder()
      .update(ReferralLead)
      .set({ proposalId, status: 'proposal_sent', updatedAt: new Date() } as any)
      .where('id = :id', { id })
      .execute();
    return this.getLead(id);
  }

  // ═══════════════════════════════════════════════
  // COMPROMISSOS
  // ═══════════════════════════════════════════════

  async getCommitments(consultantId?: string) {
    const where: any = {};
    if (consultantId) where.consultantId = consultantId;
    return this.commitmentRepo.find({
      where,
      relations: ['consultant'],
      order: { createdAt: 'DESC' },
    });
  }

  async createCommitment(data: Partial<ReferralCommitment>) {
    const c = this.commitmentRepo.create(data);
    return this.commitmentRepo.save(c);
  }

  async updateCommitment(id: string, data: Partial<ReferralCommitment>) {
    await this.commitmentRepo.update(id, data as any);
    return this.commitmentRepo.findOne({ where: { id }, relations: ['consultant'] });
  }

  async deleteCommitment(id: string) {
    await this.commitmentRepo.delete(id);
  }

  // ═══════════════════════════════════════════════
  // ACOMPANHAMENTOS
  // ═══════════════════════════════════════════════

  async getFollowups(filters?: { consultantId?: string; leadId?: string }) {
    const qb = this.followupRepo.createQueryBuilder('f')
      .leftJoinAndSelect('f.consultant', 'c')
      .leftJoinAndSelect('f.lead', 'l');

    if (filters?.consultantId) {
      qb.andWhere('f."consultantId" = :cid', { cid: filters.consultantId });
    }
    if (filters?.leadId) {
      qb.andWhere('f."leadId" = :lid', { lid: filters.leadId });
    }
    return qb.orderBy('f."createdAt"', 'DESC').getMany();
  }

  async createFollowup(data: Partial<ReferralFollowup>) {
    const f = this.followupRepo.create(data);
    return this.followupRepo.save(f);
  }

  async updateFollowup(id: string, data: Partial<ReferralFollowup>) {
    await this.followupRepo.update(id, data as any);
    return this.followupRepo.findOne({ where: { id } });
  }

  async deleteFollowup(id: string) {
    await this.followupRepo.delete(id);
  }

  // ═══════════════════════════════════════════════
  // COMISSÕES
  // ═══════════════════════════════════════════════

  async getCommissions(filters?: { consultantId?: string; status?: string }) {
    const qb = this.commissionRepo.createQueryBuilder('cm')
      .leftJoinAndSelect('cm.consultant', 'c')
      .leftJoinAndSelect('cm.lead', 'l');

    if (filters?.consultantId) {
      qb.andWhere('cm."consultantId" = :cid', { cid: filters.consultantId });
    }
    if (filters?.status) {
      qb.andWhere('cm.status = :status', { status: filters.status });
    }
    return qb.orderBy('cm."createdAt"', 'DESC').getMany();
  }

  async createCommission(data: Partial<ReferralCommission>) {
    const d = { ...data } as any;
    if (d.saleValue && d.commissionPercent && !d.commissionValue) {
      d.commissionValue = Number(d.saleValue) * Number(d.commissionPercent) / 100;
    }
    const c = this.commissionRepo.create(d);
    return this.commissionRepo.save(c);
  }

  async updateCommission(id: string, data: Partial<ReferralCommission>) {
    const d = { ...data } as any;
    if (d.status === 'paid' && !d.paidAt) {
      d.paidAt = new Date();
    }
    await this.commissionRepo.update(id, d);
    return this.commissionRepo.findOne({ where: { id }, relations: ['consultant', 'lead'] });
  }

  // ═══════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalConsultants,
      activeConsultants,
      trainingConsultants,
      idleConsultants,
      leadsThisMonth,
      proposalsSent,
      closedWon,
      closedLost,
      pendingCommissions,
      paidCommissions,
    ] = await Promise.all([
      this.consultantRepo.count({ where: { deletedAt: null as any } }),
      this.consultantRepo.count({ where: { status: 'active', deletedAt: null as any } }),
      this.consultantRepo.count({ where: { status: 'training', deletedAt: null as any } }),
      this.consultantRepo.count({ where: { status: 'idle', deletedAt: null as any } }),
      this.dataSource.query(
        `SELECT COUNT(*) as cnt FROM referral_leads WHERE "createdAt" >= $1 AND "createdAt" <= $2 AND "deletedAt" IS NULL`,
        [startOfMonth, endOfMonth],
      ),
      this.leadRepo.count({ where: { status: 'proposal_sent', deletedAt: null as any } }),
      this.leadRepo.count({ where: { status: 'closed_won', deletedAt: null as any } }),
      this.leadRepo.count({ where: { status: 'closed_lost', deletedAt: null as any } }),
      this.dataSource.query(
        `SELECT COALESCE(SUM("commissionValue"), 0) as total FROM referral_commissions WHERE status = 'pending'`,
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM("commissionValue"), 0) as total FROM referral_commissions WHERE status = 'paid'`,
      ),
    ]);

    // Leads por consultor (top 10)
    const leadsByConsultant = await this.dataSource.query(`
      SELECT c.id, c.name, COUNT(l.id)::int as total,
             SUM(CASE WHEN l.status = 'closed_won' THEN 1 ELSE 0 END)::int as won
      FROM referral_consultants c
      LEFT JOIN referral_leads l ON l."consultantId" = c.id AND l."deletedAt" IS NULL
      WHERE c."deletedAt" IS NULL
      GROUP BY c.id, c.name
      ORDER BY total DESC
      LIMIT 10
    `);

    // Leads por mês (últimos 6 meses)
    const leadsByMonth = await this.dataSource.query(`
      SELECT TO_CHAR("createdAt", 'YYYY-MM') as month,
             COUNT(*)::int as total
      FROM referral_leads
      WHERE "deletedAt" IS NULL
        AND "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `);

    // Consultores abaixo da meta mensal
    const belowGoal = await this.dataSource.query(`
      SELECT c.id, c.name, c."monthlyGoal",
             COUNT(l.id)::int as leadsThisMonth
      FROM referral_consultants c
      LEFT JOIN referral_leads l
        ON l."consultantId" = c.id
        AND l."createdAt" >= $1 AND l."createdAt" <= $2
        AND l."deletedAt" IS NULL
      WHERE c."deletedAt" IS NULL AND c.status = 'active' AND c."monthlyGoal" > 0
      GROUP BY c.id, c.name, c."monthlyGoal"
      HAVING COUNT(l.id) < c."monthlyGoal"
      ORDER BY c.name
    `, [startOfMonth, endOfMonth]);

    const totalLeads = closedWon + closedLost;
    const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

    return {
      totalConsultants,
      activeConsultants,
      trainingConsultants,
      idleConsultants,
      leadsThisMonth: Number(leadsThisMonth[0]?.cnt || 0),
      proposalsSent,
      closedWon,
      closedLost,
      conversionRate,
      pendingCommissions: Number(pendingCommissions[0]?.total || 0),
      paidCommissions: Number(paidCommissions[0]?.total || 0),
      leadsByConsultant,
      leadsByMonth,
      belowGoal,
    };
  }

  // ═══════════════════════════════════════════════
  // CANAL DE DOCUMENTOS DO LEAD
  // ═══════════════════════════════════════════════

  async getLeadDocuments(leadId: string, consultantId?: string) {
    const qb = this.docRepo
      .createQueryBuilder('d')
      .where('d."leadId" = :leadId', { leadId })
      .andWhere('d."deletedAt" IS NULL');

    // Se há consultantId válido, mostra públicos + os privados dirigidos a ele
    // Caso contrário (admin sem filtro), mostra todos os documentos do lead
    if (consultantId) {
      qb.andWhere(
        '(d.visibility = :pub OR d."targetConsultantId" = :cid)',
        { pub: 'public', cid: consultantId },
      );
    }

    return qb.orderBy('d."createdAt"', 'DESC').getMany();
  }

  async addLeadDocument(
    leadId: string,
    publicUrl: string,
    storagePath: string,
    file: Express.Multer.File,
    meta: {
      docType?: 'upload' | 'share';
      visibility?: 'public' | 'private';
      targetConsultantId?: string;
      uploadedBy?: string;
      uploadedByRole?: 'consultant' | 'admin' | 'team';
      description?: string;
    },
  ) {
    const lead = await this.leadRepo.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const doc = this.docRepo.create({
      leadId,
      fileName: storagePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: publicUrl,
      docType: meta.docType || 'upload',
      visibility: meta.visibility || 'public',
      targetConsultantId: meta.targetConsultantId || null,
      uploadedBy: meta.uploadedBy || 'Sistema',
      uploadedByRole: meta.uploadedByRole || 'consultant',
      description: meta.description || null,
    });

    return this.docRepo.save(doc);
  }

  async deleteLeadDocument(docId: string) {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    await this.docRepo.softDelete(docId);
    return { success: true };
  }

  async updateLeadDocumentVisibility(docId: string, visibility: 'public' | 'private', targetConsultantId?: string) {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    await this.docRepo.update(docId, {
      visibility,
      targetConsultantId: targetConsultantId || null,
    } as any);
    return this.docRepo.findOne({ where: { id: docId } });
  }
}

