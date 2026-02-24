import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work, WorkStatus } from '../works/work.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { Client } from '../clients/client.entity';
import { DeadlineApproval, ApprovalStatus } from '../deadline-approvals/deadline-approval.entity';
import { Document } from '../documents/document.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(DeadlineApproval)
    private approvalRepository: Repository<DeadlineApproval>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async getAdminDashboard() {
    const [
      worksStats,
      tasksStats,
      clientStats,
      approvalStats,
      recentWorks,
      pendingApprovals,
      overdueTasks,
      monthlyRevenue,
    ] = await Promise.all([
      this.getWorksStats(),
      this.getTasksStats(),
      this.getClientStats(),
      this.getApprovalStats(),
      this.getRecentWorks(),
      this.getPendingApprovals(),
      this.getOverdueTasks(),
      this.getMonthlyRevenue(),
    ]);

    return {
      works: worksStats,
      tasks: tasksStats,
      clients: clientStats,
      approvals: approvalStats,
      recentWorks,
      pendingApprovals,
      overdueTasks,
      monthlyRevenue,
    };
  }

  async getEmployeeDashboard(userId: string) {
    const [
      myWorks,
      myTasks,
      myPendingTasks,
      myApprovals,
    ] = await Promise.all([
      this.getEmployeeWorks(userId),
      this.getEmployeeTasks(userId),
      this.getEmployeePendingTasks(userId),
      this.getEmployeeApprovals(userId),
    ]);

    return {
      myWorks,
      myTasks,
      myPendingTasks,
      myApprovals,
    };
  }

  async getClientDashboard(clientId: string) {
    const [
      myWorks,
      pendingApprovals,
      documents,
    ] = await Promise.all([
      this.getClientWorks(clientId),
      this.getClientPendingApprovals(clientId),
      this.getClientDocuments(clientId),
    ]);

    return {
      myWorks,
      pendingApprovals,
      documents,
    };
  }

  private async getWorksStats() {
    const total = await this.workRepository.count();
    const active = await this.workRepository.count({
      where: { status: WorkStatus.IN_PROGRESS },
    });
    const completed = await this.workRepository.count({
      where: { status: WorkStatus.COMPLETED },
    });
    const pending = await this.workRepository.count({
      where: { status: WorkStatus.PENDING },
    });

    const revenue = await this.workRepository
      .createQueryBuilder('work')
      .select('SUM(work.totalValue)', 'total')
      .getRawOne();

    return {
      total,
      active,
      completed,
      pending,
      revenue: revenue?.total || 0,
    };
  }

  private async getTasksStats() {
    const total = await this.taskRepository.count();
    const pending = await this.taskRepository.count({
      where: { status: TaskStatus.PENDING },
    });
    const inProgress = await this.taskRepository.count({
      where: { status: TaskStatus.IN_PROGRESS },
    });
    const completed = await this.taskRepository.count({
      where: { status: TaskStatus.COMPLETED },
    });

    return {
      total,
      pending,
      inProgress,
      completed,
    };
  }

  private async getClientStats() {
    const total = await this.clientRepository.count({ where: { isActive: true } });
    const withPortal = await this.clientRepository.count({
      where: { hasPortalAccess: true, isActive: true },
    });

    return {
      total,
      withPortal,
    };
  }

  private async getApprovalStats() {
    const pending = await this.approvalRepository.count({
      where: { status: ApprovalStatus.PENDING },
    });
    const approved = await this.approvalRepository.count({
      where: { status: ApprovalStatus.APPROVED },
    });
    const clientPending = await this.approvalRepository.count({
      where: { status: ApprovalStatus.CLIENT_APPROVED },
    });

    return {
      pending,
      approved,
      clientPending,
    };
  }

  private async getRecentWorks() {
    return this.workRepository.find({
      relations: ['client', 'responsible'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private async getPendingApprovals() {
    return this.approvalRepository.find({
      where: { status: ApprovalStatus.PENDING },
      relations: ['task', 'work', 'requestedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private async getOverdueTasks() {
    return this.taskRepository.find({
      where: {
        dueDate: LessThan(new Date()),
        status: Not(TaskStatus.COMPLETED),
      },
      relations: ['work', 'assignedTo'],
      order: { dueDate: 'ASC' },
      take: 5,
    });
  }

  private async getMonthlyRevenue() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const revenue = await this.workRepository
      .createQueryBuilder('work')
      .select('SUM(work.totalValue)', 'total')
      .where('work.createdAt >= :startOfMonth', { startOfMonth })
      .getRawOne();

    return revenue?.total || 0;
  }

  private async getEmployeeWorks(userId: string) {
    return this.workRepository.find({
      where: { responsible: { id: userId } },
      relations: ['client'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private async getEmployeeTasks(userId: string) {
    return this.taskRepository.find({
      where: { assignedTo: { id: userId } },
      relations: ['work'],
      order: { dueDate: 'ASC' },
      take: 5,
    });
  }

  private async getEmployeePendingTasks(userId: string) {
    return this.taskRepository.find({
      where: {
        assignedTo: { id: userId },
        status: TaskStatus.PENDING,
      },
      relations: ['work'],
      order: { dueDate: 'ASC' },
      take: 5,
    });
  }

  private async getEmployeeApprovals(userId: string) {
    return this.approvalRepository.find({
      where: { requestedBy: { id: userId } },
      relations: ['task', 'work'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private async getClientWorks(clientId: string) {
    return this.workRepository.find({
      where: { client: { id: clientId } },
      relations: ['responsible'],
      order: { createdAt: 'DESC' },
    });
  }

  private async getClientPendingApprovals(clientId: string) {
    return this.approvalRepository.find({
      where: {
        status: ApprovalStatus.APPROVED,
        clientId,
      },
      relations: ['task', 'work', 'approvedBy'],
      order: { adminApprovedAt: 'DESC' },
    });
  }

  private async getClientDocuments(clientId: string) {
    return this.documentRepository.find({
      where: {
        work: { client: { id: clientId } },
        isArchived: false,
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
}

import { LessThan, Not } from 'typeorm';
