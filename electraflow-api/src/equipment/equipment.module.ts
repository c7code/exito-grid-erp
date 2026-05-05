import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment, EquipmentRental, EquipmentMaintenance, EquipmentDailyLog, EquipmentService, EquipmentChecklist } from './equipment.entity';
import { EquipmentService as EquipmentSvc } from './equipment.service';
import { EquipmentController } from './equipment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Equipment, EquipmentRental, EquipmentMaintenance,
    EquipmentDailyLog, EquipmentService, EquipmentChecklist,
  ])],
  providers: [EquipmentSvc],
  controllers: [EquipmentController],
  exports: [EquipmentSvc],
})
export class EquipmentModule {}
