// ─── Profile Classifier ──────────────────────────────────────────────────────
// Classifica automaticamente o perfil do cliente com base nos dados informados.

import type { ClientProfile, WizardInput } from './simulatorTypes';

/**
 * Detecta o perfil do cliente automaticamente quando o operador seleciona 'auto'.
 * Analisa os dados informados e retorna o perfil mais provável.
 */
export function classifyProfile(input: WizardInput): ClientProfile {
  // Se o operador selecionou um perfil específico, respeitar
  if (input.clientProfile !== 'auto') {
    return input.clientProfile;
  }

  const basePrice = input.totalCost / (1 - input.minMargin / 100);
  let scores: Record<Exclude<ClientProfile, 'auto'>, number> = {
    low_installment: 0,
    low_total: 0,
    fast_start: 0,
    predictability: 0,
  };

  // ── Sinais para "quer parcela baixa" ──────────────────────────────
  if (input.monthlyCapacity && input.monthlyCapacity > 0) {
    // Informou capacidade mensal → se preocupa com parcela
    scores.low_installment += 30;

    const estimatedInstallment = basePrice / (input.desiredInstallments || 12);
    if (input.monthlyCapacity < estimatedInstallment) {
      // Capacidade menor que parcela estimada → muito sensível a parcela
      scores.low_installment += 20;
    }
  }

  if (input.desiredInstallments && input.desiredInstallments > 12) {
    // Quer muitas parcelas → quer parcela baixa
    scores.low_installment += 15;
  }

  // ── Sinais para "quer pagar menos no total" ───────────────────────
  if (input.availableEntry && input.availableEntry >= basePrice * 0.5) {
    // Pode pagar 50%+ de entrada → quer economizar no total
    scores.low_total += 25;
  }

  if (!input.desiredInstallments || input.desiredInstallments <= 3) {
    // Poucas parcelas ou à vista → sensível ao total
    scores.low_total += 20;
  }

  if (input.maxTerm <= 6) {
    // Prazo curto → quer resolver logo e pagar menos
    scores.low_total += 15;
  }

  // ── Sinais para "quer começar rápido" ─────────────────────────────
  if (input.availableEntry && input.availableEntry >= input.immediateCost) {
    // Tem entrada suficiente para mobilização
    scores.fast_start += 20;
  }

  if (input.maxTerm <= 12 && (!input.desiredInstallments || input.desiredInstallments <= 6)) {
    scores.fast_start += 15;
  }

  if (input.preferredPayment === 'pix') {
    // PIX = quer agilidade
    scores.fast_start += 10;
  }

  // ── Sinais para "quer previsibilidade" ────────────────────────────
  if (input.desiredInstallments && input.desiredInstallments >= 6 && input.desiredInstallments <= 18) {
    // Prazo médio → quer previsibilidade
    scores.predictability += 15;
  }

  if (input.monthlyCapacity && input.monthlyCapacity > 0 && input.desiredInstallments) {
    const estimatedInst = basePrice / input.desiredInstallments;
    // Se a capacidade é bastante maior que a parcela, quer conforto/previsibilidade
    if (input.monthlyCapacity >= estimatedInst * 1.3) {
      scores.predictability += 20;
    }
  }

  if (input.preferredPayment === 'boleto') {
    scores.predictability += 10;
  }

  // ── Selecionar o maior score ──────────────────────────────────────
  let best: Exclude<ClientProfile, 'auto'> = 'low_installment';
  let bestScore = -1;

  for (const [profile, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = profile as Exclude<ClientProfile, 'auto'>;
    }
  }

  // Se todos os scores são iguais ou muito baixos, default para 'auto' behavior
  if (bestScore <= 10) {
    return 'low_installment'; // default mais seguro
  }

  return best;
}

/**
 * Retorna a label amigável do perfil para exibição.
 */
export function getProfileLabel(profile: ClientProfile): string {
  switch (profile) {
    case 'auto': return 'Automático';
    case 'low_installment': return 'Quer parcela baixa';
    case 'low_total': return 'Quer pagar menos no total';
    case 'fast_start': return 'Quer começar rápido';
    case 'predictability': return 'Quer previsibilidade';
  }
}

export function getProfileEmoji(profile: ClientProfile): string {
  switch (profile) {
    case 'auto': return '🔄';
    case 'low_installment': return '🏷️';
    case 'low_total': return '💰';
    case 'fast_start': return '⚡';
    case 'predictability': return '📊';
  }
}
