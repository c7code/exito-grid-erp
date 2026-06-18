import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async findAll(page = 1, limit = 20): Promise<{ data: Process[]; total: number; page: number; limit: number }> {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [data, total] = await this.processRepository.findAndCount({
      relations: ['work', 'work.client'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });

    return { data, total, page: Math.max(page, 1), limit: take };
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

  async update(id: string, data: Partial<Process>): Promise<Process> {
    const process = await this.processRepository.findOne({ where: { id } });
    if (!process) {
      throw new NotFoundException('Processo não encontrado');
    }
    Object.assign(process, data);
    return this.processRepository.save(process);
  }

  async remove(id: string): Promise<void> {
    const process = await this.processRepository.findOne({ where: { id } });
    if (!process) {
      throw new NotFoundException('Processo não encontrado');
    }
    await this.processRepository.softRemove(process);
  }

  async createStage(processId: string, stageData: Partial<ProcessStage>): Promise<ProcessStage> {
    const process = await this.processRepository.findOne({ where: { id: processId } });
    if (!process) {
      throw new NotFoundException('Processo não encontrado');
    }
    const stage = this.stageRepository.create({
      ...stageData,
      processId,
    });
    return this.stageRepository.save(stage);
  }

  async removeStage(stageId: string): Promise<void> {
    const stage = await this.stageRepository.findOne({ where: { id: stageId } });
    if (!stage) {
      throw new NotFoundException('Etapa não encontrada');
    }
    await this.stageRepository.softRemove(stage);
  }

  async createChecklistItem(stageId: string, itemData: Partial<ChecklistItem>): Promise<ChecklistItem> {
    const stage = await this.stageRepository.findOne({ where: { id: stageId } });
    if (!stage) {
      throw new NotFoundException('Etapa não encontrada');
    }
    const item = this.checklistRepository.create({
      ...itemData,
      stageId,
    });
    return this.checklistRepository.save(item);
  }

  async removeChecklistItem(stageId: string, itemId: string): Promise<void> {
    const item = await this.checklistRepository.findOne({
      where: { id: itemId, stageId },
    });
    if (!item) {
      throw new NotFoundException('Item do checklist não encontrado');
    }
    await this.checklistRepository.softRemove(item);
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

    // Validate documentRequired items have documentUrl before allowing completion
    if (completed && item.documentRequired && !item.documentUrl) {
      throw new BadRequestException(
        `O item "${item.description}" requer o documento "${item.documentRequired}" antes de ser concluído. Envie o documento primeiro.`,
      );
    }

    item.isCompleted = completed;
    item.completedAt = completed ? new Date() : null;
    item.completedById = completed ? userId : null;
    const savedItem = await this.checklistRepository.save(item);

    // Recalculate stage progress and overall process progress
    await this.recalculateProgress(item.stageId);

    return savedItem;
  }

  private async recalculateProgress(stageId: string): Promise<void> {
    const stage = await this.stageRepository.findOne({
      where: { id: stageId },
      relations: ['checklist'],
    });
    if (!stage || !stage.checklist || stage.checklist.length === 0) return;

    // Calculate stage progress
    const totalItems = stage.checklist.length;
    const completedItems = stage.checklist.filter(item => item.isCompleted).length;
    const stageProgress = Math.round((completedItems / totalItems) * 100);

    // Update stage status based on progress
    let stageStatus = stage.status;
    if (stageProgress === 100) {
      stageStatus = ProcessStatus.COMPLETED;
    } else if (stageProgress > 0) {
      stageStatus = ProcessStatus.IN_PROGRESS;
    } else {
      stageStatus = ProcessStatus.NOT_STARTED;
    }

    await this.stageRepository.update(stageId, { status: stageStatus });

    // Recalculate overall process progress
    if (stage.processId) {
      const allStages = await this.stageRepository.find({
        where: { processId: stage.processId },
        relations: ['checklist'],
      });

      if (allStages.length === 0) return;

      let totalProcessItems = 0;
      let completedProcessItems = 0;
      for (const s of allStages) {
        if (s.checklist && s.checklist.length > 0) {
          totalProcessItems += s.checklist.length;
          completedProcessItems += s.checklist.filter(i => i.isCompleted).length;
        }
      }

      const processProgress = totalProcessItems > 0
        ? Math.round((completedProcessItems / totalProcessItems) * 100)
        : 0;

      // Determine process status
      let processStatus: ProcessStatus;
      if (processProgress === 100) {
        processStatus = ProcessStatus.COMPLETED;
      } else if (processProgress > 0) {
        processStatus = ProcessStatus.IN_PROGRESS;
      } else {
        processStatus = ProcessStatus.NOT_STARTED;
      }

      await this.processRepository.update(stage.processId, {
        progress: processProgress,
        status: processStatus,
        completedAt: processStatus === ProcessStatus.COMPLETED ? new Date() : null,
        startedAt: processProgress > 0
          ? (await this.processRepository.findOne({ where: { id: stage.processId } }))?.startedAt || new Date()
          : null,
      });
    }
  }
}
