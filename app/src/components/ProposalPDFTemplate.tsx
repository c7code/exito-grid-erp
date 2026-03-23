import React from 'react';

interface ProposalPDFTemplateProps {
    proposal: any;
    client?: any;
    company?: any;
}

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ═══ PARSER DE TEXTO ESTRUTURADO JURÍDICO ═══
function detectLineLevel(line: string): { level: number; isBold: boolean } {
    const trimmed = line.trim();
    if (/^Art(igo)?\.?\s/i.test(trimmed)) return { level: 0, isBold: true };
    if (/^(§|Parágrafo)/i.test(trimmed)) return { level: 1, isBold: false };
    if (/^(X{0,3})(IX|IV|V?I{0,3})\s*[.)\-–—]/i.test(trimmed) && /^[IVXivx]/i.test(trimmed)) return { level: 2, isBold: false };
    if (/^[a-z]\)\s/i.test(trimmed)) return { level: 3, isBold: false };
    if (/^\d{1,3}\.\s/.test(trimmed)) return { level: 4, isBold: false };
    if (/^\d{1,3}-\s/.test(trimmed)) return { level: 4, isBold: false };
    if (/^\d{1,3}\)\s/.test(trimmed)) return { level: 4, isBold: false };
    if (/^[•▸\-—–]\s/.test(trimmed)) return { level: 3, isBold: false };
    return { level: -1, isBold: false };
}

function renderStructuredText(text: string | undefined | null, baseStyle: React.CSSProperties): React.ReactNode {
    if (!text) return null;
    // Pre-process: split inline patterns separated by ; or : into separate lines
    let processed = text;
    // Roman numeral + dot: i. ii. iii. iv. v. vi. vii. viii. ix. x.
    processed = processed.replace(/[;:]\s*(?=(?:x{0,3})(?:ix|iv|v?i{0,3})\.\s)/gi, ';\n');
    // Letter + paren: a) b) c)
    processed = processed.replace(/[;:]\s*(?=[a-z]\)\s)/gi, ';\n');
    // Number + dot: 1. 2. 3.
    processed = processed.replace(/[;:]\s*(?=\d{1,3}\.\s)/g, ';\n');
    // Number + dash: 1- 2- 3-
    processed = processed.replace(/[;:]\s*(?=\d{1,3}-\s)/g, ';\n');
    // Number + paren: 1) 2) 3)
    processed = processed.replace(/[;:]\s*(?=\d{1,3}\)\s)/g, ';\n');
    // Bullet chars: • ▸ — –
    processed = processed.replace(/[;:]\s*(?=[•▸—–]\s)/g, ';\n');
    const lines = processed.split('\n').filter(l => l.trim());
    if (lines.length === 0) return null;
    const hasStructure = lines.some(l => detectLineLevel(l).level >= 0);
    if (!hasStructure) {
        return <p style={{ ...baseStyle, whiteSpace: 'pre-line' }}>{text}</p>;
    }
    const indentMap: Record<number, number> = { 0: 0, 1: 16, 2: 24, 3: 36, 4: 48 };
    return (
        <div>
            {lines.map((line, i) => {
                const trimmed = line.trim();
                const { level, isBold } = detectLineLevel(trimmed);
                const indent = level >= 0 ? indentMap[level] || 0 : 12;
                return (
                    <div key={i} style={{
                        ...baseStyle,
                        paddingLeft: `${indent}px`,
                        fontWeight: isBold ? 700 : undefined,
                        margin: level === 0 ? '10px 0 4px' : '2px 0',
                    }}>
                        {trimmed}
                    </div>
                );
            })}
        </div>
    );
}

const objectiveLabels: Record<string, string> = {
    service_only: 'a prestação de serviços',
    supply_only: 'o fornecimento de materiais',
    supply_and_service: 'o fornecimento de materiais e a prestação de serviços',
};

