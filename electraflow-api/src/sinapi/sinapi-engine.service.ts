import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SinapiReference } from './entities/sinapi-reference.entity';
import { SinapiInput } from './entities/sinapi-input.entity';
import { SinapiInputPrice } from './entities/sinapi-price.entity';
import { SinapiComposition } from './entities/sinapi-composition.entity';
import { SinapiCompositionItem } from './entities/sinapi-composition-item.entity';
import { SinapiCompositionCost } from './entities/sinapi-composition-price.entity';

// ═══════════════════════════════════════════════════════════════
// INTERFACES — Memória de Cálculo
// ═══════════════════════════════════════════════════════════════

export interface CalculationLine {
    seq: number;                         // Sequencial na composição
    itemType: 'insumo' | 'composicao_auxiliar';
    code: string;
    description: string;
    unit: string;
    coefficient: number;
    // Preço unitário
    unitPriceNotTaxed: number;
    unitPriceTaxed: number;
    priceOrigin: string;                 // 'sinapi_ref' | 'calculated' | 'not_found'
    // Subtotal = coeficiente × preço unitário
    subtotalNotTaxed: number;
    subtotalTaxed: number;
    // Classificação do insumo
    costCategory: 'material' | 'mao_de_obra' | 'equipamento' | 'composicao';
    // Sub-composição expandida (se for composição auxiliar)
    children?: CalculationLine[];
    childrenTotal?: { notTaxed: number; taxed: number };
    // Rastreabilidade
    inputId?: string;
    compositionId?: string;
    referenceId?: string;
    depth: number;
}

export interface CalculationMemory {
    // Composição raiz
    composition: {
        id: string;
        code: string;
        description: string;
        unit: string;
        type: string;
    };
    // Referência usada
    reference: {
        id: string;
        label: string;
        year: number;
        month: number;
        state: string;
    } | null;
    // Linhas de cálculo
    lines: CalculationLine[];
    // Custo consolidado (soma dos subtotais)
    consolidated: {
        totalNotTaxed: number;
        totalTaxed: number;
        materialCost: number;
        laborCost: number;
        equipmentCost: number;
    };
    // Comparação com custo armazenado (importado do SINAPI)
    storedCost: {
        totalNotTaxed: number;
        totalTaxed: number;
        materialCost: number;
        laborCost: number;
        equipmentCost: number;
        calculationMethod: string;
    } | null;
    // Divergência entre calculado e armazenado
    divergence: {
        notTaxed: number;            // diferença absoluta
        notTaxedPercent: number;     // diferença percentual
        taxed: number;
        taxedPercent: number;
    } | null;
    // Metadados
    meta: {
        totalItems: number;           // Total de insumos na composição
        resolvedItems: number;        // Insumos com preço encontrado
        unresolvedItems: number;      // Insumos sem preço
        maxDepth: number;             // Profundidade máxima atingida
        cyclesDetected: string[];     // Códigos onde ciclo foi detectado
        warnings: string[];
        calculatedAt: string;
    };
}

// ═══════════════════════════════════════════════════════════════
// SINAPI COMPOSITION ENGINE
// ═══════════════════════════════════════════════════════════════

