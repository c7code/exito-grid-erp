import { useState, useCallback, useMemo, useEffect } from 'react';
import { MessageSquare, Mail, Printer, Eye, EyeOff, AlertTriangle, Copy, CheckCircle, FileText, ScrollText, Loader2, Search, Link2, X } from 'lucide-react';
import type { SimulatorResult, EvaluatedCondition } from '../engine/simulatorTypes';
import { fmt, getScoreClassification, getScoreLabel, getScoreEmoji, getScoreColor } from '../engine/simulatorTypes';
import { generateClientArgument } from '../engine/alertGenerator';
import { getRiskLabel } from '../engine/riskEngine';
import { api } from '@/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

interface Props {
  result: SimulatorResult;
  selectedId: string | null;
  clientName?: string;
  serviceDescription: string;
}

// ═══ WhatsApp Text Builder ════════════════════════════════════════
function buildWhatsAppText(conditions: EvaluatedCondition[], service: string, clientName?: string): string {
  const lines: string[] = [];
  lines.push('⚡ *PROPOSTA EXCLUSIVA*');
  if (clientName) lines.push(`Preparada para: *${clientName}*`);
  lines.push(`📋 ${service}`);
  lines.push('');

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];
    lines.push(`*${i + 1}. ${c.commercialName}*`);

    if (c.type === 'avista') {
      lines.push(`💰 R$ ${fmt(c.totalClient)} à vista`);
    } else {
      if (c.entry > 0) lines.push(`📌 Entrada: R$ ${fmt(c.entry)}`);
      const freq = c.frequency === 1 ? '/mês' : c.frequency === 2 ? '/bim' : '/trim';
      lines.push(`📌 ${c.installments}x de R$ ${fmt(c.installmentAmount)}${freq}`);
      lines.push(`📌 Total: R$ ${fmt(c.totalClient)}`);
    }
    lines.push(`✅ ${generateClientArgument(c, conditions, 'auto')}`);
    lines.push('');
  }

  lines.push('⏰ *Condição válida por 48 horas*');
  lines.push('📞 Responda esta mensagem para aprovar');
  lines.push('');
  lines.push('_EXITO Engenharia — Proposta gerada por simulação financeira_');
  return lines.join('\n');
}

// ═══ Email Text Builder ═══════════════════════════════════════════
function buildEmailText(conditions: EvaluatedCondition[], service: string, clientName?: string): string {
  const lines: string[] = [];
  lines.push('PROPOSTA EXCLUSIVA — CONDIÇÃO ESPECIAL PERSONALIZADA');
  lines.push('');
  lines.push(`Prezado(a) ${clientName || 'Cliente'},`);
  lines.push('');
  lines.push(`Este projeto garante ${service} para sua operação, com garantia integral e acompanhamento técnico completo.`);
  lines.push('');

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];
    lines.push(`━━━ OPÇÃO ${i + 1}: ${c.commercialName} ━━━`);
    lines.push(`✦ ${generateClientArgument(c, conditions, 'auto')}`);
    lines.push('');
    if (c.type === 'avista') {
      lines.push(`  💰 Investimento: R$ ${fmt(c.totalClient)}`);
    } else {
      if (c.entry > 0) lines.push(`  📌 Investimento inicial: R$ ${fmt(c.entry)}`);
      if (c.installmentAmount > 0) lines.push(`  📌 ${c.installments}x parcelas de: R$ ${fmt(c.installmentAmount)}/mês`);
      lines.push(`  📌 Total do investimento: R$ ${fmt(c.totalClient)}`);
    }
    lines.push('');
  }

  lines.push('⏰ Condição válida por 48 horas.');
  lines.push('📞 Para aprovar, entre em contato conosco.');
  lines.push('');
  lines.push('Atenciosamente,');
  lines.push('Equipe Comercial — EXITO Engenharia');
  return lines.join('\n');
}

