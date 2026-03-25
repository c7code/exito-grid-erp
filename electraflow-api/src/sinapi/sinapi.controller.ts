import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SinapiService } from './sinapi.service';
import { SinapiImportService } from './sinapi-import.service';
import { SinapiCompositionEngine } from './sinapi-engine.service';
import { SinapiPricingService } from './sinapi-pricing.service';
import { SinapiProposalService } from './sinapi-proposal.service';

@ApiTags('SINAPI')
@Controller('sinapi')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SinapiController {
    constructor(
        private readonly sinapiService: SinapiService,
        private readonly importService: SinapiImportService,
        private readonly engine: SinapiCompositionEngine,
        private readonly pricingService: SinapiPricingService,
        private readonly proposalService: SinapiProposalService,
    ) {}

    // ═══ STATS ═══
    @Get('stats')
    @ApiOperation({ summary: 'Estatísticas do módulo SINAPI' })
    async getStats() { return this.sinapiService.getStats(); }

    // ═══ REFERENCES ═══
    @Get('references')
    @ApiOperation({ summary: 'Listar referências mensais' })
    async getReferences(@Query('state') state?: string) {
        return this.sinapiService.findAllReferences(state);
    }

    @Get('references/active')
    @ApiOperation({ summary: 'Referência ativa para UF' })
    async getActiveReference(@Query('state') state: string) {
        return this.sinapiService.findActiveReference(state || 'PE');
    }

    @Post('references')
    @ApiOperation({ summary: 'Criar referência mensal' })
    async createReference(@Body() data: { year: number; month: number; state: string; label?: string; publishedAt?: string; source?: string }) {
        return this.sinapiService.createReference(data);
    }

    @Delete('references/:id')
    @ApiOperation({ summary: 'Excluir referência e dados vinculados' })
    async deleteReference(@Param('id') id: string) {
        await this.sinapiService.deleteReference(id);
        return { message: 'Referência excluída' };
    }

    // ═══ INPUTS ═══
    @Get('inputs')
    @ApiOperation({ summary: 'Buscar insumos SINAPI' })
    async searchInputs(
        @Query('search') search?: string,
        @Query('type') type?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.sinapiService.searchInputs({
            search, type,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    @Get('inputs/:codeOrId')
    @ApiOperation({ summary: 'Buscar insumo por código ou ID' })
    async findInput(@Param('codeOrId') codeOrId: string) {
        return (await this.sinapiService.findInputByCode(codeOrId))
            || this.sinapiService.findInputById(codeOrId);
    }

    @Get('inputs/:id/prices')
    @ApiOperation({ summary: 'Histórico de preços de um insumo' })
    async getInputPrices(@Param('id') id: string, @Query('state') state?: string) {
        const input = (await this.sinapiService.findInputByCode(id)) || (await this.sinapiService.findInputById(id));
        if (!input) return [];
        return this.sinapiService.getInputPriceHistory(input.id, state);
    }

    @Post('inputs/:id/link-catalog')
    @ApiOperation({ summary: 'Vincular insumo ao catálogo interno' })
    async linkInputToCatalog(@Param('id') id: string, @Body('catalogItemId') catalogItemId: string) {
        return this.sinapiService.linkInputToCatalog(id, catalogItemId);
    }

    // ═══ COMPOSITIONS ═══
    @Get('compositions')
    @ApiOperation({ summary: 'Buscar composições SINAPI' })
    async searchCompositions(
        @Query('search') search?: string,
        @Query('classCode') classCode?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.sinapiService.searchCompositions({
            search, classCode,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    @Get('compositions/:codeOrId')
    @ApiOperation({ summary: 'Composição com itens' })
    async findComposition(@Param('codeOrId') codeOrId: string) {
        return (await this.sinapiService.findCompositionByCode(codeOrId))
            || this.sinapiService.findCompositionById(codeOrId);
    }

    @Get('compositions/:codeOrId/cost')
    @ApiOperation({ summary: 'Custo da composição por UF' })
    async getCompositionCost(@Param('codeOrId') codeOrId: string, @Query('state') state: string) {
        return this.sinapiService.getCompositionCostByCode(codeOrId, state || 'PE');
    }

    @Get('compositions/:id/cost-history')
    @ApiOperation({ summary: 'Histórico de custos da composição' })
    async getCompositionCostHistory(@Param('id') id: string, @Query('state') state?: string) {
        return this.sinapiService.getCompositionCostHistory(id, state);
    }

    // ═══ INSUMO + PREÇO ATIVO ═══
    @Get('inputs/:codeOrId/price')
    @ApiOperation({ summary: 'Insumo com preço na referência ativa (por UF)' })
    async getInputWithPrice(@Param('codeOrId') codeOrId: string, @Query('state') state: string) {
        return this.sinapiService.getInputWithPrice(codeOrId, state || 'PE');
    }

    // ═══ ÁRVORE DA COMPOSIÇÃO ═══
    @Get('compositions/:codeOrId/tree')
    @ApiOperation({ summary: 'Árvore recursiva da composição com preços' })
    async getCompositionTree(
        @Param('codeOrId') codeOrId: string,
        @Query('state') state: string,
        @Query('maxDepth') maxDepth?: string,
    ) {
        return this.sinapiService.getCompositionTree(codeOrId, state || 'PE', maxDepth ? parseInt(maxDepth) : 5);
    }

    // ═══ COMPOSIÇÃO COMPLETA (dados + árvore + custo consolidado) ═══
    @Get('compositions/:codeOrId/full')
    @ApiOperation({ summary: 'Composição completa: dados + árvore + custo consolidado + histórico' })
    async getCompositionFull(
        @Param('codeOrId') codeOrId: string,
        @Query('state') state: string,
        @Query('referenceId') referenceId?: string,
    ) {
        return this.sinapiService.getCompositionFull(codeOrId, state || 'PE', referenceId);
    }    // ═══ BUDGET LINKS ═══
    @Get('budget-links/:proposalId')
    @ApiOperation({ summary: 'Vínculos SINAPI de uma proposta' })
    async getBudgetLinks(@Param('proposalId') proposalId: string) {
        return this.sinapiService.getBudgetLinks(proposalId);
    }

    @Post('budget-links')
    @ApiOperation({ summary: 'Vincular item a composição SINAPI' })
    async createBudgetLink(@Body() data: any) {
        return this.sinapiService.createBudgetLink(data);
    }

    @Delete('budget-links/:id')
    @ApiOperation({ summary: 'Remover vínculo orçamento ↔ SINAPI' })
    async deleteBudgetLink(@Param('id') id: string) {
        return this.sinapiService.deleteBudgetLink(id);
    }

    @Post('budget-links/:id/update-reference')
    @ApiOperation({ summary: 'Reajustar vínculo para nova referência' })
    async updateBudgetLinkRef(@Param('id') id: string, @Body('referenceId') referenceId: string) {
        return this.sinapiService.updateBudgetLinkReference(id, referenceId);
    }

    // ═══════════════════════════════════════════════════════════════
    // FILE IMPORT (UPLOAD)
    // ═══════════════════════════════════════════════════════════════

    @Post('import/preview')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Preview: mostra colunas e primeiras linhas do arquivo sem importar' })
    async previewFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('Arquivo não enviado');
        const XLSX = require('xlsx');
        const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true, cellNF: true });
        const result: any[] = [];
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
            result.push({
                sheetName,
                rowCount: rows.length,
                columns: rows.length > 0 ? Object.keys(rows[0]) : [],
                sampleRows: rows.slice(0, 3),
            });
        }
        return { fileName: file.originalname, sheets: result };
    }

    @Post('import/upload')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
        storage: require('multer').memoryStorage(),
    }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Importar arquivo SINAPI (XLSX/CSV)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                state: { type: 'string', description: 'UF (detecção automática se vazio)' },
                year: { type: 'number' },
                month: { type: 'number' },
                taxRegime: { type: 'string', enum: ['desonerado', 'nao_desonerado'] },
                fileType: { type: 'string', enum: ['inputs', 'compositions', 'prices', 'composition_prices', 'mixed'] },
            },
        },
    })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('state') state?: string,
        @Body('year') year?: string,
        @Body('month') month?: string,
        @Body('taxRegime') taxRegime?: string,
        @Body('fileType') fileType?: string,
    ) {
        console.log('📤 SINAPI upload received:', {
            hasFile: !!file,
            fileName: file?.originalname,
            fileSize: file?.size,
            state, year, month, taxRegime, fileType,
        });

        if (!file) {
            throw new BadRequestException('Arquivo não enviado. Verifique se o campo "file" está presente no FormData.');
        }

        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
            throw new BadRequestException('Formato inválido. Aceitos: .xlsx, .xls, .csv');
        }

        return this.importService.importFile(file, {
            state: state || undefined,
            year: year ? parseInt(year) : undefined,
            month: month ? parseInt(month) : undefined,
            taxRegime: taxRegime || undefined,
            fileType: fileType || undefined,
        });
    }

    // ═══ IMPORT LOGS ═══
    @Get('import/logs')
    @ApiOperation({ summary: 'Listar logs de importação' })
    async getImportLogs(@Query('limit') limit?: string) {
        return this.importService.getImportLogs(limit ? parseInt(limit) : 50);
    }

    @Get('import/logs/:id')
    @ApiOperation({ summary: 'Detalhes de um log' })
    async getImportLog(@Param('id') id: string) {
        return this.importService.getImportLog(id);
    }

    @Post('import/rollback/:logId')
    @ApiOperation({ summary: 'Rollback de uma importação' })
    async rollbackImport(@Param('logId') logId: string) {
        return this.importService.rollbackImport(logId);
    }

    @Delete('import/logs/:id')
    @ApiOperation({ summary: 'Excluir log de importação' })
    async deleteImportLog(@Param('id') id: string) {
        return this.importService.deleteImportLog(id);
    }

    // ═══ BULK IMPORT (JSON — backwards compatible) ═══
    @Post('import/inputs')
    @ApiOperation({ summary: 'Importar insumos (JSON bulk)' })
    async importInputs(@Body() data: { inputs: any[] }) {
        return this.sinapiService.importInputs(data.inputs);
    }

    @Post('import/input-prices/:referenceId')
    @ApiOperation({ summary: 'Importar preços de insumos (JSON)' })
    async importInputPrices(@Param('referenceId') referenceId: string, @Body() data: { prices: any[] }) {
        return this.sinapiService.importInputPrices(referenceId, data.prices);
    }

    @Post('import/compositions')
    @ApiOperation({ summary: 'Importar composições (JSON)' })
    async importCompositions(@Body() data: { compositions: any[] }) {
        return this.sinapiService.importCompositions(data.compositions);
    }

    @Post('import/composition-costs/:referenceId')
    @ApiOperation({ summary: 'Importar custos de composições (JSON)' })
    async importCompositionCosts(@Param('referenceId') referenceId: string, @Body() data: { costs: any[] }) {
        return this.sinapiService.importCompositionCosts(referenceId, data.costs);
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPOSITION ENGINE (Motor de cálculo)
    // ═══════════════════════════════════════════════════════════════

    @Post('engine/calculate')
    @ApiOperation({ summary: 'Calcular composição — memória de cálculo completa' })
    async engineCalculate(@Body() data: {
        codeOrId: string;
        state: string;
        referenceId?: string;
        maxDepth?: number;
        taxRegime?: 'desonerado' | 'nao_desonerado';
    }) {
        return this.engine.calculate(data.codeOrId, data.state || 'PE', {
            referenceId: data.referenceId,
            maxDepth: data.maxDepth,
            taxRegime: data.taxRegime,
        });
    }

    @Post('engine/calculate-batch')
    @ApiOperation({ summary: 'Calcular várias composições de uma vez' })
    async engineCalculateBatch(@Body() data: {
        codes: string[];
        state: string;
        referenceId?: string;
        taxRegime?: 'desonerado' | 'nao_desonerado';
    }) {
        return this.engine.calculateBatch(data.codes, data.state || 'PE', {
            referenceId: data.referenceId,
            taxRegime: data.taxRegime,
        });
    }

    // ═══ CONFIG ═══
    @Get('config')
    @ApiOperation({ summary: 'Listar configurações' })
    async getConfigs() { return this.sinapiService.getConfigs(); }

    @Post('config')
    @ApiOperation({ summary: 'Salvar configuração' })
    async setConfig(@Body() data: { key: string; value: string }) {
        return this.sinapiService.setConfig(data.key, data.value);
    }

    // ═══════════════════════════════════════════════════════════════
    // PRICING PROFILES (Perfis de Precificação)
    // ═══════════════════════════════════════════════════════════════

    @Get('pricing/profiles')
    @ApiOperation({ summary: 'Listar perfis de precificação' })
    async listPricingProfiles() {
        return this.pricingService.findAllProfiles();
    }

    @Get('pricing/profiles/default')
    @ApiOperation({ summary: 'Perfil de precificação padrão' })
    async getDefaultProfile() {
        return this.pricingService.findDefaultProfile();
    }

    @Get('pricing/profiles/:id')
    @ApiOperation({ summary: 'Buscar perfil por ID' })
    async getPricingProfile(@Param('id') id: string) {
        return this.pricingService.findProfile(id);
    }

    @Post('pricing/profiles')
    @ApiOperation({ summary: 'Criar perfil de precificação' })
    async createPricingProfile(@Body() data: any) {
        return this.pricingService.createProfile(data);
    }

    @Put('pricing/profiles/:id')
    @ApiOperation({ summary: 'Atualizar perfil de precificação' })
    async updatePricingProfile(@Param('id') id: string, @Body() data: any) {
        return this.pricingService.updateProfile(id, data);
    }

    @Delete('pricing/profiles/:id')
    @ApiOperation({ summary: 'Excluir perfil de precificação' })
    async deletePricingProfile(@Param('id') id: string) {
        return this.pricingService.deleteProfile(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // PRICING CALCULATION (Cálculo de Preço Comercial)
    // ═══════════════════════════════════════════════════════════════

    @Post('pricing/calculate')
    @ApiOperation({ summary: 'Calcular preço comercial a partir de custo técnico' })
    async calculatePrice(@Body() data: {
        technicalCost: number;
        profileId?: string;
        quantity?: number;
        taxRegime?: 'desonerado' | 'nao_desonerado';
        materialCost?: number;
        laborCost?: number;
        equipmentCost?: number;
    }) {
        return this.pricingService.calculatePrice(
            data.technicalCost,
            data.profileId,
            {
                quantity: data.quantity,
                taxRegime: data.taxRegime,
                materialCost: data.materialCost,
                laborCost: data.laborCost,
                equipmentCost: data.equipmentCost,
            },
        );
    }

    @Post('pricing/calculate-from-composition')
    @ApiOperation({ summary: 'Calcular preço comercial a partir de composição SINAPI' })
    async calculateFromComposition(@Body() data: {
        codeOrId: string;
        state: string;
        profileId?: string;
        quantity?: number;
        referenceId?: string;
        taxRegime?: 'desonerado' | 'nao_desonerado';
        maxDepth?: number;
    }) {
        return this.pricingService.calculateFromComposition(
            data.codeOrId,
            data.state || 'PE',
            data.profileId,
            {
                quantity: data.quantity,
                referenceId: data.referenceId,
                taxRegime: data.taxRegime,
                maxDepth: data.maxDepth,
            },
        );
    }

    @Post('pricing/simulate')
    @ApiOperation({ summary: 'Simulação — variar um parâmetro e ver impacto no preço' })
    async simulatePricing(@Body() data: {
        technicalCost: number;
        profileId: string;
        field: string;
        values: number[];
    }) {
        return this.pricingService.simulate(data.technicalCost, data.profileId, {
            field: data.field,
            values: data.values,
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // PROPOSAL INTEGRATION (Integração com Propostas)
    // ═══════════════════════════════════════════════════════════════

    @Post('proposal/add-item')
    @ApiOperation({ summary: 'Adicionar item SINAPI a uma proposta' })
    async addSinapiItemToProposal(@Body() data: {
        proposalId: string;
        compositionCodeOrId: string;
        state: string;
        quantity: number;
        profileId?: string;
        referenceId?: string;
        taxRegime?: 'desonerado' | 'nao_desonerado';
        description?: string;
        notes?: string;
        overrideUnitPrice?: number;
    }) {
        return this.proposalService.addSinapiItem(data);
    }

    @Get('proposal/:proposalId/items')
    @ApiOperation({ summary: 'Listar itens SINAPI de uma proposta' })
    async getSinapiProposalItems(@Param('proposalId') proposalId: string) {
        return this.proposalService.getSinapiItems(proposalId);
    }

    @Post('proposal/item/:itemId/recalculate')
    @ApiOperation({ summary: 'Recalcular item SINAPI (nova referência ou perfil)' })
    async recalculateItem(
        @Param('itemId') itemId: string,
        @Body() data: { referenceId?: string; profileId?: string; state?: string; taxRegime?: 'desonerado' | 'nao_desonerado' },
    ) {
        return this.proposalService.recalculateItem(itemId, data);
    }

    @Post('proposal/:proposalId/recalculate-all')
    @ApiOperation({ summary: 'Recalcular todos os itens SINAPI da proposta' })
    async recalculateAll(
        @Param('proposalId') proposalId: string,
        @Body() data: { referenceId?: string; profileId?: string; state?: string; taxRegime?: 'desonerado' | 'nao_desonerado' },
    ) {
        return this.proposalService.recalculateAll(proposalId, data);
    }

    @Post('proposal/:proposalId/freeze')
    @ApiOperation({ summary: 'Congelar valores SINAPI da proposta (antes de emitir)' })
    async freezeProposalValues(@Param('proposalId') proposalId: string) {
        return this.proposalService.freezeProposalValues(proposalId);
    }

    @Delete('proposal/item/:itemId/unlink')
    @ApiOperation({ summary: 'Remover vínculo SINAPI de um item' })
    async unlinkSinapiItem(@Param('itemId') itemId: string) {
        return this.proposalService.unlinkSinapiItem(itemId);
    }
}
