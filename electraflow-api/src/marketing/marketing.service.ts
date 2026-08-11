import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';
import { MarketingAction } from './marketing-action.entity';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingCampaign)
    private campaignRepo: Repository<MarketingCampaign>,
    @InjectRepository(MarketingAction)
    private actionRepo: Repository<MarketingAction>,
    private dataSource: DataSource,
  ) {}

  // ── Campaigns ──────────────────────────────────────────────────────────────

  async getCampaigns(filters?: { status?: string; channel?: string }) {
    const qb = this.campaignRepo.createQueryBuilder('c')
      .where('c.deletedAt IS NULL')
      .orderBy('c.createdAt', 'DESC');
    if (filters?.status) qb.andWhere('c.status = :status', { status: filters.status });
    if (filters?.channel) qb.andWhere('c.channel = :channel', { channel: filters.channel });
    return qb.getMany();
  }

  async getCampaignById(id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    const actions = await this.actionRepo.find({ where: { campaignId: id }, order: { scheduledDate: 'ASC' } });
    // Leads linked to this campaign via raw SQL
    const leads = await this.dataSource.query(
      `SELECT id, name, email, phone, status, "estimatedValue", "createdAt", source
       FROM leads WHERE "campaignId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
      [id],
    ).catch(() => []);
    return { ...campaign, actions, leads };
  }

  async createCampaign(data: Partial<MarketingCampaign>) {
    const entity = this.campaignRepo.create(data);
    return this.campaignRepo.save(entity);
  }

  async updateCampaign(id: string, data: Partial<MarketingCampaign>) {
    await this.campaignRepo.update(id, data);
    return this.campaignRepo.findOne({ where: { id } });
  }

  async deleteCampaign(id: string) {
    await this.campaignRepo.softDelete(id);
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async getActions(campaignId?: string) {
    const where: any = {};
    if (campaignId) where.campaignId = campaignId;
    return this.actionRepo.find({ where, order: { scheduledDate: 'ASC' } });
  }

  async createAction(data: Partial<MarketingAction>) {
    const entity = this.actionRepo.create(data);
    return this.actionRepo.save(entity);
  }

  async updateAction(id: string, data: Partial<MarketingAction>) {
    await this.actionRepo.update(id, data);
    return this.actionRepo.findOne({ where: { id } });
  }

  async deleteAction(id: string) {
    await this.actionRepo.delete(id);
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────

  async getKpis(campaignId?: string) {
    // Buscar campanhas relevantes
    const campaigns = campaignId
      ? await this.campaignRepo.find({ where: { id: campaignId } })
      : await this.campaignRepo.createQueryBuilder('c').where('c.deletedAt IS NULL').getMany();

    const ids = campaigns.map(c => c.id);
    if (ids.length === 0) return this.emptyKpis();

    // Leads ligados às campanhas
    const leadsRows = await this.dataSource.query(
      `SELECT "campaignId", status, "estimatedValue"
       FROM leads
       WHERE "campaignId" = ANY($1) AND "deletedAt" IS NULL`,
      [ids],
    ).catch(() => []);

    // Oportunidades ligadas aos leads que têm campaignId
    const oppsRows = await this.dataSource.query(
      `SELECT o."actualValue", o.stage, l."campaignId"
       FROM opportunities o
       JOIN leads l ON l."opportunityId" = o.id
       WHERE l."campaignId" = ANY($1) AND o."deletedAt" IS NULL`,
      [ids],
    ).catch(() => []);

    const totalBudget = campaigns.reduce((s, c) => s + Number(c.budget || 0), 0);
    const totalSpent = campaigns.reduce((s, c) => s + Number(c.amountSpent || 0), 0);
    const totalLeads = leadsRows.length;
    const convertedLeads = leadsRows.filter((l: any) => l.status === 'converted').length;
    const revenue = oppsRows
      .filter((o: any) => ['closed_won', 'execution', 'completed'].includes(o.stage))
      .reduce((s: number, o: any) => s + Number(o.actualValue || o.estimatedValue || 0), 0);

    const invested = totalSpent || totalBudget;
    const roi = invested > 0 ? ((revenue - invested) / invested) * 100 : 0;
    const cac = convertedLeads > 0 ? invested / convertedLeads : 0;
    const cpl = totalLeads > 0 ? invested / totalLeads : 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const avgTicket = convertedLeads > 0 ? revenue / convertedLeads : 0;

    // Actions totals
    const actions = ids.length > 0
      ? await this.actionRepo.createQueryBuilder('a')
          .where('a.campaignId = ANY(:ids)', { ids })
          .getMany()
      : [];
    const totalReach = actions.reduce((s, a) => s + Number(a.reach || 0), 0);
    const totalEngagements = actions.reduce((s, a) => s + Number(a.engagements || 0), 0);
    const totalCost = actions.reduce((s, a) => s + Number(a.cost || 0), 0);

    // Monthly investment chart data
    const monthlyData = await this.dataSource.query(
      `SELECT TO_CHAR(c."createdAt", 'YYYY-MM') as month,
              SUM(c."amountSpent") as spent,
              SUM(c.budget) as budget,
              COUNT(DISTINCT l.id) as leads
       FROM marketing_campaigns c
       LEFT JOIN leads l ON l."campaignId" = c.id AND l."deletedAt" IS NULL
       WHERE c."deletedAt" IS NULL
       GROUP BY TO_CHAR(c."createdAt", 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 12`,
    ).catch(() => []);

    // Funil de conversão
    const funnel = {
      reached: totalReach,
      leads: totalLeads,
      qualified: leadsRows.filter((l: any) => ['qualified', 'converted'].includes(l.status)).length,
      converted: convertedLeads,
    };

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalBudget,
      totalSpent,
      totalLeads,
      convertedLeads,
      revenue,
      roi: Math.round(roi * 100) / 100,
      cac: Math.round(cac * 100) / 100,
      cpl: Math.round(cpl * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgTicket: Math.round(avgTicket * 100) / 100,
      totalReach,
      totalEngagements,
      totalCost,
      totalActions: actions.length,
      monthlyData,
      funnel,
      campaigns: campaigns.map(c => ({
        id: c.id, name: c.name, status: c.status, channel: c.channel,
        budget: c.budget, amountSpent: c.amountSpent,
        leadsCount: leadsRows.filter((l: any) => l.campaignId === c.id).length,
      })),
    };
  }

  private emptyKpis() {
    return {
      totalCampaigns: 0, activeCampaigns: 0,
      totalBudget: 0, totalSpent: 0,
      totalLeads: 0, convertedLeads: 0,
      revenue: 0, roi: 0, cac: 0, cpl: 0,
      conversionRate: 0, avgTicket: 0,
      totalReach: 0, totalEngagements: 0,
      totalCost: 0, totalActions: 0,
      monthlyData: [], funnel: { reached: 0, leads: 0, qualified: 0, converted: 0 },
      campaigns: [],
    };
  }
}
