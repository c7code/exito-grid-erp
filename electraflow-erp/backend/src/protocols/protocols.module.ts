import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtocolsService } from './protocols.service';
import { ProtocolsController } from './protocols.controller';
import { Protocol } from './protocol.entity';
import { ProtocolEvent } from './protocol-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Protocol, ProtocolEvent])],
  providers: [ProtocolsService],
  controllers: [ProtocolsController],
  exports: [ProtocolsService],
})
export class ProtocolsModule { }
