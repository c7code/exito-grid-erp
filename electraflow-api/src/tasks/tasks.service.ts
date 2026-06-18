import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { TaskResolver } from './task-resolver.entity';
import { Work } from '../works/work.entity';
import { WorksService } from '../works/works.service';
import { Employee } from '../employees/employee.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { DataSource } from 'typeorm';

const VALID_TASK_TRANSITIONS: Record<string, string[]> = {
  'pending': ['in_progress', 'cancelled'],
  'in_progress': ['under_review', 'completed', 'cancelled', 'pending'],
  'under_review': ['approved', 'client_review', 'in_progress'],
  'approved': ['client_review', 'completed'],
  'client_review': ['client_approved', 'in_progress'],
  'client_approved': ['completed'],
  'completed': [],
  'cancelled': ['pending'],
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskResolver)
    private resolverRepository: Repository<TaskResolver>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => WorksService))
    private worksService: WorksService,
    private dataSource: DataSource,
  ) {
    this.ensureColumns().catch(err => this.logger.warn('Auto-migration skipped:', err.message));
  }

  /**
   * Auto-create visibility columns if they don't exist yet.
   */
  private async ensureColumns() {
    const qr = this.dataSource.createQueryRunner();
    try {
      const table = await qr.getTable('tasks');
      if (!table) return;
      const cols = table.columns.map(c => c.name);
      if (!cols.includes('visibility')) {
        await qr.query(`ALTER TABLE tasks ADD COLUMN "visibility" varchar(20) DEFAULT 'public'`);
        this.logger.log('Added column: visibility');
      }
      if (!cols.includes('visibleToIds')) {
        await qr.query(`ALTER TABLE tasks ADD COLUMN "visibleToIds" text DEFAULT NULL`);
        this.logger.log('Added column: visibleToIds');
      }
    } finally {
      await qr.release();
    }
  }

  async findAll(userEmail?: string, isAdmin = true): Promise<Task[]> {
    const tasks = await this.taskRepository.find({
      relations: ['work', 'resolvers', 'resolvers.employee'],
      order: { dueDate: 'ASC' },
    });

    // Admin sees everything
    if (isAdmin) return tasks;

    // Non-admin: find their employee ID
    let employeeId: string | null = null;
    if (userEmail) {
      const emp = await this.employeeRepository.findOneBy({ email: userEmail });
      if (emp) {
        employeeId = emp.id;
      } else {
        const user = await this.userRepository.findOneBy({ email: userEmail });
        if (user) {
          const empByName = await this.employeeRepository.findOneBy({ name: user.name });
          if (empByName) employeeId = empByName.id;
        }
      }
    }

    // Filter: show public tasks + restricted tasks where user is in visibleToIds or resolvers
    return tasks.filter(task => {
      if (task.visibility !== 'restricted') return true; // public tasks
      if (!employeeId) return false;
      // Check if user is in visibleToIds
      const visIds = Array.isArray(task.visibleToIds) ? task.visibleToIds : [];
      if (visIds.includes(employeeId)) return true;
      // Check if user is a resolver
      if (task.resolvers?.some(r => r.employeeId === employeeId)) return true;
      return false;
    });
  }

  async findByWork(workId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { workId },
      relations: ['resolvers', 'resolvers.employee'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Find tasks assigned to an employee (via TaskResolver) using their email.
   * Also checks the users table so admin/non-employee users can see their tasks.
   * Optionally filter by status (e.g. 'pending', 'in_progress').
   */
  async findByEmployee(email: string, status?: string): Promise<Task[]> {
    // Try to find the employee directly by email
    let employee = await this.employeeRepository.findOneBy({ email });

    // If not found, check if a User with this email exists and find an Employee
    // with the same name (admin users may not be in employees table with the same email)
    if (!employee) {
      const user = await this.userRepository.findOneBy({ email });
      if (user) {
        // Try to find an employee by the user's name as fallback
        employee = await this.employeeRepository.findOneBy({ name: user.name });
      }
    }

    if (!employee) return [];

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.resolvers', 'resolver', 'resolver.employeeId = :empId', { empId: employee.id })
      .leftJoinAndSelect('task.work', 'work')
      .leftJoinAndSelect('work.client', 'client')
      .leftJoinAndSelect('task.resolvers', 'allResolvers')
      .leftJoinAndSelect('allResolvers.employee', 'resolverEmployee');

    if (status) {
      qb.where('task.status = :status', { status });
    }

    qb.orderBy('task.dueDate', 'ASC');

    return qb.getMany();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['work', 'resolvers', 'resolvers.employee'],
    });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return task;
  }

  async create(taskData: Partial<Task> & { resolverIds?: string[] }): Promise<Task> {
    const { resolverIds, ...data } = taskData;
    const task = this.taskRepository.create(data);
    const saved = await this.taskRepository.save(task);

    // Create resolvers if provided
    if (resolverIds && resolverIds.length > 0) {
      await this.syncResolvers(saved.id, resolverIds);
    }

    // Recalculate work progress if task is linked to a work
    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    const fullTask = await this.findOne(saved.id);

    // Notify resolvers + admins about the new task
    this.notificationsService.onTaskCreated(fullTask).catch(err => this.logger.error('Erro ao notificar tarefa criada', err));

    return fullTask;
  }

  async update(id: string, taskData: Partial<Task> & { resolverIds?: string[] }): Promise<Task> {
    const task = await this.findOne(id);
    const previousStatus = task.status;
    const previousWorkId = task.workId;
    const { resolverIds, ...data } = taskData;

    // Validate status transition
    if (data.status && data.status !== task.status) {
      const allowed = VALID_TASK_TRANSITIONS[task.status] || [];
      if (!allowed.includes(data.status)) {
        throw new BadRequestException(`Transição de status inválida: ${task.status} → ${data.status}`);
      }
    }

    Object.assign(task, data);
    const saved = await this.taskRepository.save(task);

    // Sync resolvers if provided
    if (resolverIds !== undefined) {
      await this.syncResolvers(saved.id, resolverIds);
    }

    // Recalculate progress for both old and new work if workId changed
    if (previousWorkId && previousWorkId !== saved.workId) {
      await this.recalculateWorkProgress(previousWorkId);
    }
    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    const fullTask = await this.findOne(saved.id);

    // Notify admins on status transitions
    if (previousStatus !== saved.status) {
      if (saved.status === TaskStatus.IN_PROGRESS) {
        this.notificationsService.onTaskStarted(fullTask).catch(err => this.logger.error('Erro ao notificar tarefa iniciada', err));
      } else if (saved.status === TaskStatus.COMPLETED) {
        this.notificationsService.onTaskCompleted(fullTask).catch(err => this.logger.error('Erro ao notificar tarefa concluída', err));
      }
    }

    return fullTask;
  }

  async complete(
    id: string,
    userId: string,
    result?: string,
    resolvedByEmail?: string,
    resolutionType?: string,
    resolutionNotes?: string,
  ): Promise<Task> {
    const task = await this.findOne(id);

    if (resolutionType === 'partial') {
      // Partial resolution: keep in_progress but track who worked on it
      task.status = TaskStatus.IN_PROGRESS;
    } else {
      // Total resolution: enforce approval workflow
      if (task.requiresApproval && task.status === TaskStatus.IN_PROGRESS) {
        // Needs internal approval first → route to under_review
        task.status = TaskStatus.UNDER_REVIEW;
      } else if (task.requiresClientApproval && task.status === TaskStatus.APPROVED) {
        // Internal approved, needs client approval → route to client_review
        task.status = TaskStatus.CLIENT_REVIEW;
      } else {
        // No approval needed or all approvals done → mark completed
        task.status = TaskStatus.COMPLETED;
        task.completedAt = new Date();
      }
    }

    task.completedById = userId;
    task.resolvedByEmail = resolvedByEmail || null;
    task.resolutionType = resolutionType || 'total';
    task.resolutionNotes = resolutionNotes || null;
    if (result) task.result = result;

    const saved = await this.taskRepository.save(task);

    // Recalculate work progress
    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    const fullTask = await this.findOne(saved.id);

    // Notify admins about task completion (only for total, actually completed)
    if (resolutionType !== 'partial' && saved.status === TaskStatus.COMPLETED) {
      this.notificationsService.onTaskCompleted(fullTask).catch(() => { });
    }

    return fullTask;
  }

  /**
   * Internal approval: validates under_review → approved (or client_review if client approval needed).
   */
  async approve(id: string): Promise<Task> {
    const task = await this.findOne(id);

    if (task.status !== TaskStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        `Tarefa precisa estar em revisão para ser aprovada. Status atual: ${task.status}`,
      );
    }

    if (task.requiresClientApproval) {
      // Still needs client approval
      task.status = TaskStatus.CLIENT_REVIEW;
    } else {
      // No client approval needed → complete
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
    }

    const saved = await this.taskRepository.save(task);

    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    const fullTask = await this.findOne(saved.id);

    if (saved.status === TaskStatus.COMPLETED) {
      this.notificationsService.onTaskCompleted(fullTask).catch(() => { });
    }

    return fullTask;
  }

  /**
   * Client approval: validates client_review → completed.
   */
  async clientApprove(id: string): Promise<Task> {
    const task = await this.findOne(id);

    if (task.status !== TaskStatus.CLIENT_REVIEW) {
      throw new BadRequestException(
        `Tarefa precisa estar em revisão do cliente para ser aprovada. Status atual: ${task.status}`,
      );
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();

    const saved = await this.taskRepository.save(task);

    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    const fullTask = await this.findOne(saved.id);
    this.notificationsService.onTaskCompleted(fullTask).catch(() => { });

    return fullTask;
  }

  /**
   * Reject a task: returns it to in_progress with a rejection reason.
   */
  async reject(id: string, reason: string): Promise<Task> {
    const task = await this.findOne(id);

    if (task.status !== TaskStatus.UNDER_REVIEW && task.status !== TaskStatus.CLIENT_REVIEW) {
      throw new BadRequestException(
        `Tarefa precisa estar em revisão para ser rejeitada. Status atual: ${task.status}`,
      );
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.rejectionReason = reason || null;

    const saved = await this.taskRepository.save(task);

    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    return this.findOne(saved.id);
  }

  /**
   * Manually submit a task for review (in_progress → under_review).
   */
  async submitForReview(id: string): Promise<Task> {
    const task = await this.findOne(id);

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Tarefa precisa estar em andamento para ser enviada para revisão. Status atual: ${task.status}`,
      );
    }

    task.status = TaskStatus.UNDER_REVIEW;
    const saved = await this.taskRepository.save(task);

    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    return this.findOne(saved.id);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    const workId = task.workId;
    await this.taskRepository.softRemove(task);

    // Recalculate work progress after removal
    if (workId) {
      await this.recalculateWorkProgress(workId);
    }
  }

  /**
   * Synchronise resolvers for a task: deletes existing ones and inserts the new set.
   */
  async syncResolvers(taskId: string, employeeIds: string[]): Promise<TaskResolver[]> {
    // Remove all existing resolvers for this task
    await this.resolverRepository.softDelete({ taskId });

    if (!employeeIds || employeeIds.length === 0) return [];

    // Create new resolvers
    const resolvers = employeeIds.map(employeeId =>
      this.resolverRepository.create({ taskId, employeeId }),
    );
    return this.resolverRepository.save(resolvers);
  }

  /**
   * Recalculates the work's progress by delegating to WorksService.recalculateProgress().
   * This ensures a single source of truth: the WorkPhase weighted average system.
   */
  async recalculateWorkProgress(workId: string): Promise<void> {
    await this.worksService.recalculateProgress(workId);
  }
}
