// ─── Finance Simulator — Engine ──────────────────────────────────────────────
import type {
    SimInputs, Condition, CashFlowRow, EntryPaymentSlice,
    BilateralScore, SensitivityScenario, AnnualBlock,
} from './financeTypes';
import { INDEX_RATES, fmt, getCommercialName } from './financeTypes';

// ─── Financial Primitives ────────────────────────────────────────────────────
export const pmt = (rate: number, nper: number, pv: number): number => {
    if (nper <= 0 || pv <= 0) return 0;
    if (rate === 0) return pv / nper;
    const factor = Math.pow(1 + rate / 100, nper);
    return (pv * (rate / 100) * factor) / (factor - 1);
};

export const nper = (rate: number, pmtVal: number, pv: number): number => {
    if (pv <= 0 || pmtVal <= 0) return 0;
    if (rate === 0) return Math.ceil(pv / pmtVal);
    const r = rate / 100;
    if (pmtVal <= pv * r) return Infinity;
    return Math.ceil(-Math.log(1 - (pv * r) / pmtVal) / Math.log(1 + r));
};

// NPV — Valor Presente Líquido
export const npv = (rate: number, cashFlows: CashFlowRow[]): number => {
    const r = rate / 100;
    return cashFlows.reduce((acc, cf) => acc + cf.value / Math.pow(1 + r, cf.month), 0);
};

// ─── Cash Flow Builders ──────────────────────────────────────────────────────
export const buildIntercaladaCashFlow = (
    entry: number, installment: number, nPayments: number,
    interval: number, cost: number,
): CashFlowRow[] => {
    const rows: CashFlowRow[] = [];
    let cum = -cost;
    cum += entry;
    rows.push({ month: 0, value: entry, cumulative: cum });
    for (let i = 1; i <= nPayments; i++) {
        const m = i * interval;
        cum += installment;
        rows.push({ month: m, value: installment, cumulative: cum });
    }
    return rows;
};

export const buildCashFlow = (
    entry: number, installment: number, n: number, cost: number,
) => buildIntercaladaCashFlow(entry, installment, n, 1, cost);

const buildFlowComIntercaladas = (
    entry: number, installment: number, n: number, cost: number,
    extraMonths: number[], extraValue: number,
): CashFlowRow[] => {
    const rows: CashFlowRow[] = [];
    let cum = -cost;
    cum += entry;
    rows.push({ month: 0, value: entry, cumulative: cum });
    for (let i = 1; i <= n; i++) {
        let val = installment;
        if (extraMonths.includes(i)) val += extraValue;
        cum += val;
        rows.push({ month: i, value: val, cumulative: cum });
    }
    return rows;
};

// ─── Cash Flow com Reajuste Anual ────────────────────────────────────────────
const buildCashFlowWithReadjust = (
    entry: number, saldoDevedor: number, nMonths: number,
    baseRate: number, cost: number,
): { cashFlow: CashFlowRow[]; annualBlocks: AnnualBlock[] } => {
    const rows: CashFlowRow[] = [];
    const blocks: AnnualBlock[] = [];
    let cum = -cost;
    cum += entry;
    rows.push({ month: 0, value: entry, cumulative: cum });

    if (nMonths <= 12) {
        const inst = pmt(baseRate, nMonths, saldoDevedor);
        blocks.push({ yearStart: 1, yearEnd: nMonths, installmentAmount: inst, monthlyRate: baseRate });
        for (let m = 1; m <= nMonths; m++) {
            cum += inst;
            rows.push({ month: m, value: inst, cumulative: cum });
        }
    } else {
        let remaining = saldoDevedor;
        let currentRate = baseRate;
        let monthsDone = 0;

        while (monthsDone < nMonths) {
            const blockMonths = Math.min(12, nMonths - monthsDone);
            const totalRemaining = nMonths - monthsDone;
            const inst = pmt(currentRate, totalRemaining, remaining);

            blocks.push({
                yearStart: monthsDone + 1,
                yearEnd: monthsDone + blockMonths,
                installmentAmount: inst,
                monthlyRate: currentRate,
            });

            for (let m = 1; m <= blockMonths; m++) {
                const interest = remaining * (currentRate / 100);
                const principal = inst - interest;
                remaining -= principal;
                cum += inst;
                rows.push({ month: monthsDone + m, value: inst, cumulative: cum });
            }

            monthsDone += blockMonths;
            // Reajuste anual: acumula 12 meses de índice
            if (monthsDone < nMonths) {
                currentRate = currentRate * Math.pow(1 + baseRate / 100, 0.3); // reajuste ~30% do acumulado
            }
        }
    }

    return { cashFlow: rows, annualBlocks: blocks };
};

// ─── Composição Mista de Entrada ─────────────────────────────────────────────
export const calcEntryMix = (slices: EntryPaymentSlice[]): { totalBruto: number; totalLiquido: number } => {
    let totalBruto = 0;
    let totalLiquido = 0;
    for (const s of slices) {
        totalBruto += s.amount;
        totalLiquido += s.amount * (1 - s.taxa / 100);
    }
    return { totalBruto, totalLiquido };
};

