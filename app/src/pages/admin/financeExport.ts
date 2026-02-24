// ─── Finance Simulator — Export (Proposta Comercial Persuasiva) ───────────────
import type { Condition } from './financeTypes';
import { fmt } from './financeTypes';

// ─── Argumentos Estratégicos por Tipo ────────────────────────────────────────
function getStrategicArgument(c: Condition, allConditions: Condition[]): string {
    // Menor parcela
    const withInst = allConditions.filter(cc => cc.installmentAmount > 0);
    if (withInst.length > 0) {
        const minP = Math.min(...withInst.map(cc => cc.installmentAmount));
        if (c.installmentAmount === minP && c.installmentAmount > 0) {
            return 'A menor parcela disponível, pensada para caber no seu fluxo de caixa mensal';
        }
    }

    // Menor custo total
    const minTotal = Math.min(...allConditions.map(cc => cc.totalClient));
    if (c.totalClient === minTotal) {
        const diff = allConditions.length > 1
            ? Math.max(...allConditions.map(cc => cc.totalClient)) - minTotal
            : 0;
        return diff > 0
            ? `A opção mais econômica — você economiza até R$ ${fmt(diff)} no total`
            : 'A opção mais econômica entre todas as condições disponíveis';
    }

    // Menor prazo
    if (c.installments > 0) {
        const minPrazo = Math.min(...withInst.map(cc => cc.installments));
        if (c.installments === minPrazo) {
            return `Quite mais rápido e livre-se do compromisso em apenas ${c.installments} meses`;
        }
    }

    // Sem entrada
    if (c.entry === 0) {
        return 'Comprometa menos capital agora — comece sem investimento inicial';
    }

    // Equilíbrio
    if (c.bilateralScore && c.bilateralScore.scoreTotal > 70) {
        return 'A condição que nossos especialistas recomendam — melhor relação custo-benefício';
    }

    // Genérico por tipo
    switch (c.type) {
        case 'avista': return 'Condição exclusiva com desconto especial para pagamento à vista';
        case 'entrada': return 'Comprometa menos capital agora e distribua o investimento no tempo';
        case 'leasing': return 'Mensalidade fixa e previsível, sem surpresas no orçamento';
        case 'antecipacao': return 'Economia inteligente: antecipe parcelas e pague menos juros';
        case 'capacidade': return 'Condição personalizada conforme sua capacidade de pagamento';
        default: return 'Condição especial calculada exclusivamente para o seu perfil';
    }
}

// ─── Bloco de Condição para Texto ────────────────────────────────────────────
function conditionTextBlock(c: Condition, index: number, all: Condition[]): string[] {
    const lines: string[] = [];
    lines.push(`━━━ OPÇÃO ${index + 1}: ${c.commercialName} ━━━`);
    lines.push('');
    lines.push(`✦ ${getStrategicArgument(c, all)}`);
    lines.push('');

    if (c.type === 'avista') {
        lines.push(`  💰 Investimento: R$ ${fmt(c.totalClient)}`);
        lines.push(`  ⚡ Condição Premium com desconto exclusivo`);
    } else {
        if (c.entry > 0) lines.push(`  📌 Investimento inicial: R$ ${fmt(c.entry)}`);
        if (c.installmentAmount > 0) {
            const freqLabel = c.frequency === 1 ? '/mês' : c.frequency === 2 ? '/bimestre' : '/trimestre';
            lines.push(`  📌 ${c.installments}x parcelas de: R$ ${fmt(c.installmentAmount)}${freqLabel}`);
        }
        if (c.intercaladaExtra && c.intercaladaExtra.length > 0) {
            lines.push(`  📌 Parcelas de reforço nos meses: ${c.intercaladaExtra.map(e => e.month).join(', ')} — R$ ${fmt(c.intercaladaExtra[0].value)}`);
        }
        lines.push(`  📌 Valor total do investimento: R$ ${fmt(c.totalClient)}`);
    }

    if (c.annualBlocks && c.annualBlocks.length > 1) {
        lines.push(`  📋 Parcela sujeita a reajuste anual pelo índice contratado`);
    }

    lines.push('');
    return lines;
}

