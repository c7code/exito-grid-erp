import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeadlineApprovalsService } from './deadline-approvals.service';
import { DeadlineApprovalsController } from './deadline-approvals.controller';
import { DeadlineApproval } from './deadline-approval.entity';
import { TasksModule } from '../tasks/tasks.module';
import { WorksModule } from '../works/works.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeadlineApproval]),
    TasksModule,
    WorksModule,
  ],
  providers: [DeadlineApprovalsService],
  controllers: [DeadlineApprovalsController],
  exports: [DeadlineApprovalsService],
})
export class DeadlineApprovalsModule {}
