import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ReferralConsultant,
  ReferralLead,
  ReferralCommitment,
  ReferralFollowup,
  ReferralCommission,
  LeadDocument,
  BroadcastDocument,
} from './referral.entity';

import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PartnerJwtStrategy } from './partner-jwt.strategy';
import { SupabaseStorageService } from '../documents/supabase-storage.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ReferralConsultant,
      ReferralLead,
      ReferralCommitment,
      ReferralFollowup,
      ReferralCommission,
      LeadDocument,
      BroadcastDocument,
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'electraflow-secret-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService, PartnerJwtStrategy, SupabaseStorageService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
