import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SinapiPricingProfile } from './entities/sinapi-pricing-profile.entity';
import { SinapiCompositionEngine, CalculationMemory } from './sinapi-engine.service';

// ═══════════════════════════════════════════════════════════════
// INTERFACES — Tabela de Composição do Preço de Venda
// ═══════════════════════════════════════════════════════════════

export interface PricingBreakdownLine {
    label: string;            // Nome do componente
    category: string;         // 'custo_direto' | 'bdi' | 'imposto' | 'custo_fixo' | 'arredondamento'
    percentApplied: number;   // % aplicado (0 se for custo fixo)
    baseValue: number;        // Valor base sobre o qual incide
    value: number;            // Valor calculado (R$)
    cumulative: number;       // Valor acumulado até esta linha
}

export interface CommercialPricingResult {
    // ─── Custo Técnico (origem SINAPI) ───
    technicalCost: {
        totalNotTaxed: number;
        totalTaxed: number;
        materialCost: number;
        laborCost: number;
        equipmentCost: number;
    };

    // ─── Custo Direto Ajustado ───
    adjustedDirectCost: {
        baseCost: number;            // Custo técnico selecionado
        mobilization: number;
        localAdmin: number;
        logistics: number;
        contingency: number;
        total: number;               // Custo direto total
    };

    // ─── BDI Detalhado ───
    bdi: {
        adminCentral: number;
        financialExpenses: number;
        insuranceGuarantees: number;
        profit: number;
        totalBdiPercent: number;     // Soma dos %
        totalBdiValue: number;       // Valor do BDI em R$
    };

    // ─── Custos Fixos ───
    fixedCosts: {
        technicalVisit: number;
        artPermit: number;
        otherFixed: number;
        total: number;
    };

    // ─── Impostos ───
    taxes: {
        iss: number;
        pis: number;
        cofins: number;
        irpj: number;
        csll: number;
        inss: number;
        otherTax: number;
        totalTaxPercent: number;
        totalTaxValue: number;
    };

    // ─── Preço de Venda ───
    sellingPrice: {
        beforeRounding: number;
        afterRounding: number;
        roundingDiff: number;
        roundingMode: string;
    };

    // ─── Tabela Geral (Memória) ───
    breakdownTable: PricingBreakdownLine[];

    // ─── Indicadores ───
    indicators: {
        totalMarkupPercent: number;   // (PV / CD - 1) × 100
        grossMarginPercent: number;   // (PV - CD) / PV × 100
        bdiEffective: number;         // BDI efetivo sobre o custo
        taxBurden: number;            // Carga tributária total %
    };

    // ─── Profile usado ───
    profile: {
        id: string;
        name: string;
    };

    // ─── Memória de cálculo da composição (se fornecida) ───
    compositionMemory?: CalculationMemory;
}

// ═══════════════════════════════════════════════════════════════
// SINAPI PRICING SERVICE
// ═══════════════════════════════════════════════════════════════

@Injectable()
export class SinapiPricingService {
    private readonly logger = new Logger(SinapiPricingService.name);

    constructor(
        @InjectRepository(SinapiPricingProfile)
        private profileRepo: Repository<SinapiPricingProfile>,
        private engine: SinapiCompositionEngine,
    ) {}

    // ═══════════════════════════════════════════════════════════════
    // PROFILE CRUD
    // ═══════════════════════════════════════════════════════════════

    async findAllProfiles() {
        return this.profileRepo.find({ order: { isDefault: 'DESC', name: 'ASC' } });
    }

    async findProfile(id: string) {
        const p = await this.profileRepo.findOne({ where: { id } });
        if (!p) throw new NotFoundException('Perfil não encontrado');
        return p;
    }

    async findDefaultProfile() {
        return this.profileRepo.findOne({ where: { isDefault: true } })
            || this.profileRepo.findOne({ where: { isActive: true }, order: { createdAt: 'ASC' } });
    }

    async createProfile(data: Partial<SinapiPricingProfile>) {
        if (data.isDefault) {
            await this.profileRepo.update({}, { isDefault: false });
        }
        return this.profileRepo.save(this.profileRepo.create(data));
    }

    async updateProfile(id: string, data: Partial<SinapiPricingProfile>) {
        if (data.isDefault) {
            await this.profileRepo.update({}, { isDefault: false });
        }
        await this.profileRepo.update(id, data);
        return this.findProfile(id);
    }