// ─── WhatsApp (condensado, ~1000 chars por condição) ─────────────────────────
export function buildWhatsAppText(
    conditions: Condition[],
    serviceDescription: string,
    clientName?: string,
): string {
    if (conditions.length === 0) return '';

    const lines: string[] = [];
    lines.push(`⚡ *PROPOSTA EXCLUSIVA*`);
    if (clientName) lines.push(`Preparada especialmente para: *${clientName}*`);
    lines.push(`📋 ${serviceDescription}`);
    lines.push('');

    for (let i = 0; i < conditions.length; i++) {
        const c = conditions[i];
        lines.push(`*${i + 1}. ${c.commercialName}*`);

        if (c.type === 'avista') {
            lines.push(`💰 R$ ${fmt(c.totalClient)} à vista`);
        } else {
            if (c.entry > 0) lines.push(`📌 Entrada: R$ ${fmt(c.entry)}`);
            const freqLabel = c.frequency === 1 ? '/mês' : c.frequency === 2 ? '/bim' : '/trim';
            lines.push(`📌 ${c.installments}x de R$ ${fmt(c.installmentAmount)}${freqLabel}`);
            lines.push(`📌 Total: R$ ${fmt(c.totalClient)}`);
        }

        lines.push(`✅ ${getStrategicArgument(c, conditions)}`);
        lines.push('');
    }

    lines.push(`⏰ *Condição válida por 48 horas*`);
    lines.push(`📞 Responda esta mensagem para aprovar`);
    lines.push('');
    lines.push(`_EXITO Engenharia — Proposta gerada por simulação financeira_`);

    return lines.join('\n');
}

// ─── E-mail (versão completa) ────────────────────────────────────────────────
export function buildEmailText(
    conditions: Condition[],
    serviceDescription: string,
    clientName?: string,
): string {
    if (conditions.length === 0) return '';

    const lines: string[] = [];
    lines.push(`PROPOSTA EXCLUSIVA — CONDIÇÃO ESPECIAL PERSONALIZADA`);
    if (clientName) lines.push(`Preparada para: ${clientName}`);
    lines.push(`⚡ Condição gerada sob medida para o seu perfil`);
    lines.push('');
    lines.push(`Prezado(a) ${clientName || 'Cliente'},`);
    lines.push('');
    lines.push(`Este projeto garante ${serviceDescription} para sua operação, com garantia integral e acompanhamento técnico completo. Preparamos condições especiais de investimento pensadas na melhor forma de viabilizar o seu projeto.`);
    lines.push('');

    for (let i = 0; i < conditions.length; i++) {
        lines.push(...conditionTextBlock(conditions[i], i, conditions));
    }

    // Comparação se múltiplas
    if (conditions.length > 1) {
        const best = conditions.reduce((a, b) =>
            (a.bilateralScore?.scoreTotal ?? 0) > (b.bilateralScore?.scoreTotal ?? 0) ? a : b
        );
        lines.push(`────────────────────────────────────────`);
        lines.push(`🏆 Nossa recomendação para o seu perfil: ${best.commercialName}`);
        lines.push(`   ${getStrategicArgument(best, conditions)}`);
        lines.push('');
    }

    lines.push(`────────────────────────────────────────`);
    lines.push('');
    lines.push(`Todas as condições incluem:`);
    lines.push(`  • Garantia integral dos serviços prestados`);
    lines.push(`  • Atendimento técnico especializado`);
    lines.push(`  • Documentação completa e transparente`);
    lines.push('');
    lines.push(`⏰ Esta condição especial foi calculada com os índices de ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} e está sujeita a alteração.`);
    lines.push(`📅 Agenda limitada — garantimos início do projeto em até 10 dias úteis após aprovação.`);
    lines.push('');
    lines.push(`Para aprovar esta condição, entre em contato conosco.`);
    lines.push('');
    lines.push(`Atenciosamente,`);
    lines.push(`Equipe Comercial — EXITO Engenharia`);
    lines.push(`Proposta gerada por sistema de simulação financeira — Exitogrid`);
    lines.push(`${new Date().toLocaleDateString('pt-BR')}`);

    return lines.join('\n');
}

export function buildEmailSubject(serviceDescription: string, clientName?: string): string {
    return clientName
        ? `Condição Especial ${serviceDescription} — Exclusiva para ${clientName}`
        : `Proposta Comercial — ${serviceDescription}`;
}

