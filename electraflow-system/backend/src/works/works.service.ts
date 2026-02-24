import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work, WorkStatus, WorkPriority } from './work.entity';
import { WorkType, ProcessStage } from '../workflow-config/workflow-config.entity';

export interface CreateWorkDto {
  title: string;
  description?: string;
  type: WorkType;
  clientId: string;
  responsibleId?: string;
  totalValue: number;
  priority?: WorkPriority;
  startDate?: Date;
  expectedEndDate?: Date;
  technicalData?: any;
}

export interface UpdateWorkDto {
  title?: string;
  description?: string;
  responsibleId?: string;
  status?: WorkStatus;
  priority?: WorkPriority;
  totalValue?: number;
  startDate?: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  progress?: number;
  currentStage?: ProcessStage;
  technicalData?: any;
}

@Injectable()
export class WorksService {
  constructor(
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
  ) {}

  async findAll(): Promise<Work[]> {
    return this.workRepository.find({
      relations: ['client', 'responsible', 'tasks', 'documents'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Work> {
    const work = await this.workRepository.findOne({
      where: { id },
      relations: ['client', 'responsible', 'tasks', 'tasks.assignedTo', 'documents'],
    });
    if (!work) {
      throw new NotFoundException('Obra não encontrada');
    }
    return work;
  }

  async findByClient(clientId: string): Promise<Work[]> {
    return this.workRepository.find({
      where: { client: { id: clientId } },
      relations: ['responsible', 'tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByResponsible(userId: string): Promise<Work[]> {
    return this.workRepository.find({
      where: { responsible: { id: userId } },
      relations: ['client', 'tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Work[]> {
    return this.workRepository.find({
      where: {
        status: In([WorkStatus.PENDING, WorkStatus.IN_PROGRESS]),
      },
      relations: ['client', 'responsible'],
      order: { expectedEndDate: 'ASC' },
    });
  }

  async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.workRepository.count({
      where: {
        createdAt: MoreThanOrEqual(new Date(year, 0, 1)),
      },
    });
    return `OB-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async create(createDto: CreateWorkDto): Promise<Work> {
    const code = await this.generateCode();
    const work = this.workRepository.create({
      ...createDto,
      code,
      status: WorkStatus.DRAFT,
      progress: 0,
      currentStage: ProcessStage.PROJECT,
    });
    return this.workRepository.save(work);
  }

  async update(id: string, updateDto: UpdateWorkDto): Promise<Work> {
    const work = await this.findById(id);
    await this.workRepository.update(id, updateDto);
    return this.findById(id);
  }

  async updateProgress(id: string, progress: number): Promise<Work> {
    const work = await this.findById(id);
    
    let status = work.status;
    if (progress === 100) {
      status = WorkStatus.COMPLETED;
    } else if (progress > 0 && work.status === WorkStatus.DRAFT) {
      status = WorkStatus.IN_PROGRESS;
    }

    await this.workRepository.update(id, {
      progress,
      status,
      actualEndDate: progress === 100 ? new Date() : work.actualEndDate,
    });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const work = await this.findById(id);
    await this.workRepository.remove(work);
  }

  async getStats() {
    const [
      total,
      draft,
      pending,
      inProgress,
      completed,
      onHold,
    ] = await Promise.all([
      this.workRepository.count(),
      this.workRepository.count({ where: { status: WorkStatus.DRAFT } }),
      this.workRepository.count({ where: { status: WorkStatus.PENDING } }),
      this.workRepository.count({ where: { status: WorkStatus.IN_PROGRESS } }),
      this.workRepository.count({ where: { status: WorkStatus.COMPLETED } }),
      this.workRepository.count({ where: { status: WorkStatus.ON_HOLD } }),
    ]);

    const totalValue = await this.workRepository
      .createQueryBuilder('work')
      .select('SUM(work.totalValue)', 'total')
      .getRawOne();

    return {
      total,
      draft,
      pending,
      inProgress,
      completed,
      onHold,
      totalValue: totalValue?.total || 0,
    };
  }
}

import { In, MoreThanOrEqual } from 'typeorm';
