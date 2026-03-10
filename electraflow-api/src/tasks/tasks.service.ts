import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { TaskResolver } from './task-resolver.entity';
import { Work } from '../works/work.entity';
import { Employee } from '../employees/employee.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

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
  ) { }

  async findAll(assignedToId?: string): Promise<Task[]> {
    const where: any = {};
    if (assignedToId) where.assignedToId = assignedToId;
    return this.taskRepository.find({
      where,
      relations: ['work', 'resolvers', 'resolvers.employee'],
      order: { dueDate: 'ASC' },
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
      // Total resolution: mark as completed
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
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

    // Notify admins about task completion (only for total)
    if (resolutionType !== 'partial') {
      this.notificationsService.onTaskCompleted(fullTask).catch(() => { });
    }

    return fullTask;
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
   * Recalculates the work's progress based on the weighted percentage of completed tasks.
   * Each task has a weightPercentage (0-100) representing its contribution to the work.
   * Progress = sum of weightPercentage of all completed tasks (capped at 100).
   */
  async recalculateWorkProgress(workId: string): Promise<void> {
    const tasks = await this.taskRepository.find({ where: { workId } });

    if (tasks.length === 0) {
      await this.workRepository.update(workId, { progress: 0 });
      return;
    }

    const completedWeight = tasks
      .filter(t => t.status === TaskStatus.COMPLETED)
      .reduce((sum, t) => sum + Number(t.weightPercentage || 0), 0);

    const progress = Math.min(Math.round(completedWeight), 100);

    await this.workRepository.update(workId, { progress });
  }
}
