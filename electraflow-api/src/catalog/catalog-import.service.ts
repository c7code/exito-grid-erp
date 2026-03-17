import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { CatalogItem, CatalogCategory, CatalogType } from './catalog.entity';
import { CatalogGroupingItem } from './catalog-grouping-item.entity';

interface ImportRow {
    externalCode?: string;
    sku?: string;
    name: string;
    unit?: string;
    type?: string;
    unitPrice?: number;
    costPrice?: number;
    category?: string;
}

interface GroupingRow {
    kitName: string;
    childName: string;
    quantity?: number;
    unit?: string;
}

export interface ImportResult {
    created: number;
    updated: number;
    skipped: number;
    groupingsCreated: number;
    errors: string[];
    details: { name: string; action: string }[];
}

@Injectable()
export class CatalogImportService implements OnModuleInit {
    private readonly logger = new Logger(CatalogImportService.name);

    constructor(
        @InjectRepository(CatalogItem)
        private itemRepo: Repository<CatalogItem>,
        @InjectRepository(CatalogCategory)
        private categoryRepo: Repository<CatalogCategory>,
        @InjectRepository(CatalogGroupingItem)
        private groupingRepo: Repository<CatalogGroupingItem>,
        private dataSource: DataSource,
    ) {}

    async onModuleInit() {
        try {
            const qr = this.dataSource.createQueryRunner();
            await qr.connect();
            const cols = await qr.query(
                `SELECT column_name FROM information_schema.columns WHERE table_name = 'catalog_items' AND column_name = 'externalCode'`,
            );
            if (cols.length === 0) {
                await qr.query(`ALTER TABLE "catalog_items" ADD COLUMN "externalCode" varchar NULL`);
                this.logger.log('✅ Added externalCode column to catalog_items');
            }
            await qr.release();
        } catch (err) {
            this.logger.warn('Migration check for externalCode failed (non-critical)', err?.message);
        }
    }

    /**
     * Parse price values — handles BR format (comma decimal) and standard
     */
    private parsePrice(value: any): number {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return isNaN(value) ? 0 : value;
        const s = String(value).trim();
        if (!s) return 0;
        let normalized: string;
        if (s.includes(',')) {
            normalized = s.replace(/\./g, '').replace(',', '.');
        } else {
            normalized = s;
        }
        const n = parseFloat(normalized);
        return isNaN(n) ? 0 : n;
    }

    /**
     * Normalize a header string to match expected column names
     */
    private normalizeHeader(header: string): string {
        const h = String(header || '').trim().toUpperCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
            .replace(/[^A-Z0-9_]/g, '_');

        const map: Record<string, string> = {
            'CODIGO_EXTERNO': 'externalCode',
            'CODIGO': 'externalCode',
            'COD_EXTERNO': 'externalCode',
            'COD': 'externalCode',
            'SKU': 'sku',
            'CODIGO_INTERNO': 'sku',
            'COD_INTERNO': 'sku',
            'NOME': 'name',
            'NOME_DO_PRODUTO': 'name',
            'PRODUTO': 'name',
            'DESCRICAO': 'name',
            'UNIDADE': 'unit',
            'UNIDADE_DE_MEDIDA': 'unit',
            'UN': 'unit',
            'TIPO': 'type',
            'PRECO_VENDA': 'unitPrice',
            'PRECO_DE_VENDA': 'unitPrice',
            'VALOR_VENDA': 'unitPrice',
            'VALOR_DE_VENDA': 'unitPrice',
            'PRECO': 'unitPrice',
            'PRECO_CUSTO': 'costPrice',
            'PRECO_DE_CUSTO': 'costPrice',
            'VALOR_CUSTO': 'costPrice',
            'VALOR_DE_CUSTO': 'costPrice',
            'CUSTO': 'costPrice',
            'CATEGORIA': 'category',
            // Grouping sheet
            'NOME_KIT': 'kitName',
            'NOME_AGRUPAMENTO': 'kitName',
            'KIT': 'kitName',
            'NOME_FILHO': 'childName',
            'FILHO': 'childName',
            'ITEM': 'childName',
            'QUANTIDADE': 'quantity',
            'QTD': 'quantity',
        };

        return map[h] || h;
    }

