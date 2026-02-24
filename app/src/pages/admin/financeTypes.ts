// ─── Finance Simulator — Types ────────────────────────────────────────────────

// ─── Formas de Pagamento da Entrada ──────────────────────────────────────────
export type EntryPaymentMethod = 'pix' | 'cartao_vista' | 'cartao_parcelado' | 'cheque' | 'boleto';

export interface EntryPaymentSlice {
    method: EntryPaymentMethod;
    amount: number;       // valor bruto informado pelo operador
    taxa: number;         // taxa % desta forma (0 = PIX)
    parcelasCartao?: number; // se cartão parcelado, quantas parcelas
}

export const PAYMENT_METHOD_LABELS: Record<EntryPaymentMethod, string> = {
    pix: 'PIX / Transferência',
    cartao_vista: 'Cartão à Vista',
    cartao_parcelado: 'Cartão Parcelado',
    cheque: 'Cheque',
    boleto: 'Boleto',
};

export const DEFAULT_TAXES: Record<EntryPaymentMethod, number> = {
    pix: 0,
    cartao_vista: 2.5,
    cartao_parcelado: 12.0,
    cheque: 1.5,
    boleto: 2.0,
};

// ─── SimInputs (expandido) ───────────────────────────────────────────────────
export interface SimInputs {
    serviceDescription: string;
    // Custos
    custoImediato: number;       // custo que PRECISA ser coberto ANTES de iniciar
    custoTotal: number;          // custo total do projeto (inclui custoImediato)
    profitMargin: number;
    quantity: number;
    // Índice
    correctionIndex: 'IPCA' | 'CDI' | 'SELIC' | 'fixed';
    customRate: number;
    // Condições
    atSightDiscount: number;
    leasingSpread: number;
    customEntry: number;
    customInstallments: number;
    // Composição de entrada
    entryPayments: EntryPaymentSlice[];
    // Antecipação
    parcelasAntecipadas: number;
    descontoAntecipacao: number;
    // Intercaladas
    intercaladaEnabled: boolean;
    intercaladaValor: number;
    intercaladaMeses: string;
    intercaladaDescontoIndice: number;
    // Margem e Capacidade
    margemMinima: number;
    capacidadeEnabled: boolean;
    capacidadeMaxParcela: number;
    capacidadeCartao: boolean;
    capacidadeTaxaCartao: number;
    capacidadeIntercalada: number;
    // Perfil do Cliente (Recomendação)
    perfilEnabled: boolean;
    perfilParcelasDesejadas: number;
    perfilOrcamentoMensal: number;
    perfilEntradaDisponivel: number;
    perfilPrefereCartao: boolean;
    // Motor Reverso
    reversoEnabled: boolean;
    reversoMaxParcela: number;
    reversoEntradaDisponivel: number;
    reversoAceitaIntercaladas: boolean;
    // Score Bilateral
    scorePesoCliente: number;  // 0-100, default 50 (50/50)
}

// ─── Cash Flow ───────────────────────────────────────────────────────────────
export interface CashFlowRow {
    month: number;
    value: number;
    cumulative: number;
}

// ─── Sensibilidade ───────────────────────────────────────────────────────────
export interface SensitivityScenario {
    label: string;
    indexMultiplier: number;  // 1.3 = otimista, 1.0 = base, 0.7 = pessimista
    totalProfit: number;
    effectiveMargin: number;
}

// ─── Reajuste Anual ──────────────────────────────────────────────────────────
export interface AnnualBlock {
    yearStart: number;  // mês início (1, 13, 25...)
    yearEnd: number;    // mês fim (12, 24, 36...)
    installmentAmount: number;
    monthlyRate: number;
}

// ─── Condição Gerada ─────────────────────────────────────────────────────────
export type ConditionType = 'avista' | 'entrada' | 'total' | 'leasing' | 'personalizado' | 'capacidade' | 'antecipacao';

export interface Condition {
    id: string;
    type: ConditionType;
    label: string;
    commercialName: string;   // nome comercial para visão do cliente
    detail: string;
    entry: number;
    entryLiquido: number;     // entrada líquida após taxas
    entryBreakdown?: EntryPaymentSlice[]; // composição mista
    installmentAmount: number;
    installments: number;
    frequency: number;        // 1=mensal, 2=bimestral, 3=trimestral
    totalClient: number;
    // Internal
    costRecovered: number;
    totalProfit: number;
    immediateProfit: number;
    deferredProfit: number;
    effectiveMargin: number;
    correctionAmount: number;
    cashFlow: CashFlowRow[];
    // Extras
    intercaladaExtra?: { month: number; value: number }[];
    // Reajuste anual (contratos >12m)
    annualBlocks?: AnnualBlock[];
    // Sensibilidade
    sensitivity?: SensitivityScenario[];
    // Score bilateral
    bilateralScore?: BilateralScore;
    // Tags visuais
    tags?: ConditionTag[];
}

