import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal } from './proposal.entity';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
  ) {}

  async findAll(): Promise<Proposal[]> {
    return this.proposalRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({ where: { id } });
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    return proposal;
  }

  async create(data: Partial<Proposal>): Promise<Proposal> {
    const code = await this.generateCode();
    const proposal = this.proposalRepository.create({ ...data, code });
    return this.proposalRepository.save(proposal);
  }

  async update(id: string, data: Partial<Proposal>): Promise<Proposal> {
    await this.findById(id);
    await this.proposalRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const proposal = await this.findById(id);
    await this.proposalRepository.remove(proposal);
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.proposalRepository.count();
    return `PROP-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