export function ProposalPDFTemplate({ proposal, company }: ProposalPDFTemplateProps) {
    const items = proposal.items || [];
    const materialItems = items.filter((i: any) => i.serviceType === 'material');
    const serviceItems = items.filter((i: any) => i.serviceType !== 'material');

    const materialSubtotal = materialItems.reduce((s: number, i: any) => s + Number(i.total || i.unitPrice * i.quantity || 0), 0);
    const serviceSubtotal = serviceItems.reduce((s: number, i: any) => s + Number(i.total || i.unitPrice * i.quantity || 0), 0);

    // Calcular custos adicionais
    const calcCost = (value: number | null, percent: number | null, base: number) => {
        if (value && Number(value) > 0) return Number(value);
        if (percent && Number(percent) > 0) return base * (Number(percent) / 100);
        return 0;
    };

    const logisticsCost = calcCost(proposal.logisticsCostValue, proposal.logisticsCostPercent, materialSubtotal);
    const adminCost = calcCost(proposal.adminCostValue, proposal.adminCostPercent, materialSubtotal + serviceSubtotal);
    const brokerageCost = calcCost(proposal.brokerageCostValue, proposal.brokerageCostPercent, materialSubtotal + serviceSubtotal);
    const insuranceCost = calcCost(proposal.insuranceCostValue, proposal.insuranceCostPercent, materialSubtotal + serviceSubtotal);

    const showLogistics = proposal.logisticsCostMode !== 'embedded' && logisticsCost > 0;
    const showAdmin = proposal.adminCostMode !== 'embedded' && adminCost > 0;
    const showBrokerage = proposal.brokerageCostMode !== 'embedded' && brokerageCost > 0;
    const showInsurance = proposal.insuranceCostMode !== 'embedded' && insuranceCost > 0;

    // Flags para modo evidenciado (exibe com descrição técnica)
    const isLogisticsEvidenciado = proposal.logisticsCostMode === 'evidenciado' && logisticsCost > 0;
    const isAdminEvidenciado = proposal.adminCostMode === 'evidenciado' && adminCost > 0;
    const isBrokerageEvidenciado = proposal.brokerageCostMode === 'evidenciado' && brokerageCost > 0;
    const isInsuranceEvidenciado = proposal.insuranceCostMode === 'evidenciado' && insuranceCost > 0;
    const hasEvidenciadoCosts = isLogisticsEvidenciado || isAdminEvidenciado || isBrokerageEvidenciado || isInsuranceEvidenciado;

    const visibleCosts = (showLogistics ? logisticsCost : 0) + (showAdmin ? adminCost : 0) + (showBrokerage ? brokerageCost : 0) + (showInsurance ? insuranceCost : 0);
    const discount = Number(proposal.discount || 0);
    const grandTotal = materialSubtotal + serviceSubtotal + visibleCosts - discount;

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

    const defaultCompliance = `Todos os colaboradores designados para a execução dos serviços objeto desta proposta atendem integralmente aos requisitos estabelecidos pelas Normas Regulamentadoras (NRs) aplicáveis, incluindo, mas não se limitando a: NR-06 (Equipamentos de Proteção Individual), NR-10 (Segurança em Instalações e Serviços em Eletricidade), NR-12 (Segurança no Trabalho em Máquinas e Equipamentos), NR-18 (Condições e Meio Ambiente de Trabalho na Indústria da Construção) e NR-35 (Trabalho em Altura). A equipe técnica possui treinamentos, habilitações e autorizações vigentes, garantindo a execução segura e em conformidade com a legislação trabalhista e previdenciária.`;

    const defaultContractorObligations = [
        'Executar os serviços conforme especificações técnicas descritas nesta proposta.',
        'Fornecer todo o material necessário, salvo quando expressamente indicado em contrário.',
        'Manter a equipe técnica devidamente habilitada e com EPIs adequados.',
        'Cumprir os prazos estabelecidos, comunicando eventuais atrasos com antecedência.',
        'Emitir ART/RRT quando aplicável ao tipo de serviço.',
        'Realizar limpeza e organização do local ao término dos serviços.',
    ];

    const defaultClientObligations = [
        'Fornecer acesso livre e seguro ao local da obra/instalação.',
        'Disponibilizar ponto de energia e água quando necessário.',
        'Efetuar os pagamentos nas datas e condições acordadas.',
        'Designar responsável para acompanhamento e aceite dos serviços.',
        'Providenciar as devidas licenças e alvarás, quando aplicável.',
    ];

    const defaultGeneralProvisions = [
        'Esta proposta tem validade de ' + (proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '30 dias') + ' a contar da data de emissão.',
        'Os preços apresentados são válidos para pagamento nas condições descritas. Reajustes poderão ser aplicados em caso de mora.',
        'Eventuais serviços adicionais não contemplados nesta proposta serão objeto de aditivo contratual.',
        'O presente instrumento é regido pelas disposições do Código Civil Brasileiro (Lei nº 10.406/2002).',
        'Fica eleito o foro da Comarca de Recife/PE para dirimir quaisquer questões oriundas deste contrato.',
    ];

    const contractorObs = proposal.contractorObligations
        ? proposal.contractorObligations.split('\n').filter((l: string) => l.trim())
        : defaultContractorObligations;
    const clientObs = proposal.clientObligations
        ? proposal.clientObligations.split('\n').filter((l: string) => l.trim())
        : defaultClientObligations;
    const generalProv = proposal.generalProvisions
        ? proposal.generalProvisions.split('\n').filter((l: string) => l.trim())
        : defaultGeneralProvisions;
    const complianceText = proposal.complianceText || defaultCompliance;

    // Objetivo da proposta
    const objectiveIntro = proposal.objectiveType
        ? `A presente proposta tem por objeto ${objectiveLabels[proposal.objectiveType] || 'a prestação de serviços e/ou fornecimento de materiais'} conforme especificações abaixo`
        : `A presente proposta tem por objeto a prestação de serviços e/or fornecimento de materiais conforme especificações abaixo`;

    // Deadline type
    const deadlineTypeLabel = proposal.workDeadlineType === 'business_days' ? 'dias úteis' : 'dias corridos';

    // Third party deadlines
    let thirdPartyDeadlines: any[] = [];
    if (proposal.thirdPartyDeadlines) {
        try { thirdPartyDeadlines = JSON.parse(proposal.thirdPartyDeadlines); } catch {}
    }

    // ═══ Inline Styles ═══
    const s = {
        page: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: '10pt', color: '#1a1a1a', lineHeight: '1.55', maxWidth: 800, margin: '0 auto', background: '#fff' } as React.CSSProperties,
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 36px 18px', borderBottom: '3px solid #E8620A' } as React.CSSProperties,
        logo: { fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' } as React.CSSProperties,
        logoSub: { fontSize: '10px', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' as const, marginTop: 2 },
        headerRight: { textAlign: 'right' as const, fontSize: '9px', color: '#555', lineHeight: '1.7' },
        darkBar: { background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '10px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
        darkBarText: { color: '#E8620A', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' as const },
        darkBarRef: { color: '#888', fontSize: '9px' },
        body: { padding: '30px 36px' } as React.CSSProperties,
        sectionTitle: { fontSize: '11px', fontWeight: '800', color: '#E8620A', textTransform: 'uppercase' as const, letterSpacing: '2px', borderBottom: '2px solid #E8620A', paddingBottom: '6px', marginTop: '28px', marginBottom: '14px' } as React.CSSProperties,
        clauseHeading: { fontSize: '10.5px', fontWeight: '700', color: '#1a1a1a', margin: '16px 0 6px' } as React.CSSProperties,
        para: { fontSize: '10px', textAlign: 'justify' as const, margin: '6px 0', color: '#2d2d2d', lineHeight: '1.6' } as React.CSSProperties,
        table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '10px', marginBottom: '16px' } as React.CSSProperties,
        th: { background: '#f1f5f9', padding: '8px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase' as const, color: '#444', borderBottom: '2px solid #ddd', textAlign: 'left' as const } as React.CSSProperties,
        thRight: { background: '#f1f5f9', padding: '8px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase' as const, color: '#444', borderBottom: '2px solid #ddd', textAlign: 'right' as const } as React.CSSProperties,
        td: { padding: '7px 10px', fontSize: '9.5px', borderBottom: '1px solid #e8e8e8' } as React.CSSProperties,
        tdRight: { padding: '7px 10px', fontSize: '9.5px', borderBottom: '1px solid #e8e8e8', textAlign: 'right' as const } as React.CSSProperties,
        summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '10px', color: '#333', borderBottom: '1px dotted #ddd' } as React.CSSProperties,
        totalRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '14px', fontWeight: '800', color: '#E8620A', borderTop: '3px solid #E8620A', marginTop: '6px' } as React.CSSProperties,
        costBadge: { display: 'inline-block', background: '#FFF7ED', border: '1px solid #FDBA74', color: '#C2410C', fontSize: '7px', fontWeight: '700', padding: '2px 6px', borderRadius: '3px', marginLeft: '6px' } as React.CSSProperties,
        listItem: { fontSize: '9.5px', color: '#2d2d2d', padding: '3px 0', paddingLeft: '12px', position: 'relative' as const } as React.CSSProperties,
        bullet: { position: 'absolute' as const, left: 0, color: '#E8620A', fontWeight: '700' } as React.CSSProperties,
        complianceBox: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '16px 20px', margin: '14px 0' } as React.CSSProperties,
        complianceTitle: { fontSize: '10px', fontWeight: '700', color: '#166534', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' } as React.CSSProperties,
        sigArea: { display: 'flex', justifyContent: 'space-between', gap: '60px', marginTop: '40px', paddingTop: '20px' } as React.CSSProperties,
        sigBox: { flex: 1, textAlign: 'center' as const } as React.CSSProperties,
        sigLine: { borderTop: '1px solid #333', marginTop: '50px', paddingTop: '8px', fontSize: '9px', fontWeight: '600' } as React.CSSProperties,
        sigSub: { fontSize: '8px', color: '#777' } as React.CSSProperties,
        footer: { background: '#1a1a1a', padding: '14px 36px', textAlign: 'center' as const, marginTop: '30px' } as React.CSSProperties,
        footerText: { fontSize: '8px', color: '#888', letterSpacing: '1px' },
        verifyBox: { background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', padding: '14px 20px', margin: '20px 0' } as React.CSSProperties,
    };

    return (
        <div id="proposal-pdf-content" style={s.page}>
            {/* ═══ HEADER TIMBRADO ═══ */}
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
                <span style={s.darkBarText}>Proposta Comercial</span>
                <span style={s.darkBarRef}>
                    Ref: {proposal.proposalNumber || proposal.id?.substring(0, 8).toUpperCase()} | {dateStr}
                </span>
            </div>

            {/* ═══ BODY ═══ */}
            <div style={s.body}>

                {/* PARTES */}
                <div style={s.sectionTitle}>1. Identificação das Partes</div>
                <p style={s.para}>
                    <strong>CONTRATADA:</strong> {empresa.nome}, inscrita no CNPJ sob o nº {empresa.cnpj}, com sede em {empresa.endereco}.
                </p>
                <p style={s.para}>
                    <strong>CONTRATANTE:</strong> {clientName}, inscrito(a) no CPF/CNPJ sob o nº {clientDoc}, com endereço em {clientAddress}.
                </p>

                {/* OBJETO */}
                <div style={s.sectionTitle}>2. Objeto</div>
                <p style={s.para}>
                    {objectiveIntro}
                    {proposal.workDescription ? `, referente à obra/projeto: ${proposal.workDescription}` : ''}
                    {proposal.workAddress ? `, localizada em ${proposal.workAddress}` : ''}.
                </p>
                {proposal.objectiveText && renderStructuredText(proposal.objectiveText, s.para)}

                {/* ═══ MATERIAIS & SERVIÇOS (4 Modos de Exibição) ═══ */}
                {(() => {
                    const mode = proposal.itemVisibilityMode || 'detailed';
                    const totalLabel = proposal.summaryTotalLabel || 'Valor Global';
                    let clauseNum = 3;

                    // ── Data helpers ──
                    const allItems = items;
                    const getChildren = (parentId: string) => allItems.filter((i: any) => i.parentId === parentId);

                    // Calculate real unit price for bundles (total / qty, never 0)
                    const getUnitPrice = (item: any) => {
                        const total = Number(item.total || item.unitPrice * item.quantity || 0);
                        const qty = Number(item.quantity || 1);
                        return item.isBundleParent && Number(item.unitPrice || 0) === 0
                            ? total / qty
                            : Number(item.unitPrice || 0);
                    };

                    // Render cost composition box (shared by all modes)
                    const renderCostComposition = (cn: number) => (
                        <>
                            <div style={s.sectionTitle}>{cn}. Composição do Preço</div>
                            <div style={{ background: '#fafafa', borderRadius: '6px', padding: '16px 20px', border: '1px solid #e5e7eb' }}>
                                <div style={s.summaryRow}>
                                    <span>Materiais</span>
                                    <span style={{ fontWeight: 600 }}>R$ {fmt(materialSubtotal)}</span>
                                </div>
                                <div style={s.summaryRow}>
                                    <span>Serviços</span>
                                    <span style={{ fontWeight: 600 }}>R$ {fmt(serviceSubtotal)}</span>
                                </div>
                                {showLogistics && (
                                    <div style={s.summaryRow}>
                                        <span>Custo Logístico{proposal.logisticsCostPercent && Number(proposal.logisticsCostPercent) > 0 && <span style={s.costBadge}>{proposal.logisticsCostPercent}%</span>}</span>
                                        <span style={{ fontWeight: 600 }}>R$ {fmt(logisticsCost)}</span>
                                    </div>
                                )}
                                {showAdmin && (
                                    <div style={s.summaryRow}>
                                        <span>Custo Administrativo{proposal.adminCostPercent && Number(proposal.adminCostPercent) > 0 && <span style={s.costBadge}>{proposal.adminCostPercent}%</span>}</span>
                                        <span style={{ fontWeight: 600 }}>R$ {fmt(adminCost)}</span>
                                    </div>
                                )}
                                {showBrokerage && (
                                    <div style={s.summaryRow}>
                                        <span>Corretagem{proposal.brokerageCostPercent && Number(proposal.brokerageCostPercent) > 0 && <span style={s.costBadge}>{proposal.brokerageCostPercent}%</span>}</span>
                                        <span style={{ fontWeight: 600 }}>R$ {fmt(brokerageCost)}</span>
                                    </div>
                                )}
                                {showInsurance && (
                                    <div style={s.summaryRow}>
                                        <span>Seguro{proposal.insuranceCostPercent && Number(proposal.insuranceCostPercent) > 0 && <span style={s.costBadge}>{proposal.insuranceCostPercent}%</span>}</span>
                                        <span style={{ fontWeight: 600 }}>R$ {fmt(insuranceCost)}</span>
                                    </div>
                                )}
                                {discount > 0 && (
                                    <div style={{ ...s.summaryRow, color: '#16a34a' }}>
                                        <span>Desconto</span>
                                        <span style={{ fontWeight: 600 }}>- R$ {fmt(discount)}</span>
                                    </div>
                                )}
                                <div style={s.totalRow}>
                                    <span>VALOR TOTAL DA PROPOSTA</span>
                                    <span>R$ {fmt(grandTotal)}</span>
                                </div>
                            </div>
                        </>
                    );

                    // Render evidenciado costs (shared by all modes)
                    const renderEvidenciadoCosts = () => hasEvidenciadoCosts ? (
                        <div style={{ marginTop: '20px' }}>
                            {isLogisticsEvidenciado && (
                                <div style={{ marginBottom: '14px', padding: '14px 18px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>Custo Logístico</span>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>R$ {fmt(logisticsCost)}</span>
                                    </div>
                                    <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                                        {proposal.logisticsCostDescription || 'Custo referente à mobilização e desmobilização de equipes, transporte de equipamentos especializados, veículos operacionais, combustível, pedágios e logística de campo necessários para a execução dos serviços no local da obra.'}
                                    </p>
                                </div>
                            )}
                            {isAdminEvidenciado && (
                                <div style={{ marginBottom: '14px', padding: '14px 18px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>Custo Administrativo</span>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>R$ {fmt(adminCost)}</span>
                                    </div>
                                    <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                                        {proposal.adminCostDescription || 'Custo referente à gestão administrativa do contrato, incluindo coordenação técnica, controle de qualidade, gestão documental e suporte operacional.'}
                                    </p>
                                </div>
                            )}
                            {isBrokerageEvidenciado && (
                                <div style={{ marginBottom: '14px', padding: '14px 18px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>Corretagem</span>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>R$ {fmt(brokerageCost)}</span>
                                    </div>
                                    <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                                        {proposal.brokerageCostDescription || 'Custo referente a honorários de intermediação comercial e assessoria técnico-comercial.'}
                                    </p>
                                </div>
                            )}
                            {isInsuranceEvidenciado && (
                                <div style={{ marginBottom: '14px', padding: '14px 18px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>Seguro</span>
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>R$ {fmt(insuranceCost)}</span>
                                    </div>
                                    <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                                        {proposal.insuranceCostDescription || 'Custo referente à contratação de seguro de responsabilidade civil e cobertura de riscos operacionais.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null;

                    // ═══════════════════════════════════════════
                    // MODO 1: AGRUPAMENTO — Apenas bundles
                    // ═══════════════════════════════════════════
                    if (mode === 'grouping') {
                        return (
                            <>
                                {materialItems.length > 0 && (
                                    <>
                                        <div style={s.sectionTitle}>{clauseNum++}. Fornecimento de Materiais</div>
                                        {proposal.materialFornecimento && renderStructuredText(proposal.materialFornecimento, s.para)}
                                        <table style={s.table}>
                                            <thead>
                                                <tr>
                                                    <th style={{ ...s.th, width: '5%' }}>Item</th>
                                                    <th style={{ ...s.th, width: '50%' }}>Descrição</th>
                                                    <th style={{ ...s.th, width: '10%' }}>Un</th>
                                                    <th style={{ ...s.thRight, width: '10%' }}>Qtd</th>
                                                    <th style={{ ...s.thRight, width: '12%' }}>Vlr. Unit.</th>
                                                    <th style={{ ...s.thRight, width: '13%' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {materialItems.filter((i: any) => !i.parentId).map((item: any, idx: number) => {
                                                    const up = getUnitPrice(item);
                                                    return (
                                                        <tr key={idx}>
                                                            <td style={s.td}>{String(idx + 1).padStart(2, '0')}</td>
                                                            <td style={s.td}>{item.description}</td>
                                                            <td style={s.td}>{item.unit || 'un'}</td>
                                                            <td style={s.tdRight}>{Number(item.quantity || 1)}</td>
                                                            <td style={s.tdRight}>R$ {fmt(up)}</td>
                                                            <td style={{ ...s.tdRight, fontWeight: 600 }}>R$ {fmt(item.total || up * Number(item.quantity || 1))}</td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr>
                                                    <td colSpan={5} style={{ ...s.td, textAlign: 'right', fontWeight: 700, background: '#fafafa' }}>Subtotal Materiais</td>
                                                    <td style={{ ...s.tdRight, fontWeight: 700, background: '#fafafa', color: '#E8620A' }}>R$ {fmt(materialSubtotal)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </>
                                )}
                                {serviceItems.length > 0 && (
                                    <>
                                        <div style={s.sectionTitle}>{clauseNum++}. Prestação de Serviços</div>
                                        {proposal.serviceDescription && renderStructuredText(proposal.serviceDescription, s.para)}
                                        <table style={s.table}>
                                            <thead>
                                                <tr>
                                                    <th style={{ ...s.th, width: '5%' }}>Item</th>
                                                    <th style={{ ...s.th, width: '50%' }}>Descrição</th>
                                                    <th style={{ ...s.th, width: '10%' }}>Un</th>
                                                    <th style={{ ...s.thRight, width: '10%' }}>Qtd</th>
                                                    <th style={{ ...s.thRight, width: '12%' }}>Vlr. Unit.</th>
                                                    <th style={{ ...s.thRight, width: '13%' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {serviceItems.filter((i: any) => !i.parentId).map((item: any, idx: number) => {
                                                    const up = getUnitPrice(item);
                                                    return (
                                                        <tr key={idx}>
                                                            <td style={s.td}>{String(idx + 1).padStart(2, '0')}</td>
                                                            <td style={s.td}>{item.description}</td>
                                                            <td style={s.td}>{item.unit || 'sv'}</td>
                                                            <td style={s.tdRight}>{Number(item.quantity || 1)}</td>
                                                            <td style={s.tdRight}>R$ {fmt(up)}</td>
                                                            <td style={{ ...s.tdRight, fontWeight: 600 }}>R$ {fmt(item.total || up * Number(item.quantity || 1))}</td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr>
                                                    <td colSpan={5} style={{ ...s.td, textAlign: 'right', fontWeight: 700, background: '#fafafa' }}>Subtotal Serviços</td>
                                                    <td style={{ ...s.tdRight, fontWeight: 700, background: '#fafafa', color: '#E8620A' }}>R$ {fmt(serviceSubtotal)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </>
                                )}
                                {renderCostComposition(clauseNum)}
                                {renderEvidenciadoCosts()}
                            </>
                        );
                    }

                    // ═══════════════════════════════════════════
                    // MODO 2: ESTRUTURA DETALHADA — Bundles + filhos
                    // ═══════════════════════════════════════════
                    if (mode === 'detailed') {
                        const renderDetailedTable = (tableItems: any[], type: string) => {
                            const topItems = tableItems.filter((i: any) => !i.parentId);
                            return (
                                <table style={s.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...s.th, width: '5%' }}>Item</th>
                                            <th style={{ ...s.th, width: '45%' }}>Descrição</th>
                                            <th style={{ ...s.th, width: '10%' }}>Un</th>
                                            <th style={{ ...s.thRight, width: '10%' }}>Qtd</th>
                                            <th style={{ ...s.thRight, width: '15%' }}>Vlr. Unit.</th>
                                            <th style={{ ...s.thRight, width: '15%' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topItems.map((item: any, idx: number) => {
                                            const children = getChildren(item.id);
                                            const up = getUnitPrice(item);
                                            return (
                                                <React.Fragment key={idx}>
                                                    <tr style={item.isBundleParent ? { background: '#f8fafc' } : {}}>
                                                        <td style={{ ...s.td, fontWeight: item.isBundleParent ? 700 : 400 }}>{String(idx + 1).padStart(2, '0')}</td>
                                                        <td style={{ ...s.td, fontWeight: item.isBundleParent ? 700 : 400 }}>{item.description}</td>
                                                        <td style={s.td}>{item.unit || (type === 'material' ? 'un' : 'sv')}</td>
                                                        <td style={s.tdRight}>{Number(item.quantity || 1)}</td>
                                                        <td style={s.tdRight}>R$ {fmt(up)}</td>
                                                        <td style={{ ...s.tdRight, fontWeight: 600 }}>R$ {fmt(item.total || up * Number(item.quantity || 1))}</td>
                                                    </tr>
                                                    {/* Child items (indented) */}
                                                    {children.map((child: any, ci: number) => (
                                                        <tr key={`c-${ci}`} style={{ background: '#fefefe' }}>
                                                            <td style={{ ...s.td, paddingLeft: '20px', color: '#888', fontSize: '8.5px' }}>{String(idx + 1).padStart(2, '0')}.{ci + 1}</td>
                                                            <td style={{ ...s.td, paddingLeft: '20px', color: '#555', fontSize: '9px' }}>↳ {child.description}</td>
                                                            <td style={{ ...s.td, color: '#888', fontSize: '8.5px' }}>{child.unit || (type === 'material' ? 'un' : 'sv')}</td>
                                                            <td style={{ ...s.tdRight, color: '#888', fontSize: '8.5px' }}>{Number(child.quantity || 1)}</td>
                                                            <td style={{ ...s.tdRight, color: '#888', fontSize: '8.5px' }}>R$ {fmt(child.unitPrice)}</td>
                                                            <td style={{ ...s.tdRight, color: '#888', fontSize: '8.5px' }}>R$ {fmt(child.total || child.unitPrice * child.quantity)}</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                        <tr>
                                            <td colSpan={5} style={{ ...s.td, textAlign: 'right', fontWeight: 700, background: '#fafafa' }}>
                                                Subtotal {type === 'material' ? 'Materiais' : 'Serviços'}
                                            </td>
                                            <td style={{ ...s.tdRight, fontWeight: 700, background: '#fafafa', color: '#E8620A' }}>
                                                R$ {fmt(type === 'material' ? materialSubtotal : serviceSubtotal)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        };

                        return (
                            <>
                                {materialItems.length > 0 && (
                                    <>
                                        <div style={s.sectionTitle}>{clauseNum++}. Fornecimento de Materiais</div>
                                        {proposal.materialFornecimento && renderStructuredText(proposal.materialFornecimento, s.para)}
                                        {renderDetailedTable(materialItems, 'material')}
                                    </>
                                )}
                                {serviceItems.length > 0 && (
                                    <>
                                        <div style={s.sectionTitle}>{clauseNum++}. Prestação de Serviços</div>
                                        {proposal.serviceDescription && renderStructuredText(proposal.serviceDescription, s.para)}
                                        {renderDetailedTable(serviceItems, 'service')}
                                    </>
                                )}
                                {renderCostComposition(clauseNum)}
                                {renderEvidenciadoCosts()}
                            </>
                        );
                    }

                    // ═══════════════════════════════════════════
                    // MODO 3: MATERIAL CONSOLIDADO — Lista plana
                    // ═══════════════════════════════════════════
                    if (mode === 'consolidated') {
                        // Flatten all items (use children only, skip bundle parents)
                        const flattenItems = (list: any[]) => {
                            const result: any[] = [];
                            for (const item of list) {
                                if (item.isBundleParent) {
                                    const children = getChildren(item.id);
                                    if (children.length > 0) {
                                        result.push(...children);
                                    } else {
                                        result.push(item); // Bundle without children — show itself
                                    }
                                } else if (!item.parentId) {
                                    result.push(item); // Standalone item
                                }
                            }
                            return result;
                        };

                        // Consolidate by description (merge duplicates, sum quantities)
                        const consolidate = (list: any[]) => {
                            const map = new Map<string, any>();
                            for (const item of list) {
                                const key = item.description.trim().toLowerCase();
                                if (map.has(key)) {
                                    const existing = map.get(key);
                                    existing.quantity = Number(existing.quantity || 1) + Number(item.quantity || 1);
                                    existing.total = Number(existing.total || 0) + Number(item.total || item.unitPrice * item.quantity || 0);
                                } else {
                                    map.set(key, {
                                        ...item,
                                        quantity: Number(item.quantity || 1),
                                        total: Number(item.total || item.unitPrice * item.quantity || 0),
                                    });
                                }
                            }
                            return Array.from(map.values());
                        };

                        const consolidatedMaterials = consolidate(flattenItems(materialItems));
                        const consolidatedServices = consolidate(flattenItems(serviceItems));

                        const renderConsolidatedTable = (list: any[], type: string, subtotal: number) => (
                            <table style={s.table}>
                                <thead>
                                    <tr>
                                        <th style={{ ...s.th, width: '5%' }}>Item</th>
                                        <th style={{ ...s.th, width: '45%' }}>Descrição</th>
                                        <th style={{ ...s.th, width: '10%' }}>Un</th>
                                        <th style={{ ...s.thRight, width: '10%' }}>Qtd</th>
                                        <th style={{ ...s.thRight, width: '15%' }}>Vlr. Unit.</th>
                                        <th style={{ ...s.thRight, width: '15%' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((item: any, idx: number) => {
                                        const up = item.total / Number(item.quantity || 1);
                                        return (
                                            <tr key={idx}>
                                                <td style={s.td}>{String(idx + 1).padStart(2, '0')}</td>
                                                <td style={s.td}>{item.description}</td>
                                                <td style={s.td}>{item.unit || (type === 'material' ? 'un' : 'sv')}</td>
                                                <td style={s.tdRight}>{Number(item.quantity)}</td>
                                                <td style={s.tdRight}>R$ {fmt(up)}</td>
                                                <td style={{ ...s.tdRight, fontWeight: 600 }}>R$ {fmt(item.total)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td colSpan={5} style={{ ...s.td, textAlign: 'right', fontWeight: 700, background: '#fafafa' }}>
                                            Subtotal {type === 'material' ? 'Materiais' : 'Serviços'}
                                        </td>
                                        <td style={{ ...s.tdRight, fontWeight: 700, background: '#fafafa', color: '#E8620A' }}>R$ {fmt(subtotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        );

                        return (
                            <>
                                {consolidatedMaterials.length > 0 && (
                                    <>
                                        <div style={s.sectionTitle}>{clauseNum++}. Relação Consolidada de Materiais</div>
                                        {proposal.materialFornecimento && renderStructuredText(proposal.materialFornecimento, s.para)}
                                        {renderConsolidatedTable(consolidatedMaterials, 'material', materialSubtotal)}
                                    </>
                                )}
                                {consolidatedServices.length > 0 && (
                                    <>
                                        <div style={s.sectionTitle}>{clauseNum++}. Relação Consolidada de Serviços</div>
                                        {proposal.serviceDescription && renderStructuredText(proposal.serviceDescription, s.para)}
                                        {renderConsolidatedTable(consolidatedServices, 'service', serviceSubtotal)}
                                    </>
                                )}
                                {renderCostComposition(clauseNum)}
                                {renderEvidenciadoCosts()}
                            </>
                        );
                    }

                    // ═══════════════════════════════════════════
                    // MODO 4: DESCRIÇÃO COMERCIAL — Texto inteligente
                    // ═══════════════════════════════════════════
                    const autoMatText = materialItems.length > 0
                        ? (proposal.materialSummaryText || (() => {
                            const descs = materialItems.filter((i: any) => !i.parentId).map((i: any) => i.description.toLowerCase());
                            if (descs.length === 1) return `Fornecimento de ${descs[0]}, incluindo todo o material necessário para garantir a qualidade e durabilidade da instalação, conforme especificações técnicas e normas vigentes.`;
                            const last = descs.pop();
                            return `Fornecimento completo de toda estrutura composta por ${descs.join(', ')} e ${last}, incluindo todos os insumos, acessórios e componentes necessários para a execução conforme especificações técnicas aplicáveis.`;
                        })())
                        : '';

                    const autoSvcText = serviceItems.length > 0
                        ? (proposal.serviceSummaryText || (() => {
                            const descs = serviceItems.filter((i: any) => !i.parentId).map((i: any) => i.description.toLowerCase());
                            if (descs.length === 1) return `Prestação de serviço de ${descs[0]}, executado por equipe técnica qualificada e habilitada conforme as normas regulamentadoras aplicáveis, com garantia de execução profissional.`;
                            const last = descs.pop();
                            return `Prestação de serviços especializados incluindo ${descs.join(', ')} e ${last}, executados por equipe técnica devidamente qualificada, habilitada e em conformidade com as normas regulamentadoras vigentes.`;
                        })())
                        : '';

                    return (
                        <>
                            <div style={s.sectionTitle}>{clauseNum}. Escopo do Fornecimento e Serviços</div>

                            {autoMatText && (
                                <div style={{ marginBottom: '16px' }}>
                                    <p style={s.clauseHeading}>Fornecimento de Materiais</p>
                                    {renderStructuredText(autoMatText, s.para)}
                                </div>
                            )}

                            {autoSvcText && (
                                <div style={{ marginBottom: '16px' }}>
                                    <p style={s.clauseHeading}>Prestação de Serviços</p>
                                    {renderStructuredText(autoSvcText, s.para)}
                                </div>
                            )}

                            <div style={{ background: '#fafafa', borderRadius: '6px', padding: '16px 20px', border: '1px solid #e5e7eb', marginTop: '14px' }}>
                                {showLogistics && (
                                    <div style={s.summaryRow}>
                                        <span>Custo Logístico{proposal.logisticsCostPercent && Number(proposal.logisticsCostPercent) > 0 && <span style={s.costBadge}>{proposal.logisticsCostPercent}%</span>}</span>
                                        <span style={{ fontWeight: 600 }}>R$ {fmt(logisticsCost)}</span>
                                    </div>
                                )}
                                {showAdmin && (
                                    <div style={s.summaryRow}>
                                        <span>Custo Administrativo{proposal.adminCostPercent && Number(proposal.adminCostPercent) > 0 && <span style={s.costBadge}>{proposal.adminCostPercent}%</span>}</span>
                                        <span style={{ fontWeight: 600 }}>R$ {fmt(adminCost)}</span>
                                    </div>
                                )}
                                {showBrokerage && (
                                    <div style={s.summaryRow}>
                                        <span>Corretagem{proposal.brokerageCostPercent && Number(proposal.brokerageCostPercent) > 0 && <span style={s.costBadge}>{proposal.brokerageCostPercent}%</span>}</span>
                                        <span style={{ fontWeight: 600 }}>R$ {fmt(brokerageCost)}</span>
                                    </div>
                                )}
                                {showInsurance && (
                                    <div style={s.summaryRow}>
                                        <span>Seguro{proposal.insuranceCostPercent && Number(proposal.insuranceCostPercent) > 0 && <span style={s.costBadge}>{proposal.insuranceCostPercent}%</span>}</span>
                                        <span style={{ fontWeight: 600 }}>R$ {fmt(insuranceCost)}</span>
                                    </div>
                                )}
                                {discount > 0 && (
                                    <div style={{ ...s.summaryRow, color: '#16a34a' }}>
                                        <span>Desconto</span>
                                        <span style={{ fontWeight: 600 }}>- R$ {fmt(discount)}</span>
                                    </div>
                                )}
                                <div style={s.totalRow}>
                                    <span>{totalLabel.toUpperCase()}</span>
                                    <span>R$ {fmt(grandTotal)}</span>
                                </div>
                            </div>

                            {renderEvidenciadoCosts()}
                        </>
                    );
                })()}

                {/* PRAZO */}
                {(() => {
                    const n = (materialItems.length > 0 ? 1 : 0) + (serviceItems.length > 0 ? 1 : 0) + 4;
                    return (
                        <>
                            <div style={s.sectionTitle}>{n}. Prazo de Execução</div>
                            <p style={s.para}>
                                {proposal.workDeadlineDays
                                    ? `O prazo estimado para execução completa dos serviços é de ${proposal.workDeadlineDays} (${numberToWords(proposal.workDeadlineDays)}) ${deadlineTypeLabel}, contados a partir da data de aprovação desta proposta e efetiva liberação do local.`
                                    : (proposal.deadline || 'A definir em comum acordo entre as partes.')}
                            </p>
                            {thirdPartyDeadlines.length > 0 && (
                                <>
                                    <p style={s.clauseHeading}>Prazos de Terceiros:</p>
                                    <table style={s.table}>
                                        <thead>
                                            <tr>
                                                <th style={{ ...s.th, width: '30%' }}>Responsável</th>
                                                <th style={{ ...s.thRight, width: '15%' }}>Prazo</th>
                                                <th style={{ ...s.th, width: '15%' }}>Tipo</th>
                                                <th style={{ ...s.th, width: '40%' }}>Descrição</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {thirdPartyDeadlines.map((tp: any, i: number) => (
                                                <tr key={i}>
                                                    <td style={s.td}>{tp.name}</td>
                                                    <td style={s.tdRight}>{tp.days} dias</td>
                                                    <td style={s.td}>{tp.type === 'business_days' ? 'Úteis' : 'Corridos'}</td>
                                                    <td style={s.td}>{tp.description || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </>
                    );
                })()}

                {/* PAGAMENTO */}
                {(() => {
                    const n = (materialItems.length > 0 ? 1 : 0) + (serviceItems.length > 0 ? 1 : 0) + 5;
                    
                    // Parse simulation data if available
                    let simData: any = null;
                    if (proposal.simulationData) {
                        try { simData = JSON.parse(proposal.simulationData); } catch {}
                    }

                    if (simData?.selected) {
                        // ═══ RENDER SIMULATION-BASED PAYMENT CONDITIONS ═══
                        const sel = simData.selected;
                        const alts = simData.alternatives || [];

                        return (
                            <>
                                <div style={s.sectionTitle}>{n}. Condições de Pagamento</div>

                                {/* Persuasive intro */}
                                <p style={s.para}>
                                    Visando oferecer a melhor experiência e flexibilidade para viabilizar seu investimento, 
                                    apresentamos abaixo a condição de pagamento personalizada, elaborada especificamente 
                                    para atender ao seu perfil e garantir o melhor custo-benefício.
                                </p>

                                {/* Recommended condition box */}
                                <div style={{ background: '#FFF7ED', border: '2px solid #E8620A', borderRadius: '8px', padding: '18px 22px', margin: '16px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                        <span style={{ background: '#E8620A', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const }}>
                                            ⭐ CONDIÇÃO RECOMENDADA
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#E8620A', margin: '0 0 6px 0' }}>
                                        {sel.commercialName}
                                    </p>
                                    <p style={{ fontSize: '10px', color: '#92400e', margin: '0 0 14px 0', lineHeight: '1.6', fontStyle: 'italic' }}>
                                        {sel.argument}
                                    </p>

                                    {/* Payment breakdown table */}
                                    <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                                        <thead>
                                            <tr>
                                                <th style={{ ...s.th, background: '#FEF3C7' }}>Descrição</th>
                                                <th style={{ ...s.thRight, background: '#FEF3C7' }}>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sel.entry > 0 && (
                                                <tr>
                                                    <td style={s.td}>Investimento Inicial (Entrada via PIX/Transferência)</td>
                                                    <td style={{ ...s.tdRight, fontWeight: 700, color: '#E8620A' }}>R$ {fmt(sel.entry)}</td>
                                                </tr>
                                            )}
                                            {sel.installmentAmount > 0 && (
                                                <tr>
                                                    <td style={s.td}>
                                                        {sel.installments}x parcelas {sel.frequency === 1 ? 'mensais' : sel.frequency === 2 ? 'bimestrais' : 'trimestrais'}
                                                    </td>
                                                    <td style={{ ...s.tdRight, fontWeight: 700 }}>R$ {fmt(sel.installmentAmount)}</td>
                                                </tr>
                                            )}
                                            {sel.correctionAmount > 0 && (
                                                <tr>
                                                    <td style={{ ...s.td, color: '#666' }}>Correção monetária</td>
                                                    <td style={{ ...s.tdRight, color: '#666' }}>R$ {fmt(sel.correctionAmount)}</td>
                                                </tr>
                                            )}
                                            <tr style={{ background: '#fafafa' }}>
                                                <td style={{ ...s.td, fontWeight: 800, fontSize: '11px', borderTop: '2px solid #E8620A' }}>TOTAL DO INVESTIMENTO</td>
                                                <td style={{ ...s.tdRight, fontWeight: 800, fontSize: '13px', color: '#E8620A', borderTop: '2px solid #E8620A' }}>
                                                    R$ {fmt(sel.totalClient)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Persuasive closing */}
                                <p style={{ ...s.para, fontStyle: 'italic', color: '#555' }}>
                                    Esta condição foi estruturada para garantir parcelas acessíveis sem comprometer 
                                    a qualidade do serviço e dos materiais empregados. O investimento é protegido 
                                    com garantia integral sobre a execução e os componentes instalados.
                                </p>

                                {/* Alternative conditions */}
                                {alts.length > 0 && (
                                    <>
                                        <p style={s.clauseHeading}>Opções alternativas disponíveis:</p>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, margin: '10px 0 16px 0' }}>
                                            {alts.slice(0, 3).map((alt: any, idx: number) => (
                                                <div key={idx} style={{
                                                    flex: 1, minWidth: '140px', border: '1px solid #e2e8f0', borderRadius: '6px',
                                                    padding: '12px', background: '#fafafa',
                                                }}>
                                                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#E8620A', margin: '0 0 6px 0', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                                                        {alt.commercialName}
                                                    </p>
                                                    {alt.entry > 0 && <p style={{ fontSize: '9px', color: '#555', margin: '0 0 2px 0' }}>▸ Entrada: R$ {fmt(alt.entry)}</p>}
                                                    {alt.installmentAmount > 0 && <p style={{ fontSize: '9px', color: '#555', margin: '0 0 2px 0' }}>▸ {alt.installments}x de R$ {fmt(alt.installmentAmount)}</p>}
                                                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#1a1a1a', margin: '6px 0 0 0' }}>Total: R$ {fmt(alt.totalClient)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {proposal.paymentBank && (
                                    <>
                                        <p style={s.clauseHeading}>Dados Bancários:</p>
                                        <p style={{ ...s.para, whiteSpace: 'pre-line' }}>{proposal.paymentBank}</p>
                                    </>
                                )}
                            </>
                        );
                    }

                    // ═══ FALLBACK: plain text payment conditions ═══
                    return (
                        <>
                            <div style={s.sectionTitle}>{n}. Condições de Pagamento</div>
                            <p style={s.para}>
                                {proposal.paymentConditions || proposal.paymentDueCondition || 'Conforme condições acordadas entre as partes.'}
                            </p>
                            {proposal.paymentBank && (
                                <>
                                    <p style={s.clauseHeading}>Dados Bancários:</p>
                                    <p style={{ ...s.para, whiteSpace: 'pre-line' }}>{proposal.paymentBank}</p>
                                </>
                            )}
                        </>
                    );
                })()}

                {/* OBRIGAÇÕES CONTRATADA */}
                {(() => {
                    const n = (materialItems.length > 0 ? 1 : 0) + (serviceItems.length > 0 ? 1 : 0) + 6;
                    return (
                        <>
                            <div style={s.sectionTitle}>{n}. Obrigações da CONTRATADA</div>
                            {proposal.contractorObligations
                                ? renderStructuredText(proposal.contractorObligations, s.para)
                                : contractorObs.map((ob: string, i: number) => (
                                    <div key={i} style={s.listItem}>
                                        <span style={s.bullet}>▸</span>
                                        {ob}
                                    </div>
                                ))
                            }
                        </>
                    );
                })()}

                {/* OBRIGAÇÕES CONTRATANTE */}
                {(() => {
                    const n = (materialItems.length > 0 ? 1 : 0) + (serviceItems.length > 0 ? 1 : 0) + 7;
                    return (
                        <>
                            <div style={s.sectionTitle}>{n}. Obrigações do CONTRATANTE</div>
                            {proposal.clientObligations
                                ? renderStructuredText(proposal.clientObligations, s.para)
                                : clientObs.map((ob: string, i: number) => (
                                    <div key={i} style={s.listItem}>
                                        <span style={s.bullet}>▸</span>
                                        {ob}
                                    </div>
                                ))
                            }
                        </>
                    );
                })()}

                {/* CONFORMIDADE NORMATIVA */}
                {(() => {
                    const n = (materialItems.length > 0 ? 1 : 0) + (serviceItems.length > 0 ? 1 : 0) + 8;
                    return (
                        <>
                            <div style={s.sectionTitle}>{n}. Conformidade Normativa e Segurança</div>
                            <div style={s.complianceBox}>
                                <div style={s.complianceTitle}>
                                    <span style={{ fontSize: '14px' }}>✓</span>
                                    DECLARAÇÃO DE CONFORMIDADE
                                </div>
                                {renderStructuredText(complianceText, { ...s.para, color: '#166534', fontSize: '9.5px' })}
                            </div>
                        </>
                    );
                })()}

                {/* DISPOSIÇÕES GERAIS */}
                {(() => {
                    const n = (materialItems.length > 0 ? 1 : 0) + (serviceItems.length > 0 ? 1 : 0) + 9;
                    return (
                        <>
                            <div style={s.sectionTitle}>{n}. Disposições Gerais</div>
                            {proposal.generalProvisions
                                ? renderStructuredText(proposal.generalProvisions, s.para)
                                : generalProv.map((p: string, i: number) => (
                                    <div key={i} style={s.listItem}>
                                        <span style={s.bullet}>{String.fromCharCode(97 + i)})</span>
                                        <span style={{ paddingLeft: '6px' }}>{p}</span>
                                    </div>
                                ))
                            }
                        </>
                    );
                })()}

                {/* ASSINATURA DIGITAL verificada */}
                {proposal.signedAt && (
                    <div style={s.verifyBox}>
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

                {/* ASSINATURAS */}
                <div style={{ marginTop: '10px' }}>
                    <p style={{ ...s.para, textAlign: 'center', fontStyle: 'italic', color: '#555' }}>
                        Recife/PE, {dateStr}.
                    </p>
                </div>

                <div style={s.sigArea}>
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
                    <span style={{ color: '#E8620A', fontWeight: 700 }}>EXITO SYSTEM</span>
                    {' '} — Documento gerado eletronicamente | {empresa.nome} | CNPJ: {empresa.cnpj}
                </div>
            </div>
        </div>
    );
}

// Helper: número por extenso simplificado
function numberToWords(n: number | string): string {
    const num = Number(n);
    if (isNaN(num) || num <= 0) return '';
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const tens = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    if (num === 100) return 'cem';
    if (num >= 1000) return String(num);

    let result = '';
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (h > 0) result += hundreds[h];
    if (t === 1 && u > 0) {
        result += (result ? ' e ' : '') + teens[u];
        return result;
    }
    if (t > 0) result += (result ? ' e ' : '') + tens[t];
    if (u > 0) result += (result ? ' e ' : '') + units[u];

    return result || String(num);
}
