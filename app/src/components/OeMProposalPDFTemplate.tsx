import React from 'react';
import { EXITO_GRID_LOGO } from '@/assets/exito-grid-logo-base64';

interface OeMProposalPDFTemplateProps {
    proposal: any;
    company?: any;
}

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCurrency = (v: number) => `R$ ${fmt(v)}`;

export function OeMProposalPDFTemplate({ proposal, company }: OeMProposalPDFTemplateProps) {
    const items = proposal.items || [];
    const co = company || {};
    const empresa = {
        nome: co.razaoSocial || co.name || co.tradeName || 'EXITO GRID COMERCIO E SERVICOS ELETRICOS LTDA',
        cnpj: co.cnpj || '55.303.935/0001-39',
        endereco: co.address ? `${co.address}${co.number ? ', ' + co.number : ''}${co.complement ? ', ' + co.complement : ''} — ${co.neighborhood || ''}, ${co.city || 'Recife'}/${co.state || 'PE'}` : 'R General Polidoro, 352, Loja 0104 — Varzea, Recife/PE',
        telefone: co.phone || '(81) 8887-0766',
        email: co.email || 'contato@exitogrid.com.br',
        site: co.website || 'www.exitogrid.com.br',
    };

    const clientName = proposal.client?.name || proposal.clientName || '—';
    const clientDoc = proposal.client?.document || proposal.clientDocument || '—';
    const clientAddress = proposal.client?.address || proposal.clientAddress || '—';

    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const total = Number(proposal.total || 0);

    // Parse scope for usina data
    const scope = proposal.scope || '';
    const scopeLines = scope.split('\n');

    // Parse benefits from notes or scope
    const benefitsRaw = proposal.notes || '';
    const benefits = benefitsRaw ? benefitsRaw.split('\n').filter((l: string) => l.trim()) : [];

    // ═══ STYLES ═══
    const s = {
        page: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: '10pt', color: '#1a1a1a', lineHeight: '1.55', maxWidth: 800, margin: '0 auto', background: '#fff' } as React.CSSProperties,
        // Hero header - dark gradient
        heroHeader: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', padding: '36px 40px', position: 'relative' as const, overflow: 'hidden' as const } as React.CSSProperties,
        heroOverlay: { position: 'absolute' as const, top: 0, right: 0, width: '300px', height: '100%', background: 'linear-gradient(135deg, transparent, rgba(245, 158, 11, 0.15))', borderRadius: '0 0 0 200px' } as React.CSSProperties,
        heroTitle: { fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px', position: 'relative' as const, zIndex: 1 } as React.CSSProperties,
        heroSubtitle: { fontSize: '11px', color: '#94a3b8', letterSpacing: '3px', textTransform: 'uppercase' as const, fontWeight: 600, position: 'relative' as const, zIndex: 1 } as React.CSSProperties,
        heroRef: { fontSize: '9px', color: '#64748b', position: 'relative' as const, zIndex: 1, marginTop: '12px' } as React.CSSProperties,
        // Accent bar
        accentBar: { height: '4px', background: 'linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6)' } as React.CSSProperties,
        body: { padding: '32px 40px' } as React.CSSProperties,
        // Section headers
        sectionTitle: { fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' as const, letterSpacing: '2px', borderBottom: '3px solid #f59e0b', paddingBottom: '8px', marginTop: '32px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' } as React.CSSProperties,
        sectionIcon: { width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 700 } as React.CSSProperties,
        para: { fontSize: '10px', textAlign: 'justify' as const, margin: '6px 0', color: '#334155', lineHeight: '1.65' } as React.CSSProperties,
        // Benefit card
        benefitCard: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', background: '#fefce8', borderLeft: '3px solid #f59e0b', borderRadius: '0 6px 6px 0', margin: '6px 0' } as React.CSSProperties,
        // Service row
        serviceRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#f8fafc', borderRadius: '8px', margin: '4px 0', borderLeft: '3px solid #22c55e' } as React.CSSProperties,
        serviceInactive: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px', margin: '3px 0', opacity: 0.5, borderLeft: '3px solid #cbd5e1' } as React.CSSProperties,
        // SLA badge
        slaBox: { display: 'inline-flex', flexDirection: 'column' as const, alignItems: 'center', padding: '14px 20px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '10px', border: '1px solid #93c5fd', minWidth: '120px' } as React.CSSProperties,
        slaValue: { fontSize: '20px', fontWeight: 800, color: '#1d4ed8' } as React.CSSProperties,
        slaLabel: { fontSize: '8px', color: '#3b82f6', textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600, marginTop: '4px' } as React.CSSProperties,
        // Pricing
        priceHighlight: { background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '12px', padding: '24px', color: '#fff', margin: '20px 0' } as React.CSSProperties,
        priceRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '10px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
        priceTotalRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #f59e0b', marginTop: '10px' } as React.CSSProperties,
        // Guarantee
        guaranteeBox: { background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '10px', padding: '18px 24px', margin: '14px 0' } as React.CSSProperties,
        // Signature
        sigArea: { display: 'flex', justifyContent: 'space-between', gap: '60px', marginTop: '40px', paddingTop: '20px', breakInside: 'avoid' as const } as React.CSSProperties,
        sigBox: { flex: 1, textAlign: 'center' as const } as React.CSSProperties,
        sigLine: { borderTop: '1px solid #333', marginTop: '50px', paddingTop: '8px', fontSize: '9px', fontWeight: 600 } as React.CSSProperties,
        sigSub: { fontSize: '8px', color: '#777' },
        footer: { background: '#0f172a', padding: '16px 40px', textAlign: 'center' as const, marginTop: '30px', breakInside: 'avoid' as const } as React.CSSProperties,
        footerText: { fontSize: '8px', color: '#64748b', letterSpacing: '1px' },
    };

    // Parse serviços from items
    const allServices = [
        { key: 'limpeza', label: 'Limpeza dos Módulos Fotovoltaicos', desc: 'Lavagem com água deionizada e escova macia para remoção de sujidades acumuladas' },
        { key: 'inspecao', label: 'Inspeção Visual Completa', desc: 'Verificação de módulos, estrutura metálica, cabos, conectores MC4 e quadros' },
        { key: 'termografia', label: 'Termografia Infravermelha', desc: 'Detecção de hotspots e pontos de aquecimento anormal nos módulos e conexões' },
        { key: 'teste', label: 'Teste de String (Curva I-V)', desc: 'Análise da curva de corrente-tensão para identificação de degradação' },
        { key: 'monitoramento', label: 'Monitoramento Remoto 24/7', desc: 'Acompanhamento contínuo da geração e alerta automático de anomalias' },
        { key: 'corretiva', label: 'Manutenção Corretiva Prioritária', desc: 'Atendimento emergencial com prioridade no tempo de resposta' },
    ];

    const activeServices = items.length > 0
        ? items.map((it: any) => it.description)
        : allServices.map(s => s.label);

    return (
        <div id="proposal-pdf-content" className="pdf-section" style={s.page}>
            <style>{`
                #proposal-pdf-content tr { break-inside: avoid; }
                #proposal-pdf-content .sig-block { break-inside: avoid; }
                #proposal-pdf-content .pdf-keep-together { break-inside: avoid; }
                #proposal-pdf-content .pdf-section-title { break-inside: avoid; break-after: avoid; }
                #proposal-pdf-content { padding-bottom: 38px; }
            `}</style>

            {/* ═══ HERO HEADER ═══ */}
            <div style={s.heroHeader}>
                <div style={s.heroOverlay} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' as const, zIndex: 1 }}>
                    <div>
                        <img src={EXITO_GRID_LOGO} alt="Êxito Grid" style={{ height: '45px', objectFit: 'contain', marginBottom: '16px', filter: 'brightness(0) invert(1)' }} />
                        <div style={s.heroSubtitle}>Proposta de Operação & Manutenção</div>
                        <div style={s.heroTitle}>{proposal.title || 'Plano de O&M Solar'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8', lineHeight: 1.8 }}>
                            <div style={{ fontWeight: 700, color: '#f59e0b' }}>{empresa.telefone}</div>
                            <div>{empresa.email}</div>
                            <div>{empresa.site}</div>
                        </div>
                    </div>
                </div>
                <div style={s.heroRef}>
                    Ref: {proposal.proposalNumber || '—'} | {dateStr}
                </div>
            </div>

            {/* Accent bar */}
            <div style={s.accentBar} />

            {/* ═══ BODY ═══ */}
            <div style={s.body}>

                {/* ─── IDENTIFICAÇÃO ─── */}
                <div style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#3b82f6' }}>👤</div>
                    1. Identificação
                </div>
                <div style={{ display: 'flex', gap: '20px', margin: '10px 0' }}>
                    <div style={{ flex: 1, background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '4px' }}>Contratada</p>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>{empresa.nome}</p>
                        <p style={{ fontSize: '9px', color: '#475569' }}>CNPJ: {empresa.cnpj}</p>
                        <p style={{ fontSize: '9px', color: '#475569' }}>{empresa.endereco}</p>
                    </div>
                    <div style={{ flex: 1, background: '#fffbeb', padding: '14px 18px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <p style={{ fontSize: '8px', color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '4px' }}>Contratante</p>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>{clientName}</p>
                        <p style={{ fontSize: '9px', color: '#475569' }}>CPF/CNPJ: {clientDoc}</p>
                        <p style={{ fontSize: '9px', color: '#475569' }}>{clientAddress}</p>
                    </div>
                </div>

                {/* ─── POR QUE O&M? (IMPORTÂNCIA) ─── */}
                <div style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#f59e0b' }}>☀️</div>
                    2. A Importância da Manutenção Solar
                </div>
                <p style={s.para}>
                    Sistemas fotovoltaicos são projetados para operar por mais de 25 anos, porém a ausência de manutenção adequada pode resultar em perdas de geração de até <strong>25% ao ano</strong>, além de comprometer a segurança da instalação e a validade das garantias dos equipamentos.
                </p>
                <p style={s.para}>
                    A contratação de um plano de Operação & Manutenção (O&M) profissional garante a <strong>maximização da geração de energia</strong>, a <strong>preservação do investimento</strong>, o cumprimento das normas técnicas vigentes e a <strong>identificação preventiva de falhas</strong> antes que causem danos significativos ao sistema.
                </p>

                {/* ─── BENEFÍCIOS ─── */}
                {benefits.length > 0 && (
                    <>
                        <div style={s.sectionTitle}>
                            <div style={{ ...s.sectionIcon, background: '#22c55e' }}>✨</div>
                            3. Benefícios do Plano
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {benefits.map((b: string, i: number) => (
                                <div key={i} style={s.benefitCard}>
                                    <span style={{ fontSize: '14px', lineHeight: 1, shrinkFlex: 0 } as any}>✓</span>
                                    <span style={{ fontSize: '10px', color: '#713f12', lineHeight: 1.5 }}>{b.replace(/^[•▸\-]\s*/, '')}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ─── ESCOPO TÉCNICO ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#8b5cf6' }}>🔧</div>
                    {benefits.length > 0 ? '4' : '3'}. Escopo Técnico & Dados do Sistema
                </div>
                {scope && (
                    <div style={{ background: '#faf5ff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e9d5ff', marginBottom: '16px' }}>
                        {scopeLines.map((line: string, i: number) => (
                            <p key={i} style={{ fontSize: '10px', color: '#581c87', margin: '3px 0', fontWeight: line.includes(':') && !line.includes('•') ? 700 : 400 }}>
                                {line}
                            </p>
                        ))}
                    </div>
                )}

                {/* ─── SERVIÇOS INCLUÍDOS ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#22c55e' }}>🛠️</div>
                    {benefits.length > 0 ? '5' : '4'}. Serviços Incluídos
                </div>
                <p style={s.para}>
                    {proposal.workDescription || 'O plano de O&M contempla as seguintes atividades técnicas, executadas por equipe especializada e certificada:'}
                </p>
                {allServices.map((svc, i) => {
                    const isIncluded = activeServices.some((as: string) =>
                        as.toLowerCase().includes(svc.label.split(' ')[0].toLowerCase()) ||
                        svc.label.toLowerCase().includes(as.split(' ')[0].toLowerCase())
                    );
                    return (
                        <div key={i} style={isIncluded ? s.serviceRow : s.serviceInactive}>
                            <span style={{ fontSize: '14px', lineHeight: 1 }}>{isIncluded ? '✅' : '⬜'}</span>
                            <div>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: isIncluded ? '#166534' : '#94a3b8', margin: 0 }}>{svc.label}</p>
                                <p style={{ fontSize: '9px', color: isIncluded ? '#4ade80' : '#cbd5e1', margin: '2px 0 0' }}>{svc.desc}</p>
                            </div>
                        </div>
                    );
                })}

                {/* ─── SLA ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#3b82f6' }}>⏱️</div>
                    {benefits.length > 0 ? '6' : '5'}. Acordo de Nível de Serviço (SLA)
                </div>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '16px 0' }}>
                    <div style={s.slaBox}>
                        <span style={s.slaValue}>48h</span>
                        <span style={s.slaLabel}>Resposta Normal</span>
                    </div>
                    <div style={{ ...s.slaBox, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #f59e0b' }}>
                        <span style={{ ...s.slaValue, color: '#d97706' }}>4h</span>
                        <span style={{ ...s.slaLabel, color: '#b45309' }}>Resp. Urgente</span>
                    </div>
                    <div style={{ ...s.slaBox, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #4ade80' }}>
                        <span style={{ ...s.slaValue, color: '#16a34a' }}>24/7</span>
                        <span style={{ ...s.slaLabel, color: '#15803d' }}>Monitoramento</span>
                    </div>
                </div>
                <p style={{ ...s.para, textAlign: 'center', fontStyle: 'italic', fontSize: '9px', color: '#64748b' }}>
                    Tempos de resposta contados a partir da abertura do chamado técnico.
                </p>

                {/* ─── GARANTIAS ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#059669' }}>🛡️</div>
                    {benefits.length > 0 ? '7' : '6'}. Garantias
                </div>
                <div style={s.guaranteeBox}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '18px' }}>✓</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Garantia de Qualidade Técnica
                        </span>
                    </div>
                    <p style={{ ...s.para, color: '#166534', fontSize: '10px' }}>
                        A CONTRATADA garante a qualidade técnica de todos os serviços prestados, comprometendo-se a executar as atividades de acordo com as melhores práticas do setor fotovoltaico e em conformidade com as seguintes normas:
                    </p>
                    <div style={{ margin: '8px 0 0 12px', fontSize: '9.5px', color: '#166534', lineHeight: 1.8 }}>
                        <div>▸ <strong>NBR 16690</strong> — Instalações elétricas de arranjos fotovoltaicos</div>
                        <div>▸ <strong>NR-10</strong> — Segurança em Instalações e Serviços em Eletricidade</div>
                        <div>▸ <strong>NR-35</strong> — Trabalho em Altura</div>
                        <div>▸ <strong>IEC 62446</strong> — Comissionamento e inspeção de sistemas FV</div>
                        <div>▸ Garantia de <strong>performance mínima</strong> conforme especificações do plano contratado</div>
                    </div>
                </div>

                {/* ─── INVESTIMENTO ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#f59e0b' }}>💰</div>
                    {benefits.length > 0 ? '8' : '7'}. Investimento
                </div>
                <div className="pdf-keep-together" style={s.priceHighlight}>
                    <p style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '12px' }}>
                        Detalhamento do Investimento
                    </p>
                    {items.length > 0 && items.map((item: any, i: number) => (
                        <div key={i} style={s.priceRow}>
                            <span>{item.description}</span>
                            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{fmtCurrency(item.total || item.unitPrice)}</span>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div style={s.priceRow}>
                            <span>Plano de O&M Completo</span>
                            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{fmtCurrency(total)}</span>
                        </div>
                    )}
                    <div style={s.priceTotalRow}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Valor Mensal
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#f59e0b' }}>
                            {fmtCurrency(total)}
                        </span>
                    </div>
                    <p style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', marginTop: '6px' }}>
                        Valor anual: {fmtCurrency(total * 12)}
                    </p>
                </div>

                {/* ─── CONDIÇÕES ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#6366f1' }}>📋</div>
                    {benefits.length > 0 ? '9' : '8'}. Condições Gerais
                </div>
                <p style={s.para}>
                    {proposal.paymentConditions || 'O pagamento será realizado mensalmente, por meio de boleto bancário ou PIX, até o dia 10 de cada mês subsequente ao da prestação dos serviços.'}
                </p>
                <div style={{ margin: '10px 0', fontSize: '9.5px', color: '#334155', lineHeight: 2 }}>
                    <div>▸ Vigência mínima de <strong>12 meses</strong> a contar da data de assinatura</div>
                    <div>▸ Renovação automática por períodos iguais, salvo manifestação em contrário com 30 dias de antecedência</div>
                    <div>▸ Reajuste anual pelo índice <strong>IGPM</strong></div>
                    <div>▸ Esta proposta tem validade de <strong>{proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '30 dias'}</strong></div>
                </div>

                {/* ─── ASSINATURA DIGITAL ─── */}
                {proposal.signedAt && (
                    <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '16px 20px', margin: '20px 0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>
                            ✓ PROPOSTA ASSINADA DIGITALMENTE
                        </div>
                        <div style={{ fontSize: '9px', color: '#333', lineHeight: 1.7 }}>
                            <div><strong>Assinado por:</strong> {proposal.signedByName}</div>
                            <div><strong>Documento:</strong> {proposal.signedByDocument}</div>
                            <div><strong>Data/Hora:</strong> {new Date(proposal.signedAt).toLocaleString('pt-BR')}</div>
                            <div><strong>IP:</strong> {proposal.signedByIP}</div>
                            {proposal.signatureVerificationCode && (
                                <div><strong>Código de verificação:</strong> {proposal.signatureVerificationCode}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── ASSINATURAS ─── */}
                <div style={{ marginTop: '10px' }}>
                    <p style={{ ...s.para, textAlign: 'center', fontStyle: 'italic', color: '#555' }}>
                        Recife/PE, {dateStr}.
                    </p>
                </div>

                <div className="sig-block" style={s.sigArea}>
                    <div style={s.sigBox}>
                        <div style={s.sigLine}>{empresa.nome}</div>
                        <div style={s.sigSub}>CNPJ: {empresa.cnpj}</div>
                        <div style={{ ...s.sigSub, fontWeight: 600 }}>CONTRATADA</div>
                    </div>
                    <div style={s.sigBox}>
                        <div style={s.sigLine}>{clientName}</div>
                        <div style={s.sigSub}>CPF/CNPJ: {clientDoc}</div>
                        <div style={{ ...s.sigSub, fontWeight: 600 }}>CONTRATANTE</div>
                    </div>
                </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={s.footer}>
                <div style={s.footerText}>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>EXITO GRID</span>
                    {' '} — Especialistas em O&M Solar | {empresa.nome} | CNPJ: {empresa.cnpj}
                </div>
            </div>
        </div>
    );
}
