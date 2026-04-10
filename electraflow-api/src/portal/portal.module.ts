import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalPublication } from './portal-publication.entity';
import { PortalPublicationsService } from './portal-publications.service';
import { PortalPublicationsController, ClientPortalPublicationsController } from './portal-publications.controller';
import { ClientSubUser } from './client-sub-user.entity';
import { ClientSubUsersService } from './client-sub-users.service';
import { AdminClientSubUsersController, ClientSubUsersController } from './client-sub-users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PortalPublication, ClientSubUser])],
  controllers: [
    PortalPublicationsController,
    ClientPortalPublicationsController,
    AdminClientSubUsersController,
    ClientSubUsersController,
  ],
  providers: [PortalPublicationsService, ClientSubUsersService],
  exports: [PortalPublicationsService, ClientSubUsersService],
})
export class PortalModule {}