// ═══ Simulation Data Builder (for saving to proposal) ═════════════
function buildSimulationJSON(
  selected: EvaluatedCondition,
  allViable: EvaluatedCondition[],
  service: string,
  clientName?: string
): string {
  return JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    service,
    clientName: clientName || null,
    selected: {
      id: selected.id,
      commercialName: selected.commercialName,
      type: selected.type,
      entry: selected.entry,
      installments: selected.installments,
      installmentAmount: selected.installmentAmount,
      totalClient: selected.totalClient,
      frequency: selected.frequency,
      effectiveMargin: selected.effectiveMargin,
      correctionAmount: selected.correctionAmount,
      argument: generateClientArgument(selected, allViable, 'auto'),
    },
    alternatives: allViable
      .filter(c => c.id !== selected.id)
      .slice(0, 3)
      .map(c => ({
        id: c.id,
        commercialName: c.commercialName,
        type: c.type,
        entry: c.entry,
        installments: c.installments,
        installmentAmount: c.installmentAmount,
        totalClient: c.totalClient,
        frequency: c.frequency,
        argument: generateClientArgument(c, allViable, 'auto'),
      })),
  });
}

// ═══ Readable payment condition text ══════════════════════════════
function buildPaymentText(selected: EvaluatedCondition): string {
  const parts: string[] = [];
  if (selected.entry > 0) {
    parts.push(`Entrada de R$ ${fmt(selected.entry)} (via PIX/Transferência)`);
  }
  if (selected.installmentAmount > 0) {
    const freq = selected.frequency === 1 ? 'mensais' : selected.frequency === 2 ? 'bimestrais' : 'trimestrais';
    parts.push(`${selected.installments}x parcelas ${freq} de R$ ${fmt(selected.installmentAmount)}`);
  }
  if (selected.type === 'avista') {
    parts.push(`Pagamento à vista de R$ ${fmt(selected.totalClient)}`);
  }
  parts.push(`Total do investimento: R$ ${fmt(selected.totalClient)}`);
  return parts.join(' + ');
}

