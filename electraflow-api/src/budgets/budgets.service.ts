import { Injectable, Logger, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Budget } from './budget.entity';
import { BudgetItem } from './budget-item.entity';

@Injectable()
export class BudgetsService implements OnModuleInit {
    private readonly logger = new Logger(BudgetsService.name);

    constructor(
        @InjectRepository(Budget)
        private budgetRepo: Repository<Budget>,
        @InjectRepository(BudgetItem)
        private itemRepo: Repository<BudgetItem>,
        private dataSource: DataSource,
    ) {}

    async onModuleInit() {
        await this.ensureTables();
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
                    "createdAt" TIMESTAMP DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items("budgetId");
            `);
            this.logger.log('Budget tables ensured');
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
        // Get max sortOrder
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

        // Recalculate subtotal
        const qty = data.quantity !== undefined ? Number(data.quantity) : Number(item.quantity);
        const unitCost = data.unitCost !== undefined ? Number(data.unitCost) : Number(item.unitCost);
        const subtotal = qty * unitCost;

        await this.itemRepo.update(itemId, { ...data, quantity: qty, unitCost, subtotal } as any);
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
    // ADD SINAPI COMPOSITION TO BUDGET
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

        this.logger.log(`Adding composition ${compositionCode}: ${items.length} items, UF=${uf}, refId=${refId?.substring(0,8)}`);

        const addedItems: BudgetItem[] = [];

        for (const item of items) {
            const isChildComp = !!item.childCompositionId;
            const code = item.input_code || item.comp_code;
            const desc = item.input_desc || item.comp_desc;
            const unit = item.input_unit || item.comp_unit || 'UN';
            const coef = Number(item.coefficient) || 0;

            // Determine cost category from input type
            let costCategory = 'material';
            let itemType = 'insumo';

            if (isChildComp) {
                itemType = 'composicao';
                // Child compositions are typically labor (encargos complementares)
                costCategory = 'mao_de_obra';
            } else if (item.input_type) {
                // Use the input's own type classification
                if (item.input_type === 'mao_de_obra' || item.input_type === 'mao de obra') {
                    costCategory = 'mao_de_obra';
                } else if (item.input_type === 'equipamento' || item.input_type === 'equipamentos') {
                    costCategory = 'equipamento';
                } else {
                    costCategory = 'material';
                }
            }

            // Get unit cost from SINAPI using IDs directly (not by code re-lookup)
            let unitCost = 0;
            if (item.inputId && refId) {
                // Direct lookup by inputId — much more reliable
                const price = await this.dataSource.query(
                    `SELECT "priceNotTaxed" FROM sinapi_input_prices WHERE "inputId" = $1 AND "referenceId" = $2 AND state = $3 LIMIT 1`,
                    [item.inputId, refId, uf],
                );
                if (price.length) unitCost = Number(price[0].priceNotTaxed) || 0;
            } else if (item.childCompositionId && refId) {
                // Child composition — get total cost
                const cost = await this.dataSource.query(
                    `SELECT "totalNotTaxed" FROM sinapi_composition_costs WHERE "compositionId" = $1 AND "referenceId" = $2 AND state = $3 LIMIT 1`,
                    [item.childCompositionId, refId, uf],
                );
                if (cost.length) unitCost = Number(cost[0].totalNotTaxed) || 0;
            }

            this.logger.debug(`  Item ${code}: unitCost=${unitCost}, coef=${coef}, cat=${costCategory}`);

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
                });
                addedItems.push(newItem);
            } catch (itemErr) {
                this.logger.error(`Failed to add item ${code}: ${itemErr.message}`);
                // Continue with other items instead of failing
            }
        }

        if (addedItems.length === 0 && items.length > 0) {
            throw new BadRequestException(`Não foi possível adicionar nenhum item da composição ${compositionCode}. Verifique os logs.`);
        }

        return { composition: comp[0], items: addedItems };
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
