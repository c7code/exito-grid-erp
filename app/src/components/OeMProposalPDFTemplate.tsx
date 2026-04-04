import React from 'react';
import { EXITO_GRID_LOGO } from '@/assets/exito-grid-logo-base64';

interface OeMProposalPDFTemplateProps {
    proposal: any;
    company?: any;
    signatures?: Record<string, { imageUrl?: string; signerName?: string; signerRole?: string; signerDocument?: string }>;
}

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCurrency = (v: number) => `R$ ${fmt(v)}`;

// ═══ PARSER DE TEXTO ESTRUTURADO (inline — sem dependência externa) ═══
function renderStructuredText(text: string | undefined | null, baseStyle: React.CSSProperties): React.ReactNode {
    if (!text) return null;
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return null;
    if (lines.length === 1) return <p style={{ ...baseStyle, whiteSpace: 'pre-line' }}>{text}</p>;
    return (
        <div>
            {lines.map((line, i) => {
                const trimmed = line.trim();
                const isNumbered = /^\d+[\.\)]\s/.test(trimmed);
                const isBullet = /^[•▸\-—–]\s/.test(trimmed);
                const isHeader = /^[A-ZÁÉÍÓÚÂÊÔÃ][A-ZÁÉÍÓÚÂÊÔÃ\s:]+:?\s*$/.test(trimmed);
                const indent = isNumbered ? 8 : isBullet ? 12 : 0;
                return (
                    <div key={i} style={{
                        ...baseStyle,
                        paddingLeft: `${indent}px`,
                        fontWeight: isHeader ? 700 : undefined,
                        margin: isHeader ? '10px 0 4px' : '2px 0',
                    }}>
                        {trimmed}
                    </div>
                );
            })}
        </div>
    );
}

