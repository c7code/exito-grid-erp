import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowConfig, WorkType, ProcessStage } from './workflow-config.entity';

export interface CreateWorkflowConfigDto {
  name: string;
  description?: string;
  workType: WorkType;
  stage: ProcessStage;
  stepName: string;
  defaultDeadlineDays: number;
  minDeadlineDays?: number;
  maxDeadlineDays?: number;
  order?: number;
  requiresApproval?: boolean;
  requiresClientApproval?: boolean;
  requiredDocuments?: string[];
  checklistItems?: string[];
  createdById: string;
}

export interface UpdateWorkflowConfigDto {
  name?: string;
  description?: string;
  defaultDeadlineDays?: number;
  minDeadlineDays?: number;
  maxDeadlineDays?: number;
  order?: number;
  requiresApproval?: boolean;
  requiresClientApproval?: boolean;
  requiredDocuments?: string[];
  checklistItems?: string[];
  isActive?: boolean;
}

@Injectable()
export class WorkflowConfigService {
  constructor(
    @InjectRepository(WorkflowConfig)
    private workflowConfigRepository: Repository<WorkflowConfig>,
  ) {}

  async findAll(): Promise<WorkflowConfig[]> {
    return this.workflowConfigRepository.find({
      where: { isActive: true },
      order: { workType: 'ASC', stage: 'ASC', order: 'ASC' },
    });
  }

  async findById(id: string): Promise<WorkflowConfig> {
    const config = await this.workflowConfigRepository.findOne({
      where: { id },
    });
    if (!config) {
      throw new NotFoundException('Configuração não encontrada');
    }
    return config;
  }

  async findByWorkType(workType: WorkType): Promise<WorkflowConfig[]> {
    return this.workflowConfigRepository.find({
      where: { workType, isActive: true },
      order: { stage: 'ASC', order: 'ASC' },
    });
  }

  async findByStage(workType: WorkType, stage: ProcessStage): Promise<WorkflowConfig[]> {
    return this.workflowConfigRepository.find({
      where: { workType, stage, isActive: true },
      order: { order: 'ASC' },
    });
  }

  async getDefaultDeadline(workType: WorkType, stage: ProcessStage, stepName: string): Promise<number | null> {
    const config = await this.workflowConfigRepository.findOne({
      where: { workType, stage, stepName, isActive: true },
    });
    return config?.defaultDeadlineDays || null;
  }

  async create(createDto: CreateWorkflowConfigDto): Promise<WorkflowConfig> {
    const config = this.workflowConfigRepository.create(createDto);
    return this.workflowConfigRepository.save(config);
  }

  async update(id: string, updateDto: UpdateWorkflowConfigDto): Promise<WorkflowConfig> {
    const config = await this.findById(id);
    await this.workflowConfigRepository.update(id, updateDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const config = await this.findById(id);
    await this.workflowConfigRepository.update(id, { isActive: false });
  }

  async getWorkflowTemplate(workType: WorkType): Promise<{
    stage: ProcessStage;
    steps: WorkflowConfig[];
  }[]> {
    const configs = await this.findByWorkType(workType);
    const grouped = configs.reduce((acc, config) => {
      const existing = acc.find(g => g.stage === config.stage);
      if (existing) {
        existing.steps.push(config);
      } else {
        acc.push({ stage: config.stage, steps: [config] });
      }
      return acc;
    }, [] as { stage: ProcessStage; steps: WorkflowConfig[] }[]);
    
    return grouped;
  }

  async validateDeadline(
    workType: WorkType,
    stage: ProcessStage,
    stepName: string,
    proposedDays: number,
  ): Promise<{ valid: boolean; min?: number; max?: number; default?: number }> {
    const config = await this.workflowConfigRepository.findOne({
      where: { workType, stage, stepName, isActive: true },
    });

    if (!config) {
      return { valid: true };
    }

    if (config.minDeadlineDays && proposedDays < config.minDeadlineDays) {
      return {
        valid: false,
        min: config.minDeadlineDays,
        max: config.maxDeadlineDays,
        default: config.defaultDeadlineDays,
      };
    }

    if (config.maxDeadlineDays && proposedDays > config.maxDeadlineDays) {
      return {
        valid: false,
        min: config.minDeadlineDays,
        max: config.maxDeadlineDays,
        default: config.defaultDeadlineDays,
      };
    }

    return { valid: true };
  }
}
