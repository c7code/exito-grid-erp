import { Injectable, Logger, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Budget } from './budget.entity';
import { BudgetItem } from './budget-item.entity';
import { ParametricEngineService } from './parametric-engine.service';

@Injectable()
export class BudgetsService implements OnModuleInit {
    private readonly logger = new Logger(BudgetsService.name);

    constructor(
        @InjectRepository(Budget)
        private budgetRepo: Repository<Budget>,
        @InjectRepository(BudgetItem)
        private itemRepo: Repository<BudgetItem>,
        private dataSource: DataSource,
        private parametricEngine: ParametricEngineService,
    ) {}

    async onModuleInit() {
        await this.ensureTables();
        await this.parametricEngine.seedDefaultRules();
    }

    private async ensureTables() {
        try {
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS budgets (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(500) NOT NULL,
                    description TEXT,
                    state VARCHAR(10) DEFAULT 'PE',
                    "workType" VARCHAR(50) DEFAULT 'geral',
                    "bdiPercent" DECIMAL(5,2) DEFAULT 0,
                    status VARCHAR(30) DEFAULT 'rascunho',
                    "totalMaterial" DECIMAL(14,2) DEFAULT 0,
                    "totalLabor" DECIMAL(14,2) DEFAULT 0,
                    "totalEquipment" DECIMAL(14,2) DEFAULT 0,
                    subtotal DECIMAL(14,2) DEFAULT 0,
                    "bdiValue" DECIMAL(14,2) DEFAULT 0,
                    total DECIMAL(14,2) DEFAULT 0,
                    "userId" UUID,
                    "companyId" UUID,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS budget_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "budgetId" UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
                    "sinapiCode" VARCHAR(20),
                    "sinapiCompositionId" UUID,
                    description TEXT NOT NULL,
                    unit VARCHAR(20) DEFAULT 'UN',
                    "itemType" VARCHAR(30) DEFAULT 'composicao',
                    "costCategory" VARCHAR(30) DEFAULT 'material',
                    quantity DECIMAL(14,6) DEFAULT 1,
                    "sinapiCoefficient" DECIMAL(14,6),
                    "unitCost" DECIMAL(14,4) DEFAULT 0,
                    subtotal DECIMAL(14,2) DEFAULT 0,
                    "priceSource" VARCHAR(30),
                    "sortOrder" INTEGER DEFAULT 0,
                    notes TEXT,
                    "parametricData" JSONB,
                    "isManualOverride" BOOLEAN DEFAULT false,
                    "suggestedCost" DECIMAL(14,4),
                    "confidenceLevel" VARCHAR(20),
                    "createdAt" TIMESTAMP DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items("budgetId");

                -- Service Rules
                CREATE TABLE IF NOT EXISTS service_rules (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(200) NOT NULL,
                    category VARCHAR(50) DEFAULT 'eletrica',
                    keywords JSONB DEFAULT '[]',
                    "excludeKeywords" JSONB DEFAULT '[]',
                    "parameterName" VARCHAR(100),
                    "parameterRegex" VARCHAR(500),
                    "professionalCode" VARCHAR(20),
                    "professionalLabel" VARCHAR(100),
                    "helperCode" VARCHAR(20),
                    "helperLabel" VARCHAR(100),
                    bands JSONB DEFAULT '[]',
                    "customProfitPercent" DECIMAL(6,2),
                    "isActive" BOOLEAN DEFAULT true,
                    "sortOrder" INTEGER DEFAULT 0,
                    "companyId" UUID,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                );

                -- Company Financials
                CREATE TABLE IF NOT EXISTS company_financials (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "profileName" VARCHAR(200) DEFAULT 'Padrão',
                    "encargosPercent" DECIMAL(6,2) DEFAULT 68.47,
                    "adminCentralPercent" DECIMAL(6,2) DEFAULT 4.00,
                    "seguroPercent" DECIMAL(6,2) DEFAULT 0.80,
                    "riscoPercent" DECIMAL(6,2) DEFAULT 1.20,
                    "despesasFinanceirasPercent" DECIMAL(6,2) DEFAULT 1.40,
                    "lucroPercent" DECIMAL(6,2) DEFAULT 8.00,
                    "pisCofinPercent" DECIMAL(6,2) DEFAULT 3.65,
                    "issPercent" DECIMAL(6,2) DEFAULT 5.00,
                    "icmsPercent" DECIMAL(6,2) DEFAULT 0.00,
                    "categoryMargins" JSONB,
                    "bdiCalculated" DECIMAL(6,2) DEFAULT 25.00,
                    "isActive" BOOLEAN DEFAULT true,
                    "companyId" UUID,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                );

                -- Add new columns if tables already existed
                ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS "parametricData" JSONB;
                ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS "isManualOverride" BOOLEAN DEFAULT false;
                ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS "suggestedCost" DECIMAL(14,4);
                ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS "confidenceLevel" VARCHAR(20);
            `);
            this.logger.log('Budget + ServiceRules + CompanyFinancials tables ensured');
        } catch (e) {
            this.logger.warn('Budget tables migration: ' + e.message);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // CRUD
    // ═══════════════════════════════════════════════════════════

    async findAll(userId?: string) {
        const qb = this.budgetRepo.createQueryBuilder('b')
            .loadRelationCountAndMap('b.itemCount', 'b.items')
            .orderBy('b.updatedAt', 'DESC');
        if (userId) qb.andWhere('b."userId" = :userId', { userId });
        return qb.getMany();
    }

    async findOne(id: string) {
        const budget = await this.budgetRepo.findOne({
            where: { id },
            relations: ['items'],
            order: { items: { sortOrder: 'ASC' } },
        });
        if (!budget) throw new NotFoundException('Orçamento não encontrado');
        return budget;
    }

    async create(data: Partial<Budget>) {
        const budget = this.budgetRepo.create(data);
        return this.budgetRepo.save(budget);
    }

    async update(id: string, data: Partial<Budget>) {
        await this.budgetRepo.update(id, { ...data, updatedAt: new Date() } as any);
        return this.findOne(id);
    }

    async remove(id: string) {
        await this.budgetRepo.delete(id);
        return { deleted: true };
    }

    // ═══════════════════════════════════════════════════════════
    // ITEMS
    // ═══════════════════════════════════════════════════════════

    async addItem(budgetId: string, data: Partial<BudgetItem>) {
        const maxSort = await this.itemRepo
            .createQueryBuilder('i')
            .select('MAX(i.sortOrder)', 'max')
            .where('i."budgetId" = :budgetId', { budgetId })
            .getRawOne();

        const item = this.itemRepo.create({
            ...data,
            budgetId,
            subtotal: (Number(data.quantity) || 1) * (Number(data.unitCost) || 0),
            sortOrder: (maxSort?.max || 0) + 1,
        });
        const saved = await this.itemRepo.save(item);
        await this.recalcTotals(budgetId);
        return saved;
    }

    async updateItem(itemId: string, data: Partial<BudgetItem>) {
        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Item não encontrado');

        const qty = data.quantity !== undefined ? Number(data.quantity) : Number(item.quantity);
        const unitCost = data.unitCost !== undefined ? Number(data.unitCost) : Number(item.unitCost);
        const subtotal = qty * unitCost;

        // Detect manual override
        const isManualOverride = data.unitCost !== undefined && item.suggestedCost != null
            && Number(data.unitCost) !== Number(item.suggestedCost);

        await this.itemRepo.update(itemId, {
            ...data,
            quantity: qty,
            unitCost,
            subtotal,
            isManualOverride: isManualOverride || item.isManualOverride,
            confidenceLevel: isManualOverride ? 'manual' : item.confidenceLevel,
        } as any);
        await this.recalcTotals(item.budgetId);
        return this.itemRepo.findOne({ where: { id: itemId } });
    }

    async removeItem(itemId: string) {
        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Item não encontrado');
        await this.itemRepo.delete(itemId);
        await this.recalcTotals(item.budgetId);
        return { deleted: true };
    }

    // ═══════════════════════════════════════════════════════════
    // ADD SINAPI COMPOSITION — COM MOTOR PARAMÉTRICO
    // ═══════════════════════════════════════════════════════════

    async addSinapiComposition(budgetId: string, compositionCode: string, state?: string) {
        const budget = await this.findOne(budgetId);
        const uf = state || budget.state || 'PE';

        // Find composition
        const comp = await this.dataSource.query(
            `SELECT id, code, description, unit FROM sinapi_compositions WHERE code = $1`,
            [compositionCode],
        );
        if (!comp.length) throw new NotFoundException(`Composição SINAPI ${compositionCode} não encontrada`);

        // Get reference ID
        const refRows = await this.dataSource.query(`SELECT id FROM sinapi_references ORDER BY "createdAt" DESC LIMIT 1`);
        const refId = refRows[0]?.id;

        // ★ MOTOR PARAMÉTRICO: Analisa a composição
        const parametricResult = await this.parametricEngine.analyze(comp[0].description, uf);
        this.logger.log(`Parametric: ${parametricResult.confidence} — ${parametricResult.reasoning}`);

        // Get composition items with their IDs for direct lookup
        const items = await this.dataSource.query(`
            SELECT ci.coefficient, ci."itemType", ci."inputId", ci."childCompositionId",
                   i.code as input_code, i.description as input_desc, i.unit as input_unit, i.type as input_type,
                   c.code as comp_code, c.description as comp_desc, c.unit as comp_unit
            FROM sinapi_composition_items ci
            LEFT JOIN sinapi_inputs i ON i.id = ci."inputId"
            LEFT JOIN sinapi_compositions c ON c.id = ci."childCompositionId"
            WHERE ci."compositionId" = $1
            ORDER BY ci."sortOrder"
        `, [comp[0].id]);

        this.logger.log(`Adding composition ${compositionCode}: ${items.length} items, UF=${uf}`);

        const addedItems: BudgetItem[] = [];

        for (const item of items) {
            const isChildComp = !!item.childCompositionId;
            const code = item.input_code || item.comp_code;
            const desc = item.input_desc || item.comp_desc;
            const unit = item.input_unit || item.comp_unit || 'UN';
            const coef = Number(item.coefficient) || 0;

            let costCategory = 'material';
            let itemType = 'insumo';

            if (isChildComp) {
                itemType = 'composicao';
                costCategory = 'mao_de_obra';
            } else if (item.input_type) {
                if (item.input_type === 'mao_de_obra' || item.input_type === 'mao de obra') {
                    costCategory = 'mao_de_obra';
                } else if (item.input_type === 'equipamento' || item.input_type === 'equipamentos') {
                    costCategory = 'equipamento';
                } else {
                    costCategory = 'material';
                }
            }

            // Get unit cost from SINAPI
            let unitCost = 0;
            if (item.inputId && refId) {
                const price = await this.dataSource.query(
                    `SELECT "priceNotTaxed" FROM sinapi_input_prices WHERE "inputId" = $1 AND "referenceId" = $2 AND state = $3 LIMIT 1`,
                    [item.inputId, refId, uf],
                );
                if (price.length) unitCost = Number(price[0].priceNotTaxed) || 0;
            } else if (item.childCompositionId && refId) {
                const cost = await this.dataSource.query(
                    `SELECT "totalNotTaxed" FROM sinapi_composition_costs WHERE "compositionId" = $1 AND "referenceId" = $2 AND state = $3 LIMIT 1`,
                    [item.childCompositionId, refId, uf],
                );
                if (cost.length) unitCost = Number(cost[0].totalNotTaxed) || 0;
            }

            try {
                const newItem = await this.addItem(budgetId, {
                    sinapiCode: code,
                    sinapiCompositionId: comp[0].id,
                    description: `[${comp[0].code}] ${desc}`,
                    unit,
                    itemType,
                    costCategory,
                    quantity: coef,
                    sinapiCoefficient: coef,
                    unitCost,
                    priceSource: 'sinapi',
                    parametricData: null,
                    confidenceLevel: 'sinapi',
                    suggestedCost: unitCost,
                });
                addedItems.push(newItem);
            } catch (itemErr) {
                this.logger.error(`Failed to add item ${code}: ${itemErr.message}`);
            }
        }

        // ★ Add parametric labor cost as a separate line item (if motor detected)
        if (parametricResult.confidence !== 'sinapi' && parametricResult.laborCostWithBdi > 0) {
            try {
                const laborItem = await this.addItem(budgetId, {
                    sinapiCode: comp[0].code,
                    sinapiCompositionId: comp[0].id,
                    description: `⚡ MO PARAMÉTRICA: ${comp[0].description}`,
                    unit: 'SV',
                    itemType: 'mao_de_obra_parametrica',
                    costCategory: 'mao_de_obra',
                    quantity: 1,
                    unitCost: parametricResult.laborCostWithBdi,
                    suggestedCost: parametricResult.laborCostWithBdi,
                    priceSource: 'motor_parametrico',
                    parametricData: parametricResult,
                    confidenceLevel: parametricResult.confidence,
                    isManualOverride: false,
                });
                addedItems.push(laborItem);
                this.logger.log(
                    `★ Parametric MO added: R$${parametricResult.laborCostWithBdi.toFixed(2)} ` +
                    `(${parametricResult.bandLabel} — ${parametricResult.professional?.hours}h ${parametricResult.professional?.label})`,
                );
            } catch (e) {
                this.logger.error(`Failed to add parametric MO: ${e.message}`);
            }
        }

        if (addedItems.length === 0 && items.length > 0) {
            throw new BadRequestException(`Não foi possível adicionar nenhum item da composição ${compositionCode}.`);
        }

        return { composition: comp[0], items: addedItems, parametric: parametricResult };
    }

    // ═══════════════════════════════════════════════════════════
    // RECALCULATE ALL — Reaplicar motor em todos itens
    // ═══════════════════════════════════════════════════════════

    async recalculateParametric(budgetId: string) {
        const budget = await this.findOne(budgetId);
        const uf = budget.state || 'PE';

        // Remove old parametric MO items
        await this.dataSource.query(
            `DELETE FROM budget_items WHERE "budgetId" = $1 AND "itemType" = 'mao_de_obra_parametrica'`,
            [budgetId],
        );

        // Get distinct compositions in this budget
        const compositions = await this.dataSource.query(`
            SELECT DISTINCT "sinapiCompositionId", "sinapiCode"
            FROM budget_items WHERE "budgetId" = $1 AND "sinapiCompositionId" IS NOT NULL
        `, [budgetId]);

        for (const comp of compositions) {
            if (!comp.sinapiCompositionId) continue;
            const compData = await this.dataSource.query(
                `SELECT code, description FROM sinapi_compositions WHERE id = $1`,
                [comp.sinapiCompositionId],
            );
            if (!compData.length) continue;

            const result = await this.parametricEngine.analyze(compData[0].description, uf);
            if (result.confidence !== 'sinapi' && result.laborCostWithBdi > 0) {
                await this.addItem(budgetId, {
                    sinapiCode: compData[0].code,
                    sinapiCompositionId: comp.sinapiCompositionId,
                    description: `⚡ MO PARAMÉTRICA: ${compData[0].description}`,
                    unit: 'SV',
                    itemType: 'mao_de_obra_parametrica',
                    costCategory: 'mao_de_obra',
                    quantity: 1,
                    unitCost: result.laborCostWithBdi,
                    suggestedCost: result.laborCostWithBdi,
                    priceSource: 'motor_parametrico',
                    parametricData: result,
                    confidenceLevel: result.confidence,
                });
            }
        }

        await this.recalcTotals(budgetId);
        return this.findOne(budgetId);
    }

    // ═══════════════════════════════════════════════════════════
    // RECALCULATE TOTALS
    // ═══════════════════════════════════════════════════════════

    private async recalcTotals(budgetId: string) {
        const result = await this.dataSource.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN "costCategory" = 'material' THEN subtotal ELSE 0 END), 0) as material,
                COALESCE(SUM(CASE WHEN "costCategory" = 'mao_de_obra' THEN subtotal ELSE 0 END), 0) as labor,
                COALESCE(SUM(CASE WHEN "costCategory" = 'equipamento' THEN subtotal ELSE 0 END), 0) as equipment,
                COALESCE(SUM(subtotal), 0) as subtotal
            FROM budget_items WHERE "budgetId" = $1
        `, [budgetId]);

        const r = result[0];
        const subtotal = Number(r.subtotal) || 0;
        const budget = await this.budgetRepo.findOne({ where: { id: budgetId } });
        const bdiPercent = Number(budget?.bdiPercent) || 0;
        const bdiValue = subtotal * bdiPercent / 100;

        await this.budgetRepo.update(budgetId, {
            totalMaterial: Number(r.material) || 0,
            totalLabor: Number(r.labor) || 0,
            totalEquipment: Number(r.equipment) || 0,
            subtotal,
            bdiValue,
            total: subtotal + bdiValue,
        } as any);
    }
}