// Calcula quanto cobrar de bruto para que o líquido cubra um valor alvo
export const calcBrutoParaLiquido = (liquidoAlvo: number, slices: EntryPaymentSlice[]): EntryPaymentSlice[] => {
    if (slices.length === 0) return [{ method: 'pix', amount: liquidoAlvo, taxa: 0 }];

    const totalProporcional = slices.reduce((s, sl) => s + sl.amount, 0);
    if (totalProporcional <= 0) return slices;

    return slices.map(s => ({
        ...s,
        amount: (s.amount / totalProporcional) * liquidoAlvo / (1 - s.taxa / 100),
    }));
};

// ─── Antecipação Helper ──────────────────────────────────────────────────────
const calcComAntecipacao = (
    lucroBase: number, nTotal: number, rateNormal: number,
    nAntecipadas: number, descontoPct: number,
) => {
    if (nAntecipadas <= 0 || nAntecipadas >= nTotal) {
        const inst = pmt(rateNormal, nTotal, lucroBase);
        return { installment: inst, totalParcelas: inst * nTotal, descAntecipadoAmt: 0 };
    }
    const rateDesconto = rateNormal * (1 - descontoPct / 100);
    const instNormal = pmt(rateNormal, nTotal, lucroBase);
    const instDesconto = pmt(rateDesconto, nTotal, lucroBase);
    const economia = (instNormal - instDesconto) * nAntecipadas;
    const totalParcelas = instNormal * nTotal - economia;
    return { installment: instNormal, totalParcelas, descAntecipadoAmt: economia };
};

// ─── Análise de Sensibilidade ────────────────────────────────────────────────
const calcSensitivity = (
    condition: Condition, baseRate: number, custoTotal: number,
): SensitivityScenario[] => {
    if (condition.type === 'avista' || condition.installments <= 0) return [];

    const scenarios: { label: string; mult: number }[] = [
        { label: 'Otimista (+30%)', mult: 1.3 },
        { label: 'Base', mult: 1.0 },
        { label: 'Pessimista (-30%)', mult: 0.7 },
    ];

    return scenarios.map(s => {
        const adjRate = baseRate * s.mult;
        const newInst = pmt(adjRate, condition.installments, condition.totalClient - condition.entry);
        const newTotal = condition.entry + newInst * condition.installments;
        const newProfit = newTotal - custoTotal;
        return {
            label: s.label,
            indexMultiplier: s.mult,
            totalProfit: newProfit,
            effectiveMargin: newTotal > 0 ? (newProfit / newTotal) * 100 : 0,
        };
    });
};

// ─── Score Bilateral ─────────────────────────────────────────────────────────
export function bilateralScore(
    c: Condition,
    allConditions: Condition[],
    orcamentoMensal: number,
    entradaDisponivel: number,
    margemMinima: number,
    pesoCliente: number, // 0-1
    discountRate: number,
): BilateralScore {
    const reasons: string[] = [];
    const peso = Math.max(0, Math.min(1, pesoCliente));

    // ── Eixo do Cliente (0–75 pts brutos, normalizado a 100) ──
    let scoreCliente = 0;

    // Parcela cabe no orçamento (0–30)
    if (orcamentoMensal > 0 && c.installmentAmount > 0) {
        if (c.installmentAmount <= orcamentoMensal) {
            const folga = 1 - (c.installmentAmount / orcamentoMensal);
            scoreCliente += 30 - folga * 10;
            reasons.push(`Parcela R$ ${fmt(c.installmentAmount)} dentro do orçamento`);
        } else if (c.installmentAmount <= orcamentoMensal * 1.1) {
            scoreCliente += 5;
        } else {
            scoreCliente -= 20;
        }
    } else if (c.type === 'avista' && orcamentoMensal === 0) {
        scoreCliente += 25;
    }

    // Entrada cabe no disponível (0–20)
    if (entradaDisponivel > 0 && c.entry > 0) {
        if (c.entry <= entradaDisponivel) {
            scoreCliente += 20;
            reasons.push(`Entrada R$ ${fmt(c.entry)} dentro do disponível`);
        } else {
            scoreCliente -= (c.entry - entradaDisponivel) / entradaDisponivel * 15;
        }
    } else if (c.entry === 0) {
        scoreCliente += 15;
    }

    // Menor custo total (0–15, normalizado)
    if (allConditions.length > 1) {
        const totals = allConditions.map(cc => cc.totalClient).filter(t => t > 0);
        const minTotal = Math.min(...totals);
        const maxTotal = Math.max(...totals);
        if (maxTotal > minTotal) {
            const norm = 1 - (c.totalClient - minTotal) / (maxTotal - minTotal);
            scoreCliente += norm * 15;
        }
    }

    // Menos meses = melhor (0–10)
    if (c.installments > 0) {
        const maxMonths = 60;
        const norm = Math.max(0, 1 - c.installments / maxMonths);
        scoreCliente += norm * 10;
    } else {
        scoreCliente += 10; // à vista
    }

    // ── Eixo do Prestador (0–75 pts brutos, normalizado a 100) ──
    let scorePrestador = 0;

    // Juros comerciais capturados (0–25, normalizado)
    if (allConditions.length > 1) {
        const corrections = allConditions.map(cc => cc.correctionAmount).filter(c => c > 0);
        if (corrections.length > 0) {
            const maxCorr = Math.max(...corrections);
            if (maxCorr > 0) {
                const norm = c.correctionAmount / maxCorr;
                scorePrestador += norm * 25;
                if (norm > 0.7) reasons.push(`Juros comerciais elevados: R$ ${fmt(c.correctionAmount)}`);
            }
        }
    }

    // Margem efetiva acima da mínima (0–20)
    if (c.effectiveMargin >= margemMinima) {
        const acima = c.effectiveMargin - margemMinima;
        scorePrestador += Math.min(20, Math.floor(acima / 5) * 5);
        if (acima >= 10) reasons.push(`Margem ${c.effectiveMargin.toFixed(1)}% (${acima.toFixed(0)}% acima do mínimo)`);
    } else {
        scorePrestador -= 30; // penalização forte
    }

    // VPL do fluxo (0–15, normalizado)
    if (c.cashFlow.length > 1 && allConditions.length > 1) {
        const vpls = allConditions
            .filter(cc => cc.cashFlow.length > 1)
            .map(cc => npv(discountRate, cc.cashFlow));
        const maxVpl = Math.max(...vpls);
        const minVpl = Math.min(...vpls);
        if (maxVpl > minVpl) {
            const myVpl = npv(discountRate, c.cashFlow);
            const norm = (myVpl - minVpl) / (maxVpl - minVpl);
            scorePrestador += norm * 15;
        }
    }

    // Risco por prazo (0–15, penaliza >24m)
    if (c.installments <= 12) {
        scorePrestador += 15;
    } else if (c.installments <= 24) {
        scorePrestador += 10;
    } else if (c.installments <= 36) {
        scorePrestador += 5;
    } else {
        scorePrestador -= (c.installments - 36) * 0.5;
    }

    // Normaliza para 0–100
    const normCliente = Math.max(0, Math.min(100, scoreCliente * (100 / 75)));
    const normPrestador = Math.max(0, Math.min(100, scorePrestador * (100 / 75)));
    const scoreTotal = normCliente * peso + normPrestador * (1 - peso);

    return {
        scoreCliente: normCliente,
        scorePrestador: normPrestador,
        scoreTotal,
        pesoCliente: peso,
        reasons,
    };
}

