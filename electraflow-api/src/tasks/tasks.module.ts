import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { TaskResolver } from './task-resolver.entity';
import { Work } from '../works/work.entity';
import { Employee } from '../employees/employee.entity';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorksModule } from '../works/works.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskResolver, Work, Employee, User]),
    NotificationsModule,
    forwardRef(() => WorksModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule { }

