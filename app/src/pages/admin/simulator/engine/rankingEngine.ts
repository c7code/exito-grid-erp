// ─── Ranking Engine ──────────────────────────────────────────────────────────
// Avalia, bloqueia, penaliza, bonifica e seleciona o top 3 de condições.

import type {
  EvaluatedCondition, SimulatorResult, WizardInput, ClientProfile,
  ResultSummary, CashFlowRow,
} from './simulatorTypes';
import { PROFILE_WEIGHTS, getScoreClassification } from './simulatorTypes';
import { classifyProfile } from './profileClassifier';
import {
  calcRealMargin, calcPaybackMonth, calcAvgReceivingDays,
  calcDefaultRisk, calcLiquidityScore, calcCoverageRatio,
  calcRiskScore, calcClosingScore, calcCashScore, calcProfitScore,
  getRiskLevel, calcIRR, irrToAnnual, calcAttractivenessScore, simulateDelay,
} from './riskEngine';
import { generateAlerts } from './alertGenerator';
import { simulate as legacySimulate } from '../../financeEngine';
import type { SimInputs, Condition } from '../../financeTypes';
import { INDEX_RATES } from '../../financeTypes';

// ─── Converter WizardInput → SimInputs legado ───────────────────────────────
function toSimInputs(input: WizardInput): SimInputs {
  const basePrice = input.totalCost / (1 - input.minMargin / 100);

  // Build entry payments based on entry method
  // MARKUP: valor a cobrar = valor desejado / (1 - taxa%)
  const entryAmount = input.availableEntry || input.immediateCost;
  const cardRate = input.cardMachineRate || 4.99;
  let entryPayments: SimInputs['entryPayments'];

  switch (input.entryMethod) {
    case 'credit_card': {
      // Apply markup: charge more so that after fee, we receive the desired net
      const markupAmount = cardRate > 0 && cardRate < 100
        ? entryAmount / (1 - cardRate / 100)
        : entryAmount;
      entryPayments = [{ method: 'cartao_vista' as const, amount: markupAmount, taxa: cardRate }];
      break;
    }
    case 'mixed': {
      const cardDesired = input.cardEntryAmount || 0;
      const pixAmt = Math.max(0, entryAmount - cardDesired);
      const markupCard = cardRate > 0 && cardRate < 100 && cardDesired > 0
        ? cardDesired / (1 - cardRate / 100)
        : cardDesired;
      entryPayments = [];
      if (pixAmt > 0) entryPayments.push({ method: 'pix' as const, amount: pixAmt, taxa: 0 });
      if (markupCard > 0) entryPayments.push({ method: 'cartao_vista' as const, amount: markupCard, taxa: cardRate });
      if (entryPayments.length === 0) entryPayments.push({ method: 'pix' as const, amount: 0, taxa: 0 });
      break;
    }
    default: // 'pix'
      entryPayments = [{ method: 'pix' as const, amount: entryAmount, taxa: 0 }];
  }

  return {
    serviceDescription: input.serviceDescription,
    custoImediato: input.immediateCost,
    custoTotal: input.totalCost,
    profitMargin: input.minMargin,
    quantity: 1,
    correctionIndex: input.correctionIndex || 'CDI',
    customRate: input.customRate ?? 1.0,
    atSightDiscount: input.atSightDiscount ?? 5,
    leasingSpread: 0.5,
    customEntry: entryAmount,
    customInstallments: input.desiredInstallments || 6,
    entryPayments,
    parcelasAntecipadas: 0,
    descontoAntecipacao: 50,
    intercaladaEnabled: false,
    intercaladaValor: 500,
    intercaladaMeses: '6,12',
    intercaladaDescontoIndice: 50,
    margemMinima: input.minMargin,
    capacidadeEnabled: !!input.monthlyCapacity && input.monthlyCapacity > 0,
    capacidadeMaxParcela: input.monthlyCapacity || 500,
    capacidadeCartao: input.preferredPayment === 'credit_card' || input.entryMethod === 'credit_card',
    capacidadeTaxaCartao: cardRate,
    capacidadeIntercalada: 1,
    perfilEnabled: false,
    perfilParcelasDesejadas: input.desiredInstallments || 8,
    perfilOrcamentoMensal: input.monthlyCapacity || 1200,
    perfilEntradaDisponivel: input.availableEntry || basePrice * 0.3,
    perfilPrefereCartao: input.preferredPayment === 'credit_card',
    reversoEnabled: false,
    reversoMaxParcela: input.monthlyCapacity || 1200,
    reversoEntradaDisponivel: input.availableEntry || 5000,
    reversoAceitaIntercaladas: true,
    scorePesoCliente: 50,
  };
}

