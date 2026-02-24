import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity, OpportunityStage } from './opportunity.entity';
import { ProposalsService } from '../proposals/proposals.service';
import { WorksService } from '../works/works.service';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    private proposalsService: ProposalsService,
    private worksService: WorksService,
    private financeService: FinanceService,
  ) { }

  async findAll(stage?: OpportunityStage): Promise<Opportunity[]> {
    const where: any = {};
    if (stage) where.stage = stage;
    return this.opportunityRepository.find({
      where,
      relations: ['client', 'lead', 'proposals', 'work'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Opportunity> {
    const opp = await this.opportunityRepository.findOne({
      where: { id },
      relations: ['client', 'lead', 'proposals', 'work'],
    });
    if (!opp) {
      throw new NotFoundException('Oportunidade não encontrada');
    }
    return opp;
  }

  async create(oppData: Partial<Opportunity>): Promise<Opportunity> {
    const opp = this.opportunityRepository.create(oppData);
    const saved = await this.opportunityRepository.save(opp);
    return this.findOne(saved.id);
  }

  async update(id: string, oppData: Partial<Opportunity>): Promise<Opportunity> {
    const opp = await this.findOne(id);
    Object.assign(opp, oppData);
    await this.opportunityRepository.save(opp);
    return this.findOne(id);
  }

  async moveStage(id: string, stage: OpportunityStage): Promise<{
    opportunity: Opportunity;
    createdProposal?: any;
    createdWork?: any;
    createdPayment?: any;
  }> {
    const opp = await this.findOne(id);
    const previousStage = opp.stage;
    opp.stage = stage;

    let createdProposal: any = null;
    let createdWork: any = null;
    let createdPayment: any = null;

    // PROPOSAL stage → auto-create proposal
    if (stage === OpportunityStage.PROPOSAL && previousStage !== OpportunityStage.PROPOSAL) {
      try {
        const proposalData: any = {
          title: `Proposta - ${opp.title}`,
          opportunityId: opp.id,
          clientId: opp.clientId || null,
          discount: 0,
        };
        const items = [{
          description: opp.serviceType || opp.title,
          serviceType: opp.serviceType || 'Serviço',
          unitPrice: Number(opp.estimatedValue) || 0,
          quantity: 1,
        }];
        createdProposal = await this.proposalsService.create(proposalData, items);
      } catch (error) {
        console.error('Erro ao auto-criar proposta:', error);
      }
    }

    // CLOSED_WON → auto-create work + payment
    if (stage === OpportunityStage.CLOSED_WON && previousStage !== OpportunityStage.CLOSED_WON) {
      opp.actualCloseDate = new Date();

      try {
        // Create Work (obra)
        createdWork = await this.worksService.create({
          title: opp.title,
          clientId: opp.clientId || undefined,
          opportunityId: opp.id,
          description: opp.description || `Obra originada da oportunidade: ${opp.title}`,
          totalValue: Number(opp.estimatedValue) || 0,
          type: 'commercial' as any,
          status: 'approved' as any,
        });

        // Create Payment (financeiro)
        if (createdWork && (Number(opp.estimatedValue) > 0 || Number(opp.actualValue) > 0)) {
          const paymentAmount = Number(opp.actualValue) || Number(opp.estimatedValue) || 0;
          createdPayment = await this.financeService.create({
            workId: createdWork.id,
            description: `Pagamento - ${opp.title}`,
            amount: paymentAmount,
            status: 'pending' as any,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });
        }
      } catch (error) {
        console.error('Erro ao auto-criar obra/pagamento:', error);
      }
    }

    await this.opportunityRepository.save(opp);
    const updatedOpp = await this.findOne(id);

    return {
      opportunity: updatedOpp,
      createdProposal,
      createdWork,
      createdPayment,
    };
  }

  async remove(id: string): Promise<void> {
    const opp = await this.findOne(id);
    await this.opportunityRepository.remove(opp);
  }
}
