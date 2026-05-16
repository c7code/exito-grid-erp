import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { PartnerRequest, PartnerRequestMessage } from './partner-request.entity';
import { PartnerRequestsService } from './partner-requests.service';
import { PartnerRequestsController } from './partner-requests.controller';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PartnerRequest, PartnerRequestMessage]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ReferralsModule, // para usar ReferralsService (buscar perfil do parceiro)
  ],
  controllers: [PartnerRequestsController],
  providers: [PartnerRequestsService],
  exports: [PartnerRequestsService],
})
export class PartnerRequestsModule {}