// ─── Converter Condition legada → EvaluatedCondition ─────────────────────────
function toLegacyCondition(
  c: Condition,
  input: WizardInput,
  minMargin: number,
  monthlyRate: number,
  allTotals: number[],
): EvaluatedCondition {
  const paybackMonth = calcPaybackMonth(c.cashFlow, input.totalCost);
  const avgReceivingDays = calcAvgReceivingDays(c.cashFlow);
  const defaultRisk = calcDefaultRisk(c.installments, c.entry > 0);
  const liquidityScore = calcLiquidityScore(c.entry, c.totalClient, c.installments, paybackMonth);
  const coverageRatio = calcCoverageRatio(c.entry, input.immediateCost);
  const realMargin = calcRealMargin(c.totalClient, input.totalCost, c.cashFlow, monthlyRate);
  const marginSafety = minMargin > 0 ? (c.effectiveMargin - minMargin) / minMargin : 0;
  const riskScore = calcRiskScore(defaultRisk, liquidityScore, coverageRatio, marginSafety);

  const closingScore = calcClosingScore(
    c.installmentAmount,
    input.monthlyCapacity || 0,
    c.entry,
    input.availableEntry || 0,
    c.installments,
    input.desiredInstallments || 0,
    c.totalClient,
    allTotals,
  );

  const cashScore = calcCashScore(coverageRatio, paybackMonth, liquidityScore, c.installments);

  const profitScore = calcProfitScore(
    c.effectiveMargin,
    realMargin,
    minMargin,
    c.correctionAmount,
    c.totalClient,
  );

  // ── Novos cálculos v2 ────────────────────────────────────────────────
  const irrMonthly = calcIRR(c.cashFlow, input.totalCost);
  const irrAnnual = irrToAnnual(irrMonthly);

  const attractivenessScore = calcAttractivenessScore(
    c.installmentAmount,
    input.monthlyCapacity || 0,
    c.entry,
    input.availableEntry || 0,
    c.totalClient,
    allTotals,
    c.installments,
    input.desiredInstallments || 0,
    input.preferredPayment || 'any',
    c.type,
  );

  const delayImpact = simulateDelay(
    c.cashFlow,
    input.totalCost,
    realMargin,
    minMargin,
    monthlyRate,
  );

  const evaluated: EvaluatedCondition = {
    id: c.id,
    type: c.type,
    label: c.label,
    commercialName: c.commercialName,
    detail: c.detail,
    entry: c.entry,
    installmentAmount: c.installmentAmount,
    installments: c.installments,
    frequency: c.frequency,
    totalClient: c.totalClient,
    costRecovered: c.costRecovered,
    totalProfit: c.totalProfit,
    immediateProfit: c.immediateProfit,
    deferredProfit: c.deferredProfit,
    effectiveMargin: c.effectiveMargin,
    realMargin,
    correctionAmount: c.correctionAmount,
    closingScore,
    cashScore,
    profitScore,
    attractivenessScore,
    finalScore: 0, // será calculado depois com pesos
    scoreLabel: 'acceptable', // será atualizado após finalScore
    irrMonthly,
    irrAnnual,
    riskLevel: getRiskLevel(riskScore),
    riskScore,
    defaultRisk,
    liquidityScore,
    coverageRatio,
    paybackMonth,
    avgReceivingDays,
    delayImpact,
    status: 'acceptable',
    blocked: false,
    alerts: [],
    cashFlow: c.cashFlow,
    tags: [],
  };

  return evaluated;
}

