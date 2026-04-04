import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignatureSlot } from './signature-slot.entity';
import { DocumentSignature } from './document-signature.entity';
import { SignaturesService } from './signatures.service';
import { SignaturesController } from './signatures.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SignatureSlot, DocumentSignature])],
  controllers: [SignaturesController],
  providers: [SignaturesService],
  exports: [SignaturesService],
})
export class SignaturesModule {}