// ─── Tags Visuais ────────────────────────────────────────────────────────────
function assignTags(conditions: Condition[]): void {
    if (conditions.length === 0) return;

    const withInstallments = conditions.filter(c => c.installmentAmount > 0);
    const withMargin = conditions.filter(c => c.effectiveMargin > 0);

    // Menor parcela
    if (withInstallments.length > 0) {
        const minParcela = withInstallments.reduce((a, b) => a.installmentAmount < b.installmentAmount ? a : b);
        if (!minParcela.tags) minParcela.tags = [];
        minParcela.tags.push({ type: 'menor_parcela', label: 'Menor Parcela', emoji: '🏷️' });
    }

    // Maior margem
    if (withMargin.length > 0) {
        const maxMargem = withMargin.reduce((a, b) => a.effectiveMargin > b.effectiveMargin ? a : b);
        if (!maxMargem.tags) maxMargem.tags = [];
        maxMargem.tags.push({ type: 'maior_margem', label: 'Maior Margem', emoji: '📈' });
    }

    // Menor prazo (excluindo à vista)
    if (withInstallments.length > 0) {
        const minPrazo = withInstallments.reduce((a, b) => a.installments < b.installments ? a : b);
        if (!minPrazo.tags) minPrazo.tags = [];
        minPrazo.tags.push({ type: 'menor_prazo', label: 'Menor Prazo', emoji: '⚡' });
    }

    // Menor custo total
    const minCusto = conditions.reduce((a, b) => a.totalClient < b.totalClient ? a : b);
    if (!minCusto.tags) minCusto.tags = [];
    minCusto.tags.push({ type: 'menor_custo', label: 'Menor Custo Total', emoji: '💰' });

    // Equilíbrio ideal (melhor score bilateral, se existir)
    const withScore = conditions.filter(c => c.bilateralScore);
    if (withScore.length > 0) {
        const best = withScore.reduce((a, b) =>
            (a.bilateralScore?.scoreTotal ?? 0) > (b.bilateralScore?.scoreTotal ?? 0) ? a : b);
        if (!best.tags) best.tags = [];
        best.tags.push({ type: 'equilibrio', label: 'Equilíbrio Ideal', emoji: '⚖️' });
    }
}