// ─── PDF/Print (layout profissional completo) ────────────────────────────────
export function buildPrintHTML(
    conditions: Condition[],
    serviceDescription: string,
    clientName?: string,
): string {
    const condHtml = conditions.map((c, i) => {
        const argument = getStrategicArgument(c, conditions);
        let body = '';

        body += `<tr><td colspan="2" class="highlight">✦ ${argument}</td></tr>`;

        if (c.type === 'avista') {
            body += `<tr><td>Investimento</td><td class="val">R$ ${fmt(c.totalClient)}</td></tr>`;
            body += `<tr><td colspan="2" class="note">Condição Premium com desconto exclusivo para pagamento à vista</td></tr>`;
        } else {
            if (c.entry > 0) body += `<tr><td>Investimento Inicial</td><td class="val">R$ ${fmt(c.entry)}</td></tr>`;
            if (c.installmentAmount > 0) {
                const freqLabel = c.frequency === 1 ? 'mensais' : c.frequency === 2 ? 'bimestrais' : 'trimestrais';
                body += `<tr><td>${c.installments}x Parcelas ${freqLabel}</td><td class="val">R$ ${fmt(c.installmentAmount)}</td></tr>`;
            }
            if (c.intercaladaExtra && c.intercaladaExtra.length > 0) {
                body += `<tr><td>Parcelas de reforço (meses ${c.intercaladaExtra.map(e => e.month).join(', ')})</td><td class="val">R$ ${fmt(c.intercaladaExtra[0].value)}</td></tr>`;
            }
            body += `<tr class="total"><td>Total do Investimento</td><td class="val">R$ ${fmt(c.totalClient)}</td></tr>`;
        }

        if (c.annualBlocks && c.annualBlocks.length > 1) {
            body += `<tr><td colspan="2" class="note">Parcela sujeita a reajuste anual conforme índice contratado</td></tr>`;
        }

        const isBest = conditions.length > 1 &&
            conditions.reduce((a, b) => (a.bilateralScore?.scoreTotal ?? 0) > (b.bilateralScore?.scoreTotal ?? 0) ? a : b).id === c.id;

        return `<div class="option${isBest ? ' recommended' : ''}">
            ${isBest ? '<div class="badge">⭐ RECOMENDADO</div>' : ''}
            <div class="option-header">Opção ${i + 1} — ${c.commercialName}</div>
            <table>${body}</table>
        </div>`;
    }).join('');

    // Comparativa lado a lado
    let comparativaHtml = '';
    if (conditions.length > 1) {
        const headers = conditions.map((_c, i) => `<th>Opção ${i + 1}</th>`).join('');
        const rowEntrada = conditions.map(c => `<td>R$ ${fmt(c.entry)}</td>`).join('');
        const rowParcela = conditions.map(c =>
            c.installmentAmount > 0 ? `<td>${c.installments}x R$ ${fmt(c.installmentAmount)}</td>` : `<td>—</td>`
        ).join('');
        const rowTotal = conditions.map(c => `<td class="val">R$ ${fmt(c.totalClient)}</td>`).join('');

        comparativaHtml = `
        <div class="comparison">
            <h3>Comparativo das Condições</h3>
            <table class="comp-table">
                <tr><th></th>${headers}</tr>
                <tr><td>Entrada</td>${rowEntrada}</tr>
                <tr><td>Parcelas</td>${rowParcela}</tr>
                <tr class="total"><td>Total</td>${rowTotal}</tr>
            </table>
        </div>`;
    }

    const bestCondition = conditions.length > 1
        ? conditions.reduce((a, b) => (a.bilateralScore?.scoreTotal ?? 0) > (b.bilateralScore?.scoreTotal ?? 0) ? a : b)
        : null;

    return `<html><head><title>Proposta - ${serviceDescription}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; max-width: 750px; margin: 0 auto; line-height: 1.6; }
        .header { border-bottom: 3px solid #0891b2; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 22px; color: #0891b2; font-weight: 700; letter-spacing: 1px; }
        .header p { font-size: 14px; color: #64748b; margin-top: 4px; }
        .exclusive-badge { display: inline-block; background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; letter-spacing: 0.5px; }
        .service { font-size: 16px; font-weight: 600; color: #334155; margin-bottom: 20px; padding: 12px 16px; background: #f0f9ff; border-left: 4px solid #0891b2; border-radius: 4px; }
        .intro { font-size: 14px; color: #475569; margin-bottom: 24px; }
        .option { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; position: relative; }
        .option.recommended { border: 2px solid #0891b2; box-shadow: 0 2px 12px rgba(8,145,178,0.15); }
        .badge { position: absolute; top: -1px; right: 16px; background: #0891b2; color: white; padding: 4px 12px; border-radius: 0 0 6px 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
        .option-header { background: #0891b2; color: white; padding: 10px 16px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
        td.val { text-align: right; font-weight: 600; color: #0891b2; font-variant-numeric: tabular-nums; }
        td.highlight { font-size: 13px; color: #0891b2; font-weight: 500; padding: 12px 16px; background: #f0f9ff; border-bottom: 1px solid #e0f2fe; }
        tr.total td { font-weight: 700; background: #f8fafc; border-top: 2px solid #e2e8f0; font-size: 15px; }
        tr.total td.val { color: #0f172a; }
        .note { font-size: 12px; color: #64748b; font-style: italic; border-bottom: none; padding-top: 4px; }
        .comparison { margin: 28px 0; }
        .comparison h3 { font-size: 15px; color: #334155; margin-bottom: 12px; font-weight: 600; }
        .comp-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .comp-table th { background: #f8fafc; padding: 10px 12px; font-size: 13px; color: #475569; text-align: center; border-bottom: 2px solid #e2e8f0; }
        .comp-table td { padding: 10px 12px; font-size: 13px; text-align: center; border-bottom: 1px solid #f1f5f9; }
        .recommendation { margin: 24px 0; padding: 16px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 1px solid #bae6fd; border-radius: 8px; }
        .recommendation h3 { font-size: 14px; color: #0891b2; margin-bottom: 6px; }
        .recommendation p { font-size: 13px; color: #334155; }
        .includes { margin: 24px 0; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
        .includes h3 { font-size: 13px; color: #166534; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; }
        .includes li { font-size: 13px; color: #15803d; margin-left: 16px; margin-bottom: 4px; }
        .urgency { margin: 20px 0; padding: 14px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; }
        .urgency p { font-size: 13px; color: #92400e; margin-bottom: 4px; }
        .urgency .cta { font-weight: 700; color: #0891b2; font-size: 14px; margin-top: 8px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
        .footer strong { color: #475569; }
        .powered { margin-top: 12px; font-size: 10px; color: #cbd5e1; text-align: center; }
    </style></head>
    <body>
        <div class="header">
            <h1>PROPOSTA EXCLUSIVA</h1>
            <p>Condição Especial Personalizada — EXITO Engenharia</p>
            ${clientName ? `<p style="font-weight:600;color:#334155;margin-top:4px;">Preparada para: ${clientName}</p>` : ''}
            <div class="exclusive-badge">⚡ Condição gerada sob medida para o seu perfil</div>
        </div>

        <div class="service">${serviceDescription}</div>

        <p class="intro">
            ${clientName ? `Prezado(a) ${clientName},` : 'Prezado(a) Cliente,'}<br><br>
            Este projeto garante <strong>${serviceDescription}</strong> para sua operação, com garantia integral e acompanhamento técnico completo. Preparamos condições especiais de investimento pensadas na melhor forma de viabilizar o seu projeto.
        </p>

        ${condHtml}

        ${comparativaHtml}

        ${bestCondition ? `
        <div class="recommendation">
            <h3>🏆 Nossa Recomendação para o Seu Perfil</h3>
            <p><strong>${bestCondition.commercialName}</strong> — ${getStrategicArgument(bestCondition, conditions)}</p>
        </div>` : ''}

        <div class="includes">
            <h3>Todas as condições incluem:</h3>
            <ul>
                <li>Garantia integral dos serviços prestados</li>
                <li>Atendimento técnico especializado</li>
                <li>Documentação completa e transparente</li>
            </ul>
        </div>

        <div class="urgency">
            <p>⏰ Esta condição especial foi calculada com os índices de <strong>${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong> e está sujeita a alteração.</p>
            <p>📅 Agenda limitada — garantimos início do projeto em até <strong>10 dias úteis</strong> após aprovação.</p>
            <p class="cta">📞 Para aprovar esta condição, entre em contato conosco</p>
        </div>

        <div class="footer">
            <p><strong>EXITO Engenharia</strong> — Equipe Comercial</p>
            <p>Para formalizar a contratação ou esclarecer dúvidas, estamos à disposição.</p>
            <p style="margin-top:4px;">Condições válidas por 48 horas a partir de ${new Date().toLocaleDateString('pt-BR')}.</p>
        </div>

        <p class="powered">Proposta gerada por sistema de simulação financeira — Exitogrid</p>
    </body></html>`;
}
