import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolarController } from './solar.controller';
import { SolarService } from './solar.service';
import { SolarProject } from './solar-project.entity';
import { Client } from '../clients/client.entity';
import { CatalogItem } from '../catalog/catalog.entity';
import { Proposal, ProposalItem } from '../proposals/proposal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SolarProject, Client, CatalogItem, Proposal, ProposalItem])],
    controllers: [SolarController],
    providers: [SolarService],
    exports: [SolarService],
})
export class SolarModule { }
