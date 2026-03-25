import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SinapiReference } from './entities/sinapi-reference.entity';
import { SinapiInput } from './entities/sinapi-input.entity';
import { SinapiInputPrice } from './entities/sinapi-price.entity';
import { SinapiComposition } from './entities/sinapi-composition.entity';
import { SinapiCompositionItem } from './entities/sinapi-composition-item.entity';
import { SinapiCompositionCost } from './entities/sinapi-composition-price.entity';
import { SinapiConfig } from './entities/sinapi-config.entity';
import { SinapiBudgetLink } from './entities/sinapi-budget-link.entity';

@Injectable()
export class SinapiService implements OnModuleInit {
    private readonly logger = new Logger(SinapiService.name);

    constructor(
        @InjectRepository(SinapiReference)
        private referenceRepo: Repository<SinapiReference>,
        @InjectRepository(SinapiInput)
        private inputRepo: Repository<SinapiInput>,
        @InjectRepository(SinapiInputPrice)
        private inputPriceRepo: Repository<SinapiInputPrice>,
        @InjectRepository(SinapiComposition)
        private compositionRepo: Repository<SinapiComposition>,
        @InjectRepository(SinapiCompositionItem)
        private compositionItemRepo: Repository<SinapiCompositionItem>,
        @InjectRepository(SinapiCompositionCost)
        private compositionCostRepo: Repository<SinapiCompositionCost>,
        @InjectRepository(SinapiConfig)
        private configRepo: Repository<SinapiConfig>,
        @InjectRepository(SinapiBudgetLink)
        private budgetLinkRepo: Repository<SinapiBudgetLink>,
        private dataSource: DataSource,
    ) {}

    // ═══════════════════════════════════════════════════════════════
    // MIGRATIONS
    // ═══════════════════════════════════════════════════════════════