// ─── MAIN SIMULATE ───────────────────────────────────────────────────────────
export function simulate(inputs: SimInputs): Condition[] {
    const rate = inputs.correctionIndex === 'fixed'
        ? inputs.customRate
        : INDEX_RATES[inputs.correctionIndex] ?? 0.87;

    const qty = inputs.quantity;
    const custoImediato = inputs.custoImediato;
    const custoTotal = inputs.custoTotal * qty;
    const marginFactor = 1 - inputs.profitMargin / 100;
    const basePrice = custoTotal / marginFactor;
    const grossProfit = basePrice - custoTotal;

    // Composição de entrada
    const { totalBruto: entryBruto, totalLiquido: entryLiquido } = calcEntryMix(inputs.entryPayments);
    const entradaUsada = entryBruto > 0 ? entryBruto : custoImediato;
    // entradaLiquida calculated in mkCondition via entryLiquido

    // Meses intercaladas
    const mesesIntercalada = inputs.intercaladaEnabled
        ? inputs.intercaladaMeses.split(',').map(s => parseInt(s.trim())).filter(n => n > 0)
        : [];

    const conditions: Condition[] = [];

    // Helper: criar condição com campos novos
    const mkCondition = (
        base: Omit<Condition, 'commercialName' | 'entryLiquido' | 'frequency' | 'tags' | 'sensitivity' | 'bilateralScore' | 'annualBlocks'>,
        freq = 1,
    ): Condition => ({
        ...base,
        commercialName: getCommercialName(base.id, base.type),
        entryLiquido: base.entry > 0 ? (entryLiquido > 0 ? entryLiquido : base.entry) : 0,
        entryBreakdown: base.entry > 0 ? inputs.entryPayments : undefined,
        frequency: freq,
        tags: [],
    });

    // ── 1. À Vista ──────────────────────────────────────────────────────────
    const avistaProfitAfterDiscount = grossProfit * (1 - inputs.atSightDiscount / 100);
    const aVistaTotal = custoTotal + avistaProfitAfterDiscount;
    const avistaMargin = aVistaTotal > 0 ? (avistaProfitAfterDiscount / aVistaTotal) * 100 : 0;
    conditions.push(mkCondition({
        id: 'avista', type: 'avista', label: 'À Vista',
        detail: `Pagamento integral com ${inputs.atSightDiscount}% de desconto especial`,
        entry: aVistaTotal, installmentAmount: 0, installments: 0,
        totalClient: aVistaTotal, costRecovered: custoTotal,
        totalProfit: avistaProfitAfterDiscount, immediateProfit: avistaProfitAfterDiscount,
        deferredProfit: 0, effectiveMargin: avistaMargin, correctionAmount: 0,
        cashFlow: buildCashFlow(aVistaTotal, 0, 0, custoTotal),
    }));

    // ── 2. Entrada (custo) + Parcelas do Lucro ──────────────────────────────
    const entradaBaseValor = Math.max(entradaUsada, custoImediato);
    const entradaLabel = inputs.entryPayments.length > 0
        ? `Entrada mista R$ ${fmt(entradaBaseValor)}`
        : `Entrada R$ ${fmt(entradaBaseValor)}`;

    for (const n of [3, 6, 10, 12]) {
        const { installment, totalParcelas } = calcComAntecipacao(
            grossProfit, n, rate, inputs.parcelasAntecipadas, inputs.descontoAntecipacao,
        );
        const totalPaid = entradaBaseValor + totalParcelas;

        let intercaladaTotal = 0;
        const extras: { month: number; value: number }[] = [];
        if (inputs.intercaladaEnabled && mesesIntercalada.length > 0) {
            for (const m of mesesIntercalada) {
                if (m <= n) { intercaladaTotal += inputs.intercaladaValor; extras.push({ month: m, value: inputs.intercaladaValor }); }
            }
        }

        const totalFinal = totalPaid + intercaladaTotal;
        const totalProfit = totalFinal - custoTotal;
        const correctionAmt = totalFinal - basePrice;
        const detail = [
            entradaLabel, `${n}x de R$ ${fmt(installment)}`,
            inputs.parcelasAntecipadas > 0 ? `(${inputs.parcelasAntecipadas} antecipadas c/ desc.)` : '',
            extras.length > 0 ? `+ ${extras.length} intercalada(s)` : '',
        ].filter(Boolean).join(' • ');

        conditions.push(mkCondition({
            id: `entrada_${n}`, type: 'entrada', label: `Entrada + ${n}x`, detail,
            entry: entradaBaseValor, installmentAmount: installment, installments: n,
            totalClient: totalFinal, costRecovered: custoTotal, totalProfit,
            immediateProfit: Math.max(0, entradaBaseValor - custoTotal),
            deferredProfit: totalParcelas + intercaladaTotal,
            effectiveMargin: totalFinal > 0 ? (totalProfit / totalFinal) * 100 : 0,
            correctionAmount: correctionAmt > 0 ? correctionAmt : 0,
            cashFlow: buildFlowComIntercaladas(entradaBaseValor, installment, n, custoTotal,
                extras.map(e => e.month), extras.length > 0 ? inputs.intercaladaValor : 0),
            intercaladaExtra: extras.length > 0 ? extras : undefined,
        }));
    }

    // ── 3. Tabela Price ─────────────────────────────────────────────────────
    for (const n of [6, 10, 12, 18, 24]) {
        const useReadjust = n > 12;
        let cashFlow: CashFlowRow[];
        let annualBlocks: AnnualBlock[] | undefined;
        let installment: number;
        let totalPaid: number;

        if (useReadjust) {
            const result = buildCashFlowWithReadjust(0, basePrice, n, rate, custoTotal);
            cashFlow = result.cashFlow;
            annualBlocks = result.annualBlocks;
            installment = result.annualBlocks[0]?.installmentAmount ?? pmt(rate, n, basePrice);
            totalPaid = cashFlow.reduce((s, r) => s + r.value, 0);
        } else {
            installment = pmt(rate, n, basePrice);
            totalPaid = installment * n;
            cashFlow = buildCashFlow(0, installment, n, custoTotal);
        }

        const totalProfit = totalPaid - custoTotal;
        const cond = mkCondition({
            id: `price_${n}`, type: 'total', label: `Tabela Price ${n}x`,
            detail: `Parcelamento integral • Correção ${rate}% a.m.${useReadjust ? ' • Com reajuste anual' : ''}`,
            entry: 0, installmentAmount: installment, installments: n,
            totalClient: totalPaid, costRecovered: custoTotal, totalProfit,
            immediateProfit: 0, deferredProfit: totalProfit,
            effectiveMargin: totalPaid > 0 ? (totalProfit / totalPaid) * 100 : 0,
            correctionAmount: totalPaid - basePrice, cashFlow,
        });
        if (annualBlocks) cond.annualBlocks = annualBlocks;
        conditions.push(cond);
    }

    // ── 4. Leasing ──────────────────────────────────────────────────────────
    const leasingRate = rate + inputs.leasingSpread;
    for (const months of [12, 24, 36]) {
        const useReadjust = months > 12;
        let cashFlow: CashFlowRow[];
        let annualBlocks: AnnualBlock[] | undefined;
        let monthly: number;
        let totalPaid: number;

        if (useReadjust) {
            const result = buildCashFlowWithReadjust(0, basePrice, months, leasingRate, custoTotal);
            cashFlow = result.cashFlow;
            annualBlocks = result.annualBlocks;
            monthly = result.annualBlocks[0]?.installmentAmount ?? pmt(leasingRate, months, basePrice);
            totalPaid = cashFlow.reduce((s, r) => s + r.value, 0);
        } else {
            monthly = pmt(leasingRate, months, basePrice);
            totalPaid = monthly * months;
            cashFlow = buildCashFlow(0, monthly, months, custoTotal);
        }

        const totalProfit = totalPaid - custoTotal;
        const cond = mkCondition({
            id: `leasing_${months}`, type: 'leasing', label: `Leasing ${months}m`,
            detail: `Mensalidade fixa • ${leasingRate.toFixed(2)}% a.m.${useReadjust ? ' • Com reajuste anual' : ''}`,
            entry: 0, installmentAmount: monthly, installments: months,
            totalClient: totalPaid, costRecovered: custoTotal, totalProfit,
            immediateProfit: 0, deferredProfit: totalProfit,
            effectiveMargin: totalPaid > 0 ? (totalProfit / totalPaid) * 100 : 0,
            correctionAmount: totalPaid - basePrice, cashFlow,
        });
        if (annualBlocks) cond.annualBlocks = annualBlocks;
        conditions.push(cond);
    }

    // ── 5. Personalizado ────────────────────────────────────────────────────
    const minEntry = custoImediato;
    const safeEntry = Math.max(inputs.customEntry, minEntry);
    const remaining = basePrice - safeEntry;
    const n = inputs.customInstallments;
    const customInstallment = remaining <= 0 ? 0 : pmt(rate, n, remaining);
    const customTotal = safeEntry + customInstallment * n;
    const customProfit = customTotal - custoTotal;
    conditions.push(mkCondition({
        id: 'personalizado', type: 'personalizado', label: 'Personalizado',
        detail: `Entrada R$ ${fmt(safeEntry)} + ${n}x de R$ ${fmt(customInstallment)}`,
        entry: safeEntry, installmentAmount: customInstallment, installments: n,
        totalClient: customTotal, costRecovered: Math.min(safeEntry, custoTotal),
        totalProfit: customProfit, immediateProfit: Math.max(0, safeEntry - custoTotal),
        deferredProfit: customInstallment * n,
        effectiveMargin: customTotal > 0 ? (customProfit / customTotal) * 100 : 0,
        correctionAmount: customTotal - basePrice,
        cashFlow: buildCashFlow(safeEntry, customInstallment, n, custoTotal),
    }));

    // ── 6. Antecipação + Intercaladas ───────────────────────────────────────
    if (inputs.parcelasAntecipadas > 0 || (inputs.intercaladaEnabled && mesesIntercalada.length > 0)) {
        for (const nParcelas of [6, 10, 12]) {
            const rateDesc = rate * (1 - inputs.descontoAntecipacao / 100);
            const nAntec = Math.min(inputs.parcelasAntecipadas, nParcelas);
            const nNormal = nParcelas - nAntec;
            const instNormal = pmt(rate, nParcelas, grossProfit);
            const instDesc = pmt(rateDesc, nParcelas, grossProfit);
            const totalParcelas = instDesc * nAntec + instNormal * nNormal;

            let intercTotal = 0;
            const extras: { month: number; value: number }[] = [];
            if (inputs.intercaladaEnabled) {
                for (const m of mesesIntercalada) {
                    if (m <= nParcelas) { intercTotal += inputs.intercaladaValor; extras.push({ month: m, value: inputs.intercaladaValor }); }
                }
            }

            const totalCliente = entradaBaseValor + totalParcelas + intercTotal;
            const lucro = totalCliente - custoTotal;
            const detalhes = [
                entradaLabel,
                nAntec > 0 ? `${nAntec} antecipadas de R$ ${fmt(instDesc)}` : '',
                nNormal > 0 ? `${nNormal}x de R$ ${fmt(instNormal)}` : '',
                extras.length > 0 ? `+ ${extras.length} intercalada(s) de R$ ${fmt(inputs.intercaladaValor)}` : '',
            ].filter(Boolean).join(' • ');

            conditions.push(mkCondition({
                id: `antec_${nParcelas}`, type: 'antecipacao', label: `Antecipação ${nAntec}+${nNormal}x`,
                detail: detalhes, entry: entradaBaseValor, installmentAmount: instNormal,
                installments: nParcelas, totalClient: totalCliente, costRecovered: custoTotal,
                totalProfit: lucro, immediateProfit: Math.max(0, entradaBaseValor - custoTotal),
                deferredProfit: totalParcelas + intercTotal,
                effectiveMargin: totalCliente > 0 ? (lucro / totalCliente) * 100 : 0,
                correctionAmount: Math.max(0, totalCliente - basePrice),
                cashFlow: buildFlowComIntercaladas(entradaBaseValor, instNormal, nParcelas, custoTotal,
                    extras.map(e => e.month), extras.length > 0 ? inputs.intercaladaValor : 0),
                intercaladaExtra: extras.length > 0 ? extras : undefined,
            }));
        }
    }

    // ── 7. Capacidade de Pagamento ──────────────────────────────────────────
    if (inputs.capacidadeEnabled && inputs.capacidadeMaxParcela > 0) {
        const maxPmt = inputs.capacidadeMaxParcela;
        const entradaCusto = entradaBaseValor;
        const lucroParcelar = grossProfit;
        const intervalo = Math.max(1, inputs.capacidadeIntercalada || 1);
        const taxaNormal = rate;
        const taxaCartao = inputs.capacidadeCartao ? inputs.capacidadeTaxaCartao : rate;

        const geraCapacidade = (
            id: string, label: string, detail: string,
            usedRate: number, intervaloMeses: number,
        ) => {
            const taxaPeriodo = intervaloMeses > 1
                ? (Math.pow(1 + usedRate / 100, intervaloMeses) - 1) * 100
                : usedRate;
            const nPagamentos = nper(taxaPeriodo, maxPmt, lucroParcelar);
            if (nPagamentos <= 0 || nPagamentos > 360) return;

            const realParcela = pmt(taxaPeriodo, nPagamentos, lucroParcelar);
            const totalParcelas = realParcela * nPagamentos;

            let intercTotal = 0;
            const extras: { month: number; value: number }[] = [];
            if (inputs.intercaladaEnabled) {
                const duracaoMeses = nPagamentos * intervaloMeses;
                for (const m of mesesIntercalada) {
                    if (m <= duracaoMeses) { intercTotal += inputs.intercaladaValor; extras.push({ month: m, value: inputs.intercaladaValor }); }
                }
            }

            const totalCliente = entradaCusto + totalParcelas + intercTotal;
            const correcao = totalParcelas - lucroParcelar;

            conditions.push(mkCondition({
                id, type: 'capacidade', label, detail,
                entry: entradaCusto, installmentAmount: realParcela, installments: nPagamentos,
                totalClient: totalCliente, costRecovered: custoTotal,
                totalProfit: totalParcelas + intercTotal,
                immediateProfit: Math.max(0, entradaCusto - custoTotal),
                deferredProfit: totalParcelas + intercTotal,
                effectiveMargin: totalCliente > 0 ? ((totalParcelas + intercTotal) / totalCliente) * 100 : 0,
                correctionAmount: correcao,
                cashFlow: buildIntercaladaCashFlow(entradaCusto, realParcela, nPagamentos, intervaloMeses, custoTotal),
                intercaladaExtra: extras.length > 0 ? extras : undefined,
            }, intervaloMeses));
        };

        geraCapacidade('cap_mensal', 'Capacidade Mensal',
            `Entrada R$ ${fmt(entradaCusto)} + parcelas ≤ R$ ${fmt(maxPmt)} • ${taxaNormal}% a.m.`,
            taxaNormal, 1);

        if (intervalo > 1) {
            const nome = intervalo === 2 ? 'Bimestral' : intervalo === 3 ? 'Trimestral' : `A cada ${intervalo}m`;
            const txPer = (Math.pow(1 + taxaNormal / 100, intervalo) - 1) * 100;
            geraCapacidade(`cap_intercalada_${intervalo}`, `Capacidade ${nome}`,
                `Entrada R$ ${fmt(entradaCusto)} + parcelas ≤ R$ ${fmt(maxPmt)} a cada ${intervalo}m • ${txPer.toFixed(2)}% p/ período`,
                taxaNormal, intervalo);
        }

        if (inputs.capacidadeCartao) {
            geraCapacidade('cap_cartao_mensal', 'Cartão Mensal',
                `Entrada R$ ${fmt(entradaCusto)} + cartão ≤ R$ ${fmt(maxPmt)} • ${taxaCartao}% a.m.`,
                taxaCartao, 1);
            if (intervalo > 1) {
                const nome = intervalo === 2 ? 'Bimestral' : intervalo === 3 ? 'Trimestral' : `A cada ${intervalo}m`;
                const txPer = (Math.pow(1 + taxaCartao / 100, intervalo) - 1) * 100;
                geraCapacidade(`cap_cartao_intercalada_${intervalo}`, `Cartão ${nome}`,
                    `Entrada R$ ${fmt(entradaCusto)} + cartão a cada ${intervalo}m ≤ R$ ${fmt(maxPmt)} • ${txPer.toFixed(2)}% p/ período`,
                    taxaCartao, intervalo);
            }
        }
    }

    // ── Filtrar margem mínima ───────────────────────────────────────────────
    const minMargin = inputs.margemMinima;
    const filtered = conditions.filter(c => c.effectiveMargin >= minMargin || c.type === 'avista');

    // ── Verificar cobertura de custo imediato ───────────────────────────────
    // (à vista sempre cobre; nos outros, entry >= custoImediato)
    // Marcar condições que não cobrem
    for (const c of filtered) {
        if (c.type !== 'avista' && c.entryLiquido < custoImediato && c.entry < custoImediato) {
            c.detail = `⚠️ Custo imediato não coberto • ${c.detail}`;
        }
    }

    // ── Sensibilidade ───────────────────────────────────────────────────────
    for (const c of filtered) {
        c.sensitivity = calcSensitivity(c, rate, custoTotal);
    }

    // ── Score Bilateral ─────────────────────────────────────────────────────
    const pesoCliente = (inputs.scorePesoCliente ?? 50) / 100;
    for (const c of filtered) {
        c.bilateralScore = bilateralScore(
            c, filtered,
            inputs.perfilOrcamentoMensal || inputs.reversoMaxParcela || 0,
            inputs.perfilEntradaDisponivel || inputs.reversoEntradaDisponivel || 0,
            inputs.margemMinima, pesoCliente, rate,
        );
    }

    // ── Tags visuais ────────────────────────────────────────────────────────
    assignTags(filtered);

    return filtered;
}

