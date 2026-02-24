import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController, ClientPortalController } from './clients.controller';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { ClientDocument } from './client-document.entity';
import { ClientRequest } from './client-request.entity';
import { RequestAttachment } from './request-attachment.entity';
import { Work } from '../works/work.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, ClientDocument, ClientRequest, RequestAttachment, Work, User])],
  controllers: [ClientsController, ClientPortalController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule { }

