import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ServiceRule, ServiceBand } from './service-rule.entity';
import { CompanyFinancials } from './company-financials.entity';

// ════════════════════════════════════════════════════════════════
// PARAMETRIC ENGINE — Motor de Cálculo Inteligente
// Detecta tipo de serviço → Extrai parâmetro → Calcula custo
// com composição de preço: SINAPI + Encargos + BDI + Lucro
// ════════════════════════════════════════════════════════════════

export interface ProfessionalCalc {
    code: string;
    label: string;
    baseCostHour: number;       // SINAPI
    encargosPercent: number;
    encargosValue: number;
    realCostHour: number;       // base + encargos
    hours: number;
    subtotal: number;           // realCost × hours
}

export interface ParametricResult {
    // Detecção
    ruleId: string | null;
    ruleName: string;
    detectedParameter: string | null;
    parameterValue: number | null;
    bandLabel: string | null;
    confidence: 'alta' | 'media' | 'manual' | 'sinapi';
    reasoning: string;

    // Composição de Custo
    professional: ProfessionalCalc | null;
    helper: ProfessionalCalc | null;
    laborCostDirect: number;        // MO direta (prof + ajudante)

    // Composição de Preço (com BDI)
    bdiComposition: {
        adminCentral: number;
        seguro: number;
        risco: number;
        despesasFinanceiras: number;
        lucro: number;
        impostos: number;
        bdiPercent: number;
        bdiValue: number;
    };
    laborCostWithBdi: number;       // MO com BDI = preço de venda

    // Resultado Final
    suggestedUnitCost: number;      // Preço sugerido por unidade
}

@Injectable()
export class ParametricEngineService {
    private readonly logger = new Logger(ParametricEngineService.name);
    private rulesCache: ServiceRule[] = [];
    private financialsCache: CompanyFinancials | null = null;
    private cacheExpiry = 0;

    constructor(
        @InjectRepository(ServiceRule)
        private ruleRepo: Repository<ServiceRule>,
        @InjectRepository(CompanyFinancials)
        private financialsRepo: Repository<CompanyFinancials>,
        private dataSource: DataSource,
    ) {}

    // ═══════════════════════════════════════════════════════════
    // ANALYZE — Entry point: analisa descrição e retorna resultado
    // ═══════════════════════════════════════════════════════════

