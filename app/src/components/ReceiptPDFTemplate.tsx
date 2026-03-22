import React from 'react';

interface ReceiptPDFTemplateProps {
    receipt: any;
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

export function ReceiptPDFTemplate({ receipt }: ReceiptPDFTemplateProps) {
    const empresa = {
        nome: 'ÊXITO GRID SOLUÇÕES EM ENERGIA LTDA',
        cnpj: '00.000.000/0001-00',
        endereco: 'Recife — PE',
        telefone: '(81) 9 0000-0000',
        email: 'contato@exitogrid.com.br',
        site: 'www.exitogrid.com.br',
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
        page: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: '10pt', color: '#1a1a1a', lineHeight: '1.55', maxWidth: 800, margin: '0 auto', background: '#fff' } as React.CSSProperties,
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 36px 18px', borderBottom: '3px solid #E8620A' } as React.CSSProperties,
        logo: { fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' } as React.CSSProperties,
        logoSub: { fontSize: '10px', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' as const, marginTop: 2 },
        headerRight: { textAlign: 'right' as const, fontSize: '9px', color: '#555', lineHeight: '1.7' },
        darkBar: { background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '12px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
        darkBarText: { color: '#E8620A', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' as const },
        darkBarRef: { color: '#888', fontSize: '9px' },
        body: { padding: '30px 36px' } as React.CSSProperties,
        sectionTitle: { fontSize: '11px', fontWeight: '800', color: '#E8620A', textTransform: 'uppercase' as const, letterSpacing: '2px', borderBottom: '2px solid #E8620A', paddingBottom: '6px', marginTop: '28px', marginBottom: '14px' } as React.CSSProperties,
        para: { fontSize: '10px', textAlign: 'justify' as const, margin: '6px 0', color: '#2d2d2d', lineHeight: '1.6' } as React.CSSProperties,
        infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', margin: '12px 0', fontSize: '10px' } as React.CSSProperties,
        infoLabel: { fontWeight: 700, color: '#555', fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
        infoValue: { color: '#1a1a1a', fontWeight: 500, paddingBottom: '6px', borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
        valueBox: { background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBF5 100%)', border: '2px solid #E8620A', borderRadius: '10px', padding: '24px 28px', margin: '24px 0', textAlign: 'center' as const } as React.CSSProperties,
        sigArea: { display: 'flex', justifyContent: 'space-between', gap: '60px', marginTop: '40px', paddingTop: '20px' } as React.CSSProperties,
        sigBox: { flex: 1, textAlign: 'center' as const } as React.CSSProperties,
        sigLine: { borderTop: '1px solid #333', marginTop: '50px', paddingTop: '8px', fontSize: '9px', fontWeight: '600' } as React.CSSProperties,
        sigSub: { fontSize: '8px', color: '#777' } as React.CSSProperties,
        footer: { background: '#1a1a1a', padding: '14px 36px', textAlign: 'center' as const, marginTop: '30px' } as React.CSSProperties,
        footerText: { fontSize: '8px', color: '#888', letterSpacing: '1px' },
        watermark: { position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: '80px', fontWeight: 900, color: 'rgba(232, 98, 10, 0.04)', letterSpacing: '12px', pointerEvents: 'none' as const, zIndex: 0 },
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

                {/* EMITENTE */}
                <div style={s.sectionTitle}>Dados do Emitente</div>
                <div style={s.infoGrid}>
                    <div><div style={s.infoLabel}>Razão Social</div><div style={s.infoValue}>{empresa.nome}</div></div>
                    <div><div style={s.infoLabel}>CNPJ</div><div style={s.infoValue}>{empresa.cnpj}</div></div>
                    <div><div style={s.infoLabel}>Endereço</div><div style={s.infoValue}>{empresa.endereco}</div></div>
                    <div><div style={s.infoLabel}>Contato</div><div style={s.infoValue}>{empresa.telefone} | {empresa.email}</div></div>
                </div>

                {/* PAGADOR */}
                <div style={s.sectionTitle}>Dados do Pagador</div>
                <div style={s.infoGrid}>
                    <div><div style={s.infoLabel}>Nome / Razão Social</div><div style={s.infoValue}>{clientName}</div></div>
                    <div><div style={s.infoLabel}>CPF / CNPJ</div><div style={s.infoValue}>{clientDoc}</div></div>
                    <div style={{ gridColumn: '1 / -1' }}><div style={s.infoLabel}>Endereço</div><div style={s.infoValue}>{clientAddress}</div></div>
                </div>

                {/* VALOR DESTAQUE */}
                <div style={s.valueBox}>
                    <div style={{ fontSize: '10px', color: '#92400e', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
                        VALOR RECEBIDO
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#E8620A', letterSpacing: '-1px' }}>
                        R$ {fmt(amount)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#78350f', marginTop: '6px', fontStyle: 'italic' }}>
                        ({numberToWords(Math.floor(amount))} reais{amount % 1 > 0 ? ` e ${numberToWords(Math.round((amount % 1) * 100))} centavos` : ''})
                    </div>
                    {totalProposal > 0 && (
                        <div style={{ fontSize: '9px', color: '#92400e', marginTop: '10px', padding: '8px 16px', background: 'rgba(232,98,10,0.08)', borderRadius: '6px', display: 'inline-block' }}>
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
                    <div><div style={s.infoLabel}>Nº da Proposta Vinculada</div><div style={s.infoValue}>{receipt.proposalNumber || receipt.proposal?.proposalNumber || '—'}</div></div>
                </div>

                {receipt.notes && (
                    <>
                        <div style={s.sectionTitle}>Observações</div>
                        <p style={s.para}>{receipt.notes}</p>
                    </>
                )}

                {/* DECLARAÇÃO */}
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '18px 22px', margin: '28px 0' }}>
                    <p style={{ fontSize: '10px', color: '#166534', lineHeight: '1.7', margin: 0, textAlign: 'justify' as const }}>
                        <strong>DECLARAÇÃO:</strong> Declaramos para os devidos fins que recebemos de <strong>{clientName}</strong>,
                        CPF/CNPJ <strong>{clientDoc}</strong>, a importância de <strong>R$ {fmt(amount)}</strong> ({numberToWords(Math.floor(amount))} reais),
                        referente a {receipt.description || 'serviços prestados'}, conforme condições acordadas.
                        O presente recibo é válido como comprovante de pagamento.
                    </p>
                </div>

                {/* DATA/LOCAL */}
                <div style={{ marginTop: '20px' }}>
                    <p style={{ ...s.para, textAlign: 'center', fontStyle: 'italic', color: '#555' }}>
                        Recife/PE, {paidDate}.
                    </p>
                </div>

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