// ─── Bloqueios ─────────────────────────────────────────────────────────────────────
function applyBlocks(
  conditions: EvaluatedCondition[],
  input: WizardInput,
): void {
  for (const c of conditions) {
    // Margem abaixo do mínimo absoluto
    if (c.effectiveMargin < input.minMargin && c.type !== 'avista') {
      c.blocked = true;
      c.blockReason = 'Margem abaixo do mínimo aceitável';
      c.status = 'blocked';
      continue;
    }

    // Margem real destruída (<5%)
    if (c.realMargin < 5 && c.type !== 'avista') {
      c.blocked = true;
      c.blockReason = 'Margem real insuficiente (valor do dinheiro no tempo)';
      c.status = 'blocked';
      continue;
    }

    // Prazo acima do máximo
    if (input.maxTerm > 0 && c.installments > input.maxTerm) {
      c.blocked = true;
      c.blockReason = `Prazo de ${c.installments} meses ultrapassa o limite de ${input.maxTerm}`;
      c.status = 'blocked';
      continue;
    }

    // Payback só no final (> 80% do prazo)
    if (c.installments > 0 && c.paybackMonth > c.installments * 0.8) {
      c.blocked = true;
      c.blockReason = 'Custo recuperado muito tarde — risco de descapitalização';
      c.status = 'blocked';
      continue;
    }

    // Entrada não cobre mobilização e não tem parcela (à vista com pouco valor)
    if (c.entry > 0 && c.entry < input.immediateCost * 0.3 && c.installments <= 3) {
      c.blocked = true;
      c.blockReason = 'Entrada insuficiente para cobrir mobilização em prazo curto';
      c.status = 'blocked';
      continue;
    }

    // ── NOVOS BLOQUEIOS: Proteção de Caixa avançada ────────────────────

    // Prazo > 24 meses sem reajuste (não protege contra inflação)
    if (c.installments > 24 && c.correctionAmount <= 0) {
      c.blocked = true;
      c.blockReason = 'Prazo longo sem correção monetária — risco inflacionário';
      c.status = 'blocked';
      continue;
    }

    // Risco alto sem prêmio financeiro (riskScore baixo + margem insuficiente)
    if (c.riskScore < 30 && c.effectiveMargin < input.minMargin * 1.3) {
      c.blocked = true;
      c.blockReason = 'Risco elevado sem prêmio financeiro adequado';
      c.status = 'blocked';
      continue;
    }

    // Exposição de caixa excessiva (payback > 12 + entrada não cobre 50% mobilização)
    if (c.paybackMonth > 12 && c.coverageRatio < 0.5) {
      c.blocked = true;
      c.blockReason = 'Exposição de caixa excessiva — entrada insuficiente para o prazo';
      c.status = 'blocked';
      continue;
    }

    // Parcela acima da capacidade declarada do cliente (> 130%)
    if (input.monthlyCapacity && input.monthlyCapacity > 0 && c.installmentAmount > 0) {
      if (c.installmentAmount > input.monthlyCapacity * 1.3) {
        c.blocked = true;
        c.blockReason = 'Parcela ultrapassa a capacidade mensal declarada do cliente';
        c.status = 'blocked';
        continue;
      }
    }
  }
}

// ─── Penalizações e Bonificações ─────────────────────────────────────────────
function applyAdjustments(conditions: EvaluatedCondition[], input: WizardInput): void {
  for (const c of conditions) {
    if (c.blocked) continue;

    let adjustment = 0;

    // Penalizações
    if (c.installments > 18 && !c.detail.includes('reajuste')) {
      adjustment -= 15;
    }
    if (c.entry > 0 && c.entry < input.immediateCost * 0.3) {
      adjustment -= 10;
    }
    if (input.monthlyCapacity && c.installmentAmount > input.monthlyCapacity * 1.1) {
      adjustment -= 10;
    }
    if (c.effectiveMargin < input.minMargin + 5 && c.effectiveMargin >= input.minMargin) {
      adjustment -= 20;
    }
    // Penalização por prazo longo
    if (c.installments > 12) {
      adjustment -= Math.min(15, Math.floor((c.installments - 12) / 6) * 5);
    }

    // Bonificações
    if (c.type === 'avista') {
      adjustment += 20;
    }
    if (c.entry >= input.totalCost) {
      adjustment += 15;
    }
    if (c.paybackMonth <= 3) {
      adjustment += 10;
    }
    if (input.monthlyCapacity && c.installmentAmount <= input.monthlyCapacity * 0.7) {
      adjustment += 10;
    }
    if (c.effectiveMargin >= input.minMargin * 1.5) {
      adjustment += 5;
    }

    // Aplicar ao finalScore como ajuste aditivo
    c.closingScore = Math.max(0, Math.min(100, c.closingScore + (adjustment > 0 ? adjustment * 0.3 : adjustment * 0.5)));
    c.cashScore = Math.max(0, Math.min(100, c.cashScore + (adjustment > 0 ? adjustment * 0.4 : adjustment * 0.3)));
    c.profitScore = Math.max(0, Math.min(100, c.profitScore + (adjustment > 0 ? adjustment * 0.3 : adjustment * 0.2)));
  }
}

