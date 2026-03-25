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
// CONSTANTES DE DETECÇÃO
// ═══════════════════════════════════════════════════════════════

const UF_LIST = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
    'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
    'SE', 'SP', 'TO',
];

const MONTH_MAP: Record<string, number> = {
    JAN: 1, JANEIRO: 1, FEV: 2, FEVEREIRO: 2, MAR: 3, MARÇO: 3, MARCO: 3,
    ABR: 4, ABRIL: 4, MAI: 5, MAIO: 5, JUN: 6, JUNHO: 6,
    JUL: 7, JULHO: 7, AGO: 8, AGOSTO: 8, SET: 9, SETEMBRO: 9,
    OUT: 10, OUTUBRO: 10, NOV: 11, NOVEMBRO: 11, DEZ: 12, DEZEMBRO: 12,
};

const MONTH_NAMES = ['', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface DetectedMetadata {
    state?: string;
    year?: number;
    month?: number;
    taxRegime: 'desonerado' | 'nao_desonerado';
    fileType: 'inputs' | 'compositions' | 'prices' | 'composition_prices' | 'mixed';
}

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
    // MAIN ENTRY POINT — Importar arquivo XLSX/CSV
    // ═══════════════════════════════════════════════════════════════

    async importFile(file: Express.Multer.File, overrides?: {
        state?: string; year?: number; month?: number; taxRegime?: string; fileType?: string;
    }): Promise<ImportResult> {
        const startTime = Date.now();
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Parse file
        let workbook: XLSX.WorkBook;
        try {
            workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true, cellNF: true });
        } catch (err) {
            throw new Error(`Erro ao ler arquivo: ${err.message}`);
        }

        // 2. Detect metadata from filename + sheet content
        const detected = this.detectMetadata(file.originalname, workbook);
        const state = (overrides?.state || detected.state || 'PE').toUpperCase();
        const year = overrides?.year || detected.year || new Date().getFullYear();
        const month = overrides?.month || detected.month || new Date().getMonth() + 1;
        const taxRegime = (overrides?.taxRegime || detected.taxRegime) as any;
        const fileType = (overrides?.fileType || detected.fileType) as any;

        this.logger.log(`📂 Importando: ${file.originalname} | ${state} ${MONTH_NAMES[month]}/${year} | ${taxRegime} | tipo: ${fileType}`);

        // 3. Create import log
        const log = await this.importLogRepo.save(this.importLogRepo.create({
            fileName: file.originalname,
            fileType,
            state,
            year,
            month,
            taxRegime,
            status: ImportLogStatus.RUNNING,
        }));

        try {
            // 4. Get or create reference
            const reference = await this.getOrCreateReference(year, month, state);
            await this.importLogRepo.update(log.id, { referenceId: reference.id });

            // 5. Process based on file type
            let result: { inserted: number; updated: number; skipped: number } = { inserted: 0, updated: 0, skipped: 0 };
            let totalRows = 0;

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];

                // ═══ AUTO-DETECT HEADER ROW ═══
                // SINAPI CAIXA files have merged title rows at the top.
                // Scan first 30 raw rows to find the real header.
                const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', header: 1, raw: false });
                let headerRowIndex = 0; // default: first row

                const HEADER_PATTERNS = [
                    'CODIGO', 'CÓDIGO', 'COD', 'CODIGO SINAPI',
                    'DESCRICAO', 'DESCRIÇÃO', 'DESC',
                    'UNIDADE', 'COMPOSICAO', 'COMPOSIÇÃO',
                    'COEFICIENTE', 'PRECO', 'PREÇO', 'CUSTO',
                    'MEDIANA', 'INSUMO', 'CLASSE', 'TIPO', 'GRUPO',
                ];

                for (let r = 0; r < Math.min(rawRows.length, 30); r++) {
                    const rowValues = Array.isArray(rawRows[r])
                        ? rawRows[r].map((v: any) => String(v || '').toUpperCase().trim())
                        : Object.values(rawRows[r]).map((v: any) => String(v || '').toUpperCase().trim());

                    // Count how many cells match known SINAPI header patterns
                    let matchCount = 0;
                    for (const val of rowValues) {
                        for (const pat of HEADER_PATTERNS) {
                            if (val.includes(pat)) { matchCount++; break; }
                        }
                    }

                    // If we find 2+ matches, this is likely the header row
                    if (matchCount >= 2) {
                        headerRowIndex = r;
                        this.logger.log(`   🎯 Header row detected at row ${r + 1} (${matchCount} pattern matches)`);
                        break;
                    }
                }

                // Re-parse with correct header row
                const rows = XLSX.utils.sheet_to_json<any>(sheet, {
                    defval: '',
                    raw: false,
                    range: headerRowIndex, // Start from the detected header row
                });
                totalRows += rows.length;

                if (rows.length === 0) {
                    warnings.push(`Planilha "${sheetName}" vazia — ignorada`);
                    continue;
                }

                // Log detected columns for debugging
                const detectedCols = Object.keys(rows[0]);
                this.logger.log(`   📄 Sheet "${sheetName}": ${rows.length} rows, cols: [${detectedCols.slice(0, 8).join(', ')}...]`);

                const sheetType = this.detectSheetType(sheetName, rows[0]);
                this.logger.log(`   📄 Tipo detectado: ${sheetType}`);

                try {
                    switch (sheetType) {
                        case 'inputs':
                            result = this.mergeResults(result, await this.processInputRows(rows, errors, warnings));
                            break;
                        case 'input_prices':
                            result = this.mergeResults(result, await this.processInputPriceRows(rows, reference.id, taxRegime, errors, warnings));
                            break;
                        case 'compositions':
                            result = this.mergeResults(result, await this.processCompositionRows(rows, errors, warnings));
                            break;
                        case 'composition_prices':
                            result = this.mergeResults(result, await this.processCompositionCostRows(rows, reference.id, taxRegime, errors, warnings));
                            break;
                        default:
                            // Try auto-detecting from column names
                            const autoResult = await this.processAutoDetect(rows, reference.id, taxRegime, errors, warnings);
                            result = this.mergeResults(result, autoResult);
                    }
                } catch (sheetErr) {
                    errors.push(`Erro na planilha "${sheetName}": ${sheetErr.message}`);
                }
            }

            // 6. Update log
            const status = errors.length > 0
                ? (result.inserted + result.updated > 0 ? ImportLogStatus.PARTIAL : ImportLogStatus.ERROR)
                : ImportLogStatus.SUCCESS;

            const durationMs = Date.now() - startTime;
            await this.importLogRepo.update(log.id, {
                status,
                totalRows,
                insertedCount: result.inserted,
                updatedCount: result.updated,
                skippedCount: result.skipped,
                errorCount: errors.length,
                errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null,
                warnings: warnings.length > 0 ? JSON.stringify(warnings.slice(0, 100)) : null,
                durationMs,
            });

            this.logger.log(`✅ Import completo em ${durationMs}ms: +${result.inserted} ~${result.updated} ⏭${result.skipped} ❌${errors.length}`);

            return {
                logId: log.id,
                status,
                inserted: result.inserted,
                updated: result.updated,
                skipped: result.skipped,
                errors,
                warnings,
                totalRows,
                durationMs,
            };

        } catch (fatalErr) {
            const durationMs = Date.now() - startTime;
            await this.importLogRepo.update(log.id, {
                status: ImportLogStatus.ERROR,
                errorCount: 1,
                errors: JSON.stringify([fatalErr.message]),
                durationMs,
            });
            throw fatalErr;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DETECÇÃO AUTOMÁTICA
    // ═══════════════════════════════════════════════════════════════

    private detectMetadata(filename: string, workbook: XLSX.WorkBook): DetectedMetadata {
        const upper = filename.toUpperCase();
        const result: DetectedMetadata = {
            taxRegime: 'nao_desonerado',
            fileType: 'mixed',
        };

        // Detect UF from filename
        for (const uf of UF_LIST) {
            if (upper.includes(`_${uf}_`) || upper.includes(`_${uf}.`) || upper.includes(` ${uf} `) || upper.endsWith(`_${uf}`)) {
                result.state = uf;
                break;
            }
        }

        // Detect year/month from filename — patterns: "2025_01", "JAN2025", "202501", "01_2025"
        const yearMonthMatch = upper.match(/(\d{4})[_\- ]?(\d{2})/);
        if (yearMonthMatch) {
            const y = parseInt(yearMonthMatch[1]);
            const m = parseInt(yearMonthMatch[2]);
            if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
                result.year = y;
                result.month = m;
            }
        }
        if (!result.month) {
            const monthMatch = upper.match(/(\d{2})[_\- ]?(\d{4})/);
            if (monthMatch) {
                const m = parseInt(monthMatch[1]);
                const y = parseInt(monthMatch[2]);
                if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
                    result.year = y;
                    result.month = m;
                }
            }
        }
        if (!result.month) {
            for (const [name, num] of Object.entries(MONTH_MAP)) {
                if (upper.includes(name)) {
                    result.month = num;
                    break;
                }
            }
        }
        if (!result.year) {
            const justYear = upper.match(/(\d{4})/);
            if (justYear) {
                const y = parseInt(justYear[1]);
                if (y >= 2000 && y <= 2100) result.year = y;
            }
        }

        // Detect tax regime
        if (upper.includes('DESONERADO') && !upper.includes('NAO DESONERADO') && !upper.includes('NÃO DESONERADO') && !upper.includes('NAO_DESONERADO')) {
            result.taxRegime = 'desonerado';
        }
        if (upper.includes('NAO_DESONERADO') || upper.includes('NAO DESONERADO') || upper.includes('NÃO DESONERADO') || upper.includes('SEM_DESONE')) {
            result.taxRegime = 'nao_desonerado';
        }

        // Detect file type from filename
        if (upper.includes('INSUMO')) result.fileType = 'inputs';
        else if (upper.includes('COMPOSIC') || upper.includes('COMPOSI')) result.fileType = 'compositions';
        else if (upper.includes('PRECO') || upper.includes('PREÇO') || upper.includes('CUSTO')) result.fileType = 'prices';

        // Try detecting from sheet names
        if (result.fileType === 'mixed') {
            const sheetNames = workbook.SheetNames.map(s => s.toUpperCase());
            if (sheetNames.some(s => s.includes('INSUMO'))) result.fileType = 'inputs';
            if (sheetNames.some(s => s.includes('COMPOSIC'))) result.fileType = 'compositions';
        }

        // Try detecting UF from first sheet content if not found in filename
        if (!result.state && workbook.SheetNames.length > 0) {
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const firstRows = XLSX.utils.sheet_to_json<any>(firstSheet, { defval: '', header: 1, range: 0 }).slice(0, 10);
            for (const row of firstRows) {
                const rowStr = (Array.isArray(row) ? row.join(' ') : JSON.stringify(row)).toUpperCase();
                for (const uf of UF_LIST) {
                    if (rowStr.includes(` ${uf} `) || rowStr.includes(`/${uf}`) || rowStr.includes(`-${uf}`)) {
                        result.state = uf;
                        break;
                    }
                }
                if (result.state) break;
            }
        }

        return result;
    }

    private detectSheetType(sheetName: string, firstRow: any): string {
        const upper = sheetName.toUpperCase();
        const cols = Object.keys(firstRow).map(k => k.toUpperCase());

        // By sheet name
        if (upper.includes('INSUMO') && (upper.includes('PRECO') || upper.includes('PREÇO') || upper.includes('CUSTO')))
            return 'input_prices';
        if (upper.includes('INSUMO')) return 'inputs';
        if (upper.includes('COMPOSIC') && (upper.includes('PRECO') || upper.includes('PREÇO') || upper.includes('CUSTO') || upper.includes('SINT')))
            return 'composition_prices';
        if (upper.includes('COMPOSIC') && upper.includes('ANALI'))
            return 'compositions';
        if (upper.includes('COMPOSIC')) return 'compositions';

        // By column names
        const hasCode = cols.some(c => c.includes('CODIGO') || c.includes('CÓDIGO') || c === 'CODIGO SINAPI');
        const hasDescription = cols.some(c => c.includes('DESCRI'));
        const hasPrice = cols.some(c => c.includes('PRECO') || c.includes('PREÇO') || c.includes('MEDIANA') || c.includes('CUSTO'));
        const hasUnit = cols.some(c => c.includes('UNIDADE') || c === 'UN');
        const hasCoefficient = cols.some(c => c.includes('COEFICIENTE') || c.includes('COEF'));

        if (hasCoefficient) return 'compositions';
        if (hasCode && hasPrice && !hasCoefficient) return 'input_prices';
        if (hasCode && hasDescription && hasUnit && !hasPrice) return 'inputs';
        if (hasCode && hasPrice) return 'composition_prices';

        return 'unknown';
    }

    // ═══════════════════════════════════════════════════════════════
    // PROCESSORS
    // ═══════════════════════════════════════════════════════════════

    private async processInputRows(rows: any[], errors: string[], warnings: string[]) {
        let inserted = 0, updated = 0, skipped = 0;

        for (let i = 0; i < rows.length; i++) {
            try {
                const row = rows[i];
                const code = this.getField(row, ['CODIGO', 'CÓDIGO', 'CODIGO SINAPI', 'CÓDIGO SINAPI', 'COD', 'CODIGO_SINAPI']);
                const description = this.getField(row, ['DESCRICAO', 'DESCRIÇÃO', 'DESCRICAO DO INSUMO', 'DESCRIÇÃO DO INSUMO', 'DESC']);
                const unit = this.getField(row, ['UNIDADE', 'UN', 'UND', 'UNID']);

                if (!code || !description) {
                    skipped++;
                    continue;
                }

                const cleanCode = String(code).trim().replace(/\D/g, '');
                if (!cleanCode) { skipped++; continue; }

                const type = this.detectInputType(description);

                const existing = await this.inputRepo.findOne({ where: { code: cleanCode } });
                if (existing) {
                    await this.inputRepo.update(existing.id, {
                        description: String(description).trim(),
                        unit: String(unit || 'UN').trim().toUpperCase(),
                        type,
                    });
                    updated++;
                } else {
                    await this.inputRepo.save(this.inputRepo.create({
                        code: cleanCode,
                        description: String(description).trim(),
                        unit: String(unit || 'UN').trim().toUpperCase(),
                        type,
                        origin: 'sinapi',
                    }));
                    inserted++;
                }
            } catch (err) {
                errors.push(`Linha ${i + 2}: ${err.message}`);
            }
        }

        return { inserted, updated, skipped };
    }

    private async processInputPriceRows(rows: any[], referenceId: string, taxRegime: string, errors: string[], warnings: string[]) {
        let inserted = 0, updated = 0, skipped = 0;

        for (let i = 0; i < rows.length; i++) {
            try {
                const row = rows[i];
                const code = this.getField(row, ['CODIGO', 'CÓDIGO', 'CODIGO SINAPI', 'CÓDIGO SINAPI', 'COD']);
                const priceStr = this.getField(row, ['PRECO MEDIANO', 'PREÇO MEDIANO', 'PRECO', 'PREÇO', 'MEDIANA', 'CUSTO', 'PRECO UNITARIO', 'PREÇO UNITÁRIO', 'VALOR']);

                if (!code || !priceStr) { skipped++; continue; }

                const cleanCode = String(code).trim().replace(/\D/g, '');
                if (!cleanCode) { skipped++; continue; }

                const price = this.parseNumber(priceStr);
                if (isNaN(price) || price < 0) { skipped++; continue; }

                // Find or create input
                let input = await this.inputRepo.findOne({ where: { code: cleanCode } });
                if (!input) {
                    const desc = this.getField(row, ['DESCRICAO', 'DESCRIÇÃO', 'DESC']) || `Insumo ${cleanCode}`;
                    const unit = this.getField(row, ['UNIDADE', 'UN', 'UND']) || 'UN';
                    input = await this.inputRepo.save(this.inputRepo.create({
                        code: cleanCode,
                        description: String(desc).trim(),
                        unit: String(unit).trim().toUpperCase(),
                        type: this.detectInputType(String(desc)),
                        origin: 'sinapi',
                    }));
                    warnings.push(`Insumo ${cleanCode} auto-criado na importação de preços`);
                }

                // Upsert price
                const existing = await this.inputPriceRepo.findOne({
                    where: { referenceId, inputId: input.id },
                });

                const priceData: any = {};
                if (taxRegime === 'desonerado') {
                    priceData.priceTaxed = price;
                    if (existing?.priceNotTaxed) priceData.priceNotTaxed = existing.priceNotTaxed;
                } else {
                    priceData.priceNotTaxed = price;
                    if (existing?.priceTaxed) priceData.priceTaxed = existing.priceTaxed;
                }

                if (existing) {
                    await this.inputPriceRepo.update(existing.id, priceData);
                    updated++;
                } else {
                    await this.inputPriceRepo.save(this.inputPriceRepo.create({
                        referenceId,
                        inputId: input.id,
                        ...priceData,
                    }));
                    inserted++;
                }
            } catch (err) {
                errors.push(`Preço linha ${i + 2}: ${err.message}`);
            }
        }

        return { inserted, updated, skipped };
    }

    private async processCompositionRows(rows: any[], errors: string[], warnings: string[]) {
        let inserted = 0, updated = 0, skipped = 0;

        // Group rows by composition code (compositions have multiple item rows)
        const compositions = new Map<string, { desc: string; unit: string; classCode?: string; items: any[] }>();
        let currentCompCode = '';
        let currentCompDesc = '';
        let currentCompUnit = '';

        for (let i = 0; i < rows.length; i++) {
            try {
                const row = rows[i];
                const compCode = this.getField(row, ['COMPOSICAO', 'COMPOSIÇÃO', 'CODIGO COMPOSICAO', 'CÓDIGO COMPOSIÇÃO', 'COD.COMPOSICAO', 'GRUPO']);
                const itemCode = this.getField(row, ['CODIGO', 'CÓDIGO', 'CODIGO INSUMO', 'CÓDIGO INSUMO', 'COD', 'COMPONENTE']);
                const coefStr = this.getField(row, ['COEFICIENTE', 'COEF', 'COEF.', 'QUANTIDADE', 'QTD']);

                // New composition header
                if (compCode && String(compCode).trim()) {
                    const cleanCode = String(compCode).trim().replace(/[^\d]/g, '');
                    if (cleanCode) {
                        currentCompCode = cleanCode;
                        currentCompDesc = this.getField(row, ['DESCRICAO', 'DESCRIÇÃO', 'DESC', 'DESCRICAO DA COMPOSICAO']) || `Composição ${cleanCode}`;
                        currentCompUnit = this.getField(row, ['UNIDADE', 'UN', 'UND']) || 'UN';
                        if (!compositions.has(cleanCode)) {
                            compositions.set(cleanCode, {
                                desc: String(currentCompDesc).trim(),
                                unit: String(currentCompUnit).trim().toUpperCase(),
                                items: [],
                            });
                        }
                    }
                }

                // Item row
                if (currentCompCode && itemCode && coefStr) {
                    const cleanItemCode = String(itemCode).trim().replace(/[^\d]/g, '');
                    const coef = this.parseNumber(coefStr);
                    if (cleanItemCode && !isNaN(coef) && coef > 0) {
                        const comp = compositions.get(currentCompCode);
                        if (comp) {
                            comp.items.push({ inputCode: cleanItemCode, coefficient: coef });
                        }
                    }
                }
            } catch (err) {
                errors.push(`Composição linha ${i + 2}: ${err.message}`);
            }
        }

        // Save compositions
        for (const [code, data] of compositions) {
            try {
                let existing = await this.compositionRepo.findOne({ where: { code } });
                if (existing) {
                    await this.compositionRepo.update(existing.id, {
                        description: data.desc,
                        unit: data.unit,
                    });
                    await this.compositionItemRepo.delete({ compositionId: existing.id });
                    updated++;
                } else {
                    existing = await this.compositionRepo.save(this.compositionRepo.create({
                        code,
                        description: data.desc,
                        unit: data.unit,
                        type: 'composition',
                    }));
                    inserted++;
                }

                // Save items
                for (let idx = 0; idx < data.items.length; idx++) {
                    const item = data.items[idx];
                    const ci: any = { compositionId: existing.id, coefficient: item.coefficient, sortOrder: idx, itemType: 'insumo' };

                    // Check if it's an input or sub-composition
                    const input = await this.inputRepo.findOne({ where: { code: item.inputCode } });
                    if (input) {
                        ci.inputId = input.id;
                    } else {
                        const childComp = await this.compositionRepo.findOne({ where: { code: item.inputCode } });
                        if (childComp) {
                            ci.childCompositionId = childComp.id;
                            ci.itemType = 'composicao_auxiliar';
                        } else {
                            warnings.push(`Item ${item.inputCode} na composição ${code} não encontrado no cadastro`);
                        }
                    }

                    await this.compositionItemRepo.save(this.compositionItemRepo.create(ci));
                }
            } catch (err) {
                errors.push(`Composição ${code}: ${err.message}`);
            }
        }

        return { inserted, updated, skipped };
    }

    private async processCompositionCostRows(rows: any[], referenceId: string, taxRegime: string, errors: string[], warnings: string[]) {
        let inserted = 0, updated = 0, skipped = 0;

        for (let i = 0; i < rows.length; i++) {
            try {
                const row = rows[i];
                const code = this.getField(row, ['COMPOSICAO', 'COMPOSIÇÃO', 'CODIGO', 'CÓDIGO', 'CODIGO COMPOSICAO', 'COD']);
                const totalStr = this.getField(row, ['CUSTO TOTAL', 'PRECO', 'PREÇO', 'TOTAL', 'CUSTO UNITARIO', 'CUSTO UNITÁRIO', 'VALOR']);
                const matStr = this.getField(row, ['MATERIAL', 'CUSTO MATERIAL', 'MAT']);
                const labStr = this.getField(row, ['MAO DE OBRA', 'MÃO DE OBRA', 'MO', 'CUSTO MO']);
                const eqStr = this.getField(row, ['EQUIPAMENTO', 'EQUIP', 'CUSTO EQUIP', 'EQ']);

                if (!code || !totalStr) { skipped++; continue; }

                const cleanCode = String(code).trim().replace(/[^\d]/g, '');
                if (!cleanCode) { skipped++; continue; }

                const total = this.parseNumber(totalStr);
                if (isNaN(total) || total < 0) { skipped++; continue; }

                // Find or auto-create composition
                let comp = await this.compositionRepo.findOne({ where: { code: cleanCode } });
                if (!comp) {
                    const desc = this.getField(row, ['DESCRICAO', 'DESCRIÇÃO', 'DESC']) || `Composição ${cleanCode}`;
                    const unit = this.getField(row, ['UNIDADE', 'UN', 'UND']) || 'UN';
                    comp = await this.compositionRepo.save(this.compositionRepo.create({
                        code: cleanCode,
                        description: String(desc).trim(),
                        unit: String(unit).trim().toUpperCase(),
                    }));
                    warnings.push(`Composição ${cleanCode} auto-criada na importação de custos`);
                }

                // Upsert cost
                const existing = await this.compositionCostRepo.findOne({
                    where: { referenceId, compositionId: comp.id },
                });

                const costData: any = {
                    materialCost: matStr ? this.parseNumber(matStr) : null,
                    laborCost: labStr ? this.parseNumber(labStr) : null,
                    equipmentCost: eqStr ? this.parseNumber(eqStr) : null,
                    calculationMethod: 'imported',
                };

                if (taxRegime === 'desonerado') {
                    costData.totalTaxed = total;
                    if (existing?.totalNotTaxed) costData.totalNotTaxed = existing.totalNotTaxed;
                } else {
                    costData.totalNotTaxed = total;
                    if (existing?.totalTaxed) costData.totalTaxed = existing.totalTaxed;
                }

                if (existing) {
                    await this.compositionCostRepo.update(existing.id, costData);
                    updated++;
                } else {
                    await this.compositionCostRepo.save(this.compositionCostRepo.create({
                        referenceId,
                        compositionId: comp.id,
                        ...costData,
                    }));
                    inserted++;
                }
            } catch (err) {
                errors.push(`Custo composição linha ${i + 2}: ${err.message}`);
            }
        }

        return { inserted, updated, skipped };
    }

    // Auto-detect: tries to determine what type of data the rows contain
    private async processAutoDetect(rows: any[], referenceId: string, taxRegime: string, errors: string[], warnings: string[]) {
        if (rows.length === 0) return { inserted: 0, updated: 0, skipped: 0 };

        const cols = Object.keys(rows[0]).map(k => k.toUpperCase());
        const hasCoef = cols.some(c => c.includes('COEFICIENTE') || c.includes('COEF'));
        const hasPrice = cols.some(c => c.includes('PRECO') || c.includes('PREÇO') || c.includes('MEDIANA') || c.includes('CUSTO'));
        const hasComp = cols.some(c => c.includes('COMPOSIC') || c.includes('COMPOSIÇÃO'));

        if (hasCoef) return this.processCompositionRows(rows, errors, warnings);
        if (hasComp && hasPrice) return this.processCompositionCostRows(rows, referenceId, taxRegime, errors, warnings);
        if (hasPrice) return this.processInputPriceRows(rows, referenceId, taxRegime, errors, warnings);
        return this.processInputRows(rows, errors, warnings);
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════

    private async getOrCreateReference(year: number, month: number, state: string): Promise<SinapiReference> {
        let ref = await this.referenceRepo.findOne({ where: { year, month, state: state.toUpperCase() } });
        if (ref) return ref;

        // Mark previous refs as superseded
        await this.referenceRepo.update(
            { state: state.toUpperCase(), status: 'active' },
            { status: 'superseded' },
        );

        ref = await this.referenceRepo.save(this.referenceRepo.create({
            year,
            month,
            state: state.toUpperCase(),
            label: `SINAPI ${MONTH_NAMES[month]}/${year} - ${state.toUpperCase()}`,
            status: 'active',
        }));

        return ref;
    }

    private getField(row: any, possibleNames: string[]): string | null {
        const norm = (s: string) => s.toUpperCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // strip accents

        for (const name of possibleNames) {
            const normName = norm(name);
            // Exact match
            if (row[name] !== undefined && row[name] !== '') return String(row[name]);
            // Case-insensitive + accent-insensitive exact match
            const exactKey = Object.keys(row).find(k => norm(k) === normName);
            if (exactKey && row[exactKey] !== undefined && row[exactKey] !== '') return String(row[exactKey]);
            // Partial match (contains), accent-insensitive
            const partialKey = Object.keys(row).find(k => norm(k).includes(normName));
            if (partialKey && row[partialKey] !== undefined && row[partialKey] !== '') return String(row[partialKey]);
        }
        // Last resort: try reverse partial (pattern contained in column name)
        for (const name of possibleNames) {
            const normName = (name).toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            for (const key of Object.keys(row)) {
                const normKey = key.toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (normKey.length > 3 && normName.includes(normKey)) {
                    if (row[key] !== undefined && row[key] !== '') return String(row[key]);
                }
            }
        }
        return null;
    }

    private parseNumber(value: any): number {
        if (typeof value === 'number') return value;
        if (!value) return NaN;
        // Handle Brazilian number format: 1.234,56 → 1234.56
        let str = String(value).trim();
        // Remove currency symbols
        str = str.replace(/R\$\s*/gi, '').replace(/[^\d.,\-]/g, '');
        // If has comma as decimal separator (Brazilian format)
        if (str.includes(',')) {
            str = str.replace(/\./g, '').replace(',', '.');
        }
        return parseFloat(str);
    }

    private detectInputType(description: string): string {
        const upper = (description || '').toUpperCase();
        if (upper.includes('MAO DE OBRA') || upper.includes('MÃO DE OBRA')
            || upper.includes('SERVENTE') || upper.includes('PEDREIRO')
            || upper.includes('ELETRICISTA') || upper.includes('ENCANADOR')
            || upper.includes('AJUDANTE') || upper.includes('OFICIAL')
            || upper.includes('MONTADOR') || upper.includes('SOLDADOR')
            || upper.includes('HORA') || upper.includes('ARMADOR'))
            return 'mao_de_obra';
        if (upper.includes('EQUIPAMENTO') || upper.includes('EQUIP')
            || upper.includes('RETROESCAVADEIRA') || upper.includes('BETONEIRA')
            || upper.includes('CAMINHAO') || upper.includes('GUINDASTE')
            || upper.includes('COMPRESSOR') || upper.includes('VIBRADOR')
            || upper.includes('GERADOR') || upper.includes('BOMBA'))
            return 'equipamento';
        return 'material';
    }

    private mergeResults(a: { inserted: number; updated: number; skipped: number }, b: { inserted: number; updated: number; skipped: number }) {
        return {
            inserted: a.inserted + b.inserted,
            updated: a.updated + b.updated,
            skipped: a.skipped + b.skipped,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // IMPORT LOGS
    // ═══════════════════════════════════════════════════════════════

    async getImportLogs(limit = 50) {
        return this.importLogRepo.find({
            relations: ['reference'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async getImportLog(id: string) {
        return this.importLogRepo.findOne({ where: { id }, relations: ['reference'] });
    }

    async deleteImportLog(id: string) {
        await this.importLogRepo.delete(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // REPROCESSING — rollback and reimport
    // ═══════════════════════════════════════════════════════════════

    async rollbackImport(logId: string): Promise<{ deleted: number }> {
        const log = await this.importLogRepo.findOne({ where: { id: logId } });
        if (!log || !log.referenceId) throw new Error('Log ou referência não encontrado');

        // Only delete prices/costs for this reference (inputs/compositions are reusable)
        const [pricesDeleted] = await this.dataSource.query(
            `DELETE FROM sinapi_input_prices WHERE "referenceId" = $1`, [log.referenceId],
        );
        const [costsDeleted] = await this.dataSource.query(
            `DELETE FROM sinapi_composition_costs WHERE "referenceId" = $1`, [log.referenceId],
        );

        await this.importLogRepo.update(logId, { status: ImportLogStatus.ERROR, errors: JSON.stringify(['Rollback executado']) });

        return { deleted: (pricesDeleted?.rowCount || 0) + (costsDeleted?.rowCount || 0) };
    }
}
