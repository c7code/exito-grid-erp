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
  BroadcastDocument,
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
    @InjectRepository(BroadcastDocument)
    private broadcastDocRepo: Repository<BroadcastDocument>,
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
        "proposalVisible" BOOLEAN DEFAULT false,
        "clientId" UUID,
        "lostReason" VARCHAR,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )`,
      // Tabela para suporte a múltiplas propostas por lead
      `CREATE TABLE IF NOT EXISTS referral_lead_proposals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "leadId" UUID NOT NULL,
        "proposalId" UUID NOT NULL,
        visible BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("leadId", "proposalId")
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
      // ─ broadcast_documents ─────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS broadcast_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fileName" VARCHAR NOT NULL,
        "originalName" VARCHAR NOT NULL,
        "mimeType" VARCHAR,
        "size" INT,
        "url" VARCHAR NOT NULL,
        "targetChannel" VARCHAR DEFAULT 'all',
        "uploadedBy" VARCHAR,
        "uploadedByRole" VARCHAR DEFAULT 'admin',
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
    const leads = await this.leadRepo.find({
      where: { consultantId, deletedAt: null as any },
      order: { createdAt: 'DESC' },
    });
    if (!leads.length) return leads;

    // Buscar propostas vinculadas para cada lead (tabela referral_lead_proposals)
    const leadIds = leads.map(l => l.id);
    const linkedProposals = await this.dataSource.query(
      `SELECT lp."leadId", lp.id as link_id, lp."proposalId", lp.visible, lp."createdAt" as linked_at,
              p."proposalNumber" as number, p.title, p.status as proposal_status, p.total as "totalValue",
              p."createdAt" as proposal_date,
              COALESCE(c.name, '') as client_name
       FROM referral_lead_proposals lp
       JOIN proposals p ON p.id = lp."proposalId"
       LEFT JOIN clients c ON c.id = p."clientId"
       WHERE lp."leadId" = ANY($1::uuid[])
       ORDER BY lp."createdAt" DESC`,
      [leadIds],
    );

    // Mapear por leadId
    const byLead: Record<string, any[]> = {};
    for (const row of linkedProposals) {
      if (!byLead[row.leadId]) byLead[row.leadId] = [];
      byLead[row.leadId].push({
        linkId: row.link_id,
        proposalId: row.proposalId,
        visible: row.visible,
        number: row.number,
        title: row.title,
        proposalStatus: row.proposal_status,
        totalValue: row.totalValue,
        pdfPath: null, // proposals não possui pdfPath nesta versão
        clientName: row.client_name,
        linkedAt: row.linked_at,
        proposalDate: row.proposal_date,
      });
    }

    return leads.map(l => ({ ...l, linkedProposals: byLead[l.id] || [] }));
  }

  async getPartnerCommissions(consultantId: string) {
    const qb = this.commissionRepo.createQueryBuilder('cm')
      .leftJoinAndSelect('cm.lead', 'l')
      .where('cm."consultantId" = :cid', { cid: consultantId })
      .orderBy('cm."createdAt"', 'DESC');
    return qb.getMany();
  }

  async createLeadByPartner(consultantId: string, data: any) {
    // O portal do parceiro envia name/phone/email — mesmo schema da tabela referral_leads
    const mapped: any = {
      consultantId,
      status: 'new',
      name: data.name || data.clientName,
      phone: data.phone || data.clientPhone,
      email: data.email || data.clientEmail,
      city: data.city,
      state: data.state,
      address: data.address,
      notes: data.notes,
      potentialValue: data.potentialValue,
      services: data.services || [],
      zipCode: data.zipCode,
      neighborhood: data.neighborhood,
    };
    const l = this.leadRepo.create(mapped);
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

  async linkLeadToProposal(id: string, proposalId: string, proposalVisible = false) {
    // Mantém compatibilidade: atualiza proposalId + proposalVisible no lead
    await this.leadRepo
      .createQueryBuilder()
      .update(ReferralLead)
      .set({ proposalId, proposalVisible, status: 'proposal_sent', updatedAt: new Date() } as any)
      .where('id = :id', { id })
      .execute();

    // Insere na tabela de múltiplas propostas (upsert seguro)
    await this.dataSource.query(
      `INSERT INTO referral_lead_proposals ("leadId", "proposalId", visible)
       VALUES ($1, $2, $3)
       ON CONFLICT ("leadId", "proposalId") DO UPDATE SET visible = EXCLUDED.visible`,
      [id, proposalId, proposalVisible],
    );
    return this.getLead(id);
  }

  async addLeadProposal(leadId: string, proposalId: string, visible = false) {
    await this.dataSource.query(
      `INSERT INTO referral_lead_proposals ("leadId", "proposalId", visible)
       VALUES ($1, $2, $3)
       ON CONFLICT ("leadId", "proposalId") DO UPDATE SET visible = EXCLUDED.visible`,
      [leadId, proposalId, visible],
    );
    // Atualiza também o campo legado proposalId (para compatibilidade)
    await this.dataSource.query(
      `UPDATE referral_leads SET "proposalId" = $1, "proposalVisible" = $2, status = 'proposal_sent', "updatedAt" = NOW() WHERE id = $3`,
      [proposalId, visible, leadId],
    );
    return { success: true };
  }

  async removeLeadProposal(leadId: string, proposalId: string) {
    await this.dataSource.query(
      `DELETE FROM referral_lead_proposals WHERE "leadId" = $1 AND "proposalId" = $2`,
      [leadId, proposalId],
    );
    return { success: true };
  }

  async toggleLeadProposalVisibility(leadId: string, proposalId: string, visible: boolean) {
    await this.dataSource.query(
      `UPDATE referral_lead_proposals SET visible = $1 WHERE "leadId" = $2 AND "proposalId" = $3`,
      [visible, leadId, proposalId],
    );
    // Sync campo legado se for a proposta principal
    await this.dataSource.query(
      `UPDATE referral_leads SET "proposalVisible" = $1, "updatedAt" = NOW()
       WHERE id = $2 AND "proposalId" = $3`,
      [visible, leadId, proposalId],
    );
    return { success: true };
  }

  async toggleProposalVisibility(id: string, visible: boolean) {
    await this.leadRepo
      .createQueryBuilder()
      .update(ReferralLead)
      .set({ proposalVisible: visible, updatedAt: new Date() } as any)
      .where('id = :id', { id })
      .execute();
    return this.getLead(id);
  }

  /** Parceiro obtém propostas visíveis vinculadas ao seu lead */
  async getPartnerLeadProposals(leadId: string, consultantId: string) {
    const lead = await this.leadRepo.findOne({
      where: { id: leadId, consultantId, deletedAt: null as any },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const rows = await this.dataSource.query(
      `SELECT lp.id as link_id, lp."proposalId", lp.visible, lp."createdAt" as linked_at,
              p."proposalNumber" as number, p.title, p.status as proposal_status, p.total as "totalValue",
              p."createdAt" as proposal_date,
              COALESCE(c.name, '') as client_name
       FROM referral_lead_proposals lp
       JOIN proposals p ON p.id = lp."proposalId"
       LEFT JOIN clients c ON c.id = p."clientId"
       WHERE lp."leadId" = $1 AND lp.visible = true
       ORDER BY lp."createdAt" DESC`,
      [leadId],
    );

    return rows.map((p: any) => ({
      linkId: p.link_id,
      proposalId: p.proposalId,
      number: p.number,
      title: p.title,
      proposalStatus: p.proposal_status,
      totalValue: p.totalValue,
      pdfPath: null,
      clientName: p.client_name,
      linkedAt: p.linked_at,
      proposalDate: p.proposal_date,
    }));
  }

  /** Retorna TODAS as propostas vinculadas (admin) */
  async getLeadProposals(leadId: string) {
    return this.dataSource.query(
      `SELECT lp.id as link_id, lp."proposalId", lp.visible, lp."createdAt" as linked_at,
              p."proposalNumber" as number, p.title, p.status as proposal_status, p.total as "totalValue",
              COALESCE(c.name, '') as client_name
       FROM referral_lead_proposals lp
       JOIN proposals p ON p.id = lp."proposalId"
       LEFT JOIN clients c ON c.id = p."clientId"
       WHERE lp."leadId" = $1
       ORDER BY lp."createdAt" DESC`,
      [leadId],
    );
  }

  /** Parceiro obtém dados da proposta vinculada ao seu lead (somente se proposalVisible = true) — legado */
  async getPartnerLeadProposal(leadId: string, consultantId: string) {
    const proposals = await this.getPartnerLeadProposals(leadId, consultantId);
    if (!proposals.length) throw new NotFoundException('Nenhuma proposta visível vinculada a este lead');
    return proposals; // Retorna array de propostas
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

  async updateLeadDocumentDescription(docId: string, description: string) {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    await this.docRepo.update(docId, { description });
    return this.docRepo.findOne({ where: { id: docId } });
  }

  // ═══════════════════════════════════════════════
  // BROADCAST DE DOCUMENTOS
  // ═══════════════════════════════════════════════

  async getBroadcastDocuments(channel?: string) {
    const qb = this.broadcastDocRepo
      .createQueryBuilder('b')
      .where('b."deletedAt" IS NULL');

    if (channel && channel !== 'all') {
      // Retorna documentos para o canal específico OU para 'all'
      qb.andWhere('(b."targetChannel" = :ch OR b."targetChannel" = \'all\')', { ch: channel });
    }

    return qb.orderBy('b."createdAt"', 'DESC').getMany();
  }

  async addBroadcastDocument(
    publicUrl: string,
    storagePath: string,
    file: Express.Multer.File,
    meta: {
      targetChannel?: 'all' | 'solar' | 'oem' | 'equipment';
      uploadedBy?: string;
      description?: string;
    },
  ) {
    const doc = this.broadcastDocRepo.create({
      fileName: storagePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: publicUrl,
      targetChannel: meta.targetChannel || 'all',
      uploadedBy: meta.uploadedBy || 'Admin',
      uploadedByRole: 'admin',
      description: meta.description || null,
    });
    return this.broadcastDocRepo.save(doc);
  }

  async deleteBroadcastDocument(docId: string) {
    const doc = await this.broadcastDocRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    await this.broadcastDocRepo.softDelete(docId);
    return { success: true };
  }

  async updateBroadcastDocument(docId: string, data: { description?: string; targetChannel?: string }) {
    const doc = await this.broadcastDocRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    await this.broadcastDocRepo.update(docId, {
      ...(data.description !== undefined && { description: data.description }),
      ...(data.targetChannel !== undefined && { targetChannel: data.targetChannel as any }),
    });
    return this.broadcastDocRepo.findOne({ where: { id: docId } });
  }

  // Retorna TODOS os documentos visíveis ao parceiro em 3 categorias
  async getPartnerAllDocuments(consultantId: string) {
    const consultant = await this.consultantRepo.findOne({ where: { id: consultantId } });
    if (!consultant) throw new NotFoundException('Parceiro não encontrado');

    const channel = consultant.accessChannel || 'all';

    // 1. Documentos broadcast (para todos OU para o canal específico)
    const broadcastDocs = await this.broadcastDocRepo
      .createQueryBuilder('b')
      .where('b."deletedAt" IS NULL')
      .andWhere('(b."targetChannel" = \'all\' OR b."targetChannel" = :ch)', { ch: channel })
      .orderBy('b."createdAt"', 'DESC')
      .getMany();

    // Busca os leads do parceiro
    const leads = await this.leadRepo.find({ where: { consultantId } });
    const leadIds = leads.map(l => l.id);

    // 2. Documentos públicos dos leads do parceiro
    let publicDocs: any[] = [];
    // 3. Documentos privados endereçados a este parceiro
    let privateDocs: any[] = [];

    if (leadIds.length > 0) {
      const allLeadDocs = await this.docRepo
        .createQueryBuilder('d')
        .where('d."leadId" IN (:...ids)', { ids: leadIds })
        .andWhere('d."deletedAt" IS NULL')
        .andWhere('(d.visibility = \'public\' OR d."targetConsultantId" = :cid)', { cid: consultantId })
        .leftJoin(
          'referral_leads', 'l', 'l.id = d."leadId"'
        )
        .addSelect(['l.name'])
        .orderBy('d."createdAt"', 'DESC')
        .getRawAndEntities();

      // Enriquecer com name do lead (campo correto na tabela)
      const rawMap: Record<string, string> = {};
      allLeadDocs.raw.forEach((r: any) => {
        rawMap[r.d_id] = r.l_name || r['l_name'] || '';
      });

      const enriched = allLeadDocs.entities.map(d => ({
        ...d,
        leadClientName: rawMap[d.id] || '',
      }));

      publicDocs = enriched.filter(d => d.visibility === 'public');
      privateDocs = enriched.filter(d => d.visibility === 'private' && d.targetConsultantId === consultantId);
    }


    return {
      broadcast: broadcastDocs,
      publicLeadDocs: publicDocs,
      privateLeadDocs: privateDocs,
      stats: {
        total: broadcastDocs.length + publicDocs.length + privateDocs.length,
        broadcast: broadcastDocs.length,
        public: publicDocs.length,
        exclusive: privateDocs.length,
      },
    };
  }
}