    async onModuleInit() {
        try {
            this.logger.log('🏗️  SINAPI tables migration (v2 — 7 tables)...');

            // 1. Referências mensais
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_references (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    year INT NOT NULL,
                    month INT NOT NULL,
                    state CHAR(2) NOT NULL,
                    label VARCHAR,
                    "publishedAt" DATE,
                    source VARCHAR DEFAULT 'sinapi_caixa',
                    status VARCHAR DEFAULT 'active',
                    "createdAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await this.dataSource.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_ref_year_month_state
                ON sinapi_references(year, month, state)
            `).catch(() => {});

            // 2. Insumos
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_inputs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    code VARCHAR NOT NULL,
                    description TEXT NOT NULL,
                    unit VARCHAR NOT NULL DEFAULT 'UN',
                    type VARCHAR DEFAULT 'material',
                    "groupClass" VARCHAR,
                    origin VARCHAR DEFAULT 'sinapi',
                    "catalogItemId" UUID,
                    "isActive" BOOLEAN DEFAULT true,
                    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
                    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await this.dataSource.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_input_code
                ON sinapi_inputs(code)
            `).catch(() => {});
            // Add groupClass column if missing
            await this.dataSource.query(`
                ALTER TABLE sinapi_inputs ADD COLUMN IF NOT EXISTS "groupClass" VARCHAR
            `).catch(() => {});

            // 3. Composições
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_compositions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    code VARCHAR NOT NULL,
                    description TEXT NOT NULL,
                    unit VARCHAR NOT NULL DEFAULT 'UN',
                    "classCode" VARCHAR,
                    "className" VARCHAR,
                    type VARCHAR DEFAULT 'composition',
                    "isActive" BOOLEAN DEFAULT true,
                    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
                    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await this.dataSource.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_comp_code
                ON sinapi_compositions(code)
            `).catch(() => {});

            // 4. Itens da composição
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_composition_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "compositionId" UUID NOT NULL REFERENCES sinapi_compositions(id) ON DELETE CASCADE,
                    "inputId" UUID REFERENCES sinapi_inputs(id) ON DELETE SET NULL,
                    "childCompositionId" UUID REFERENCES sinapi_compositions(id) ON DELETE SET NULL,
                    "itemType" VARCHAR DEFAULT 'insumo',
                    coefficient DECIMAL(15,6) NOT NULL DEFAULT 1,
                    "sortOrder" INT DEFAULT 0,
                    "createdAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            // Add new columns if table already existed
            await this.dataSource.query(`ALTER TABLE sinapi_composition_items ADD COLUMN IF NOT EXISTS "itemType" VARCHAR DEFAULT 'insumo'`).catch(() => {});
            await this.dataSource.query(`ALTER TABLE sinapi_composition_items ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0`).catch(() => {});

            // 5. Preços dos insumos (nova estrutura com referenceId)
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_input_prices (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "referenceId" UUID NOT NULL REFERENCES sinapi_references(id) ON DELETE CASCADE,
                    "inputId" UUID NOT NULL REFERENCES sinapi_inputs(id) ON DELETE CASCADE,
                    "priceNotTaxed" DECIMAL(15,4),
                    "priceTaxed" DECIMAL(15,4),
                    origin VARCHAR DEFAULT 'sinapi',
                    "createdAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await this.dataSource.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_input_price_ref
                ON sinapi_input_prices("referenceId", "inputId")
            `).catch(() => {});
            await this.dataSource.query(`
                CREATE INDEX IF NOT EXISTS idx_sinapi_input_price_input
                ON sinapi_input_prices("inputId")
            `).catch(() => {});

            // 6. Custos das composições
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_composition_costs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "referenceId" UUID NOT NULL REFERENCES sinapi_references(id) ON DELETE CASCADE,
                    "compositionId" UUID NOT NULL REFERENCES sinapi_compositions(id) ON DELETE CASCADE,
                    "totalNotTaxed" DECIMAL(15,4),
                    "totalTaxed" DECIMAL(15,4),
                    "materialCost" DECIMAL(15,4),
                    "laborCost" DECIMAL(15,4),
                    "equipmentCost" DECIMAL(15,4),
                    "calculationMethod" VARCHAR DEFAULT 'imported',
                    "createdAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await this.dataSource.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_comp_cost_ref
                ON sinapi_composition_costs("referenceId", "compositionId")
            `).catch(() => {});
            await this.dataSource.query(`
                CREATE INDEX IF NOT EXISTS idx_sinapi_comp_cost_comp
                ON sinapi_composition_costs("compositionId")
            `).catch(() => {});

            // 7. Budget links (proposta ↔ SINAPI)
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_budget_links (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "proposalId" UUID NOT NULL,
                    "proposalItemId" VARCHAR NOT NULL,
                    "compositionId" UUID NOT NULL REFERENCES sinapi_compositions(id) ON DELETE CASCADE,
                    "referenceId" UUID NOT NULL REFERENCES sinapi_references(id) ON DELETE CASCADE,
                    coefficient DECIMAL(15,6) DEFAULT 1,
                    "sinapiUnitCost" DECIMAL(15,4) NOT NULL,
                    "budgetUnitPrice" DECIMAL(15,4) NOT NULL,
                    "bdiPercent" DECIMAL(5,2) DEFAULT 0,
                    notes TEXT,
                    "createdAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await this.dataSource.query(`
                CREATE INDEX IF NOT EXISTS idx_sinapi_budget_link_proposal
                ON sinapi_budget_links("proposalId")
            `).catch(() => {});
            await this.dataSource.query(`
                CREATE INDEX IF NOT EXISTS idx_sinapi_budget_link_comp
                ON sinapi_budget_links("compositionId")
            `).catch(() => {});

            // Config table
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_configs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    key VARCHAR NOT NULL UNIQUE,
                    value TEXT,
                    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            // Import logs table
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_import_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "referenceId" UUID REFERENCES sinapi_references(id) ON DELETE SET NULL,
                    "fileName" VARCHAR,
                    "fileType" VARCHAR DEFAULT 'inputs',
                    state CHAR(2),
                    year INT,
                    month INT,
                    "taxRegime" VARCHAR DEFAULT 'nao_desonerado',
                    status VARCHAR DEFAULT 'running',
                    "totalRows" INT DEFAULT 0,
                    "insertedCount" INT DEFAULT 0,
                    "updatedCount" INT DEFAULT 0,
                    "skippedCount" INT DEFAULT 0,
                    "errorCount" INT DEFAULT 0,
                    errors TEXT,
                    warnings TEXT,
                    "durationMs" INT,
                    "createdAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            // Pricing profiles table
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_pricing_profiles (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR NOT NULL,
                    description TEXT,
                    "isDefault" BOOLEAN DEFAULT false,
                    "isActive" BOOLEAN DEFAULT true,
                    "bdiAdminPercent" DECIMAL(6,2) DEFAULT 0,
                    "bdiFinancialPercent" DECIMAL(6,2) DEFAULT 0,
                    "bdiInsurancePercent" DECIMAL(6,2) DEFAULT 0,
                    "bdiProfitPercent" DECIMAL(6,2) DEFAULT 0,
                    "mobilizationPercent" DECIMAL(6,2) DEFAULT 0,
                    "localAdminPercent" DECIMAL(6,2) DEFAULT 0,
                    "logisticsPercent" DECIMAL(6,2) DEFAULT 0,
                    "contingencyPercent" DECIMAL(6,2) DEFAULT 0,
                    "technicalVisitCost" DECIMAL(15,2) DEFAULT 0,
                    "artPermitCost" DECIMAL(15,2) DEFAULT 0,
                    "otherFixedCosts" DECIMAL(15,2) DEFAULT 0,
                    "issPercent" DECIMAL(6,2) DEFAULT 0,
                    "pisPercent" DECIMAL(6,2) DEFAULT 0,
                    "cofinsPercent" DECIMAL(6,2) DEFAULT 0,
                    "irpjPercent" DECIMAL(6,2) DEFAULT 0,
                    "csllPercent" DECIMAL(6,2) DEFAULT 0,
                    "inssPercent" DECIMAL(6,2) DEFAULT 0,
                    "otherTaxPercent" DECIMAL(6,2) DEFAULT 0,
                    "roundingMode" VARCHAR DEFAULT 'none',
                    "customRoundingValue" DECIMAL(15,2),
                    "calculationMethod" VARCHAR DEFAULT 'standard',
                    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
                    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            // Add SINAPI columns to proposal_items (safe to re-run)
            const sinapiCols = [
                `"isSinapiLinked" BOOLEAN DEFAULT false`,
                `"sinapiCompositionCode" VARCHAR`,
                `"sinapiCompositionId" UUID`,
                `"sinapiReferenceId" UUID`,
                `"sinapiUnitCost" DECIMAL(15,4)`,
                `"sinapiBdiPercent" DECIMAL(6,2)`,
                `"sinapiPricingProfileId" UUID`,
                `"sinapiSellingPrice" DECIMAL(15,4)`,
                `"sinapiPricingSnapshot" TEXT`,
                `"sinapiFrozenAt" TIMESTAMPTZ`,
            ];
            for (const col of sinapiCols) {
                await this.dataSource.query(`ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS ${col}`).catch(() => {});
            }

            // Drop old tables if they exist (from v1 schema)
            await this.dataSource.query(`DROP TABLE IF EXISTS sinapi_prices CASCADE`).catch(() => {});
            await this.dataSource.query(`DROP TABLE IF EXISTS sinapi_composition_prices CASCADE`).catch(() => {});

            this.logger.log('✅ SINAPI v2 tables OK (7 tables + config + import_logs + pricing_profiles + proposal_items columns)');
        } catch (e) {
            this.logger.warn('SINAPI migration: ' + e?.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // REFERENCES (REFERÊNCIAS MENSAIS)
    // ═══════════════════════════════════════════════════════════════

    async findAllReferences(state?: string) {
        const qb = this.referenceRepo.createQueryBuilder('r')
            .orderBy('r.year', 'DESC')
            .addOrderBy('r.month', 'DESC');
        if (state) qb.where('r.state = :state', { state: state.toUpperCase() });
        return qb.getMany();
    }

    async findActiveReference(state: string) {
        return this.referenceRepo.findOne({
            where: { state: state.toUpperCase(), status: 'active' },
            order: { year: 'DESC', month: 'DESC' },
        });
    }

    async createReference(data: { year: number; month: number; state: string; label?: string; publishedAt?: string; source?: string }) {
        // Supersede previous active reference for same state
        await this.referenceRepo.update(
            { state: data.state.toUpperCase(), status: 'active' },
            { status: 'superseded' },
        );

        const monthNames = ['', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const label = data.label || `SINAPI ${monthNames[data.month]}/${data.year} - ${data.state.toUpperCase()}`;

        return this.referenceRepo.save(this.referenceRepo.create({
            year: data.year,
            month: data.month,
            state: data.state.toUpperCase(),
            label,
            publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
            source: data.source || 'sinapi_caixa',
            status: 'active',
        }));
    }

    async findReferenceById(id: string) {
        return this.referenceRepo.findOne({ where: { id } });
    }

    // ═══════════════════════════════════════════════════════════════
    // INPUTS (INSUMOS)
    // ═══════════════════════════════════════════════════════════════

    async searchInputs(params: { search?: string; type?: string; page?: number; limit?: number }) {
        const { search, type, page = 1, limit = 50 } = params;
        const qb = this.inputRepo.createQueryBuilder('i')
            .where('i."isActive" = true');
        if (type) qb.andWhere('i.type = :type', { type });
        if (search) qb.andWhere('(i.code ILIKE :s OR i.description ILIKE :s)', { s: `%${search}%` });
        qb.orderBy('i.code', 'ASC').skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }

    async findInputByCode(code: string) {
        return this.inputRepo.findOne({ where: { code }, relations: ['catalogItem'] });
    }

    async findInputById(id: string) {
        return this.inputRepo.findOne({ where: { id }, relations: ['catalogItem'] });
    }

    async getInputPriceHistory(inputId: string, state?: string) {
        const qb = this.inputPriceRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.reference', 'r')
            .where('p."inputId" = :inputId', { inputId });
        if (state) qb.andWhere('r.state = :state', { state: state.toUpperCase() });
        qb.orderBy('r.year', 'DESC').addOrderBy('r.month', 'DESC').take(24);
        return qb.getMany();
    }

    async getLatestInputPrice(inputId: string, state: string) {
        const ref = await this.findActiveReference(state);
        if (!ref) return null;
        return this.inputPriceRepo.findOne({
            where: { inputId, referenceId: ref.id },
            relations: ['reference'],
        });
    }

    async linkInputToCatalog(inputId: string, catalogItemId: string) {
        await this.inputRepo.update(inputId, { catalogItemId });
        return this.findInputById(inputId);
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPOSITIONS (COMPOSIÇÕES)
    // ═══════════════════════════════════════════════════════════════

    async searchCompositions(params: { search?: string; classCode?: string; page?: number; limit?: number }) {
        const { search, classCode, page = 1, limit = 50 } = params;
        const qb = this.compositionRepo.createQueryBuilder('c')
            .where('c."isActive" = true');
        if (classCode) qb.andWhere('c."classCode" = :classCode', { classCode });
        if (search) qb.andWhere('(c.code ILIKE :s OR c.description ILIKE :s)', { s: `%${search}%` });
        qb.orderBy('c.code', 'ASC').skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }

    async findCompositionByCode(code: string) {
        return this.compositionRepo.findOne({
            where: { code },
            relations: ['items', 'items.input', 'items.childComposition'],
        });
    }

    async findCompositionById(id: string) {
        return this.compositionRepo.findOne({
            where: { id },
            relations: ['items', 'items.input', 'items.childComposition'],
        });
    }

    async getCompositionCost(compositionId: string, state: string) {
        const ref = await this.findActiveReference(state);
        if (!ref) return null;
        return this.compositionCostRepo.findOne({
            where: { compositionId, referenceId: ref.id },
            relations: ['reference'],
        });
    }

    async getCompositionCostByCode(code: string, state: string) {
        const comp = await this.compositionRepo.findOne({ where: { code } });
        if (!comp) throw new NotFoundException(`Composição ${code} não encontrada`);
        return this.getCompositionCost(comp.id, state);
    }

    async getCompositionCostHistory(compositionId: string, state?: string) {
        const qb = this.compositionCostRepo.createQueryBuilder('c')
            .leftJoinAndSelect('c.reference', 'r')
            .where('c."compositionId" = :compositionId', { compositionId });
        if (state) qb.andWhere('r.state = :state', { state: state.toUpperCase() });
        qb.orderBy('r.year', 'DESC').addOrderBy('r.month', 'DESC').take(24);
        return qb.getMany();
    }

    // ═══════════════════════════════════════════════════════════════
    // INPUT WITH PRICE (Insumo + preço na referência ativa)
    // ═══════════════════════════════════════════════════════════════

    async getInputWithPrice(codeOrId: string, state: string) {
        const input = (await this.findInputByCode(codeOrId)) || (await this.findInputById(codeOrId));
        if (!input) throw new NotFoundException(`Insumo ${codeOrId} não encontrado`);

        const ref = await this.findActiveReference(state);
        let price = null;
        if (ref) {
            const p = await this.inputPriceRepo.findOne({
                where: { inputId: input.id, referenceId: ref.id },
                relations: ['reference'],
            });
            if (p) {
                price = {
                    priceNotTaxed: Number(p.priceNotTaxed) || null,
                    priceTaxed: Number(p.priceTaxed) || null,
                    reference: p.reference,
                };
            }
        }

        return { ...input, price };
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPOSITION TREE (Árvore recursiva da composição)
    // ═══════════════════════════════════════════════════════════════

    async getCompositionTree(codeOrId: string, state: string, maxDepth = 5) {
        const comp = (await this.findCompositionByCode(codeOrId)) || (await this.findCompositionById(codeOrId));
        if (!comp) throw new NotFoundException(`Composição ${codeOrId} não encontrada`);

        const ref = await this.findActiveReference(state);
        const tree = await this.buildTree(comp.id, ref?.id || null, 0, maxDepth);

        // Calculate consolidated cost from tree
        const consolidated = this.consolidateTreeCost(tree);

        // Also get stored cost for comparison
        let storedCost = null;
        if (ref) {
            storedCost = await this.compositionCostRepo.findOne({
                where: { compositionId: comp.id, referenceId: ref.id },
            });
        }

        return {
            composition: {
                id: comp.id, code: comp.code, description: comp.description,
                unit: comp.unit, classCode: comp.classCode, className: comp.className,
                type: comp.type, isActive: comp.isActive,
            },
            reference: ref || null,
            tree,
            consolidatedCost: {
                totalNotTaxed: consolidated.notTaxed,
                totalTaxed: consolidated.taxed,
                materialCost: consolidated.material,
                laborCost: consolidated.labor,
                equipmentCost: consolidated.equipment,
            },
            storedCost: storedCost ? {
                totalNotTaxed: Number(storedCost.totalNotTaxed) || 0,
                totalTaxed: Number(storedCost.totalTaxed) || 0,
                materialCost: Number(storedCost.materialCost) || 0,
                laborCost: Number(storedCost.laborCost) || 0,
                equipmentCost: Number(storedCost.equipmentCost) || 0,
            } : null,
        };
    }

    private async buildTree(compositionId: string, referenceId: string | null, depth: number, maxDepth: number): Promise<any[]> {
        if (depth >= maxDepth) return [];

        const items = await this.compositionItemRepo.find({
            where: { compositionId },
            relations: ['input', 'childComposition'],
            order: { sortOrder: 'ASC' },
        });

        const nodes: any[] = [];

        for (const item of items) {
            const node: any = {
                type: item.itemType || 'insumo',
                coefficient: Number(item.coefficient),
            };

            if (item.input) {
                // Insumo leaf node
                node.code = item.input.code;
                node.description = item.input.description;
                node.unit = item.input.unit;
                node.inputId = item.input.id;
                node.inputType = item.input.type;

                // Get price for this reference
                if (referenceId) {
                    const price = await this.inputPriceRepo.findOne({
                        where: { inputId: item.input.id, referenceId },
                    });
                    if (price) {
                        const pNotTaxed = Number(price.priceNotTaxed) || 0;
                        const pTaxed = Number(price.priceTaxed) || 0;
                        node.price = { priceNotTaxed: pNotTaxed, priceTaxed: pTaxed };
                        node.subtotal = {
                            notTaxed: pNotTaxed * Number(item.coefficient),
                            taxed: pTaxed * Number(item.coefficient),
                        };
                    }
                }
            } else if (item.childComposition) {
                // Sub-composition — recurse
                node.code = item.childComposition.code;
                node.description = item.childComposition.description;
                node.unit = item.childComposition.unit;
                node.compositionId = item.childComposition.id;
                node.children = await this.buildTree(item.childComposition.id, referenceId, depth + 1, maxDepth);

                // Get stored cost for sub-composition
                if (referenceId) {
                    const subCost = await this.compositionCostRepo.findOne({
                        where: { compositionId: item.childComposition.id, referenceId },
                    });
                    if (subCost) {
                        node.compositionCost = {
                            totalNotTaxed: Number(subCost.totalNotTaxed) || 0,
                            totalTaxed: Number(subCost.totalTaxed) || 0,
                        };
                        node.subtotal = {
                            notTaxed: (Number(subCost.totalNotTaxed) || 0) * Number(item.coefficient),
                            taxed: (Number(subCost.totalTaxed) || 0) * Number(item.coefficient),
                        };
                    }
                }
            }

            nodes.push(node);
        }

        return nodes;
    }

    private consolidateTreeCost(tree: any[]): { notTaxed: number; taxed: number; material: number; labor: number; equipment: number } {
        let notTaxed = 0, taxed = 0, material = 0, labor = 0, equipment = 0;

        for (const node of tree) {
            const snt = node.subtotal?.notTaxed || 0;
            const st = node.subtotal?.taxed || 0;

            notTaxed += snt;
            taxed += st;

            if (node.type === 'insumo' && node.inputType) {
                if (node.inputType === 'material') material += snt;
                else if (node.inputType === 'mao_de_obra') labor += snt;
                else if (node.inputType === 'equipamento') equipment += snt;
            } else if (node.children?.length) {
                const sub = this.consolidateTreeCost(node.children);
                material += sub.material * Number(node.coefficient || 1);
                labor += sub.labor * Number(node.coefficient || 1);
                equipment += sub.equipment * Number(node.coefficient || 1);
            }
        }

        return { notTaxed: Math.round(notTaxed * 100) / 100, taxed: Math.round(taxed * 100) / 100, material: Math.round(material * 100) / 100, labor: Math.round(labor * 100) / 100, equipment: Math.round(equipment * 100) / 100 };
    }

    // ═══════════════════════════════════════════════════════════════
    // FULL COMPOSITION (Composição completa: dados + árvore + custo)
    // ═══════════════════════════════════════════════════════════════

    async getCompositionFull(codeOrId: string, state: string, referenceId?: string) {
        const comp = (await this.findCompositionByCode(codeOrId)) || (await this.findCompositionById(codeOrId));
        if (!comp) throw new NotFoundException(`Composição ${codeOrId} não encontrada`);

        let ref: any = null;
        if (referenceId) {
            ref = await this.referenceRepo.findOne({ where: { id: referenceId } });
        } else {
            ref = await this.findActiveReference(state);
        }

        const tree = await this.buildTree(comp.id, ref?.id || null, 0, 5);
        const consolidated = this.consolidateTreeCost(tree);

        let storedCost = null;
        if (ref) {
            storedCost = await this.compositionCostRepo.findOne({
                where: { compositionId: comp.id, referenceId: ref.id },
            });
        }

        const costHistory = await this.getCompositionCostHistory(comp.id, state);

        return {
            composition: comp,
            reference: ref,
            items: comp.items || [],
            tree,
            consolidatedCost: {
                totalNotTaxed: consolidated.notTaxed,
                totalTaxed: consolidated.taxed,
                materialCost: consolidated.material,
                laborCost: consolidated.labor,
                equipmentCost: consolidated.equipment,
            },
            storedCost: storedCost ? {
                totalNotTaxed: Number(storedCost.totalNotTaxed) || 0,
                totalTaxed: Number(storedCost.totalTaxed) || 0,
                materialCost: Number(storedCost.materialCost) || 0,
                laborCost: Number(storedCost.laborCost) || 0,
                equipmentCost: Number(storedCost.equipmentCost) || 0,
                calculationMethod: storedCost.calculationMethod,
            } : null,
            costHistory: costHistory.slice(0, 12),
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // BUDGET LINKS (VÍNCULO PROPOSTA ↔ SINAPI)
    // ═══════════════════════════════════════════════════════════════

    async getBudgetLinks(proposalId: string) {
        return this.budgetLinkRepo.find({
            where: { proposalId },
            relations: ['composition', 'reference'],
            order: { createdAt: 'ASC' },
        });
    }

    async createBudgetLink(data: {
        proposalId: string; proposalItemId: string; compositionId: string;
        referenceId: string; coefficient?: number; sinapiUnitCost: number;
        budgetUnitPrice: number; bdiPercent?: number; notes?: string;
    }) {
        return this.budgetLinkRepo.save(this.budgetLinkRepo.create(data));
    }

    async deleteBudgetLink(id: string) {
        await this.budgetLinkRepo.delete(id);
    }

    async updateBudgetLinkReference(id: string, referenceId: string) {
        const link = await this.budgetLinkRepo.findOne({ where: { id }, relations: ['composition'] });
        if (!link) throw new NotFoundException('Budget link não encontrado');

        // Get new cost from the new reference
        const newCost = await this.compositionCostRepo.findOne({
            where: { compositionId: link.compositionId, referenceId },
        });

        if (newCost) {
            const bdi = Number(link.bdiPercent || 0);
            const unitCost = Number(newCost.totalNotTaxed || 0);
            const budgetPrice = unitCost * (1 + bdi / 100);
            await this.budgetLinkRepo.update(id, {
                referenceId,
                sinapiUnitCost: unitCost,
                budgetUnitPrice: budgetPrice,
            });
        } else {
            await this.budgetLinkRepo.update(id, { referenceId });
        }

        return this.budgetLinkRepo.findOne({ where: { id }, relations: ['composition', 'reference'] });
    }

    // ═══════════════════════════════════════════════════════════════
    // IMPORT (Bulk insert)
    // ═══════════════════════════════════════════════════════════════

    async importInputs(inputs: Array<{ code: string; description: string; unit: string; type?: string; groupClass?: string }>) {
        let inserted = 0, updated = 0;
        for (const item of inputs) {
            const existing = await this.inputRepo.findOne({ where: { code: item.code } });
            if (existing) {
                await this.inputRepo.update(existing.id, {
                    description: item.description, unit: item.unit,
                    type: item.type || existing.type, groupClass: item.groupClass,
                });
                updated++;
            } else {
                await this.inputRepo.save(this.inputRepo.create({
                    code: item.code, description: item.description, unit: item.unit,
                    type: item.type || 'material', groupClass: item.groupClass,
                }));
                inserted++;
            }
        }
        return { inserted, updated, total: inputs.length };
    }

    async importInputPrices(referenceId: string, prices: Array<{ inputCode: string; priceNotTaxed?: number; priceTaxed?: number }>) {
        let imported = 0, skipped = 0;
        for (const p of prices) {
            const input = await this.inputRepo.findOne({ where: { code: p.inputCode } });
            if (!input) { skipped++; continue; }
            // Upsert
            const existing = await this.inputPriceRepo.findOne({ where: { referenceId, inputId: input.id } });
            if (existing) {
                await this.inputPriceRepo.update(existing.id, {
                    priceNotTaxed: p.priceNotTaxed, priceTaxed: p.priceTaxed,
                });
            } else {
                await this.inputPriceRepo.save(this.inputPriceRepo.create({
                    referenceId, inputId: input.id,
                    priceNotTaxed: p.priceNotTaxed, priceTaxed: p.priceTaxed,
                }));
            }
            imported++;
        }
        return { imported, skipped, total: prices.length };
    }

    async importCompositions(compositions: Array<{
        code: string; description: string; unit: string;
        classCode?: string; className?: string; type?: string;
        items?: Array<{ inputCode?: string; childCompositionCode?: string; coefficient: number; itemType?: string; sortOrder?: number }>;
    }>) {
        let inserted = 0, updated = 0;
        for (const comp of compositions) {
            let existing = await this.compositionRepo.findOne({ where: { code: comp.code } });
            if (existing) {
                await this.compositionRepo.update(existing.id, {
                    description: comp.description, unit: comp.unit,
                    classCode: comp.classCode, className: comp.className,
                    type: comp.type || existing.type,
                });
                await this.compositionItemRepo.delete({ compositionId: existing.id });
                updated++;
            } else {
                existing = await this.compositionRepo.save(this.compositionRepo.create({
                    code: comp.code, description: comp.description, unit: comp.unit,
                    classCode: comp.classCode, className: comp.className,
                    type: comp.type || 'composition',
                }));
                inserted++;
            }
            if (comp.items?.length) {
                for (let i = 0; i < comp.items.length; i++) {
                    const item = comp.items[i];
                    const ci: any = { compositionId: existing.id, coefficient: item.coefficient, sortOrder: item.sortOrder ?? i, itemType: item.itemType || 'insumo' };
                    if (item.inputCode) {
                        const input = await this.inputRepo.findOne({ where: { code: item.inputCode } });
                        if (input) ci.inputId = input.id;
                    }
                    if (item.childCompositionCode) {
                        const child = await this.compositionRepo.findOne({ where: { code: item.childCompositionCode } });
                        if (child) { ci.childCompositionId = child.id; ci.itemType = 'composicao_auxiliar'; }
                    }
                    await this.compositionItemRepo.save(this.compositionItemRepo.create(ci));
                }
            }
        }
        return { inserted, updated, total: compositions.length };
    }

    async importCompositionCosts(referenceId: string, costs: Array<{
        compositionCode: string; totalNotTaxed?: number; totalTaxed?: number;
        materialCost?: number; laborCost?: number; equipmentCost?: number;
    }>) {
        let imported = 0, skipped = 0;
        for (const c of costs) {
            const comp = await this.compositionRepo.findOne({ where: { code: c.compositionCode } });
            if (!comp) { skipped++; continue; }
            const existing = await this.compositionCostRepo.findOne({ where: { referenceId, compositionId: comp.id } });
            if (existing) {
                await this.compositionCostRepo.update(existing.id, {
                    totalNotTaxed: c.totalNotTaxed, totalTaxed: c.totalTaxed,
                    materialCost: c.materialCost, laborCost: c.laborCost,
                    equipmentCost: c.equipmentCost,
                });
            } else {
                await this.compositionCostRepo.save(this.compositionCostRepo.create({
                    referenceId, compositionId: comp.id,
                    totalNotTaxed: c.totalNotTaxed, totalTaxed: c.totalTaxed,
                    materialCost: c.materialCost, laborCost: c.laborCost,
                    equipmentCost: c.equipmentCost,
                }));
            }
            imported++;
        }
        return { imported, skipped, total: costs.length };
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIG & STATS
    // ═══════════════════════════════════════════════════════════════

    async getConfig(key: string): Promise<string | null> {
        const cfg = await this.configRepo.findOne({ where: { key } });
        return cfg?.value ?? null;
    }

    async setConfig(key: string, value: string) {
        const existing = await this.configRepo.findOne({ where: { key } });
        if (existing) await this.configRepo.update(existing.id, { value });
        else await this.configRepo.save(this.configRepo.create({ key, value }));
        return { key, value };
    }

    async getAllConfigs() { return this.configRepo.find(); }

    async getStats() {
        const [refCount] = await this.dataSource.query('SELECT COUNT(*) FROM sinapi_references');
        const [inputCount] = await this.dataSource.query('SELECT COUNT(*) FROM sinapi_inputs');
        const [compCount] = await this.dataSource.query('SELECT COUNT(*) FROM sinapi_compositions');
        const [priceCount] = await this.dataSource.query('SELECT COUNT(*) FROM sinapi_input_prices');
        const [costCount] = await this.dataSource.query('SELECT COUNT(*) FROM sinapi_composition_costs');
        const [linkCount] = await this.dataSource.query('SELECT COUNT(*) FROM sinapi_budget_links');
        const defaultState = await this.getConfig('default_state');
        const activeRef = defaultState ? await this.findActiveReference(defaultState) : null;

        return {
            references: parseInt(refCount.count),
            inputs: parseInt(inputCount.count),
            compositions: parseInt(compCount.count),
            inputPrices: parseInt(priceCount.count),
            compositionCosts: parseInt(costCount.count),
            budgetLinks: parseInt(linkCount.count),
            defaultState: defaultState || 'PE',
            activeReference: activeRef?.label || null,
        };
    }
}
