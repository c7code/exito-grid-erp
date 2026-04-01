import React from 'react';
import { EXITO_GRID_LOGO } from '@/assets/exito-grid-logo-base64';

interface ContractPDFTemplateProps { contract: any; company?: any; }

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

// ═══ PARSER DE TEXTO ESTRUTURADO JURÍDICO ═══
// Detecta e renderiza: Art., §, Incisos (I, II, III), Alíneas (a, b, c), Itens (1, 2, 3)
function detectLineLevel(line: string): { level: number; isBold: boolean } {
    const trimmed = line.trim();
    // Artigo: "Art. 1º", "Art. 2", "Artigo 1"
    if (/^Art(igo)?\.?\s/i.test(trimmed)) return { level: 0, isBold: true };
    // Parágrafo: "§ 1º", "§ único", "Parágrafo"
    if (/^(§|Parágrafo)/i.test(trimmed)) return { level: 1, isBold: false };
    // Inciso romano: "I.", "II.", "III -", "IV)", "i.", "ii.", "xi.", "xii." etc.
    if (/^(X{0,3})(IX|IV|V?I{0,3})\s*[.)\-–—]/i.test(trimmed) && /^[IVXivx]/i.test(trimmed)) return { level: 2, isBold: false };
    // Alínea: "a)", "b)", "c)" etc.
    if (/^[a-z]\)\s/i.test(trimmed)) return { level: 3, isBold: false };
    // Item numérico: "1.", "2.", "3." (com texto depois)
    if (/^\d{1,3}\.\s/.test(trimmed)) return { level: 4, isBold: false };
    // Bullet: "•", "▸", "-" no início
    if (/^[•▸\-]\s/.test(trimmed)) return { level: 3, isBold: false };
    // Texto normal
    return { level: -1, isBold: false };
}

