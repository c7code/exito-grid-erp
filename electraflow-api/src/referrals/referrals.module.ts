import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ReferralConsultant,
  ReferralLead,
  ReferralCommitment,
  ReferralFollowup,
  ReferralCommission,
} from './referral.entity';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReferralConsultant,
      ReferralLead,
      ReferralCommitment,
      ReferralFollowup,
      ReferralCommission,
    ]),
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