export function OeMProposalPDFTemplate({ proposal, company, signatures }: OeMProposalPDFTemplateProps) {
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
    const clientPhone = proposal.client?.phone || proposal.clientPhone || '';
    const clientEmail = proposal.client?.email || proposal.clientEmail || '';

    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const total = Number(proposal.total || 0);

    // Display mode: grouping (com_valor), summary (sem_valor), text_only (texto)
    const visibilityMode = proposal.itemVisibilityMode || 'grouping';

    // Parse scope for usina data
    const scope = proposal.scope || '';
    const scopeLines = scope.split('\n');

    // Parse benefits from notes
    const benefitsRaw = proposal.notes || '';
    const benefits = benefitsRaw ? benefitsRaw.split('\n').filter((l: string) => l.trim()) : [];

    // ── Dynamic fields with SAFE FALLBACK (backward compat) ──
    const paymentConditions = proposal.paymentConditions || 'O pagamento será realizado mensalmente, por meio de boleto bancário ou PIX, até o dia 10 de cada mês subsequente ao da prestação dos serviços.';
    const contractorObligations = proposal.contractorObligations || null;
    const clientObligations = proposal.clientObligations || null;
    const generalProvisions = proposal.generalProvisions || null;
    const complianceText = proposal.complianceText || null;
    const workDeadlineText = proposal.workDeadlineText || null;
    const validUntilStr = proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '30 dias';
    const deadlineStr = proposal.deadline || null;

    // ── Auto-numbering sections ──
    let sectionIndex = 0;
    const nextSection = () => ++sectionIndex;

    // ═══ STYLES — Premium OeM Layout ═══
    const s = {
        page: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: '10pt', color: '#1a1a1a', lineHeight: '1.55', maxWidth: 800, margin: '0 auto', background: '#fff' } as React.CSSProperties,
        // Hero
        heroHeader: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', padding: '38px 44px 32px', position: 'relative' as const, overflow: 'hidden' as const } as React.CSSProperties,
        heroOverlay: { position: 'absolute' as const, top: 0, right: 0, width: '320px', height: '100%', background: 'linear-gradient(135deg, transparent 30%, rgba(245, 158, 11, 0.12))', borderRadius: '0 0 0 200px' } as React.CSSProperties,
        heroTitle: { fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px', position: 'relative' as const, zIndex: 1 } as React.CSSProperties,
        heroSubtitle: { fontSize: '10px', color: '#94a3b8', letterSpacing: '3.5px', textTransform: 'uppercase' as const, fontWeight: 600, position: 'relative' as const, zIndex: 1 } as React.CSSProperties,
        heroRef: { fontSize: '9px', color: '#64748b', position: 'relative' as const, zIndex: 1, marginTop: '14px', display: 'flex', gap: '16px', flexWrap: 'wrap' as const } as React.CSSProperties,
        heroBadge: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 10px', borderRadius: '4px', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const } as React.CSSProperties,
        // Accent
        accentBar: { height: '4px', background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 45%, #8b5cf6 100%)' } as React.CSSProperties,
        body: { padding: '32px 44px' } as React.CSSProperties,
        // Sections
        sectionTitle: { fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' as const, letterSpacing: '2px', borderBottom: '3px solid #f59e0b', paddingBottom: '10px', marginTop: '34px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px', breakInside: 'avoid' as const, breakAfter: 'avoid' as const } as React.CSSProperties,
        sectionIcon: { width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 700, flexShrink: 0 } as React.CSSProperties,
        sectionNum: { fontSize: '10px', fontWeight: 800, color: '#f59e0b', minWidth: '18px' } as React.CSSProperties,
        para: { fontSize: '10px', textAlign: 'justify' as const, margin: '6px 0', color: '#334155', lineHeight: '1.7' } as React.CSSProperties,
        // Cards
        idCard: { flex: 1, padding: '16px 20px', borderRadius: '10px', border: '1px solid' } as React.CSSProperties,
        idLabel: { fontSize: '7.5px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', fontWeight: 700, marginBottom: '6px' } as React.CSSProperties,
        idName: { fontSize: '10.5px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' } as React.CSSProperties,
        idDetail: { fontSize: '9px', color: '#475569', margin: '1px 0' } as React.CSSProperties,
        // Benefits
        benefitCard: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', background: '#fefce8', borderLeft: '3px solid #f59e0b', borderRadius: '0 8px 8px 0', margin: '5px 0' } as React.CSSProperties,
        // Services
        serviceRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', background: '#f8fafc', borderRadius: '8px', margin: '4px 0', borderLeft: '4px solid #22c55e' } as React.CSSProperties,
        // SLA
        slaBox: { display: 'inline-flex', flexDirection: 'column' as const, alignItems: 'center', padding: '16px 22px', borderRadius: '12px', border: '1px solid', minWidth: '130px' } as React.CSSProperties,
        slaValue: { fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' } as React.CSSProperties,
        slaLabel: { fontSize: '7.5px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', fontWeight: 700, marginTop: '5px' } as React.CSSProperties,
        // Price
        priceHighlight: { background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '14px', padding: '26px 28px', color: '#fff', margin: '20px 0' } as React.CSSProperties,
        priceRow: { display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: '10px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)' } as React.CSSProperties,
        priceTotalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '2px solid #f59e0b', marginTop: '12px' } as React.CSSProperties,
        // Obligation card
        oblCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px 22px', margin: '10px 0' } as React.CSSProperties,
        oblTitle: { fontSize: '10px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' } as React.CSSProperties,
        // Guarantee
        guaranteeBox: { background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '2px solid #22c55e', borderRadius: '12px', padding: '20px 24px', margin: '14px 0' } as React.CSSProperties,
        // General provisions
        provisionBox: { background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '18px 22px', margin: '10px 0' } as React.CSSProperties,
        // Signature
        sigArea: { display: 'flex', justifyContent: 'space-between', gap: '60px', marginTop: '40px', paddingTop: '20px', breakInside: 'avoid' as const } as React.CSSProperties,
        sigBox: { flex: 1, textAlign: 'center' as const } as React.CSSProperties,
        sigLine: { borderTop: '1.5px solid #1e293b', marginTop: '50px', paddingTop: '10px', fontSize: '9px', fontWeight: 700, color: '#0f172a' } as React.CSSProperties,
        sigSub: { fontSize: '8px', color: '#64748b', marginTop: '2px' } as React.CSSProperties,
        footer: { background: '#0f172a', padding: '18px 44px', textAlign: 'center' as const, marginTop: '30px', breakInside: 'avoid' as const } as React.CSSProperties,
        footerText: { fontSize: '8px', color: '#64748b', letterSpacing: '1px' } as React.CSSProperties,
    };

    // Parse SLA from scope (extraído do backend no scope se disponível)
    const slaFromScope = scope.match(/resposta normal:\s*(\d+)h/i);
    const slaUrgenteFromScope = scope.match(/resposta urgente:\s*(\d+)h/i);
    const slaHoras = slaFromScope ? slaFromScope[1] : '48';
    const slaUrgente = slaUrgenteFromScope ? slaUrgenteFromScope[1] : '4';

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
                        <img src={EXITO_GRID_LOGO} alt="Êxito Grid" style={{ height: '48px', objectFit: 'contain', marginBottom: '18px', filter: 'brightness(0) invert(1)' }} />
                        <div style={s.heroSubtitle}>Proposta de Operação & Manutenção</div>
                        <div style={s.heroTitle}>{proposal.title || 'Plano de O&M Solar'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8', lineHeight: 1.9 }}>
                            <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '10px' }}>{empresa.telefone}</div>
                            <div>{empresa.email}</div>
                            <div>{empresa.site}</div>
                        </div>
                    </div>
                </div>
                <div style={s.heroRef as any}>
                    <span>Ref: {proposal.proposalNumber || '—'}</span>
                    <span>{dateStr}</span>
                    <span style={s.heroBadge}>Válida até {validUntilStr}</span>
                </div>
            </div>
            <div style={s.accentBar} />

            {/* ═══ BODY ═══ */}
            <div style={s.body}>

                {/* ─── 1. IDENTIFICAÇÃO ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#3b82f6' }}>👤</div>
                    <span style={s.sectionNum}>{nextSection()}.</span>
                    Identificação das Partes
                </div>
                <div style={{ display: 'flex', gap: '16px', margin: '10px 0' }}>
                    <div style={{ ...s.idCard, background: '#f8fafc', borderColor: '#e2e8f0' }}>
                        <p style={{ ...s.idLabel, color: '#64748b' }}>Contratada</p>
                        <p style={s.idName}>{empresa.nome}</p>
                        <p style={s.idDetail}>CNPJ: {empresa.cnpj}</p>
                        <p style={s.idDetail}>{empresa.endereco}</p>
                        <p style={s.idDetail}>{empresa.telefone} | {empresa.email}</p>
                    </div>
                    <div style={{ ...s.idCard, background: '#fffbeb', borderColor: '#fde68a' }}>
                        <p style={{ ...s.idLabel, color: '#92400e' }}>Contratante</p>
                        <p style={s.idName}>{clientName}</p>
                        <p style={s.idDetail}>CPF/CNPJ: {clientDoc}</p>
                        <p style={s.idDetail}>{clientAddress}</p>
                        {(clientPhone || clientEmail) && (
                            <p style={s.idDetail}>{[clientPhone, clientEmail].filter(Boolean).join(' | ')}</p>
                        )}
                    </div>
                </div>

                {/* ─── 2. IMPORTÂNCIA DA MANUTENÇÃO ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#f59e0b' }}>☀️</div>
                    <span style={s.sectionNum}>{nextSection()}.</span>
                    A Importância da Manutenção Solar
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '18px 22px' }}>
                    <p style={{ ...s.para, color: '#92400e' }}>
                        Sistemas fotovoltaicos são projetados para operar por mais de 25 anos, porém a ausência de manutenção adequada pode resultar em perdas de geração de até <strong>25% ao ano</strong>, além de comprometer a segurança da instalação e a validade das garantias dos equipamentos.
                    </p>
                    <p style={{ ...s.para, color: '#92400e', marginTop: '8px' }}>
                        A contratação de um plano de Operação & Manutenção (O&M) profissional garante a <strong>maximização da geração de energia</strong>, a <strong>preservação do investimento</strong>, o cumprimento das normas técnicas vigentes e a <strong>identificação preventiva de falhas</strong> antes que causem danos significativos ao sistema.
                    </p>
                </div>

                {/* ─── ANÁLISE DE IMPACTO & RETORNO (condicional — só aparece se pricingEngineData preenchido) ─── */}
                {(() => {
                    let pe: any = null;
                    try { pe = proposal.pricingEngineData ? JSON.parse(proposal.pricingEngineData) : null; } catch { pe = null; }
                    if (!pe) return null;
                    const hasGenData = pe.geracaoEsperadaKwh && pe.geracaoAtualKwh;
                    const perdaPct = pe.perdaPercentual || 0;
                    const cardStyle: React.CSSProperties = { flex: 1, padding: '18px 16px', borderRadius: '12px', textAlign: 'center' as const, border: '1px solid' };
                    return (
                        <>
                            <div className="pdf-section-title" style={s.sectionTitle}>
                                <div style={{ ...s.sectionIcon, background: '#ef4444' }}>📊</div>
                                <span style={s.sectionNum}>{nextSection()}.</span>
                                Análise de Impacto & Retorno
                            </div>
                            {/* 3 Metric Cards */}
                            <div style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
                                <div style={{ ...cardStyle, background: '#eff6ff', borderColor: '#bfdbfe' }}>
                                    <p style={{ fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', fontWeight: 700, color: '#3b82f6', marginBottom: '4px' }}>Investimento da Usina</p>
                                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#1e40af' }}>{fmtCurrency(pe.valorEstimadoUsina || 0)}</p>
                                    <p style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>Valor estimado (ref. FIPE)</p>
                                </div>
                                <div style={{ ...cardStyle, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                    <p style={{ fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', fontWeight: 700, color: '#22c55e', marginBottom: '4px' }}>Base Manutenção</p>
                                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#166534' }}>{fmtCurrency(pe.valorBaseManutencao || 0)}</p>
                                    <p style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>{pe.percentualManutencao || 10}% do valor da usina</p>
                                </div>
                                {hasGenData && (
                                    <div style={{ ...cardStyle, background: perdaPct > 0 ? '#fef2f2' : '#f0fdf4', borderColor: perdaPct > 0 ? '#fecaca' : '#bbf7d0' }}>
                                        <p style={{ fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', fontWeight: 700, color: perdaPct > 0 ? '#ef4444' : '#22c55e', marginBottom: '4px' }}>Eficiência</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: perdaPct > 0 ? '#991b1b' : '#166534' }}>{perdaPct > 0 ? `-${perdaPct}%` : '100%'}</p>
                                        <p style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>{perdaPct > 0 ? 'Perda detectada' : 'Geração normal'}</p>
                                    </div>
                                )}
                            </div>

                            {/* Generation Comparison */}
                            {hasGenData && (
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 22px', margin: '12px 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <div>
                                            <p style={{ fontSize: '9.5px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', fontWeight: 700, color: '#64748b' }}>Geração Esperada</p>
                                            <p style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e' }}>{fmt(pe.geracaoEsperadaKwh)} kWh/mês</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '9.5px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', fontWeight: 700, color: '#64748b' }}>Geração Atual</p>
                                            <p style={{ fontSize: '16px', fontWeight: 800, color: perdaPct > 0 ? '#ef4444' : '#22c55e' }}>{fmt(pe.geracaoAtualKwh)} kWh/mês</p>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{ background: '#e2e8f0', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
                                        <div style={{ background: perdaPct > 5 ? 'linear-gradient(90deg, #22c55e, #ef4444)' : '#22c55e', width: `${Math.max(10, 100 - perdaPct)}%`, height: '100%', borderRadius: '6px', transition: 'width 0.3s' }} />
                                    </div>
                                    {perdaPct > 0 && pe.perdaKwh && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '12px 16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                            <div>
                                                <p style={{ fontSize: '10px', fontWeight: 700, color: '#991b1b' }}>⚠️ Perda mensal detectada</p>
                                                <p style={{ fontSize: '11px', color: '#7f1d1d' }}>{fmt(pe.perdaKwh)} kWh perdidos por mês ({perdaPct}%)</p>
                                            </div>
                                            {pe.perdaFinanceiraEstimada > 0 && (
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#991b1b' }}>Impacto financeiro</p>
                                                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626' }}>~{fmtCurrency(pe.perdaFinanceiraEstimada)}/mês</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {perdaPct > 0 && (
                                        <p style={{ fontSize: '10px', color: '#7f1d1d', marginTop: '8px', fontStyle: 'italic' }}>
                                            ⚠️ Sem manutenção adequada, a estimativa de perda pode ultrapassar 25% da geração nominal, agravando o prejuízo financeiro e comprometendo a vida útil dos equipamentos.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Mensagem de reforço — sempre visível quando há dados de geração */}
                            {hasGenData && (
                                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 18px', margin: '12px 0' }}>
                                    <p style={{ fontSize: '10.5px', color: '#92400e', lineHeight: 1.7 }}>
                                        <strong>Por que investir em manutenção?</strong> A manutenção periódica é o principal fator para preservar o retorno sobre o investimento da sua usina. Equipamentos sem acompanhamento técnico degradam mais rapidamente, elevando custos de reparo e reduzindo a vida útil do sistema. O plano proposto visa garantir a máxima eficiência da geração e proteger o patrimônio do contratante.
                                    </p>
                                </div>
                            )}
                        </>
                    );
                })()}

                {/* ─── BENEFÍCIOS (condicional) ─── */}
                {benefits.length > 0 && (
                    <>
                        <div className="pdf-section-title" style={s.sectionTitle}>
                            <div style={{ ...s.sectionIcon, background: '#22c55e' }}>✨</div>
                            <span style={s.sectionNum}>{nextSection()}.</span>
                            Benefícios do Plano
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {benefits.map((b: string, i: number) => (
                                <div key={i} style={s.benefitCard}>
                                    <span style={{ fontSize: '13px', lineHeight: 1, color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>✓</span>
                                    <span style={{ fontSize: '9.5px', color: '#713f12', lineHeight: 1.55 }}>{b.replace(/^[•▸\-]\s*/, '')}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ─── ESCOPO TÉCNICO ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#8b5cf6' }}>🔧</div>
                    <span style={s.sectionNum}>{nextSection()}.</span>
                    Escopo Técnico & Dados do Sistema
                </div>
                {scope && (
                    <div style={{ background: '#faf5ff', padding: '18px 22px', borderRadius: '10px', border: '1px solid #e9d5ff', marginBottom: '16px' }}>
                        {scopeLines.map((line: string, i: number) => {
                            const isHeader = line.trim().endsWith(':') && !line.trim().startsWith('•');
                            const isBullet = line.trim().startsWith('•');
                            return (
                                <p key={i} style={{
                                    fontSize: isHeader ? '10px' : '9.5px',
                                    color: '#581c87',
                                    margin: isHeader ? '10px 0 4px' : '2px 0',
                                    fontWeight: isHeader ? 800 : 400,
                                    paddingLeft: isBullet ? '8px' : '0',
                                    letterSpacing: isHeader ? '1px' : undefined,
                                    textTransform: isHeader ? 'uppercase' as const : undefined,
                                }}>
                                    {line}
                                </p>
                            );
                        })}
                    </div>
                )}

                {/* ─── SERVIÇOS INCLUÍDOS ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#22c55e' }}>🛠️</div>
                    <span style={s.sectionNum}>{nextSection()}.</span>
                    Serviços Incluídos
                </div>
                <p style={s.para}>
                    {proposal.workDescription || 'O plano de O&M contempla as seguintes atividades técnicas, executadas por equipe especializada e certificada:'}
                </p>
                {items.length > 0 ? (
                    items.map((item: any, i: number) => (
                        <div key={i} style={s.serviceRow}>
                            <span style={{ fontSize: '14px', lineHeight: 1 }}>✅</span>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: '#166534', margin: 0 }}>{item.description}</p>
                            </div>
                            {visibilityMode === 'grouping' && item.showDetailedPrices !== false && (
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>{fmtCurrency(item.total || item.unitPrice)}</span>
                            )}
                        </div>
                    ))
                ) : (
                    <div style={s.serviceRow}>
                        <span style={{ fontSize: '14px', lineHeight: 1 }}>✅</span>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#166534', margin: 0 }}>Serviço de O&M Completo</p>
                    </div>
                )}

                {/* ─── PRAZO DE EXECUÇÃO (se disponível) ─── */}
                {(workDeadlineText || deadlineStr) && (
                    <>
                        <div className="pdf-section-title" style={s.sectionTitle}>
                            <div style={{ ...s.sectionIcon, background: '#0ea5e9' }}>📅</div>
                            <span style={s.sectionNum}>{nextSection()}.</span>
                            Prazo de Execução
                        </div>
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px 22px' }}>
                            <p style={{ ...s.para, color: '#0c4a6e' }}>
                                {workDeadlineText || `Prazo de execução: ${deadlineStr}.`}
                            </p>
                        </div>
                    </>
                )}

                {/* ─── SLA ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#3b82f6' }}>⏱️</div>
                    <span style={s.sectionNum}>{nextSection()}.</span>
                    Acordo de Nível de Serviço (SLA)
                </div>
                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', margin: '18px 0' }}>
                    <div style={{ ...s.slaBox, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderColor: '#93c5fd' }}>
                        <span style={{ ...s.slaValue, color: '#1d4ed8' }}>{slaHoras}h</span>
                        <span style={{ ...s.slaLabel, color: '#3b82f6' }}>Resposta Normal</span>
                    </div>
                    <div style={{ ...s.slaBox, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderColor: '#f59e0b' }}>
                        <span style={{ ...s.slaValue, color: '#d97706' }}>{slaUrgente}h</span>
                        <span style={{ ...s.slaLabel, color: '#b45309' }}>Resp. Urgente</span>
                    </div>
                    <div style={{ ...s.slaBox, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderColor: '#4ade80' }}>
                        <span style={{ ...s.slaValue, color: '#16a34a' }}>24/7</span>
                        <span style={{ ...s.slaLabel, color: '#15803d' }}>Monitoramento</span>
                    </div>
                </div>
                <p style={{ ...s.para, textAlign: 'center', fontStyle: 'italic', fontSize: '8.5px', color: '#64748b' }}>
                    Tempos de resposta contados a partir da abertura do chamado técnico.
                </p>

                {/* ─── GARANTIAS / CONFORMIDADE (dinâmico com fallback) ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#059669' }}>🛡️</div>
                    <span style={s.sectionNum}>{nextSection()}.</span>
                    Garantias & Conformidade Normativa
                </div>
                <div style={s.guaranteeBox}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '18px' }}>✓</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            Garantia de Qualidade Técnica
                        </span>
                    </div>
                    {complianceText ? (
                        renderStructuredText(complianceText, { fontSize: '9.5px', color: '#166534', lineHeight: '1.8' })
                    ) : (
                        <>
                            <p style={{ ...s.para, color: '#166534', fontSize: '9.5px' }}>
                                A CONTRATADA garante a qualidade técnica de todos os serviços prestados, comprometendo-se a executar as atividades em conformidade com as normas:
                            </p>
                            <div style={{ margin: '8px 0 0 12px', fontSize: '9.5px', color: '#166534', lineHeight: 1.8 }}>
                                <div>▸ <strong>NBR 16690</strong> — Instalações elétricas de arranjos fotovoltaicos</div>
                                <div>▸ <strong>NR-10</strong> — Segurança em Instalações e Serviços em Eletricidade</div>
                                <div>▸ <strong>NR-35</strong> — Trabalho em Altura</div>
                                <div>▸ <strong>IEC 62446</strong> — Comissionamento e inspeção de sistemas FV</div>
                            </div>
                        </>
                    )}
                </div>

                {/* ─── INVESTIMENTO ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#f59e0b' }}>💰</div>
                    <span style={s.sectionNum}>{nextSection()}.</span>
                    Investimento
                </div>

                {/* MODO: DETALHADO */}
                {visibilityMode === 'grouping' && (
                    <div className="pdf-keep-together" style={s.priceHighlight}>
                        <p style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2.5px', fontWeight: 700, marginBottom: '14px' }}>
                            Detalhamento do Investimento
                        </p>
                        {items.length > 0 && items.map((item: any, i: number) => (
                            <div key={i} style={s.priceRow}>
                                <span>{item.description}</span>
                                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{fmtCurrency(item.total || item.unitPrice)}</span>
                            </div>
                        ))}
                        {items.length === 0 && (
                            <div style={s.priceRow}>
                                <span>Serviço de O&M Completo</span>
                                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{fmtCurrency(total)}</span>
                            </div>
                        )}
                        <div style={s.priceTotalRow}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                Valor Total
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b' }}>
                                {fmtCurrency(total)}
                            </span>
                        </div>
                    </div>
                )}

                {/* MODO: RESUMO */}
                {visibilityMode === 'summary' && (
                    <div className="pdf-keep-together">
                        <p style={s.para}>O investimento contempla as seguintes atividades técnicas:</p>
                        {items.length > 0 && items.map((item: any, i: number) => (
                            <div key={i} style={{ ...s.serviceRow, margin: '3px 0', borderLeftColor: '#8b5cf6' }}>
                                <span style={{ fontSize: '12px', lineHeight: 1, color: '#8b5cf6' }}>▸</span>
                                <span style={{ fontSize: '10px', color: '#334155', fontWeight: 500 }}>{item.description}</span>
                            </div>
                        ))}
                        <div style={{ ...s.priceHighlight, marginTop: '14px' }}>
                            <div style={s.priceTotalRow}>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                    Valor Total do Serviço
                                </span>
                                <span style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b' }}>
                                    {fmtCurrency(total)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODO: TEXTO COMERCIAL */}
                {visibilityMode === 'text_only' && (
                    <div className="pdf-keep-together">
                        <p style={s.para}>
                            Para a execução completa dos serviços de {proposal.title || 'Operação & Manutenção'}, contemplando {items.length > 0 ? items.map((it: any) => it.description).join(', ') : 'todas as atividades técnicas necessárias'}, o investimento total é de:
                        </p>
                        <div style={{ ...s.priceHighlight, textAlign: 'center' }}>
                            <p style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2.5px', fontWeight: 700, marginBottom: '10px' }}>
                                Investimento Total
                            </p>
                            <span style={{ fontSize: '30px', fontWeight: 900, color: '#f59e0b' }}>
                                {fmtCurrency(total)}
                            </span>
                        </div>
                    </div>
                )}

                {/* ─── CONDIÇÕES DE PAGAMENTO ─── */}
                <div className="pdf-section-title" style={s.sectionTitle}>
                    <div style={{ ...s.sectionIcon, background: '#6366f1' }}>📋</div>
                    <span style={s.sectionNum}>{nextSection()}.</span>
                    Condições de Pagamento
                </div>
                <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '16px 22px' }}>
                    <p style={{ ...s.para, color: '#3730a3' }}>{paymentConditions}</p>
                </div>
                <div style={{ margin: '12px 0', fontSize: '9px', color: '#334155', lineHeight: 2 }}>
                    <div>▸ Esta proposta tem validade de <strong>{validUntilStr}</strong></div>
                    {proposal.paymentBank && (
                        <div>▸ <strong>Pagamento:</strong> {proposal.paymentBank}</div>
                    )}
                </div>

                {/* ─── OBRIGAÇÕES (quando preenchidas — dinâmico com fallback) ─── */}
                {(contractorObligations || clientObligations) && (
                    <>
                        <div className="pdf-section-title" style={s.sectionTitle}>
                            <div style={{ ...s.sectionIcon, background: '#0891b2' }}>⚖️</div>
                            <span style={s.sectionNum}>{nextSection()}.</span>
                            Obrigações das Partes
                        </div>
                        <div style={{ display: 'flex', gap: '14px' }}>
                            {contractorObligations && (
                                <div style={{ ...s.oblCard, flex: 1 }}>
                                    <div style={s.oblTitle}>
                                        <span style={{ fontSize: '12px' }}>🏢</span>
                                        Contratada
                                    </div>
                                    {renderStructuredText(contractorObligations, { fontSize: '9px', color: '#334155', lineHeight: '1.75' })}
                                </div>
                            )}
                            {clientObligations && (
                                <div style={{ ...s.oblCard, flex: 1, background: '#fffbeb', borderColor: '#fde68a' }}>
                                    <div style={{ ...s.oblTitle, color: '#92400e' }}>
                                        <span style={{ fontSize: '12px' }}>👤</span>
                                        Contratante
                                    </div>
                                    {renderStructuredText(clientObligations, { fontSize: '9px', color: '#78350f', lineHeight: '1.75' })}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ─── DISPOSIÇÕES GERAIS (quando preenchidas) ─── */}
                {generalProvisions && (
                    <>
                        <div className="pdf-section-title" style={s.sectionTitle}>
                            <div style={{ ...s.sectionIcon, background: '#7c3aed' }}>📜</div>
                            <span style={s.sectionNum}>{nextSection()}.</span>
                            Disposições Gerais
                        </div>
                        <div style={s.provisionBox}>
                            {renderStructuredText(generalProvisions, { fontSize: '9.5px', color: '#581c87', lineHeight: '1.8' })}
                        </div>
                    </>
                )}

                {/* ─── ASSINATURA DIGITAL ─── */}
                {proposal.signedAt && (
                    <div style={{ background: '#eff6ff', border: '2px solid #93c5fd', borderRadius: '10px', padding: '18px 22px', margin: '24px 0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', marginBottom: 8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>✓</span>
                            PROPOSTA ASSINADA DIGITALMENTE
                        </div>
                        <div style={{ fontSize: '9px', color: '#333', lineHeight: 1.8 }}>
                            <div><strong>Assinado por:</strong> {proposal.signedByName}</div>
                            <div><strong>Documento:</strong> {proposal.signedByDocument}</div>
                            <div><strong>Data/Hora:</strong> {new Date(proposal.signedAt).toLocaleString('pt-BR')}</div>
                            <div><strong>IP:</strong> {proposal.signedByIP}</div>
                            {proposal.signatureVerificationCode && (
                                <div><strong>Código de verificação:</strong> <span style={{ background: '#22c55e', color: '#fff', padding: '1px 8px', borderRadius: '4px', fontWeight: 700, letterSpacing: '2px' }}>{proposal.signatureVerificationCode}</span></div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── ASSINATURAS ─── */}
                <div style={{ marginTop: '16px' }}>
                    <p style={{ ...s.para, textAlign: 'center', fontStyle: 'italic', color: '#64748b', fontSize: '9px' }}>
                        Recife/PE, {dateStr}.
                    </p>
                </div>

                <div className="sig-block" style={s.sigArea}>
                    <div style={s.sigBox}>
                        {signatures?.contratada?.imageUrl && (
                            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                <img src={signatures.contratada.imageUrl.startsWith('/') ? `${(window as any).__API_BASE_URL || ''}${signatures.contratada.imageUrl}` : signatures.contratada.imageUrl} alt="Assinatura" style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain' }} />
                            </div>
                        )}
                        <div style={s.sigLine}>{signatures?.contratada?.signerName || empresa.nome}</div>
                        <div style={s.sigSub}>CNPJ: {empresa.cnpj}</div>
                        <div style={{ ...s.sigSub, fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>CONTRATADA</div>
                    </div>
                    <div style={s.sigBox}>
                        {signatures?.contratante?.imageUrl && (
                            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                <img src={signatures.contratante.imageUrl.startsWith('/') ? `${(window as any).__API_BASE_URL || ''}${signatures.contratante.imageUrl}` : signatures.contratante.imageUrl} alt="Assinatura" style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain' }} />
                            </div>
                        )}
                        <div style={s.sigLine}>{signatures?.contratante?.signerName || clientName}</div>
                        <div style={s.sigSub}>CPF/CNPJ: {signatures?.contratante?.signerDocument || clientDoc}</div>
                        <div style={{ ...s.sigSub, fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>CONTRATANTE</div>
                    </div>
                </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={s.footer}>
                <div style={s.footerText}>
                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>EXITO GRID</span>
                    {' '} — Especialistas em O&M Solar | {empresa.nome} | CNPJ: {empresa.cnpj}
                </div>
                <div style={{ ...s.footerText, marginTop: '4px', fontSize: '7px' }}>
                    {empresa.endereco} | {empresa.telefone} | {empresa.email}
                </div>
            </div>
        </div>
    );
}
