// ════════════════════════════════════════════════════════════════════════════
// Payment Structuring Engine — Camada de Estruturação Financeira Comercial
// ════════════════════════════════════════════════════════════════════════════
//
// Posição na arquitetura:
//   WizardInput → [paymentStructuringEngine] → financeEngine → Condition[]
//
// Esta camada NÃO substitui o financeEngine.ts. Ela prepara e organiza os
// dados de entrada/saída ANTES e DEPOIS do cálculo financeiro:
//
//   1. Calcula a composição da entrada (bruto, taxas, líquido)
//   2. Verifica se o líquido cobre a meta de caixa imediato
//   3. Aplica a política de taxa (quem absorve)
//   4. Determina o saldo restante financiável
//   5. Verifica aderência à capacidade de pagamento do cliente
//
// O financeEngine.ts continua responsável por:
//   - pmt(), nper(), npv()
//   - buildCashFlow()
//   - simulate() / reverseSimulate()
//   - bilateralScore() / findIdealCondition()
//
// Todas as funções são PURAS e testáveis.
// ════════════════════════════════════════════════════════════════════════════

import type { EntryPaymentMethod } from '../../financeTypes';
import { pmt } from '../../financeEngine';

// ─── TYPES ───────────────────────────────────────────────────────────────────

/** Política de taxa: quem absorve as taxas de meio de pagamento */
export type FeePolicy = 'company' | 'client' | 'shared';

/** Método de composição de entrada */
export interface EntrySliceInput {
  method: EntryPaymentMethod;
  amount: number;       // valor desejado pelo operador nesta forma
  rate: number;         // taxa % aplicada (ex: 4.99 para cartão)
}

/** Dados de entrada para a estruturação financeira */
export interface StructuringInput {
  // ── Valor e custo ──
  proposalValue: number;          // valor total da proposta (preço base)
  immediateCost: number;          // custo que deve ser coberto ANTES de iniciar
  totalCost: number;              // custo total do projeto

  // ── Meta de caixa ──
  immediateNetTarget: number;     // quanto líquido precisa entrar no dia 0
                                  // (normalmente = immediateCost, mas operador pode ajustar)

  // ── Composição da entrada ──
  entrySlices: EntrySliceInput[]; // ex: [{method:'pix',amount:5000,rate:0},{method:'cartao_vista',amount:3000,rate:2.5}]

  // ── Política de taxa ──
  feePolicy: FeePolicy;          // quem absorve a taxa
  sharedFeeSplit?: number;        // se 'shared', % que a empresa absorve (0-100, default 50)

  // ── Financiamento do saldo ──
  monthlyRate: number;            // taxa comercial interna mensal (%)
  maxTerm: number;                // prazo máximo aceitável (meses)
  frequency: number;              // 1=mensal, 2=bimestral, 3=trimestral

  // ── Capacidade do cliente ──
  clientMonthlyCapacity?: number; // quanto o cliente pode pagar por período
}

// ─── RESULTADO DA ENTRADA ────────────────────────────────────────────────────

export interface EntryComposition {
  slices: EntrySliceDetail[];     // detalhe de cada fatia
  grossTotal: number;             // soma dos valores brutos
  totalFees: number;              // soma das taxas cobradas
  netReceived: number;            // valor líquido que entra na conta
  feePayer: FeePolicy;            // quem absorveu
  clientPaidFees: number;         // quanto o cliente pagou de taxa
  companyAbsorbedFees: number;    // quanto a empresa absorveu de taxa
}

/** Detalhe de cada fatia da entrada */
export interface EntrySliceDetail {
  method: EntryPaymentMethod;
  grossAmount: number;            // valor bruto
  rate: number;                   // taxa %
  feeAmount: number;              // valor da taxa
  netAmount: number;              // valor líquido
}

// ─── RESULTADO DA ESTRUTURAÇÃO ───────────────────────────────────────────────

export interface StructuringResult {
  // ── Entrada ──
  entry: EntryComposition;

  // ── Cobertura de caixa imediato ──
  immediateNetTarget: number;     // meta de caixa líquido
  immediateNetReceived: number;   // quanto realmente entra líquido
  immediateCoverageRatio: number; // netReceived / target (1.0 = cobriu 100%)
  fundingGap: number;             // quanto falta (target - received), 0 se cobriu
  fundingSurplus: number;         // quanto sobra (received - target), 0 se faltou

