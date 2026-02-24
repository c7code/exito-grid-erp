import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalsController, ProposalPublicController } from './proposals.controller';
import { ProposalsService } from './proposals.service';
import { Proposal, ProposalItem } from './proposal.entity';
import { Client } from '../clients/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, ProposalItem, Client])],
  controllers: [ProposalsController, ProposalPublicController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule { }
