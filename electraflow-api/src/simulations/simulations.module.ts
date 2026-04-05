import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimulationSession } from './simulation-session.entity';
import { SimulationException } from './simulation-exception.entity';
import { AuditLog } from '../compliance/audit-log.entity';
import { SimulationsService } from './simulations.service';
import { SimulationsController } from './simulations.controller';
import { SimulationExceptionsService } from './simulation-exceptions.service';
import { SimulationExceptionsController } from './simulation-exceptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SimulationSession, SimulationException, AuditLog])],
  controllers: [SimulationsController, SimulationExceptionsController],
  providers: [SimulationsService, SimulationExceptionsService],
  exports: [SimulationsService, SimulationExceptionsService],
})
export class SimulationsModule {}