// ─── Score Bilateral ─────────────────────────────────────────────────────────
export interface BilateralScore {
    scoreCliente: number;
    scorePrestador: number;
    scoreTotal: number;
    pesoCliente: number;   // 0–1
    reasons: string[];
}

// ─── Tags visuais ────────────────────────────────────────────────────────────
export type ConditionTagType = 'menor_parcela' | 'maior_margem' | 'equilibrio' | 'menor_prazo' | 'menor_custo';

export interface ConditionTag {
    type: ConditionTagType;
    label: string;
    emoji: string;
}

export const TAG_CONFIG: Record<ConditionTagType, { label: string; emoji: string }> = {
    menor_parcela: { label: 'Menor Parcela', emoji: '🏷️' },
    maior_margem: { label: 'Maior Margem', emoji: '📈' },
    equilibrio: { label: 'Equilíbrio Ideal', emoji: '⚖️' },
    menor_prazo: { label: 'Menor Prazo', emoji: '⚡' },
    menor_custo: { label: 'Menor Custo Total', emoji: '💰' },
};

// ─── Recomendação ────────────────────────────────────────────────────────────
export interface Recommendation {
    ideal: Condition;
    alternatives: Condition[];
    reasons: string[];
    score: number;
}

// ─── Nomenclatura Comercial ──────────────────────────────────────────────────
export const COMMERCIAL_NAMES: Record<string, string> = {
    avista: 'Condição Premium — Pagamento Integral',
    'entrada_3': 'Plano Ágil — Início Imediato',
    'entrada_6': 'Plano Conforto — Parcelas Reduzidas',
    'entrada_10': 'Plano Facilidade — Máximo Parcelamento',
    'entrada_12': 'Plano Facilidade — Máximo Parcelamento',
    'price_6': 'Plano Flexível — Sem Entrada',
    'price_10': 'Plano Flexível — Sem Entrada',
    'price_12': 'Plano Flexível — Sem Entrada',
    'price_18': 'Plano Estendido — Parcelas Mínimas',
    'price_24': 'Plano Estendido — Parcelas Mínimas',
    leasing: 'Plano Mensal — Investimento Programado',
    personalizado: 'Plano Personalizado — Sob Consulta',
    capacidade: 'Plano Sob Medida — No Seu Ritmo',
    antecipacao: 'Plano Inteligente — Economia por Antecipação',
};

export function getCommercialName(id: string, type: ConditionType): string {
    if (COMMERCIAL_NAMES[id]) return COMMERCIAL_NAMES[id];
    // Fallback por prefixo
    if (id.startsWith('entrada_')) {
        const n = parseInt(id.replace('entrada_', ''));
        if (n <= 3) return 'Plano Ágil — Início Imediato';
        if (n <= 6) return 'Plano Conforto — Parcelas Reduzidas';
        return 'Plano Facilidade — Máximo Parcelamento';
    }
    if (id.startsWith('price_')) {
        const n = parseInt(id.replace('price_', ''));
        return n <= 12 ? 'Plano Flexível — Sem Entrada' : 'Plano Estendido — Parcelas Mínimas';
    }
    if (id.startsWith('leasing_')) return 'Plano Mensal — Investimento Programado';
    if (id.startsWith('cap_')) {
        if (id.includes('cartao')) return 'Plano Cartão — Parcelamento Inteligente';
        return 'Plano Sob Medida — No Seu Ritmo';
    }
    if (id.startsWith('antec_')) return 'Plano Inteligente — Economia por Antecipação';
    if (id.startsWith('rev_')) return 'Plano Sob Medida — No Seu Ritmo';
    // Generic fallback
    return COMMERCIAL_NAMES[type] || 'Condição Especial';
}

// ─── Constantes ──────────────────────────────────────────────────────────────
export const INDEX_RATES: Record<string, number> = {
    IPCA: 0.38,
    CDI: 0.87,
    SELIC: 0.87,
};

export const INDEX_DATES: Record<string, string> = {
    IPCA: 'Jan/2026',
    CDI: 'Fev/2026',
    SELIC: 'Fev/2026',
};

// ─── Formato BR ──────────────────────────────────────────────────────────────
export const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
