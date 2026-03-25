import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Proposal, ProposalItem, ProposalStatus } from '../proposals/proposal.entity';
import { SinapiCompositionEngine } from './sinapi-engine.service';
import { SinapiPricingService, CommercialPricingResult } from './sinapi-pricing.service';
import { SinapiService } from './sinapi.service';
import { SinapiBudgetLink } from './entities/sinapi-budget-link.entity';

// ═══════════════════════════════════════════════════════════════
// SINAPI PROPOSAL INTEGRATION SERVICE
// ═══════════════════════════════════════════════════════════════
// Orquestra: composição → cálculo técnico → preço comercial →
// grava no ProposalItem → cria budget link → congela valores

@Injectable()
export class SinapiProposalService {
    private readonly logger = new Logger(SinapiProposalService.name);

    constructor(
        @InjectRepository(Proposal)
        private proposalRepo: Repository<Proposal>,
        @InjectRepository(ProposalItem)
        private itemRepo: Repository<ProposalItem>,
        @InjectRepository(SinapiBudgetLink)
        private budgetLinkRepo: Repository<SinapiBudgetLink>,
        private engine: SinapiCompositionEngine,
        private pricingService: SinapiPricingService,
        private sinapiService: SinapiService,
        private dataSource: DataSource,
    ) {}

    // ═══════════════════════════════════════════════════════════════
    // MIGRATION — Adicionar colunas SINAPI ao proposal_items
    // ═══════════════════════════════════════════════════════════════