    async analyze(description: string, state: string): Promise<ParametricResult> {
        const rules = await this.getActiveRules();
        const financials = await this.getFinancials();

        // 1. Detectar regra
        const match = this.detectRule(description, rules);

        if (!match) {
            return this.noRuleResult(description);
        }

        const { rule, paramValue } = match;

        // 2. Encontrar faixa
        const band = this.findBand(rule, paramValue);

        // 3. Calcular MO
        const professional = await this.calculateProfessionalCost(
            rule.professionalCode, rule.professionalLabel || 'Profissional',
            band?.laborHours || 0, state, financials,
        );

        const helper = rule.helperCode ? await this.calculateProfessionalCost(
            rule.helperCode, rule.helperLabel || 'Ajudante',
            band?.helperHours || 0, state, financials,
        ) : null;

        const laborCostDirect = (professional?.subtotal || 0) + (helper?.subtotal || 0);

        // 4. Calcular BDI
        const bdiComp = this.calculateBdi(financials, rule);
        const bdiValue = laborCostDirect * bdiComp.bdiPercent / 100;
        const laborCostWithBdi = laborCostDirect + bdiValue;

        // 5. Construir reasoning
        const paramText = paramValue !== null ? `${paramValue} ${rule.parameterName}` : 'detectado';
        const bandText = band ? `Faixa ${band.label} (${band.minValue}-${band.maxValue})` : 'sem faixa';
        const reasoning = `Regra "${rule.name}" → ${paramText} → ${bandText}. ` +
            `${rule.professionalLabel}: ${band?.laborHours || 0}h × R$${professional?.realCostHour?.toFixed(2) || '0'}. ` +
            `BDI ${bdiComp.bdiPercent.toFixed(1)}%.`;

        return {
            ruleId: rule.id,
            ruleName: rule.name,
            detectedParameter: paramValue !== null ? `${paramValue} ${rule.parameterName}` : null,
            parameterValue: paramValue,
            bandLabel: band?.label || null,
            confidence: paramValue !== null && band ? 'alta' : 'media',
            reasoning,
            professional,
            helper,
            laborCostDirect,
            bdiComposition: { ...bdiComp, bdiValue },
            laborCostWithBdi,
            suggestedUnitCost: laborCostWithBdi,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // DETECTAR REGRA — Verifica keywords e exclui falsos positivos
    // ═══════════════════════════════════════════════════════════

    private detectRule(description: string, rules: ServiceRule[]): { rule: ServiceRule; paramValue: number | null } | null {
        const descUpper = description.toUpperCase();

        for (const rule of rules) {
            // Todas as keywords devem existir
            const allKeywordsMatch = rule.keywords.every(kw => descUpper.includes(kw.toUpperCase()));
            if (!allKeywordsMatch) continue;

            // Nenhuma keyword de exclusão pode existir
            const anyExcluded = (rule.excludeKeywords || []).some(kw => descUpper.includes(kw.toUpperCase()));
            if (anyExcluded) continue;

            // Extrair parâmetro numérico
            let paramValue: number | null = null;
            if (rule.parameterRegex) {
                try {
                    const regex = new RegExp(rule.parameterRegex, 'i');
                    const match = description.match(regex);
                    if (match && match[1]) {
                        paramValue = parseInt(match[1], 10);
                    }
                } catch (e) {
                    this.logger.warn(`Regex error in rule ${rule.name}: ${e.message}`);
                }
            }

            return { rule, paramValue };
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════
    // FAIXA — Encontra a faixa de complexidade
    // ═══════════════════════════════════════════════════════════

    private findBand(rule: ServiceRule, paramValue: number | null): ServiceBand | null {
        if (!rule.bands?.length) return null;
        if (paramValue === null) {
            // Sem parâmetro detectado → usa primeira faixa como padrão
            return rule.bands[0];
        }

        // Encontra a faixa que contém o valor
        const band = rule.bands.find(b => paramValue >= b.minValue && paramValue <= b.maxValue);
        if (band) return band;

        // Se acima de todas as faixas, usa a última
        const sorted = [...rule.bands].sort((a, b) => b.maxValue - a.maxValue);
        if (paramValue > sorted[0]?.maxValue) return sorted[0];

        // Se abaixo, usa a primeira
        return rule.bands[0];
    }

    // ═══════════════════════════════════════════════════════════
    // CUSTO DO PROFISSIONAL — SINAPI + Encargos
    // ═══════════════════════════════════════════════════════════

    private async calculateProfessionalCost(
        sinapiCode: string, label: string, hours: number,
        state: string, financials: CompanyFinancials,
    ): Promise<ProfessionalCalc> {
        if (!sinapiCode || hours <= 0) {
            return { code: sinapiCode, label, baseCostHour: 0, encargosPercent: 0, encargosValue: 0, realCostHour: 0, hours: 0, subtotal: 0 };
        }

        // Buscar preço/hora SINAPI
        const priceRows = await this.dataSource.query(`
            SELECT ip."priceNotTaxed"
            FROM sinapi_input_prices ip
            JOIN sinapi_inputs i ON i.id = ip."inputId"
            WHERE i.code = $1
            AND ip."referenceId" = (SELECT id FROM sinapi_references ORDER BY "createdAt" DESC LIMIT 1)
            AND ip.state = $2
            LIMIT 1
        `, [sinapiCode, state]);

        const baseCostHour = Number(priceRows[0]?.priceNotTaxed) || 0;
        const encargosPercent = Number(financials.encargosPercent) || 0;
        const encargosValue = baseCostHour * encargosPercent / 100;
        const realCostHour = baseCostHour + encargosValue;
        const subtotal = realCostHour * hours;

        return {
            code: sinapiCode, label, baseCostHour,
            encargosPercent, encargosValue, realCostHour,
            hours, subtotal,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // BDI — Composição detalhada (metodologia TCU/DNIT)
    // ═══════════════════════════════════════════════════════════

    private calculateBdi(financials: CompanyFinancials, rule?: ServiceRule) {
        const adminCentral = Number(financials.adminCentralPercent) || 0;
        const seguro = Number(financials.seguroPercent) || 0;
        const risco = Number(financials.riscoPercent) || 0;
        const despesasFinanceiras = Number(financials.despesasFinanceirasPercent) || 0;
        const lucro = rule?.customProfitPercent != null
            ? Number(rule.customProfitPercent)
            : Number(financials.lucroPercent) || 0;
        const impostos = (Number(financials.pisCofinPercent) || 0) +
                         (Number(financials.issPercent) || 0) +
                         (Number(financials.icmsPercent) || 0);

        // Fórmula BDI = (1+AC)(1+S)(1+R)(1+DF)(1+L) / (1-I) - 1
        // Simplificado para soma direta (mais intuitivo para o usuário)
        const bdiPercent = adminCentral + seguro + risco + despesasFinanceiras + lucro + impostos;

        return { adminCentral, seguro, risco, despesasFinanceiras, lucro, impostos, bdiPercent, bdiValue: 0 };
    }

    // ═══════════════════════════════════════════════════════════
    // SEM REGRA — Resultado quando nenhuma regra casa
    // ═══════════════════════════════════════════════════════════

    private noRuleResult(description: string): ParametricResult {
        return {
            ruleId: null,
            ruleName: 'Sem regra',
            detectedParameter: null,
            parameterValue: null,
            bandLabel: null,
            confidence: 'sinapi',
            reasoning: 'Nenhuma regra de serviço detectada. Usando coeficiente original SINAPI.',
            professional: null,
            helper: null,
            laborCostDirect: 0,
            bdiComposition: { adminCentral: 0, seguro: 0, risco: 0, despesasFinanceiras: 0, lucro: 0, impostos: 0, bdiPercent: 0, bdiValue: 0 },
            laborCostWithBdi: 0,
            suggestedUnitCost: 0,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // CACHE — Evita queries repetidas
    // ═══════════════════════════════════════════════════════════

    private async getActiveRules(): Promise<ServiceRule[]> {
        if (Date.now() < this.cacheExpiry && this.rulesCache.length > 0) return this.rulesCache;
        this.rulesCache = await this.ruleRepo.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
        this.cacheExpiry = Date.now() + 60_000; // 1 min cache
        return this.rulesCache;
    }

    private async getFinancials(): Promise<CompanyFinancials> {
        if (this.financialsCache && Date.now() < this.cacheExpiry) return this.financialsCache;
        let fin = await this.financialsRepo.findOne({ where: { isActive: true }, order: { createdAt: 'DESC' } });
        if (!fin) {
            // Criar padrão
            fin = this.financialsRepo.create({
                profileName: 'Padrão',
                encargosPercent: 68.47,
                adminCentralPercent: 4.00,
                seguroPercent: 0.80,
                riscoPercent: 1.20,
                despesasFinanceirasPercent: 1.40,
                lucroPercent: 8.00,
                pisCofinPercent: 3.65,
                issPercent: 5.00,
                categoryMargins: { eletrica: 40, hidraulica: 35, civil: 30, equipamento: 25, geral: 30 },
            });
            fin = await this.financialsRepo.save(fin);
            this.logger.log('Created default CompanyFinancials');
        }
        this.financialsCache = fin;
        return fin;
    }

    invalidateCache() {
        this.cacheExpiry = 0;
        this.financialsCache = null;
    }

    // ═══════════════════════════════════════════════════════════
    // SEED — Regras padrão iniciais
    // ═══════════════════════════════════════════════════════════

    async seedDefaultRules() {
        const count = await this.ruleRepo.count();
        if (count > 0) return;

        const defaults: Partial<ServiceRule>[] = [
            {
                name: 'Tomada de Embutir',
                category: 'eletrica',
                keywords: ['TOMADA', 'EMBUTIR'],
                excludeKeywords: ['COLAR', 'PISO', 'CAIXA', 'QUEBRA', 'RJ45'],
                parameterName: 'módulos',
                parameterRegex: '\\((\\d+)\\s*MÓDULO',
                professionalCode: '2436', professionalLabel: 'Eletricista',
                helperCode: '247', helperLabel: 'Ajudante de Eletricista',
                bands: [
                    { label: 'Simples', minValue: 1, maxValue: 2, laborHours: 0.3, helperHours: 0.15, notes: '1-2 módulos: instalação rápida' },
                    { label: 'Média', minValue: 3, maxValue: 4, laborHours: 0.5, helperHours: 0.25, notes: '3-4 módulos: complexidade média' },
                    { label: 'Complexa', minValue: 5, maxValue: 99, laborHours: 0.8, helperHours: 0.4, notes: '5+ módulos: instalação complexa' },
                ],
                sortOrder: 1,
            },
            {
                name: 'Quadro de Distribuição',
                category: 'eletrica',
                keywords: ['QUADRO', 'DISTRIBUIÇÃO'],
                excludeKeywords: ['TELEFONE'],
                parameterName: 'disjuntores',
                parameterRegex: 'PARA\\s+(\\d+)\\s*DISJUNTOR',
                professionalCode: '2436', professionalLabel: 'Eletricista',
                helperCode: '247', helperLabel: 'Ajudante de Eletricista',
                customProfitPercent: 50,
                bands: [
                    { label: 'Pequeno', minValue: 1, maxValue: 8, laborHours: 1.5, helperHours: 1.0, notes: 'Até 8 disjuntores' },
                    { label: 'Médio', minValue: 9, maxValue: 18, laborHours: 3.0, helperHours: 2.0, notes: '9-18 disjuntores' },
                    { label: 'Grande', minValue: 19, maxValue: 36, laborHours: 6.0, helperHours: 3.0, notes: '19-36 disjuntores' },
                    { label: 'Industrial', minValue: 37, maxValue: 999, laborHours: 10.0, helperHours: 5.0, notes: '37+ disjuntores: grande porte' },
                ],
                sortOrder: 2,
            },
            {
                name: 'Interruptor de Embutir',
                category: 'eletrica',
                keywords: ['INTERRUPTOR', 'EMBUTIR'],
                excludeKeywords: ['ENERGIA', 'ENTRADA'],
                parameterName: 'módulos',
                parameterRegex: '\\((\\d+)\\s*MÓDULO',
                professionalCode: '2436', professionalLabel: 'Eletricista',
                helperCode: '247', helperLabel: 'Ajudante de Eletricista',
                bands: [
                    { label: 'Simples', minValue: 1, maxValue: 2, laborHours: 0.25, helperHours: 0.12, notes: '1-2 módulos' },
                    { label: 'Média', minValue: 3, maxValue: 4, laborHours: 0.4, helperHours: 0.2, notes: '3-4 módulos' },
                    { label: 'Complexa', minValue: 5, maxValue: 99, laborHours: 0.6, helperHours: 0.3, notes: '5+ módulos' },
                ],
                sortOrder: 3,
            },
            {
                name: 'Eletroduto',
                category: 'eletrica',
                keywords: ['ELETRODUTO'],
                excludeKeywords: ['CURVA', 'CONDULETE', 'LUVA', 'BUCHA'],
                parameterName: 'diâmetro (mm)',
                parameterRegex: 'DN\\s+(\\d+)',
                professionalCode: '2436', professionalLabel: 'Eletricista',
                helperCode: '247', helperLabel: 'Ajudante de Eletricista',
                bands: [
                    { label: 'Fino', minValue: 20, maxValue: 32, laborHours: 0.10, helperHours: 0.05, notes: '20-32mm' },
                    { label: 'Médio', minValue: 33, maxValue: 60, laborHours: 0.15, helperHours: 0.10, notes: '33-60mm' },
                    { label: 'Grosso', minValue: 61, maxValue: 999, laborHours: 0.25, helperHours: 0.15, notes: '61mm+' },
                ],
                sortOrder: 4,
            },
            {
                name: 'Cabo Elétrico',
                category: 'eletrica',
                keywords: ['CABO'],
                excludeKeywords: ['CAIXA', 'QUADRO'],
                parameterName: 'seção (mm²)',
                parameterRegex: '(\\d+(?:,\\d+)?)\\s*MM',
                professionalCode: '2436', professionalLabel: 'Eletricista',
                helperCode: '247', helperLabel: 'Ajudante de Eletricista',
                bands: [
                    { label: 'Fino', minValue: 1, maxValue: 6, laborHours: 0.05, helperHours: 0.03, notes: 'Até 6mm²' },
                    { label: 'Médio', minValue: 7, maxValue: 25, laborHours: 0.08, helperHours: 0.05, notes: '7-25mm²' },
                    { label: 'Grosso', minValue: 26, maxValue: 999, laborHours: 0.15, helperHours: 0.10, notes: '26mm²+' },
                ],
                sortOrder: 5,
            },
            {
                name: 'Luminária',
                category: 'eletrica',
                keywords: ['LUMINÁRIA'],
                excludeKeywords: ['POSTE'],
                parameterName: 'tipo',
                parameterRegex: null,
                professionalCode: '2436', professionalLabel: 'Eletricista',
                helperCode: '247', helperLabel: 'Ajudante de Eletricista',
                bands: [
                    { label: 'Padrão', minValue: 1, maxValue: 999, laborHours: 0.4, helperHours: 0.2, notes: 'Instalação padrão' },
                ],
                sortOrder: 6,
            },
        ];

        for (const rule of defaults) {
            await this.ruleRepo.save(this.ruleRepo.create(rule));
        }

        this.logger.log(`Seeded ${defaults.length} default service rules`);
        this.invalidateCache();
    }
}
