import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessesController } from './processes.controller';
import { ProcessesService } from './processes.service';
import { Process, ProcessStage, ChecklistItem } from './process.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Process, ProcessStage, ChecklistItem])],
  controllers: [ProcessesController],
  providers: [ProcessesService],
  exports: [ProcessesService],
})
export class ProcessesModule {}
