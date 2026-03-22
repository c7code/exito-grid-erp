import React from 'react';

interface PurchaseOrderPDFTemplateProps {
    order: any;
}

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const typeLabels: Record<string, string> = {
    company_billing: 'Faturamento para Empresa',
    direct_billing: 'Faturamento Direto (Cliente)',
};

const statusLabels: Record<string, string> = {
    draft: 'Rascunho', sent: 'Enviado', confirmed: 'Confirmado',
    delivered: 'Entregue', cancelled: 'Cancelado',
};

export function PurchaseOrderPDFTemplate({ order }: PurchaseOrderPDFTemplateProps) {
    const empresa = {
        nome: 'ÊXITO GRID SOLUÇÕES EM ENERGIA LTDA',
        cnpj: '00.000.000/0001-00',
        endereco: 'Recife — PE',
        telefone: '(81) 9 0000-0000',
        email: 'contato@exitogrid.com.br',
        site: 'www.exitogrid.com.br',
    };

    const supplierName = order.supplier?.name || order.supplierName || '—';
    const supplierDoc = order.supplier?.document || order.supplierDocument || '—';
    const supplierAddress = order.supplier?.address || '—';
    const supplierPhone = order.supplier?.phone || '—';
    const supplierEmail = order.supplier?.email || '—';

    const clientName = order.client?.name || order.clientName || '—';

    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const items = order.items || [];
    const totalValue = Number(order.totalValue || items.reduce((s: number, i: any) => s + Number(i.totalPrice || 0), 0));

    const isDirect = order.type === 'direct_billing';

    const s = {
        page: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: '10pt', color: '#1a1a1a', lineHeight: '1.55', maxWidth: 800, margin: '0 auto', background: '#fff' } as React.CSSProperties,
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 36px 18px', borderBottom: '3px solid #1d4ed8' } as React.CSSProperties,
        logo: { fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' } as React.CSSProperties,
        logoSub: { fontSize: '10px', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' as const, marginTop: 2 },
        headerRight: { textAlign: 'right' as const, fontSize: '9px', color: '#555', lineHeight: '1.7' },
        darkBar: { background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)', padding: '12px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
        darkBarText: { color: '#fff', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' as const },
        darkBarRef: { color: '#93c5fd', fontSize: '9px' },
        body: { padding: '30px 36px' } as React.CSSProperties,
        sectionTitle: { fontSize: '11px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' as const, letterSpacing: '2px', borderBottom: '2px solid #1d4ed8', paddingBottom: '6px', marginTop: '28px', marginBottom: '14px' } as React.CSSProperties,
        para: { fontSize: '10px', textAlign: 'justify' as const, margin: '6px 0', color: '#2d2d2d', lineHeight: '1.6' } as React.CSSProperties,
        infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', margin: '12px 0', fontSize: '10px' } as React.CSSProperties,
        infoLabel: { fontWeight: 700, color: '#555', fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
        infoValue: { color: '#1a1a1a', fontWeight: 500, paddingBottom: '6px', borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
        table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '10px', marginBottom: '16px' } as React.CSSProperties,
        th: { background: '#eff6ff', padding: '8px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase' as const, color: '#1e40af', borderBottom: '2px solid #93c5fd', textAlign: 'left' as const } as React.CSSProperties,
        thRight: { background: '#eff6ff', padding: '8px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase' as const, color: '#1e40af', borderBottom: '2px solid #93c5fd', textAlign: 'right' as const } as React.CSSProperties,
        td: { padding: '7px 10px', fontSize: '9.5px', borderBottom: '1px solid #e8e8e8' } as React.CSSProperties,
        tdRight: { padding: '7px 10px', fontSize: '9.5px', borderBottom: '1px solid #e8e8e8', textAlign: 'right' as const } as React.CSSProperties,
        totalRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '16px', fontWeight: '800', color: '#1d4ed8', borderTop: '3px solid #1d4ed8', marginTop: '6px' } as React.CSSProperties,
        typeBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const } as React.CSSProperties,
        sigArea: { display: 'flex', justifyContent: 'space-between', gap: '60px', marginTop: '40px', paddingTop: '20px' } as React.CSSProperties,
        sigBox: { flex: 1, textAlign: 'center' as const } as React.CSSProperties,
        sigLine: { borderTop: '1px solid #333', marginTop: '50px', paddingTop: '8px', fontSize: '9px', fontWeight: '600' } as React.CSSProperties,
        sigSub: { fontSize: '8px', color: '#777' } as React.CSSProperties,
        footer: { background: '#1e3a5f', padding: '14px 36px', textAlign: 'center' as const, marginTop: '30px' } as React.CSSProperties,
        footerText: { fontSize: '8px', color: '#93c5fd', letterSpacing: '1px' },
    };

    return (
        <div id="po-pdf-content" style={s.page}>
            {/* ═══ HEADER ═══ */}
            <div style={s.header}>
                <div>
                    <div style={s.logo}>
                        <span style={{ color: '#1d4ed8' }}>Êxito</span>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={s.darkBarText}>Pedido de Compra</span>
                    <span style={{
                        ...s.typeBadge,
                        background: isDirect ? '#7c3aed' : '#1d4ed8',
                        color: '#fff',
                    }}>
                        {typeLabels[order.type] || 'Faturamento Empresa'}
                    </span>
                </div>
                <span style={s.darkBarRef}>
                    Nº {order.orderNumber || '—'} | {dateStr}
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

                {/* FORNECEDOR */}
                <div style={s.sectionTitle}>Dados do Fornecedor</div>
                <div style={s.infoGrid}>
                    <div><div style={s.infoLabel}>Razão Social</div><div style={s.infoValue}>{supplierName}</div></div>
                    <div><div style={s.infoLabel}>CNPJ / CPF</div><div style={s.infoValue}>{supplierDoc}</div></div>
                    <div><div style={s.infoLabel}>Endereço</div><div style={s.infoValue}>{supplierAddress}</div></div>
                    <div><div style={s.infoLabel}>Contato</div><div style={s.infoValue}>{supplierPhone} | {supplierEmail}</div></div>
                </div>

                {/* CLIENTE (if direct billing) */}
                {isDirect && (
                    <>
                        <div style={s.sectionTitle}>Dados do Cliente (Faturamento Direto)</div>
                        <div style={s.infoGrid}>
                            <div><div style={s.infoLabel}>Nome / Razão Social</div><div style={s.infoValue}>{clientName}</div></div>
                            <div><div style={s.infoLabel}>CPF / CNPJ</div><div style={s.infoValue}>{order.client?.document || '—'}</div></div>
                        </div>
                        <p style={{ ...s.para, fontStyle: 'italic', color: '#7c3aed', fontSize: '9px' }}>
                            ⚠ Faturamento direto: o fornecedor fatura diretamente ao cliente. Esta ordem serve como controle administrativo da empresa para acompanhamento e supervisão.
                        </p>
                    </>
                )}

                {/* ITENS */}
                <div style={s.sectionTitle}>Itens do Pedido</div>
                <table style={s.table}>
                    <thead>
                        <tr>
                            <th style={{ ...s.th, width: '5%' }}>Item</th>
                            <th style={{ ...s.th, width: '42%' }}>Descrição</th>
                            <th style={{ ...s.th, width: '8%' }}>Un</th>
                            <th style={{ ...s.thRight, width: '10%' }}>Qtd</th>
                            <th style={{ ...s.thRight, width: '15%' }}>Vlr. Unit.</th>
                            <th style={{ ...s.thRight, width: '20%' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#999' }}>Nenhum item</td></tr>
                        ) : items.map((item: any, idx: number) => (
                            <tr key={idx}>
                                <td style={s.td}>{String(idx + 1).padStart(2, '0')}</td>
                                <td style={s.td}>{item.description}</td>
                                <td style={s.td}>{item.unit || 'un'}</td>
                                <td style={s.tdRight}>{Number(item.quantity || 1)}</td>
                                <td style={s.tdRight}>R$ {fmt(item.unitPrice)}</td>
                                <td style={{ ...s.tdRight, fontWeight: 600 }}>R$ {fmt(item.totalPrice || Number(item.quantity || 1) * Number(item.unitPrice || 0))}</td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={5} style={{ ...s.td, textAlign: 'right', fontWeight: 700, background: '#f8fafc', fontSize: '10px' }}>
                                VALOR TOTAL DO PEDIDO
                            </td>
                            <td style={{ ...s.tdRight, fontWeight: 800, background: '#f8fafc', color: '#1d4ed8', fontSize: '12px' }}>
                                R$ {fmt(totalValue)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* CONDIÇÕES */}
                <div style={s.sectionTitle}>Condições</div>
                <div style={s.infoGrid}>
                    <div><div style={s.infoLabel}>Condições de Pagamento</div><div style={s.infoValue}>{order.paymentTerms || '—'}</div></div>
                    <div><div style={s.infoLabel}>Status</div><div style={s.infoValue}>{statusLabels[order.status] || order.status}</div></div>
                    <div><div style={s.infoLabel}>Data de Entrega</div><div style={s.infoValue}>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : '—'}</div></div>
                    <div><div style={s.infoLabel}>Proposta Vinculada</div><div style={s.infoValue}>{order.proposalNumber || order.proposal?.proposalNumber || '—'}</div></div>
                    {order.deliveryAddress && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <div style={s.infoLabel}>Endereço de Entrega</div>
                            <div style={s.infoValue}>{order.deliveryAddress}</div>
                        </div>
                    )}
                </div>

                {order.notes && (
                    <>
                        <div style={s.sectionTitle}>Observações</div>
                        <p style={s.para}>{order.notes}</p>
                    </>
                )}

                {/* TERMOS */}
                <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '18px 22px', margin: '28px 0' }}>
                    <p style={{ fontSize: '10px', color: '#1e40af', lineHeight: '1.7', margin: 0, textAlign: 'justify' as const }}>
                        <strong>TERMOS DE FORNECIMENTO:</strong> O fornecedor compromete-se a entregar os materiais e/ou serviços especificados neste pedido de compra, nas condições e prazos aqui estabelecidos.
                        Qualquer divergência em relação às especificações, quantidades ou prazos deve ser comunicada previamente e por escrito.
                        O aceite deste pedido implica na concordância integral com todas as condições aqui descritas.
                    </p>
                </div>

                {/* DATA/LOCAL */}
                <div style={{ marginTop: '20px' }}>
                    <p style={{ ...s.para, textAlign: 'center', fontStyle: 'italic', color: '#555' }}>
                        Recife/PE, {dateStr}.
                    </p>
                </div>

                {/* ASSINATURAS */}
                <div style={s.sigArea}>
                    <div style={s.sigBox}>
                        <div style={s.sigLine}>{empresa.nome}</div>
                        <div style={s.sigSub}>CNPJ: {empresa.cnpj}</div>
                        <div style={{ ...s.sigSub, fontWeight: 600 }}>SOLICITANTE</div>
                    </div>
                    <div style={s.sigBox}>
                        <div style={s.sigLine}>{supplierName}</div>
                        <div style={s.sigSub}>CNPJ/CPF: {supplierDoc}</div>
                        <div style={{ ...s.sigSub, fontWeight: 600 }}>FORNECEDOR</div>
                    </div>
                </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={s.footer}>
                <div style={s.footerText}>
                    <span style={{ color: '#fff', fontWeight: 700 }}>EXITO SYSTEM</span>
                    {' '} — Pedido de Compra gerado eletronicamente | {empresa.nome} | CNPJ: {empresa.cnpj}
                </div>
            </div>
        </div>
    );
}