    async deleteProfile(id: string) {
        await this.profileRepo.delete(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // CÁLCULO DO PREÇO COMERCIAL
    // ═══════════════════════════════════════════════════════════════

    /**
     * Calcula o preço comercial a partir de um custo técnico + perfil de precificação.
     * @param technicalCost Custo técnico SINAPI (R$)
     * @param profileId ID do perfil (ou null para perfil padrão)
     * @param options Quantidade, regime, composição
     */
    async calculatePrice(
        technicalCost: number,
        profileId?: string,
        options?: {
            quantity?: number;
            taxRegime?: 'desonerado' | 'nao_desonerado';
            materialCost?: number;
            laborCost?: number;
            equipmentCost?: number;
        },
    ): Promise<CommercialPricingResult> {
        // 1. Buscar perfil
        const profile = profileId
            ? await this.findProfile(profileId)
            : await this.findDefaultProfile();

        if (!profile) throw new NotFoundException('Nenhum perfil de precificação encontrado. Crie um perfil antes de precificar.');

        const qty = options?.quantity || 1;
        const baseCost = technicalCost * qty;

        return this.applyPricing(baseCost, profile, {
            materialCost: (options?.materialCost || 0) * qty,
            laborCost: (options?.laborCost || 0) * qty,
            equipmentCost: (options?.equipmentCost || 0) * qty,
        });
    }

    /**
     * Calcula o preço comercial diretamente a partir de uma composição SINAPI.
     */
    async calculateFromComposition(
        codeOrId: string,
        state: string,
        profileId?: string,
        options?: {
            quantity?: number;
            referenceId?: string;
            taxRegime?: 'desonerado' | 'nao_desonerado';
            maxDepth?: number;
        },
    ): Promise<CommercialPricingResult> {
        const taxRegime = options?.taxRegime || 'nao_desonerado';

        // 1. Calcular custo técnico via engine
        const memory = await this.engine.calculate(codeOrId, state, {
            referenceId: options?.referenceId,
            maxDepth: options?.maxDepth,
            taxRegime,
        });

        const qty = options?.quantity || 1;
        const unitCost = taxRegime === 'desonerado'
            ? memory.consolidated.totalTaxed
            : memory.consolidated.totalNotTaxed;

        const baseCost = unitCost * qty;

        // 2. Buscar perfil
        const profile = profileId
            ? await this.findProfile(profileId)
            : await this.findDefaultProfile();

        if (!profile) throw new NotFoundException('Nenhum perfil de precificação encontrado');

        // 3. Aplicar precificação
        const result = this.applyPricing(baseCost, profile, {
            materialCost: memory.consolidated.materialCost * qty,
            laborCost: memory.consolidated.laborCost * qty,
            equipmentCost: memory.consolidated.equipmentCost * qty,
        });

        // Incluir memória de cálculo técnica
        result.compositionMemory = memory;
        result.technicalCost = {
            totalNotTaxed: memory.consolidated.totalNotTaxed * qty,
            totalTaxed: memory.consolidated.totalTaxed * qty,
            materialCost: memory.consolidated.materialCost * qty,
            laborCost: memory.consolidated.laborCost * qty,
            equipmentCost: memory.consolidated.equipmentCost * qty,
        };

        return result;
    }

    // ═══════════════════════════════════════════════════════════════
    // MOTOR DE PRECIFICAÇÃO
    // ═══════════════════════════════════════════════════════════════

    private applyPricing(
        baseCost: number,
        profile: SinapiPricingProfile,
        costBreakdown: { materialCost: number; laborCost: number; equipmentCost: number },
    ): CommercialPricingResult {
        const p = (v: any) => Number(v) || 0;
        const r = (v: number) => Math.round(v * 100) / 100;
        const table: PricingBreakdownLine[] = [];
        let cumulative = baseCost;

        // ─── CUSTO TÉCNICO ───
        table.push({
            label: 'Custo Técnico SINAPI',
            category: 'custo_direto',
            percentApplied: 0,
            baseValue: 0,
            value: baseCost,
            cumulative: baseCost,
        });

        // ─── CUSTOS DIRETOS ADICIONAIS ───
        const mobilization = r(baseCost * p(profile.mobilizationPercent) / 100);
        const localAdmin = r(baseCost * p(profile.localAdminPercent) / 100);
        const logistics = r(baseCost * p(profile.logisticsPercent) / 100);
        const contingency = r(baseCost * p(profile.contingencyPercent) / 100);

        const directAddons = [
            { label: 'Mobilização / Desmobilização', pct: p(profile.mobilizationPercent), val: mobilization },
            { label: 'Administração Local', pct: p(profile.localAdminPercent), val: localAdmin },
            { label: 'Logística / Frete', pct: p(profile.logisticsPercent), val: logistics },
            { label: 'Contingência / Risco', pct: p(profile.contingencyPercent), val: contingency },
        ];

        for (const addon of directAddons) {
            if (addon.val !== 0) {
                cumulative += addon.val;
                table.push({
                    label: addon.label,
                    category: 'custo_direto',
                    percentApplied: addon.pct,
                    baseValue: baseCost,
                    value: addon.val,
                    cumulative: r(cumulative),
                });
            }
        }

        const totalDirectCost = r(cumulative);

        // ─── BDI ───
        const bdiAdminVal = r(totalDirectCost * p(profile.bdiAdminPercent) / 100);
        const bdiFinVal = r(totalDirectCost * p(profile.bdiFinancialPercent) / 100);
        const bdiInsVal = r(totalDirectCost * p(profile.bdiInsurancePercent) / 100);
        const bdiProfitVal = r(totalDirectCost * p(profile.bdiProfitPercent) / 100);
        const totalBdiPercent = p(profile.bdiAdminPercent) + p(profile.bdiFinancialPercent) + p(profile.bdiInsurancePercent) + p(profile.bdiProfitPercent);

        const bdiItems = [
            { label: 'BDI — Administração Central', pct: p(profile.bdiAdminPercent), val: bdiAdminVal },
            { label: 'BDI — Despesas Financeiras', pct: p(profile.bdiFinancialPercent), val: bdiFinVal },
            { label: 'BDI — Seguros e Garantias', pct: p(profile.bdiInsurancePercent), val: bdiInsVal },
            { label: 'BDI — Lucro', pct: p(profile.bdiProfitPercent), val: bdiProfitVal },
        ];

        let totalBdiValue = 0;
        for (const item of bdiItems) {
            if (item.val !== 0) {
                totalBdiValue += item.val;
                cumulative += item.val;
                table.push({
                    label: item.label,
                    category: 'bdi',
                    percentApplied: item.pct,
                    baseValue: totalDirectCost,
                    value: item.val,
                    cumulative: r(cumulative),
                });
            }
        }
        totalBdiValue = r(totalBdiValue);

        // ─── CUSTOS FIXOS ───
        const techVisit = p(profile.technicalVisitCost);
        const artPermit = p(profile.artPermitCost);
        const otherFixed = p(profile.otherFixedCosts);

        const fixedItems = [
            { label: 'Visita Técnica', val: techVisit },
            { label: 'ART / Laudo / Projeto', val: artPermit },
            { label: 'Outros Custos Fixos', val: otherFixed },
        ];

        let totalFixed = 0;
        for (const item of fixedItems) {
            if (item.val !== 0) {
                totalFixed += item.val;
                cumulative += item.val;
                table.push({
                    label: item.label,
                    category: 'custo_fixo',
                    percentApplied: 0,
                    baseValue: 0,
                    value: item.val,
                    cumulative: r(cumulative),
                });
            }
        }
        totalFixed = r(totalFixed);

        // Base para impostos (preço antes de impostos)
        const preTaxPrice = r(cumulative);

        // ─── IMPOSTOS ───
        // Fórmula TCPO: impostos são calculados "por dentro"
        // PV = preTaxPrice / (1 - totalTaxPercent/100)
        // Fórmula standard: impostos "por fora"
        // PV = preTaxPrice × (1 + totalTaxPercent/100)
        const totalTaxPercent = p(profile.issPercent) + p(profile.pisPercent) + p(profile.cofinsPercent)
            + p(profile.irpjPercent) + p(profile.csllPercent) + p(profile.inssPercent) + p(profile.otherTaxPercent);

        let sellingPreRound: number;
        let totalTaxValue: number;

        if (profile.calculationMethod === 'tcpo' && totalTaxPercent > 0 && totalTaxPercent < 100) {
            // Cálculo "por dentro" (TCPO/Pini): PV = base / (1 - impostos%)
            sellingPreRound = r(preTaxPrice / (1 - totalTaxPercent / 100));
            totalTaxValue = r(sellingPreRound - preTaxPrice);
        } else {
            // Cálculo "por fora" (padrão): PV = base × (1 + impostos%)
            totalTaxValue = r(preTaxPrice * totalTaxPercent / 100);
            sellingPreRound = r(preTaxPrice + totalTaxValue);
        }

        // Cada imposto individual
        const taxItems = [
            { label: 'ISS', pct: p(profile.issPercent) },
            { label: 'PIS', pct: p(profile.pisPercent) },
            { label: 'COFINS', pct: p(profile.cofinsPercent) },
            { label: 'IRPJ', pct: p(profile.irpjPercent) },
            { label: 'CSLL', pct: p(profile.csllPercent) },
            { label: 'INSS / CPP', pct: p(profile.inssPercent) },
            { label: 'Outros Tributos', pct: p(profile.otherTaxPercent) },
        ];

        const taxBase = profile.calculationMethod === 'tcpo' ? sellingPreRound : preTaxPrice;
        const individualTaxes: Record<string, number> = {};

        for (const tax of taxItems) {
            const val = r(taxBase * tax.pct / 100);
            individualTaxes[tax.label] = val;
            if (val !== 0) {
                cumulative += val;
                table.push({
                    label: tax.label,
                    category: 'imposto',
                    percentApplied: tax.pct,
                    baseValue: taxBase,
                    value: val,
                    cumulative: r(cumulative),
                });
            }
        }

        // ─── ARREDONDAMENTO ───
        const sellingAfterRound = this.applyRounding(sellingPreRound, profile.roundingMode, p(profile.customRoundingValue));
        const roundingDiff = r(sellingAfterRound - sellingPreRound);

        if (roundingDiff !== 0) {
            table.push({
                label: `Arredondamento (${profile.roundingMode})`,
                category: 'arredondamento',
                percentApplied: 0,
                baseValue: sellingPreRound,
                value: roundingDiff,
                cumulative: sellingAfterRound,
            });
        }

        // ─── INDICADORES ───
        const markupPercent = baseCost > 0 ? r((sellingAfterRound / baseCost - 1) * 100) : 0;
        const grossMarginPercent = sellingAfterRound > 0 ? r((sellingAfterRound - baseCost) / sellingAfterRound * 100) : 0;
        const bdiEffective = baseCost > 0 ? r(totalBdiValue / baseCost * 100) : 0;

        return {
            technicalCost: {
                totalNotTaxed: baseCost,
                totalTaxed: baseCost,
                materialCost: costBreakdown.materialCost,
                laborCost: costBreakdown.laborCost,
                equipmentCost: costBreakdown.equipmentCost,
            },
            adjustedDirectCost: {
                baseCost,
                mobilization,
                localAdmin,
                logistics,
                contingency,
                total: totalDirectCost,
            },
            bdi: {
                adminCentral: bdiAdminVal,
                financialExpenses: bdiFinVal,
                insuranceGuarantees: bdiInsVal,
                profit: bdiProfitVal,
                totalBdiPercent: r(totalBdiPercent),
                totalBdiValue,
            },
            fixedCosts: {
                technicalVisit: techVisit,
                artPermit: artPermit,
                otherFixed,
                total: totalFixed,
            },
            taxes: {
                iss: individualTaxes['ISS'] || 0,
                pis: individualTaxes['PIS'] || 0,
                cofins: individualTaxes['COFINS'] || 0,
                irpj: individualTaxes['IRPJ'] || 0,
                csll: individualTaxes['CSLL'] || 0,
                inss: individualTaxes['INSS / CPP'] || 0,
                otherTax: individualTaxes['Outros Tributos'] || 0,
                totalTaxPercent: r(totalTaxPercent),
                totalTaxValue: r(totalTaxValue),
            },
            sellingPrice: {
                beforeRounding: sellingPreRound,
                afterRounding: sellingAfterRound,
                roundingDiff,
                roundingMode: profile.roundingMode,
            },
            breakdownTable: table,
            indicators: {
                totalMarkupPercent: markupPercent,
                grossMarginPercent: grossMarginPercent,
                bdiEffective,
                taxBurden: r(totalTaxPercent),
            },
            profile: {
                id: profile.id,
                name: profile.name,
            },
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // ARREDONDAMENTO COMERCIAL
    // ═══════════════════════════════════════════════════════════════

    private applyRounding(value: number, mode: string, customValue?: number): number {
        switch (mode) {
            case 'ceil_10':      return Math.ceil(value / 10) * 10;
            case 'ceil_50':      return Math.ceil(value / 50) * 50;
            case 'ceil_100':     return Math.ceil(value / 100) * 100;
            case 'round_10':     return Math.round(value / 10) * 10;
            case 'round_50':     return Math.round(value / 50) * 50;
            case 'round_100':    return Math.round(value / 100) * 100;
            case 'custom':
                if (customValue && customValue > 0) {
                    return Math.ceil(value / customValue) * customValue;
                }
                return Math.round(value * 100) / 100;
            default:             return Math.round(value * 100) / 100;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SIMULAÇÃO RÁPIDA — variar um parâmetro
    // ═══════════════════════════════════════════════════════════════

    async simulate(technicalCost: number, profileId: string, variations: {
        field: string;       // ex: 'bdiProfitPercent'
        values: number[];    // ex: [5, 10, 15, 20, 25]
    }): Promise<Array<{ paramValue: number; sellingPrice: number; markupPercent: number; grossMarginPercent: number }>> {
        const profile = await this.findProfile(profileId);
        const results: Array<{ paramValue: number; sellingPrice: number; markupPercent: number; grossMarginPercent: number }> = [];

        for (const val of variations.values) {
            const modifiedProfile = { ...profile, [variations.field]: val } as SinapiPricingProfile;
            const pricing = this.applyPricing(technicalCost, modifiedProfile, { materialCost: 0, laborCost: 0, equipmentCost: 0 });
            results.push({
                paramValue: val,
                sellingPrice: pricing.sellingPrice.afterRounding,
                markupPercent: pricing.indicators.totalMarkupPercent,
                grossMarginPercent: pricing.indicators.grossMarginPercent,
            });
        }

        return results;
    }
}
