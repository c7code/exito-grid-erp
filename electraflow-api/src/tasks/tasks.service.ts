import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { TaskResolver } from './task-resolver.entity';
import { Work } from '../works/work.entity';
import { Employee } from '../employees/employee.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskResolver)
    private resolverRepository: Repository<TaskResolver>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
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
   * Optionally filter by status (e.g. 'pending', 'in_progress').
   */
  async findByEmployee(email: string, status?: string): Promise<Task[]> {
    const employee = await this.employeeRepository.findOneBy({ email });
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

    return this.findOne(saved.id);
  }

  async update(id: string, taskData: Partial<Task> & { resolverIds?: string[] }): Promise<Task> {
    const task = await this.findOne(id);
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

    return this.findOne(saved.id);
  }

  async complete(id: string, userId: string, result?: string): Promise<Task> {
    const task = await this.findOne(id);
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.completedById = userId;
    if (result) task.result = result;
    const saved = await this.taskRepository.save(task);

    // Recalculate work progress
    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    return this.findOne(saved.id);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    const workId = task.workId;
    await this.taskRepository.remove(task);

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
    await this.resolverRepository.delete({ taskId });

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
