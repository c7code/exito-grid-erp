import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { SinapiInput } from './entities/sinapi-input.entity';
import { SinapiPrice } from './entities/sinapi-price.entity';
import { SinapiComposition } from './entities/sinapi-composition.entity';
import { SinapiCompositionItem } from './entities/sinapi-composition-item.entity';
import { SinapiCompositionPrice } from './entities/sinapi-composition-price.entity';
import { SinapiConfig } from './entities/sinapi-config.entity';

@Injectable()
export class SinapiService implements OnModuleInit {
    private readonly logger = new Logger(SinapiService.name);

    constructor(
        @InjectRepository(SinapiInput)
        private inputRepo: Repository<SinapiInput>,
        @InjectRepository(SinapiPrice)
        private priceRepo: Repository<SinapiPrice>,
        @InjectRepository(SinapiComposition)
        private compositionRepo: Repository<SinapiComposition>,
        @InjectRepository(SinapiCompositionItem)
        private compositionItemRepo: Repository<SinapiCompositionItem>,
        @InjectRepository(SinapiCompositionPrice)
        private compositionPriceRepo: Repository<SinapiCompositionPrice>,
        @InjectRepository(SinapiConfig)
        private configRepo: Repository<SinapiConfig>,
        private dataSource: DataSource,
    ) {}

    // ═══════════════════════════════════════════════════════════════
    // MIGRATIONS
    // ═══════════════════════════════════════════════════════════════