// ─── Calcular Final Score com pesos por perfil (recalibrado v2) ────────────
function calcFinalScores(conditions: EvaluatedCondition[], profile: ClientProfile): void {
  const weights = PROFILE_WEIGHTS[profile] || PROFILE_WEIGHTS.auto;

  for (const c of conditions) {
    if (c.blocked) {
      c.finalScore = 0;
      c.scoreLabel = 'not_recommended';
      continue;
    }
    // Score final v2: closing + cash + profit + attractiveness + risco
    // Pesos redistribuídos: closing=30%, cash=20%, profit=20%, attractiveness=15%, risco=15%
    const baseScore =
      c.closingScore * (weights.closing * 0.75) +
      c.cashScore * (weights.cash * 0.75) +
      c.profitScore * (weights.profit * 0.75) +
      c.attractivenessScore * 0.15 +
      c.riskScore * 0.15;

    c.finalScore = Math.min(100, Math.max(0, Math.round(baseScore)));
    c.scoreLabel = getScoreClassification(c.finalScore);
  }
}

// ─── Atribuir Tags ───────────────────────────────────────────────────────────
function assignTags(conditions: EvaluatedCondition[]): void {
  const viable = conditions.filter(c => !c.blocked);
  if (viable.length === 0) return;

  const withInst = viable.filter(c => c.installmentAmount > 0);

  // Menor parcela
  if (withInst.length > 0) {
    const min = withInst.reduce((a, b) => a.installmentAmount < b.installmentAmount ? a : b);
    min.tags.push({ type: 'cheapest', label: 'Menor Parcela', emoji: '🏷️' });
  }

  // Maior margem
  const bestMargin = viable.reduce((a, b) => a.effectiveMargin > b.effectiveMargin ? a : b);
  bestMargin.tags.push({ type: 'best_margin', label: 'Maior Margem', emoji: '📈' });

  // Menor custo total
  const cheapest = viable.reduce((a, b) => a.totalClient < b.totalClient ? a : b);
  cheapest.tags.push({ type: 'cheapest', label: 'Menor Custo', emoji: '💰' });
}

// ─── Atribuir Status ─────────────────────────────────────────────────────────
function assignStatuses(conditions: EvaluatedCondition[], minMargin: number): void {
  for (const c of conditions) {
    if (c.blocked) {
      c.status = 'blocked';
    } else if (c.effectiveMargin >= minMargin * 1.3 && c.riskScore >= 60) {
      c.status = 'recommended';
    } else if (c.effectiveMargin >= minMargin && c.riskScore >= 40) {
      c.status = 'acceptable';
    } else {
      c.status = 'attention';
    }
  }
}

// ─── Selecionar Top 3 ───────────────────────────────────────────────────────
function selectTop3(conditions: EvaluatedCondition[]): {
  recommended: EvaluatedCondition;
  bestForClosing: EvaluatedCondition;
  bestForMargin: EvaluatedCondition;
  alternatives: EvaluatedCondition[];
} {
  const viable = conditions.filter(c => !c.blocked);
  if (viable.length === 0) {
    // Fallback: usar todas as condições, mesmo bloqueadas
    const all = [...conditions].sort((a, b) => b.finalScore - a.finalScore);
    return {
      recommended: all[0],
      bestForClosing: all[Math.min(1, all.length - 1)],
      bestForMargin: all[Math.min(2, all.length - 1)],
      alternatives: all.slice(3),
    };
  }

  viable.sort((a, b) => b.finalScore - a.finalScore);

  const recommended = viable[0];
  recommended.status = 'recommended';
  recommended.tags.push({ type: 'recommended', label: 'Recomendada', emoji: '⭐' });

  // Melhor para fechar: maior closingScore (diferente da recomendada)
  const closingCandidates = viable.filter(c => c.id !== recommended.id).sort((a, b) => b.closingScore - a.closingScore);
  const bestForClosing = closingCandidates[0] || recommended;
  if (bestForClosing.id !== recommended.id) {
    bestForClosing.tags.push({ type: 'best_closing', label: 'Melhor p/ Fechar', emoji: '🎯' });
  }

  // Melhor para margem: maior profitScore (diferente da recomendada e da anterior)
  const marginCandidates = viable.filter(c => c.id !== recommended.id && c.id !== bestForClosing.id).sort((a, b) => b.profitScore - a.profitScore);
  const bestForMargin = marginCandidates[0] || (bestForClosing.id !== recommended.id ? recommended : bestForClosing);
  if (bestForMargin.id !== recommended.id && bestForMargin.id !== bestForClosing.id) {
    bestForMargin.tags.push({ type: 'best_margin', label: 'Melhor p/ Margem', emoji: '🛡️' });
  }

  // Alternativas: restantes viáveis
  const pickedIds = new Set([recommended.id, bestForClosing.id, bestForMargin.id]);
  const alternatives = viable.filter(c => !pickedIds.has(c.id)).slice(0, 4);

  return { recommended, bestForClosing, bestForMargin, alternatives };
}

