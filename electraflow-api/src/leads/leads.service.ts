import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStatus } from './lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  async findAll(status?: LeadStatus): Promise<Lead[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.leadRepository.find({
      where,
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id },
      relations: ['client', 'opportunity'],
    });
    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }
    return lead;
  }

  async create(leadData: Partial<Lead>): Promise<Lead> {
    const lead = this.leadRepository.create(leadData);
    return this.leadRepository.save(lead);
  }

  async update(id: string, leadData: Partial<Lead>): Promise<Lead> {
    const lead = await this.findOne(id);
    Object.assign(lead, leadData);
    return this.leadRepository.save(lead);
  }

  async convert(id: string, opportunityId: string): Promise<Lead> {
    const lead = await this.findOne(id);
    lead.status = LeadStatus.CONVERTED;
    lead.convertedAt = new Date();
    return this.leadRepository.save(lead);
  }

  async remove(id: string): Promise<void> {
    const lead = await this.findOne(id);
    await this.leadRepository.remove(lead);
  }
}
