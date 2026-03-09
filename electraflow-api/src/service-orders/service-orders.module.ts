import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrder } from './service-order.entity';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';
import { WorkCost } from '../finance/work-cost.entity';
import { Notification } from '../notifications/notification.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ServiceOrder, WorkCost, Notification])],
    controllers: [ServiceOrdersController],
    providers: [ServiceOrdersService],
    exports: [ServiceOrdersService],
})
export class ServiceOrdersModule { }
