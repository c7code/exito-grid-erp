import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work, WorkStatus } from './work.entity';

@Injectable()
export class WorksService {
  constructor(
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
  ) {}

  async findAll(): Promise<Work[]> {
    return this.workRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Work> {
    const work = await this.workRepository.findOne({ where: { id } });
    if (!work) {
      throw new NotFoundException('Obra não encontrada');
    }
    return work;
  }

  async findByClient(clientId: string): Promise<Work[]> {
    return this.workRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByResponsible(userId: string): Promise<Work[]> {
    return this.workRepository.find({
      where: { responsibleId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Work>): Promise<Work> {
    const code = await this.generateCode();
    const work = this.workRepository.create({ ...data, code });
    return this.workRepository.save(work);
  }

  async update(id: string, data: Partial<Work>): Promise<Work> {
    await this.findById(id);
    await this.workRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const work = await this.findById(id);
    await this.workRepository.remove(work);
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.workRepository.count();
    return `OB-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
