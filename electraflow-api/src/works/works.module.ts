import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';
import { Work } from './work.entity';
import { WorkUpdate } from './work-update.entity';
import { Client } from '../clients/client.entity';
import { Employee } from '../employees/employee.entity';
import { TaskResolver } from '../tasks/task-resolver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Work, WorkUpdate, Client, Employee, TaskResolver])],
  controllers: [WorksController],
  providers: [WorksService],
  exports: [WorksService],
})
export class WorksModule { }
