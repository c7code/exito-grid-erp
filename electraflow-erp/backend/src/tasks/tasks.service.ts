import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return task;
  }

  async findByWork(workId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { workId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByAssignedUser(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { assignedToId: userId },
      order: { dueDate: 'ASC' },
    });
  }

  async findPendingByUser(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { assignedToId: userId, status: TaskStatus.PENDING },
      order: { dueDate: 'ASC' },
    });
  }

  async create(data: Partial<Task>): Promise<Task> {
    const task = this.taskRepository.create(data);
    return this.taskRepository.save(task);
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    await this.findById(id);
    await this.taskRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const task = await this.findById(id);
    await this.taskRepository.remove(task);
  }
}
