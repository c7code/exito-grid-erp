import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work, WorkStatus } from './work.entity';
import { WorkUpdate } from './work-update.entity';
import { Client } from '../clients/client.entity';
import { Employee } from '../employees/employee.entity';
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
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(TaskResolver)
    private resolverRepository: Repository<TaskResolver>,
  ) { }

  async findAll(status?: WorkStatus): Promise<Work[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.workRepository.find({
      where,
      relations: ['client'],
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
      relations: ['client'],
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
    const count = await this.workRepository.count();
    const nextNumber = String(count + 1).padStart(3, '0');
    return `OB-${year}-${nextNumber}`;
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
    const work = await this.findOne(id);
    Object.assign(work, workData);
    return this.workRepository.save(work);
  }

  async updateProgress(id: string, progress: number): Promise<Work> {
    const work = await this.findOne(id);
    work.progress = progress;
    return this.workRepository.save(work);
  }

  async remove(id: string): Promise<void> {
    const work = await this.findOne(id);
    await this.workRepository.remove(work);
  }

  // --- Work Updates (progress tracking with images) ---

  async createUpdate(workId: string, data: { description: string; progress: number; imageUrl?: string }): Promise<WorkUpdate> {
    // Make sure work exists (use findOneBy to avoid loading relations)
    const work = await this.workRepository.findOneBy({ id: workId });
    if (!work) {
      throw new NotFoundException('Obra não encontrada');
    }

    // Save the update record
    const update = this.workUpdateRepository.create({
      workId,
      description: data.description,
      progress: data.progress,
      imageUrl: data.imageUrl || null,
    });
    const savedUpdate = await this.workUpdateRepository.save(update);

    // Update the work's progress directly (avoids relation cascade issues)
    await this.workRepository.update(workId, { progress: data.progress });

    return savedUpdate;
  }

  async getUpdates(workId: string): Promise<WorkUpdate[]> {
    return this.workUpdateRepository.find({
      where: { workId },
      order: { createdAt: 'DESC' },
    });
  }
}
