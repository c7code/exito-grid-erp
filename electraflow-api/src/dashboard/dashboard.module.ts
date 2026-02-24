import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Lead } from '../leads/lead.entity';
import { Opportunity } from '../opportunities/opportunity.entity';
import { Work } from '../works/work.entity';
import { Task } from '../tasks/task.entity';
import { Protocol } from '../protocols/protocol.entity';
import { Payment } from '../finance/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Opportunity, Work, Task, Protocol, Payment])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
