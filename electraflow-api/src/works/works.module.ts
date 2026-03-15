import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';
import { Work } from './work.entity';
import { WorkUpdate } from './work-update.entity';
import { WorkPhase } from './work-phase.entity';
import { WorkTypeConfig } from './work-type-config.entity';
import { Client } from '../clients/client.entity';
import { Employee } from '../employees/employee.entity';
import { Task } from '../tasks/task.entity';
import { TaskResolver } from '../tasks/task-resolver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Work, WorkUpdate, WorkPhase, WorkTypeConfig, Client, Employee, Task, TaskResolver])],
  controllers: [WorksController],
  providers: [WorksService],
  exports: [WorksService],
})
export class WorksModule { }
