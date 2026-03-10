// ─── Risk Engine ─────────────────────────────────────────────────────────────
// Calcula risco, liquidez, cobertura, margem real e scores compostos.

import type { RiskLevel, CashFlowRow } from './simulatorTypes';

// ─── Constantes ──────────────────────────────────────────────────────────────
const CDI_MONTHLY = 0.87; // % ao mês (referência 2026)

// ─── NPV — Valor Presente Líquido ────────────────────────────────────────────
export function npv(rate: number, cashFlows: CashFlowRow[]): number {
  const r = rate / 100;
  return cashFlows.reduce((acc, cf) => acc + cf.value / Math.pow(1 + r, cf.month), 0);
}

// ─── Margem Real (ajustada pelo valor do dinheiro no tempo) ──────────────────
export function calcRealMargin(
  totalClient: number,
  totalCost: number,
  cashFlow: CashFlowRow[],
  monthlyRate: number = CDI_MONTHLY,
): number {
  if (totalClient <= 0) return 0;
  const presentValue = npv(monthlyRate, cashFlow);
  const realProfit = presentValue - totalCost;
  return presentValue > 0 ? (realProfit / presentValue) * 100 : 0;
}

// ─── Payback Month ───────────────────────────────────────────────────────────
export function calcPaybackMonth(cashFlow: CashFlowRow[], totalCost: number): number {
  let accumulated = 0;
  for (const row of cashFlow) {
    accumulated += row.value;
    if (accumulated >= totalCost) {
      return row.month;
    }
  }
  return cashFlow.length > 0 ? cashFlow[cashFlow.length - 1].month : 999;
}

// ─── Prazo Médio Ponderado de Recebimento ────────────────────────────────────
export function calcAvgReceivingDays(cashFlow: CashFlowRow[]): number {
  const totalValue = cashFlow.reduce((s, r) => s + r.value, 0);
  if (totalValue <= 0) return 0;
  const weightedSum = cashFlow.reduce((s, r) => s + r.value * r.month * 30, 0);
  return weightedSum / totalValue;
}

// ─── Risco de Inadimplência Estimado ─────────────────────────────────────────
// Curva simplificada: prazo curto = 2%, prazo longo = 8-15%
export function calcDefaultRisk(installments: number, hasEntry: boolean): number {
  let base = 2; // base 2% para curto prazo

  if (installments <= 3) base = 1.5;
  else if (installments <= 6) base = 2.5;
  else if (installments <= 12) base = 4;
  else if (installments <= 18) base = 7;
  else if (installments <= 24) base = 10;
  else base = 15;

  // Entrada reduz risco (o cliente que dá entrada tem mais "skin in the game")
  if (hasEntry) {
    base *= 0.7;
  }

  return Math.round(base * 10) / 10;
}

// ─── Score de Liquidez ───────────────────────────────────────────────────────
// 0-100: quão rápido o dinheiro entra
export function calcLiquidityScore(
  entry: number,
  totalClient: number,
  installments: number,
  paybackMonth: number,
): number {
  let score = 0;

  // Proporção da entrada sobre o total (0-40 pts)
  const entryRatio = totalClient > 0 ? entry / totalClient : 0;
  score += entryRatio * 40;

  // Payback rápido (0-30 pts)
  if (paybackMonth <= 1) score += 30;
  else if (paybackMonth <= 3) score += 25;
  else if (paybackMonth <= 6) score += 20;
  else if (paybackMonth <= 12) score += 10;

  // Poucas parcelas (0-30 pts)
  if (installments === 0) score += 30;       // à vista
  else if (installments <= 3) score += 25;
  else if (installments <= 6) score += 20;
  else if (installments <= 12) score += 12;
  else if (installments <= 24) score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Coverage Ratio ──────────────────────────────────────────────────────────
export function calcCoverageRatio(entry: number, immediateCost: number): number {
  if (immediateCost <= 0) return 1;
  return entry / immediateCost;
}

// ─── Risk Level from Score ───────────────────────────────────────────────────
export function getRiskLevel(riskScore: number): RiskLevel {
  if (riskScore >= 80) return 'very_low';
  if (riskScore >= 60) return 'low';
  if (riskScore >= 40) return 'medium';
  if (riskScore >= 20) return 'high';
  return 'very_high';
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'very_low': return 'Muito Baixo';
    case 'low': return 'Baixo';
    case 'medium': return 'Médio';
    case 'high': return 'Alto';
    case 'very_high': return 'Muito Alto';
  }
}

