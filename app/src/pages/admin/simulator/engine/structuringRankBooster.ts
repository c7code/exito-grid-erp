// ════════════════════════════════════════════════════════════════════════════
// Structuring Rank Booster — Ajustes de ranking baseados na estruturação
// ════════════════════════════════════════════════════════════════════════════
//
// Posição na arquitetura:
//   financeEngine → rankingEngine → [structuringRankBooster] → resultado final
//
// Esta camada NÃO substitui o rankingEngine. Ela pós-processa os dados já
// ranqueados para:
//   1. Aplicar bloqueios baseados na estruturação financeira
//   2. Ajustar scores considerando cobertura de caixa e capacidade
//   3. Gerar explicações contextuais ("por que recomendado" / "por que bloqueado")
//
// Todas as funções são PURAS.
// ════════════════════════════════════════════════════════════════════════════

import type { EvaluatedCondition, WizardInput, ConditionExplanation } from './simulatorTypes';
import type { StructuringResult } from './paymentStructuringEngine';
import { fmt } from './simulatorTypes';

// Re-export for convenience
export type { ConditionExplanation };

// ─── BLOQUEIOS BASEADOS EM ESTRUTURAÇÃO ──────────────────────────────────────

/**
 * Aplica bloqueios adicionais baseados na análise de estruturação financeira.
 * Executar DEPOIS dos bloqueios padrões do rankingEngine.
 *
 * Regras:
 *   1. Líquido imediato < 70% da meta → bloqueia (caixa comprometido)
 *   2. Margem real < 5% → bloqueia (já tratado no ranking, reforço)
 *   3. Risco > 80 (riskScore < 20) → bloqueia
 *   4. Parcela > 150% da capacidade do cliente → bloqueia
 */
export function applyStructuringBlocks(
  conditions: EvaluatedCondition[],
  input: WizardInput,
  structuring: StructuringResult | null,
): void {
  if (!structuring) return;

  const immediateTarget = structuring.immediateNetTarget;
  const hasCapacity = !!(input.monthlyCapacity && input.monthlyCapacity > 0);

  for (const c of conditions) {
    if (c.blocked) continue; // já bloqueada pelo ranking padrão

    // ── 1. Cobertura de caixa imediato insuficiente ──
    // Se a entrada desta condição não cobre 70% da meta de caixa
    if (immediateTarget > 0 && c.entry > 0) {
      const entryNetEstimate = c.entry * (1 - (structuring.entry.totalFees / Math.max(1, structuring.entry.grossTotal)));
      const coverageRatio = entryNetEstimate / immediateTarget;

      if (coverageRatio < 0.7) {
        c.blocked = true;
        c.blockReason = `Entrada líquida (~R$ ${fmt(entryNetEstimate)}) cobre apenas ${Math.round(coverageRatio * 100)}% da meta de caixa de R$ ${fmt(immediateTarget)}`;
        c.status = 'blocked';
        continue;
      }
    }

    // ── 2. Parcela ultrapassa muito a capacidade (>150%) ──
    if (hasCapacity && c.installmentAmount > 0) {
      const ratio = c.installmentAmount / input.monthlyCapacity!;
      if (ratio > 1.5) {
        c.blocked = true;
        c.blockReason = `Parcela R$ ${fmt(c.installmentAmount)} é ${Math.round(ratio * 100)}% da capacidade mensal de R$ ${fmt(input.monthlyCapacity!)}`;
        c.status = 'blocked';
        continue;
      }
    }

    // ── 3. Risco extremo sem compensação ──
    if (c.riskScore < 15 && c.effectiveMargin < input.minMargin * 1.5) {
      c.blocked = true;
      c.blockReason = 'Risco extremamente elevado sem prêmio financeiro que compense';
      c.status = 'blocked';
      continue;
    }
  }
}

// ─── AJUSTES DE SCORE BASEADOS EM ESTRUTURAÇÃO ──────────────────────────────

/**
 * Ajusta os scores finais considerando a estruturação financeira.
 * Bonifica condições que protegem caixa e encaixam na capacidade.
 * Penaliza condições com gap de caixa ou parcela apertada.
 */