    /**
     * Main import method — receives a Buffer of XLSX file
     */
    async importFromXlsx(buffer: Buffer): Promise<ImportResult> {
        const wb = XLSX.read(buffer, { type: 'buffer' });

        if (wb.SheetNames.length === 0) {
            throw new BadRequestException('Planilha vazia — nenhuma aba encontrada.');
        }

        const result: ImportResult = {
            created: 0,
            updated: 0,
            skipped: 0,
            groupingsCreated: 0,
            errors: [],
            details: [],
        };

        // ── 1. Parse Products sheet ────────────────────────────
        const productSheetName = this.findSheet(wb, ['Produtos', 'Planilha1', 'Sheet1', 'Materiais']);
        if (!productSheetName) {
            throw new BadRequestException('Nenhuma aba de produtos encontrada. Use: Produtos, Planilha1, Sheet1 ou Materiais.');
        }

        const productData = XLSX.utils.sheet_to_json(wb.Sheets[productSheetName], { header: 1, defval: '' }) as any[][];
        if (productData.length < 2) {
            throw new BadRequestException('Planilha deve ter pelo menos o cabeçalho + 1 linha de dados.');
        }

        // Map headers
        const headers = (productData[0] as string[]).map(h => this.normalizeHeader(h));
        const nameIdx = headers.indexOf('name');

        if (nameIdx === -1) {
            throw new BadRequestException(
                'Coluna obrigatória não encontrada: NOME (ou NOME_DO_PRODUTO, PRODUTO, DESCRICAO). ' +
                'Verifique se o cabeçalho da planilha está correto.'
            );
        }

        // Parse rows
        const products: ImportRow[] = [];
        for (let i = 1; i < productData.length; i++) {
            const row = productData[i];
            const name = String(row[nameIdx] || '').trim();
            if (!name) continue; // Skip empty rows

            const product: ImportRow = { name };

            headers.forEach((h, idx) => {
                if (h === 'name') return; // already set
                const val = row[idx];
                if (val === '' || val === null || val === undefined) return;

                switch (h) {
                    case 'externalCode': product.externalCode = String(val).trim(); break;
                    case 'sku': product.sku = String(val).trim(); break;
                    case 'unit': product.unit = String(val).trim().toUpperCase(); break;
                    case 'type': product.type = String(val).trim().toLowerCase(); break;
                    case 'unitPrice': product.unitPrice = this.parsePrice(val); break;
                    case 'costPrice': product.costPrice = this.parsePrice(val); break;
                    case 'category': product.category = String(val).trim(); break;
                }
            });

            products.push(product);
        }

        // ── 2. Upsert Products ─────────────────────────────────
        const categoryCache: Record<string, string> = {};

        for (const product of products) {
            try {
                // Find existing by externalCode or SKU or exact name
                let existing: CatalogItem | null = null;
                if (product.externalCode) {
                    existing = await this.itemRepo.findOne({ where: { externalCode: product.externalCode } });
                }
                if (!existing && product.sku) {
                    existing = await this.itemRepo.findOne({ where: { sku: product.sku } });
                }

                // Resolve category
                let categoryId: string | undefined;
                if (product.category) {
                    if (categoryCache[product.category]) {
                        categoryId = categoryCache[product.category];
                    } else {
                        let cat = await this.categoryRepo.findOne({ where: { name: product.category } });
                        if (!cat) {
                            cat = await this.categoryRepo.save(this.categoryRepo.create({
                                name: product.category,
                                type: (product.type === 'servico' || product.type === 'service')
                                    ? CatalogType.SERVICE : CatalogType.MATERIAL,
                            }));
                        }
                        categoryCache[product.category] = cat.id;
                        categoryId = cat.id;
                    }
                }

                const itemData: Partial<CatalogItem> = {
                    name: product.name,
                    type: (product.type === 'servico' || product.type === 'service')
                        ? CatalogType.SERVICE : CatalogType.MATERIAL,
                    isActive: true,
                };

                if (product.externalCode) itemData.externalCode = product.externalCode;
                if (product.sku) itemData.sku = product.sku;
                if (product.unit) itemData.unit = product.unit;
                if (product.unitPrice !== undefined) itemData.unitPrice = product.unitPrice;
                if (product.costPrice !== undefined) itemData.costPrice = product.costPrice;
                if (categoryId) itemData.categoryId = categoryId;

                if (existing) {
                    // Update
                    await this.itemRepo.update(existing.id, itemData);
                    result.updated++;
                    result.details.push({ name: product.name, action: 'atualizado' });
                } else {
                    // Create
                    await this.itemRepo.save(this.itemRepo.create(itemData));
                    result.created++;
                    result.details.push({ name: product.name, action: 'criado' });
                }
            } catch (err: any) {
                result.errors.push(`Erro no item "${product.name}": ${err?.message || 'desconhecido'}`);
                result.skipped++;
            }
        }

        // ── 3. Parse Groupings sheet (optional) ────────────────
        const groupingSheetName = this.findSheet(wb, ['Agrupamentos', 'Kits', 'Composicoes']);
        if (groupingSheetName) {
            const groupData = XLSX.utils.sheet_to_json(wb.Sheets[groupingSheetName], { header: 1, defval: '' }) as any[][];
            if (groupData.length >= 2) {
                const gHeaders = (groupData[0] as string[]).map(h => this.normalizeHeader(h));
                const kitNameIdx = gHeaders.indexOf('kitName');
                const childNameIdx = gHeaders.indexOf('childName');
                const qtyIdx = gHeaders.indexOf('quantity');
                const unitIdx = gHeaders.indexOf('unit');

                if (kitNameIdx !== -1 && childNameIdx !== -1) {
                    // Group rows by kit name
                    const kitMap: Record<string, GroupingRow[]> = {};
                    for (let i = 1; i < groupData.length; i++) {
                        const row = groupData[i];
                        const kitName = String(row[kitNameIdx] || '').trim();
                        const childName = String(row[childNameIdx] || '').trim();
                        if (!kitName || !childName) continue;

                        if (!kitMap[kitName]) kitMap[kitName] = [];
                        kitMap[kitName].push({
                            kitName,
                            childName,
                            quantity: qtyIdx !== -1 ? this.parsePrice(row[qtyIdx]) || 1 : 1,
                            unit: unitIdx !== -1 ? String(row[unitIdx] || 'UN').trim().toUpperCase() : 'UN',
                        });
                    }

                    // Create groupings
                    for (const [kitName, children] of Object.entries(kitMap)) {
                        try {
                            // Find or create kit parent
                            let parentItem = await this.itemRepo.findOne({ where: { name: kitName } });
                            if (!parentItem) {
                                parentItem = await this.itemRepo.save(this.itemRepo.create({
                                    name: kitName,
                                    type: CatalogType.MATERIAL,
                                    isGrouping: true,
                                    unit: 'KIT',
                                    isActive: true,
                                    isSoldSeparately: true,
                                }));
                            } else {
                                await this.itemRepo.update(parentItem.id, { isGrouping: true, unit: 'KIT' });
                            }

                            // Delete old grouping items
                            await this.groupingRepo.delete({ parentItemId: parentItem.id });

                            // Link children
                            let kitUnitTotal = 0;
                            let kitCostTotal = 0;
                            for (let idx = 0; idx < children.length; idx++) {
                                const child = children[idx];
                                const childItem = await this.itemRepo.findOne({ where: { name: child.childName } });
                                if (!childItem) {
                                    result.errors.push(`Kit "${kitName}": filho "${child.childName}" não encontrado no catálogo.`);
                                    continue;
                                }

                                await this.groupingRepo.save(this.groupingRepo.create({
                                    parentItemId: parentItem.id,
                                    childItemId: childItem.id,
                                    quantity: child.quantity,
                                    unit: child.unit,
                                    sortOrder: idx,
                                }));

                                kitUnitTotal += Number(childItem.unitPrice || 0) * child.quantity;
                                kitCostTotal += Number(childItem.costPrice || 0) * child.quantity;
                            }

                            // Update kit price
                            await this.itemRepo.update(parentItem.id, {
                                unitPrice: kitUnitTotal,
                                costPrice: kitCostTotal,
                            });

                            result.groupingsCreated++;
                            result.details.push({ name: kitName, action: 'agrupamento criado' });
                        } catch (err: any) {
                            result.errors.push(`Erro no agrupamento "${kitName}": ${err?.message}`);
                        }
                    }
                }
            }
        }

        return result;
    }

