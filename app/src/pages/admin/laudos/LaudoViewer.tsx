import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, FileText, Send, RotateCcw, User, Building2, Plug, Shield,
  Clock, HardHat, DollarSign, Paperclip, ExternalLink, CheckCircle2, XCircle,
  Loader2, MapPin, Phone, Mail, Calendar, Download, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function parseJSON(str: string | null | undefined): any {
  if (!str) return {};
  try { return typeof str === 'object' ? str : JSON.parse(str); } catch { return {}; }
}
function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return '—'; }
}

// ═══════════════════════════════════════════════════════════════
// INFO ROW — linha de informação no modo leitura
// ═══════════════════════════════════════════════════════════════
function Info({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION READ-ONLY — seção colapsada no modo leitura
// ═══════════════════════════════════════════════════════════════
function ReadSection({ title, icon: Icon, children, empty }: {
  title: string; icon: any; children: React.ReactNode; empty?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b bg-slate-50/50 flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        {empty && <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-400 border-slate-200 ml-auto">Não preenchido</Badge>}
      </div>
      {!empty && <div className="px-4 py-3 sm:px-5 sm:py-4 space-y-1">{children}</div>}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// INFRA BADGE — item de infraestrutura
// ═══════════════════════════════════════════════════════════════
function InfraBadge({ label, active, detail }: { label: string; active: boolean; detail?: string }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
      active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-50'
    }`}>
      {active ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
      <div className="min-w-0 flex-1">
        <span className={active ? 'text-emerald-800 font-medium' : 'text-slate-400'}>{label}</span>
        {detail && active && <p className="text-xs text-emerald-600 truncate">{detail}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
interface Props {
  laudo: any;
  onBack: () => void;
  onUpdated: () => void;
}

export default function LaudoViewer({ laudo, onBack, onUpdated }: Props) {
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [showDevolver, setShowDevolver] = useState(false);
  const [motivoDevolucao, setMotivoDevolucao] = useState('');
  const [devolvendo, setDevolvendo] = useState(false);

  const dados = parseJSON(laudo.dados);
  const docs = parseJSON(laudo.documentos);
  const docsPendentes: string[] = dados._docsPendentes || [];
  const client = laudo.client || {};

  // ─── Criar Proposta ───
  async function handleCreateProposal() {
    setCreatingProposal(true);
    try {
      // Montar dados da proposta a partir do laudo
      const title = `Laudo Elétrico — ${client.name || 'Cliente'}`;
      const scope = buildScope(dados);

      const proposal = await api.createProposal({
        proposal: {
          clientId: laudo.clientId,
          title,
          scope,
          activityType: 'instalacao_eletrica',
          sourceType: 'laudo_atendimento',
          sourceId: laudo.id,
          workAddress: dados.endereco || '',
          notes: `Atendimento de laudo #${laudo.id?.slice(0, 8)}\n${dados.finalidade || ''}\n${dados.gatilho || ''}`,
          deadline: dados.prazo_desejado || '',
          workDeadlineText: dados.prazo_desejado || '',
        },
        items: [],
      });

      // Vincular proposta ao laudo
      await api.linkLaudoProposal(laudo.id, proposal.id);
      toast.success('Proposta criada com sucesso!');
      onUpdated();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar proposta');
    } finally {
      setCreatingProposal(false);
    }
  }

  // ─── Devolver ao Vendedor ───
  async function handleDevolver() {
    setDevolvendo(true);
    try {
      // Salvar motivo nas observações
      if (motivoDevolucao.trim()) {
        const dadosAtual = parseJSON(laudo.dados);
        dadosAtual._motivoDevolucao = motivoDevolucao;
        dadosAtual._dataDevolvido = new Date().toISOString();
        await api.updateLaudo(laudo.id, {
          dados: dadosAtual,
          observacoes: `Devolvido: ${motivoDevolucao}`,
        });
      }
      await api.updateLaudoStatus(laudo.id, 'aberto');
      toast.success('Atendimento devolvido ao vendedor');
      setShowDevolver(false);
      onUpdated();
    } catch {
      toast.error('Erro ao devolver');
    } finally {
      setDevolvendo(false);
    }
  }

  // ─── Construir escopo para proposta ───
  function buildScope(d: any): string {
    const parts: string[] = [];
    if (d.finalidade) parts.push(`Finalidade: ${d.finalidade}`);
    if (d.tipo_imovel) parts.push(`Tipo de imóvel: ${d.tipo_imovel}`);
    if (d.endereco) parts.push(`Endereço: ${d.endereco}`);
    if (d.area) parts.push(`Área aprox.: ${d.area} m²`);
    if (d.pavimentos) parts.push(`Pavimentos: ${d.pavimentos}`);
    if (d.tensao) parts.push(`Tensão: ${d.tensao}`);
    if (d.demanda_contratada) parts.push(`Demanda: ${d.demanda_contratada} kW`);
    // Infraestrutura existente
    const infras = ['subestacao', 'gerador', 'spda', 'aterramento', 'solar', 'ev', 'capacitor', 'nobreak', 'diagrama', 'pie'];
    const ativas = infras.filter(i => d[`infra_${i}`]);
    if (ativas.length > 0) parts.push(`Infraestrutura: ${ativas.join(', ')}`);
    return parts.join('\n');
  }

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    aberto: { label: 'Aberto', cls: 'bg-blue-100 text-blue-800' },
    enviado_orcamento: { label: 'Orçamento Enviado', cls: 'bg-amber-100 text-amber-800' },
    perdido: { label: 'Perdido', cls: 'bg-red-100 text-red-800' },
  };
  const st = STATUS_LABEL[laudo.status] || STATUS_LABEL.aberto;

  const selectLabels: Record<string, Record<string, string>> = {
    aprovacao: { nao: 'Não, decide na hora', diretoria: 'Precisa de diretoria', licitacao: 'Licitação', outro: 'Outro' },
    orcamento_disponivel: { sim: 'Sim, já tem verba', parcial: 'Parcialmente', nao: 'Não definido', precisa_proposta: 'Precisa da proposta' },
    concorrencia: { nao: 'Não', sim_1: '1 concorrente', sim_varios: 'Vários', indicacao: 'Indicação direta' },
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-8">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 mt-0.5" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-800">{client.name || 'Atendimento'}</h1>
            <Badge className={st.cls + ' text-xs'}>{st.label}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Criado em {formatDate(laudo.createdAt)} • ID: {laudo.id?.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* ── Motivo da devolução (se houver) ── */}
      {dados._motivoDevolucao && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Devolvido pelo engenheiro</p>
            <p className="text-sm text-amber-700">{dados._motivoDevolucao}</p>
            {dados._dataDevolvido && <p className="text-xs text-amber-500 mt-1">{formatDate(dados._dataDevolvido)}</p>}
          </div>
        </div>
      )}

      {/* ── Cabeçalho Consolidado ── */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          <Info label="Cliente" value={client.name} icon={User} />
          <Info label="Razão Social / Fantasia" value={client.companyName || client.tradeName} />
          <Info label="CNPJ/CPF" value={client.document} />
          <Info label="Telefone" value={dados.clientPhone || client.phone} icon={Phone} />
          <Info label="E-mail" value={dados.clientEmail || client.email} icon={Mail} />
          <Info label="Endereço" value={dados.endereco} icon={MapPin} />
          <Info label="Tipo de Imóvel" value={dados.tipo_imovel} icon={Building2} />
          <Info label="Finalidade" value={dados.finalidade} icon={FileText} />
        </div>
      </Card>

      {/* ── S2: Imóvel ── */}
      <ReadSection title="Imóvel" icon={Building2} empty={!dados.tipo_imovel && !dados.endereco}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Info label="Tipo" value={dados.tipo_imovel} />
          <Info label="Endereço" value={dados.endereco} />
          <Info label="Área" value={dados.area ? `${dados.area} m²` : undefined} />
          <Info label="Ano de Construção" value={dados.ano_construcao} />
          <Info label="Pavimentos" value={dados.pavimentos} />
        </div>
      </ReadSection>

      {/* ── S3: Motivo ── */}
      <ReadSection title="Motivo do Laudo" icon={FileText} empty={!dados.finalidade}>
        <Info label="Finalidade" value={dados.finalidade} />
        <Info label="Gatilho" value={dados.gatilho} />
        <Info label="Prazo Desejado" value={dados.prazo_desejado} />
        <Info label="Prazo Fatal" value={dados.prazo_fatal ? formatDate(dados.prazo_fatal) : undefined} icon={Calendar} />
      </ReadSection>

      {/* ── S4: Suprimento ── */}
      <ReadSection title="Suprimento Elétrico" icon={Plug} empty={!dados.tensao}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Info label="Tensão" value={dados.tensao} />
          <Info label="Demanda Contratada" value={dados.demanda_contratada ? `${dados.demanda_contratada} kW` : undefined} />
          <Info label="Modalidade Tarifária" value={dados.modalidade_tarifaria} />
          <Info label="Concessionária" value={dados.concessionaria} />
        </div>
      </ReadSection>

      {/* ── S5: Infraestrutura ── */}
      <ReadSection title="Infraestrutura Existente" icon={Shield}
        empty={!['subestacao', 'gerador', 'spda', 'aterramento', 'solar', 'ev', 'capacitor', 'nobreak', 'diagrama', 'pie'].some(i => dados[`infra_${i}`])}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <InfraBadge label="Subestação" active={!!dados.infra_subestacao} detail={dados.infra_subestacao_tipo} />
          <InfraBadge label="Gerador" active={!!dados.infra_gerador} detail={dados.infra_gerador_pot} />
          <InfraBadge label="SPDA (Para-raios)" active={!!dados.infra_spda} detail={dados.infra_spda_manut} />
          <InfraBadge label="Aterramento" active={!!dados.infra_aterramento} detail={dados.infra_aterramento_tipo} />
          <InfraBadge label="Solar Fotovoltaico" active={!!dados.infra_solar} detail={dados.infra_solar_pot} />
          <InfraBadge label="Carregador EV" active={!!dados.infra_ev} detail={dados.infra_ev_qtd} />
          <InfraBadge label="Banco de Capacitores" active={!!dados.infra_capacitor} detail={dados.infra_capacitor_kvar} />
          <InfraBadge label="No-break / UPS" active={!!dados.infra_nobreak} detail={dados.infra_nobreak_pot} />
          <InfraBadge label="Diagrama Unifilar" active={!!dados.infra_diagrama} />
          <InfraBadge label="PIE" active={!!dados.infra_pie} detail={dados.infra_pie_ano} />
        </div>
      </ReadSection>

      {/* ── S6: Histórico ── */}
      <ReadSection title="Histórico" icon={Clock} empty={!dados.ultimo_laudo && !(dados.problemas_12m?.length)}>
        <Info label="Último Laudo" value={dados.ultimo_laudo} />
        {dados.problemas_12m?.length > 0 && (
          <div className="py-1.5">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-1">Problemas (12 meses)</p>
            <div className="flex flex-wrap gap-1.5">
              {dados.problemas_12m.map((p: string) => (
                <Badge key={p} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">{p}</Badge>
              ))}
            </div>
          </div>
        )}
        <Info label="Detalhes" value={dados.historico_detalhe} />
      </ReadSection>

      {/* ── S7: Acesso ── */}
      <ReadSection title="Acesso e Logística" icon={HardHat} empty={!dados.horario_acesso}>
        <Info label="Horário de Acesso" value={dados.horario_acesso} />
        <Info label="Necessita Parada" value={dados.necessita_parada ? `Sim${dados.parada_detalhe ? ` — ${dados.parada_detalhe}` : ''}` : 'Não'} />
        <Info label="Eletricista Local" value={dados.eletricista_local ? 'Sim' : 'Não'} />
        <Info label="EPIs" value={dados.epi} />
        <Info label="Logística" value={dados.logistica_obs} />
      </ReadSection>

      {/* ── S8: Documentos ── */}
      <ReadSection title="Documentos" icon={Paperclip}
        empty={(!Array.isArray(docs) || docs.length === 0) && docsPendentes.length === 0}
      >
        {Array.isArray(docs) && docs.length > 0 && (
          <div className="space-y-1.5 mb-2">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Anexados</p>
            {docs.map((d: any, i: number) => (
              <a key={i} href={d.url} target="_blank" rel="noopener"
                className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg text-sm hover:bg-blue-50 transition-colors group">
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                <span className="flex-1 truncate text-slate-700 group-hover:text-blue-700">{d.originalName || d.fileName}</span>
                <span className="text-xs text-slate-400 shrink-0">{d.size ? `${(d.size / 1024 / 1024).toFixed(1)}MB` : ''}</span>
                <ExternalLink className="w-3 h-3 text-slate-300 shrink-0" />
              </a>
            ))}
          </div>
        )}
        {docsPendentes.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Cliente vai enviar depois</p>
            <div className="flex flex-wrap gap-1.5">
              {docsPendentes.map(d => (
                <Badge key={d} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{d}</Badge>
              ))}
            </div>
          </div>
        )}
      </ReadSection>

      {/* ── S9: Qualificação ── */}
      <ReadSection title="Qualificação Comercial" icon={DollarSign} empty={!dados.decisor && !dados.orcamento_disponivel}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Info label="Decisor" value={dados.decisor} />
          <Info label="Aprovação" value={selectLabels.aprovacao[dados.aprovacao] || dados.aprovacao} />
          <Info label="Orçamento Disponível" value={selectLabels.orcamento_disponivel[dados.orcamento_disponivel] || dados.orcamento_disponivel} />
          <Info label="Concorrência" value={selectLabels.concorrencia[dados.concorrencia] || dados.concorrencia} />
          <Info label="Pagamento" value={dados.pagamento} />
        </div>
      </ReadSection>

      {/* ── Observações ── */}
      {dados.observacoes_livres && (
        <Card className="p-4 sm:p-5">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-1">Observações Livres</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{dados.observacoes_livres}</p>
        </Card>
      )}

      {/* ── Proposta vinculada ── */}
      {laudo.proposalId && (
        <Card className="p-4 sm:p-5 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">Proposta vinculada</p>
              <p className="text-xs text-emerald-600">ID: {laudo.proposalId.slice(0, 8)}</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs border-emerald-300 text-emerald-700"
              onClick={() => window.open(`/admin/proposals`, '_self')}>
              Ver Propostas <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* ── Botões de Ação ── */}
      {laudo.status === 'enviado_orcamento' && !laudo.proposalId && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setShowDevolver(true)}
            className="sm:flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Devolver ao Vendedor
          </Button>
          <Button
            onClick={handleCreateProposal}
            disabled={creatingProposal}
            className="sm:flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold h-11 shadow-md shadow-amber-200/50"
          >
            {creatingProposal ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
            Criar Proposta
          </Button>
        </div>
      )}

      {/* ── Dialog Devolver ── */}
      <Dialog open={showDevolver} onOpenChange={setShowDevolver}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Devolver ao Vendedor</DialogTitle>
            <DialogDescription>O atendimento voltará para status "Aberto" e o vendedor poderá ajustá-lo.</DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs">Motivo (opcional)</Label>
            <Textarea
              className="mt-1 text-sm"
              rows={3}
              placeholder="Ex: Faltam informações sobre subestação, fotos do QD..."
              value={motivoDevolucao}
              onChange={e => setMotivoDevolucao(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDevolver(false)}>Cancelar</Button>
            <Button onClick={handleDevolver} disabled={devolvendo} className="bg-amber-500 hover:bg-amber-600 text-white">
              {devolvendo ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1.5" />}
              Devolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
