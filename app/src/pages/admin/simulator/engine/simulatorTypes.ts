// ─── Simulator v2 — Unified Types ────────────────────────────────────────────

// ─── Wizard Input (o que o operador preenche) ────────────────────────────────
export interface WizardInput {
  // Etapa 1 — Dados do Serviço
  serviceDescription: string;
  proposalValue: number;        // valor total da proposta
  immediateCost: number;        // custo de mobilização
  totalCost: number;            // custo total do projeto
  minMargin: number;            // margem mínima aceitável (%)
  maxTerm: number;              // prazo máximo aceitável (meses)

  // Etapa 1 — Parâmetros Financeiros
  correctionIndex: 'IPCA' | 'CDI' | 'SELIC' | 'fixed'; // índice de correção
  customRate?: number;          // taxa fixa customizada (se index='fixed')
  cardMachineRate: number;      // taxa da maquininha (%)
  atSightDiscount: number;      // desconto à vista (%)

  // Etapa 2 — Perfil do Cliente
  clientName?: string;
  monthlyCapacity?: number;     // capacidade mensal do cliente
  availableEntry?: number;      // entrada disponível
  desiredInstallments?: number; // parcelas desejadas
  clientProfile: ClientProfile; // perfil selecionado ou 'auto'
  preferredPayment?: PaymentPreference;
  entryMethod?: 'pix' | 'credit_card' | 'mixed'; // como paga a entrada
  cardEntryAmount?: number;     // valor da entrada no cartão (quando mixed)
  notes?: string;
}

export type ClientProfile =
  | 'auto'                // sistema decide
  | 'low_installment'     // quer parcela baixa
  | 'low_total'           // quer pagar menos no total
  | 'fast_start'          // quer começar rápido
  | 'predictability'      // quer previsibilidade
  ;

export type PaymentPreference =
  | 'any'
  | 'pix'
  | 'credit_card'
  | 'boleto'
  | 'mixed'
  ;

// ─── Profile Weights ─────────────────────────────────────────────────────────
export const PROFILE_WEIGHTS: Record<ClientProfile, ScoreWeights> = {
  auto:             { closing: 0.40, cash: 0.35, profit: 0.25 },
  low_installment:  { closing: 0.55, cash: 0.25, profit: 0.20 },
  low_total:        { closing: 0.30, cash: 0.30, profit: 0.40 },
  fast_start:       { closing: 0.40, cash: 0.45, profit: 0.15 },
  predictability:   { closing: 0.35, cash: 0.35, profit: 0.30 },
};

export interface ScoreWeights {
  closing: number;
  cash: number;
  profit: number;
}

// ─── Condição Avaliada (saída do motor) ──────────────────────────────────────
// ─── Score Classification ────────────────────────────────────────────────────
export type ScoreClassification = 'excellent' | 'recommended' | 'acceptable' | 'attention' | 'not_recommended';

export function getScoreClassification(score: number): ScoreClassification {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'recommended';
  if (score >= 60) return 'acceptable';
  if (score >= 40) return 'attention';
  return 'not_recommended';
}

export function getScoreLabel(classification: ScoreClassification): string {
  switch (classification) {
    case 'excellent': return 'Excelente';
    case 'recommended': return 'Recomendada';
    case 'acceptable': return 'Aceitável';
    case 'attention': return 'Atenção';
    case 'not_recommended': return 'Não Recomendada';
  }
}

export function getScoreEmoji(classification: ScoreClassification): string {
  switch (classification) {
    case 'excellent': return '🏆';
    case 'recommended': return '⭐';
    case 'acceptable': return '✅';
    case 'attention': return '⚠️';
    case 'not_recommended': return '🔴';
  }
}

export function getScoreColor(classification: ScoreClassification): string {
  switch (classification) {
    case 'excellent': return '#fbbf24';   // gold
    case 'recommended': return '#22c55e'; // green
    case 'acceptable': return '#3b82f6';  // blue
    case 'attention': return '#eab308';   // yellow
    case 'not_recommended': return '#ef4444'; // red
  }
}

// ─── Delay Impact ────────────────────────────────────────────────────────────
export interface DelayScenario {
  realMargin: number;           // margem real após atraso (%)
  cashGap: number;              // "buraco" de caixa durante o atraso (R$)
  marginLoss: number;           // perda de margem vs sem atraso (pontos percentuais)
}

export interface DelayImpact {
  delay1m: DelayScenario;
  delay2m: DelayScenario;
  delay3m: DelayScenario;
  maxSafeDelay: number;         // máximo de meses de atraso sem perder margem mínima
}

