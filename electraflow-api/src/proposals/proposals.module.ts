import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalsController, ProposalPublicController } from './proposals.controller';
import { ProposalsService } from './proposals.service';
import { Proposal, ProposalItem } from './proposal.entity';
import { ProposalRevision } from './proposal-revision.entity';
import { Client } from '../clients/client.entity';
import { Work } from '../works/work.entity';
import { Notification } from '../notifications/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, ProposalItem, ProposalRevision, Client, Work, Notification])],
  controllers: [ProposalsController, ProposalPublicController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule { }
