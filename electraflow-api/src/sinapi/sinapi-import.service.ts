import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { SinapiReference } from './entities/sinapi-reference.entity';
import { SinapiInput } from './entities/sinapi-input.entity';
import { SinapiInputPrice } from './entities/sinapi-price.entity';
import { SinapiComposition } from './entities/sinapi-composition.entity';
import { SinapiCompositionItem } from './entities/sinapi-composition-item.entity';
import { SinapiCompositionCost } from './entities/sinapi-composition-price.entity';
import { SinapiImportLog, ImportLogStatus } from './entities/sinapi-import-log.entity';

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const UF_LIST = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
    'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
    'SE', 'SP', 'TO',
];

const MONTH_NAMES = ['', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface ImportResult {
    logId: string;
    status: ImportLogStatus;
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
    warnings: string[];
    totalRows: number;
    durationMs: number;
}

type SheetType = 'input_prices_nd' | 'input_prices_d' | 'comp_prices_nd' | 'comp_prices_d'
    | 'analytic' | 'analytic_cost' | 'labor_pct' | 'coefficients' | 'inputs' | 'unknown';

@Injectable()
export class SinapiImportService {
    private readonly logger = new Logger(SinapiImportService.name);

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
        @InjectRepository(SinapiImportLog)
        private importLogRepo: Repository<SinapiImportLog>,
        private dataSource: DataSource,
    ) {}

    // ═══════════════════════════════════════════════════════════════
    // MAIN ENTRY POINT
    // ═══════════════════════════════════════════════════════════════

    async importFile(file: Express.Multer.File, overrides?: {
        state?: string; year?: number; month?: number; taxRegime?: string; fileType?: string;
    }): Promise<ImportResult> {
        let workbook: XLSX.WorkBook;
        try {
            workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true, cellNF: true });
        } catch (err) {
            throw new Error(`Erro ao ler arquivo: ${err.message}`);
        }

        const { year, month } = this.detectYearMonth(file.originalname, overrides);

        let estRows = 0;
        for (const sn of workbook.SheetNames) {
            const r = XLSX.utils.decode_range(workbook.Sheets[sn]['!ref'] || 'A1');
            estRows += Math.max(0, r.e.r - r.s.r);
        }

        this.logger.log(`📂 Import: ${file.originalname} | ${year}/${month} | ~${estRows} linhas | ${workbook.SheetNames.length} abas`);

        const log = await this.importLogRepo.save(this.importLogRepo.create({
            fileName: file.originalname, fileType: 'mixed', state: overrides?.state || null,
            year, month, taxRegime: overrides?.taxRegime || 'nao_desonerado',
            status: ImportLogStatus.RUNNING, totalRows: estRows,
        }));

        setImmediate(() => {
            this.processInBackground(log.id, workbook, year, month)
                .catch(err => this.logger.error(`❌ BG import ${log.id}: ${err.message}`));
        });

        return {
            logId: log.id, status: ImportLogStatus.RUNNING,
            inserted: 0, updated: 0, skipped: 0,
            errors: [], warnings: [`Importação iniciada — ~${estRows} linhas, ${workbook.SheetNames.length} abas`],
            totalRows: estRows, durationMs: 0,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND PROCESSING
    // ═══════════════════════════════════════════════════════════════

    private async processInBackground(logId: string, workbook: XLSX.WorkBook, year: number, month: number) {
        const startTime = Date.now();
        const errors: string[] = [];
        const warnings: string[] = [];
        let result = { inserted: 0, updated: 0, skipped: 0 };
        let totalRows = 0;

        try {
            // Get or create single reference for this year/month
            const reference = await this.getOrCreateReference(year, month);
            await this.importLogRepo.update(logId, { referenceId: reference.id });

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const rows = this.parseSheet(sheet);
                totalRows += rows.length;

                if (rows.length === 0) { warnings.push(`Aba "${sheetName}" vazia`); continue; }

                const cols = Object.keys(rows[0]);
                const sheetType = this.detectSheetType(sheetName, cols);
                const ufCols = this.findUFColumns(cols);

                warnings.push(`[INFO] Aba "${sheetName}": ${rows.length} rows, tipo=${sheetType}, UF cols=${ufCols.length}`);
                this.logger.log(`📄 "${sheetName}": ${rows.length} rows, tipo=${sheetType}, ${ufCols.length} UF cols`);

                try {
                    switch (sheetType) {
                        case 'input_prices_nd':
                            result = this.merge(result, await this.processInputPricesMultiState(rows, ufCols, reference.id, 'nao_desonerado', errors, warnings));
                            break;
                        case 'input_prices_d':
                            result = this.merge(result, await this.processInputPricesMultiState(rows, ufCols, reference.id, 'desonerado', errors, warnings));
                            break;
                        case 'comp_prices_nd':
                            result = this.merge(result, await this.processCompPricesMultiState(rows, ufCols, reference.id, 'nao_desonerado', errors, warnings));
                            break;
                        case 'comp_prices_d':
                            result = this.merge(result, await this.processCompPricesMultiState(rows, ufCols, reference.id, 'desonerado', errors, warnings));
                            break;
                        case 'analytic':
                        case 'analytic_cost':
                            result = this.merge(result, await this.processAnalyticSheet(rows, errors, warnings));
                            break;
                        case 'coefficients':
                            result = this.merge(result, await this.processCoefficients(rows, ufCols, errors, warnings));
                            break;
                        case 'labor_pct':
                            warnings.push(`[SKIP] Aba "${sheetName}" é percentual de MO — informativo, não importado como preço`);
                            break;
                        default:
                            // Fallback: if has UF columns with numeric data, try as input prices
                            if (ufCols.length >= 10) {
                                warnings.push(`[FALLBACK] Aba "${sheetName}" tratada como preços de insumo`);
                                result = this.merge(result, await this.processInputPricesMultiState(rows, ufCols, reference.id, 'nao_desonerado', errors, warnings));
                            } else {
                                warnings.push(`[SKIP] Aba "${sheetName}" tipo desconhecido, ignorada`);
                            }
                    }
                } catch (sheetErr) {
                    errors.push(`Erro aba "${sheetName}": ${sheetErr.message}`);
                }

                await this.importLogRepo.update(logId, {
                    insertedCount: result.inserted, updatedCount: result.updated,
                    skippedCount: result.skipped, totalRows,
                });
            }

            const status = errors.length > 0
                ? (result.inserted + result.updated > 0 ? ImportLogStatus.PARTIAL : ImportLogStatus.ERROR)
                : ImportLogStatus.SUCCESS;

            await this.importLogRepo.update(logId, {
                status, totalRows,
                insertedCount: result.inserted, updatedCount: result.updated,
                skippedCount: result.skipped, errorCount: errors.length,
                errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null,
                warnings: warnings.length > 0 ? JSON.stringify(warnings.slice(0, 100)) : null,
                durationMs: Date.now() - startTime,
            });
            this.logger.log(`✅ Import ${logId}: +${result.inserted} ~${result.updated} (${Date.now() - startTime}ms)`);
        } catch (fatalErr) {
            this.logger.error(`❌ Fatal ${logId}: ${fatalErr.message}`, fatalErr.stack);
            await this.importLogRepo.update(logId, {
                status: ImportLogStatus.ERROR, errorCount: 1,
                errors: JSON.stringify([fatalErr.message]),
                durationMs: Date.now() - startTime,
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PROCESSOR: Input Prices Multi-State (ISD/ICD)
    // Each row: { Código, Descrição, Unidade, AC: "12.34", AL: "56.78", ... }
    // ═══════════════════════════════════════════════════════════════

    private async processInputPricesMultiState(
        rows: any[], ufCols: string[], referenceId: string, taxRegime: string,
        errors: string[], warnings: string[],
    ) {
        let inserted = 0, updated = 0, skipped = 0;
        const BATCH = 200;

        // Phase 1: Ensure all inputs exist
        const inputItems: { code: string; description: string; unit: string; type: string; group?: string }[] = [];
        for (const row of rows) {
            const code = this.getCode(row);
            const desc = this.getDesc(row);
            if (!code || !desc) { skipped++; continue; }
            inputItems.push({
                code, description: desc,
                unit: this.getUnit(row),
                type: this.detectInputType(desc),
                group: this.getField(row, ['Grupo', 'GRUPO', 'Classe']) || undefined,
            });
        }

        // Batch upsert inputs
        for (let b = 0; b < inputItems.length; b += BATCH) {
            const batch = inputItems.slice(b, b + BATCH);
            try {
                await this.dataSource.query(`
                    INSERT INTO sinapi_inputs (id, code, description, unit, type, "groupClass", origin, "isActive", "createdAt", "updatedAt")
                    SELECT gen_random_uuid(), t.code, t.description, t.unit, t.type, t.grp, 'sinapi', true, NOW(), NOW()
                    FROM (VALUES ${batch.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(', ')})
                    AS t(code, description, unit, type, grp)
                    ON CONFLICT (code) DO UPDATE SET
                        description = EXCLUDED.description, unit = EXCLUDED.unit,
                        type = EXCLUDED.type, "groupClass" = COALESCE(EXCLUDED."groupClass", sinapi_inputs."groupClass"),
                        "updatedAt" = NOW()
                `, batch.flatMap(i => [i.code, i.description, i.unit, i.type, i.group || null]));
            } catch (e) {
                errors.push(`Batch inputs ${b}: ${e.message}`);
            }
        }

        // Phase 2: Insert prices for each UF
        // Build a code→id map
        const allCodes = inputItems.map(i => i.code);
        const codeIdMap = new Map<string, string>();
        for (let b = 0; b < allCodes.length; b += 500) {
            const batch = allCodes.slice(b, b + 500);
            const result = await this.dataSource.query(
                `SELECT id, code FROM sinapi_inputs WHERE code = ANY($1)`, [batch],
            );
            for (const r of result) codeIdMap.set(r.code, r.id);
        }

        // For each UF column, batch insert prices
        for (const uf of ufCols) {
            const priceRows: { inputId: string; price: number }[] = [];
            for (const row of rows) {
                const code = this.getCode(row);
                if (!code) continue;
                const inputId = codeIdMap.get(code);
                if (!inputId) continue;
                const priceStr = row[uf];
                if (!priceStr && priceStr !== 0) continue;
                const price = this.parseNumber(priceStr);
                if (isNaN(price) || price < 0) continue;
                priceRows.push({ inputId, price });
            }

            if (priceRows.length === 0) continue;

            // Batch upsert prices
            for (let b = 0; b < priceRows.length; b += BATCH) {
                const batch = priceRows.slice(b, b + BATCH);
                try {
                    const isDesonerado = taxRegime === 'desonerado';
                    const priceCol = isDesonerado ? '"priceTaxed"' : '"priceNotTaxed"';
                    const otherCol = isDesonerado ? '"priceNotTaxed"' : '"priceTaxed"';

                    const res = await this.dataSource.query(`
                        INSERT INTO sinapi_input_prices (id, "referenceId", "inputId", state, ${priceCol}, origin, "createdAt")
                        SELECT gen_random_uuid(), $1, t.input_id, $2, t.price, 'sinapi', NOW()
                        FROM (VALUES ${batch.map((_, i) => `($${i * 2 + 3}::uuid, $${i * 2 + 4}::numeric)`).join(', ')})
                        AS t(input_id, price)
                        ON CONFLICT ("referenceId", "inputId", state) DO UPDATE SET
                            ${priceCol} = EXCLUDED.${priceCol}
                        RETURNING (xmax = 0) AS is_insert
                    `, [referenceId, uf, ...batch.flatMap(r => [r.inputId, r.price])]);

                    for (const r of res) {
                        if (r.is_insert) inserted++; else updated++;
                    }
                } catch (e) {
                    errors.push(`Preços ${uf} batch ${b}: ${e.message}`);
                }
            }
        }

        warnings.push(`[RESULT] Insumos+Preços: +${inserted} ~${updated} skip=${skipped}`);
        return { inserted, updated, skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // PROCESSOR: Composition Prices Multi-State (CSD/CCD)
    // Each row: { Grupo, Código, Descrição, Unidade, AC: "123.45", ... }
    // ═══════════════════════════════════════════════════════════════

    private async processCompPricesMultiState(
        rows: any[], ufCols: string[], referenceId: string, taxRegime: string,
        errors: string[], warnings: string[],
    ) {
        let inserted = 0, updated = 0, skipped = 0;
        const BATCH = 200;

        // Phase 1: Ensure compositions exist
        const compItems: { code: string; description: string; unit: string; group?: string }[] = [];
        for (const row of rows) {
            const code = this.getCode(row);
            const desc = this.getDesc(row);
            if (!code || !desc) { skipped++; continue; }
            compItems.push({
                code, description: desc,
                unit: this.getUnit(row),
                group: this.getField(row, ['Grupo', 'GRUPO', 'Classe']) || undefined,
            });
        }

        for (let b = 0; b < compItems.length; b += BATCH) {
            const batch = compItems.slice(b, b + BATCH);
            try {
                await this.dataSource.query(`
                    INSERT INTO sinapi_compositions (id, code, description, unit, "classCode", type, "isActive", "createdAt", "updatedAt")
                    SELECT gen_random_uuid(), t.code, t.description, t.unit, t.grp, 'composition', true, NOW(), NOW()
                    FROM (VALUES ${batch.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')})
                    AS t(code, description, unit, grp)
                    ON CONFLICT (code) DO UPDATE SET
                        description = EXCLUDED.description, unit = EXCLUDED.unit,
                        "classCode" = COALESCE(EXCLUDED."classCode", sinapi_compositions."classCode"),
                        "updatedAt" = NOW()
                `, batch.flatMap(i => [i.code, i.description, i.unit, i.group || null]));
            } catch (e) {
                errors.push(`Batch composições ${b}: ${e.message}`);
            }
        }

        // Code→id map
        const allCodes = compItems.map(i => i.code);
        const codeIdMap = new Map<string, string>();
        for (let b = 0; b < allCodes.length; b += 500) {
            const batch = allCodes.slice(b, b + 500);
            const result = await this.dataSource.query(
                `SELECT id, code FROM sinapi_compositions WHERE code = ANY($1)`, [batch],
            );
            for (const r of result) codeIdMap.set(r.code, r.id);
        }

        // Phase 2: Insert costs per UF
        for (const uf of ufCols) {
            const costRows: { compId: string; cost: number }[] = [];
            for (const row of rows) {
                const code = this.getCode(row);
                if (!code) continue;
                const compId = codeIdMap.get(code);
                if (!compId) continue;
                const costStr = row[uf];
                if (!costStr && costStr !== 0) continue;
                const cost = this.parseNumber(costStr);
                if (isNaN(cost) || cost < 0) continue;
                costRows.push({ compId, cost });
            }

            if (costRows.length === 0) continue;

            for (let b = 0; b < costRows.length; b += BATCH) {
                const batch = costRows.slice(b, b + BATCH);
                try {
                    const isDesonerado = taxRegime === 'desonerado';
                    const costCol = isDesonerado ? '"totalTaxed"' : '"totalNotTaxed"';

                    const res = await this.dataSource.query(`
                        INSERT INTO sinapi_composition_costs (id, "referenceId", "compositionId", state, ${costCol}, "calculationMethod", "createdAt")
                        SELECT gen_random_uuid(), $1, t.comp_id, $2, t.cost, 'imported', NOW()
                        FROM (VALUES ${batch.map((_, i) => `($${i * 2 + 3}::uuid, $${i * 2 + 4}::numeric)`).join(', ')})
                        AS t(comp_id, cost)
                        ON CONFLICT ("referenceId", "compositionId", state) DO UPDATE SET
                            ${costCol} = EXCLUDED.${costCol}
                        RETURNING (xmax = 0) AS is_insert
                    `, [referenceId, uf, ...batch.flatMap(r => [r.compId, r.cost])]);

                    for (const r of res) {
                        if (r.is_insert) inserted++; else updated++;
                    }
                } catch (e) {
                    errors.push(`Custos comp ${uf} batch ${b}: ${e.message}`);
                }
            }
        }

        warnings.push(`[RESULT] Composições+Custos: +${inserted} ~${updated} skip=${skipped}`);
        return { inserted, updated, skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // PROCESSOR: Analytic Sheet (composition items + coefficients)
    // ═══════════════════════════════════════════════════════════════

    private async processAnalyticSheet(rows: any[], errors: string[], warnings: string[]) {
        let inserted = 0, updated = 0, skipped = 0;

        const compositions = new Map<string, { desc: string; unit: string; items: { inputCode: string; coef: number; desc?: string }[] }>();
        let currentComp = '';

        for (const row of rows) {
            const compCode = this.getField(row, ['Composição', 'COMPOSICAO', 'COMPOSIÇÃO', 'Código da Composição', 'Codigo da Composicao']);
            const itemCode = this.getField(row, ['Código', 'CODIGO', 'CÓDIGO', 'Código do Insumo', 'Codigo do Insumo', 'Componente']);
            const coefStr = this.getField(row, ['Coeficiente', 'COEFICIENTE', 'COEF', 'Quantidade', 'QTD']);

            if (compCode) {
                const clean = String(compCode).trim().replace(/\D/g, '');
                if (clean) {
                    currentComp = clean;
                    if (!compositions.has(clean)) {
                        compositions.set(clean, {
                            desc: this.getDesc(row) || `Composição ${clean}`,
                            unit: this.getUnit(row),
                            items: [],
                        });
                    }
                }
            }

            if (currentComp && itemCode && coefStr) {
                const cleanItem = String(itemCode).trim().replace(/\D/g, '');
                const coef = this.parseNumber(coefStr);
                if (cleanItem && !isNaN(coef) && coef > 0) {
                    compositions.get(currentComp)?.items.push({
                        inputCode: cleanItem, coef,
                        desc: this.getDesc(row) || undefined,
                    });
                }
            }
        }

        for (const [code, data] of compositions) {
            try {
                // Ensure composition exists
                let comp = await this.compositionRepo.findOne({ where: { code } });
                if (!comp) {
                    comp = await this.compositionRepo.save(this.compositionRepo.create({
                        code, description: data.desc, unit: data.unit, type: 'composition',
                    }));
                    inserted++;
                } else {
                    await this.compositionItemRepo.delete({ compositionId: comp.id });
                    updated++;
                }

                // Insert items
                for (let idx = 0; idx < data.items.length; idx++) {
                    const item = data.items[idx];
                    const ci: any = { compositionId: comp.id, coefficient: item.coef, sortOrder: idx, itemType: 'insumo' };

                    const input = await this.inputRepo.findOne({ where: { code: item.inputCode } });
                    if (input) {
                        ci.inputId = input.id;
                    } else {
                        const childComp = await this.compositionRepo.findOne({ where: { code: item.inputCode } });
                        if (childComp) {
                            ci.childCompositionId = childComp.id;
                            ci.itemType = 'composicao_auxiliar';
                        }
                    }

                    await this.compositionItemRepo.save(this.compositionItemRepo.create(ci));
                }
            } catch (e) {
                errors.push(`Composição analítica ${code}: ${e.message}`);
            }
        }

        warnings.push(`[RESULT] Analítico: ${compositions.size} composições processadas`);
        return { inserted, updated, skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // PROCESSOR: Family Coefficients
    // ═══════════════════════════════════════════════════════════════

    private async processCoefficients(rows: any[], ufCols: string[], errors: string[], warnings: string[]) {
        let inserted = 0, updated = 0, skipped = 0;
        const BATCH = 200;

        // This file has: Família code, Insumo code, Descrição, Unidade, Categoria, then UF columns with coefficients
        const inputItems: { code: string; description: string; unit: string; type: string }[] = [];
        for (const row of rows) {
            const code = this.getField(row, ['Código do Insumo', 'Codigo do Insumo']);
            const desc = this.getField(row, ['Descrição do Insumo', 'Descricao do Insumo', 'Descrição', 'DESCRICAO']);
            if (!code || !desc) { skipped++; continue; }
            const cleanCode = String(code).trim().replace(/\D/g, '');
            if (!cleanCode) { skipped++; continue; }
            inputItems.push({
                code: cleanCode,
                description: String(desc).trim(),
                unit: this.getField(row, ['Unidade', 'UNIDADE', 'UN']) || 'UN',
                type: this.detectInputType(String(desc)),
            });
        }

        // Upsert inputs
        for (let b = 0; b < inputItems.length; b += BATCH) {
            const batch = inputItems.slice(b, b + BATCH);
            try {
                const res = await this.dataSource.query(`
                    INSERT INTO sinapi_inputs (id, code, description, unit, type, origin, "isActive", "createdAt", "updatedAt")
                    SELECT gen_random_uuid(), t.code, t.description, t.unit, t.type, 'sinapi', true, NOW(), NOW()
                    FROM (VALUES ${batch.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')})
                    AS t(code, description, unit, type)
                    ON CONFLICT (code) DO UPDATE SET
                        description = EXCLUDED.description, unit = EXCLUDED.unit,
                        type = EXCLUDED.type, "updatedAt" = NOW()
                    RETURNING (xmax = 0) AS is_insert
                `, batch.flatMap(i => [i.code, i.description, i.unit, i.type]));
                for (const r of res) { if (r.is_insert) inserted++; else updated++; }
            } catch (e) {
                errors.push(`Coeficientes batch ${b}: ${e.message}`);
            }
        }

        warnings.push(`[RESULT] Coeficientes: +${inserted} ~${updated} skip=${skipped}`);
        return { inserted, updated, skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // DETECTION HELPERS
    // ═══════════════════════════════════════════════════════════════

    private detectSheetType(sheetName: string, cols: string[]): SheetType {
        const norm = (s: string) => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const sn = norm(sheetName);
        const normCols = cols.map(c => norm(c));
        const hasUFs = this.findUFColumns(cols).length >= 10;

        // SINAPI Referência file — sheet names like "SEM Desoneração", "COM Desoneração"
        const isInsumoFile = normCols.some(c => c.includes('CODIGO') || c.includes('CODIGO SINAPI'));
        const isCompFile = normCols.some(c => c.includes('CODIGO DA COMPOSICAO') || c.includes('COMPOSICAO'));
        const hasCoef = normCols.some(c => c.includes('COEFICIENTE') || c.includes('COEF'));
        const isPctMO = sn.includes('PERCENTUAL') || sn.includes('% MO') || sn.includes('PCT');

        // Percentual de MO tab
        if (isPctMO) return 'labor_pct';

        // Analítico tab
        if (sn.includes('ANALITICO')) {
            return normCols.some(c => c.includes('CUSTO') || c.includes('PRECO')) ? 'analytic_cost' : 'analytic';
        }

        // Coeficientes file
        if (hasCoef || sn.includes('COEFICIENTE')) return 'coefficients';

        // Compositions with prices per state
        if (isCompFile && hasUFs) {
            if (sn.includes('SEM') || sn.includes('NAO') || sn.includes('ND')) return 'comp_prices_nd';
            if (sn.includes('COM') || sn.includes('CD')) return 'comp_prices_d';
            return 'comp_prices_nd'; // default
        }

        // Inputs with prices per state
        if (isInsumoFile && hasUFs) {
            if (sn.includes('SEM') || sn.includes('NAO') || sn.includes('ND')) return 'input_prices_nd';
            if (sn.includes('COM') || sn.includes('CD')) return 'input_prices_d';
            return 'input_prices_nd';
        }

        // Generic: has UFs → assume input prices
        if (hasUFs) {
            if (sn.includes('SEM') || sn.includes('NAO')) return 'input_prices_nd';
            if (sn.includes('COM')) return 'input_prices_d';
            // Check if data looks like percentages (%) or currency (R$)
            return 'input_prices_nd';
        }

        return 'unknown';
    }

    private findUFColumns(cols: string[]): string[] {
        return cols.filter(c => UF_LIST.includes(c.trim().toUpperCase()));
    }

    private detectYearMonth(filename: string, overrides?: any): { year: number; month: number } {
        if (overrides?.year && overrides?.month) return { year: overrides.year, month: overrides.month };
        const upper = filename.toUpperCase();
        let year = new Date().getFullYear(), month = new Date().getMonth() + 1;
        const ym = upper.match(/(\d{4})[_\- ]?(\d{2})/);
        if (ym) { const y = parseInt(ym[1]), m = parseInt(ym[2]); if (y >= 2000 && m >= 1 && m <= 12) { year = y; month = m; } }
        if (!ym) { const my = upper.match(/(\d{2})[_\- ]?(\d{4})/); if (my) { const m = parseInt(my[1]), y = parseInt(my[2]); if (y >= 2000 && m >= 1 && m <= 12) { year = y; month = m; } } }
        return { year: overrides?.year || year, month: overrides?.month || month };
    }

    // ═══════════════════════════════════════════════════════════════
    // FIELD HELPERS
    // ═══════════════════════════════════════════════════════════════

    private parseSheet(sheet: XLSX.Sheet): any[] {
        const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', header: 1, raw: false });
        const norm = (s: string) => s.toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const PATTERNS = ['CODIGO', 'COD', 'DESCRICAO', 'UNIDADE', 'COMPOSICAO', 'COEFICIENTE', 'PRECO', 'CUSTO', 'GRUPO', 'INSUMO', 'CLASSE'];

        let headerRow = 0;
        for (let r = 0; r < Math.min(rawRows.length, 30); r++) {
            const vals = (Array.isArray(rawRows[r]) ? rawRows[r] : Object.values(rawRows[r])).map((v: any) => norm(String(v || '')));
            let matches = 0;
            for (const val of vals) { if (val && val.length >= 2 && PATTERNS.some(p => val.includes(p))) matches++; }
            // Also check if row has UF columns
            const ufMatches = vals.filter(v => UF_LIST.includes(v)).length;
            if (matches >= 2 || ufMatches >= 5) { headerRow = r; break; }
        }

        let rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', raw: false, range: headerRow });
        return rows.map((row: any) => {
            const cleaned: any = {};
            for (const key of Object.keys(row)) {
                cleaned[key.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()] = row[key];
            }
            return cleaned;
        });
    }

    private getCode(row: any): string | null {
        const raw = this.getField(row, [
            'Código', 'CODIGO', 'CÓDIGO', 'Código SINAPI', 'CODIGO SINAPI',
            'Código da Composição', 'Codigo da Composicao', 'COD',
            'Código do Insumo', 'Codigo do Insumo',
        ]);
        if (!raw) return null;
        const clean = String(raw).trim().replace(/\D/g, '');
        return clean || null;
    }

    private getDesc(row: any): string | null {
        const raw = this.getField(row, [
            'Descrição', 'DESCRICAO', 'DESCRIÇÃO', 'Descrição do Insumo',
            'Descricao do Insumo', 'DESC', 'Descrição da Composição',
        ]);
        return raw ? String(raw).trim() : null;
    }

    private getUnit(row: any): string {
        const raw = this.getField(row, ['Unidade', 'UNIDADE', 'UN', 'UND', 'UNID']);
        return raw ? String(raw).trim().toUpperCase() : 'UN';
    }

    private getField(row: any, names: string[]): string | null {
        const norm = (s: string) => s.toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (const name of names) {
            const n = norm(name);
            if (row[name] !== undefined && row[name] !== '') return String(row[name]);
            const exact = Object.keys(row).find(k => norm(k) === n);
            if (exact && row[exact] !== undefined && row[exact] !== '') return String(row[exact]);
            const partial = Object.keys(row).find(k => norm(k).includes(n));
            if (partial && row[partial] !== undefined && row[partial] !== '') return String(row[partial]);
        }
        return null;
    }

    private parseNumber(value: any): number {
        if (typeof value === 'number') return value;
        if (!value) return NaN;
        let str = String(value).trim().replace(/R\$\s*/gi, '').replace(/[^\d.,\-]/g, '');
        if (str.includes(',')) str = str.replace(/\./g, '').replace(',', '.');
        return parseFloat(str);
    }

    private detectInputType(description: string): string {
        const upper = (description || '').toUpperCase();
        if (upper.includes('MAO DE OBRA') || upper.includes('MÃO DE OBRA')
            || upper.includes('SERVENTE') || upper.includes('PEDREIRO')
            || upper.includes('ELETRICISTA') || upper.includes('ENCANADOR')
            || upper.includes('AJUDANTE') || upper.includes('OFICIAL')
            || upper.includes('MONTADOR') || upper.includes('SOLDADOR')
            || upper.includes('ARMADOR')) return 'mao_de_obra';
        if (upper.includes('EQUIPAMENTO') || upper.includes('RETROESCAVADEIRA')
            || upper.includes('BETONEIRA') || upper.includes('CAMINHAO')
            || upper.includes('GUINDASTE') || upper.includes('COMPRESSOR')
            || upper.includes('VIBRADOR') || upper.includes('GERADOR')) return 'equipamento';
        return 'material';
    }

    private async getOrCreateReference(year: number, month: number): Promise<SinapiReference> {
        let ref = await this.referenceRepo.findOne({ where: { year, month } });
        if (ref) return ref;
        ref = await this.referenceRepo.save(this.referenceRepo.create({
            year, month,
            label: `SINAPI ${MONTH_NAMES[month]}/${year}`,
            status: 'active',
        }));
        return ref;
    }

    private merge(a: any, b: any) {
        return { inserted: a.inserted + b.inserted, updated: a.updated + b.updated, skipped: a.skipped + b.skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // IMPORT LOGS
    // ═══════════════════════════════════════════════════════════════

    async getImportLogs(limit = 50) {
        return this.importLogRepo.find({ relations: ['reference'], order: { createdAt: 'DESC' }, take: limit });
    }

    async getImportLog(id: string) {
        return this.importLogRepo.findOne({ where: { id }, relations: ['reference'] });
    }

    async deleteImportLog(id: string) {
        await this.importLogRepo.delete(id);
    }

    async rollbackImport(logId: string): Promise<{ deleted: number }> {
        const log = await this.importLogRepo.findOne({ where: { id: logId } });
        if (!log || !log.referenceId) throw new Error('Log ou referência não encontrado');
        const [pricesDeleted] = await this.dataSource.query(`DELETE FROM sinapi_input_prices WHERE "referenceId" = $1`, [log.referenceId]);
        const [costsDeleted] = await this.dataSource.query(`DELETE FROM sinapi_composition_costs WHERE "referenceId" = $1`, [log.referenceId]);
        await this.importLogRepo.update(logId, { status: ImportLogStatus.ERROR, errors: JSON.stringify(['Rollback executado']) });
        return { deleted: (pricesDeleted?.rowCount || 0) + (costsDeleted?.rowCount || 0) };
    }
}