// ─── Condição Avaliada (saída do motor) ──────────────────────────────────────
export interface EvaluatedCondition {
  id: string;
  type: ConditionType;
  label: string;
  commercialName: string;
  detail: string;

  // Dados visíveis ao cliente
  entry: number;
  installmentAmount: number;
  installments: number;
  frequency: number;            // 1=mensal, 2=bimestral...
  totalClient: number;

  // Dados internos (só visão interna)
  costRecovered: number;
  totalProfit: number;
  immediateProfit: number;
  deferredProfit: number;
  effectiveMargin: number;      // margem nominal %
  realMargin: number;           // margem real (ajustada NPV) %
  correctionAmount: number;

  // Scores (0-100)
  closingScore: number;
  cashScore: number;
  profitScore: number;
  attractivenessScore: number;  // score de atratividade comercial (0-100)
  finalScore: number;

  // Classificação do score
  scoreLabel: ScoreClassification;

  // Taxa interna de retorno
  irrMonthly: number;           // IRR mensal (%)
  irrAnnual: number;            // IRR anual equivalente (%)

  // Risco
  riskLevel: RiskLevel;
  riskScore: number;            // 0-100 (100 = mais seguro)
  defaultRisk: number;          // % estimado de inadimplência
  liquidityScore: number;       // 0-100
  coverageRatio: number;        // entrada / custoImediato
  paybackMonth: number;         // mês em que recupera o custo
  avgReceivingDays: number;     // prazo médio de recebimento

  // Simulação de atraso
  delayImpact: DelayImpact;

  // Status
  status: ConditionStatus;
  blocked: boolean;
  blockReason?: string;

  // Alertas
  alerts: Alert[];

  // Cashflow
  cashFlow: CashFlowRow[];

  // Tags
  tags: ConditionTag[];
}

export type ConditionType = 'avista' | 'entrada' | 'total' | 'leasing' | 'personalizado' | 'capacidade' | 'antecipacao';

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type ConditionStatus = 'recommended' | 'acceptable' | 'attention' | 'blocked';

export interface Alert {
  type: 'success' | 'warning' | 'danger';
  icon: string;
  message: string;
}

export interface ConditionTag {
  type: 'recommended' | 'best_closing' | 'best_margin' | 'fastest' | 'cheapest';
  label: string;
  emoji: string;
}

export interface CashFlowRow {
  month: number;
  value: number;
  cumulative: number;
}

// ─── Resultado Final (saída para o wizard) ───────────────────────────────────
export interface SimulatorResult {
  recommended: EvaluatedCondition;          // ⭐ Melhor equilíbrio
  bestForClosing: EvaluatedCondition;       // 🎯 Melhor p/ fechar
  bestForMargin: EvaluatedCondition;        // 🛡️ Melhor p/ margem
  alternatives: EvaluatedCondition[];       // Mais opções viáveis
  blockedCount: number;                     // Quantas condições foram eliminadas
  detectedProfile: ClientProfile;           // Perfil detectado automaticamente
  summary: ResultSummary;
  /** Mapa conditionId → explicação contextual (gerado pelo structuringRankBooster) */
  explanations?: Map<string, ConditionExplanation>;
}

/** Explicação detalhada de uma condição (gerada pelo booster) */
export interface ConditionExplanation {
  recommendation: string;
  financialSummary: string;
  immediateReceipt: string;
  financedSummary: string;
  flexibilityCost: string;
  blockExplanation?: string;
}

export interface ResultSummary {
  basePrice: number;
  grossProfit: number;
  totalConditionsGenerated: number;
  totalViable: number;
  totalBlocked: number;
  bestMarginAvailable: number;
  worstMarginAvailable: number;
}

// ─── Security Level ──────────────────────────────────────────────────────────
export type SecurityLevel = 'very_high' | 'high' | 'medium' | 'low';

export function getSecurityLevel(score: number): SecurityLevel {
  if (score >= 80) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function getSecurityLabel(level: SecurityLevel): string {
  switch (level) {
    case 'very_high': return 'Muito Alta';
    case 'high': return 'Alta';
    case 'medium': return 'Média';
    case 'low': return 'Baixa';
  }
}

export function getSecurityColor(level: SecurityLevel): string {
  switch (level) {
    case 'very_high': return '#22c55e';
    case 'high': return '#84cc16';
    case 'medium': return '#eab308';
    case 'low': return '#f97316';
  }
}

// ─── Formato BR ──────────────────────────────────────────────────────────────
export const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