// ─── Risk Score Composto (0-100, 100 = mais seguro) ──────────────────────────
export function calcRiskScore(
  defaultRisk: number,
  liquidityScore: number,
  coverageRatio: number,
  marginSafety: number,  // (marginEfetiva - minMargin) / minMargin
): number {
  let score = 0;

  // Baixa inadimplência (0-30 pts)
  score += Math.max(0, 30 - defaultRisk * 2);

  // Alta liquidez (0-30 pts)
  score += liquidityScore * 0.3;

  // Boa cobertura de mobilização (0-20 pts)
  if (coverageRatio >= 1.0) score += 20;
  else if (coverageRatio >= 0.8) score += 15;
  else if (coverageRatio >= 0.5) score += 8;

  // Segurança de margem (0-20 pts)
  if (marginSafety >= 1.0) score += 20;       // margem >= 2×mínima
  else if (marginSafety >= 0.5) score += 15;  // margem >= 1.5×mínima
  else if (marginSafety >= 0.2) score += 10;  // margem >= 1.2×mínima
  else if (marginSafety >= 0) score += 5;     // margem >= mínima

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Closing Score (0-100) ───────────────────────────────────────────────────
export function calcClosingScore(
  installmentAmount: number,
  monthlyCapacity: number,
  entry: number,
  availableEntry: number,
  installments: number,
  desiredInstallments: number,
  totalClient: number,
  allTotals: number[],
): number {
  let score = 50; // base neutra

  // Parcela cabe no orçamento (+/- 25 pts)
  if (monthlyCapacity > 0 && installmentAmount > 0) {
    if (installmentAmount <= monthlyCapacity) {
      const folga = 1 - (installmentAmount / monthlyCapacity);
      score += 25 - folga * 8; // mais próximo do limite = melhor p/ fechar
    } else if (installmentAmount <= monthlyCapacity * 1.1) {
      score += 5; // tolerável
    } else {
      score -= Math.min(30, ((installmentAmount - monthlyCapacity) / monthlyCapacity) * 30);
    }
  } else if (installmentAmount === 0) {
    score += 15; // à vista sempre fecha se o cara tem dinheiro
  }

  // Entrada cabe no disponível (+/- 15 pts)
  if (availableEntry > 0 && entry > 0) {
    if (entry <= availableEntry) score += 15;
    else score -= Math.min(20, ((entry - availableEntry) / availableEntry) * 15);
  } else if (entry === 0) {
    score += 10;
  }

  // Parcelas próximas do desejado (+/- 15 pts)
  if (desiredInstallments > 0 && installments > 0) {
    const diff = Math.abs(installments - desiredInstallments);
    if (diff === 0) score += 15;
    else if (diff <= 2) score += 15 - diff * 4;
    else score -= Math.min(10, diff * 2);
  }

  // Menor total entre alternativas (0-10 pts)
  if (allTotals.length > 1) {
    const minTotal = Math.min(...allTotals);
    const maxTotal = Math.max(...allTotals);
    if (maxTotal > minTotal) {
      const norm = 1 - (totalClient - minTotal) / (maxTotal - minTotal);
      score += norm * 10;
    }
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Cash Score (0-100) ──────────────────────────────────────────────────────
export function calcCashScore(
  coverageRatio: number,
  paybackMonth: number,
  liquidityScore: number,
  installments: number,
): number {
  let score = 0;

  // Cobertura de mobilização (0-35 pts)
  if (coverageRatio >= 1.5) score += 35;
  else if (coverageRatio >= 1.0) score += 30;
  else if (coverageRatio >= 0.8) score += 20;
  else if (coverageRatio >= 0.5) score += 10;
  else score -= 10;

  // Payback rápido (0-35 pts)
  if (paybackMonth <= 1) score += 35;
  else if (paybackMonth <= 3) score += 28;
  else if (paybackMonth <= 6) score += 20;
  else if (paybackMonth <= 12) score += 10;
  else score += 2;

  // Liquidez (0-30 pts)
  score += liquidityScore * 0.30;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Profit Score (0-100) ────────────────────────────────────────────────────
export function calcProfitScore(
  effectiveMargin: number,
  realMargin: number,
  minMargin: number,
  correctionAmount: number,
  totalClient: number,
): number {
  let score = 0;

  // Margem efetiva acima da mínima (0-40 pts)
  const marginAbove = effectiveMargin - minMargin;
  if (marginAbove >= 20) score += 40;
  else if (marginAbove >= 10) score += 30;
  else if (marginAbove >= 5) score += 20;
  else if (marginAbove >= 0) score += 10;
  else score -= 20;

  // Margem real (0-30 pts)
  if (realMargin >= minMargin) {
    score += 30;
  } else if (realMargin >= minMargin * 0.7) {
    score += 15;
  }

  // Correção monetária capturada (0-20 pts)
  if (totalClient > 0 && correctionAmount > 0) {
    const corrRatio = correctionAmount / totalClient;
    score += Math.min(20, corrRatio * 200);
  }

  // Bônus à vista (sem risco de não receber)
  if (correctionAmount <= 0 && effectiveMargin >= minMargin) {
    score += 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── IRR — Taxa Interna de Retorno (Newton-Raphson) ──────────────────────────
// Encontra a taxa mensal que faz o VPL = 0, considerando investimento inicial
export function calcIRR(cashFlow: CashFlowRow[], totalCost: number, maxIterations = 50): number {
  if (cashFlow.length === 0) return 0;

  // Função NPV para uma dada taxa
  const calcNPV = (rate: number): number => {
    let npvValue = -totalCost; // investimento inicial negativo
    for (const cf of cashFlow) {
      npvValue += cf.value / Math.pow(1 + rate, cf.month);
    }
    return npvValue;
  };

  // Derivada numérica do NPV
  const calcDerivative = (rate: number): number => {
    const h = 0.0001;
    return (calcNPV(rate + h) - calcNPV(rate - h)) / (2 * h);
  };

  // Newton-Raphson
  let guess = 0.01; // chute inicial: 1% ao mês
  for (let i = 0; i < maxIterations; i++) {
    const npvVal = calcNPV(guess);
    const deriv = calcDerivative(guess);

    if (Math.abs(deriv) < 1e-10) break; // evitar divisão por zero
    const newGuess = guess - npvVal / deriv;

    if (Math.abs(newGuess - guess) < 1e-8) {
      guess = newGuess;
      break;
    }
    guess = newGuess;

    // Segurança: limitar entre -50% e +100% ao mês
    if (guess < -0.5) guess = -0.5;
    if (guess > 1.0) guess = 1.0;
  }

  return Math.round(guess * 10000) / 100; // retorno em % (ex: 2.45%)
}

// Converte IRR mensal → anual equivalente
export function irrToAnnual(monthlyIRR: number): number {
  const r = monthlyIRR / 100;
  return Math.round((Math.pow(1 + r, 12) - 1) * 10000) / 100;
}

// ─── Score de Atratividade Comercial (0-100) ─────────────────────────────────
// Mede quão atrativa a condição é para o CLIENTE fechar negócio
export function calcAttractivenessScore(
  installmentAmount: number,
  monthlyCapacity: number,
  entry: number,
  availableEntry: number,
  totalClient: number,
  allTotals: number[],
  installments: number,
  desiredInstallments: number,
  preferredPayment: string,
  type: string,
): number {
  let score = 0;

  // 1. Parcela cabe no orçamento (0-25 pts)
  if (monthlyCapacity > 0 && installmentAmount > 0) {
    const ratio = installmentAmount / monthlyCapacity;
    if (ratio <= 0.6) score += 25;       // parcela = 60% ou menos do orçamento
    else if (ratio <= 0.8) score += 20;  // confortável
    else if (ratio <= 1.0) score += 12;  // justo
    else if (ratio <= 1.1) score += 5;   // apertado
    // acima de 1.1 = não cabe, 0 pts
  } else if (type === 'avista') {
    score += 15; // à vista é atrativo para quem tem dinheiro
  } else if (installmentAmount === 0) {
    score += 10;
  }

  // 2. Menor custo total entre alternativas (0-20 pts)
  if (allTotals.length > 1) {
    const minTotal = Math.min(...allTotals.filter(t => t > 0));
    const maxTotal = Math.max(...allTotals);
    if (maxTotal > minTotal) {
      const norm = 1 - (totalClient - minTotal) / (maxTotal - minTotal);
      score += Math.round(norm * 20);
    } else {
      score += 10;
    }
  } else {
    score += 10;
  }

  // 3. Entrada acessível ou sem entrada (0-15 pts)
  if (entry === 0) {
    score += 15; // sem entrada = muito atrativo
  } else if (availableEntry > 0) {
    if (entry <= availableEntry * 0.5) score += 12;      // entrada = 50% ou menos do disponível
    else if (entry <= availableEntry) score += 8;         // cabe
    else if (entry <= availableEntry * 1.2) score += 3;   // apertado
    // acima = não cabe
  } else {
    score += 5; // não informou disponível, dar nota neutra
  }

  // 4. Prazo confortável (0-15 pts)
  if (desiredInstallments > 0 && installments > 0) {
    const diff = Math.abs(installments - desiredInstallments);
    if (diff === 0) score += 15;
    else if (diff <= 2) score += 12;
    else if (diff <= 4) score += 8;
    else if (diff <= 6) score += 4;
  } else if (type === 'avista') {
    score += 10;
  } else {
    score += 7; // sem referência
  }

  // 5. Forma de pagamento alinhada (0-10 pts)
  if (preferredPayment === 'any') {
    score += 7; // sem preferência → qualquer condição ok
  } else if (type === 'avista' && (preferredPayment === 'pix')) {
    score += 10;
  } else if (preferredPayment === 'credit_card' && installments <= 12) {
    score += 10;
  } else if (preferredPayment === 'boleto' && installments > 0) {
    score += 10;
  } else if (preferredPayment === 'mixed') {
    score += 8;
  } else {
    score += 3;
  }

  // 6. Desconto / economia percebida (0-15 pts)
  if (type === 'avista') {
    score += 15; // à vista sempre tem desconto implícito
  } else if (allTotals.length > 1) {
    const avg = allTotals.reduce((a, b) => a + b, 0) / allTotals.length;
    if (totalClient < avg * 0.95) score += 12;       // 5%+ abaixo da média
    else if (totalClient < avg) score += 8;           // abaixo da média
    else if (totalClient < avg * 1.05) score += 4;   // na média
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Simulação de Atraso ─────────────────────────────────────────────────────
// Estima o impacto de 1, 2 e 3 meses de atraso na margem e no caixa
import type { DelayImpact, DelayScenario } from './simulatorTypes';

function calcDelayScenario(
  cashFlow: CashFlowRow[],
  totalCost: number,
  realMarginOriginal: number,
  monthlyRate: number,
  delayMonths: number,
): DelayScenario {
  // Simular atraso: adiar cada recebimento em N meses
  const delayedFlow = cashFlow.map(cf => ({
    ...cf,
    month: cf.month + delayMonths,
  }));

  // Recalcular NPV com fluxo atrasado
  const r = monthlyRate / 100;
  const pvDelayed = delayedFlow.reduce((acc, cf) => acc + cf.value / Math.pow(1 + r, cf.month), 0);
  const realProfit = pvDelayed - totalCost;
  const realMargin = pvDelayed > 0 ? (realProfit / pvDelayed) * 100 : 0;

  // Cash gap: quanto a empresa fica sem receber durante o atraso
  // (soma dos recebimentos que deveriam cair nos meses de atraso)
  const cashGap = cashFlow
    .filter(cf => cf.month <= delayMonths)
    .reduce((sum, cf) => sum + cf.value, 0);

  return {
    realMargin: Math.round(realMargin * 10) / 10,
    cashGap: Math.round(cashGap * 100) / 100,
    marginLoss: Math.round((realMarginOriginal - realMargin) * 10) / 10,
  };
}

export function simulateDelay(
  cashFlow: CashFlowRow[],
  totalCost: number,
  realMargin: number,
  minMargin: number,
  monthlyRate: number = CDI_MONTHLY,
): DelayImpact {
  const delay1m = calcDelayScenario(cashFlow, totalCost, realMargin, monthlyRate, 1);
  const delay2m = calcDelayScenario(cashFlow, totalCost, realMargin, monthlyRate, 2);
  const delay3m = calcDelayScenario(cashFlow, totalCost, realMargin, monthlyRate, 3);

  // Calcular máximo de meses de atraso seguro (margem >= mínima)
  let maxSafeDelay = 0;
  for (let m = 1; m <= 12; m++) {
    const scenario = calcDelayScenario(cashFlow, totalCost, realMargin, monthlyRate, m);
    if (scenario.realMargin >= minMargin) {
      maxSafeDelay = m;
    } else {
      break;
    }
  }

  return { delay1m, delay2m, delay3m, maxSafeDelay };
}
