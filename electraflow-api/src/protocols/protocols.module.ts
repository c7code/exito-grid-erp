import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtocolsController } from './protocols.controller';
import { ProtocolsService } from './protocols.service';
import { Protocol } from './protocol.entity';
import { ProtocolEvent } from './protocol-event.entity';
import { ProtocolAttachment } from './protocol-attachment.entity';
import { WorksModule } from '../works/works.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Protocol, ProtocolEvent, ProtocolAttachment]),
    WorksModule,
  ],
  controllers: [ProtocolsController],
  providers: [ProtocolsService],
  exports: [ProtocolsService],
})
export class ProtocolsModule { }
