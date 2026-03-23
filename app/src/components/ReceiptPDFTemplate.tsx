import React from 'react';

interface ReceiptPDFTemplateProps {
    receipt: any;
    company?: any;
}

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function numberToWords(n: number | string): string {
    const num = Number(n); if (isNaN(num) || num <= 0) return '';
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const tens = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    if (num === 100) return 'cem'; if (num >= 1000) return String(num);
    let result = ''; const h = Math.floor(num / 100); const t = Math.floor((num % 100) / 10); const u = num % 10;
    if (h > 0) result += hundreds[h];
    if (t === 1 && u > 0) { result += (result ? ' e ' : '') + teens[u]; return result; }
    if (t > 0) result += (result ? ' e ' : '') + tens[t];
    if (u > 0) result += (result ? ' e ' : '') + units[u];
    return result || String(num);
}

const methodLabels: Record<string, string> = {
    pix: 'PIX', bank_transfer: 'Transferência Bancária', boleto: 'Boleto Bancário',
    credit_card: 'Cartão de Crédito', cash: 'Dinheiro', check: 'Cheque',
};

export function ReceiptPDFTemplate({ receipt, company }: ReceiptPDFTemplateProps) {
    const co = company || {};
    const empresa = {
        nome: co.razaoSocial || co.name || co.tradeName || 'EXITO GRID COMERCIO E SERVICOS ELETRICOS LTDA',
        cnpj: co.cnpj || '55.303.935/0001-39',
        endereco: co.address ? `${co.address}${co.number ? ', ' + co.number : ''}${co.complement ? ', ' + co.complement : ''} — ${co.neighborhood || ''}, ${co.city || 'Recife'}/${co.state || 'PE'}` : 'R General Polidoro, 352, Loja 0104 — Varzea, Recife/PE',
        telefone: co.phone || '(81) 8887-0766',
        email: co.email || 'contato@exitogrid.com.br',
        site: co.website || 'www.exitogrid.com.br',
    };

    const clientName = receipt.client?.name || receipt.clientName || '—';
    const clientDoc = receipt.client?.document || receipt.clientDocument || '—';
    const clientAddress = receipt.client?.address || '—';

    const paidDate = receipt.paidAt
        ? new Date(receipt.paidAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const amount = Number(receipt.amount || 0);
    const percentage = Number(receipt.percentage || 100);
    const totalProposal = Number(receipt.totalProposalValue || 0);

    const s = {
        page: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: '9pt', color: '#1a1a1a', lineHeight: '1.4', maxWidth: 794, margin: '0 auto', background: '#fff' } as React.CSSProperties,
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 30px 12px', borderBottom: '3px solid #E8620A' } as React.CSSProperties,
        logo: { fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' } as React.CSSProperties,
        logoSub: { fontSize: '9px', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' as const, marginTop: 1 },
        headerRight: { textAlign: 'right' as const, fontSize: '8px', color: '#555', lineHeight: '1.5' },
        darkBar: { background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '8px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
        darkBarText: { color: '#E8620A', fontSize: '11px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' as const },
        darkBarRef: { color: '#888', fontSize: '8px' },
        body: { padding: '16px 30px 12px' } as React.CSSProperties,
        sectionTitle: { fontSize: '9px', fontWeight: '800', color: '#E8620A', textTransform: 'uppercase' as const, letterSpacing: '1.5px', borderBottom: '1.5px solid #E8620A', paddingBottom: '3px', marginTop: '14px', marginBottom: '8px' } as React.CSSProperties,
        para: { fontSize: '9px', textAlign: 'justify' as const, margin: '4px 0', color: '#2d2d2d', lineHeight: '1.5' } as React.CSSProperties,
        infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 20px', margin: '6px 0', fontSize: '9px' } as React.CSSProperties,
        infoLabel: { fontWeight: 700, color: '#555', fontSize: '7.5px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
        infoValue: { color: '#1a1a1a', fontWeight: 500, paddingBottom: '3px', borderBottom: '1px solid #f0f0f0', fontSize: '9px' } as React.CSSProperties,
        valueBox: { background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBF5 100%)', border: '2px solid #E8620A', borderRadius: '8px', padding: '14px 20px', margin: '14px 0', textAlign: 'center' as const } as React.CSSProperties,
        sigArea: { display: 'flex', justifyContent: 'space-between', gap: '50px', marginTop: '20px', paddingTop: '10px' } as React.CSSProperties,
        sigBox: { flex: 1, textAlign: 'center' as const } as React.CSSProperties,
        sigLine: { borderTop: '1px solid #333', marginTop: '35px', paddingTop: '6px', fontSize: '8px', fontWeight: '600' } as React.CSSProperties,
        sigSub: { fontSize: '7px', color: '#777' } as React.CSSProperties,
        footer: { background: '#1a1a1a', padding: '8px 30px', textAlign: 'center' as const, marginTop: '12px' } as React.CSSProperties,
        footerText: { fontSize: '7px', color: '#888', letterSpacing: '1px' },
        watermark: { position: 'absolute' as const, top: '45%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: '70px', fontWeight: 900, color: 'rgba(232, 98, 10, 0.04)', letterSpacing: '12px', pointerEvents: 'none' as const, zIndex: 0 },
    };

    return (
        <div id="receipt-pdf-content" style={{ ...s.page, position: 'relative' }}>
            {/* Watermark */}
            <div style={s.watermark}>RECIBO</div>

            {/* ═══ HEADER ═══ */}
            <div style={s.header}>
                <div>
                    <div style={s.logo}>
                        <span style={{ color: '#E8620A' }}>Êxito</span>
                        <span style={{ color: '#2d2d2d' }}>Grid</span>
                    </div>
                    <div style={s.logoSub}>Eficiência Elétrica & Solar</div>
                </div>
                <div style={s.headerRight}>
                    <div style={{ fontWeight: 700 }}>{empresa.telefone}</div>
                    <div style={{ fontWeight: 700 }}>{empresa.email}</div>
                    <div>{empresa.site}</div>
                </div>
            </div>

            {/* ═══ DARK BAR ═══ */}
            <div style={s.darkBar}>
                <span style={s.darkBarText}>Recibo de Pagamento</span>
                <span style={s.darkBarRef}>
                    Nº {receipt.receiptNumber || '—'} | {dateStr}
                </span>
            </div>

            {/* ═══ BODY ═══ */}
            <div style={s.body}>

                {/* EMITENTE + PAGADOR lado a lado */}
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={s.sectionTitle}>Emitente</div>
                        <div style={{ fontSize: '9px' }}>
                            <div><span style={s.infoLabel}>Razão Social: </span><span style={{ fontWeight: 500 }}>{empresa.nome}</span></div>
                            <div><span style={s.infoLabel}>CNPJ: </span><span style={{ fontWeight: 500 }}>{empresa.cnpj}</span></div>
                            <div><span style={s.infoLabel}>Endereço: </span><span style={{ fontWeight: 500 }}>{empresa.endereco}</span></div>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={s.sectionTitle}>Pagador</div>
                        <div style={{ fontSize: '9px' }}>
                            <div><span style={s.infoLabel}>Nome: </span><span style={{ fontWeight: 500 }}>{clientName}</span></div>
                            <div><span style={s.infoLabel}>CPF/CNPJ: </span><span style={{ fontWeight: 500 }}>{clientDoc}</span></div>
                            <div><span style={s.infoLabel}>Endereço: </span><span style={{ fontWeight: 500 }}>{clientAddress}</span></div>
                        </div>
                    </div>
                </div>

                {/* VALOR DESTAQUE */}
                <div style={s.valueBox}>
                    <div style={{ fontSize: '9px', color: '#92400e', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
                        VALOR RECEBIDO
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#E8620A', letterSpacing: '-1px' }}>
                        R$ {fmt(amount)}
                    </div>
                    <div style={{ fontSize: '9px', color: '#78350f', marginTop: '4px', fontStyle: 'italic' }}>
                        ({numberToWords(Math.floor(amount))} reais{amount % 1 > 0 ? ` e ${numberToWords(Math.round((amount % 1) * 100))} centavos` : ''})
                    </div>
                    {totalProposal > 0 && (
                        <div style={{ fontSize: '8px', color: '#92400e', marginTop: '6px', padding: '4px 12px', background: 'rgba(232,98,10,0.08)', borderRadius: '4px', display: 'inline-block' }}>
                            Correspondente a <strong>{percentage}%</strong> do valor total de <strong>R$ {fmt(totalProposal)}</strong>
                        </div>
                    )}
                </div>

                {/* DETALHES */}
                <div style={s.sectionTitle}>Detalhes do Pagamento</div>
                <div style={s.infoGrid}>
                    <div><div style={s.infoLabel}>Descrição</div><div style={s.infoValue}>{receipt.description || '—'}</div></div>
                    <div><div style={s.infoLabel}>Método de Pagamento</div><div style={s.infoValue}>{methodLabels[receipt.paymentMethod] || receipt.paymentMethod || '—'}</div></div>
                    <div><div style={s.infoLabel}>Data do Pagamento</div><div style={s.infoValue}>{paidDate}</div></div>
                    <div><div style={s.infoLabel}>Proposta Vinculada</div><div style={s.infoValue}>{receipt.proposalNumber || receipt.proposal?.proposalNumber || '—'}</div></div>
                </div>

                {receipt.notes && (
                    <>
                        <div style={{ ...s.sectionTitle, marginTop: '10px' }}>Observações</div>
                        <p style={s.para}>{receipt.notes}</p>
                    </>
                )}

                {/* DECLARAÇÃO */}
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '12px 16px', margin: '14px 0' }}>
                    <p style={{ fontSize: '9px', color: '#166534', lineHeight: '1.5', margin: 0, textAlign: 'justify' as const }}>
                        <strong>DECLARAÇÃO:</strong> Declaramos para os devidos fins que recebemos de <strong>{clientName}</strong>,
                        CPF/CNPJ <strong>{clientDoc}</strong>, a importância de <strong>R$ {fmt(amount)}</strong> ({numberToWords(Math.floor(amount))} reais),
                        referente a {receipt.description || 'serviços prestados'}, conforme condições acordadas.
                        O presente recibo é válido como comprovante de pagamento.
                    </p>
                </div>

                {/* DATA/LOCAL */}
                <p style={{ ...s.para, textAlign: 'center', fontStyle: 'italic', color: '#555', marginTop: '10px' }}>
                    Recife/PE, {paidDate}.
                </p>

                {/* ASSINATURAS */}
                <div style={s.sigArea}>
                    <div style={s.sigBox}>
                        <div style={s.sigLine}>{empresa.nome}</div>
                        <div style={s.sigSub}>CNPJ: {empresa.cnpj}</div>
                        <div style={{ ...s.sigSub, fontWeight: 600 }}>EMITENTE</div>
                    </div>
                    <div style={s.sigBox}>
                        <div style={s.sigLine}>{clientName}</div>
                        <div style={s.sigSub}>CPF/CNPJ: {clientDoc}</div>
                        <div style={{ ...s.sigSub, fontWeight: 600 }}>PAGADOR</div>
                    </div>
                </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={s.footer}>
                <div style={s.footerText}>
                    <span style={{ color: '#E8620A', fontWeight: 700 }}>EXITO SYSTEM</span>
                    {' '} — Documento gerado eletronicamente | {empresa.nome} | CNPJ: {empresa.cnpj}
                </div>
            </div>
        </div>
    );
}
