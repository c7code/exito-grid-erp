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

const UF_LIST = [
    'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS',
    'MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC',
    'SE','SP','TO',
];
const MONTH_NAMES = ['','JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

export interface ImportResult {
    logId: string; status: ImportLogStatus;
    inserted: number; updated: number; skipped: number;
    errors: string[]; warnings: string[];
    totalRows: number; durationMs: number;
}

type SheetType = 'input_prices_nd'|'input_prices_d'|'comp_prices_nd'|'comp_prices_d'
    |'analytic'|'analytic_cost'|'labor_pct'|'coefficients'|'unknown';

@Injectable()
export class SinapiImportService {
    private readonly logger = new Logger(SinapiImportService.name);

    constructor(
        @InjectRepository(SinapiReference) private referenceRepo: Repository<SinapiReference>,
        @InjectRepository(SinapiInput) private inputRepo: Repository<SinapiInput>,
        @InjectRepository(SinapiInputPrice) private inputPriceRepo: Repository<SinapiInputPrice>,
        @InjectRepository(SinapiComposition) private compositionRepo: Repository<SinapiComposition>,
        @InjectRepository(SinapiCompositionItem) private compositionItemRepo: Repository<SinapiCompositionItem>,
        @InjectRepository(SinapiCompositionCost) private compositionCostRepo: Repository<SinapiCompositionCost>,
        @InjectRepository(SinapiImportLog) private importLogRepo: Repository<SinapiImportLog>,
        private dataSource: DataSource,
    ) {}

    // ═══════════════════════════════════════════════════════════════
    // MAIN ENTRY
    // ═══════════════════════════════════════════════════════════════
    async importFile(file: Express.Multer.File, overrides?: {
        state?: string; year?: number; month?: number; taxRegime?: string; fileType?: string;
    }): Promise<ImportResult> {
        const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true, cellNF: true });
        const { year, month } = this.detectYearMonth(file.originalname, overrides);

        let estRows = 0;
        for (const sn of workbook.SheetNames) {
            const r = XLSX.utils.decode_range(workbook.Sheets[sn]['!ref'] || 'A1');
            estRows += Math.max(0, r.e.r - r.s.r);
        }

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
            errors: [], warnings: [`Importação iniciada — ~${estRows} linhas`],
            totalRows: estRows, durationMs: 0,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND
    // ═══════════════════════════════════════════════════════════════
    private async processInBackground(logId: string, workbook: XLSX.WorkBook, year: number, month: number) {
        const startTime = Date.now();
        const errors: string[] = [];
        const warnings: string[] = [];
        let result = { inserted: 0, updated: 0, skipped: 0 };
        let totalRows = 0;

        try {
            const reference = await this.getOrCreateReference(year, month);
            await this.importLogRepo.update(logId, { referenceId: reference.id });

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const { rows, headers } = this.parseSheet(sheet);
                totalRows += rows.length;
                if (rows.length === 0) { warnings.push(`Aba "${sheetName}" vazia`); continue; }

                const ufCols = this.findUFColumns(headers);
                let sheetType = this.detectSheetType(sheetName, headers);

                // Detect if UF values are percentages (MO file) vs currency
                if (ufCols.length > 0 && rows.length > 0 && sheetType !== 'labor_pct') {
                    const sampleVals = rows.slice(0, 5).map(r => String(r[ufCols[0]] || ''));
                    const hasPct = sampleVals.some(v => v.includes('%'));
                    if (hasPct) { sheetType = 'labor_pct'; }
                }

                warnings.push(`[INFO] "${sheetName}": ${rows.length} rows, tipo=${sheetType}, UFs=${ufCols.length}, hdrs=${headers.slice(0,6).join('|')}`);
                if (rows[0]) {
                    const sample: any = {};
                    for (const k of headers.slice(0, 6)) sample[k] = String(rows[0][k] || '').substring(0, 30);
                    warnings.push(`[ROW0] "${sheetName}": ${JSON.stringify(sample)}`);
                }

                try {
                    switch (sheetType) {
                        case 'input_prices_nd':
                            result = this.merge(result, await this.processInputPrices(rows, ufCols, reference.id, 'nao_desonerado', errors, warnings));
                            break;
                        case 'input_prices_d':
                            result = this.merge(result, await this.processInputPrices(rows, ufCols, reference.id, 'desonerado', errors, warnings));
                            break;
                        case 'comp_prices_nd':
                            result = this.merge(result, await this.processCompPrices(rows, ufCols, reference.id, 'nao_desonerado', errors, warnings));
                            break;
                        case 'comp_prices_d':
                            result = this.merge(result, await this.processCompPrices(rows, ufCols, reference.id, 'desonerado', errors, warnings));
                            break;
                        case 'analytic': case 'analytic_cost':
                            result = this.merge(result, await this.processAnalytic(rows, errors, warnings));
                            break;
                        case 'labor_pct':
                            warnings.push(`[SKIP] "${sheetName}" é %MO — não importado`);
                            break;
                        default:
                            if (ufCols.length >= 10) {
                                warnings.push(`[FALLBACK] "${sheetName}" tratada como preços insumo`);
                                result = this.merge(result, await this.processInputPrices(rows, ufCols, reference.id, 'nao_desonerado', errors, warnings));
                            } else {
                                warnings.push(`[SKIP] "${sheetName}" desconhecida`);
                            }
                    }
                } catch (e: any) { errors.push(`Erro "${sheetName}": ${e.message}`); }

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
                warnings: warnings.length > 0 ? JSON.stringify(warnings.slice(0, 200)) : null,
                durationMs: Date.now() - startTime,
            });
        } catch (fatalErr: any) {
            this.logger.error(`❌ Fatal: ${fatalErr.message}`, fatalErr.stack);
            await this.importLogRepo.update(logId, {
                status: ImportLogStatus.ERROR, errorCount: 1,
                errors: JSON.stringify([fatalErr.message]),
                durationMs: Date.now() - startTime,
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PARSE SHEET — Smart header detection for SINAPI multi-row headers
    // ═══════════════════════════════════════════════════════════════
    private parseSheet(sheet: XLSX.Sheet): { rows: any[]; headers: string[] } {
        const allRows: any[][] = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', header: 1, raw: false });
        if (allRows.length < 3) return { rows: [], headers: [] };

        const norm = (s: string) => String(s || '').toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\r\n]+/g, ' ');
        const KW = ['CODIGO','DESCRICAO','UNIDADE','GRUPO','COMPOSICAO','INSUMO','COEFICIENTE','CUSTO','TIPO','ITEM'];

        // Scan first 30 rows to find key landmarks
        let ufRow = -1, labelRow = -1, firstDataRow = -1;

        for (let r = 0; r < Math.min(allRows.length, 30); r++) {
            const vals = (allRows[r] || []).map((v: any) => norm(v));

            // Row with many UF abbreviations
            const ufCount = vals.filter(v => UF_LIST.includes(v)).length;
            if (ufCount >= 10 && ufRow === -1) ufRow = r;

            // Row with header keywords as VALUES
            let kwCount = 0;
            for (const val of vals) {
                if (val && KW.some(k => val.includes(k))) kwCount++;
            }
            if (kwCount >= 2 && (labelRow === -1 || kwCount > 2)) labelRow = r;

            // First row with a 4+ digit number (actual data)
            if (firstDataRow === -1) {
                for (const val of vals) {
                    if (/^\d{4,10}$/.test(val)) { firstDataRow = r; break; }
                }
            }
        }

        // Build headers by merging UF row (for UF column names) + label row (for item columns)
        let headers: string[] = [];
        let dataStart: number;

        if (ufRow >= 0) {
            const ufVals = allRows[ufRow].map((v: any) => norm(v));
            headers = allRows[ufRow].map((v: any) => String(v || '').replace(/[\r\n]+/g, ' ').trim());

            // If there's a label row AFTER uf row, merge labels for non-UF columns
            if (labelRow > ufRow) {
                const labelVals = allRows[labelRow].map((v: any) => String(v || '').replace(/[\r\n]+/g, ' ').trim());
                for (let c = 0; c < Math.max(headers.length, labelVals.length); c++) {
                    const h = norm(headers[c] || '');
                    const lv = labelVals[c] || '';
                    if (!UF_LIST.includes(h) && lv && lv.length > 1) {
                        headers[c] = lv;
                    }
                }
                dataStart = labelRow + 1;
            } else if (labelRow === ufRow) {
                // Same row has both UFs and labels
                dataStart = ufRow + 1;
            } else {
                dataStart = ufRow + 1;
            }

            // Skip "Localidade" / city names rows
            while (dataStart < allRows.length) {
                const checkVals = (allRows[dataStart] || []).map((v: any) => norm(v));
                const isMetaRow = checkVals.some(v =>
                    v.includes('LOCALIDADE') || v.includes('RIO BRANCO') || v.includes('MACEIO') ||
                    v.includes('CUSTO') || v === '%AS' || v.includes('PRECO MEDIANO')
                );
                if (isMetaRow) { dataStart++; } else { break; }
            }
        } else if (labelRow >= 0) {
            // No UF row — use label row (Analítico, ISE)
            headers = allRows[labelRow].map((v: any) => String(v || '').replace(/[\r\n]+/g, ' ').trim());
            dataStart = labelRow + 1;
        } else if (firstDataRow >= 0) {
            // Fallback: use row before data as headers
            const hr = Math.max(0, firstDataRow - 1);
            headers = allRows[hr].map((v: any) => String(v || '').replace(/[\r\n]+/g, ' ').trim());
            dataStart = firstDataRow;
        } else {
            // Last resort
            const fallback = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', raw: false });
            if (fallback.length > 0) {
                return { rows: fallback, headers: Object.keys(fallback[0]) };
            }
            return { rows: [], headers: [] };
        }

        // Clean header names
        headers = headers.map((h, i) => {
            const clean = h.replace(/\s+/g, ' ').trim();
            return clean && clean.length > 0 && !clean.startsWith('__') ? clean : `col_${i}`;
        });

        // Build rows
        const result: any[] = [];
        for (let r = dataStart; r < allRows.length; r++) {
            const arr = allRows[r] || [];
            const obj: any = {};
            for (let c = 0; c < headers.length; c++) {
                obj[headers[c]] = arr[c] !== undefined ? String(arr[c]) : '';
            }
            // Skip completely empty rows
            const hasContent = Object.values(obj).some((v: any) => v && String(v).trim());
            if (hasContent) result.push(obj);
        }

        return { rows: result, headers };
    }

    // ═══════════════════════════════════════════════════════════════
    // DETECT SHEET TYPE
    // ═══════════════════════════════════════════════════════════════
    private detectSheetType(sheetName: string, headers: string[]): SheetType {
        const sn = sheetName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const normH = headers.map(h => h.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
        const hasUFs = this.findUFColumns(headers).length >= 10;
        const hasComp = normH.some(h => h.includes('COMPOSICAO') || h.includes('CODIGO DA'));
        const hasCoef = normH.some(h => h.includes('COEFICIENTE') || h.includes('COEF'));
        const isPctMO = sn.includes('PERCENTUAL') || sn.includes('PCT') || sn.includes('% MO');

        if (isPctMO) return 'labor_pct';
        if (sn.includes('ANALITICO')) return sn.includes('CUSTO') ? 'analytic_cost' : 'analytic';
        if (hasCoef && !hasUFs) return 'analytic';

        // ISD/ICD = Insumos Sem/Com Desoneração
        if (sn === 'ISD' || (sn.includes('INSUMO') && sn.includes('SEM'))) return 'input_prices_nd';
        if (sn === 'ICD' || (sn.includes('INSUMO') && sn.includes('COM'))) return 'input_prices_d';

        // CSD/CCD = Composições Sem/Com Desoneração
        if (sn === 'CSD' || (hasComp && hasUFs && (sn.includes('SEM') || sn.includes('NAO')))) return 'comp_prices_nd';
        if (sn === 'CCD' || (hasComp && hasUFs && sn.includes('COM'))) return 'comp_prices_d';

        // CSE/CCE = Composições Sintético
        if (sn === 'CSE') return 'comp_prices_nd';
        if (sn === 'CCE') return 'comp_prices_d';

        // ISE = Insumos Sintético (sem preço por UF, mas com dados dos insumos)
        if (sn === 'ISE') return hasUFs ? 'input_prices_nd' : 'unknown';

        // Generic detection
        if (hasUFs && hasComp) return sn.includes('COM') ? 'comp_prices_d' : 'comp_prices_nd';
        if (hasUFs) return sn.includes('COM') ? 'input_prices_d' : 'input_prices_nd';

        return 'unknown';
    }

    private findUFColumns(headers: string[]): string[] {
        return headers.filter(h => UF_LIST.includes(h.trim().toUpperCase()));
    }

    private detectYearMonth(filename: string, overrides?: any): { year: number; month: number } {
        if (overrides?.year && overrides?.month) return { year: overrides.year, month: overrides.month };
        const upper = filename.toUpperCase();
        let year = new Date().getFullYear(), month = new Date().getMonth() + 1;
        const ym = upper.match(/(\d{4})[_\- ]?(\d{2})/);
        if (ym) { const y = parseInt(ym[1]), m = parseInt(ym[2]); if (y >= 2000 && m >= 1 && m <= 12) { year = y; month = m; } }
        if (!ym) {
            const my = upper.match(/(\d{2})[_\- ]?(\d{4})/);
            if (my) { const m = parseInt(my[1]), y = parseInt(my[2]); if (y >= 2000 && m >= 1 && m <= 12) { year = y; month = m; } }
        }
        return { year: overrides?.year || year, month: overrides?.month || month };
    }

    // ═══════════════════════════════════════════════════════════════
    // PROCESS: Input Prices Multi-State (ISD/ICD)
    // ═══════════════════════════════════════════════════════════════
    private async processInputPrices(
        rows: any[], ufCols: string[], referenceId: string, taxRegime: string,
        errors: string[], warnings: string[],
    ) {
        let inserted = 0, updated = 0, skipped = 0;
        const BATCH = 200;

        // Phase 1: Collect inputs
        const inputItems: { code: string; description: string; unit: string; type: string }[] = [];
        for (const row of rows) {
            const code = this.getCode(row);
            const desc = this.getDesc(row);
            if (!code || !desc) { skipped++; continue; }
            inputItems.push({ code, description: desc, unit: this.getUnit(row), type: this.detectInputType(desc) });
        }

        if (inputItems.length === 0) {
            warnings.push(`[WARN] 0 inputs válidos, ${skipped} skipped`);
            return { inserted, updated, skipped };
        }

        // Batch upsert inputs
        for (let b = 0; b < inputItems.length; b += BATCH) {
            const batch = inputItems.slice(b, b + BATCH);
            try {
                await this.dataSource.query(`
                    INSERT INTO sinapi_inputs (id, code, description, unit, type, origin, "isActive", "createdAt", "updatedAt")
                    SELECT gen_random_uuid(), t.code, t.description, t.unit, t.type, 'sinapi', true, NOW(), NOW()
                    FROM (VALUES ${batch.map((_, i) => `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`).join(', ')})
                    AS t(code, description, unit, type)
                    ON CONFLICT (code) DO UPDATE SET description=EXCLUDED.description, unit=EXCLUDED.unit, type=EXCLUDED.type, "updatedAt"=NOW()
                `, batch.flatMap(i => [i.code, i.description, i.unit, i.type]));
            } catch (e: any) { errors.push(`Batch inputs ${b}: ${e.message}`); }
        }

        // Build code→id map
        const allCodes = inputItems.map(i => i.code);
        const codeIdMap = new Map<string, string>();
        for (let b = 0; b < allCodes.length; b += 500) {
            const batch = allCodes.slice(b, b + 500);
            const r = await this.dataSource.query(`SELECT id, code FROM sinapi_inputs WHERE code = ANY($1)`, [batch]);
            for (const row of r) codeIdMap.set(row.code, row.id);
        }

        // Phase 2: Insert prices per UF
        for (const uf of ufCols) {
            const priceRows: { inputId: string; price: number }[] = [];
            for (const row of rows) {
                const code = this.getCode(row);
                if (!code) continue;
                const inputId = codeIdMap.get(code);
                if (!inputId) continue;
                const price = this.parseNumber(row[uf]);
                if (isNaN(price) || price < 0) continue;
                priceRows.push({ inputId, price });
            }
            if (priceRows.length === 0) continue;

            for (let b = 0; b < priceRows.length; b += BATCH) {
                const batch = priceRows.slice(b, b + BATCH);
                try {
                    const isD = taxRegime === 'desonerado';
                    const col = isD ? '"priceTaxed"' : '"priceNotTaxed"';
                    const res = await this.dataSource.query(`
                        INSERT INTO sinapi_input_prices (id, "referenceId", "inputId", state, ${col}, origin, "createdAt")
                        SELECT gen_random_uuid(), $1, t.iid, $2, t.price, 'sinapi', NOW()
                        FROM (VALUES ${batch.map((_, i) => `($${i*2+3}::uuid, $${i*2+4}::numeric)`).join(', ')})
                        AS t(iid, price)
                        ON CONFLICT ("referenceId", "inputId", state) DO UPDATE SET ${col} = EXCLUDED.${col}
                        RETURNING (xmax = 0) AS is_insert
                    `, [referenceId, uf, ...batch.flatMap(r => [r.inputId, r.price])]);
                    for (const r of res) { if (r.is_insert) inserted++; else updated++; }
                } catch (e: any) { errors.push(`Preços ${uf} batch ${b}: ${e.message}`); }
            }
        }

        warnings.push(`[RESULT] Insumos: +${inserted} ~${updated} skip=${skipped} (${inputItems.length} válidos, ${ufCols.length} UFs)`);
        return { inserted, updated, skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // PROCESS: Composition Prices Multi-State (CSD/CCD/CSE)
    // ═══════════════════════════════════════════════════════════════
    private async processCompPrices(
        rows: any[], ufCols: string[], referenceId: string, taxRegime: string,
        errors: string[], warnings: string[],
    ) {
        let inserted = 0, updated = 0, skipped = 0;
        const BATCH = 200;

        const compItems: { code: string; description: string; unit: string; group?: string }[] = [];

        // Pre-build description→code map from existing compositions (for CSD code="0" fallback)
        let descToCode = new Map<string, string>();
        const existingComps = await this.dataSource.query(`SELECT code, description FROM sinapi_compositions LIMIT 50000`);
        for (const ec of existingComps) {
            const normDesc = String(ec.description || '').trim().toUpperCase().substring(0, 60);
            if (normDesc) descToCode.set(normDesc, ec.code);
        }
        warnings.push(`[DEBUG] descToCode map: ${descToCode.size} composições existentes para lookup`);

        for (const row of rows) {
            let code = this.getCode(row);
            const desc = this.getDesc(row);
            if (!desc) { skipped++; continue; }

            // Fallback: match by description if code is missing
            if (!code && desc) {
                const normDesc = desc.trim().toUpperCase().substring(0, 60);
                code = descToCode.get(normDesc) || null;
            }
            if (!code) { skipped++; continue; }

            compItems.push({ code, description: desc, unit: this.getUnit(row), group: this.getField(row, ['Grupo','GRUPO']) || undefined });
        }

        if (compItems.length === 0) {
            warnings.push(`[WARN] 0 composições válidas, ${skipped} skipped`);
            return { inserted, updated, skipped };
        }

        for (let b = 0; b < compItems.length; b += BATCH) {
            const batch = compItems.slice(b, b + BATCH);
            try {
                await this.dataSource.query(`
                    INSERT INTO sinapi_compositions (id, code, description, unit, "classCode", type, "isActive", "createdAt", "updatedAt")
                    SELECT gen_random_uuid(), t.code, t.description, t.unit, t.grp, 'composition', true, NOW(), NOW()
                    FROM (VALUES ${batch.map((_, i) => `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`).join(', ')})
                    AS t(code, description, unit, grp)
                    ON CONFLICT (code) DO UPDATE SET description=EXCLUDED.description, unit=EXCLUDED.unit, "classCode"=COALESCE(EXCLUDED."classCode", sinapi_compositions."classCode"), "updatedAt"=NOW()
                `, batch.flatMap(i => [i.code, i.description, i.unit, i.group || null]));
            } catch (e: any) { errors.push(`Batch comp ${b}: ${e.message}`); }
        }

        const codeIdMap = new Map<string, string>();
        const allCodes = compItems.map(i => i.code);
        for (let b = 0; b < allCodes.length; b += 500) {
            const batch = allCodes.slice(b, b + 500);
            const r = await this.dataSource.query(`SELECT id, code FROM sinapi_compositions WHERE code = ANY($1)`, [batch]);
            for (const row of r) codeIdMap.set(row.code, row.id);
        }

        for (const uf of ufCols) {
            const costRows: { compId: string; cost: number }[] = [];
            for (const row of rows) {
                const code = this.getCode(row);
                if (!code) continue;
                const compId = codeIdMap.get(code);
                if (!compId) continue;
                const cost = this.parseNumber(row[uf]);
                if (isNaN(cost) || cost < 0) continue;
                costRows.push({ compId, cost });
            }
            if (costRows.length === 0) continue;

            for (let b = 0; b < costRows.length; b += BATCH) {
                const batch = costRows.slice(b, b + BATCH);
                try {
                    const isD = taxRegime === 'desonerado';
                    const col = isD ? '"totalTaxed"' : '"totalNotTaxed"';
                    const res = await this.dataSource.query(`
                        INSERT INTO sinapi_composition_costs (id, "referenceId", "compositionId", state, ${col}, "calculationMethod", "createdAt")
                        SELECT gen_random_uuid(), $1, t.cid, $2, t.cost, 'imported', NOW()
                        FROM (VALUES ${batch.map((_, i) => `($${i*2+3}::uuid, $${i*2+4}::numeric)`).join(', ')})
                        AS t(cid, cost)
                        ON CONFLICT ("referenceId", "compositionId", state) DO UPDATE SET ${col} = EXCLUDED.${col}
                        RETURNING (xmax = 0) AS is_insert
                    `, [referenceId, uf, ...batch.flatMap(r => [r.compId, r.cost])]);
                    for (const r of res) { if (r.is_insert) inserted++; else updated++; }
                } catch (e: any) { errors.push(`Custos ${uf} batch ${b}: ${e.message}`); }
            }
        }

        warnings.push(`[RESULT] Composições: +${inserted} ~${updated} skip=${skipped} (${compItems.length} válidas)`);
        return { inserted, updated, skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // PROCESS: Analítico (composition items + coefficients)
    // ═══════════════════════════════════════════════════════════════
    private async processAnalytic(rows: any[], errors: string[], warnings: string[]) {
        let inserted = 0, updated = 0, skipped = 0;
        const compositions = new Map<string, { desc: string; unit: string; items: { code: string; coef: number }[] }>();
        let currentComp = '';

        for (const row of rows) {
            const compCode = this.getField(row, ['Composição','COMPOSICAO','COMPOSIÇÃO','Código da Composição']);
            const itemCode = this.getCode(row);
            const coefStr = this.getField(row, ['Coeficiente','COEFICIENTE','COEF','Quantidade','QTD']);

            if (compCode) {
                const clean = String(compCode).trim().replace(/\D/g, '');
                if (clean && clean.length >= 4) {
                    currentComp = clean;
                    if (!compositions.has(clean)) {
                        compositions.set(clean, { desc: this.getDesc(row) || `Composição ${clean}`, unit: this.getUnit(row), items: [] });
                    }
                }
            }

            if (currentComp && itemCode && coefStr) {
                const coef = this.parseNumber(coefStr);
                if (!isNaN(coef) && coef > 0) {
                    compositions.get(currentComp)?.items.push({ code: itemCode, coef });
                }
            }
        }

        for (const [code, data] of compositions) {
            try {
                let comp = await this.compositionRepo.findOne({ where: { code } });
                if (!comp) {
                    comp = await this.compositionRepo.save(this.compositionRepo.create({ code, description: data.desc, unit: data.unit, type: 'composition' }));
                    inserted++;
                } else {
                    await this.compositionItemRepo.delete({ compositionId: comp.id });
                    updated++;
                }
                for (let idx = 0; idx < data.items.length; idx++) {
                    const item = data.items[idx];
                    const ci: any = { compositionId: comp.id, coefficient: item.coef, sortOrder: idx, itemType: 'insumo' };
                    const input = await this.inputRepo.findOne({ where: { code: item.code } });
                    if (input) { ci.inputId = input.id; }
                    else {
                        const child = await this.compositionRepo.findOne({ where: { code: item.code } });
                        if (child) { ci.childCompositionId = child.id; ci.itemType = 'composicao_auxiliar'; }
                    }
                    await this.compositionItemRepo.save(this.compositionItemRepo.create(ci));
                }
            } catch (e: any) { errors.push(`Analítico ${code}: ${e.message}`); }
        }

        warnings.push(`[RESULT] Analítico: ${compositions.size} composições`);
        return { inserted, updated, skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // FIELD HELPERS
    // ═══════════════════════════════════════════════════════════════
    private getCode(row: any): string | null {
        const named = this.getField(row, [
            'Código','CODIGO','CÓDIGO','Código SINAPI','CODIGO SINAPI',
            'Código da Composição','Codigo da Composicao','Código da Composição',
            'COD','Código do Insumo','Codigo do Insumo','Código do Item',
        ]);
        if (named) {
            const clean = String(named).trim().replace(/\D/g, '');
            if (clean && clean.length >= 2) return clean;
        }
        // Fallback: scan for numeric code
        for (const key of Object.keys(row)) {
            const val = String(row[key] || '').trim();
            if (/^\d{4,10}$/.test(val)) return val;
        }
        return null;
    }

    private getDesc(row: any): string | null {
        const raw = this.getField(row, [
            'Descrição','DESCRICAO','DESCRIÇÃO','Descrição do Insumo',
            'Descricao do Insumo','DESC','Descrição da Composição','Descrição da Composição',
        ]);
        if (raw) return String(raw).trim();
        // Fallback: longest string
        let longest = '';
        for (const key of Object.keys(row)) {
            const val = String(row[key] || '').trim();
            if (val.length > longest.length && val.length > 10 && !/^\d+$/.test(val)) longest = val;
        }
        return longest || null;
    }

    private getUnit(row: any): string {
        const raw = this.getField(row, ['Unidade','UNIDADE','UN','UND','UNID']);
        return raw ? String(raw).trim().toUpperCase() : 'UN';
    }

    private getField(row: any, names: string[]): string | null {
        const norm = (s: string) => s.toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\r\n]+/g, ' ');
        for (const name of names) {
            const n = norm(name);
            if (row[name] !== undefined && String(row[name]).trim() !== '') return String(row[name]);
            for (const k of Object.keys(row)) {
                if (norm(k) === n && row[k] !== undefined && String(row[k]).trim() !== '') return String(row[k]);
            }
            for (const k of Object.keys(row)) {
                if (norm(k).includes(n) && row[k] !== undefined && String(row[k]).trim() !== '') return String(row[k]);
            }
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

    private detectInputType(desc: string): string {
        const u = (desc || '').toUpperCase();
        if (u.includes('MAO DE OBRA') || u.includes('MÃO DE OBRA') || u.includes('SERVENTE') || u.includes('PEDREIRO') || u.includes('ELETRICISTA') || u.includes('AJUDANTE') || u.includes('OFICIAL') || u.includes('MONTADOR') || u.includes('SOLDADOR') || u.includes('ARMADOR')) return 'mao_de_obra';
        if (u.includes('EQUIPAMENTO') || u.includes('RETROESCAVADEIRA') || u.includes('BETONEIRA') || u.includes('CAMINHAO') || u.includes('GUINDASTE') || u.includes('COMPRESSOR') || u.includes('VIBRADOR')) return 'equipamento';
        return 'material';
    }

    private async getOrCreateReference(year: number, month: number): Promise<SinapiReference> {
        let ref = await this.referenceRepo.findOne({ where: { year, month } });
        if (ref) return ref;
        return this.referenceRepo.save(this.referenceRepo.create({
            year, month, label: `SINAPI ${MONTH_NAMES[month]}/${year}`, status: 'active',
        }));
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
    async deleteImportLog(id: string) { await this.importLogRepo.delete(id); }
    async rollbackImport(logId: string): Promise<{ deleted: number }> {
        const log = await this.importLogRepo.findOne({ where: { id: logId } });
        if (!log || !log.referenceId) throw new Error('Log ou referência não encontrado');
        await this.dataSource.query(`DELETE FROM sinapi_input_prices WHERE "referenceId" = $1`, [log.referenceId]);
        await this.dataSource.query(`DELETE FROM sinapi_composition_costs WHERE "referenceId" = $1`, [log.referenceId]);
        await this.importLogRepo.update(logId, { status: ImportLogStatus.ERROR, errors: JSON.stringify(['Rollback executado']) });
        return { deleted: 0 };
    }
}
