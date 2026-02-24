import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Work } from '../works/work.entity';
import { Task } from '../tasks/task.entity';
import { Client } from '../clients/client.entity';
import { DeadlineApproval } from '../deadline-approvals/deadline-approval.entity';
import { Document } from '../documents/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Work, Task, Client, DeadlineApproval, Document]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
