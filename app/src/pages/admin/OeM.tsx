import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { api } from '@/api';
import {
  LayoutDashboard, Sun, Building2, FileSignature, Plus, Pencil, Trash2,
  RefreshCw, Zap, Download, Calculator, Wrench, ClipboardCheck, TrendingUp,
  AlertTriangle, Clock,
} from 'lucide-react';
import OeMServicos from './OeM_Servicos';
import PlanoWizardDialog from './PlanoWizardDialog';
import {
  emptyUsina, emptyContrato, fmt,
  TIPO_LABELS, TIPO_ICONS, STATUS_COLORS, STATUS_LABELS,
} from './OeM_handlers';

export default function OeM() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [usinas, setUsinas] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [solarProjects, setSolarProjects] = useState<any[]>([]);

  const [usinaDialogOpen, setUsinaDialogOpen] = useState(false);
  const [planoDialogOpen, setPlanoDialogOpen] = useState(false);
  const [planoEditData, setPlanoEditData] = useState<any>(null);
  const [contratoDialogOpen, setContratoDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [usinaForm, setUsinaForm] = useState<any>({ ...emptyUsina });
  const [contratoForm, setContratoForm] = useState<any>({ ...emptyContrato });
  const [priceCalc, setPriceCalc] = useState<any>(null);

  const loadAll = async () => {
    try {
      const [d, u, p, c, sv, cl] = await Promise.all([
        api.getOemDashboard(), api.getOemUsinas(), api.getOemPlanos(),
        api.getOemContratos(), api.getOemServicos(), api.getClients(),
      ]);
      setDashboard(d); setUsinas(u); setPlanos(p); setContratos(c); setServicos(sv); setClients(cl);
      try { const sp = await api.getSolarProjects(); setSolarProjects(sp); } catch { /* ok */ }
    } catch (err) { console.error('OeM load error:', err); }
  };

  useEffect(() => { loadAll(); }, []);

  // ═══ USINA HANDLERS ════════════════════════════════════════════
  const handleSaveUsina = async () => {
    if (!usinaForm.clienteId) { toast.error('Selecione um cliente'); return; }
    if (!usinaForm.nome?.trim()) { toast.error('Informe o nome'); return; }
    if (!usinaForm.potenciaKwp) { toast.error('Informe a potência'); return; }
    if (!usinaForm.qtdModulos) { toast.error('Informe qtd módulos'); return; }
    if (!usinaForm.endereco?.trim()) { toast.error('Informe o endereço'); return; }
    try {
      const data = { ...usinaForm };
      if (!data.empresaId) data.empresaId = null;
      if (!data.geracaoMensalEsperadaKwh) data.geracaoMensalEsperadaKwh = null;
      if (!data.valorEstimadoUsina) data.valorEstimadoUsina = null;
      if (!data.percentualManutencao) data.percentualManutencao = 10;
      if (editingId) { await api.updateOemUsina(editingId, data); toast.success('Usina atualizada'); }
      else { await api.createOemUsina(data); toast.success('Usina criada'); }
      setUsinaDialogOpen(false); setEditingId(null); setUsinaForm({ ...emptyUsina }); loadAll();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erro ao salvar usina'); }
  };
  const handleEditUsina = (u: any) => { setEditingId(u.id); setUsinaForm({ nome: u.nome || '', potenciaKwp: String(u.potenciaKwp || ''), qtdModulos: String(u.qtdModulos || ''), modeloModulos: u.modeloModulos || '', qtdInversores: String(u.qtdInversores || 1), modeloInversores: u.modeloInversores || '', marcaInversor: u.marcaInversor || '', dataInstalacao: u.dataInstalacao?.split('T')[0] || '', tipoTelhado: u.tipoTelhado || '', endereco: u.endereco || '', geracaoMensalEsperadaKwh: String(u.geracaoMensalEsperadaKwh || ''), clienteId: u.clienteId || '', empresaId: u.empresaId || '', status: u.status || 'ativa', valorEstimadoUsina: String(u.valorEstimadoUsina || ''), percentualManutencao: String(u.percentualManutencao || 10), observacoes: u.observacoes || '' }); setUsinaDialogOpen(true); };
  const handleDeleteUsina = async (id: string) => { if (!confirm('Excluir usina?')) return; try { await api.deleteOemUsina(id); toast.success('Excluída'); loadAll(); } catch { toast.error('Erro'); } };
  const handleImportFromSolar = async (pid: string) => { try { await api.importOemUsinaFromSolar(pid); toast.success('Usina importada!'); setImportDialogOpen(false); loadAll(); } catch { toast.error('Erro ao importar'); } };

  // ═══ PLANO HANDLERS ════════════════════════════════════════════
  const handleEditPlano = (p: any) => {
    setEditingId(p.id);
    setPlanoEditData({
      nome: p.nome || '', descricao: p.descricao || '', tipoPlano: p.tipoPlano || 'standard',
      incluiLimpeza: p.incluiLimpeza ?? true, incluiInspecaoVisual: p.incluiInspecaoVisual ?? true,
      incluiTermografia: p.incluiTermografia ?? false, incluiTesteString: p.incluiTesteString ?? false,
      incluiMonitoramentoRemoto: p.incluiMonitoramentoRemoto ?? false, incluiCorretivaPrioritaria: p.incluiCorretivaPrioritaria ?? false,
      incluiSeguro: p.incluiSeguro ?? false, incluiRelatorio: p.incluiRelatorio ?? true,
      garantiaPerformancePr: String(p.garantiaPerformancePr || ''),
      frequenciaPreventiva: p.frequenciaPreventiva || 'semestral', frequenciaRelatorio: p.frequenciaRelatorio || 'trimestral',
      precoBaseMensal: String(p.precoBaseMensal || ''), kwpLimiteBase: String(p.kwpLimiteBase || 10),
      precoKwpExcedente: String(p.precoKwpExcedente || ''), unidadeCobranca: p.unidadeCobranca || 'kWp',
      custoMobilizacao: String(p.custoMobilizacao || 0),
      tempoRespostaSlaHoras: String(p.tempoRespostaSlaHoras || 48), tempoRespostaUrgenteHoras: String(p.tempoRespostaUrgenteHoras || 4),
      atendimentoHorario: p.atendimentoHorario || 'comercial',
      coberturaMaxAnual: String(p.coberturaMaxAnual || ''), limiteCorretivas: String(p.limiteCorretivas || ''),
      abrangenciaKm: String(p.abrangenciaKm || ''), termosDuracaoMeses: String(p.termosDuracaoMeses || 12),
      descontoAnualPercent: String(p.descontoAnualPercent || 0), exclusoes: p.exclusoes || '',
      penalidades: p.penalidades || '', beneficios: p.beneficios || '', ativo: p.ativo ?? true,
    });
    setPlanoDialogOpen(true);
  };
  const handleDeletePlano = async (id: string) => { if (!confirm('Excluir plano?')) return; try { await api.deleteOemPlano(id); toast.success('Excluído'); loadAll(); } catch { toast.error('Erro'); } };

  // ═══ CONTRATO HANDLERS ═════════════════════════════════════════
  const handleSaveContrato = async () => {
    try {
      const data = { ...contratoForm };
      if (!data.clienteId) data.clienteId = null;
      if (!data.usinaId) data.usinaId = null;
      if (!data.planoId) data.planoId = null;
      if (!data.dataFim) data.dataFim = null;
      if (editingId) { await api.updateOemContrato(editingId, data); toast.success('Contrato atualizado'); }
      else { await api.createOemContrato(data); toast.success('Contrato criado'); }
      setContratoDialogOpen(false); setEditingId(null); setContratoForm({ ...emptyContrato }); setPriceCalc(null); loadAll();
    } catch { toast.error('Erro ao salvar contrato'); }
  };
  const handleEditContrato = (c: any) => { setEditingId(c.id); setContratoForm({ clienteId: c.clienteId || '', usinaId: c.usinaId || '', planoId: c.planoId || '', dataInicio: c.dataInicio?.split('T')[0] || '', dataFim: c.dataFim?.split('T')[0] || '', valorMensal: String(c.valorMensal || ''), indiceReajuste: c.indiceReajuste || 'IGPM', renovacaoAutomatica: c.renovacaoAutomatica ?? true, status: c.status || 'ativo', observacoes: c.observacoes || '' }); setContratoDialogOpen(true); };
  const handleDeleteContrato = async (id: string) => { if (!confirm('Excluir contrato?')) return; try { await api.deleteOemContrato(id); toast.success('Excluído'); loadAll(); } catch { toast.error('Erro'); } };
  const handleCalcPrice = async () => {
    if (!contratoForm.usinaId || !contratoForm.planoId) { toast.warning('Selecione usina e plano'); return; }
    try { const calc = await api.calculateOemPrice(contratoForm.usinaId, contratoForm.planoId); setPriceCalc(calc); setContratoForm((p: any) => ({ ...p, valorMensal: String(calc.valorMensal) })); toast.success('Preço calculado!'); } catch { toast.error('Erro'); }
  };
  const handleGerarPropostaContrato = async (id: string) => {
    try { const r = await api.gerarPropostaContrato(id); toast.success(`Proposta ${r.proposalNumber} gerada!`); loadAll(); } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); }
  };

  const getClientName = (id: string) => { const c = clients.find((c: any) => c.id === id); return c?.name || c?.razaoSocial || '—'; };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Sun className="w-7 h-7 text-amber-500" /> O&M Solar</h1>
          <p className="text-slate-500 text-sm">Operação e Manutenção de Usinas Fotovoltaicas</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll}><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="dashboard" className="gap-1"><LayoutDashboard className="w-4 h-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="usinas" className="gap-1"><Sun className="w-4 h-4" /> Usinas</TabsTrigger>
          <TabsTrigger value="servicos" className="gap-1"><Wrench className="w-4 h-4" /> Serviços</TabsTrigger>
          <TabsTrigger value="planos" className="gap-1"><Building2 className="w-4 h-4" /> Planos</TabsTrigger>
          <TabsTrigger value="contratos" className="gap-1"><FileSignature className="w-4 h-4" /> Contratos</TabsTrigger>
        </TabsList>

        {/* ═══ DASHBOARD ═══ */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"><CardContent className="pt-6"><p className="text-sm text-green-600 font-medium">Contratos Ativos</p><p className="text-3xl font-bold text-green-800">{dashboard?.contratosAtivos || 0}</p></CardContent></Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"><CardContent className="pt-6"><p className="text-sm text-amber-600 font-medium">MRR (Receita Mensal)</p><p className="text-3xl font-bold text-amber-800">{fmt(dashboard?.mrr)}</p></CardContent></Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"><CardContent className="pt-6"><p className="text-sm text-blue-600 font-medium">Usinas Gerenciadas</p><p className="text-3xl font-bold text-blue-800">{dashboard?.totalUsinas || 0}</p></CardContent></Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"><CardContent className="pt-6"><p className="text-sm text-purple-600 font-medium">kWp Total</p><p className="text-3xl font-bold text-purple-800">{Number(dashboard?.totalKwpGerenciado || 0).toFixed(1)}</p></CardContent></Card>
          </div>
          {/* Serviços KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-yellow-200"><CardContent className="pt-6 flex items-center gap-3"><Clock className="w-8 h-8 text-yellow-500" /><div><p className="text-xs text-slate-500">Pendentes</p><p className="text-2xl font-bold text-yellow-700">{dashboard?.servicosPendentes || 0}</p></div></CardContent></Card>
            <Card className="border-orange-200"><CardContent className="pt-6 flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-orange-500" /><div><p className="text-xs text-slate-500">Em Andamento</p><p className="text-2xl font-bold text-orange-700">{dashboard?.servicosEmAndamento || 0}</p></div></CardContent></Card>
            <Card className="border-green-200"><CardContent className="pt-6 flex items-center gap-3"><ClipboardCheck className="w-8 h-8 text-green-500" /><div><p className="text-xs text-slate-500">Concluídos</p><p className="text-2xl font-bold text-green-700">{dashboard?.servicosConcluidos || 0}</p></div></CardContent></Card>
            <Card className="border-emerald-200"><CardContent className="pt-6 flex items-center gap-3"><TrendingUp className="w-8 h-8 text-emerald-500" /><div><p className="text-xs text-slate-500">Receita Serviços</p><p className="text-2xl font-bold text-emerald-700">{fmt(dashboard?.receitaServicos)}</p></div></CardContent></Card>
          </div>
          {/* Tipo breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {['preventiva', 'preditiva', 'corretiva'].map(t => (
              <Card key={t}><CardContent className="pt-6 text-center"><p className="text-2xl mb-1">{TIPO_ICONS[t]}</p><p className="text-xl font-bold">{dashboard?.servicosPorTipo?.[t] || 0}</p><p className="text-xs text-slate-500">{TIPO_LABELS[t]}</p></CardContent></Card>
            ))}
          </div>
          <Card><CardHeader><CardTitle className="text-lg">ARR (Receita Anual Recorrente)</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold text-slate-900">{fmt(dashboard?.arr)}</p><p className="text-sm text-slate-500 mt-1">Baseado em {dashboard?.contratosAtivos || 0} contratos ativos</p></CardContent></Card>
          {/* Serviços recentes */}
          {dashboard?.servicosRecentes?.length > 0 && (
            <Card><CardHeader><CardTitle className="text-lg">Serviços Recentes</CardTitle></CardHeader><CardContent className="space-y-2">
              {dashboard.servicosRecentes.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2"><span>{TIPO_ICONS[s.tipo]}</span><span className="text-sm font-medium">{s.usina?.nome || '—'}</span><Badge className={STATUS_COLORS[s.status] + ' text-xs'}>{STATUS_LABELS[s.status]}</Badge></div>
                  <span className="text-sm text-slate-500">{s.createdAt?.split('T')[0]}</span>
                </div>
              ))}
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ═══ USINAS ═══ */}
        <TabsContent value="usinas" className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={() => { setEditingId(null); setUsinaForm({ ...emptyUsina }); setUsinaDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Nova Usina</Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}><Download className="w-4 h-4 mr-1" /> Importar do Solar</Button>
          </div>
          <div className="grid gap-4">
            {usinas.length === 0 && <p className="text-slate-400 text-center py-8">Nenhuma usina cadastrada</p>}
            {usinas.map((u: any) => (
              <Card key={u.id} className="hover:shadow-md transition-shadow"><CardContent className="py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-slate-900">{u.nome}</span><Badge variant={u.status === 'ativa' ? 'default' : 'secondary'} className={u.status === 'ativa' ? 'bg-green-100 text-green-700 border-green-200' : ''}>{u.status}</Badge></div>
                  <div className="flex items-center gap-4 text-sm text-slate-500"><span><Zap className="w-3.5 h-3.5 inline mr-1" />{Number(u.potenciaKwp || 0).toFixed(1)} kWp</span><span>{u.qtdModulos} módulos</span><span>{u.qtdInversores} inversor(es)</span><span className="truncate max-w-xs">{u.endereco}</span></div>
                  <p className="text-xs text-slate-400 mt-1">Cliente: {u.cliente?.name || u.cliente?.razaoSocial || getClientName(u.clienteId)}</p>
                </div>
                <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEditUsina(u)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteUsina(u.id)}><Trash2 className="w-4 h-4" /></Button></div>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ SERVIÇOS ═══ */}
        <TabsContent value="servicos">
          <OeMServicos servicos={servicos} usinas={usinas} clients={clients} onReload={loadAll} />
        </TabsContent>

        {/* ═══ PLANOS ═══ */}
        <TabsContent value="planos" className="space-y-4">
          <Button onClick={() => { setEditingId(null); setPlanoEditData(null); setPlanoDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Novo Plano</Button>
          <div className="grid md:grid-cols-3 gap-4">
            {planos.length === 0 && <p className="text-slate-400 text-center py-8 col-span-3">Nenhum plano cadastrado</p>}
            {planos.map((p: any) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-lg">{p.nome}</CardTitle><Badge variant={p.ativo ? 'default' : 'secondary'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge></div><p className="text-sm text-slate-500">{p.descricao}</p></CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-amber-600">{fmt(p.precoBaseMensal)}<span className="text-sm font-normal text-slate-400">/mês</span></div>
                  <p className="text-xs text-slate-500">Até {p.kwpLimiteBase} kWp • Excedente: {fmt(p.precoKwpExcedente || 0)}/kWp</p>
                  <div className="flex flex-wrap gap-1">
                    {p.incluiLimpeza && <Badge variant="outline" className="text-xs">Limpeza</Badge>}
                    {p.incluiInspecaoVisual && <Badge variant="outline" className="text-xs">Inspeção</Badge>}
                    {p.incluiTermografia && <Badge variant="outline" className="text-xs bg-orange-50">Termografia</Badge>}
                    {p.incluiTesteString && <Badge variant="outline" className="text-xs bg-blue-50">Teste String</Badge>}
                    {p.incluiMonitoramentoRemoto && <Badge variant="outline" className="text-xs bg-green-50">Monitoramento</Badge>}
                    {p.incluiCorretivaPrioritaria && <Badge variant="outline" className="text-xs bg-red-50">Corretiva Prior.</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">Frequência: {p.frequenciaPreventiva} • Mobilização: {fmt(p.custoMobilizacao)}</p>
                  <div className="flex gap-1 pt-2 border-t"><Button variant="ghost" size="sm" onClick={() => handleEditPlano(p)}><Pencil className="w-3 h-3 mr-1" /> Editar</Button><Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeletePlano(p.id)}><Trash2 className="w-3 h-3 mr-1" /> Excluir</Button></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ CONTRATOS ═══ */}
        <TabsContent value="contratos" className="space-y-4">
          <Button onClick={() => { setEditingId(null); setContratoForm({ ...emptyContrato }); setPriceCalc(null); setContratoDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Novo Contrato</Button>
          <div className="grid gap-4">
            {contratos.length === 0 && <p className="text-slate-400 text-center py-8">Nenhum contrato O&M cadastrado</p>}
            {contratos.map((c: any) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow"><CardContent className="py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-slate-900">{c.usina?.nome || '—'}</span><Badge variant={c.status === 'ativo' ? 'default' : 'secondary'} className={c.status === 'ativo' ? 'bg-green-100 text-green-700' : ''}>{c.status}</Badge><Badge variant="outline">{c.plano?.nome || '—'}</Badge></div>
                  <div className="flex items-center gap-4 text-sm text-slate-500"><span>Cliente: {c.cliente?.name || c.cliente?.razaoSocial || '—'}</span><span>Início: {c.dataInicio?.split('T')[0]}</span><span>Reajuste: {c.indiceReajuste || '—'}</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right"><p className="text-lg font-bold text-amber-600">{fmt(c.valorMensal)}</p><p className="text-xs text-slate-400">/mês</p></div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" title="Gerar Proposta" onClick={() => handleGerarPropostaContrato(c.id)}><FileSignature className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditContrato(c)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteContrato(c.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ USINA DIALOG ═══ */}
      <Dialog open={usinaDialogOpen} onOpenChange={(o) => { if (!o) { setUsinaDialogOpen(false); setEditingId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Usina' : 'Nova Usina'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1"><Label>Nome da Usina *</Label><Input value={usinaForm.nome} onChange={e => setUsinaForm({ ...usinaForm, nome: e.target.value })} placeholder="Usina Residencial — Sr. João" /></div>
              <div className="space-y-1"><Label>Cliente *</Label><Select value={usinaForm.clienteId} onValueChange={v => setUsinaForm({ ...usinaForm, clienteId: v })}><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name || c.razaoSocial}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Status</Label><Select value={usinaForm.status} onValueChange={v => setUsinaForm({ ...usinaForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ativa">Ativa</SelectItem><SelectItem value="inativa">Inativa</SelectItem><SelectItem value="descomissionada">Descomissionada</SelectItem></SelectContent></Select></div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
              <h3 className="font-semibold text-amber-800 text-sm">⚡ Dados Técnicos</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-sm">Potência (kWp) *</Label><Input value={usinaForm.potenciaKwp} onChange={e => setUsinaForm({ ...usinaForm, potenciaKwp: e.target.value })} type="number" step="0.01" /></div>
                <div className="space-y-1"><Label className="text-sm">Qtd Módulos *</Label><Input value={usinaForm.qtdModulos} onChange={e => setUsinaForm({ ...usinaForm, qtdModulos: e.target.value })} type="number" /></div>
                <div className="space-y-1"><Label className="text-sm">Modelo Módulos</Label><Input value={usinaForm.modeloModulos} onChange={e => setUsinaForm({ ...usinaForm, modeloModulos: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-sm">Qtd Inversores</Label><Input value={usinaForm.qtdInversores} onChange={e => setUsinaForm({ ...usinaForm, qtdInversores: e.target.value })} type="number" /></div>
                <div className="space-y-1"><Label className="text-sm">Modelo Inversores</Label><Input value={usinaForm.modeloInversores} onChange={e => setUsinaForm({ ...usinaForm, modeloInversores: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-sm">Marca Inversor</Label><Input value={usinaForm.marcaInversor} onChange={e => setUsinaForm({ ...usinaForm, marcaInversor: e.target.value })} placeholder="Growatt, Sungrow..." /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Data Instalação *</Label><Input type="date" value={usinaForm.dataInstalacao} onChange={e => setUsinaForm({ ...usinaForm, dataInstalacao: e.target.value })} /></div>
              <div className="space-y-1"><Label>Tipo Telhado</Label><Input value={usinaForm.tipoTelhado} onChange={e => setUsinaForm({ ...usinaForm, tipoTelhado: e.target.value })} placeholder="Cerâmico, metálico..." /></div>
              <div className="col-span-2 space-y-1"><Label>Endereço *</Label><Input value={usinaForm.endereco} onChange={e => setUsinaForm({ ...usinaForm, endereco: e.target.value })} /></div>
              <div className="space-y-1"><Label>Geração Mensal (kWh)</Label><Input value={usinaForm.geracaoMensalEsperadaKwh} onChange={e => setUsinaForm({ ...usinaForm, geracaoMensalEsperadaKwh: e.target.value })} type="number" /></div>
            </div>
            {/* ── PRECIFICAÇÃO DA USINA ── */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-3">
              <h3 className="font-semibold text-green-800 text-sm">💰 Precificação (uso interno)</h3>
              <p className="text-xs text-green-600">Estes valores são usados para calcular automaticamente os custos de manutenção ao criar serviços para esta usina.</p>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-sm">Valor Estimado da Usina (R$)</Label>
                  <Input value={usinaForm.valorEstimadoUsina} onChange={e => setUsinaForm({ ...usinaForm, valorEstimadoUsina: e.target.value })} type="number" step="0.01" placeholder="Ex: 100000" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">% Manutenção</Label>
                  <div className="relative">
                    <Input value={usinaForm.percentualManutencao} onChange={e => setUsinaForm({ ...usinaForm, percentualManutencao: e.target.value })} type="number" step="0.1" className="pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                  </div>
                </div>
                <div className="bg-white border border-green-300 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-green-600 font-medium uppercase tracking-wider">Base Manutenção</p>
                  <p className="text-lg font-bold text-green-700">
                    {Number(usinaForm.valorEstimadoUsina || 0) > 0
                      ? fmt(Number(usinaForm.valorEstimadoUsina) * (Number(usinaForm.percentualManutencao || 10) / 100))
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-1"><Label>Observações</Label><Textarea value={usinaForm.observacoes} onChange={e => setUsinaForm({ ...usinaForm, observacoes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveUsina}>Salvar Usina</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ IMPORT SOLAR ═══ */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Importar Usina do Módulo Solar</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {solarProjects.length === 0 && <p className="text-slate-400 text-center py-4">Nenhum projeto solar encontrado</p>}
            {solarProjects.map((sp: any) => (
              <div key={sp.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer" onClick={() => handleImportFromSolar(sp.id)}>
                <div><p className="font-medium">{sp.title || sp.code}</p><p className="text-sm text-slate-500">{Number(sp.systemPowerKwp || 0).toFixed(1)} kWp • {sp.moduleCount || 0} módulos</p></div>
                <Badge variant="outline">{sp.status}</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ PLANO WIZARD DIALOG ═══ */}
      <PlanoWizardDialog
        open={planoDialogOpen}
        onOpenChange={(o) => { setPlanoDialogOpen(o); if (!o) { setEditingId(null); setPlanoEditData(null); } }}
        editingId={editingId}
        initialData={planoEditData}
        onSaved={loadAll}
      />

      {/* ═══ CONTRATO DIALOG ═══ */}
      <Dialog open={contratoDialogOpen} onOpenChange={(o) => { if (!o) { setContratoDialogOpen(false); setEditingId(null); setPriceCalc(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Contrato O&M' : 'Novo Contrato O&M'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Cliente *</Label><Select value={contratoForm.clienteId} onValueChange={v => setContratoForm({ ...contratoForm, clienteId: v })}><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name || c.razaoSocial}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Usina *</Label><Select value={contratoForm.usinaId} onValueChange={v => setContratoForm({ ...contratoForm, usinaId: v })}><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent>{usinas.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.nome} ({Number(u.potenciaKwp).toFixed(1)} kWp)</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Plano *</Label><Select value={contratoForm.planoId} onValueChange={v => setContratoForm({ ...contratoForm, planoId: v })}><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent>{planos.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome} — {fmt(p.precoBaseMensal)}/mês</SelectItem>)}</SelectContent></Select></div>
              <div className="flex items-end"><Button variant="outline" className="w-full" onClick={handleCalcPrice}><Calculator className="w-4 h-4 mr-1" /> Calcular Preço</Button></div>
            </div>
            {priceCalc && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <h3 className="text-sm font-semibold text-green-800">📊 Detalhamento</h3>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-slate-600">Preço base:</span><span className="font-medium">{fmt(priceCalc.precoBase)}</span>
                  <span className="text-slate-600">kWp excedente:</span><span>{priceCalc.kwpExcedente} × {fmt(priceCalc.precoExcedente)}</span>
                  <span className="text-slate-600">Mobilização ({priceCalc.frequencia}):</span><span>{fmt(priceCalc.custoMobilizacao)} × {priceCalc.frequenciaAnual}/ano</span>
                  <span className="text-green-800 font-bold text-lg col-span-2 text-center pt-1 border-t">Valor mensal: {fmt(priceCalc.valorMensal)}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Data Início *</Label><Input type="date" value={contratoForm.dataInicio} onChange={e => setContratoForm({ ...contratoForm, dataInicio: e.target.value })} /></div>
              <div className="space-y-1"><Label>Data Fim (opcional)</Label><Input type="date" value={contratoForm.dataFim} onChange={e => setContratoForm({ ...contratoForm, dataFim: e.target.value })} /></div>
              <div className="space-y-1"><Label>Valor Mensal *</Label><Input value={contratoForm.valorMensal} onChange={e => setContratoForm({ ...contratoForm, valorMensal: e.target.value })} type="number" step="0.01" /></div>
              <div className="space-y-1"><Label>Índice Reajuste</Label><Select value={contratoForm.indiceReajuste} onValueChange={v => setContratoForm({ ...contratoForm, indiceReajuste: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="IGPM">IGPM</SelectItem><SelectItem value="IPCA">IPCA</SelectItem><SelectItem value="fixo">Fixo</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Status</Label><Select value={contratoForm.status} onValueChange={v => setContratoForm({ ...contratoForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="suspenso">Suspenso</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem><SelectItem value="encerrado">Encerrado</SelectItem></SelectContent></Select></div>
              <div className="flex items-center gap-2 pt-5"><Switch checked={contratoForm.renovacaoAutomatica} onCheckedChange={v => setContratoForm({ ...contratoForm, renovacaoAutomatica: v })} /><Label className="text-sm">Renovação Automática</Label></div>
            </div>
            <div className="space-y-1"><Label>Observações</Label><Textarea value={contratoForm.observacoes} onChange={e => setContratoForm({ ...contratoForm, observacoes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveContrato}>Salvar Contrato</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
