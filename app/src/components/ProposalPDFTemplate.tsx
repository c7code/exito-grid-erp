import React from 'react';

interface ProposalPDFTemplateProps {
    proposal: any;
    client?: any;
}

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ProposalPDFTemplate({ proposal }: ProposalPDFTemplateProps) {
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

    const empresa = {
        nome: 'ÊXITO GRID SOLUÇÕES EM ENERGIA LTDA',
        cnpj: '00.000.000/0001-00',
        endereco: 'Recife — PE',
        telefone: '(81) 9 0000-0000',
        email: 'contato@exitogrid.com.br',
        site: 'www.exitogrid.com.br',
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
                    A presente proposta tem por objeto a prestação de serviços e/ou fornecimento de materiais conforme especificações abaixo
                    {proposal.workDescription ? `, referente à obra/projeto: ${proposal.workDescription}` : ''}
                    {proposal.workAddress ? `, localizada em ${proposal.workAddress}` : ''}.
                </p>

                {/* ═══ MATERIAIS & SERVIÇOS (Visibility Mode Aware) ═══ */}
                {(() => {
                    const mode = proposal.itemVisibilityMode || 'detailed';
                    const totalLabel = proposal.summaryTotalLabel || 'Valor Global';
                    let clauseNum = 3;

                    if (mode === 'detailed') {
                        // ═══ MODO DETALHADO — tabelas completas ═══
                        return (
                            <>
                                {materialItems.length > 0 && (
                                    <>
                                        <div style={s.sectionTitle}>{clauseNum++}. Fornecimento de Materiais</div>
                                        {proposal.materialFornecimento && <p style={s.para}>{proposal.materialFornecimento}</p>}
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
                                                {materialItems.map((item: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td style={s.td}>{String(idx + 1).padStart(2, '0')}</td>
                                                        <td style={s.td}>{item.description}</td>
                                                        <td style={s.td}>{item.unit || 'un'}</td>
                                                        <td style={s.tdRight}>{Number(item.quantity || 1)}</td>
                                                        <td style={s.tdRight}>R$ {fmt(item.unitPrice)}</td>
                                                        <td style={{ ...s.tdRight, fontWeight: 600 }}>R$ {fmt(item.total || item.unitPrice * item.quantity)}</td>
                                                    </tr>
                                                ))}
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
                                        {proposal.serviceDescription && <p style={s.para}>{proposal.serviceDescription}</p>}
                                        <table style={s.table}>
                                            <thead>
                                                <tr>
                                                    <th style={{ ...s.th, width: '5%' }}>Item</th>
                                                    <th style={{ ...s.th, width: '45%' }}>Descrição do Serviço</th>
                                                    <th style={{ ...s.th, width: '10%' }}>Un</th>
                                                    <th style={{ ...s.thRight, width: '10%' }}>Qtd</th>
                                                    <th style={{ ...s.thRight, width: '15%' }}>Vlr. Unit.</th>
                                                    <th style={{ ...s.thRight, width: '15%' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {serviceItems.map((item: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td style={s.td}>{String(idx + 1).padStart(2, '0')}</td>
                                                        <td style={s.td}>{item.description}</td>
                                                        <td style={s.td}>{item.unit || 'sv'}</td>
                                                        <td style={s.tdRight}>{Number(item.quantity || 1)}</td>
                                                        <td style={s.tdRight}>R$ {fmt(item.unitPrice)}</td>
                                                        <td style={{ ...s.tdRight, fontWeight: 600 }}>R$ {fmt(item.total || item.unitPrice * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan={5} style={{ ...s.td, textAlign: 'right', fontWeight: 700, background: '#fafafa' }}>Subtotal Serviços</td>
                                                    <td style={{ ...s.tdRight, fontWeight: 700, background: '#fafafa', color: '#E8620A' }}>R$ {fmt(serviceSubtotal)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </>
                                )}

                                {/* Composição de Preço (detalhado) */}
                                <div style={s.sectionTitle}>{clauseNum}. Composição do Preço</div>
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

                                {/* Custos Evidenciados — Descrição Técnica */}
                                {hasEvidenciadoCosts && (
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
                                                    {proposal.adminCostDescription || 'Custo referente à gestão administrativa do contrato, incluindo coordenação técnica do projeto, acompanhamento e fiscalização de fornecedores, controle de qualidade, gestão documental, elaboração de relatórios técnicos e suporte operacional durante toda a vigência contratual.'}
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
                                                    {proposal.brokerageCostDescription || 'Custo referente a honorários de intermediação comercial, prospecção de oportunidades, negociação contratual e assessoria técnico-comercial para viabilização do projeto junto ao contratante.'}
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
                                                    {proposal.insuranceCostDescription || 'Custo referente à contratação de seguro de responsabilidade civil, cobertura de riscos operacionais, garantia sobre materiais e equipamentos, e proteção patrimonial durante a execução dos serviços conforme exigências normativas aplicáveis.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    }

                    // ═══ MODO RESUMO COMERCIAL ou APENAS TEXTO ═══
                    const autoMatText = materialItems.length > 0
                        ? (proposal.materialSummaryText || (() => {
                            const descs = materialItems.map((i: any) => i.description.toLowerCase());
                            if (descs.length === 1) return `Fornecimento de ${descs[0]}, incluindo todo o material necessário para garantir a qualidade e durabilidade da instalação, conforme especificações técnicas e normas vigentes.`;
                            const last = descs.pop();
                            return `Fornecimento completo de toda estrutura composta por ${descs.join(', ')} e ${last}, incluindo todos os insumos, acessórios e componentes necessários para a execução conforme especificações técnicas aplicáveis.`;
                        })())
                        : '';

                    const autoSvcText = serviceItems.length > 0
                        ? (proposal.serviceSummaryText || (() => {
                            const descs = serviceItems.map((i: any) => i.description.toLowerCase());
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
                                    <p style={s.para}>{autoMatText}</p>
                                </div>
                            )}

                            {autoSvcText && (
                                <div style={{ marginBottom: '16px' }}>
                                    <p style={s.clauseHeading}>Prestação de Serviços</p>
                                    <p style={s.para}>{autoSvcText}</p>
                                </div>
                            )}

                            {mode === 'summary' && (
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
                            )}

                            {/* Custos Evidenciados — Modo Resumo */}
                            {hasEvidenciadoCosts && (
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
                                                {proposal.adminCostDescription || 'Custo referente à gestão administrativa do contrato, incluindo coordenação técnica do projeto, acompanhamento e fiscalização de fornecedores, controle de qualidade, gestão documental, elaboração de relatórios técnicos e suporte operacional durante toda a vigência contratual.'}
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
                                                {proposal.brokerageCostDescription || 'Custo referente a honorários de intermediação comercial, prospecção de oportunidades, negociação contratual e assessoria técnico-comercial para viabilização do projeto junto ao contratante.'}
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
                                                {proposal.insuranceCostDescription || 'Custo referente à contratação de seguro de responsabilidade civil, cobertura de riscos operacionais, garantia sobre materiais e equipamentos, e proteção patrimonial durante a execução dos serviços conforme exigências normativas aplicáveis.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    ? `O prazo estimado para execução completa dos serviços é de ${proposal.workDeadlineDays} (${numberToWords(proposal.workDeadlineDays)}) dias corridos, contados a partir da data de aprovação desta proposta e efetiva liberação do local.`
                                    : (proposal.deadline || 'A definir em comum acordo entre as partes.')}
                            </p>
                        </>
                    );
                })()}

                {/* PAGAMENTO */}
                {(() => {
                    const n = (materialItems.length > 0 ? 1 : 0) + (serviceItems.length > 0 ? 1 : 0) + 5;
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
                            {contractorObs.map((ob: string, i: number) => (
                                <div key={i} style={s.listItem}>
                                    <span style={s.bullet}>▸</span>
                                    {ob}
                                </div>
                            ))}
                        </>
                    );
                })()}

                {/* OBRIGAÇÕES CONTRATANTE */}
                {(() => {
                    const n = (materialItems.length > 0 ? 1 : 0) + (serviceItems.length > 0 ? 1 : 0) + 7;
                    return (
                        <>
                            <div style={s.sectionTitle}>{n}. Obrigações do CONTRATANTE</div>
                            {clientObs.map((ob: string, i: number) => (
                                <div key={i} style={s.listItem}>
                                    <span style={s.bullet}>▸</span>
                                    {ob}
                                </div>
                            ))}
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
                                <p style={{ ...s.para, color: '#166534', fontSize: '9.5px' }}>
                                    {complianceText}
                                </p>
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
                            {generalProv.map((p: string, i: number) => (
                                <div key={i} style={s.listItem}>
                                    <span style={s.bullet}>{String.fromCharCode(97 + i)})</span>
                                    <span style={{ paddingLeft: '6px' }}>{p}</span>
                                </div>
                            ))}
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
