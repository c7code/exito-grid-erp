import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Payment } from './payment.entity';
import { Measurement } from './measurement.entity';
import { MeasurementItem } from './measurement-item.entity';
import { WorkCost } from './work-cost.entity';
import { PaymentSchedule } from './payment-schedule.entity';
import { MeasurementsService } from './measurements.service';
import { MeasurementsController } from './measurements.controller';
import { Task } from '../tasks/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Measurement, MeasurementItem, Task, WorkCost, PaymentSchedule]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/invoices',
        filename: (_, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = file.originalname.split('.').pop();
          cb(null, `invoice-${unique}.${ext}`);
        },
      }),
    }),
  ],
  controllers: [FinanceController, MeasurementsController],
  providers: [FinanceService, MeasurementsService],
  exports: [FinanceService, MeasurementsService],
})
export class FinanceModule { }