export function applyStructuringScoreAdjustments(
  conditions: EvaluatedCondition[],
  input: WizardInput,
  structuring: StructuringResult | null,
): void {
  if (!structuring) return;

  const hasCapacity = !!(input.monthlyCapacity && input.monthlyCapacity > 0);
  const immediateTarget = structuring.immediateNetTarget;
  const feeRatio = structuring.entry.grossTotal > 0
    ? structuring.entry.totalFees / structuring.entry.grossTotal
    : 0;

  for (const c of conditions) {
    if (c.blocked) continue;

    let scoreAdj = 0;

    // ── Bonificação: entrada cobre meta de caixa ──
    if (immediateTarget > 0 && c.entry > 0) {
      const netEntry = c.entry * (1 - feeRatio);
      const coverage = netEntry / immediateTarget;

      if (coverage >= 1.2) {
        scoreAdj += 8; // folga de 20%+
      } else if (coverage >= 1.0) {
        scoreAdj += 5; // cobriu exatamente
      } else if (coverage >= 0.9) {
        scoreAdj += 2; // quase
      } else if (coverage >= 0.7) {
        scoreAdj -= 3; // parcial
      }
    }

    // ── Bonificação: parcela confortável na capacidade do cliente ──
    if (hasCapacity && c.installmentAmount > 0) {
      const ratio = c.installmentAmount / input.monthlyCapacity!;
      if (ratio <= 0.5) {
        scoreAdj += 6; // muita folga
      } else if (ratio <= 0.7) {
        scoreAdj += 4; // confortável
      } else if (ratio <= 0.9) {
        scoreAdj += 2; // ok
      } else if (ratio <= 1.0) {
        scoreAdj += 0; // justo
      } else if (ratio <= 1.1) {
        scoreAdj -= 3; // apertado
      } else if (ratio <= 1.3) {
        scoreAdj -= 6; // difícil
      }
    }

    // ── Bonificação: payback rápido com cobertura ──
    if (c.paybackMonth <= 2 && c.coverageRatio >= 1.0) {
      scoreAdj += 5; // recuperação rápida + caixa protegido
    }

    // ── Penalização: empresa absorve muita taxa ──
    if (structuring.entry.companyAbsorbedFees > 0 && c.entry > 0) {
      const absorbed = structuring.entry.companyAbsorbedFees;
      const profit = c.totalProfit;
      if (profit > 0 && absorbed > profit * 0.1) {
        scoreAdj -= 3; // taxas estão comendo mais de 10% do lucro
      }
    }

    // Aplicar ajuste ao finalScore (clamped a 0-100)
    c.finalScore = Math.min(100, Math.max(0, c.finalScore + scoreAdj));
  }
}

// ─── GERADOR DE EXPLICAÇÕES ──────────────────────────────────────────────────

/**
 * Gera explicação detalhada para uma condição específica.
 * Usada para exibir no card expandido do Step3.
 */
export function generateExplanation(
  condition: EvaluatedCondition,
  input: WizardInput,
  structuring: StructuringResult | null,
  isRecommended: boolean,
  isBestClosing: boolean,
  isBestMargin: boolean,
): ConditionExplanation {
  const hasCapacity = !!(input.monthlyCapacity && input.monthlyCapacity > 0);
  const immediateTarget = structuring?.immediateNetTarget || input.immediateCost;
  const feeRatio = structuring
    ? (structuring.entry.grossTotal > 0 ? structuring.entry.totalFees / structuring.entry.grossTotal : 0)
    : 0;

  // ── Recommendation reason ──
  let recommendation: string;

  if (condition.blocked && condition.blockReason) {
    recommendation = `❌ Bloqueada: ${condition.blockReason}`;
  } else if (isRecommended) {
    const reasons: string[] = [];

    if (condition.coverageRatio >= 1.0) {
      reasons.push('cobre 100% do custo imediato');
    }
    if (hasCapacity && condition.installmentAmount <= input.monthlyCapacity!) {
      reasons.push('parcela cabe no orçamento do cliente');
    }
    if (condition.effectiveMargin >= input.minMargin * 1.3) {
      reasons.push('margem com folga de segurança');
    }
    if (condition.riskScore >= 60) {
      reasons.push('risco controlado');
    }
    if (condition.paybackMonth <= 6) {
      reasons.push('retorno rápido');
    }

    recommendation = reasons.length > 0
      ? `⭐ Recomendada porque: ${reasons.join(', ')}`
      : '⭐ Melhor equilíbrio entre fechamento, margem e segurança';
  } else if (isBestClosing) {
    const reasons: string[] = [];
    if (condition.closingScore >= 70) reasons.push('alta chance de aceite');
    if (hasCapacity && condition.installmentAmount <= input.monthlyCapacity!) {
      reasons.push('parcela dentro do orçamento');
    }
    if (condition.totalClient <= input.totalCost * 1.3) {
      reasons.push('custo total acessível');
    }
    recommendation = reasons.length > 0
      ? `🎯 Melhor para fechar: ${reasons.join(', ')}`
      : '🎯 Condição com maior probabilidade de aceite pelo cliente';
  } else if (isBestMargin) {
    recommendation = `🛡️ Protege a margem: ${condition.effectiveMargin.toFixed(1)}% efetiva, ${condition.realMargin.toFixed(1)}% real`;
  } else {
    recommendation = `Condição viável — score ${condition.finalScore}/100`;
  }

  // ── Immediate receipt ──
  let immediateReceipt: string;
  if (condition.type === 'avista') {
    const net = condition.entry * (1 - feeRatio);
    immediateReceipt = `R$ ${fmt(net)} líquido (pagamento integral)`;
  } else if (condition.entry > 0) {
    const net = condition.entry * (1 - feeRatio);
    const covPct = immediateTarget > 0 ? Math.round((net / immediateTarget) * 100) : 100;
    immediateReceipt = `R$ ${fmt(net)} líquido na entrada (${covPct}% da meta de R$ ${fmt(immediateTarget)})`;
  } else {
    immediateReceipt = 'Sem entrada — nenhum recebimento imediato';
  }

  // ── Financed summary ──
  let financedSummary: string;
  if (condition.installments > 0 && condition.installmentAmount > 0) {
    const financed = condition.totalClient - condition.entry;
    financedSummary = `R$ ${fmt(financed)} em ${condition.installments}x de R$ ${fmt(condition.installmentAmount)}`;
    if (condition.frequency > 1) {
      const freqLabel = condition.frequency === 2 ? 'bimestral' : condition.frequency === 3 ? 'trimestral' : `a cada ${condition.frequency}m`;
      financedSummary += ` (${freqLabel})`;
    }
  } else {
    financedSummary = 'Sem financiamento — pagamento integral';
  }

  // ── Flexibility cost ──
  let flexibilityCost: string;
  if (condition.correctionAmount > 0) {
    const pctExtra = condition.totalClient > 0
      ? ((condition.correctionAmount / (condition.totalClient - condition.correctionAmount)) * 100).toFixed(1)
      : '0';
    flexibilityCost = `R$ ${fmt(condition.correctionAmount)} adicionais (${pctExtra}% do valor base) pela flexibilidade de pagamento`;
  } else if (condition.type === 'avista') {
    flexibilityCost = 'Sem custo de flexibilidade — desconto por pagamento à vista';
  } else {
    flexibilityCost = 'Sem juros adicionais';
  }

  // ── Financial summary ──
  const parts: string[] = [];
  parts.push(`Total: R$ ${fmt(condition.totalClient)}`);
  parts.push(`Margem: ${condition.effectiveMargin.toFixed(1)}% (real: ${condition.realMargin.toFixed(1)}%)`);
  if (condition.paybackMonth > 0) {
    parts.push(`Payback: mês ${condition.paybackMonth}`);
  }
  if (hasCapacity && condition.installmentAmount > 0) {
    const usage = Math.round((condition.installmentAmount / input.monthlyCapacity!) * 100);
    parts.push(`Usa ${usage}% da capacidade do cliente`);
  }
  const financialSummary = parts.join(' • ');

  // ── Block explanation ──
  let blockExplanation: string | undefined;
  if (condition.blocked && condition.blockReason) {
    blockExplanation = buildBlockExplanation(condition, input, structuring);
  }

  return {
    recommendation,
    financialSummary,
    immediateReceipt,
    financedSummary,
    flexibilityCost,
    blockExplanation,
  };
}

