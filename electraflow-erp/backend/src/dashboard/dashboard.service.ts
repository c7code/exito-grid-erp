import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work, WorkStatus } from '../works/work.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { Client } from '../clients/client.entity';
import { Opportunity, OpportunityStatus } from '../opportunities/opportunity.entity';
import { Protocol } from '../protocols/protocol.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(Protocol)
    private protocolRepository: Repository<Protocol>,
  ) {}

  async getAdminDashboard() {
    const [
      totalWorks,
      activeWorks,
      completedWorks,
      totalClients,
      totalOpportunities,
      pipelineValue,
      totalRevenue,
      pendingTasks,
      overdueProtocols,
    ] = await Promise.all([
      this.workRepository.count(),
      this.workRepository.count({ where: { status: WorkStatus.IN_PROGRESS } }),
      this.workRepository.count({ where: { status: WorkStatus.COMPLETED } }),
      this.clientRepository.count({ where: { isActive: true } }),
      this.opportunityRepository.count(),
      this.getPipelineValue(),
      this.getTotalRevenue(),
      this.taskRepository.count({ where: { status: TaskStatus.PENDING } }),
      this.getOverdueProtocols(),
    ]);

    const recentWorks = await this.workRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const opportunitiesByStatus = await this.getOpportunitiesByStatus();

    return {
      stats: {
        totalWorks,
        activeWorks,
        completedWorks,
        totalClients,
        totalOpportunities,
        pipelineValue,
        totalRevenue,
        pendingTasks,
        overdueProtocols,
      },
      recentWorks,
      opportunitiesByStatus,
    };
  }

  async getEmployeeDashboard(userId: string) {
    const [myWorks, myTasks, pendingTasks] = await Promise.all([
      this.workRepository.find({
        where: { responsibleId: userId },
        order: { createdAt: 'DESC' },
      }),
      this.taskRepository.find({
        where: { assignedToId: userId },
        order: { dueDate: 'ASC' },
      }),
      this.taskRepository.find({
        where: { assignedToId: userId, status: TaskStatus.PENDING },
        order: { dueDate: 'ASC' },
        take: 5,
      }),
    ]);

    return {
      myWorks,
      myTasks,
      pendingTasks,
    };
  }

  async getClientDashboard(clientId: string) {
    const [myWorks, myDocuments] = await Promise.all([
      this.workRepository.find({
        where: { clientId },
        order: { createdAt: 'DESC' },
      }),
      [], // Documents would be fetched here
    ]);

    const totalInvested = myWorks.reduce((sum, work) => sum + Number(work.totalValue), 0);
    const avgProgress = myWorks.length > 0
      ? myWorks.reduce((sum, work) => sum + work.progress, 0) / myWorks.length
      : 0;

    return {
      myWorks,
      totalInvested,
      avgProgress,
      myDocuments,
    };
  }

  private async getPipelineValue(): Promise<number> {
    const result = await this.opportunityRepository
      .createQueryBuilder('opp')
      .select('SUM(opp.value)', 'total')
      .where('opp.status IN (:...statuses)', {
        statuses: [OpportunityStatus.PROSPECT, OpportunityStatus.PROPOSAL, OpportunityStatus.NEGOTIATION],
      })
      .getRawOne();
    return result?.total || 0;
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.workRepository
      .createQueryBuilder('work')
      .select('SUM(work.totalValue)', 'total')
      .getRawOne();
    return result?.total || 0;
  }

  private async getOverdueProtocols(): Promise<number> {
    return this.protocolRepository.count({
      where: {
        expirationDate: LessThan(new Date()),
      },
    });
  }

  private async getOpportunitiesByStatus() {
    const statuses = Object.values(OpportunityStatus);
    const result = {};
    
    for (const status of statuses) {
      const count = await this.opportunityRepository.count({ where: { status } });
      const value = await this.opportunityRepository
        .createQueryBuilder('opp')
        .select('SUM(opp.value)', 'total')
        .where('opp.status = :status', { status })
        .getRawOne();
      
      result[status] = {
        count,
        value: value?.total || 0,
      };
    }
    
    return result;
  }
}

import { LessThan } from 'typeorm';