  // ── Saldo financiável ──
  financedBalance: number;        // quanto do valor da proposta resta para financiar
  financedInstallment: number;    // valor da parcela para financiar o saldo
  financedTerm: number;           // prazo efetivo (meses)
  financedFrequency: number;      // frequência de pagamento

  // ── Aderência à capacidade ──
  clientCapacityUsed: number;     // % da capacidade usada (installment / capacity * 100)
  installmentFitsCapacity: boolean; // parcela cabe no orçamento?

  // ── Política aplicada ──
  financialPolicyApplied: FeePolicy;

  // ── Totais ──
  totalClientPays: number;        // total = entry.grossTotal + parcelas
  effectiveRate: number;          // taxa efetiva considerando tudo

  // ── Alertas ──
  alerts: StructuringAlert[];
}

export interface StructuringAlert {
  type: 'info' | 'warning' | 'danger';
  code: string;
  message: string;
}

// ─── FUNÇÕES PURAS ───────────────────────────────────────────────────────────

/**
 * Calcula os detalhes de cada fatia da entrada.
 * Aplica a política de taxa para determinar quem paga.
 */
export function computeEntryComposition(
  slices: EntrySliceInput[],
  feePolicy: FeePolicy,
  sharedSplit = 50,
): EntryComposition {
  const details: EntrySliceDetail[] = slices.map(s => {
    const feeAmount = s.amount * (s.rate / 100);
    return {
      method: s.method,
      grossAmount: s.amount,
      rate: s.rate,
      feeAmount,
      netAmount: s.amount - feeAmount,
    };
  });

  const grossTotal = details.reduce((sum, d) => sum + d.grossAmount, 0);
  const totalFees = details.reduce((sum, d) => sum + d.feeAmount, 0);
  const netReceived = details.reduce((sum, d) => sum + d.netAmount, 0);

  // Política de absorção
  let clientPaidFees: number;
  let companyAbsorbedFees: number;

  switch (feePolicy) {
    case 'client':
      // Cliente paga todo o spread — o valor bruto já tem a taxa embutida,
      // empresa recebe o líquido como planejado
      clientPaidFees = totalFees;
      companyAbsorbedFees = 0;
      break;
    case 'company':
      // Empresa absorve — o valor bruto é o que o cliente paga,
      // empresa aceita receber menos
      clientPaidFees = 0;
      companyAbsorbedFees = totalFees;
      break;
    case 'shared':
      const companyShare = Math.min(100, Math.max(0, sharedSplit)) / 100;
      companyAbsorbedFees = totalFees * companyShare;
      clientPaidFees = totalFees * (1 - companyShare);
      break;
    default:
      clientPaidFees = 0;
      companyAbsorbedFees = totalFees;
  }

  return {
    slices: details,
    grossTotal,
    totalFees,
    netReceived,
    feePayer: feePolicy,
    clientPaidFees,
    companyAbsorbedFees,
  };
}

/**
 * Calcula o valor bruto necessário em cada fatia para que o líquido
 * atinja exatamente a meta desejada.
 *
 * Útil quando o operador define "preciso receber X líquido" e o sistema
 * calcula quanto cobrar de bruto para cobrir as taxas.
 */
export function computeGrossForNetTarget(
  targetNet: number,
  slices: EntrySliceInput[],
): EntrySliceInput[] {
  if (slices.length === 0) {
    return [{ method: 'pix' as EntryPaymentMethod, amount: targetNet, rate: 0 }];
  }

  const totalWeight = slices.reduce((sum, s) => sum + s.amount, 0);
  if (totalWeight <= 0) return slices;

  return slices.map(s => ({
    ...s,
    amount: (s.amount / totalWeight) * targetNet / (1 - s.rate / 100),
  }));
}

/**
 * Calcula o financiamento do saldo restante.
 * Usa pmt() do financeEngine para calcular parcelas.
 */
export function computeFinancedBalance(
  balance: number,
  monthlyRate: number,
  maxTerm: number,
  frequency: number,
): { installment: number; term: number; totalPaid: number } {
  if (balance <= 0) {
    return { installment: 0, term: 0, totalPaid: 0 };
  }

  // Ajustar taxa para frequência > mensal
  const periodRate = frequency > 1
    ? (Math.pow(1 + monthlyRate / 100, frequency) - 1) * 100
    : monthlyRate;

  const nPayments = Math.ceil(maxTerm / frequency);
  const installment = pmt(periodRate, nPayments, balance);
  const totalPaid = installment * nPayments;

  return { installment, term: nPayments, totalPaid };
}