// ═══ PDF Builder (standalone) ═════════════════════════════════════
function buildPDFHTML(condition: EvaluatedCondition, allConditions: EvaluatedCondition[], service: string, clientName?: string): string {
  const topConditions = allConditions.filter(c => !c.blocked).slice(0, 5);
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const validUntil = new Date(today.getTime() + 48 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

  const empresa = {
    nome: 'ÊXITO GRID SOLUÇÕES EM ENERGIA LTDA',
    cnpj: '00.000.000/0001-00',
    telefone: '(81) 9 0000-0000',
    email: 'contato@exitogrid.com.br',
    site: 'www.exitogrid.com.br',
    endereco: 'Recife — PE',
  };

  const conditionRows = (c: EvaluatedCondition) => {
    let rows = '';
    if (c.entry > 0) {
      rows += `<tr>
        <td style="padding: 8px 12px; font-size: 10px; border-bottom: 1px solid #e8e8e8;">Investimento Inicial (Entrada)</td>
        <td style="padding: 8px 12px; font-size: 10px; border-bottom: 1px solid #e8e8e8; text-align: right; font-weight: 700; color: #E8620A;">R$ ${fmt(c.entry)}</td>
      </tr>`;
    }
    if (c.installmentAmount > 0) {
      const freq = c.frequency === 1 ? 'mensal' : c.frequency === 2 ? 'bimestral' : 'trimestral';
      rows += `<tr>
        <td style="padding: 8px 12px; font-size: 10px; border-bottom: 1px solid #e8e8e8;">${c.installments}x parcelas (${freq})</td>
        <td style="padding: 8px 12px; font-size: 10px; border-bottom: 1px solid #e8e8e8; text-align: right; font-weight: 700;">R$ ${fmt(c.installmentAmount)}</td>
      </tr>`;
    }
    if (c.correctionAmount > 0) {
      rows += `<tr>
        <td style="padding: 8px 12px; font-size: 10px; border-bottom: 1px solid #e8e8e8; color: #666;">Correção monetária (CDI)</td>
        <td style="padding: 8px 12px; font-size: 10px; border-bottom: 1px solid #e8e8e8; text-align: right; color: #666;">R$ ${fmt(c.correctionAmount)}</td>
      </tr>`;
    }
    rows += `<tr style="background: #fafafa;">
      <td style="padding: 10px 12px; font-size: 12px; font-weight: 800; border-top: 2px solid #E8620A;">TOTAL DO INVESTIMENTO</td>
      <td style="padding: 10px 12px; font-size: 14px; font-weight: 800; color: #E8620A; text-align: right; border-top: 2px solid #E8620A;">R$ ${fmt(c.totalClient)}</td>
    </tr>`;
    return rows;
  };

  const alternativeCards = topConditions.filter(c => c.id !== condition.id).slice(0, 3).map(c => `
    <div style="flex: 1; min-width: 180px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; background: #fafafa;">
      <p style="font-size: 11px; font-weight: 700; color: #E8620A; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">${c.commercialName}</p>
      ${c.entry > 0 ? `<p style="font-size: 10px; color: #555; margin: 0 0 3px 0;">▸ Entrada: R$ ${fmt(c.entry)}</p>` : ''}
      ${c.installmentAmount > 0 ? `<p style="font-size: 10px; color: #555; margin: 0 0 3px 0;">▸ ${c.installments}x de R$ ${fmt(c.installmentAmount)}</p>` : ''}
      <p style="font-size: 12px; font-weight: 700; color: #1a1a1a; margin: 8px 0 0 0;">Total: R$ ${fmt(c.totalClient)}</p>
    </div>
  `).join('');

  return `
  <div id="simulator-pdf-content" style="font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; max-width: 794px; margin: 0 auto; background: white; color: #1a1a1a; font-size: 10pt; line-height: 1.55;">
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 28px 36px 18px; border-bottom: 3px solid #E8620A;">
      <div>
        <div style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
          <span style="color: #E8620A;">Êxito</span><span style="color: #2d2d2d;">Grid</span>
        </div>
        <div style="font-size: 10px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px;">Eficiência Elétrica & Solar</div>
      </div>
      <div style="text-align: right; font-size: 9px; color: #555; line-height: 1.7;">
        <div style="font-weight: 700;">${empresa.telefone}</div>
        <div style="font-weight: 700;">${empresa.email}</div>
        <div>${empresa.site}</div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 10px 36px; display: flex; justify-content: space-between; align-items: center;">
      <span style="color: #E8620A; font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">Condições de Pagamento</span>
      <span style="color: #888; font-size: 9px;">Ref: SIM-${Date.now().toString(36).toUpperCase()} | ${dateStr}</span>
    </div>

    <div style="padding: 30px 36px;">
      ${clientName ? `
      <div style="font-size: 11px; font-weight: 800; color: #E8620A; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #E8620A; padding-bottom: 6px; margin-bottom: 14px;">1. Identificação</div>
      <p style="font-size: 10px; text-align: justify; margin: 6px 0; color: #2d2d2d;"><strong>CONTRATADA:</strong> ${empresa.nome}, inscrita no CNPJ sob o nº ${empresa.cnpj}, com sede em ${empresa.endereco}.</p>
      <p style="font-size: 10px; text-align: justify; margin: 6px 0; color: #2d2d2d;"><strong>CONTRATANTE:</strong> ${clientName}.</p>` : ''}

      <div style="font-size: 11px; font-weight: 800; color: #E8620A; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #E8620A; padding-bottom: 6px; margin-top: 28px; margin-bottom: 14px;">${clientName ? '2' : '1'}. Objeto e Escopo</div>
      <p style="font-size: 10px; text-align: justify; margin: 6px 0; color: #2d2d2d; line-height: 1.6;">A presente proposta tem por objeto a prestação de serviços de <strong>${service}</strong>, incluindo todo o material necessário, mão de obra qualificada e acompanhamento técnico completo, conforme especificações técnicas e normas regulamentadoras vigentes.</p>

      <div style="font-size: 11px; font-weight: 800; color: #E8620A; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #E8620A; padding-bottom: 6px; margin-top: 28px; margin-bottom: 14px;">${clientName ? '3' : '2'}. Condição de Pagamento — ${condition.commercialName}</div>

      <div style="background: #FFF7ED; border: 2px solid #E8620A; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px;">
        <p style="font-size: 13px; font-weight: 700; color: #E8620A; margin: 0 0 6px 0;">⭐ CONDIÇÃO RECOMENDADA</p>
        <p style="font-size: 10px; color: #92400e; margin: 0; line-height: 1.6;">${generateClientArgument(condition, allConditions, 'auto')}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead><tr>
          <th style="background: #f1f5f9; padding: 8px 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #444; border-bottom: 2px solid #ddd; text-align: left;">Descrição</th>
          <th style="background: #f1f5f9; padding: 8px 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #444; border-bottom: 2px solid #ddd; text-align: right;">Valor</th>
        </tr></thead>
        <tbody>${conditionRows(condition)}</tbody>
      </table>

      ${topConditions.length > 1 ? `
      <div style="font-size: 11px; font-weight: 800; color: #E8620A; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #E8620A; padding-bottom: 6px; margin-top: 28px; margin-bottom: 14px;">${clientName ? '4' : '3'}. Opções Alternativas de Pagamento</div>
      <p style="font-size: 10px; text-align: justify; margin: 6px 0 16px 0; color: #2d2d2d;">Oferecemos ainda as seguintes alternativas para sua conveniência:</p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">${alternativeCards}</div>` : ''}

      <div style="font-size: 11px; font-weight: 800; color: #E8620A; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #E8620A; padding-bottom: 6px; margin-top: 28px; margin-bottom: 14px;">${clientName ? (topConditions.length > 1 ? '5' : '4') : (topConditions.length > 1 ? '4' : '3')}. Validade e Disposições</div>
      <div style="font-size: 9.5px; color: #2d2d2d; padding: 3px 0 3px 12px; position: relative;"><span style="position: absolute; left: 0; color: #E8620A; font-weight: 700;">▸</span>Esta proposta tem validade até ${validUntil} (48 horas).</div>
      <div style="font-size: 9.5px; color: #2d2d2d; padding: 3px 0 3px 12px; position: relative;"><span style="position: absolute; left: 0; color: #E8620A; font-weight: 700;">▸</span>Os valores apresentados são válidos para pagamento nas condições descritas.</div>
      <div style="font-size: 9.5px; color: #2d2d2d; padding: 3px 0 3px 12px; position: relative;"><span style="position: absolute; left: 0; color: #E8620A; font-weight: 700;">▸</span>Garantia integral sobre materiais e execução, conforme especificações técnicas.</div>
      <div style="font-size: 9.5px; color: #2d2d2d; padding: 3px 0 3px 12px; position: relative;"><span style="position: absolute; left: 0; color: #E8620A; font-weight: 700;">▸</span>Equipe técnica qualificada em conformidade com NR-10, NR-35 e demais normas aplicáveis.</div>

      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
        <div style="font-size: 10px; font-weight: 700; color: #166534; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;"><span style="font-size: 14px;">✓</span>DECLARAÇÃO DE CONFORMIDADE</div>
        <p style="font-size: 9.5px; color: #166534; text-align: justify; margin: 0; line-height: 1.6;">Todos os colaboradores designados atendem integralmente aos requisitos das Normas Regulamentadoras (NRs) aplicáveis, incluindo NR-06, NR-10, NR-12 e NR-35. A equipe técnica possui treinamentos e habilitações vigentes.</p>
      </div>

      <div style="margin-top: 10px;"><p style="font-size: 10px; text-align: center; font-style: italic; color: #555;">Recife/PE, ${dateStr}.</p></div>
      <div style="display: flex; justify-content: space-between; gap: 60px; margin-top: 40px; padding-top: 20px;">
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #333; margin-top: 50px; padding-top: 8px; font-size: 9px; font-weight: 600;">${empresa.nome}</div>
          <div style="font-size: 8px; color: #777;">CNPJ: ${empresa.cnpj}</div>
          <div style="font-size: 8px; color: #777; font-weight: 600;">CONTRATADA</div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #333; margin-top: 50px; padding-top: 8px; font-size: 9px; font-weight: 600;">${clientName || 'CONTRATANTE'}</div>
          <div style="font-size: 8px; color: #777;">CPF/CNPJ:</div>
          <div style="font-size: 8px; color: #777; font-weight: 600;">CONTRATANTE</div>
        </div>
      </div>
    </div>

    <div style="background: #1a1a1a; padding: 14px 36px; text-align: center; margin-top: 30px;">
      <span style="font-size: 8px; color: #888; letter-spacing: 1px;">
        <span style="color: #E8620A; font-weight: 700;">EXITO SYSTEM</span>
        — Documento gerado eletronicamente | ${empresa.nome} | CNPJ: ${empresa.cnpj}
      </span>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// Modal de seleção de proposta
// ═══════════════════════════════════════════════════════════════════
function ProposalSelectorModal({
  open, onClose, onSelect, loading: externalLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (proposal: any) => void;
  loading: boolean;
}) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoadingList(true);
    api.getProposals().then((data: any) => {
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setProposals(list);
    }).catch(() => {
      toast.error('Erro ao carregar propostas');
    }).finally(() => setLoadingList(false));
  }, [open]);

  const filtered = proposals.filter(p =>
    (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.proposalNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.client?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-white font-bold text-base">📎 Vincular à Proposta</h3>
            <p className="text-xs text-gray-400">Selecione a proposta para anexar a condição de pagamento</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar proposta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loadingList ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Carregando propostas...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <FileText className="w-10 h-10 mb-2" />
              <p className="text-sm">Nenhuma proposta encontrada</p>
            </div>
          ) : (
            filtered.map(p => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                disabled={externalLoading}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/70 transition-colors text-left group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-mono">{p.proposalNumber}</span>
                    {p.simulationData && (
                      <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold rounded">SIM</span>
                    )}
                  </div>
                  <p className="text-sm text-white truncate">{p.title || 'Sem título'}</p>
                  <p className="text-xs text-gray-500">{p.client?.name || '—'} • R$ {Number(p.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                </div>
                <Link2 className="w-4 h-4 text-gray-600 group-hover:text-amber-400 transition-colors flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
export default function Step4Export({ result, selectedId, clientName, serviceDescription }: Props) {
  const [viewMode, setViewMode] = useState<'client' | 'internal'>('client');
  const [copied, setCopied] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [linkingProposal, setLinkingProposal] = useState(false);
  const [showProposalSelector, setShowProposalSelector] = useState(false);
  const navigate = useNavigate();

  const selected = useMemo(() => {
    const all = [result.recommended, result.bestForClosing, result.bestForMargin, ...result.alternatives];
    return all.find(c => c.id === selectedId) || result.recommended;
  }, [result, selectedId]);

  const allViable = useMemo(() => {
    return [result.recommended, result.bestForClosing, result.bestForMargin, ...result.alternatives].filter(c => !c.blocked);
  }, [result]);

  const exportConditions = useMemo(() => [selected], [selected]);

  const handleWhatsApp = useCallback(() => {
    const text = buildWhatsAppText(exportConditions, serviceDescription, clientName);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }, [exportConditions, serviceDescription, clientName]);

  const handleEmail = useCallback(() => {
    const text = buildEmailText(exportConditions, serviceDescription, clientName);
    const subject = clientName
      ? `Condição Especial ${serviceDescription} — ${clientName}`
      : `Proposta Comercial — ${serviceDescription}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, '_blank');
  }, [exportConditions, serviceDescription, clientName]);

  const handleCopy = useCallback(() => {
    const text = buildWhatsAppText(exportConditions, serviceDescription, clientName);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exportConditions, serviceDescription, clientName]);

  const handlePDF = useCallback(async () => {
    setGeneratingPDF(true);
    toast.info('Gerando PDF profissional...');
    
    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.innerHTML = buildPDFHTML(selected, allViable, serviceDescription, clientName);
      document.body.appendChild(container);

      const element = container.querySelector('#simulator-pdf-content') as HTMLElement | null;
      if (!element) {
        toast.error('Erro ao gerar PDF');
        return;
      }

      const opt = {
        margin: 0,
        filename: `proposta_simulacao_${clientName ? clientName.replace(/\s/g, '_') : 'cliente'}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, width: 794, windowWidth: 794 },
        jsPDF: { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] },
      };

      await html2pdf().from(element).set(opt).save();
      document.body.removeChild(container);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Erro ao gerar PDF.');
    } finally {
      setGeneratingPDF(false);
    }
  }, [selected, allViable, serviceDescription, clientName]);

  // ── Vincular simulação a uma proposta existente ──────────────────
  const handleLinkToProposal = useCallback(async (proposal: any) => {
    setLinkingProposal(true);
    try {
      const simulationJSON = buildSimulationJSON(selected, allViable, serviceDescription, clientName);
      const paymentText = buildPaymentText(selected);

      await api.updateProposal(proposal.id, {
        simulationData: simulationJSON,
        paymentConditions: paymentText,
      });

      toast.success(`Simulação vinculada à proposta ${proposal.proposalNumber}!`);
      setShowProposalSelector(false);
      setTimeout(() => navigate('/admin/proposals'), 1000);
    } catch (err) {
      console.error('Error linking proposal:', err);
      toast.error('Erro ao vincular simulação.');
    } finally {
      setLinkingProposal(false);
    }
  }, [selected, allViable, serviceDescription, clientName, navigate]);

  const handleCreateContract = useCallback(() => {
    const params = new URLSearchParams({
      fromSimulator: 'true',
      title: serviceDescription,
      value: String(selected.totalClient),
      entry: String(selected.entry),
      installments: String(selected.installments),
      installmentAmount: String(selected.installmentAmount),
      clientName: clientName || '',
    });
    navigate(`/admin/contracts?${params.toString()}`);
    toast.info('Redirecionando para Contratos...');
  }, [selected, serviceDescription, clientName, navigate]);

  const showInternal = viewMode === 'internal';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">📤 Enviar Proposta</h2>
          <p className="text-sm text-gray-400">Revise e exporte a condição selecionada</p>
        </div>
        <button
          onClick={() => setViewMode(v => v === 'client' ? 'internal' : 'client')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            showInternal
              ? 'bg-red-950/50 border-red-700/40 text-red-400'
              : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          {showInternal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {showInternal ? 'Interna' : 'Cliente'}
        </button>
      </div>

      {showInternal && (
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2 mb-4 text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Visão interna — NÃO compartilhar</span>
        </div>
      )}

      {/* ── Preview da Condição ──────────────────────────────────────── */}
      <div className="bg-gray-900/80 border border-gray-700/50 rounded-2xl p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-full">
            ⭐ Condição Selecionada
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{selected.commercialName}</h3>
        <p className="text-sm text-gray-400 mb-4">
          {generateClientArgument(selected, exportConditions, 'auto')}
        </p>

        <div className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-4 space-y-3">
          {selected.entry > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-yellow-400">Investimento Inicial</span>
              <span className="font-mono font-bold text-yellow-300">R$ {fmt(selected.entry)}</span>
            </div>
          )}
          {selected.installmentAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-cyan-400">{selected.installments}x parcelas de</span>
              <span className="font-mono font-bold text-cyan-300">R$ {fmt(selected.installmentAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-600">
            <span className="text-sm font-semibold text-white">Total do Investimento</span>
            <span className="font-mono font-bold text-white text-lg">R$ {fmt(selected.totalClient)}</span>
          </div>
        </div>

        {showInternal && (
          <div className="mt-4 bg-red-950/20 border border-red-800/20 rounded-xl p-4 space-y-3">
            {/* Score classification */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase">Classificação da Condição</span>
              {(() => {
                const cls = getScoreClassification(selected.finalScore);
                const color = getScoreColor(cls);
                return (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                    style={{ backgroundColor: `${color}15`, borderColor: `${color}40`, color }}
                  >
                    {getScoreEmoji(cls)} {getScoreLabel(cls)}
                  </span>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Margem</p>
                <p className={`font-mono text-sm font-bold ${selected.effectiveMargin >= 25 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {selected.effectiveMargin.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Margem Real</p>
                <p className="font-mono text-sm font-bold text-gray-300">{selected.realMargin.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">IRR Anual</p>
                <p className="font-mono text-sm font-bold text-purple-300">{selected.irrAnnual.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Lucro</p>
                <p className="font-mono text-sm font-bold text-emerald-400">R$ {fmt(selected.totalProfit)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Risco</p>
                <p className="font-mono text-sm font-bold text-gray-300">{getRiskLabel(selected.riskLevel)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Score</p>
                <p className="font-mono text-sm font-bold text-gray-300">{selected.finalScore}/100</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Atratividade</p>
                <p className="font-mono text-sm font-bold text-cyan-300">{selected.attractivenessScore}/100</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Payback</p>
                <p className="font-mono text-sm font-bold text-gray-300">Mês {selected.paybackMonth}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Inadimplência Est.</p>
                <p className="font-mono text-sm font-bold text-gray-300">{selected.defaultRisk.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Prazo Médio</p>
                <p className="font-mono text-sm font-bold text-gray-300">{Math.round(selected.avgReceivingDays)} dias</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Toler. Atraso</p>
                <p className="font-mono text-sm font-bold text-gray-300">
                  {selected.delayImpact.maxSafeDelay > 0
                    ? `Até ${selected.delayImpact.maxSafeDelay} mês${selected.delayImpact.maxSafeDelay > 1 ? 'es' : ''}`
                    : 'Nenhum'}
                </p>
              </div>
            </div>

            {/* Delay impact detail */}
            {selected.delayImpact.delay1m.marginLoss > 0 && (
              <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-[10px] text-gray-500">
                Impacto de atraso: 1m → margem {selected.delayImpact.delay1m.realMargin.toFixed(1)}% (-{selected.delayImpact.delay1m.marginLoss.toFixed(1)}pp)
                {selected.delayImpact.delay1m.cashGap > 0 && (
                  <span className="text-amber-400/70"> | Gap: R$ {fmt(selected.delayImpact.delay1m.cashGap)}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Vincular a Proposta/Contrato ──────────────────────────────── */}
      <div className="bg-gray-900/50 border border-gray-700/30 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📎 Vincular ao Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setShowProposalSelector(true)}
            className="flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-300 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Vincular à Proposta
          </button>
          <button
            onClick={handleCreateContract}
            className="flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/40 text-purple-300 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            <ScrollText className="w-4 h-4" />
            Vincular ao Contrato
          </button>
        </div>
      </div>

      {/* ── Export Buttons ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-green-500/20"
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp
        </button>
        <button
          onClick={handleEmail}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          <Mail className="w-4 h-4" />
          E-mail
        </button>
        <button
          onClick={handlePDF}
          disabled={generatingPDF}
          className="flex items-center justify-center gap-2 bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          {generatingPDF ? 'Gerando...' : 'PDF'}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>

      {/* ── Modal de seleção de proposta ──────────────────────────────── */}
      <ProposalSelectorModal
        open={showProposalSelector}
        onClose={() => setShowProposalSelector(false)}
        onSelect={handleLinkToProposal}
        loading={linkingProposal}
      />
    </div>
  );
}
