import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OemService } from './oem.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('oem')
@UseGuards(JwtAuthGuard)
export class OemController {
    constructor(private readonly oemService: OemService) {}

    // ═══ DASHBOARD ═══════════════════════════════════════════════════
    @Get('dashboard')
    getDashboard() { return this.oemService.getDashboard(); }

    // ═══ USINAS ══════════════════════════════════════════════════════
    @Get('usinas')
    findAllUsinas(@Query('clienteId') clienteId?: string) {
        return this.oemService.findAllUsinas(clienteId);
    }

    @Get('usinas/:id')
    findOneUsina(@Param('id') id: string) { return this.oemService.findOneUsina(id); }

    @Post('usinas')
    createUsina(@Body() data: any) { return this.oemService.createUsina(data); }

    @Post('usinas/import-from-solar/:projectId')
    importFromSolar(@Param('projectId') projectId: string) {
        return this.oemService.importFromSolar(projectId);
    }

    @Put('usinas/:id')
    updateUsina(@Param('id') id: string, @Body() data: any) {
        return this.oemService.updateUsina(id, data);
    }

    @Delete('usinas/:id')
    removeUsina(@Param('id') id: string) { return this.oemService.removeUsina(id); }

    // ═══ PLANOS ══════════════════════════════════════════════════════
    @Get('planos')
    findAllPlanos() { return this.oemService.findAllPlanos(); }

    @Get('planos/:id')
    findOnePlano(@Param('id') id: string) { return this.oemService.findOnePlano(id); }

    @Post('planos')
    createPlano(@Body() data: any) { return this.oemService.createPlano(data); }

    @Put('planos/:id')
    updatePlano(@Param('id') id: string, @Body() data: any) {
        return this.oemService.updatePlano(id, data);
    }

    @Delete('planos/:id')
    removePlano(@Param('id') id: string) { return this.oemService.removePlano(id); }

    // ═══ CONTRATOS ═══════════════════════════════════════════════════
    @Get('contratos')
    findAllContratos(@Query('status') status?: string) {
        return this.oemService.findAllContratos(status);
    }

    @Get('contratos/:id')
    findOneContrato(@Param('id') id: string) { return this.oemService.findOneContrato(id); }

    @Post('contratos')
    createContrato(@Body() data: any) { return this.oemService.createContrato(data); }

    @Post('contratos/calculate-price')
    calculatePrice(@Body() body: { usinaId: string; planoId: string }) {
        return this.oemService.calculatePrice(body.usinaId, body.planoId);
    }

    @Put('contratos/:id')
    updateContrato(@Param('id') id: string, @Body() data: any) {
        return this.oemService.updateContrato(id, data);
    }

    @Delete('contratos/:id')
    removeContrato(@Param('id') id: string) { return this.oemService.removeContrato(id); }
}
