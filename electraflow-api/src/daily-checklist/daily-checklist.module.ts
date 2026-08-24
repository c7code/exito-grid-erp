import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DailyChecklist, DailyChecklistItem } from "./daily-checklist.entity";
import { DailyChecklistService } from "./daily-checklist.service";
import { DailyChecklistController } from "./daily-checklist.controller";

@Module({
  imports: [TypeOrmModule.forFeature([DailyChecklist, DailyChecklistItem])],
  controllers: [DailyChecklistController],
  providers: [DailyChecklistService],
  exports: [DailyChecklistService],
})
export class DailyChecklistModule {}
