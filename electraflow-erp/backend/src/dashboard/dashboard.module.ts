import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Work } from '../works/work.entity';
import { Task } from '../tasks/task.entity';
import { Client } from '../clients/client.entity';
import { Opportunity } from '../opportunities/opportunity.entity';
import { Protocol } from '../protocols/protocol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Work, Task, Client, Opportunity, Protocol]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