function renderStructuredText(text: string | undefined | null, baseStyle: React.CSSProperties): React.ReactNode {
    if (!text) return null;
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return null;

    // Check if text has ANY structured markers
    const hasStructure = lines.some(l => {
        const { level } = detectLineLevel(l);
        return level >= 0;
    });

    // No structure detected — render as pre-line paragraph preserving newlines
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

export function ContractPDFTemplate({ contract, company }: ContractPDFTemplateProps) {
    const co = company || {};
    const empresa = {
        nome: co.razaoSocial || co.name || co.tradeName || 'EXITO GRID COMERCIO E SERVICOS ELETRICOS LTDA',
        cnpj: co.cnpj || '55.303.935/0001-39',
        endereco: co.address ? `${co.address}${co.number ? ', ' + co.number : ''}${co.complement ? ', ' + co.complement : ''} — ${co.neighborhood || ''}, ${co.city || 'Recife'}/${co.state || 'PE'}` : 'R General Polidoro, 352, Loja 0104 — Varzea, Recife/PE',
        telefone: co.phone || '(81) 8887-0766',
        email: co.email || 'contato@exitogrid.com.br',
        site: co.website || 'www.exitogrid.com.br',
    };

    const clientName = contract.client?.name || '—';
    const clientDoc = contract.client?.document || '—';
    const clientAddress = contract.client?.address || contract.client?.city ? `${contract.client?.address || ''}, ${contract.client?.city || ''} - ${contract.client?.state || ''}` : '—';

    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const typeLabels: Record<string, string> = {
        service: 'Prestação de Serviços', supply: 'Fornecimento de Materiais',
        subcontract: 'Subcontratação', maintenance: 'Manutenção Preventiva e Corretiva',
        consulting: 'Consultoria Técnica', other: 'Serviços Diversos',
    };

    const defaultContractorObligations = [
        'Executar os serviços conforme especificações técnicas e cronograma estabelecido.',
        'Fornecer todos os materiais, equipamentos e mão de obra necessários.',
        'Manter equipe técnica habilitada, com EPIs e documentação em conformidade.',
        'Emitir ART/RRT quando aplicável.',
        'Comunicar imediatamente qualquer impedimento ou necessidade de alteração no escopo.',
        'Realizar limpeza e organização do local após conclusão dos serviços.',
    ];

    const defaultClientObligations = [
        'Fornecer acesso livre e seguro ao local de execução dos serviços.',
        'Disponibilizar ponto de energia elétrica e água quando necessário.',
        'Efetuar os pagamentos nas datas e condições acordadas neste instrumento.',
        'Designar responsável técnico para acompanhamento e aceite dos serviços.',
        'Providenciar as devidas licenças, alvarás e autorizações quando aplicável.',
    ];

    const defaultGeneralProvisions = [
        'O presente contrato é celebrado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores.',
        'Eventuais serviços adicionais ou alterações de escopo serão objeto de termo aditivo.',
        'Os preços pactuados são fixos e irreajustáveis pelo período de vigência, salvo disposição expressa em contrário.',
        'Este contrato é regido pelas disposições do Código Civil Brasileiro (Lei nº 10.406/2002).',
    ];

    const contractorObs = contract.contractorObligations
        ? contract.contractorObligations.split('\n').filter((l: string) => l.trim())
        : defaultContractorObligations;
    const clientObs = contract.clientObligations
        ? contract.clientObligations.split('\n').filter((l: string) => l.trim())
        : defaultClientObligations;
    const generalProv = contract.generalProvisions
        ? contract.generalProvisions.split('\n').filter((l: string) => l.trim())
        : defaultGeneralProvisions;

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
        listItem: { fontSize: '9.5px', color: '#2d2d2d', padding: '3px 0', paddingLeft: '12px', position: 'relative' as const } as React.CSSProperties,
        bullet: { position: 'absolute' as const, left: 0, color: '#E8620A', fontWeight: '700' } as React.CSSProperties,
        sigArea: { display: 'flex', justifyContent: 'space-between', gap: '60px', marginTop: '40px', paddingTop: '20px' } as React.CSSProperties,
        sigBox: { flex: 1, textAlign: 'center' as const } as React.CSSProperties,
        sigLine: { borderTop: '1px solid #333', marginTop: '50px', paddingTop: '8px', fontSize: '9px', fontWeight: '600' } as React.CSSProperties,
        sigSub: { fontSize: '8px', color: '#777' } as React.CSSProperties,
        footer: { background: '#1a1a1a', padding: '14px 36px', textAlign: 'center' as const, marginTop: '30px' } as React.CSSProperties,
        footerText: { fontSize: '8px', color: '#888', letterSpacing: '1px' },
        valueBox: { background: '#FFF7ED', border: '2px solid #E8620A', borderRadius: '8px', padding: '16px 24px', marginTop: '14px' } as React.CSSProperties,
    };

    let clause = 1;

    return (
        <div id="contract-pdf-content" style={s.page}>
            {/* ═══ HEADER ═══ */}
            <div style={s.header}>
                <div>
                    <img src={EXITO_GRID_LOGO} alt="Êxito Grid" style={{ height: '50px', objectFit: 'contain' }} />
                </div>
                <div style={s.headerRight}>
                    <div style={{ fontWeight: 700 }}>{empresa.telefone}</div>
                    <div style={{ fontWeight: 700 }}>{empresa.email}</div>
                    <div>{empresa.site}</div>
                </div>
            </div>

            {/* ═══ DARK BAR ═══ */}
            <div style={s.darkBar}>
                <span style={s.darkBarText}>Contrato de {typeLabels[contract.type] || 'Serviços'}</span>
                <span style={s.darkBarRef}>
                    Ref: {contract.contractNumber} | Versão {contract.version || 1} | {dateStr}
                </span>
            </div>

            {/* ═══ BODY ═══ */}
            <div style={s.body}>

                {/* CL 1 — PARTES */}
                <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DAS PARTES</div>
                <p style={s.para}>
                    <strong>CONTRATADA:</strong> {empresa.nome}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {empresa.cnpj}, com sede em {empresa.endereco}, doravante denominada simplesmente <strong>CONTRATADA</strong>.
                </p>
                <p style={s.para}>
                    <strong>CONTRATANTE:</strong> {clientName}, inscrito(a) no CPF/CNPJ sob o nº {clientDoc}, com endereço em {clientAddress}, doravante denominado(a) simplesmente <strong>CONTRATANTE</strong>.
                </p>
                {contract.proposal && (
                    <p style={{ ...s.para, fontStyle: 'italic', color: '#555' }}>
                        Este contrato é firmado com base na Proposta Comercial nº {contract.proposal.proposalNumber}, aceita em {contract.proposal.acceptedAt ? new Date(contract.proposal.acceptedAt).toLocaleDateString('pt-BR') : '—'}.
                    </p>
                )}

                {/* CL 2 — OBJETO */}
                <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DO OBJETO</div>
                <p style={s.para}>
                    O presente instrumento tem por objeto a {(typeLabels[contract.type] || 'prestação de serviços').toLowerCase()} conforme descrito abaixo:
                </p>
                {renderStructuredText(contract.scope || contract.description || 'Conforme especificações técnicas acordadas entre as partes.', s.para)}
                {contract.work && (
                    <p style={{ ...s.para, fontWeight: 600 }}>
                        Obra/Projeto vinculado: {contract.work.code} — {contract.work.title}
                        {contract.work.address ? `, localizada em ${contract.work.address}` : ''}
                    </p>
                )}

                {/* CL 3 — VALOR */}
                <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DO VALOR</div>
                <div style={s.valueBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '10px', color: '#92400e', fontWeight: 600 }}>VALOR DO CONTRATO</span>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#E8620A' }}>R$ {fmt(contract.finalValue || contract.originalValue)}</span>
                    </div>
                    {Number(contract.addendumValue) !== 0 && (
                        <div style={{ marginTop: '8px', fontSize: '9px', color: '#78350f' }}>
                            Valor Original: R$ {fmt(contract.originalValue)} | Aditivos: {Number(contract.addendumValue) >= 0 ? '+' : ''}R$ {fmt(contract.addendumValue)}
                        </div>
                    )}
                </div>
                <p style={s.para}>
                    O valor total deste contrato é de <strong>R$ {fmt(contract.finalValue || contract.originalValue)}</strong> ({numberToWords(Math.floor(Number(contract.finalValue || contract.originalValue)))} reais),
                    conforme composição de preços acordada entre as partes.
                </p>

                {/* CL 4 — PRAZO */}
                <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DO PRAZO</div>
                <p style={s.para}>
                    {contract.startDate && contract.endDate
                        ? `O presente contrato terá vigência de ${new Date(contract.startDate).toLocaleDateString('pt-BR')} a ${new Date(contract.endDate).toLocaleDateString('pt-BR')}, podendo ser prorrogado mediante acordo entre as partes por meio de termo aditivo.`
                        : 'O prazo de vigência será definido em comum acordo entre as partes, iniciando-se na data de assinatura deste instrumento.'}
                </p>

                {/* CL 5 — PAGAMENTO */}
                <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DAS CONDIÇÕES DE PAGAMENTO</div>
                {renderStructuredText(contract.paymentTerms || 'O pagamento será efetuado conforme condições acordadas entre as partes, mediante emissão de nota fiscal pela CONTRATADA.', s.para)}
                {contract.paymentBank && (
                    <>
                        <p style={s.clauseHeading}>Dados Bancários:</p>
                        <p style={{ ...s.para, whiteSpace: 'pre-line' }}>{contract.paymentBank}</p>
                    </>
                )}

                {/* CL 6 — OBRIGAÇÕES CONTRATADA */}
                <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DAS OBRIGAÇÕES DA CONTRATADA</div>
                {contract.contractorObligations
                    ? renderStructuredText(contract.contractorObligations, s.para)
                    : contractorObs.map((ob: string, i: number) => (
                        <div key={i} style={s.listItem}><span style={s.bullet}>▸</span>{ob}</div>
                    ))
                }

                {/* CL 7 — OBRIGAÇÕES CONTRATANTE */}
                <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DAS OBRIGAÇÕES DO CONTRATANTE</div>
                {contract.clientObligations
                    ? renderStructuredText(contract.clientObligations, s.para)
                    : clientObs.map((ob: string, i: number) => (
                        <div key={i} style={s.listItem}><span style={s.bullet}>▸</span>{ob}</div>
                    ))
                }

                {/* CL 8 — PENALIDADES */}
                <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DAS PENALIDADES</div>
                {renderStructuredText(contract.penalties || 'O descumprimento de quaisquer cláusulas deste contrato sujeitará a parte infratora ao pagamento de multa de 10% (dez por cento) sobre o valor total do contrato, além de perdas e danos eventualmente comprovados, sem prejuízo das demais cominações legais.', s.para)}

                {/* CL 9 — GARANTIA (optional) */}
                {(contract.warranty || contract.type === 'service') && (
                    <>
                        <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DA GARANTIA</div>
                        {renderStructuredText(contract.warranty || 'A CONTRATADA garantirá os serviços executados pelo prazo de 12 (doze) meses, contados da data de conclusão e aceite pelo CONTRATANTE, obrigando-se a corrigir, sem ônus, quaisquer vícios ou defeitos decorrentes da execução.', s.para)}
                    </>
                )}

                {/* CL — CONFIDENCIALIDADE (optional) */}
                {contract.confidentiality && (
                    <>
                        <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DA CONFIDENCIALIDADE</div>
                        {renderStructuredText(contract.confidentiality, s.para)}
                    </>
                )}

                {/* CL — RESCISÃO (optional) */}
                {(contract.termination || true) && (
                    <>
                        <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DA RESCISÃO</div>
                        {renderStructuredText(contract.termination || 'O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação prévia por escrito, com antecedência mínima de 30 (trinta) dias, sendo devidos os pagamentos proporcionais aos serviços já executados e materiais já fornecidos.', s.para)}
                    </>
                )}

                {/* CL — FORÇA MAIOR (optional) */}
                {contract.forceMajeure && (
                    <>
                        <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DA FORÇA MAIOR</div>
                        {renderStructuredText(contract.forceMajeure, s.para)}
                    </>
                )}

                {/* CL — DISPOSIÇÕES GERAIS */}
                <div style={s.sectionTitle}>CLÁUSULA {clause++}ª — DAS DISPOSIÇÕES GERAIS</div>
                {contract.generalProvisions
                    ? renderStructuredText(contract.generalProvisions, s.para)
                    : generalProv.map((p: string, i: number) => (
                        <div key={i} style={s.listItem}>
                            <span style={s.bullet}>{String.fromCharCode(97 + i)})</span>
                            <span style={{ paddingLeft: '6px' }}>{p}</span>
                        </div>
                    ))
                }

                {/* CL — FORO */}
                <div style={s.sectionTitle}>CLÁUSULA {clause}ª — DO FORO</div>
                {renderStructuredText(contract.jurisdiction || 'Fica eleito o foro da Comarca de Recife/PE para dirimir quaisquer questões oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.', s.para)}
                <p style={{ ...s.para, marginTop: '14px', fontWeight: 600 }}>
                    E por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.
                </p>

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
                        <div style={{ ...s.sigSub, fontWeight: 600 }}>CONTRATADA</div>
                    </div>
                    <div style={s.sigBox}>
                        <div style={s.sigLine}>{clientName}</div>
                        <div style={s.sigSub}>CPF/CNPJ: {clientDoc}</div>
                        <div style={{ ...s.sigSub, fontWeight: 600 }}>CONTRATANTE</div>
                    </div>
                </div>

                {/* TESTEMUNHAS */}
                <div style={{ ...s.sigArea, marginTop: '30px', gap: '80px' }}>
                    <div style={s.sigBox}>
                        <div style={{ ...s.sigLine, marginTop: '40px' }}>{contract.witness1Name || 'Testemunha 1'}</div>
                        <div style={s.sigSub}>{contract.witness1Document ? `CPF: ${contract.witness1Document}` : ''}</div>
                    </div>
                    <div style={s.sigBox}>
                        <div style={{ ...s.sigLine, marginTop: '40px' }}>{contract.witness2Name || 'Testemunha 2'}</div>
                        <div style={s.sigSub}>{contract.witness2Document ? `CPF: ${contract.witness2Document}` : ''}</div>
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
