import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolarMonthlyReport } from './solar-monthly-report.entity';
import { SolarReportsService } from './solar-reports.service';
import { SolarReportsController } from './solar-reports.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SolarMonthlyReport])],
    controllers: [SolarReportsController],
    providers: [SolarReportsService],
    exports: [SolarReportsService],
})
export class SolarReportsModule {}
