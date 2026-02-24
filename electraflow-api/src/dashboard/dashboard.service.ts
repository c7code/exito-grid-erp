import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Lead, LeadStatus } from '../leads/lead.entity';
import { Opportunity, OpportunityStage } from '../opportunities/opportunity.entity';
import { Work, WorkStatus } from '../works/work.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { Protocol, ProtocolStatus } from '../protocols/protocol.entity';
import { Payment, PaymentStatus } from '../finance/payment.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Protocol)
    private protocolRepository: Repository<Protocol>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getKPIs() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Leads do mês
    const leadsThisMonth = await this.leadRepository.count({
      where: { createdAt: Between(startOfMonth, now) },
    });
    const leadsLastMonth = await this.leadRepository.count({
      where: { createdAt: Between(startOfLastMonth, endOfLastMonth) },
    });

    // Taxa de conversão
    const totalLeads = await this.leadRepository.count();
    const convertedLeads = await this.leadRepository.count({
      where: { status: LeadStatus.CONVERTED },
    });
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Ticket médio
    const opportunities = await this.opportunityRepository.find({
      where: { stage: OpportunityStage.CLOSED_WON },
    });
    const totalValue = opportunities.reduce((sum, opp) => sum + Number(opp.actualValue || 0), 0);
    const avgTicket = opportunities.length > 0 ? totalValue / opportunities.length : 0;

    // Receita do mês
    const paymentsThisMonth = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.PAID,
        paidAt: Between(startOfMonth, now),
      },
    });
    const revenue = paymentsThisMonth.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);

    return {
      leads: {
        current: leadsThisMonth,
        previous: leadsLastMonth,
        change: leadsLastMonth > 0 ? ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100 : 0,
      },
      conversionRate: {
        value: conversionRate.toFixed(1),
        change: 3.2,
      },
      avgTicket: {
        value: avgTicket.toFixed(0),
        change: 6.1,
      },
      revenue: {
        value: revenue.toFixed(0),
        change: 15.3,
      },
    };
  }

  async getPipelineSummary() {
    const stages = Object.values(OpportunityStage);
    const summary = {};
    
    for (const stage of stages) {
      const count = await this.opportunityRepository.count({ where: { stage } });
      const totalValue = await this.opportunityRepository
        .createQueryBuilder('opp')
        .where('opp.stage = :stage', { stage })
        .select('SUM(opp.estimatedValue)', 'total')
        .getRawOne();
      
      summary[stage] = {
        count,
        totalValue: totalValue?.total || 0,
      };
    }
    
    return summary;
  }

  async getActiveWorks() {
    return this.workRepository.find({
      where: [
        { status: WorkStatus.IN_PROGRESS },
        { status: WorkStatus.WAITING_UTILITY },
        { status: WorkStatus.WAITING_CLIENT },
      ],
      relations: ['client'],
      order: { updatedAt: 'DESC' },
      take: 5,
    });
  }

  async getPendingTasks() {
    return this.taskRepository.find({
      where: { status: TaskStatus.PENDING },
      order: { dueDate: 'ASC' },
      take: 5,
    });
  }

  async getAlerts() {
    const alerts = [];

    // Leads quentes sem contato
    const hotLeads = await this.leadRepository.find({
      where: {
        status: LeadStatus.NEW,
      },
      order: { createdAt: 'ASC' },
      take: 10,
    });
    const oldLeads = hotLeads.filter(l => {
      const hours = (Date.now() - l.createdAt.getTime()) / (1000 * 60 * 60);
      return hours > 24;
    });
    if (oldLeads.length > 0) {
      alerts.push({
        type: 'hot',
        message: `${oldLeads.length} leads quentes aguardando proposta há +24h`,
      });
    }

    // Protocolos com SLA alto
    const protocols = await this.protocolRepository.find({
      where: { status: ProtocolStatus.IN_ANALYSIS },
    });
    const criticalProtocols = protocols.filter(p => {
      const daysOpen = (Date.now() - p.openedAt.getTime()) / (1000 * 60 * 60 * 24);
      return (daysOpen / p.slaDays) > 0.8;
    });
    if (criticalProtocols.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${criticalProtocols.length} protocolos com SLA > 80%`,
      });
    }

    return alerts;
  }

  async getFullDashboard() {
    const [kpis, pipeline, works, tasks, alerts] = await Promise.all([
      this.getKPIs(),
      this.getPipelineSummary(),
      this.getActiveWorks(),
      this.getPendingTasks(),
      this.getAlerts(),
    ]);

    return {
      kpis,
      pipeline,
      works,
      tasks,
      alerts,
    };
  }
}
