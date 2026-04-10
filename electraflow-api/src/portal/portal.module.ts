import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalPublication } from './portal-publication.entity';
import { PortalPublicationsService } from './portal-publications.service';
import { PortalPublicationsController, ClientPortalPublicationsController } from './portal-publications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PortalPublication])],
  controllers: [PortalPublicationsController, ClientPortalPublicationsController],
  providers: [PortalPublicationsService],
  exports: [PortalPublicationsService],
})
export class PortalModule {}
