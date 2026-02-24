import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Supplier,
    SupplierContact,
    QuotationRequest,
    QuotationItem,
    QuotationResponse,
    QuotationResponseItem,
    PriceHistory,
    PriceSource,
    QuotationResponseStatus,
} from './supply.entity';

@Injectable()
export class SupplyService {
    constructor(
        @InjectRepository(Supplier)
        private supplierRepo: Repository<Supplier>,
        @InjectRepository(SupplierContact)
        private contactRepo: Repository<SupplierContact>,
        @InjectRepository(QuotationRequest)
        private quotationRepo: Repository<QuotationRequest>,
        @InjectRepository(QuotationItem)
        private quotationItemRepo: Repository<QuotationItem>,
        @InjectRepository(QuotationResponse)
        private responseRepo: Repository<QuotationResponse>,
        @InjectRepository(QuotationResponseItem)
        private responseItemRepo: Repository<QuotationResponseItem>,
        @InjectRepository(PriceHistory)
        private priceHistoryRepo: Repository<PriceHistory>,
    ) { }

    // ==================== SUPPLIERS ====================

    async findAllSuppliers(filters?: { segment?: string; status?: string }) {
        const qb = this.supplierRepo.createQueryBuilder('s')
            .leftJoinAndSelect('s.contacts', 'contacts')
            .orderBy('s.name', 'ASC');

        if (filters?.segment) qb.andWhere('s.segment = :segment', { segment: filters.segment });
        if (filters?.status) qb.andWhere('s.status = :status', { status: filters.status });

        return qb.getMany();
    }

    async findSupplier(id: string) {
        const supplier = await this.supplierRepo.findOne({
            where: { id },
            relations: ['contacts'],
        });
        if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
        return supplier;
    }

    async createSupplier(data: Partial<Supplier>) {
        const supplier = this.supplierRepo.create(data);
        return this.supplierRepo.save(supplier);
    }

    async updateSupplier(id: string, data: Partial<Supplier>) {
        await this.findSupplier(id);
        await this.supplierRepo.update(id, data);
        return this.findSupplier(id);
    }

    async deleteSupplier(id: string) {
        await this.findSupplier(id);
        await this.supplierRepo.delete(id);
        return { deleted: true };
    }

    // ==================== CONTACTS ====================

    async addContact(supplierId: string, data: Partial<SupplierContact>) {
        await this.findSupplier(supplierId);
        const contact = this.contactRepo.create({ ...data, supplierId });
        return this.contactRepo.save(contact);
    }

    async updateContact(id: string, data: Partial<SupplierContact>) {
        await this.contactRepo.update(id, data);
        return this.contactRepo.findOne({ where: { id } });
    }

    async deleteContact(id: string) {
        await this.contactRepo.delete(id);
        return { deleted: true };
    }

    // ==================== QUOTATIONS ====================

    async findAllQuotations(status?: string) {
        const qb = this.quotationRepo.createQueryBuilder('q')
            .leftJoinAndSelect('q.items', 'items')
            .leftJoinAndSelect('items.catalogItem', 'catalogItem')
            .leftJoinAndSelect('q.responses', 'responses')
            .leftJoinAndSelect('responses.supplier', 'supplier')
            .orderBy('q.createdAt', 'DESC');

        if (status) qb.andWhere('q.status = :status', { status });
        return qb.getMany();
    }

    async findQuotation(id: string) {
        const quotation = await this.quotationRepo.findOne({
            where: { id },
            relations: [
                'items',
                'items.catalogItem',
                'items.responseItems',
                'items.responseItems.quotationResponse',
                'items.responseItems.quotationResponse.supplier',
                'responses',
                'responses.supplier',
                'responses.items',
            ],
        });
        if (!quotation) throw new NotFoundException('Cotação não encontrada');
        return quotation;
    }

    async createQuotation(data: { title: string; deadline?: string; notes?: string; items: Array<{ catalogItemId?: string; description: string; quantity: number; unit?: string }> }) {
        const count = await this.quotationRepo.count();
        const code = `COT-${String(count + 1).padStart(4, '0')}`;

        const quotation = this.quotationRepo.create({
            code,
            title: data.title,
            deadline: data.deadline ? new Date(data.deadline) : null,
            notes: data.notes,
            items: data.items.map(i => this.quotationItemRepo.create({
                catalogItemId: i.catalogItemId || null,
                description: i.description,
                quantity: i.quantity,
                unit: i.unit || 'un',
            })),
        });

        return this.quotationRepo.save(quotation);
    }

    async updateQuotation(id: string, data: Partial<QuotationRequest>) {
        await this.findQuotation(id);
        await this.quotationRepo.update(id, data);
        return this.findQuotation(id);
    }

    // ==================== QUOTATION RESPONSES ====================

    async addQuotationResponse(quotationRequestId: string, data: {
        supplierId: string;
        deliveryDays?: number;
        paymentTerms?: string;
        validUntil?: string;
        notes?: string;
        items: Array<{ quotationItemId: string; unitPrice: number; totalPrice: number; notes?: string }>;
    }) {
        await this.findQuotation(quotationRequestId);

        const response = this.responseRepo.create({
            quotationRequestId,
            supplierId: data.supplierId,
            status: QuotationResponseStatus.RECEIVED,
            receivedAt: new Date(),
            deliveryDays: data.deliveryDays,
            paymentTerms: data.paymentTerms,
            validUntil: data.validUntil ? new Date(data.validUntil) : null,
            notes: data.notes,
            items: data.items.map(i => this.responseItemRepo.create({
                quotationItemId: i.quotationItemId,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice,
                notes: i.notes,
            })),
        });

        const saved = await this.responseRepo.save(response);

        // Registrar no histórico de preços automaticamente
        const quotation = await this.findQuotation(quotationRequestId);
        for (const item of data.items) {
            const qItem = quotation.items.find(qi => qi.id === item.quotationItemId);
            if (qItem?.catalogItemId) {
                await this.priceHistoryRepo.save(this.priceHistoryRepo.create({
                    catalogItemId: qItem.catalogItemId,
                    supplierId: data.supplierId,
                    unitPrice: item.unitPrice,
                    date: new Date(),
                    source: PriceSource.QUOTATION,
                    quotationResponseId: saved.id,
                }));
            }
        }

        // Atualizar status da cotação
        await this.quotationRepo.update(quotationRequestId, { status: 'received' as any });

        return this.findQuotation(quotationRequestId);
    }

