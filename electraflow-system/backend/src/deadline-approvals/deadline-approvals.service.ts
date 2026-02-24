import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeadlineApproval, ApprovalStatus, ApprovalType } from './deadline-approval.entity';
import { TasksService } from '../tasks/tasks.service';
import { WorksService } from '../works/works.service';

export interface CreateDeadlineApprovalDto {
  type: ApprovalType;
  taskId?: string;
  workId?: string;
  proposedStartDate?: Date;
  proposedEndDate?: Date;
  proposedDeadlineDays?: number;
  justification?: string;
  requestedById: string;
}

export interface AdminApprovalDto {
  status: ApprovalStatus.APPROVED | ApprovalStatus.REJECTED;
  adminNotes?: string;
}

export interface ClientApprovalDto {
  approved: boolean;
  clientNotes?: string;
}

@Injectable()
export class DeadlineApprovalsService {
  constructor(
    @InjectRepository(DeadlineApproval)
    private deadlineApprovalRepository: Repository<DeadlineApproval>,
    private tasksService: TasksService,
    private worksService: WorksService,
  ) {}

  async findAll(): Promise<DeadlineApproval[]> {
    return this.deadlineApprovalRepository.find({
      relations: ['task', 'work', 'requestedBy', 'approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<DeadlineApproval> {
    const approval = await this.deadlineApprovalRepository.findOne({
      where: { id },
      relations: ['task', 'work', 'requestedBy', 'approvedBy'],
    });
    if (!approval) {
      throw new NotFoundException('Solicitação de aprovação não encontrada');
    }
    return approval;
  }

  async findPendingForAdmin(): Promise<DeadlineApproval[]> {
    return this.deadlineApprovalRepository.find({
      where: { status: ApprovalStatus.PENDING },
      relations: ['task', 'work', 'requestedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingForClient(clientId: string): Promise<DeadlineApproval[]> {
    return this.deadlineApprovalRepository.find({
      where: { 
        status: ApprovalStatus.APPROVED,
        clientId,
      },
      relations: ['task', 'work', 'requestedBy', 'approvedBy'],
      order: { adminApprovedAt: 'DESC' },
    });
  }

  async findByTask(taskId: string): Promise<DeadlineApproval[]> {
    return this.deadlineApprovalRepository.find({
      where: { task: { id: taskId } },
      relations: ['requestedBy', 'approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByWork(workId: string): Promise<DeadlineApproval[]> {
    return this.deadlineApprovalRepository.find({
      where: { work: { id: workId } },
      relations: ['requestedBy', 'approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRequester(userId: string): Promise<DeadlineApproval[]> {
    return this.deadlineApprovalRepository.find({
      where: { requestedBy: { id: userId } },
      relations: ['task', 'work', 'approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateDeadlineApprovalDto): Promise<DeadlineApproval> {
    if (createDto.taskId) {
      const task = await this.tasksService.findById(createDto.taskId);
      if (!task) {
        throw new NotFoundException('Tarefa não encontrada');
      }
    }

    if (createDto.workId) {
      const work = await this.worksService.findById(createDto.workId);
      if (!work) {
        throw new NotFoundException('Obra não encontrada');
      }
    }

    const approval = this.deadlineApprovalRepository.create({
      ...createDto,
      status: ApprovalStatus.PENDING,
    });

    return this.deadlineApprovalRepository.save(approval);
  }

  async adminApprove(id: string, adminId: string, approvalDto: AdminApprovalDto): Promise<DeadlineApproval> {
    const approval = await this.findById(id);

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Esta solicitação já foi processada');
    }

    await this.deadlineApprovalRepository.update(id, {
      status: approvalDto.status,
      approvedBy: { id: adminId } as any,
      adminNotes: approvalDto.adminNotes,
      adminApprovedAt: new Date(),
    });

    if (approvalDto.status === ApprovalStatus.APPROVED && approval.taskId) {
      await this.tasksService.update(approval.taskId, {
        startDate: approval.proposedStartDate,
        dueDate: approval.proposedEndDate,
        status: approval.requiresClientApproval ? 'under_review' : 'in_progress',
      });
    }

    return this.findById(id);
  }

  async clientApprove(id: string, clientId: string, approvalDto: ClientApprovalDto): Promise<DeadlineApproval> {
    const approval = await this.findById(id);

    if (approval.status !== ApprovalStatus.APPROVED) {
      throw new BadRequestException('Esta solicitação ainda não foi aprovada internamente');
    }

    const newStatus = approvalDto.approved ? ApprovalStatus.CLIENT_APPROVED : ApprovalStatus.REJECTED;

    await this.deadlineApprovalRepository.update(id, {
      status: newStatus,
      clientId,
      clientNotes: approvalDto.clientNotes,
      clientApprovedAt: new Date(),
    });

    if (approvalDto.approved && approval.taskId) {
      await this.tasksService.update(approval.taskId, {
        status: 'in_progress',
      });
    }

    return this.findById(id);
  }

  async cancel(id: string, userId: string): Promise<DeadlineApproval> {
    const approval = await this.findById(id);

    if (approval.requestedBy.id !== userId) {
      throw new BadRequestException('Você só pode cancelar suas próprias solicitações');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Não é possível cancelar uma solicitação já processada');
    }

    await this.deadlineApprovalRepository.update(id, {
      status: ApprovalStatus.CANCELLED,
    });

    return this.findById(id);
  }

  async getStats() {
    const [pending, approved, rejected, clientPending] = await Promise.all([
      this.deadlineApprovalRepository.count({ where: { status: ApprovalStatus.PENDING } }),
      this.deadlineApprovalRepository.count({ where: { status: ApprovalStatus.APPROVED } }),
      this.deadlineApprovalRepository.count({ where: { status: ApprovalStatus.REJECTED } }),
      this.deadlineApprovalRepository.count({ where: { status: ApprovalStatus.CLIENT_APPROVED } }),
    ]);

    return {
      pending,
      approved,
      rejected,
      clientPending,
      total: pending + approved + rejected + clientPending,
    };
  }
}
