// ─── Alert Generator ─────────────────────────────────────────────────────────
// Gera alertas textuais simples em PT-BR para cada condição avaliada.

import type { Alert, EvaluatedCondition } from './simulatorTypes';

/**
 * Gera alertas humanos para uma condição, baseados nos seus scores e riscos.
 * O operador vê apenas frases simples — nunca números ou jargão financeiro.
 */
export function generateAlerts(
  condition: EvaluatedCondition,
  minMargin: number,
  immediateCost: number,
): Alert[] {
  const alerts: Alert[] = [];

  // ── Alertas de SUCESSO (verde) ──────────────────────────────────────
  if (condition.effectiveMargin >= minMargin * 1.5) {
    alerts.push({
      type: 'success',
      icon: '✅',
      message: 'Margem excelente — condição muito segura para a empresa',
    });
  } else if (condition.effectiveMargin >= minMargin) {
    alerts.push({
      type: 'success',
      icon: '✅',
      message: 'Margem dentro do esperado — condição segura',
    });
  }

  if (condition.coverageRatio >= 1.0 && condition.entry > 0) {
    alerts.push({
      type: 'success',
      icon: '✅',
      message: 'Entrada cobre 100% do custo de mobilização',
    });
  }

  if (condition.paybackMonth <= 2) {
    alerts.push({
      type: 'success',
      icon: '✅',
      message: 'Retorno rápido — custo recuperado nos primeiros meses',
    });
  }

  if (condition.type === 'avista') {
    alerts.push({
      type: 'success',
      icon: '⚡',
      message: 'Pagamento à vista — sem risco de inadimplência',
    });
  }

  // ── Alertas de ATENÇÃO (amarelo) ────────────────────────────────────
  if (condition.installments > 12) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      message: `Prazo de ${condition.installments} meses — considere reajuste anual`,
    });
  }

  if (condition.coverageRatio < 1.0 && condition.coverageRatio >= 0.5 && condition.entry > 0) {
    const pct = Math.round(condition.coverageRatio * 100);
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      message: `Entrada cobre ${pct}% da mobilização — considere negociar entrada maior`,
    });
  }

  if (condition.coverageRatio < 0.5 && condition.entry > 0) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      message: 'Entrada insuficiente para cobrir custo de mobilização',
    });
  }

  if (condition.defaultRisk >= 8) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      message: 'Prazo longo aumenta o risco — avalie garantias adicionais',
    });
  }

  if (condition.effectiveMargin < minMargin * 1.2 && condition.effectiveMargin >= minMargin) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      message: 'Margem próxima do limite mínimo — pouca folga para imprevistos',
    });
  }

  if (condition.realMargin < condition.effectiveMargin * 0.7) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      message: 'Margem real reduzida pela correção do dinheiro no tempo',
    });
  }

  // Limitar a 3 alertas para não poluir a interface
  return alerts.slice(0, 3);
}

/**
 * Gera a frase principal de destaque para o card da condição.
 */
export function generateHeadline(
  condition: EvaluatedCondition,
  isRecommended: boolean,
  isBestClosing: boolean,
  isBestMargin: boolean,
): string {
  if (isRecommended) {
    if (condition.type === 'avista') {
      return 'Melhor condição geral — economia máxima com pagamento à vista';
    }
    return 'Melhor equilíbrio entre fechamento, margem e segurança';
  }

  if (isBestClosing) {
    if (condition.installmentAmount > 0) {
      return 'Facilita o fechamento com parcelas acessíveis para o cliente';
    }
    return 'Condição mais atrativa para o cliente fechar';
  }

  if (isBestMargin) {
    return 'Protege melhor a margem e o caixa da empresa';
  }

  // Cards alternativos
  if (condition.type === 'avista') return 'Pagamento integral com desconto especial';
  if (condition.type === 'leasing') return 'Mensalidade fixa e previsível';
  if (condition.entry > 0 && condition.installments > 0) return 'Entrada + parcelas — divide o investimento';
  if (condition.installments > 0) return 'Parcelamento total sem entrada';
  return 'Condição alternativa disponível';
}

/**
 * Gera o texto persuasivo para enviar ao cliente.
 */
export function generateClientArgument(
  condition: EvaluatedCondition,
  allConditions: EvaluatedCondition[],
  clientProfile: string,
): string {
  // Menor parcela
  const withInst = allConditions.filter(c => c.installmentAmount > 0 && !c.blocked);
  if (withInst.length > 0) {
    const minP = Math.min(...withInst.map(c => c.installmentAmount));
    if (condition.installmentAmount === minP && condition.installmentAmount > 0) {
      return 'A menor parcela disponível, pensada para caber no seu fluxo de caixa mensal';
    }
  }

  // Menor custo total
  const viableConditions = allConditions.filter(c => !c.blocked);
  const minTotal = Math.min(...viableConditions.map(c => c.totalClient));
  if (condition.totalClient === minTotal) {
    return 'A opção mais econômica — melhor custo-benefício do investimento';
  }

  // Sem entrada
  if (condition.entry === 0 && condition.installments > 0) {
    return 'Comece sem investimento inicial — parcelas acessíveis desde o primeiro mês';
  }

  // Por perfil
  if (clientProfile === 'low_installment') {
    return 'Condição com parcelas reduzidas, pensada para o seu orçamento mensal';
  }
  if (clientProfile === 'fast_start') {
    return 'Condição ágil para iniciar o projeto o quanto antes';
  }
  if (clientProfile === 'predictability') {
    return 'Investimento programado com previsibilidade total de parcelas';
  }

  // Genéricos
  switch (condition.type) {
    case 'avista': return 'Condição exclusiva com desconto especial para pagamento à vista';
    case 'entrada': return 'Divida o investimento — entrada + parcelas no seu ritmo';
    case 'leasing': return 'Mensalidade fixa e previsível, sem surpresas no orçamento';
    default: return 'Condição especial calculada exclusivamente para o seu perfil';
  }
}
