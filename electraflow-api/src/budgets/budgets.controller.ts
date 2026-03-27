import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { ParametricEngineService } from './parametric-engine.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRule } from './service-rule.entity';
import { CompanyFinancials } from './company-financials.entity';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
    constructor(
        private readonly service: BudgetsService,
        private readonly engine: ParametricEngineService,
        @InjectRepository(ServiceRule)
        private ruleRepo: Repository<ServiceRule>,
        @InjectRepository(CompanyFinancials)
        private financialsRepo: Repository<CompanyFinancials>,
    ) {}

    // ═══ BUDGETS CRUD ═══

    @Get()
    findAll(@Req() req: any) {
        return this.service.findAll(req.user?.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() data: any, @Req() req: any) {
        return this.service.create({ ...data, userId: req.user?.id, companyId: req.user?.companyId });
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.service.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }

    // ═══ ITEMS ═══

    @Post(':id/items')
    addItem(@Param('id') budgetId: string, @Body() data: any) {
        return this.service.addItem(budgetId, data);
    }

    @Put('items/:itemId')
    updateItem(@Param('itemId') itemId: string, @Body() data: any) {
        return this.service.updateItem(itemId, data);
    }

    @Delete('items/:itemId')
    removeItem(@Param('itemId') itemId: string) {
        return this.service.removeItem(itemId);
    }

    // ═══ SINAPI INTEGRATION ═══

    @Post(':id/sinapi/:code')
    addSinapiComposition(
        @Param('id') budgetId: string,
        @Param('code') compositionCode: string,
        @Query('state') state?: string,
    ) {
        return this.service.addSinapiComposition(budgetId, compositionCode, state);
    }

    @Post(':id/recalculate')
    recalculate(@Param('id') budgetId: string) {
        return this.service.recalculateParametric(budgetId);
    }

    // ═══ SERVICE RULES (Admin) ═══

    @Get('config/rules')
    async findAllRules() {
        return this.ruleRepo.find({ order: { sortOrder: 'ASC' } });
    }

    @Post('config/rules')
    async createRule(@Body() data: any) {
        const rule = this.ruleRepo.create(data);
        const saved = await this.ruleRepo.save(rule);
        this.engine.invalidateCache();
        return saved;
    }

    @Put('config/rules/:id')
    async updateRule(@Param('id') id: string, @Body() data: any) {
        await this.ruleRepo.update(id, data);
        this.engine.invalidateCache();
        return this.ruleRepo.findOne({ where: { id } });
    }

    @Delete('config/rules/:id')
    async deleteRule(@Param('id') id: string) {
        await this.ruleRepo.delete(id);
        this.engine.invalidateCache();
        return { deleted: true };
    }

    @Post('config/rules/test')
    async testRule(@Body() body: { description: string; state?: string }) {
        return this.engine.analyze(body.description, body.state || 'PE');
    }

    // ═══ COMPANY FINANCIALS ═══

    @Get('config/financials')
    async getFinancials() {
        let fin = await this.financialsRepo.findOne({ where: { isActive: true }, order: { createdAt: 'DESC' } });
        if (!fin) {
            fin = this.financialsRepo.create({ profileName: 'Padrão' });
            fin = await this.financialsRepo.save(fin);
        }
        return fin;
    }

    @Put('config/financials/:id')
    async updateFinancials(@Param('id') id: string, @Body() data: any) {
        // Auto-calculate BDI
        const bdi = (Number(data.adminCentralPercent) || 0) +
                     (Number(data.seguroPercent) || 0) +
                     (Number(data.riscoPercent) || 0) +
                     (Number(data.despesasFinanceirasPercent) || 0) +
                     (Number(data.lucroPercent) || 0) +
                     (Number(data.pisCofinPercent) || 0) +
                     (Number(data.issPercent) || 0) +
                     (Number(data.icmsPercent) || 0);
        await this.financialsRepo.update(id, { ...data, bdiCalculated: bdi });
        this.engine.invalidateCache();
        return this.financialsRepo.findOne({ where: { id } });
    }
}
