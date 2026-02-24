import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Process, ProcessStage, ChecklistItem, ProcessStatus } from './process.entity';

@Injectable()
export class ProcessesService {
  constructor(
    @InjectRepository(Process)
    private processRepository: Repository<Process>,
    @InjectRepository(ProcessStage)
    private stageRepository: Repository<ProcessStage>,
    @InjectRepository(ChecklistItem)
    private checklistRepository: Repository<ChecklistItem>,
  ) {}

  async findAll(): Promise<Process[]> {
    return this.processRepository.find({
      relations: ['work', 'work.client'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Process> {
    const process = await this.processRepository.findOne({
      where: { id },
      relations: ['work', 'stages', 'stages.checklist'],
    });
    if (!process) {
      throw new NotFoundException('Processo não encontrado');
    }
    return process;
  }

  async findByWork(workId: string): Promise<Process> {
    const process = await this.processRepository.findOne({
      where: { workId },
      relations: ['work', 'stages', 'stages.checklist'],
    });
    if (!process) {
      throw new NotFoundException('Processo não encontrado para esta obra');
    }
    return process;
  }

  async create(processData: Partial<Process>): Promise<Process> {
    const process = this.processRepository.create(processData);
    return this.processRepository.save(process);
  }

  async updateStage(stageId: string, stageData: Partial<ProcessStage>): Promise<ProcessStage> {
    const stage = await this.stageRepository.findOne({ where: { id: stageId } });
    if (!stage) {
      throw new NotFoundException('Etapa não encontrada');
    }
    Object.assign(stage, stageData);
    return this.stageRepository.save(stage);
  }

  async toggleChecklistItem(itemId: string, completed: boolean, userId: string): Promise<ChecklistItem> {
    const item = await this.checklistRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }
    item.isCompleted = completed;
    item.completedAt = completed ? new Date() : null;
    item.completedById = completed ? userId : null;
    return this.checklistRepository.save(item);
  }
}
