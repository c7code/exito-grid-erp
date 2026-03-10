import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarkupConfig } from './markup.entity';
import { MarkupService } from './markup.service';
import { MarkupController } from './markup.controller';

@Module({
    imports: [TypeOrmModule.forFeature([MarkupConfig])],
    controllers: [MarkupController],
    providers: [MarkupService],
    exports: [MarkupService],
})
export class MarkupModule { }
