import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplyService } from './supply.service';
import { SupplyController } from './supply.controller';
import {
    Supplier,
    SupplierContact,
    QuotationRequest,
    QuotationItem,
    QuotationResponse,
    QuotationResponseItem,
    PriceHistory,
} from './supply.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Supplier,
            SupplierContact,
            QuotationRequest,
            QuotationItem,
            QuotationResponse,
            QuotationResponseItem,
            PriceHistory,
        ]),
    ],
    controllers: [SupplyController],
    providers: [SupplyService],
    exports: [SupplyService],
})
export class SupplyModule { }