// ─── Gerar Condições de Negociação ───────────────────────────────────────
// "Cliente pode pagar X por mês" → calcula entrada + parcelas preservando margem
function generateNegotiationConditions(
  input: WizardInput,
  basePrice: number,
  monthlyRate: number,
): EvaluatedCondition[] {
  const capacity = input.monthlyCapacity;
  if (!capacity || capacity <= 0) return [];

  const results: EvaluatedCondition[] = [];
  const minMargin = input.minMargin || 15;
  const maxTerm = input.maxTerm || 36;

  // Testar vários prazos: 6, 10, 12, 18, 24 (filtrado por maxTerm)
  const termOptions = [6, 10, 12, 18, 24].filter(t => t <= maxTerm);

  for (const terms of termOptions) {
    // Total financiado pelas parcelas
    const financed = capacity * terms;
    // Entrada necessária = preço base - financiado
    const entry = Math.max(0, basePrice - financed);

    // Verificar se a entrada é razoável
    if (entry > basePrice * 0.7) continue; // entrada > 70% = inviável

    // Total que o cliente pagará
    const totalClient = entry + financed;

    // Verificar margem
    const effectiveMargin = ((totalClient - input.totalCost) / totalClient) * 100;
    if (effectiveMargin < minMargin) continue;

    // Construir cashflow
    const cashFlow: CashFlowRow[] = [];
    let cumulative = 0;
    if (entry > 0) {
      cumulative += entry;
      cashFlow.push({ month: 0, value: entry, cumulative });
    }
    for (let m = 1; m <= terms; m++) {
      cumulative += capacity;
      cashFlow.push({ month: m, value: capacity, cumulative });
    }

    // Calcular todos os scores
    const paybackMonth = calcPaybackMonth(cashFlow, input.totalCost);
    const avgReceivingDays = calcAvgReceivingDays(cashFlow);
    const defaultRisk = calcDefaultRisk(terms, entry > 0);
    const liquidityScore = calcLiquidityScore(entry, totalClient, terms, paybackMonth);
    const coverageRatio = calcCoverageRatio(entry, input.immediateCost);
    const realMargin = calcRealMargin(totalClient, input.totalCost, cashFlow, monthlyRate);
    const marginSafety = minMargin > 0 ? (effectiveMargin - minMargin) / minMargin : 0;
    const riskScore = calcRiskScore(defaultRisk, liquidityScore, coverageRatio, marginSafety);
    const irrMonthly = calcIRR(cashFlow, input.totalCost);
    const irrAnnual = irrToAnnual(irrMonthly);

    const allTotals = [totalClient]; // Para attractiveness, será recalculado depois

    const attractivenessScore = calcAttractivenessScore(
      capacity, capacity, entry, input.availableEntry || 0,
      totalClient, allTotals, terms, input.desiredInstallments || 0,
      input.preferredPayment || 'any', 'entrada',
    );

    const delayImpact = simulateDelay(cashFlow, input.totalCost, realMargin, minMargin, monthlyRate);

    const condition: EvaluatedCondition = {
      id: `neg-${terms}x-${capacity}`,
      type: 'personalizado',
      label: `Negociação ${terms}x`,
      commercialName: entry > 0
        ? `Negociação: Entrada + ${terms}x de R$ ${capacity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : `Negociação: ${terms}x de R$ ${capacity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      detail: `Calculado para parcela de R$ ${capacity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
      entry,
      installmentAmount: capacity,
      installments: terms,
      frequency: 1,
      totalClient,
      costRecovered: Math.min(totalClient, input.totalCost),
      totalProfit: totalClient - input.totalCost,
      immediateProfit: entry > 0 ? Math.max(0, entry - input.immediateCost) : 0,
      deferredProfit: totalClient - input.totalCost - Math.max(0, entry - input.immediateCost),
      effectiveMargin,
      realMargin,
      correctionAmount: 0,
      closingScore: calcClosingScore(
        capacity, capacity, entry, input.availableEntry || 0,
        terms, input.desiredInstallments || 0, totalClient, allTotals,
      ),
      cashScore: calcCashScore(coverageRatio, paybackMonth, liquidityScore, terms),
      profitScore: calcProfitScore(effectiveMargin, realMargin, minMargin, 0, totalClient),
      attractivenessScore,
      finalScore: 0,
      scoreLabel: 'acceptable',
      irrMonthly,
      irrAnnual,
      riskLevel: getRiskLevel(riskScore),
      riskScore,
      defaultRisk,
      liquidityScore,
      coverageRatio,
      paybackMonth,
      avgReceivingDays,
      delayImpact,
      status: 'acceptable',
      blocked: false,
      alerts: [],
      cashFlow,
      tags: [{ type: 'best_closing', label: 'Negociação', emoji: '🤝' }],
    };

    results.push(condition);
  }

  return results;
}

// ─── MAIN: runSimulation ───────────────────────────────────────────────────────
export function runSimulation(input: WizardInput): SimulatorResult {
  const monthlyRate = INDEX_RATES['CDI'] || 0.87;

  // 0. Normalizar inputs — aplicar defaults quando operador não preenche
  const normalizedInput: WizardInput = {
    ...input,
    minMargin: input.minMargin || 15,
    maxTerm: input.maxTerm || 36,
  };

  // 1. Detectar perfil do cliente
  const detectedProfile = classifyProfile(normalizedInput);

  // 2. Converter para formato legado e simular
  const simInputs = toSimInputs(normalizedInput);
  const rawConditions = legacySimulate(simInputs);

  // 3. Gerar condições de negociação (se monthlyCapacity informada)
  const basePrice = normalizedInput.totalCost / (1 - normalizedInput.minMargin / 100);
  const negotiationConditions = generateNegotiationConditions(normalizedInput, basePrice, monthlyRate);

  // 4. Coletar todos os totais para comparação
  const allTotals = [...rawConditions.map(c => c.totalClient), ...negotiationConditions.map(c => c.totalClient)];

  // 5. Converter para EvaluatedCondition
  let evaluated = rawConditions.map(c =>
    toLegacyCondition(c, normalizedInput, normalizedInput.minMargin, monthlyRate, allTotals)
  );

  // 5b. Adicionar condições de negociação
  evaluated = [...evaluated, ...negotiationConditions];

  // 6. Aplicar bloqueios
  applyBlocks(evaluated, normalizedInput);

  // 7. Aplicar penalizações e bonificações
  applyAdjustments(evaluated, normalizedInput);

  // 8. Calcular final scores com pesos por perfil
  calcFinalScores(evaluated, detectedProfile);

  // 9. Atribuir status
  assignStatuses(evaluated, normalizedInput.minMargin);

  // 10. Gerar alertas
  for (const c of evaluated) {
    if (!c.blocked) {
      c.alerts = generateAlerts(c, normalizedInput.minMargin, normalizedInput.immediateCost);
    }
  }

  // 10. Atribuir tags
  assignTags(evaluated);

  // 11. Selecionar top 3
  const { recommended, bestForClosing, bestForMargin, alternatives } = selectTop3(evaluated);

  // 12. Sumário
  const viable = evaluated.filter(c => !c.blocked);
  const blocked = evaluated.filter(c => c.blocked);

  const summary: ResultSummary = {
    basePrice,
    grossProfit: basePrice - input.totalCost,
    totalConditionsGenerated: evaluated.length,
    totalViable: viable.length,
    totalBlocked: blocked.length,
    bestMarginAvailable: viable.length > 0 ? Math.max(...viable.map(c => c.effectiveMargin)) : 0,
    worstMarginAvailable: viable.length > 0 ? Math.min(...viable.map(c => c.effectiveMargin)) : 0,
  };

  return {
    recommended,
    bestForClosing,
    bestForMargin,
    alternatives,
    blockedCount: blocked.length,
    detectedProfile,
    summary,
  };
}