/**
 * Verifica se a parcela cabe na capacidade de pagamento do cliente.
 */
export function checkCapacityFit(
  installment: number,
  clientCapacity: number | undefined,
): { fits: boolean; usagePercent: number } {
  if (!clientCapacity || clientCapacity <= 0) {
    return { fits: true, usagePercent: 0 }; // sem informação = não restringe
  }
  const usagePercent = (installment / clientCapacity) * 100;
  return {
    fits: installment <= clientCapacity,
    usagePercent: Math.round(usagePercent * 10) / 10,
  };
}

// ─── FUNÇÃO PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Estrutura a operação financeira completa:
 *   1. Calcula composição da entrada (bruto, taxas, líquido)
 *   2. Verifica cobertura da meta de caixa imediato
 *   3. Determina saldo a financiar
 *   4. Calcula parcelas do financiamento
 *   5. Verifica aderência à capacidade do cliente
 *   6. Gera alertas contextuais
 *
 * Uses: financeEngine.pmt() para cálculo de parcelas
 */
export function structurePayment(input: StructuringInput): StructuringResult {
  // ═══ 1. Composição da Entrada ═══
  const entry = computeEntryComposition(
    input.entrySlices,
    input.feePolicy,
    input.sharedFeeSplit,
  );

  // ═══ 2. Cobertura de Caixa Imediato ═══
  const target = input.immediateNetTarget;

  // Se a política é 'client', o cliente paga mais para que empresa receba líquido.
  // Se 'company', empresa absorve. Se 'shared', divide.
  let effectiveNetReceived = entry.netReceived;

  if (input.feePolicy === 'client') {
    // Cliente absorve → empresa recebe o líquido planejado + margem da taxa
    effectiveNetReceived = entry.grossTotal; // empresa recebe tudo menos taxa da operadora
    // Correção: empresa recebe o net da operadora, mas o client pagou grossTotal
    effectiveNetReceived = entry.netReceived;
  }

  const coverageRatio = target > 0 ? effectiveNetReceived / target : 1;
  const gap = Math.max(0, target - effectiveNetReceived);
  const surplus = Math.max(0, effectiveNetReceived - target);

  // ═══ 3. Saldo a Financiar ═══
  const financedBalance = Math.max(0, input.proposalValue - entry.grossTotal);

  // ═══ 4. Financiamento ═══
  const financing = computeFinancedBalance(
    financedBalance,
    input.monthlyRate,
    input.maxTerm,
    input.frequency,
  );

  // ═══ 5. Aderência à Capacidade ═══
  const capacityCheck = checkCapacityFit(
    financing.installment,
    input.clientMonthlyCapacity,
  );

  // ═══ 6. Totais ═══
  const totalClientPays = entry.grossTotal + financing.totalPaid;
  const effectiveRate = totalClientPays > 0 && financedBalance > 0
    ? ((financing.totalPaid / financedBalance) - 1) * 100 / Math.max(financing.term, 1)
    : 0;

  // ═══ 7. Alertas ═══
  const alerts: StructuringAlert[] = [];

  if (gap > 0) {
    alerts.push({
      type: 'danger',
      code: 'IMMEDIATE_CASH_GAP',
      message: `Déficit de caixa imediato: R$ ${gap.toFixed(2)} faltam para cobrir a meta de R$ ${target.toFixed(2)}.`,
    });
  }

  if (surplus > 0 && surplus > target * 0.2) {
    alerts.push({
      type: 'info',
      code: 'IMMEDIATE_CASH_SURPLUS',
      message: `Folga de caixa: R$ ${surplus.toFixed(2)} acima da meta. Pode reduzir a entrada.`,
    });
  }

  if (entry.companyAbsorbedFees > 0) {
    alerts.push({
      type: 'warning',
      code: 'COMPANY_FEE_ABSORPTION',
      message: `A empresa absorve R$ ${entry.companyAbsorbedFees.toFixed(2)} em taxas de meios de pagamento.`,
    });
  }

  if (!capacityCheck.fits && input.clientMonthlyCapacity) {
    alerts.push({
      type: 'danger',
      code: 'INSTALLMENT_EXCEEDS_CAPACITY',
      message: `Parcela R$ ${financing.installment.toFixed(2)} excede capacidade de R$ ${input.clientMonthlyCapacity.toFixed(2)} (${capacityCheck.usagePercent.toFixed(0)}% do orçamento).`,
    });
  }

  if (capacityCheck.fits && capacityCheck.usagePercent > 80) {
    alerts.push({
      type: 'warning',
      code: 'INSTALLMENT_NEAR_CAPACITY',
      message: `Parcela usa ${capacityCheck.usagePercent.toFixed(0)}% da capacidade de pagamento. Margem de segurança baixa.`,
    });
  }

  if (entry.totalFees > entry.grossTotal * 0.05) {
    alerts.push({
      type: 'warning',
      code: 'HIGH_FEE_RATIO',
      message: `Taxas representam ${((entry.totalFees / entry.grossTotal) * 100).toFixed(1)}% da entrada. Considere usar PIX para reduzir.`,
    });
  }

  if (financedBalance <= 0 && entry.grossTotal >= input.proposalValue) {
    alerts.push({
      type: 'info',
      code: 'FULLY_COVERED_BY_ENTRY',
      message: 'Entrada cobre 100% do valor da proposta. Sem necessidade de financiamento.',
    });
  }

  // ═══ Resultado Final ═══
  return {
    entry,
    immediateNetTarget: target,
    immediateNetReceived: effectiveNetReceived,
    immediateCoverageRatio: Math.round(coverageRatio * 1000) / 1000,
    fundingGap: Math.round(gap * 100) / 100,
    fundingSurplus: Math.round(surplus * 100) / 100,
    financedBalance: Math.round(financedBalance * 100) / 100,
    financedInstallment: Math.round(financing.installment * 100) / 100,
    financedTerm: financing.term,
    financedFrequency: input.frequency,
    clientCapacityUsed: capacityCheck.usagePercent,
    installmentFitsCapacity: capacityCheck.fits,
    financialPolicyApplied: input.feePolicy,
    totalClientPays: Math.round(totalClientPays * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    alerts,
  };
}

// ─── HELPER: Criar StructuringInput a partir de WizardInput ──────────────────
// Converte do formato v2 (wizard) para o formato da nova camada,
// permitindo integração gradual sem alterar o wizard.

export function fromWizardInput(wizard: {
  proposalValue: number;
  immediateCost: number;
  totalCost: number;
  cardMachineRate: number;
  correctionIndex: string;
  customRate?: number;
  maxTerm: number;
  monthlyCapacity?: number;
  availableEntry?: number;
  entryMethod?: 'pix' | 'credit_card' | 'mixed';
  cardEntryAmount?: number;
}): StructuringInput {
  // Construir slices da entrada com base no método selecionado
  const entrySlices: EntrySliceInput[] = [];
  const entryTotal = wizard.availableEntry || wizard.immediateCost;

  switch (wizard.entryMethod) {
    case 'credit_card':
      entrySlices.push({
        method: 'cartao_vista',
        amount: entryTotal,
        rate: wizard.cardMachineRate,
      });
      break;
    case 'mixed':
      const cardAmount = wizard.cardEntryAmount || entryTotal * 0.5;
      const pixAmount = entryTotal - cardAmount;
      if (pixAmount > 0) {
        entrySlices.push({ method: 'pix', amount: pixAmount, rate: 0 });
      }
      entrySlices.push({
        method: 'cartao_vista',
        amount: cardAmount,
        rate: wizard.cardMachineRate,
      });
      break;
    case 'pix':
    default:
      entrySlices.push({ method: 'pix', amount: entryTotal, rate: 0 });
      break;
  }

  // Taxa mensal do índice
  const INDEX_RATES: Record<string, number> = { IPCA: 0.38, CDI: 0.87, SELIC: 0.87 };
  const monthlyRate = wizard.correctionIndex === 'fixed'
    ? (wizard.customRate || 0)
    : (INDEX_RATES[wizard.correctionIndex] || 0.87);

  return {
    proposalValue: wizard.proposalValue,
    immediateCost: wizard.immediateCost,
    totalCost: wizard.totalCost,
    immediateNetTarget: wizard.immediateCost, // default: meta = custo imediato
    entrySlices,
    feePolicy: 'company', // default: empresa absorve
    monthlyRate,
    maxTerm: wizard.maxTerm || 24,
    frequency: 1,          // default: mensal
    clientMonthlyCapacity: wizard.monthlyCapacity,
  };
}
