import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CatalogCategory, CatalogItem } from './catalog.entity';
import { CatalogGroupingItem } from './catalog-grouping-item.entity';
import { NcmCode } from './ncm.entity';
import { ProductSupplier } from './product-supplier.entity';
import { StockMovement } from './stock-movement.entity';
import { FiscalRule } from './fiscal-rule.entity';
import { CatalogService } from './catalog.service';
import { CatalogImportService } from './catalog-import.service';
import { CatalogController } from './catalog.controller';
import { seedNcm } from './seed-ncm';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CatalogCategory,
            CatalogItem,
            CatalogGroupingItem,
            NcmCode,
            ProductSupplier,
            StockMovement,
            FiscalRule,
        ]),
    ],
    controllers: [CatalogController],
    providers: [CatalogService, CatalogImportService],
    exports: [CatalogService, CatalogImportService],
})
export class CatalogModule implements OnModuleInit {
    constructor(private dataSource: DataSource) { }

    async onModuleInit() {
        // Seed NCM codes on app startup (idempotent)
        try {
            await seedNcm(this.dataSource);
        } catch (error) {
            console.warn('NCM seed warning:', error.message);
        }
    }
}