/**
 * Constrói explicação detalhada do bloqueio — contexto para o operador entender
 * o que precisaria mudar para viabilizar essa condição.
 */
function buildBlockExplanation(
  condition: EvaluatedCondition,
  input: WizardInput,
  structuring: StructuringResult | null,
): string {
  const parts: string[] = [`🚫 ${condition.blockReason}`];

  // Sugestões de ação
  if (condition.blockReason?.includes('Margem')) {
    const diff = input.minMargin - condition.effectiveMargin;
    parts.push(`→ Precisaria aumentar o preço em ~${diff.toFixed(1)}pp ou reduzir custos`);
  }

  if (condition.blockReason?.includes('capacidade') || condition.blockReason?.includes('Parcela')) {
    if (input.monthlyCapacity && condition.installmentAmount > input.monthlyCapacity) {
      const excess = condition.installmentAmount - input.monthlyCapacity;
      parts.push(`→ Parcela excede em R$ ${fmt(excess)}. Considere prazo mais longo ou entrada maior`);
    }
  }

  if (condition.blockReason?.includes('caixa') || condition.blockReason?.includes('meta')) {
    if (structuring) {
      parts.push(`→ Meta de caixa: R$ ${fmt(structuring.immediateNetTarget)}. Considere aumentar a entrada ou usar PIX`);
    }
  }

  if (condition.blockReason?.includes('Risco') || condition.blockReason?.includes('risco')) {
    parts.push(`→ Risco score: ${condition.riskScore}/100. Considere prazo mais curto ou contratar garantias`);
  }

  if (condition.blockReason?.includes('Prazo')) {
    parts.push(`→ Limite de prazo configurado: ${input.maxTerm} meses`);
  }

  return parts.join('\n');
}

// ─── BATCH: Gerar explanações para todas as condições ────────────────────────

/**
 * Gera mapa de explicações para todas as condições.
 * Retorna um Map\<conditionId, ConditionExplanation\>.
 */
export function generateAllExplanations(
  conditions: EvaluatedCondition[],
  input: WizardInput,
  structuring: StructuringResult | null,
  recommendedId: string,
  bestClosingId: string,
  bestMarginId: string,
): Map<string, ConditionExplanation> {
  const map = new Map<string, ConditionExplanation>();

  for (const c of conditions) {
    const explanation = generateExplanation(
      c, input, structuring,
      c.id === recommendedId,
      c.id === bestClosingId,
      c.id === bestMarginId,
    );
    map.set(c.id, explanation);
  }

  return map;
}
