import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SolarService } from './solar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('solar-projects')
@UseGuards(JwtAuthGuard)
export class SolarController {
    constructor(private readonly solarService: SolarService) { }

    @Get()
    findAll() {
        return this.solarService.findAll();
    }

    @Get('hsp-table')
    getHspTable() {
        return this.solarService.getHspTable();
    }

    @Get('catalog-equipment')
    searchCatalogEquipment(@Query('q') query?: string) {
        return this.solarService.searchCatalogEquipment(query);
    }

    @Get('by-proposal/:proposalId')
    findByProposalId(@Param('proposalId') proposalId: string) {
        return this.solarService.findByProposalId(proposalId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.solarService.findOne(id);
    }

    @Post()
    create(@Body() data: any, @Request() req) {
        return this.solarService.create({ ...data, createdById: req.user?.userId || req.user?.id });
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.solarService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.solarService.remove(id);
    }

    @Post(':id/dimension')
    dimensionSystem(@Param('id') id: string) {
        return this.solarService.dimensionSystem(id);
    }

    @Post(':id/calculate-financials')
    calculateFinancials(@Param('id') id: string) {
        return this.solarService.calculateFinancials(id);
    }

    @Post(':id/generate-proposal')
    generateProposal(@Param('id') id: string) {
        return this.solarService.generateProposal(id);
    }
}
