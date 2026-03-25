import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SinapiService } from './sinapi.service';

@ApiTags('SINAPI')
@Controller('sinapi')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SinapiController {
    constructor(private readonly sinapiService: SinapiService) {}

    // ═══ STATS ═══
    @Get('stats')
    @ApiOperation({ summary: 'Estatísticas do módulo SINAPI' })
    async getStats() {
        return this.sinapiService.getStats();
    }

    // ═══ INPUTS (INSUMOS) ═══
    @Get('inputs')
    @ApiOperation({ summary: 'Buscar insumos SINAPI' })
    async searchInputs(
        @Query('search') search?: string,
        @Query('type') type?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.sinapiService.searchInputs({
            search,
            type,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    @Get('inputs/:codeOrId')
    @ApiOperation({ summary: 'Buscar insumo por código ou ID' })
    async findInput(@Param('codeOrId') codeOrId: string) {
        // Tenta por código primeiro, depois por UUID
        const byCode = await this.sinapiService.findInputByCode(codeOrId);
        if (byCode) return byCode;
        return this.sinapiService.findInputById(codeOrId);
    }

    @Get('inputs/:id/prices')
    @ApiOperation({ summary: 'Histórico de preços de um insumo' })
    async getInputPrices(
        @Param('id') id: string,
        @Query('state') state?: string,
    ) {
        const input = await this.sinapiService.findInputByCode(id)
            || await this.sinapiService.findInputById(id);
        if (!input) return { prices: [] };
        return this.sinapiService.getInputPrices(input.id, state);
    }

    @Post('inputs/:id/link-catalog')
    @ApiOperation({ summary: 'Vincular insumo SINAPI ao catálogo interno' })
    async linkInputToCatalog(
        @Param('id') id: string,
        @Body('catalogItemId') catalogItemId: string,
    ) {
        return this.sinapiService.linkInputToCatalog(id, catalogItemId);
    }

    // ═══ COMPOSITIONS (COMPOSIÇÕES) ═══
    @Get('compositions')
    @ApiOperation({ summary: 'Buscar composições SINAPI' })
    async searchCompositions(
        @Query('search') search?: string,
        @Query('classCode') classCode?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.sinapiService.searchCompositions({
            search,
            classCode,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    @Get('compositions/:codeOrId')
    @ApiOperation({ summary: 'Buscar composição por código ou ID (com itens)' })
    async findComposition(@Param('codeOrId') codeOrId: string) {
        const byCode = await this.sinapiService.findCompositionByCode(codeOrId);
        if (byCode) return byCode;
        return this.sinapiService.findCompositionById(codeOrId);
    }

    @Get('compositions/:code/price')
    @ApiOperation({ summary: 'Preço da composição por UF' })
    async getCompositionPrice(
        @Param('code') code: string,
        @Query('state') state: string,
    ) {
        return this.sinapiService.getCompositionPriceByCode(code, state || 'SP');
    }

    // ═══ IMPORT ═══
    @Post('import/inputs')
    @ApiOperation({ summary: 'Importar insumos SINAPI (bulk)' })
    async importInputs(@Body() data: { inputs: any[] }) {
        const result = await this.sinapiService.importInputs(data.inputs);
        await this.sinapiService.setConfig('last_import_date', new Date().toISOString());
        return result;
    }

    @Post('import/prices')
    @ApiOperation({ summary: 'Importar preços SINAPI (bulk)' })
    async importPrices(@Body() data: { prices: any[] }) {
        return this.sinapiService.importPrices(data.prices);
    }

    @Post('import/compositions')
    @ApiOperation({ summary: 'Importar composições SINAPI (bulk)' })
    async importCompositions(@Body() data: { compositions: any[] }) {
        return this.sinapiService.importCompositions(data.compositions);
    }

    @Post('import/composition-prices')
    @ApiOperation({ summary: 'Importar preços de composições SINAPI (bulk)' })
    async importCompositionPrices(@Body() data: { prices: any[] }) {
        return this.sinapiService.importCompositionPrices(data.prices);
    }

    // ═══ CONFIG ═══
    @Get('config')
    @ApiOperation({ summary: 'Listar configurações SINAPI' })
    async getConfigs() {
        return this.sinapiService.getAllConfigs();
    }

    @Post('config')
    @ApiOperation({ summary: 'Salvar configuração SINAPI' })
    async setConfig(@Body() data: { key: string; value: string }) {
        return this.sinapiService.setConfig(data.key, data.value);
    }
}