// ─── MOTOR DE SIMULAÇÃO REVERSA ──────────────────────────────────────────────
export function reverseSimulate(inputs: SimInputs): Condition[] {
    if (!inputs.reversoEnabled) return [];

    const maxParcela = inputs.reversoMaxParcela;
    const entradaDisp = inputs.reversoEntradaDisponivel;
    const custoImediato = inputs.custoImediato;
    const custoTotal = inputs.custoTotal * inputs.quantity;
    const marginFactor = 1 - inputs.profitMargin / 100;
    const basePrice = custoTotal / marginFactor;
    const margemMin = inputs.margemMinima;
    const aceitaIntercaladas = inputs.reversoAceitaIntercaladas;

    if (maxParcela <= 0) return [];

    // Determinar entrada
    const entradaBruta = Math.max(entradaDisp, custoImediato);

    const indices: { name: string; rate: number }[] = [
        { name: inputs.correctionIndex === 'fixed' ? 'Fixa' : inputs.correctionIndex, rate: inputs.correctionIndex === 'fixed' ? inputs.customRate : INDEX_RATES[inputs.correctionIndex] ?? 0.87 },
    ];

    const frequencias: { freq: number; nome: string }[] = [
        { freq: 1, nome: 'Mensal' },
        { freq: 2, nome: 'Bimestral' },
        { freq: 3, nome: 'Trimestral' },
    ];

    const intercaladaOpcoes = aceitaIntercaladas
        ? [
            { enabled: false, meses: '', valor: 0, label: 'Sem' },
            { enabled: true, meses: '6', valor: maxParcela * 0.5, label: 'Reforço 6m (50%)' },
            { enabled: true, meses: '6,12', valor: maxParcela, label: 'Reforço 6+12m (100%)' },
            { enabled: true, meses: '6,12', valor: maxParcela * 1.5, label: 'Reforço 6+12m (150%)' },
        ]
        : [{ enabled: false, meses: '', valor: 0, label: 'Sem' }];

    const results: Condition[] = [];

    for (const idx of indices) {
        for (const freq of frequencias) {
            for (const interc of intercaladaOpcoes) {
                // Varredura de prazo: 3 a 60 meses
                for (let prazo = 3; prazo <= 60; prazo += (prazo < 12 ? 1 : prazo < 24 ? 2 : 3)) {
                    const taxaPeriodo = freq.freq > 1
                        ? (Math.pow(1 + idx.rate / 100, freq.freq) - 1) * 100
                        : idx.rate;

                    const nPagamentos = Math.ceil(prazo / freq.freq);
                    const saldoDevedor = basePrice - entradaBruta;
                    if (saldoDevedor <= 0) continue;

                    const parcela = pmt(taxaPeriodo, nPagamentos, saldoDevedor);
                    if (parcela > maxParcela || parcela <= 0) continue;

                    // Intercaladas
                    let intercTotal = 0;
                    const extras: { month: number; value: number }[] = [];
                    if (interc.enabled) {
                        const meses = interc.meses.split(',').map(s => parseInt(s.trim())).filter(m => m > 0 && m <= prazo);
                        for (const m of meses) {
                            intercTotal += interc.valor;
                            extras.push({ month: m, value: interc.valor });
                        }
                    }

                    const totalPaid = entradaBruta + parcela * nPagamentos + intercTotal;
                    const totalProfit = totalPaid - custoTotal;
                    const effectiveMargin = totalPaid > 0 ? (totalProfit / totalPaid) * 100 : 0;

                    if (effectiveMargin < margemMin) continue;

                    const id = `rev_${idx.name}_${freq.freq}_${prazo}_${interc.label.substring(0, 3)}`;
                    const detail = [
                        `Entrada R$ ${fmt(entradaBruta)}`,
                        `${nPagamentos}x de R$ ${fmt(parcela)} (${freq.nome.toLowerCase()})`,
                        extras.length > 0 ? `+ ${extras.length} reforço(s)` : '',
                        `• ${idx.name} ${idx.rate}% a.m.`,
                    ].filter(Boolean).join(' • ');

                    const cond: Condition = {
                        id,
                        type: 'capacidade',
                        label: `${freq.nome} ${prazo}m`,
                        commercialName: getCommercialName(id, 'capacidade'),
                        detail,
                        entry: entradaBruta,
                        entryLiquido: entradaBruta * (1 - (inputs.entryPayments[0]?.taxa ?? 0) / 100),
                        installmentAmount: parcela,
                        installments: nPagamentos,
                        frequency: freq.freq,
                        totalClient: totalPaid,
                        costRecovered: custoTotal,
                        totalProfit,
                        immediateProfit: Math.max(0, entradaBruta - custoTotal),
                        deferredProfit: parcela * nPagamentos + intercTotal,
                        effectiveMargin,
                        correctionAmount: Math.max(0, totalPaid - basePrice),
                        cashFlow: buildIntercaladaCashFlow(entradaBruta, parcela, nPagamentos, freq.freq, custoTotal),
                        intercaladaExtra: extras.length > 0 ? extras : undefined,
                        tags: [],
                    };

                    results.push(cond);
                }
            }
        }
    }

    // Score bilateral em todos
    const pesoCliente = (inputs.scorePesoCliente ?? 50) / 100;
    const rate = inputs.correctionIndex === 'fixed' ? inputs.customRate : INDEX_RATES[inputs.correctionIndex] ?? 0.87;
    for (const c of results) {
        c.bilateralScore = bilateralScore(c, results, maxParcela, entradaDisp, margemMin, pesoCliente, rate);
        c.sensitivity = calcSensitivity(c, rate, custoTotal);
    }

    // Ordenar por score bilateral e pegar top 10
    results.sort((a, b) => (b.bilateralScore?.scoreTotal ?? 0) - (a.bilateralScore?.scoreTotal ?? 0));
    const top10 = results.slice(0, 10);

    // Tags visuais
    assignTags(top10);

    return top10;
}