@Injectable()
export class SinapiCompositionEngine {
    private readonly logger = new Logger(SinapiCompositionEngine.name);

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
    ) {}

    // ═══════════════════════════════════════════════════════════════
    // MAIN: Calcular composição completa
    // ═══════════════════════════════════════════════════════════════

    async calculate(
        codeOrId: string,
        state: string,
        options?: { referenceId?: string; maxDepth?: number; taxRegime?: 'desonerado' | 'nao_desonerado' },
    ): Promise<CalculationMemory> {
        const maxDepth = options?.maxDepth ?? 10;
        const taxRegime = options?.taxRegime ?? 'nao_desonerado';

        // 1. Localizar composição
        const comp = await this.findComposition(codeOrId);
        if (!comp) throw new NotFoundException(`Composição "${codeOrId}" não encontrada`);

        // 2. Determinar referência
        let ref: SinapiReference | null = null;
        if (options?.referenceId) {
            ref = await this.referenceRepo.findOne({ where: { id: options.referenceId } });
        } else {
            ref = await this.referenceRepo.findOne({
                where: { state: state.toUpperCase(), status: 'active' },
                order: { year: 'DESC', month: 'DESC' },
            });
        }

        // 3. Resolver árvore recursivamente (com detecção de ciclo)
        const visited = new Set<string>();
        const cyclesDetected: string[] = [];
        const warnings: string[] = [];
        let totalItems = 0;
        let resolvedItems = 0;
        let unresolvedItems = 0;
        let maxDepthReached = 0;

        const context = { visited, cyclesDetected, warnings, totalItems, resolvedItems, unresolvedItems, maxDepthReached };

        const lines = await this.resolveComposition(
            comp.id, ref?.id || null, 0, maxDepth, 1, context,
        );

        // 4. Consolidar custos
        const consolidated = this.consolidate(lines, taxRegime);

        // 5. Buscar custo armazenado para comparação
        let storedCost: CalculationMemory['storedCost'] = null;
        if (ref) {
            const stored = await this.compositionCostRepo.findOne({
                where: { compositionId: comp.id, referenceId: ref.id },
            });
            if (stored) {
                storedCost = {
                    totalNotTaxed: Number(stored.totalNotTaxed) || 0,
                    totalTaxed: Number(stored.totalTaxed) || 0,
                    materialCost: Number(stored.materialCost) || 0,
                    laborCost: Number(stored.laborCost) || 0,
                    equipmentCost: Number(stored.equipmentCost) || 0,
                    calculationMethod: stored.calculationMethod,
                };
            }
        }

        // 6. Calcular divergência
        let divergence: CalculationMemory['divergence'] = null;
        if (storedCost) {
            const diffNT = consolidated.totalNotTaxed - storedCost.totalNotTaxed;
            const diffT = consolidated.totalTaxed - storedCost.totalTaxed;
            divergence = {
                notTaxed: this.round(diffNT),
                notTaxedPercent: storedCost.totalNotTaxed > 0
                    ? this.round((diffNT / storedCost.totalNotTaxed) * 100)
                    : 0,
                taxed: this.round(diffT),
                taxedPercent: storedCost.totalTaxed > 0
                    ? this.round((diffT / storedCost.totalTaxed) * 100)
                    : 0,
            };
        }

        if (!ref) warnings.push('Nenhuma referência ativa encontrada para UF ' + state);
        if (context.unresolvedItems > 0) warnings.push(`${context.unresolvedItems} insumo(s) sem preço na referência`);
        if (context.cyclesDetected.length > 0) warnings.push(`Ciclo detectado em: ${context.cyclesDetected.join(', ')}`);

        return {
            composition: {
                id: comp.id,
                code: comp.code,
                description: comp.description,
                unit: comp.unit,
                type: comp.type,
            },
            reference: ref ? {
                id: ref.id,
                label: ref.label || `${ref.month}/${ref.year} ${ref.state}`,
                year: ref.year,
                month: ref.month,
                state: ref.state,
            } : null,
            lines,
            consolidated,
            storedCost,
            divergence,
            meta: {
                totalItems: context.totalItems,
                resolvedItems: context.resolvedItems,
                unresolvedItems: context.unresolvedItems,
                maxDepth: context.maxDepthReached,
                cyclesDetected: context.cyclesDetected,
                warnings: context.warnings,
                calculatedAt: new Date().toISOString(),
            },
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // RESOLVE — Recursão com detecção de ciclo
    // ═══════════════════════════════════════════════════════════════

    private async resolveComposition(
        compositionId: string,
        referenceId: string | null,
        depth: number,
        maxDepth: number,
        startSeq: number,
        ctx: {
            visited: Set<string>;
            cyclesDetected: string[];
            warnings: string[];
            totalItems: number;
            resolvedItems: number;
            unresolvedItems: number;
            maxDepthReached: number;
        },
    ): Promise<CalculationLine[]> {
        // Detecção de ciclo
        if (ctx.visited.has(compositionId)) {
            const comp = await this.compositionRepo.findOne({ where: { id: compositionId } });
            ctx.cyclesDetected.push(comp?.code || compositionId);
            return [];
        }

        // Profundidade máxima
        if (depth >= maxDepth) {
            ctx.warnings.push(`Profundidade máxima (${maxDepth}) atingida`);
            return [];
        }

        ctx.visited.add(compositionId);
        if (depth > ctx.maxDepthReached) ctx.maxDepthReached = depth;

        // Buscar itens da composição
        const items = await this.compositionItemRepo.find({
            where: { compositionId },
            relations: ['input', 'childComposition'],
            order: { sortOrder: 'ASC' },
        });

        const lines: CalculationLine[] = [];
        let seq = startSeq;

        for (const item of items) {
            ctx.totalItems++;

            if (item.inputId && item.input) {
                // ═══ INSUMO (folha) ═══
                const coef = Number(item.coefficient);
                let unitNT = 0, unitT = 0;
                let priceOrigin: string = 'not_found';

                if (referenceId) {
                    const price = await this.inputPriceRepo.findOne({
                        where: { inputId: item.input.id, referenceId },
                    });
                    if (price) {
                        unitNT = Number(price.priceNotTaxed) || 0;
                        unitT = Number(price.priceTaxed) || 0;
                        priceOrigin = 'sinapi_ref';
                        ctx.resolvedItems++;
                    } else {
                        ctx.unresolvedItems++;
                    }
                } else {
                    ctx.unresolvedItems++;
                }

                lines.push({
                    seq: seq++,
                    itemType: 'insumo',
                    code: item.input.code,
                    description: item.input.description,
                    unit: item.input.unit,
                    coefficient: coef,
                    unitPriceNotTaxed: unitNT,
                    unitPriceTaxed: unitT,
                    priceOrigin,
                    subtotalNotTaxed: this.round(coef * unitNT),
                    subtotalTaxed: this.round(coef * unitT),
                    costCategory: (item.input.type || 'material') as any,
                    inputId: item.input.id,
                    referenceId: referenceId || undefined,
                    depth,
                });

            } else if (item.childCompositionId && item.childComposition) {
                // ═══ COMPOSIÇÃO AUXILIAR (recursão) ═══
                const coef = Number(item.coefficient);
                const childComp = item.childComposition;

                // Resolver filhos recursivamente
                const children = await this.resolveComposition(
                    childComp.id, referenceId, depth + 1, maxDepth, 1, ctx,
                );

                // Somar custo dos filhos
                const childTotal = {
                    notTaxed: children.reduce((s, c) => s + c.subtotalNotTaxed, 0),
                    taxed: children.reduce((s, c) => s + c.subtotalTaxed, 0),
                };

                // O custo unitário da sub-composição = soma dos filhos
                // O subtotal desta linha = coeficiente × custo unitário da sub-comp
                const unitNT = this.round(childTotal.notTaxed);
                const unitT = this.round(childTotal.taxed);
                const priceOrigin = children.length > 0 ? 'calculated' : 'not_found';

                lines.push({
                    seq: seq++,
                    itemType: 'composicao_auxiliar',
                    code: childComp.code,
                    description: childComp.description,
                    unit: childComp.unit,
                    coefficient: coef,
                    unitPriceNotTaxed: unitNT,
                    unitPriceTaxed: unitT,
                    priceOrigin,
                    subtotalNotTaxed: this.round(coef * unitNT),
                    subtotalTaxed: this.round(coef * unitT),
                    costCategory: 'composicao',
                    compositionId: childComp.id,
                    referenceId: referenceId || undefined,
                    depth,
                    children,
                    childrenTotal: { notTaxed: unitNT, taxed: unitT },
                });
            }
        }

        // Remover do visited para permitir a mesma composição em ramos diferentes
        ctx.visited.delete(compositionId);

        return lines;
    }

    // ═══════════════════════════════════════════════════════════════
    // CONSOLIDAÇÃO — Somar tudo e classificar
    // ═══════════════════════════════════════════════════════════════

    private consolidate(lines: CalculationLine[], taxRegime: string): CalculationMemory['consolidated'] {
        let materialNT = 0, laborNT = 0, equipmentNT = 0;
        let materialT = 0, laborT = 0, equipmentT = 0;

        const flatLines = this.flatten(lines);

        for (const line of flatLines) {
            if (line.itemType !== 'insumo') continue; // only count leaf nodes

            switch (line.costCategory) {
                case 'material':
                    materialNT += line.subtotalNotTaxed;
                    materialT += line.subtotalTaxed;
                    break;
                case 'mao_de_obra':
                    laborNT += line.subtotalNotTaxed;
                    laborT += line.subtotalTaxed;
                    break;
                case 'equipamento':
                    equipmentNT += line.subtotalNotTaxed;
                    equipmentT += line.subtotalTaxed;
                    break;
            }
        }

        return {
            totalNotTaxed: this.round(materialNT + laborNT + equipmentNT),
            totalTaxed: this.round(materialT + laborT + equipmentT),
            materialCost: this.round(taxRegime === 'desonerado' ? materialT : materialNT),
            laborCost: this.round(taxRegime === 'desonerado' ? laborT : laborNT),
            equipmentCost: this.round(taxRegime === 'desonerado' ? equipmentT : equipmentNT),
        };
    }

    // Flatten tree keeping coefficient multiplication
    private flatten(lines: CalculationLine[], parentCoef = 1): CalculationLine[] {
        const result: CalculationLine[] = [];
        for (const line of lines) {
            if (line.itemType === 'insumo') {
                result.push({
                    ...line,
                    subtotalNotTaxed: this.round(line.unitPriceNotTaxed * line.coefficient * parentCoef),
                    subtotalTaxed: this.round(line.unitPriceTaxed * line.coefficient * parentCoef),
                });
            } else if (line.children?.length) {
                result.push(...this.flatten(line.children, parentCoef * line.coefficient));
            }
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════════════
    // CÁLCULO EM LOTE — Várias composições de uma vez
    // ═══════════════════════════════════════════════════════════════

    async calculateBatch(
        codes: string[],
        state: string,
        options?: { referenceId?: string; taxRegime?: 'desonerado' | 'nao_desonerado' },
    ): Promise<{ results: CalculationMemory[]; errors: Array<{ code: string; error: string }> }> {
        const results: CalculationMemory[] = [];
        const errors: Array<{ code: string; error: string }> = [];

        for (const code of codes) {
            try {
                const result = await this.calculate(code, state, options);
                results.push(result);
            } catch (err) {
                errors.push({ code, error: err.message });
            }
        }

        return { results, errors };
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════

    private async findComposition(codeOrId: string) {
        // Try by code first, then by UUID
        const byCode = await this.compositionRepo.findOne({ where: { code: codeOrId } });
        if (byCode) return byCode;
        try {
            return await this.compositionRepo.findOne({ where: { id: codeOrId } });
        } catch {
            return null;
        }
    }

    private round(value: number): number {
        return Math.round(value * 100) / 100;
    }
}