    async selectResponse(responseId: string) {
        const response = await this.responseRepo.findOne({ where: { id: responseId } });
        if (!response) throw new NotFoundException('Resposta não encontrada');

        // Marcar esta como selecionada e as outras como rejeitadas
        await this.responseRepo.update(
            { quotationRequestId: response.quotationRequestId },
            { status: QuotationResponseStatus.REJECTED },
        );
        await this.responseRepo.update(responseId, { status: QuotationResponseStatus.SELECTED });
        await this.quotationRepo.update(response.quotationRequestId, { status: 'closed' as any });

        return this.findQuotation(response.quotationRequestId);
    }

    // ==================== PRICE COMPARISON ====================

    async compareQuotation(quotationRequestId: string) {
        const quotation = await this.findQuotation(quotationRequestId);

        const comparison = quotation.items.map(item => {
            const prices = (item.responseItems || []).map(ri => ({
                supplierId: ri.quotationResponse?.supplierId,
                supplierName: ri.quotationResponse?.supplier?.name,
                unitPrice: Number(ri.unitPrice),
                totalPrice: Number(ri.totalPrice),
                deliveryDays: ri.quotationResponse?.deliveryDays,
                paymentTerms: ri.quotationResponse?.paymentTerms,
            }));

            const bestPrice = prices.length > 0
                ? prices.reduce((best, p) => p.unitPrice < best.unitPrice ? p : best)
                : null;

            return {
                itemId: item.id,
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit,
                catalogItemId: item.catalogItemId,
                prices,
                bestPrice,
            };
        });

        return { quotation: { id: quotation.id, code: quotation.code, title: quotation.title }, comparison };
    }

    // ==================== PRICE HISTORY ====================

    async getPriceHistory(catalogItemId: string, filters?: { supplierId?: string; startDate?: string; endDate?: string }) {
        const qb = this.priceHistoryRepo.createQueryBuilder('ph')
            .leftJoinAndSelect('ph.supplier', 'supplier')
            .leftJoinAndSelect('ph.catalogItem', 'catalogItem')
            .where('ph.catalogItemId = :catalogItemId', { catalogItemId })
            .orderBy('ph.date', 'DESC');

        if (filters?.supplierId) qb.andWhere('ph.supplierId = :supplierId', { supplierId: filters.supplierId });
        if (filters?.startDate) qb.andWhere('ph.date >= :startDate', { startDate: filters.startDate });
        if (filters?.endDate) qb.andWhere('ph.date <= :endDate', { endDate: filters.endDate });

        return qb.getMany();
    }

    async addPriceManual(data: { catalogItemId: string; supplierId: string; unitPrice: number; date?: string }) {
        const entry = this.priceHistoryRepo.create({
            catalogItemId: data.catalogItemId,
            supplierId: data.supplierId,
            unitPrice: data.unitPrice,
            date: data.date ? new Date(data.date) : new Date(),
            source: PriceSource.MANUAL,
        });
        return this.priceHistoryRepo.save(entry);
    }

    async getBestPrice(catalogItemId: string) {
        const latest = await this.priceHistoryRepo.createQueryBuilder('ph')
            .leftJoinAndSelect('ph.supplier', 'supplier')
            .where('ph.catalogItemId = :catalogItemId', { catalogItemId })
            .orderBy('ph.unitPrice', 'ASC')
            .limit(5)
            .getMany();

        return latest;
    }

    // ==================== MARKUP CALCULATOR ====================

    async calculateMarkup(data: { catalogItemId: string; markupPercent: number; supplierId?: string }) {
        let baseCost: number;

        if (data.supplierId) {
            const latest = await this.priceHistoryRepo.findOne({
                where: { catalogItemId: data.catalogItemId, supplierId: data.supplierId },
                order: { date: 'DESC' },
                relations: ['supplier'],
            });
            baseCost = latest ? Number(latest.unitPrice) : 0;
        } else {
            const best = await this.priceHistoryRepo.findOne({
                where: { catalogItemId: data.catalogItemId },
                order: { unitPrice: 'ASC' },
                relations: ['supplier'],
            });
            baseCost = best ? Number(best.unitPrice) : 0;
        }

        const markupMultiplier = 1 + (data.markupPercent / 100);
        const sellingPrice = baseCost * markupMultiplier;
        const profit = sellingPrice - baseCost;

        return {
            catalogItemId: data.catalogItemId,
            baseCost,
            markupPercent: data.markupPercent,
            sellingPrice: Math.round(sellingPrice * 100) / 100,
            profit: Math.round(profit * 100) / 100,
        };
    }

    async priceComparison(catalogItemIds: string[]) {
        const results = [];
        for (const id of catalogItemIds) {
            const history = await this.priceHistoryRepo.find({
                where: { catalogItemId: id },
                relations: ['supplier', 'catalogItem'],
                order: { date: 'DESC' },
                take: 10,
            });
            results.push({ catalogItemId: id, catalogItemName: history[0]?.catalogItem?.name, history });
        }
        return results;
    }
}
