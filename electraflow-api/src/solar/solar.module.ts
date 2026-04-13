import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolarController } from './solar.controller';
import { SolarService } from './solar.service';
import { SolarProject } from './solar-project.entity';
import { SolarPlan, SolarPlanSubscription, SolarPlanInstallment } from './solar-plan.entity';
import { SolarPlanController } from './solar-plan.controller';
import { SolarPlanService } from './solar-plan.service';
import { Client } from '../clients/client.entity';
import { CatalogItem } from '../catalog/catalog.entity';
import { Proposal, ProposalItem } from '../proposals/proposal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        SolarProject, Client, CatalogItem, Proposal, ProposalItem,
        SolarPlan, SolarPlanSubscription, SolarPlanInstallment,
    ])],
    controllers: [SolarController, SolarPlanController],
    providers: [SolarService, SolarPlanService],
    exports: [SolarService, SolarPlanService],
})
export class SolarModule { }
