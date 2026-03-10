import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StructureTemplate, StructureTemplateItem } from './structure-template.entity';
import { StructureTemplatesService } from './structure-templates.service';
import { StructureTemplatesController } from './structure-templates.controller';

@Module({
    imports: [TypeOrmModule.forFeature([StructureTemplate, StructureTemplateItem])],
    controllers: [StructureTemplatesController],
    providers: [StructureTemplatesService],
    exports: [StructureTemplatesService],
})
export class StructureTemplatesModule { }