    async ensureColumns() {
        const columns = [
            { name: 'isSinapiLinked', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "isSinapiLinked" BOOLEAN DEFAULT false` },
            { name: 'sinapiCompositionCode', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "sinapiCompositionCode" VARCHAR` },
            { name: 'sinapiCompositionId', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "sinapiCompositionId" UUID` },
            { name: 'sinapiReferenceId', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "sinapiReferenceId" UUID` },
            { name: 'sinapiUnitCost', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "sinapiUnitCost" DECIMAL(15,4)` },
            { name: 'sinapiBdiPercent', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "sinapiBdiPercent" DECIMAL(6,2)` },
            { name: 'sinapiPricingProfileId', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "sinapiPricingProfileId" UUID` },
            { name: 'sinapiSellingPrice', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "sinapiSellingPrice" DECIMAL(15,4)` },
            { name: 'sinapiPricingSnapshot', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "sinapiPricingSnapshot" TEXT` },
            { name: 'sinapiFrozenAt', sql: `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "sinapiFrozenAt" TIMESTAMPTZ` },
        ];

        for (const col of columns) {
            try {
                await this.dataSource.query(col.sql);
            } catch (e) {
                this.logger.warn(`Column migration ${col.name}: ${e.message}`);
            }
        }

        this.logger.log('✅ SINAPI proposal_items columns OK');
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. ADICIONAR ITEM SINAPI À PROPOSTA
    // ═══════════════════════════════════════════════════════════════
    // Fluxo: composição → engine.calculate → pricing.calculatePrice
    // → cria ProposalItem + SinapiBudgetLink

    async addSinapiItem(data: {
        proposalId: string;
        compositionCodeOrId: string;
        state: string;
        quantity: number;
        profileId?: string;
        referenceId?: string;
        taxRegime?: 'desonerado' | 'nao_desonerado';
        description?: string;
        notes?: string;
        allowOverride?: boolean;
        overrideUnitPrice?: number;
    }): Promise<{ item: ProposalItem; budgetLink: SinapiBudgetLink; pricing: CommercialPricingResult }> {

        // 1. Verificar proposta existe e está em DRAFT
        const proposal = await this.proposalRepo.findOne({ where: { id: data.proposalId } });
        if (!proposal) throw new NotFoundException('Proposta não encontrada');
        if (proposal.status !== ProposalStatus.DRAFT) {
            throw new BadRequestException('Só é possível adicionar itens SINAPI em propostas RASCUNHO');
        }

        const taxRegime = data.taxRegime || 'nao_desonerado';
        const qty = data.quantity || 1;

        // 2. Calcular custo técnico via engine
        const memory = await this.engine.calculate(data.compositionCodeOrId, data.state, {
            referenceId: data.referenceId,
            taxRegime,
        });

        const unitCost = taxRegime === 'desonerado'
            ? memory.consolidated.totalTaxed
            : memory.consolidated.totalNotTaxed;

        // 3. Calcular preço comercial
        const pricing = await this.pricingService.calculatePrice(
            unitCost,
            data.profileId,
            {
                quantity: 1, // Preço UNITÁRIO
                taxRegime,
                materialCost: memory.consolidated.materialCost,
                laborCost: memory.consolidated.laborCost,
                equipmentCost: memory.consolidated.equipmentCost,
            },
        );

        const sellingUnitPrice = pricing.sellingPrice.afterRounding;
        const finalUnitPrice = data.overrideUnitPrice ?? sellingUnitPrice;
        const totalBdiPercent = pricing.indicators.totalMarkupPercent;

        // 4. Criar ProposalItem
        const item = await this.itemRepo.save(this.itemRepo.create({
            proposalId: data.proposalId,
            description: data.description || memory.composition.description,
            unit: memory.composition.unit,
            serviceType: 'service',
            unitPrice: finalUnitPrice,
            quantity: qty,
            total: Math.round(finalUnitPrice * qty * 100) / 100,
            notes: data.notes || null,
            // SINAPI tracking fields
            isSinapiLinked: true,
            sinapiCompositionCode: memory.composition.code,
            sinapiCompositionId: memory.composition.id,
            sinapiReferenceId: memory.reference?.id || null,
            sinapiUnitCost: unitCost,
            sinapiBdiPercent: totalBdiPercent,
            sinapiPricingProfileId: pricing.profile.id,
            sinapiSellingPrice: sellingUnitPrice,
            sinapiPricingSnapshot: JSON.stringify(pricing),
            sinapiFrozenAt: new Date(),
        }));

        // 5. Criar SinapiBudgetLink (para rastreabilidade)
        const budgetLink = await this.budgetLinkRepo.save(this.budgetLinkRepo.create({
            proposalId: data.proposalId,
            proposalItemId: item.id,
            compositionId: memory.composition.id,
            referenceId: memory.reference?.id || '',
            coefficient: qty,
            sinapiUnitCost: unitCost,
            budgetUnitPrice: finalUnitPrice,
            bdiPercent: totalBdiPercent,
            notes: data.notes || null,
        }));

        // 6. Recalcular totais da proposta
        await this.recalcProposalTotals(data.proposalId);

        this.logger.log(`🔗 Item SINAPI ${memory.composition.code} adicionado à proposta ${proposal.proposalNumber}`);

        return { item, budgetLink, pricing };
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. RECALCULAR ITEM SINAPI (nova referência ou perfil)
    // ═══════════════════════════════════════════════════════════════

    async recalculateItem(itemId: string, options?: {
        referenceId?: string;
        profileId?: string;
        state?: string;
        taxRegime?: 'desonerado' | 'nao_desonerado';
    }): Promise<{ item: ProposalItem; pricing: CommercialPricingResult }> {

        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Item não encontrado');
        if (!item.isSinapiLinked) throw new BadRequestException('Item não está vinculado ao SINAPI');

        // Check proposal is in draft
        const proposal = await this.proposalRepo.findOne({ where: { id: item.proposalId } });
        if (proposal && proposal.status !== ProposalStatus.DRAFT) {
            throw new BadRequestException('Proposta já emitida — valores congelados');
        }

        const state = options?.state || 'PE';
        const taxRegime = options?.taxRegime || 'nao_desonerado';
        const compCode = item.sinapiCompositionCode || item.sinapiCompositionId;

        // Recalculate
        const memory = await this.engine.calculate(compCode, state, {
            referenceId: options?.referenceId || item.sinapiReferenceId,
            taxRegime,
        });

        const unitCost = taxRegime === 'desonerado'
            ? memory.consolidated.totalTaxed
            : memory.consolidated.totalNotTaxed;

        const pricing = await this.pricingService.calculatePrice(
            unitCost,
            options?.profileId || item.sinapiPricingProfileId,
            {
                quantity: 1,
                taxRegime,
                materialCost: memory.consolidated.materialCost,
                laborCost: memory.consolidated.laborCost,
                equipmentCost: memory.consolidated.equipmentCost,
            },
        );

        const sellingUnitPrice = pricing.sellingPrice.afterRounding;

        // Update item
        await this.itemRepo.update(item.id, {
            unitPrice: sellingUnitPrice,
            total: Math.round(sellingUnitPrice * Number(item.quantity) * 100) / 100,
            sinapiReferenceId: memory.reference?.id || item.sinapiReferenceId,
            sinapiUnitCost: unitCost,
            sinapiBdiPercent: pricing.indicators.totalMarkupPercent,
            sinapiPricingProfileId: pricing.profile.id,
            sinapiSellingPrice: sellingUnitPrice,
            sinapiPricingSnapshot: JSON.stringify(pricing),
            sinapiFrozenAt: new Date(),
        });

        // Update budget link too
        await this.budgetLinkRepo.update(
            { proposalItemId: item.id },
            {
                referenceId: memory.reference?.id || '',
                sinapiUnitCost: unitCost,
                budgetUnitPrice: sellingUnitPrice,
                bdiPercent: pricing.indicators.totalMarkupPercent,
            },
        );

        await this.recalcProposalTotals(item.proposalId);

        return { item: await this.itemRepo.findOne({ where: { id: itemId } }), pricing };
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. CONGELAMENTO — Freeze all SINAPI values when proposal is emitted
    // ═══════════════════════════════════════════════════════════════

    async freezeProposalValues(proposalId: string): Promise<{ frozenCount: number }> {
        const items = await this.itemRepo.find({
            where: { proposalId, isSinapiLinked: true },
        });

        let frozenCount = 0;
        const now = new Date();

        for (const item of items) {
            if (!item.sinapiFrozenAt || item.sinapiFrozenAt < now) {
                // Ensure snapshot is current
                if (item.sinapiCompositionCode && item.sinapiPricingProfileId) {
                    try {
                        const memory = await this.engine.calculate(
                            item.sinapiCompositionCode, 'PE',
                            { referenceId: item.sinapiReferenceId },
                        );
                        const pricing = await this.pricingService.calculatePrice(
                            Number(item.sinapiUnitCost),
                            item.sinapiPricingProfileId,
                        );
                        await this.itemRepo.update(item.id, {
                            sinapiPricingSnapshot: JSON.stringify({
                                compositionMemory: memory,
                                pricingResult: pricing,
                                frozenAt: now.toISOString(),
                            }),
                            sinapiFrozenAt: now,
                        });
                    } catch (e) {
                        this.logger.warn(`Freeze item ${item.id}: ${e.message}`);
                        await this.itemRepo.update(item.id, { sinapiFrozenAt: now });
                    }
                } else {
                    await this.itemRepo.update(item.id, { sinapiFrozenAt: now });
                }
                frozenCount++;
            }
        }

        return { frozenCount };
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. LISTAR ITENS SINAPI DE UMA PROPOSTA
    // ═══════════════════════════════════════════════════════════════

    async getSinapiItems(proposalId: string) {
        const items = await this.itemRepo.find({
            where: { proposalId, isSinapiLinked: true },
            order: { createdAt: 'ASC' },
        });

        const budgetLinks = await this.budgetLinkRepo.find({
            where: { proposalId },
            relations: ['composition', 'reference'],
        });

        const linkMap = new Map(budgetLinks.map(l => [l.proposalItemId, l]));

        return items.map(item => ({
            ...item,
            budgetLink: linkMap.get(item.id) || null,
            pricingSnapshot: item.sinapiPricingSnapshot
                ? JSON.parse(item.sinapiPricingSnapshot)
                : null,
        }));
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. RECALCULAR TODOS OS ITENS SINAPI DA PROPOSTA
    // ═══════════════════════════════════════════════════════════════

    async recalculateAll(proposalId: string, options?: {
        referenceId?: string;
        profileId?: string;
        state?: string;
        taxRegime?: 'desonerado' | 'nao_desonerado';
    }): Promise<{ updated: number; errors: string[] }> {
        const proposal = await this.proposalRepo.findOne({ where: { id: proposalId } });
        if (!proposal) throw new NotFoundException('Proposta não encontrada');
        if (proposal.status !== ProposalStatus.DRAFT) {
            throw new BadRequestException('Proposta já emitida — valores congelados');
        }

        const items = await this.itemRepo.find({
            where: { proposalId, isSinapiLinked: true },
        });

        let updated = 0;
        const errors: string[] = [];

        for (const item of items) {
            try {
                await this.recalculateItem(item.id, options);
                updated++;
            } catch (err) {
                errors.push(`Item ${item.sinapiCompositionCode}: ${err.message}`);
            }
        }

        return { updated, errors };
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. REMOVER VÍNCULO SINAPI DE UM ITEM
    // ═══════════════════════════════════════════════════════════════

    async unlinkSinapiItem(itemId: string) {
        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Item não encontrado');

        const proposal = await this.proposalRepo.findOne({ where: { id: item.proposalId } });
        if (proposal && proposal.status !== ProposalStatus.DRAFT) {
            throw new BadRequestException('Proposta já emitida');
        }

        // Clear SINAPI fields
        await this.itemRepo.update(item.id, {
            isSinapiLinked: false,
            sinapiCompositionCode: null,
            sinapiCompositionId: null,
            sinapiReferenceId: null,
            sinapiUnitCost: null,
            sinapiBdiPercent: null,
            sinapiPricingProfileId: null,
            sinapiSellingPrice: null,
            sinapiPricingSnapshot: null,
            sinapiFrozenAt: null,
        });

        // Remove budget link
        await this.budgetLinkRepo.delete({ proposalItemId: item.id });

        return { message: 'Vínculo SINAPI removido' };
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER — Recalcula subtotal/total da proposta
    // ═══════════════════════════════════════════════════════════════

    private async recalcProposalTotals(proposalId: string) {
        const items = await this.itemRepo.find({
            where: { proposalId },
        });

        // Subtotal: soma de items que não são filhos
        const subtotal = items
            .filter(i => !i.parentId)
            .reduce((sum, i) => sum + Number(i.total || 0), 0);

        const proposal = await this.proposalRepo.findOne({ where: { id: proposalId } });
        if (!proposal) return;

        const discount = Number(proposal.discount || 0);
        const total = Math.round((subtotal - discount) * 100) / 100;

        await this.proposalRepo.update(proposalId, {
            subtotal: Math.round(subtotal * 100) / 100,
            total: total > 0 ? total : 0,
        });
    }
}
