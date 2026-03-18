import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig } from './system-config.entity';
import { AiActionToken } from './ai-action-token.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { CatalogItem } from '../catalog/catalog.entity';
import { Supplier } from '../supply/supply.entity';
import { StructureTemplate } from '../structure-templates/structure-template.entity';
import { MarkupConfig } from '../markup/markup.entity';
import { Document } from '../documents/document.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SystemConfig,
            AiActionToken,
            CatalogItem,
            Supplier,
            StructureTemplate,
            MarkupConfig,
            Document,
        ]),
    ],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