    /**
     * Generate a template XLSX file
     */
    generateTemplate(): Buffer {
        const wb = XLSX.utils.book_new();

        // Products sheet
        const productRows = [
            ['CODIGO_EXTERNO', 'SKU', 'NOME', 'UNIDADE', 'TIPO', 'PRECO_VENDA', 'PRECO_CUSTO', 'CATEGORIA'],
            ['3430548', '', 'ALCA PREF RAM LIG 10/16MM N. ISOL', 'CDA', 'material', 3.71, 2.6, 'Alças e Conectores'],
            ['Tabela 19', '', 'ALCA PRE-FORMADA CABO COBERTO 15 KV', 'UN', 'material', 9.43, 6.6, 'Alças e Conectores'],
            ['', 'SKU-001', 'POSTE DT 600/09', 'UN', 'material', 1748.57, 1224, 'Postes'],
            ['', '', 'SERVICO DE INSTALAÇÃO ELÉTRICA', 'H', 'servico', 150, 80, 'Serviços'],
        ];
        const wsProducts = XLSX.utils.aoa_to_sheet(productRows);
        // Set column widths
        wsProducts['!cols'] = [
            { wch: 18 }, { wch: 12 }, { wch: 45 }, { wch: 10 },
            { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
        ];
        XLSX.utils.book_append_sheet(wb, wsProducts, 'Produtos');

        // Groupings sheet
        const groupingRows = [
            ['NOME_KIT', 'NOME_FILHO', 'QUANTIDADE', 'UNIDADE'],
            ['CE1', 'ARRUELA LIS CIRC SAE1020 M18', 2, 'UN'],
            ['CE1', 'PARAFUSO ABAU ACO CARB M16X150MM', 3, 'UN'],
            ['CE1', 'PORCA QUAD SAE1020 M16', 3, 'UN'],
            ['CE4', 'BRACO REDE PROT TIPO C 580X440X365X76MM', 1, 'UN'],
            ['CE4', 'ISOLADOR SUSP POLIMERICO 50KN 15kV', 3, 'UN'],
        ];
        const wsGroupings = XLSX.utils.aoa_to_sheet(groupingRows);
        wsGroupings['!cols'] = [
            { wch: 20 }, { wch: 45 }, { wch: 14 }, { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(wb, wsGroupings, 'Agrupamentos');

        return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    }

    private findSheet(wb: XLSX.WorkBook, candidates: string[]): string | null {
        // Try exact match first
        for (const name of candidates) {
            if (wb.SheetNames.includes(name)) return name;
        }
        // Try case-insensitive
        for (const name of candidates) {
            const found = wb.SheetNames.find(s => s.toLowerCase() === name.toLowerCase());
            if (found) return found;
        }
        // Fallback to first sheet
        return wb.SheetNames[0] || null;
    }
}
