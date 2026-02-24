import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as https from 'https';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CatalogCategory, CatalogItem, CatalogType } from './catalog.entity';
import { NcmCode } from './ncm.entity';
import { ProductSupplier } from './product-supplier.entity';
import { StockMovement, StockMovementType } from './stock-movement.entity';
import { FiscalRule } from './fiscal-rule.entity';
import { CFOP_LIST, CfopEntry } from './cfop-data';

@Injectable()
export class CatalogService {
    private readonly logger = new Logger(CatalogService.name);

    /** Helper HTTP GET usando módulo https nativo (mais confiável que fetch no Node v24) */
    private httpGet(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(body));
                        } catch (e) {
                            reject(new Error(`JSON parse error: ${body.substring(0, 200)}`));
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
                    }
                });
            }).on('error', (err) => {
                reject(new Error(`Network error: ${err.message}`));
            });
        });
    }
    constructor(
        @InjectRepository(CatalogCategory)
        private categoryRepository: Repository<CatalogCategory>,
        @InjectRepository(CatalogItem)
        private itemRepository: Repository<CatalogItem>,
        @InjectRepository(NcmCode)
        private ncmRepository: Repository<NcmCode>,
        @InjectRepository(ProductSupplier)
        private productSupplierRepository: Repository<ProductSupplier>,
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
        @InjectRepository(FiscalRule)
        private fiscalRuleRepository: Repository<FiscalRule>,
    ) { }

    // ═══════════════════════════════════════════════════════════════
    // CATEGORIAS
    // ═══════════════════════════════════════════════════════════════

    async findAllCategories(type?: CatalogType): Promise<CatalogCategory[]> {
        const where: any = {};
        if (type) where.type = type;
        return this.categoryRepository.find({
            where,
            relations: ['children', 'parent'],
            order: { name: 'ASC' },
        });
    }

    async findCategoryTree(type?: CatalogType): Promise<CatalogCategory[]> {
        const where: any = { parentId: null };
        if (type) where.type = type;
        return this.categoryRepository.find({
            where,
            relations: ['children', 'children.children'],
            order: { name: 'ASC' },
        });
    }

    async createCategory(data: Partial<CatalogCategory>): Promise<CatalogCategory> {
        const category = this.categoryRepository.create(data);
        return this.categoryRepository.save(category);
    }

    async updateCategory(id: string, data: Partial<CatalogCategory>): Promise<CatalogCategory> {
        await this.categoryRepository.update(id, data);
        return this.categoryRepository.findOne({ where: { id }, relations: ['parent'] });
    }

    async removeCategory(id: string): Promise<void> {
        await this.categoryRepository.delete(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // ITENS / PRODUTOS
    // ═══════════════════════════════════════════════════════════════

    async findAllItems(type?: CatalogType, categoryId?: string): Promise<CatalogItem[]> {
        const where: any = {};
        if (type) where.type = type;
        if (categoryId) where.categoryId = categoryId;
        return this.itemRepository.find({
            where,
            relations: ['category'],
            order: { name: 'ASC' },
        });
    }

    async findOneItem(id: string): Promise<CatalogItem> {
        const item = await this.itemRepository.findOne({
            where: { id },
            relations: ['category'],
        });
        if (!item) throw new NotFoundException('Produto não encontrado');
        return item;
    }

    async searchCatalog(query: string, type?: CatalogType): Promise<any[]> {
        const itemQb = this.itemRepository.createQueryBuilder('item')
            .leftJoinAndSelect('item.category', 'category')
            .where('(item.name ILIKE :query OR item.description ILIKE :query OR item.sku ILIKE :query OR item.barcode ILIKE :query OR item.ncm ILIKE :query)', { query: `%${query}%` });

        const catQb = this.categoryRepository.createQueryBuilder('category')
            .where('category.name ILIKE :query', { query: `%${query}%` });

        if (type) {
            itemQb.andWhere('item.type = :type', { type });
            catQb.andWhere('category.type = :type', { type });
        }

        const items = await itemQb.orderBy('item.name', 'ASC').take(15).getMany();
        const categories = await catQb.orderBy('category.name', 'ASC').take(5).getMany();

        return [
            ...categories.map(c => ({ ...c, dataType: 'category' })),
            ...items.map(i => ({ ...i, dataType: 'item' }))
        ];
    }

    async findItemsByCategory(categoryId: string): Promise<CatalogItem[]> {
        return this.itemRepository.find({
            where: { categoryId },
            order: { name: 'ASC' },
        });
    }

    async createItem(data: Partial<CatalogItem>): Promise<CatalogItem> {
        const item = this.itemRepository.create(data);
        return this.itemRepository.save(item);
    }

    async updateItem(id: string, data: Partial<CatalogItem>): Promise<CatalogItem> {
        await this.itemRepository.update(id, data);
        return this.itemRepository.findOne({ where: { id }, relations: ['category'] });
    }

    async removeItem(id: string): Promise<void> {
        await this.itemRepository.delete(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // NCM — Busca Autocomplete
    // ═══════════════════════════════════════════════════════════════

    async searchNcm(query: string): Promise<NcmCode[]> {
        if (!query || query.length < 2) return [];

        return this.ncmRepository.createQueryBuilder('ncm')
            .where('ncm.code ILIKE :q OR ncm.description ILIKE :q', { q: `%${query}%` })
            .orderBy('ncm.code', 'ASC')
            .take(20)
            .getMany();
    }

    async findAllNcm(): Promise<NcmCode[]> {
        return this.ncmRepository.find({ order: { code: 'ASC' } });
    }

    /**
     * Busca NCM via API pública BrasilAPI (sem autenticação)
     * https://brasilapi.com.br/api/ncm/v1?search={query}
     */
    async searchNcmPublic(query: string): Promise<any[]> {
        if (!query || query.length < 2) return [];
        try {
            const url = `https://brasilapi.com.br/api/ncm/v1?search=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            if (!response.ok) {
                this.logger.warn(`BrasilAPI NCM search failed: ${response.status}`);
                // Fallback para busca local
                return this.searchNcm(query);
            }
            const data = await response.json();
            // BrasilAPI retorna { codigo, descricao, data_inicio, data_fim, tipo_ato, ... }
            return (data || []).slice(0, 30).map((item: any) => ({
                code: item.codigo,
                description: item.descricao,
                source: 'brasilapi',
            }));
        } catch (error) {
            this.logger.error('BrasilAPI NCM search error', error);
            // Fallback para busca local
            return this.searchNcm(query);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CFOP — Lista estática
    // ═══════════════════════════════════════════════════════════════

    getCfopList(filters?: { type?: string; scope?: string; search?: string }): CfopEntry[] {
        let list = CFOP_LIST;
        if (filters?.type) {
            list = list.filter(c => c.type === filters.type);
        }
        if (filters?.scope) {
            list = list.filter(c => c.scope === filters.scope);
        }
        if (filters?.search) {
            const q = filters.search.toLowerCase();
            list = list.filter(c =>
                c.code.includes(q) || c.description.toLowerCase().includes(q)
            );
        }
        return list;
    }

    // ═══════════════════════════════════════════════════════════════
    // ESTOQUE — Movimentações
    // ═══════════════════════════════════════════════════════════════

    async getStockSummary(): Promise<any> {
        const lowStock = await this.itemRepository.createQueryBuilder('item')
            .leftJoinAndSelect('item.category', 'category')
            .where('item.trackStock = true')
            .andWhere('item.currentStock <= item.minStock')
            .andWhere('item.minStock > 0')
            .orderBy('item.currentStock', 'ASC')
            .getMany();

        const totalItems = await this.itemRepository.count({ where: { trackStock: true } });

        const totalValue = await this.itemRepository.createQueryBuilder('item')
            .select('SUM(item.currentStock * item.costPrice)', 'total')
            .where('item.trackStock = true')
            .getRawOne();

        return {
            lowStockItems: lowStock,
            totalTrackedItems: totalItems,
            totalStockValue: Number(totalValue?.total || 0),
        };
    }

    async createStockMovement(data: {
        catalogItemId: string;
        type: StockMovementType;
        quantity: number;
        reason?: string;
        referenceType?: string;
        referenceId?: string;
        createdBy?: string;
    }): Promise<StockMovement> {
        const item = await this.findOneItem(data.catalogItemId);

        if (!item.trackStock) {
            throw new BadRequestException('Este produto não possui controle de estoque ativado');
        }

        let qty = Math.abs(data.quantity);

        // Calcular novo estoque
        let newStock = Number(item.currentStock);
        switch (data.type) {
            case StockMovementType.ENTRADA:
                newStock += qty;
                break;
            case StockMovementType.SAIDA:
                if (newStock < qty) {
                    throw new BadRequestException(`Estoque insuficiente. Atual: ${newStock}, Solicitado: ${qty}`);
                }
                newStock -= qty;
                qty = -qty; // Negativo na movimentação
                break;
            case StockMovementType.AJUSTE:
                newStock = data.quantity; // Ajuste direto
                qty = data.quantity - Number(item.currentStock);
                break;
            case StockMovementType.RESERVA:
                item.reservedStock = Number(item.reservedStock || 0) + Math.abs(data.quantity);
                break;
            case StockMovementType.CANCELAMENTO:
                item.reservedStock = Math.max(0, Number(item.reservedStock || 0) - Math.abs(data.quantity));
                newStock += Math.abs(data.quantity);
                break;
        }

        item.currentStock = newStock;
        await this.itemRepository.save(item);

        const movement = this.stockMovementRepository.create({
            catalogItemId: data.catalogItemId,
            type: data.type,
            quantity: qty,
            stockAfter: newStock,
            reason: data.reason,
            referenceType: data.referenceType,
            referenceId: data.referenceId,
            createdBy: data.createdBy,
        });

        return this.stockMovementRepository.save(movement);
    }

    async getStockMovements(catalogItemId: string, limit = 50): Promise<StockMovement[]> {
        return this.stockMovementRepository.find({
            where: { catalogItemId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // FORNECEDORES DO PRODUTO
    // ═══════════════════════════════════════════════════════════════

    async getProductSuppliers(catalogItemId: string): Promise<ProductSupplier[]> {
        return this.productSupplierRepository.find({
            where: { catalogItemId },
            relations: ['supplier'],
            order: { createdAt: 'DESC' },
        });
    }

    async linkSupplier(data: Partial<ProductSupplier>): Promise<ProductSupplier> {
        // Check se já existe vínculo
        const existing = await this.productSupplierRepository.findOne({
            where: { catalogItemId: data.catalogItemId, supplierId: data.supplierId },
        });
        if (existing) {
            Object.assign(existing, data);
            return this.productSupplierRepository.save(existing);
        }
        const link = this.productSupplierRepository.create(data);
        return this.productSupplierRepository.save(link);
    }

    async unlinkSupplier(catalogItemId: string, supplierId: string): Promise<void> {
        await this.productSupplierRepository.delete({ catalogItemId, supplierId });
    }

    // ═══════════════════════════════════════════════════════════════
    // REGRAS FISCAIS
    // ═══════════════════════════════════════════════════════════════

    async findAllFiscalRules(): Promise<FiscalRule[]> {
        return this.fiscalRuleRepository.find({
            relations: ['category'],
            order: { createdAt: 'DESC' },
        });
    }

    async createFiscalRule(data: Partial<FiscalRule>): Promise<FiscalRule> {
        const rule = this.fiscalRuleRepository.create(data);
        return this.fiscalRuleRepository.save(rule);
    }

    async updateFiscalRule(id: string, data: Partial<FiscalRule>): Promise<FiscalRule> {
        await this.fiscalRuleRepository.update(id, data);
        return this.fiscalRuleRepository.findOne({ where: { id }, relations: ['category'] });
    }

    async removeFiscalRule(id: string): Promise<void> {
        await this.fiscalRuleRepository.delete(id);
    }

    /**
     * Busca a regra fiscal aplicável para um produto.
     * Prioridade: regra por NCM > regra por grupo > dados do produto
     */
    async getApplicableFiscalRule(item: CatalogItem): Promise<FiscalRule | null> {
        // 1) Buscar por NCM
        if (item.ncm) {
            const ncmRule = await this.fiscalRuleRepository.findOne({
                where: { ruleType: 'ncm' as any, ncmCode: item.ncm },
            });
            if (ncmRule) return ncmRule;
        }

        // 2) Buscar por grupo (categoria)
        if (item.categoryId) {
            const groupRule = await this.fiscalRuleRepository.findOne({
                where: { ruleType: 'group' as any, categoryId: item.categoryId },
            });
            if (groupRule) return groupRule;
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════════
    // CNPJ — Busca pública (BrasilAPI)
    // ═══════════════════════════════════════════════════════════════

    async lookupCnpj(cnpj: string): Promise<any> {
        const cleanCnpj = cnpj.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) {
            throw new BadRequestException('CNPJ deve ter 14 dígitos');
        }

        try {
            const data: any = await this.httpGet(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            return {
                cnpj: data.cnpj,
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia,
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                municipio: data.municipio,
                uf: data.uf,
                cep: data.cep,
                telefone: data.ddd_telefone_1,
                email: data.email,
                situacao: data.situacao_cadastral,
                atividadePrincipal: data.cnae_fiscal_descricao,
                naturezaJuridica: data.natureza_juridica,
            };
        } catch (error: any) {
            this.logger.error('Erro ao consultar CNPJ:', error?.message);
            throw new BadRequestException(
                `Não foi possível consultar o CNPJ: ${error?.message || 'erro desconhecido'}`,
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CEP — Busca pública (ViaCEP)
    // ═══════════════════════════════════════════════════════════════

    async lookupCep(cep: string): Promise<any> {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            throw new BadRequestException('CEP deve ter 8 dígitos');
        }

        try {
            const data: any = await this.httpGet(`https://viacep.com.br/ws/${cleanCep}/json/`);
            if (data.erro) {
                throw new Error('CEP não encontrado');
            }
            return {
                cep: data.cep,
                logradouro: data.logradouro,
                complemento: data.complemento,
                bairro: data.bairro,
                cidade: data.localidade,
                uf: data.uf,
                ibge: data.ibge,
            };
        } catch (error: any) {
            this.logger.error('Erro ao consultar CEP:', error?.message);
            throw new BadRequestException(
                `Não foi possível consultar o CEP: ${error?.message || 'erro desconhecido'}`,
            );
        }
    }
}