// ─── Recommendation Type ─────────────────────────────────────────────────────
export interface Recommendation {
    ideal: Condition;
    alternatives: Condition[];
    reasons: string[];
    score: number;
}

// ─── RECOMENDAÇÃO INTELIGENTE ────────────────────────────────────────────────
export function findIdealCondition(
    conditions: Condition[],
    parcelasDesejadas: number,
    orcamentoMensal: number,
    entradaDisponivel: number,
    prefereCartao: boolean,
    margemMinima: number,
): Recommendation | null {
    if (conditions.length === 0) return null;

    const scored = conditions.map(c => {
        let score = 0;
        const reasons: string[] = [];

        if (c.effectiveMargin < margemMinima) return { condition: c, score: -1000, reasons: ['Margem abaixo do mínimo'] };

        score += Math.min(c.effectiveMargin, 50) * 0.3;
        if (c.effectiveMargin >= 25) reasons.push(`Margem saudável de ${c.effectiveMargin.toFixed(1)}%`);

        if (parcelasDesejadas > 0 && c.installments > 0) {
            const diff = Math.abs(c.installments - parcelasDesejadas);
            if (diff === 0) { score += 35; reasons.push(`Exatamente ${parcelasDesejadas}x como solicitado`); }
            else if (diff <= 2) { score += 35 - diff * 8; reasons.push(`Próximo das ${parcelasDesejadas}x desejadas (${c.installments}x)`); }
            else { score += Math.max(0, 35 - diff * 5); }
        } else if (parcelasDesejadas === 0 && c.type === 'avista') {
            score += 30; reasons.push('Pagamento à vista conforme preferência');
        }

        if (orcamentoMensal > 0 && c.installmentAmount > 0) {
            if (c.installmentAmount <= orcamentoMensal) {
                const folga = 1 - (c.installmentAmount / orcamentoMensal);
                score += 30 - folga * 10;
                reasons.push(`Parcela R$ ${fmt(c.installmentAmount)} dentro do orçamento de R$ ${fmt(orcamentoMensal)}`);
            } else {
                score -= ((c.installmentAmount - orcamentoMensal) / orcamentoMensal) * 40;
            }
        }

        if (entradaDisponivel > 0 && c.entry > 0) {
            if (c.entry <= entradaDisponivel) { score += 20; reasons.push(`Entrada R$ ${fmt(c.entry)} dentro do disponível`); }
            else { score -= ((c.entry - entradaDisponivel) / entradaDisponivel) * 25; }
        } else if (entradaDisponivel === 0 && c.entry === 0) {
            score += 15; reasons.push('Sem necessidade de entrada');
        }

        if (prefereCartao && c.type === 'capacidade' && c.id.includes('cartao')) {
            score += 5; reasons.push('Compatível com pagamento via cartão');
        }

        return { condition: c, score, reasons };
    })
        .filter(s => s.score > -500)
        .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;

    return {
        ideal: scored[0].condition,
        alternatives: scored.slice(1, 3).map(s => s.condition),
        reasons: scored[0].reasons,
        score: scored[0].score,
    };
}