    async onModuleInit() {
        try {
            this.logger.log('🏗️  SINAPI tables migration...');

            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_inputs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    code VARCHAR NOT NULL,
                    description TEXT NOT NULL,
                    unit VARCHAR NOT NULL DEFAULT 'UN',
                    type VARCHAR DEFAULT 'material',
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

            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_prices (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "inputId" UUID NOT NULL REFERENCES sinapi_inputs(id) ON DELETE CASCADE,
                    state CHAR(2) NOT NULL,
                    "referenceDate" DATE NOT NULL,
                    "priceNotTaxed" DECIMAL(15,2),
                    "priceTaxed" DECIMAL(15,2),
                    source VARCHAR DEFAULT 'sinapi',
                    "createdAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await this.dataSource.query(`
                CREATE INDEX IF NOT EXISTS idx_sinapi_price_input_state
                ON sinapi_prices("inputId", state, "referenceDate")
            `).catch(() => {});

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

            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_composition_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "compositionId" UUID NOT NULL REFERENCES sinapi_compositions(id) ON DELETE CASCADE,
                    "inputId" UUID REFERENCES sinapi_inputs(id) ON DELETE SET NULL,
                    "childCompositionId" UUID REFERENCES sinapi_compositions(id) ON DELETE SET NULL,
                    coefficient DECIMAL(15,6) NOT NULL DEFAULT 1,
                    "createdAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_composition_prices (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "compositionId" UUID NOT NULL REFERENCES sinapi_compositions(id) ON DELETE CASCADE,
                    state CHAR(2) NOT NULL,
                    "referenceDate" DATE NOT NULL,
                    "totalNotTaxed" DECIMAL(15,2),
                    "totalTaxed" DECIMAL(15,2),
                    "createdAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await this.dataSource.query(`
                CREATE INDEX IF NOT EXISTS idx_sinapi_comp_price
                ON sinapi_composition_prices("compositionId", state)
            `).catch(() => {});

            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS sinapi_configs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    key VARCHAR NOT NULL UNIQUE,
                    value TEXT,
                    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            this.logger.log('✅ SINAPI tables OK');
        } catch (e) {
            this.logger.warn('SINAPI tables migration: ' + e?.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // INPUTS (INSUMOS)
    // ═══════════════════════════════════════════════════════════════

    async searchInputs(params: {
        search?: string;
        type?: string;
        page?: number;
        limit?: number;
    }) {
        const { search, type, page = 1, limit = 50 } = params;
        const where: any = { isActive: true };
        if (type) where.type = type;

        const qb = this.inputRepo.createQueryBuilder('i')
            .where('i."isActive" = true');

        if (type) qb.andWhere('i.type = :type', { type });
        if (search) {
            qb.andWhere('(i.code ILIKE :s OR i.description ILIKE :s)', { s: `%${search}%` });
        }

        qb.orderBy('i.code', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);

        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }

    async findInputByCode(code: string) {
        return this.inputRepo.findOne({
            where: { code },
            relations: ['catalogItem'],
        });
    }

    async findInputById(id: string) {
        return this.inputRepo.findOne({
            where: { id },
            relations: ['catalogItem'],
        });
    }

    async getInputPrices(inputId: string, state?: string) {
        const where: any = { inputId };
        if (state) where.state = state.toUpperCase();
        return this.priceRepo.find({
            where,
            order: { referenceDate: 'DESC' },
            take: 24, // últimos 24 meses
        });
    }

    async getLatestInputPrice(inputId: string, state: string) {
        return this.priceRepo.findOne({
            where: { inputId, state: state.toUpperCase() },
            order: { referenceDate: 'DESC' },
        });
    }

    async linkInputToCatalog(inputId: string, catalogItemId: string) {
        await this.inputRepo.update(inputId, { catalogItemId });
        return this.findInputById(inputId);
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPOSITIONS (COMPOSIÇÕES)
    // ═══════════════════════════════════════════════════════════════

    async searchCompositions(params: {
        search?: string;
        classCode?: string;
        page?: number;
        limit?: number;
    }) {
        const { search, classCode, page = 1, limit = 50 } = params;

        const qb = this.compositionRepo.createQueryBuilder('c')
            .where('c."isActive" = true');

        if (classCode) qb.andWhere('c."classCode" = :classCode', { classCode });
        if (search) {
            qb.andWhere('(c.code ILIKE :s OR c.description ILIKE :s)', { s: `%${search}%` });
        }

        qb.orderBy('c.code', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);

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

    async getCompositionPrice(compositionId: string, state: string) {
        return this.compositionPriceRepo.findOne({
            where: { compositionId, state: state.toUpperCase() },
            order: { referenceDate: 'DESC' },
        });
    }

    async getCompositionPriceByCode(code: string, state: string) {
        const comp = await this.compositionRepo.findOne({ where: { code } });
        if (!comp) throw new NotFoundException(`Composição ${code} não encontrada`);
        return this.getCompositionPrice(comp.id, state);
    }

    // ═══════════════════════════════════════════════════════════════
    // IMPORT (Bulk insert de dados SINAPI)
    // ═══════════════════════════════════════════════════════════════

    async importInputs(inputs: Array<{
        code: string;
        description: string;
        unit: string;
        type?: string;
    }>) {
        let inserted = 0;
        let updated = 0;

        for (const item of inputs) {
            const existing = await this.inputRepo.findOne({ where: { code: item.code } });
            if (existing) {
                await this.inputRepo.update(existing.id, {
                    description: item.description,
                    unit: item.unit,
                    type: item.type || existing.type,
                });
                updated++;
            } else {
                await this.inputRepo.save(this.inputRepo.create({
                    code: item.code,
                    description: item.description,
                    unit: item.unit,
                    type: item.type || 'material',
                }));
                inserted++;
            }
        }

        return { inserted, updated, total: inputs.length };
    }

    async importPrices(prices: Array<{
        inputCode: string;
        state: string;
        referenceDate: string;
        priceNotTaxed?: number;
        priceTaxed?: number;
    }>) {
        let imported = 0;
        let skipped = 0;

        for (const p of prices) {
            const input = await this.inputRepo.findOne({ where: { code: p.inputCode } });
            if (!input) { skipped++; continue; }

            // Upsert: remove anterior do mesmo mês/UF e insere novo
            await this.priceRepo.delete({
                inputId: input.id,
                state: p.state.toUpperCase(),
                referenceDate: new Date(p.referenceDate) as any,
            });

            await this.priceRepo.save(this.priceRepo.create({
                inputId: input.id,
                state: p.state.toUpperCase(),
                referenceDate: new Date(p.referenceDate),
                priceNotTaxed: p.priceNotTaxed,
                priceTaxed: p.priceTaxed,
            }));
            imported++;
        }

        return { imported, skipped, total: prices.length };
    }

    async importCompositions(compositions: Array<{
        code: string;
        description: string;
        unit: string;
        classCode?: string;
        className?: string;
        items?: Array<{
            inputCode?: string;
            childCompositionCode?: string;
            coefficient: number;
        }>;
    }>) {
        let inserted = 0;
        let updated = 0;

        for (const comp of compositions) {
            let existing = await this.compositionRepo.findOne({ where: { code: comp.code } });

            if (existing) {
                await this.compositionRepo.update(existing.id, {
                    description: comp.description,
                    unit: comp.unit,
                    classCode: comp.classCode,
                    className: comp.className,
                });
                // Remove items antigos para reimportar
                await this.compositionItemRepo.delete({ compositionId: existing.id });
                updated++;
            } else {
                existing = await this.compositionRepo.save(this.compositionRepo.create({
                    code: comp.code,
                    description: comp.description,
                    unit: comp.unit,
                    classCode: comp.classCode,
                    className: comp.className,
                }));
                inserted++;
            }

            // Import items
            if (comp.items?.length) {
                for (const item of comp.items) {
                    const ci: any = {
                        compositionId: existing.id,
                        coefficient: item.coefficient,
                    };

                    if (item.inputCode) {
                        const input = await this.inputRepo.findOne({ where: { code: item.inputCode } });
                        if (input) ci.inputId = input.id;
                    }
                    if (item.childCompositionCode) {
                        const child = await this.compositionRepo.findOne({ where: { code: item.childCompositionCode } });
                        if (child) ci.childCompositionId = child.id;
                    }

                    await this.compositionItemRepo.save(this.compositionItemRepo.create(ci));
                }
            }
        }

        return { inserted, updated, total: compositions.length };
    }

    async importCompositionPrices(prices: Array<{
        compositionCode: string;
        state: string;
        referenceDate: string;
        totalNotTaxed?: number;
        totalTaxed?: number;
    }>) {
        let imported = 0;
        let skipped = 0;

        for (const p of prices) {
            const comp = await this.compositionRepo.findOne({ where: { code: p.compositionCode } });
            if (!comp) { skipped++; continue; }

            await this.compositionPriceRepo.delete({
                compositionId: comp.id,
                state: p.state.toUpperCase(),
                referenceDate: new Date(p.referenceDate) as any,
            });

            await this.compositionPriceRepo.save(this.compositionPriceRepo.create({
                compositionId: comp.id,
                state: p.state.toUpperCase(),
                referenceDate: new Date(p.referenceDate),
                totalNotTaxed: p.totalNotTaxed,
                totalTaxed: p.totalTaxed,
            }));
            imported++;
        }

        return { imported, skipped, total: prices.length };
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════════

    async getConfig(key: string): Promise<string | null> {
        const cfg = await this.configRepo.findOne({ where: { key } });
        return cfg?.value ?? null;
    }

    async setConfig(key: string, value: string) {
        const existing = await this.configRepo.findOne({ where: { key } });
        if (existing) {
            await this.configRepo.update(existing.id, { value });
        } else {
            await this.configRepo.save(this.configRepo.create({ key, value }));
        }
        return { key, value };
    }

    async getAllConfigs() {
        return this.configRepo.find();
    }

    // ═══════════════════════════════════════════════════════════════
    // STATS
    // ═══════════════════════════════════════════════════════════════

    async getStats() {
        const [inputCount] = await this.dataSource.query('SELECT COUNT(*) FROM sinapi_inputs');
        const [compCount] = await this.dataSource.query('SELECT COUNT(*) FROM sinapi_compositions');
        const [priceCount] = await this.dataSource.query('SELECT COUNT(*) FROM sinapi_prices');
        const lastImport = await this.getConfig('last_import_date');
        const defaultState = await this.getConfig('default_state');

        return {
            inputs: parseInt(inputCount.count),
            compositions: parseInt(compCount.count),
            prices: parseInt(priceCount.count),
            lastImportDate: lastImport,
            defaultState: defaultState || 'SP',
        };
    }
}
