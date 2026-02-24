import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from './task.entity';

export interface CreateTaskDto {
  title: string;
  description?: string;
  workId: string;
  assignedToId?: string;
  priority?: TaskPriority;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  checklist?: { id: string; text: string; completed: boolean }[];
  requiresApproval?: boolean;
  requiresClientApproval?: boolean;
  parentTaskId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  assignedToId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  progress?: number;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  checklist?: { id: string; text: string; completed: boolean; completedAt?: Date }[];
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      relations: ['work', 'assignedTo', 'documents'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['work', 'assignedTo', 'documents', 'deadlineApprovals'],
    });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return task;
  }

  async findByWork(workId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { work: { id: workId } },
      relations: ['assignedTo', 'documents'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findByAssignedUser(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { assignedTo: { id: userId } },
      relations: ['work', 'work.client'],
      order: { dueDate: 'ASC' },
    });
  }

  async findPendingByUser(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        assignedTo: { id: userId },
        status: TaskStatus.PENDING,
      },
      relations: ['work', 'work.client'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOverdue(): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        dueDate: LessThan(new Date()),
        status: Not(TaskStatus.COMPLETED),
      },
      relations: ['work', 'assignedTo'],
      order: { dueDate: 'ASC' },
    });
  }

  async create(createDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      ...createDto,
      status: TaskStatus.PENDING,
      progress: 0,
    });
    return this.taskRepository.save(task);
  }

  async update(id: string, updateDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findById(id);
    await this.taskRepository.update(id, updateDto);
    return this.findById(id);
  }

  async updateProgress(id: string, progress: number): Promise<Task> {
    const task = await this.findById(id);
    
    let status = task.status;
    if (progress === 100) {
      status = TaskStatus.COMPLETED;
    } else if (progress > 0 && task.status === TaskStatus.PENDING) {
      status = TaskStatus.IN_PROGRESS;
    }

    await this.taskRepository.update(id, {
      progress,
      status,
      completedAt: progress === 100 ? new Date() : null,
    });
    return this.findById(id);
  }

  async updateChecklist(id: string, checklist: any[]): Promise<Task> {
    await this.taskRepository.update(id, { checklist });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const task = await this.findById(id);
    await this.taskRepository.remove(task);
  }

  async getStats() {
    const [
      total,
      pending,
      inProgress,
      completed,
      overdue,
    ] = await Promise.all([
      this.taskRepository.count(),
      this.taskRepository.count({ where: { status: TaskStatus.PENDING } }),
      this.taskRepository.count({ where: { status: TaskStatus.IN_PROGRESS } }),
      this.taskRepository.count({ where: { status: TaskStatus.COMPLETED } }),
      this.findOverdue().then(tasks => tasks.length),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
    };
  }
}

import { LessThan, Not } from 'typeorm';
