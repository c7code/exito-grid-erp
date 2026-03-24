import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work, WorkStatus } from './work.entity';
import { WorkUpdate } from './work-update.entity';
import { WorkPhase } from './work-phase.entity';
import { WorkTypeConfig } from './work-type-config.entity';
import { Client } from '../clients/client.entity';
import { Employee } from '../employees/employee.entity';
import { Task } from '../tasks/task.entity';
import { TaskResolver } from '../tasks/task-resolver.entity';

@Injectable()
export class WorksService {
  constructor(
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(WorkUpdate)
    private workUpdateRepository: Repository<WorkUpdate>,
    @InjectRepository(WorkPhase)
    private workPhaseRepository: Repository<WorkPhase>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskResolver)
    private resolverRepository: Repository<TaskResolver>,
    @InjectRepository(WorkTypeConfig)
    private workTypeConfigRepository: Repository<WorkTypeConfig>,
  ) { }

  async findAll(status?: WorkStatus): Promise<Work[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.workRepository.find({
      where,
      relations: ['client', 'createdByUser'],
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Find works where the employee is a resolver on at least one task.
   */
  async findMyWorks(email: string): Promise<Work[]> {
    const employee = await this.employeeRepository.findOneBy({ email });
    if (!employee) return [];

    // Find distinct workIds from tasks where this employee is a resolver
    const resolverRows = await this.resolverRepository
      .createQueryBuilder('resolver')
      .innerJoin('resolver.task', 'task')
      .select('DISTINCT task.workId', 'workId')
      .where('resolver.employeeId = :empId', { empId: employee.id })
      .andWhere('task.workId IS NOT NULL')
      .getRawMany();

    if (resolverRows.length === 0) return [];

    const workIds = resolverRows.map(r => r.workId);

    return this.workRepository.find({
      where: workIds.map(id => ({ id })),
      relations: ['client', 'createdByUser'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Work> {
    const work = await this.workRepository.findOne({
      where: { id },
      relations: ['client', 'opportunity', 'process', 'documents', 'updates'],
    });
    if (!work) {
      throw new NotFoundException('Obra não encontrada');
    }
    return work;
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `OB-${year}-`;

    // Find the highest existing code for this year (including soft-deleted)
    const result = await this.workRepository
      .createQueryBuilder('work')
      .withDeleted()
      .select('MAX(work.code)', 'maxCode')
      .where('work.code LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();

    let nextNumber = 1;
    if (result?.maxCode) {
      const lastNum = parseInt(result.maxCode.replace(prefix, ''), 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  async create(workData: Partial<Work> & {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
  }): Promise<Work> {
    // Auto-create client if clientName is provided but no clientId
    if (!workData.clientId && workData.clientName) {
      const newClient = this.clientRepository.create({
        name: workData.clientName,
        email: workData.clientEmail || undefined,
        phone: workData.clientPhone || undefined,
      });
      const savedClient = await this.clientRepository.save(newClient);
      workData.clientId = savedClient.id;
    }

    // Auto-generate code if not provided
    if (!workData.code) {
      workData.code = await this.generateCode();
    }

    // Clean extra fields before saving
    const { clientName, clientEmail, clientPhone, ...cleanData } = workData;

    const work = this.workRepository.create(cleanData);
    const savedWork = await this.workRepository.save(work);

    // Return with client relation loaded
    return this.workRepository.findOne({
      where: { id: savedWork.id },
      relations: ['client'],
    });
  }

  async update(id: string, workData: Partial<Work>): Promise<Work> {
    // Ensure work exists
    await this.findOne(id);

    // Remove relation objects and id from update data to avoid TypeORM conflicts
    const { client, opportunity, process, documents, updates, tasks, createdByUser, id: _id, ...cleanData } = workData as any;

    // Remove undefined values to avoid setting NOT NULL columns to null
    const filteredData: Record<string, any> = {};
    for (const [key, value] of Object.entries(cleanData)) {
      if (value !== undefined && !(typeof value === 'number' && isNaN(value))) filteredData[key] = value;
    }

    if (Object.keys(filteredData).length > 0) {
      await this.workRepository.update(id, filteredData);
    }
    return this.findOne(id);
  }

  async updateProgress(id: string, progress: number): Promise<Work> {
    const work = await this.findOne(id);
    work.progress = progress;
    return this.workRepository.save(work);
  }

  async remove(id: string): Promise<void> {
    const work = await this.findOne(id);
    try {
      await this.workRepository.softRemove(work);
    } catch (error: any) {
      // Foreign key constraint violation
      if (error?.code === '23503' || error?.message?.includes('foreign key')) {
        throw new Error('Não é possível excluir esta obra pois existem registros vinculados. Remova os registros dependentes primeiro.');
      }
      throw error;
    }
  }

  // --- Work Updates (progress tracking with images) ---

  async createUpdate(workId: string, data: { description: string; progress: number; imageUrl?: string }): Promise<WorkUpdate> {
    // Make sure work exists
    const work = await this.workRepository.findOneBy({ id: workId });
    if (!work) {
      throw new NotFoundException('Obra não encontrada');
    }

    // Save the update record with its incremental value
    const update = this.workUpdateRepository.create({
      workId,
      description: data.description,
      progress: data.progress,
      imageUrl: data.imageUrl || null,
    });
    const savedUpdate = await this.workUpdateRepository.save(update);

    // Accumulate progress on the work (sum all updates, cap at 100)
    const currentProgress = Number(work.progress) || 0;
    const newProgress = Math.min(100, Math.max(0, currentProgress + Number(data.progress)));
    await this.workRepository.update(workId, { progress: newProgress });

    return savedUpdate;
  }

  async getUpdates(workId: string): Promise<WorkUpdate[]> {
    return this.workUpdateRepository.find({
      where: { workId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateWorkUpdate(updateId: string, data: { description?: string; progress?: number }): Promise<WorkUpdate> {
    const update = await this.workUpdateRepository.findOneBy({ id: updateId });
    if (!update) throw new NotFoundException('Atualização não encontrada');
    if (data.description !== undefined) update.description = data.description;
    if (data.progress !== undefined) update.progress = data.progress;
    return this.workUpdateRepository.save(update);
  }

  async deleteWorkUpdate(updateId: string): Promise<void> {
    const update = await this.workUpdateRepository.findOneBy({ id: updateId });
    if (!update) throw new NotFoundException('Atualização não encontrada');

    // Subtract this update's progress from the work total before deleting
    const work = await this.workRepository.findOneBy({ id: update.workId });
    if (work) {
      const currentProgress = Number(work.progress) || 0;
      const restoredProgress = Math.min(100, Math.max(0, currentProgress - Number(update.progress)));
      await this.workRepository.update(update.workId, { progress: restoredProgress });
    }

    await this.workUpdateRepository.softRemove(update);
  }

  // ═══════ WORK TYPE CONFIGS (dynamic types) ═══════

  async findAllWorkTypes(): Promise<WorkTypeConfig[]> {
    return this.workTypeConfigRepository.find({
      order: { sortOrder: 'ASC', label: 'ASC' },
    });
  }

  async createWorkType(data: Partial<WorkTypeConfig>): Promise<WorkTypeConfig> {
    // Auto-generate key from label if not provided
    if (!data.key && data.label) {
      data.key = data.label
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    }
    const wt = this.workTypeConfigRepository.create(data);
    return this.workTypeConfigRepository.save(wt);
  }

  async updateWorkType(id: string, data: Partial<WorkTypeConfig>): Promise<WorkTypeConfig> {
    await this.workTypeConfigRepository.update(id, data);
    return this.workTypeConfigRepository.findOneBy({ id });
  }

  async removeWorkType(id: string): Promise<void> {
    await this.workTypeConfigRepository.delete(id);
  }

  // ═══════ WORK PHASES (dynamic stages) ═══════

  async findPhases(workId: string): Promise<WorkPhase[]> {
    return this.workPhaseRepository.find({
      where: { workId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async createPhase(workId: string, data: Partial<WorkPhase>): Promise<WorkPhase> {
    const work = await this.workRepository.findOneBy({ id: workId });
    if (!work) throw new NotFoundException('Obra não encontrada');

    // Auto-set order to next available
    const existingPhases = await this.findPhases(workId);
    const nextOrder = existingPhases.length > 0
      ? Math.max(...existingPhases.map(p => p.order)) + 1
      : 0;

    const phase = this.workPhaseRepository.create({
      ...data,
      workId,
      order: data.order ?? nextOrder,
    });
    const saved = await this.workPhaseRepository.save(phase);
    return saved;
  }

  async updatePhase(phaseId: string, data: Partial<WorkPhase>): Promise<WorkPhase> {
    const phase = await this.workPhaseRepository.findOneBy({ id: phaseId });
    if (!phase) throw new NotFoundException('Etapa não encontrada');
    Object.assign(phase, data);
    const saved = await this.workPhaseRepository.save(phase);
    // Recalculate work progress
    await this.recalculateProgress(phase.workId);
    return saved;
  }

  async deletePhase(phaseId: string): Promise<void> {
    const phase = await this.workPhaseRepository.findOneBy({ id: phaseId });
    if (!phase) throw new NotFoundException('Etapa não encontrada');
    // Unlink tasks from this phase
    await this.taskRepository.update({ phaseId }, { phaseId: null });
    await this.workPhaseRepository.softRemove(phase);
    // Recalculate
    await this.recalculateProgress(phase.workId);
  }

  async recalculateProgress(workId: string): Promise<number> {
    const phases = await this.findPhases(workId);
    if (phases.length === 0) return 0;

    let totalWeightedProgress = 0;
    let totalWeight = 0;

    for (const phase of phases) {
      const tasks = await this.taskRepository.find({ where: { phaseId: phase.id } });
      let phaseProgress = Number(phase.progress) || 0;

      if (tasks.length > 0) {
        // Calculate from tasks: completed / total
        const completedCount = tasks.filter(t => t.status === 'completed').length;
        phaseProgress = Math.round((completedCount / tasks.length) * 100);
        // Update phase progress
        await this.workPhaseRepository.update(phase.id, {
          progress: phaseProgress,
          status: phaseProgress >= 100 ? 'completed' : phaseProgress > 0 ? 'in_progress' : 'pending',
        });
      }

      const weight = Number(phase.weight) || 0;
      totalWeight += weight;
      totalWeightedProgress += (weight * phaseProgress) / 100;
    }

    // Normalize if weights don't sum to 100
    const workProgress = totalWeight > 0
      ? Math.round((totalWeightedProgress / totalWeight) * 100)
      : 0;

    await this.workRepository.update(workId, { progress: workProgress });
    return workProgress;
  }
}
