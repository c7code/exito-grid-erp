import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity, OpportunityStatus } from './opportunity.entity';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
  ) {}

  async findAll(): Promise<Opportunity[]> {
    return this.opportunityRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Opportunity> {
    const opp = await this.opportunityRepository.findOne({ where: { id } });
    if (!opp) {
      throw new NotFoundException('Oportunidade não encontrada');
    }
    return opp;
  }

  async findByStatus(status: OpportunityStatus): Promise<Opportunity[]> {
    return this.opportunityRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Opportunity>): Promise<Opportunity> {
    const opportunity = this.opportunityRepository.create(data);
    return this.opportunityRepository.save(opportunity);
  }

  async update(id: string, data: Partial<Opportunity>): Promise<Opportunity> {
    await this.findById(id);
    await this.opportunityRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const opp = await this.findById(id);
    await this.opportunityRepository.remove(opp);
  }
}
