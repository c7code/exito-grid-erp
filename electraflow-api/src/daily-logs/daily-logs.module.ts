import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyLog } from './daily-log.entity';
import { DailyLogRequest } from './daily-log-request.entity';
import { DailyLogResponse } from './daily-log-response.entity';
import { DailyLogsController } from './daily-logs.controller';
import { DailyLogsService } from './daily-logs.service';

@Module({
    imports: [TypeOrmModule.forFeature([DailyLog, DailyLogRequest, DailyLogResponse])],
    controllers: [DailyLogsController],
    providers: [DailyLogsService],
    exports: [DailyLogsService],
})
export class DailyLogsModule { }
