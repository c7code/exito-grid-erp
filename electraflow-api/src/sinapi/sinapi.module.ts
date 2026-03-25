import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinapiController } from './sinapi.controller';
import { SinapiService } from './sinapi.service';
import { SinapiImportService } from './sinapi-import.service';
import { SinapiCompositionEngine } from './sinapi-engine.service';
import { SinapiPricingService } from './sinapi-pricing.service';
import { SinapiProposalService } from './sinapi-proposal.service';
import { SinapiReference } from './entities/sinapi-reference.entity';
import { SinapiInput } from './entities/sinapi-input.entity';
import { SinapiInputPrice } from './entities/sinapi-price.entity';
import { SinapiComposition } from './entities/sinapi-composition.entity';
import { SinapiCompositionItem } from './entities/sinapi-composition-item.entity';
import { SinapiCompositionCost } from './entities/sinapi-composition-price.entity';
import { SinapiConfig } from './entities/sinapi-config.entity';
import { SinapiBudgetLink } from './entities/sinapi-budget-link.entity';
import { SinapiImportLog } from './entities/sinapi-import-log.entity';
import { SinapiPricingProfile } from './entities/sinapi-pricing-profile.entity';
import { Proposal, ProposalItem } from '../proposals/proposal.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SinapiReference,
            SinapiInput,
            SinapiInputPrice,
            SinapiComposition,
            SinapiCompositionItem,
            SinapiCompositionCost,
            SinapiConfig,
            SinapiBudgetLink,
            SinapiImportLog,
            SinapiPricingProfile,
            Proposal,
            ProposalItem,
        ]),
    ],
    controllers: [SinapiController],
    providers: [SinapiService, SinapiImportService, SinapiCompositionEngine, SinapiPricingService, SinapiProposalService],
    exports: [SinapiService, SinapiImportService, SinapiCompositionEngine, SinapiPricingService, SinapiProposalService],
})
export class SinapiModule {}
