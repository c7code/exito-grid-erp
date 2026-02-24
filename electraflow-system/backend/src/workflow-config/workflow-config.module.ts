import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowConfigService } from './workflow-config.service';
import { WorkflowConfigController } from './workflow-config.controller';
import { WorkflowConfig } from './workflow-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowConfig])],
  providers: [WorkflowConfigService],
  controllers: [WorkflowConfigController],
  exports: [WorkflowConfigService],
})
export class WorkflowConfigModule {}
