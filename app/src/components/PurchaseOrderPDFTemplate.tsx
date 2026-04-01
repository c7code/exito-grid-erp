import React from 'react';
import { EXITO_GRID_LOGO } from '@/assets/exito-grid-logo-base64';

interface PurchaseOrderPDFTemplateProps {
    order: any;
    company?: any;
}

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PurchaseOrderPDFTemplate({ order, company }: PurchaseOrderPDFTemplateProps) {
    const co = company || {};
    const empresa = {
        nome: co.razaoSocial || co.name || co.tradeName || 'EXITO GRID COMERCIO E SERVICOS ELETRICOS LTDA',
        cnpj: co.cnpj || '55.303.935/0001-39',
        endereco: co.address ? `${co.address}${co.number ? ', ' + co.number : ''}${co.complement ? ', ' + co.complement : ''} — ${co.neighborhood || ''}, ${co.city || 'Recife'}/${co.state || 'PE'}` : 'R General Polidoro, 352, Loja 0104 — Varzea, Recife/PE',
        telefone: co.phone || '(81) 8887-0766',
        email: co.email || 'contato@exitogrid.com.br',
        site: co.website || 'www.exitogrid.com.br',
    };

    const supplierName = order.supplier?.name || order.supplierName || '—';
    const supplierDoc = order.supplier?.document || order.supplierDocument || '—';
    const supplierPhone = order.supplier?.phone || '—';
    const supplierEmail = order.supplier?.email || '—';

    const clientName = order.client?.name || order.clientName || '—';
    const clientDoc = order.client?.document || '—';

    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const items = order.items || [];
    const totalValue = Number(order.totalValue || items.reduce((s: number, i: any) => s + Number(i.totalPrice || 0), 0));

    const isDirect = order.type === 'direct_billing';

    const s = {
        page: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: '9pt', color: '#1a1a1a', lineHeight: '1.35', maxWidth: 794, margin: '0 auto', background: '#fff' } as React.CSSProperties,
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px 10px', borderBottom: '3px solid #1d4ed8' } as React.CSSProperties,
        logo: { fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' } as React.CSSProperties,
        logoSub: { fontSize: '8px', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' as const, marginTop: 1 },
        headerRight: { textAlign: 'right' as const, fontSize: '7.5px', color: '#555', lineHeight: '1.5' },
        darkBar: { background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)', padding: '7px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
        darkBarText: { color: '#fff', fontSize: '11px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' as const },
        darkBarRef: { color: '#93c5fd', fontSize: '8px' },
        body: { padding: '12px 28px 8px' } as React.CSSProperties,
        sectionTitle: { fontSize: '8px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' as const, letterSpacing: '1.5px', borderBottom: '1.5px solid #1d4ed8', paddingBottom: '2px', marginTop: '10px', marginBottom: '5px' } as React.CSSProperties,
        infoLabel: { fontWeight: 700, color: '#555', fontSize: '7px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
        infoValue: { color: '#1a1a1a', fontWeight: 500, fontSize: '8.5px' } as React.CSSProperties,
        table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '4px', marginBottom: '6px' } as React.CSSProperties,
        th: { background: '#eff6ff', padding: '4px 6px', fontSize: '7.5px', fontWeight: '700', textTransform: 'uppercase' as const, color: '#1e40af', borderBottom: '1.5px solid #93c5fd', textAlign: 'left' as const } as React.CSSProperties,
        thRight: { background: '#eff6ff', padding: '4px 6px', fontSize: '7.5px', fontWeight: '700', textTransform: 'uppercase' as const, color: '#1e40af', borderBottom: '1.5px solid #93c5fd', textAlign: 'right' as const } as React.CSSProperties,
        td: { padding: '3px 6px', fontSize: '8px', borderBottom: '1px solid #e8e8e8' } as React.CSSProperties,
        tdRight: { padding: '3px 6px', fontSize: '8px', borderBottom: '1px solid #e8e8e8', textAlign: 'right' as const } as React.CSSProperties,
        sigArea: { display: 'flex', justifyContent: 'space-between', gap: '40px', marginTop: '16px', paddingTop: '6px' } as React.CSSProperties,
        sigBox: { flex: 1, textAlign: 'center' as const } as React.CSSProperties,
        sigLine: { borderTop: '1px solid #333', marginTop: '30px', paddingTop: '4px', fontSize: '7.5px', fontWeight: '600' } as React.CSSProperties,
        sigSub: { fontSize: '6.5px', color: '#777' } as React.CSSProperties,
        footer: { background: '#1e3a5f', padding: '6px 28px', textAlign: 'center' as const, marginTop: '10px' } as React.CSSProperties,
        footerText: { fontSize: '6.5px', color: '#93c5fd', letterSpacing: '1px' },
    };

    return (
        <div id="po-pdf-content" style={s.page}>
            {/* ═══ HEADER ═══ */}
            <div style={s.header}>
                <div>
                    <img src={EXITO_GRID_LOGO} alt="Êxito Grid" style={{ height: '40px', objectFit: 'contain' }} />
                </div>
                <div style={s.headerRight}>
                    <div style={{ fontWeight: 700 }}>{empresa.telefone}</div>
                    <div style={{ fontWeight: 700 }}>{empresa.email}</div>
                    <div>{empresa.site}</div>
                </div>
            </div>

            {/* ═══ DARK BAR ═══ */}
            <div style={s.darkBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={s.darkBarText}>Pedido de Compra</span>
                    {isDirect && (
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '7px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, background: '#7c3aed', color: '#fff' }}>
                            Fat. Direto
                        </span>
                    )}
                </div>
                <span style={s.darkBarRef}>
                    Nº {order.orderNumber || '—'} | {dateStr}
                </span>
            </div>

            {/* ═══ BODY ═══ */}
            <div style={s.body}>

                {/* REFERÊNCIA — Proposta / Contrato / Centro de Custo */}
                {(order.proposalNumber || order.contractNumber) && (
                    <div style={{ background: '#faf5ff', border: '1px solid #c4b5fd', borderRadius: '6px', padding: '8px 14px', margin: '8px 0', display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, color: '#6d28d9', letterSpacing: '1px', textTransform: 'uppercase' as const }}>
                            📋 Referência
                        </div>
                        {order.proposalNumber && (
                            <div style={{ fontSize: '8.5px' }}>
                                <span style={s.infoLabel}>Proposta: </span>
                                <span style={{ fontWeight: 600, color: '#6d28d9' }}>{order.proposalNumber}</span>
                            </div>
                        )}
                        {order.contractNumber && (
                            <div style={{ fontSize: '8.5px' }}>
                                <span style={s.infoLabel}>Contrato: </span>
                                <span style={{ fontWeight: 600, color: '#6d28d9' }}>{order.contractNumber}</span>
                            </div>
                        )}
                        {order.workName && (
                            <div style={{ fontSize: '8.5px' }}>
                                <span style={s.infoLabel}>Obra/CC: </span>
                                <span style={{ fontWeight: 600, color: '#6d28d9' }}>{order.workName}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* EMITENTE + FORNECEDOR side by side */}
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={s.sectionTitle}>Emitente</div>
                        <div style={{ fontSize: '8.5px', lineHeight: '1.5' }}>
                            <div><span style={s.infoLabel}>Razão Social: </span><span style={s.infoValue}>{empresa.nome}</span></div>
                            <div><span style={s.infoLabel}>CNPJ: </span><span style={s.infoValue}>{empresa.cnpj}</span></div>
                            <div><span style={s.infoLabel}>Endereço: </span><span style={s.infoValue}>{empresa.endereco}</span></div>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={s.sectionTitle}>Fornecedor</div>
                        <div style={{ fontSize: '8.5px', lineHeight: '1.5' }}>
                            <div><span style={s.infoLabel}>Razão Social: </span><span style={s.infoValue}>{supplierName}</span></div>
                            <div><span style={s.infoLabel}>CNPJ/CPF: </span><span style={s.infoValue}>{supplierDoc}</span></div>
                            <div><span style={s.infoLabel}>Contato: </span><span style={s.infoValue}>{supplierPhone} | {supplierEmail}</span></div>
                        </div>
                    </div>
                </div>

                {/* CLIENTE (only for direct billing) */}
                {isDirect && (
                    <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '4px', padding: '6px 12px', margin: '6px 0' }}>
                        <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '2px' }}>
                            Cliente (Faturamento Direto)
                        </div>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '8.5px' }}>
                            <div><span style={s.infoLabel}>Nome: </span><span style={s.infoValue}>{clientName}</span></div>
                            <div><span style={s.infoLabel}>CPF/CNPJ: </span><span style={s.infoValue}>{clientDoc}</span></div>
                        </div>
                        <div style={{ fontSize: '7px', color: '#7c3aed', fontStyle: 'italic', marginTop: '2px' }}>
                            ⚠ Fornecedor fatura diretamente ao cliente. Ordem de controle administrativo.
                        </div>
                    </div>
                )}

                {/* ITENS */}
                <div style={s.sectionTitle}>Itens do Pedido</div>
                <table style={s.table}>
                    <thead>
                        <tr>
                            <th style={{ ...s.th, width: '5%' }}>#</th>
                            <th style={{ ...s.th, width: '45%' }}>Descrição</th>
                            <th style={{ ...s.th, width: '7%' }}>Un</th>
                            <th style={{ ...s.thRight, width: '8%' }}>Qtd</th>
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
                            <td colSpan={5} style={{ ...s.td, textAlign: 'right', fontWeight: 700, background: '#f8fafc', fontSize: '9px', borderBottom: '2px solid #1d4ed8' }}>
                                TOTAL
                            </td>
                            <td style={{ ...s.tdRight, fontWeight: 800, background: '#f8fafc', color: '#1d4ed8', fontSize: '10px', borderBottom: '2px solid #1d4ed8' }}>
                                R$ {fmt(totalValue)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* CONDIÇÕES — compact grid */}
                <div style={s.sectionTitle}>Condições</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px 16px', fontSize: '8.5px', margin: '4px 0' }}>
                    <div><span style={s.infoLabel}>Pagamento: </span><span style={s.infoValue}>{order.paymentTerms || '—'}</span></div>
                    <div><span style={s.infoLabel}>Entrega: </span><span style={s.infoValue}>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : '—'}</span></div>
                    <div><span style={s.infoLabel}>Local: </span><span style={s.infoValue}>{order.deliveryAddress || '—'}</span></div>
                </div>

                {order.notes && (
                    <div style={{ fontSize: '8px', color: '#555', marginTop: '4px' }}>
                        <span style={{ ...s.infoLabel, color: '#1d4ed8' }}>Obs: </span>{order.notes}
                    </div>
                )}

                {/* TERMOS */}
                <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '5px', padding: '8px 12px', margin: '10px 0' }}>
                    <p style={{ fontSize: '7.5px', color: '#1e40af', lineHeight: '1.5', margin: 0, textAlign: 'justify' as const }}>
                        <strong>TERMOS:</strong> O fornecedor compromete-se a entregar os materiais/serviços especificados neste pedido, nas condições e prazos estabelecidos.
                        Divergências devem ser comunicadas previamente por escrito. O aceite implica concordância integral com as condições descritas.
                    </p>
                </div>

                {/* DATA/LOCAL */}
                <p style={{ fontSize: '8px', textAlign: 'center' as const, fontStyle: 'italic', color: '#555', margin: '6px 0' }}>
                    Recife/PE, {dateStr}.
                </p>

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
