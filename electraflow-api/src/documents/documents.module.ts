import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { Document, DocumentFolder } from './document.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Document, DocumentFolder]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, SupabaseStorageService],
  exports: [DocumentsService],
})
export class DocumentsModule { }
