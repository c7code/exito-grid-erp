import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/api';
import {
  Sun, FileText, Plus, Pencil, Trash2, RefreshCw, Upload,
  AlertTriangle, CheckCircle2, Loader2,
  BarChart3, Zap, DollarSign, Activity, Calendar, Search,
  FileSpreadsheet, ArrowRight, Send,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  bom: { label: 'Bom', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  atencao: { label: 'Atenção', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertTriangle },
  critico: { label: 'Crítico', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
};

const REPORT_STATUS: Record<string, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600' },
  revisao: { label: 'Em Revisão', color: 'bg-blue-100 text-blue-700' },
  publicado: { label: 'Publicado', color: 'bg-emerald-100 text-emerald-700' },
  enviado: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
};

const fmt = (n: number) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCurrency = (n: number) => `R$ ${fmt(n)}`;

export default function SolarReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [usinas, setUsinas] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [filterUsina, setFilterUsina] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [form, setForm] = useState<any>({
    usinaId: '',
    mesReferencia: new Date().toISOString().slice(0, 7) + '-01',
    tipoPeriodo: 'mensal',
    geracaoRealKwh: '',
    consumoConcessionariaKwh: '',
    energiaInjetadaKwh: '',
    creditosAcumuladosKwh: '',
    valorContaRs: '',
    numeroUC: '',
    observacoesTecnicas: '',
    resumoCustomizado: '',
  });

  const [csvUploading, setCsvUploading] = useState(false);
  const [billUploading, setBillUploading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, u, c] = await Promise.all([
        api.getSolarReports({ usinaId: filterUsina || undefined, status: filterStatus || undefined }),
        api.getOemUsinas(),
        api.getClients(),
      ]);
      setReports(r);
      setUsinas(u);
      setClients(c);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [filterUsina, filterStatus]);

  const openNewDialog = () => {
    setEditingReport(null);
    setForm({
      usinaId: '',
      mesReferencia: new Date().toISOString().slice(0, 7) + '-01',
      tipoPeriodo: 'mensal',
      geracaoRealKwh: '',
      consumoConcessionariaKwh: '',
      energiaInjetadaKwh: '',
      creditosAcumuladosKwh: '',
      valorContaRs: '',
      numeroUC: '',
      observacoesTecnicas: '',
      resumoCustomizado: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (report: any) => {
    setEditingReport(report);
    setForm({
      usinaId: report.usinaId || '',
      mesReferencia: report.mesReferencia ? String(report.mesReferencia).split('T')[0] : '',
      tipoPeriodo: report.tipoPeriodo || 'mensal',
      geracaoRealKwh: report.geracaoRealKwh || '',
      consumoConcessionariaKwh: report.consumoConcessionariaKwh || '',
      energiaInjetadaKwh: report.energiaInjetadaKwh || '',
      creditosAcumuladosKwh: report.creditosAcumuladosKwh || '',
      valorContaRs: report.valorContaRs || '',
      numeroUC: report.numeroUC || '',
      observacoesTecnicas: report.observacoesTecnicas || '',
      resumoCustomizado: report.resumoCustomizado || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.usinaId || !form.mesReferencia) {
      toast.error('Selecione a usina e o mês de referência');
      return;
    }
    try {
      if (editingReport) {
        await api.updateSolarReport(editingReport.id, form);
        toast.success('Relatório atualizado');
      } else {
        await api.createSolarReport(form);
        toast.success('Relatório criado com sucesso');
      }
      setDialogOpen(false);
      loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao salvar relatório');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este relatório?')) return;
    try {
      await api.deleteSolarReport(id);
      toast.success('Relatório excluído');
      loadAll();
    } catch { toast.error('Erro ao excluir'); }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.publishSolarReport(id);
      toast.success('Relatório publicado!');
      loadAll();
    } catch { toast.error('Erro ao publicar'); }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingReport) return;
    setCsvUploading(true);
    try {
      const updated = await api.parseSolarReportGeneration(editingReport.id, file);
      setEditingReport(updated);
      setForm((f: any) => ({ ...f, geracaoRealKwh: updated.geracaoRealKwh || f.geracaoRealKwh }));
      toast.success(`Geração extraída: ${fmt(updated.geracaoRealKwh)} kWh`);
      loadAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao processar CSV');
    }
    setCsvUploading(false);
  };

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingReport) return;
    setBillUploading(true);
    try {
      const result = await api.parseSolarReportBill(editingReport.id, file);
      setEditingReport(result.report);
      const pr = result.parseResult;
      setForm((f: any) => ({
        ...f,
        consumoConcessionariaKwh: pr.consumoKwh || f.consumoConcessionariaKwh,
        energiaInjetadaKwh: pr.injetadaKwh || f.energiaInjetadaKwh,
        creditosAcumuladosKwh: pr.creditosKwh || f.creditosAcumuladosKwh,
        valorContaRs: pr.valorContaRs || f.valorContaRs,
        numeroUC: pr.numeroUC || f.numeroUC,
      }));
      toast.success(`Conta processada (${pr.concessionaria || 'genérica'}) — confiança: ${pr.confidence}%`);
      loadAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao processar PDF da conta');
    }
    setBillUploading(false);
  };

  // KPI Cards
  const totalReports = reports.length;
  const bom = reports.filter(r => r.statusDesempenho === 'bom').length;
  const atencao = reports.filter(r => r.statusDesempenho === 'atencao').length;
  const critico = reports.filter(r => r.statusDesempenho === 'critico').length;

  const filtered = reports.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (r.usina?.nome || '').toLowerCase().includes(term) ||
           (r.cliente?.name || '').toLowerCase().includes(term);
  });

  const selectedUsina = usinas.find((u: any) => u.id === form.usinaId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatórios Mensais Solar</h1>
            <p className="text-sm text-slate-500">Acompanhamento automatizado da geração e performance</p>
          </div>
        </div>
        <Button onClick={openNewDialog} className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Novo Relatório
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-slate-500 font-medium">Total Relatórios</p><p className="text-xl font-bold text-slate-800">{totalReports}</p></div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500 font-medium">Bom Desempenho</p><p className="text-xl font-bold text-emerald-700">{bom}</p></div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500 font-medium">Atenção</p><p className="text-xl font-bold text-amber-700">{atencao}</p></div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-xs text-slate-500 font-medium">Crítico</p><p className="text-xl font-bold text-red-700">{critico}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por usina ou cliente..." className="pl-9" />
        </div>
        <Select value={filterUsina} onValueChange={setFilterUsina}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Todas as usinas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {usinas.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="publicado">Publicado</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadAll}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum relatório encontrado</p>
          <p className="text-sm">Clique em "Novo Relatório" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => {
            const perf = STATUS_MAP[r.statusDesempenho] || null;
            const rs = REPORT_STATUS[r.status] || REPORT_STATUS.rascunho;
            const mesLabel = r.mesReferencia ? new Date(r.mesReferencia + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—';
            return (
              <Card key={r.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${perf ? (r.statusDesempenho === 'bom' ? 'bg-emerald-100' : r.statusDesempenho === 'atencao' ? 'bg-amber-100' : 'bg-red-100') : 'bg-slate-100'}`}>
                      {perf ? <perf.icon className={`w-6 h-6 ${r.statusDesempenho === 'bom' ? 'text-emerald-600' : r.statusDesempenho === 'atencao' ? 'text-amber-600' : 'text-red-600'}`} /> : <Sun className="w-6 h-6 text-slate-400" />}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-slate-800 truncate">{r.usina?.nome || 'Usina'}</h3>
                        <Badge className={rs.color} variant="outline">{rs.label}</Badge>
                        {perf && <Badge className={perf.color} variant="outline">{perf.label}</Badge>}
                      </div>
                      <p className="text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5 inline mr-1" />{mesLabel}
                        <span className="mx-2">•</span>
                        {r.cliente?.name || 'Cliente'}
                      </p>
                    </div>
                    {/* Metrics */}
                    <div className="flex items-center gap-6 shrink-0">
                      {Number(r.geracaoRealKwh) > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-slate-400 font-medium">Geração</p>
                          <p className="text-sm font-bold text-slate-800">{fmt(r.geracaoRealKwh)} kWh</p>
                        </div>
                      )}
                      {r.performanceRatio && (
                        <div className="text-center">
                          <p className="text-xs text-slate-400 font-medium">PR</p>
                          <p className={`text-sm font-bold ${Number(r.performanceRatio) >= 90 ? 'text-emerald-600' : Number(r.performanceRatio) >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{Number(r.performanceRatio).toFixed(1)}%</p>
                        </div>
                      )}
                      {Number(r.economiaGeradaRs) > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-slate-400 font-medium">Economia</p>
                          <p className="text-sm font-bold text-emerald-600">{fmtCurrency(r.economiaGeradaRs)}</p>
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(r)} title="Editar"><Pencil className="w-4 h-4" /></Button>
                      {r.status === 'rascunho' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handlePublish(r.id)} title="Publicar"><Send className="w-4 h-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(r.id)} title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ DIALOG ═══ */}
      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) { setDialogOpen(false); setEditingReport(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><BarChart3 className="w-7 h-7" /></div>
              <div>
                <DialogTitle className="text-xl font-bold">{editingReport ? 'Editar Relatório' : 'Novo Relatório Mensal'}</DialogTitle>
                <DialogDescription className="text-amber-100">Preencha os dados ou faça upload dos documentos para extração automática</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-slate-50">
            {/* Seção 1: Identificação */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2"><Sun className="w-4 h-4" /> Identificação</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Usina *</Label>
                  <Select value={form.usinaId} onValueChange={v => setForm({ ...form, usinaId: v })}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecionar usina" /></SelectTrigger>
                    <SelectContent>{usinas.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.nome} ({Number(u.potenciaKwp).toFixed(1)} kWp)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Mês Referência *</Label>
                  <Input type="month" value={form.mesReferencia?.slice(0, 7)} onChange={e => setForm({ ...form, mesReferencia: e.target.value + '-01' })} className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Período</Label>
                  <Select value={form.tipoPeriodo} onValueChange={v => setForm({ ...form, tipoPeriodo: v })}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedUsina && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-bold mb-1">📋 Dados automáticos da usina</p>
                  <p>{selectedUsina.nome} • {Number(selectedUsina.potenciaKwp).toFixed(1)} kWp • {selectedUsina.qtdModulos} módulos • Geração esperada: {fmt(selectedUsina.geracaoMensalEsperadaKwh || 0)} kWh/mês</p>
                </div>
              )}
            </div>

            {/* Seção 2: Geração (upload CSV ou manual) */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2"><Zap className="w-4 h-4" /> Dados de Geração</h3>
              {editingReport && (
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${csvUploading ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50'}`}>
                      <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} disabled={csvUploading} />
                      {csvUploading ? <Loader2 className="w-6 h-6 mx-auto mb-1 animate-spin text-emerald-500" /> : <FileSpreadsheet className="w-6 h-6 mx-auto mb-1 text-emerald-500" />}
                      <p className="text-xs font-bold text-slate-600">Upload CSV do Inversor</p>
                      <p className="text-[10px] text-slate-400">Growatt, Sungrow, Fronius, etc.</p>
                    </div>
                  </label>
                  <div className="flex items-center"><ArrowRight className="w-4 h-4 text-slate-300" /></div>
                  <div className="flex-1 bg-white rounded-lg border p-4 text-center">
                    <Zap className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                    <p className="text-xs font-bold text-slate-600">Geração Extraída</p>
                    <p className="text-lg font-bold text-emerald-600">{form.geracaoRealKwh ? `${fmt(form.geracaoRealKwh)} kWh` : '—'}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Geração Real (kWh) {editingReport ? '— ajuste manual' : '*'}</Label>
                  <Input value={form.geracaoRealKwh} onChange={e => setForm({ ...form, geracaoRealKwh: e.target.value })} type="number" step="0.01" placeholder="Ex: 1200.50" className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Nº UC (Unidade Consumidora)</Label>
                  <Input value={form.numeroUC} onChange={e => setForm({ ...form, numeroUC: e.target.value })} placeholder="Ex: 123456789" className="bg-white" />
                </div>
              </div>
            </div>

            {/* Seção 3: Conta da Concessionária */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2"><DollarSign className="w-4 h-4" /> Conta da Concessionária</h3>
              {editingReport && (
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${billUploading ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
                    <input type="file" accept=".pdf" className="hidden" onChange={handleBillUpload} disabled={billUploading} />
                    {billUploading ? <Loader2 className="w-6 h-6 mx-auto mb-1 animate-spin text-blue-500" /> : <Upload className="w-6 h-6 mx-auto mb-1 text-blue-500" />}
                    <p className="text-xs font-bold text-slate-600">Upload PDF da Conta de Energia</p>
                    <p className="text-[10px] text-slate-400">O sistema extrai automaticamente os dados de qualquer concessionária</p>
                  </div>
                </label>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Consumo (kWh)</Label>
                  <Input value={form.consumoConcessionariaKwh} onChange={e => setForm({ ...form, consumoConcessionariaKwh: e.target.value })} type="number" step="0.01" className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Valor da Conta (R$)</Label>
                  <Input value={form.valorContaRs} onChange={e => setForm({ ...form, valorContaRs: e.target.value })} type="number" step="0.01" className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Energia Injetada (kWh)</Label>
                  <Input value={form.energiaInjetadaKwh} onChange={e => setForm({ ...form, energiaInjetadaKwh: e.target.value })} type="number" step="0.01" className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Créditos Acumulados (kWh)</Label>
                  <Input value={form.creditosAcumuladosKwh} onChange={e => setForm({ ...form, creditosAcumuladosKwh: e.target.value })} type="number" step="0.01" className="bg-white" />
                </div>
              </div>
            </div>

            {/* Seção 4: Resultado automático (se editando) */}
            {editingReport && editingReport.performanceRatio && (
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2"><Activity className="w-4 h-4" /> Resultado Automático</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg border p-3 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Performance</p>
                    <p className={`text-xl font-bold ${Number(editingReport.performanceRatio) >= 90 ? 'text-emerald-600' : Number(editingReport.performanceRatio) >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{Number(editingReport.performanceRatio).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white rounded-lg border p-3 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Economia</p>
                    <p className="text-xl font-bold text-emerald-600">{fmtCurrency(editingReport.economiaGeradaRs || 0)}</p>
                  </div>
                  <div className="bg-white rounded-lg border p-3 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">HSP Médio</p>
                    <p className="text-xl font-bold text-blue-600">{Number(editingReport.hspMedio || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg border p-3 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Variação Mês Ant.</p>
                    <p className={`text-xl font-bold ${Number(editingReport.variacaoMesAnterior || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {editingReport.variacaoMesAnterior !== null ? `${Number(editingReport.variacaoMesAnterior) > 0 ? '+' : ''}${Number(editingReport.variacaoMesAnterior).toFixed(1)}%` : '—'}
                    </p>
                  </div>
                </div>
                {editingReport.resumoAutomatico && (
                  <div className={`rounded-lg border p-4 ${editingReport.statusDesempenho === 'bom' ? 'bg-emerald-50 border-emerald-200' : editingReport.statusDesempenho === 'atencao' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-sm leading-relaxed">{editingReport.resumoAutomatico}</p>
                  </div>
                )}
              </div>
            )}

            {/* Seção 5: Observações */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-slate-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2"><FileText className="w-4 h-4" /> Observações</h3>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase">Observações Técnicas (opcional)</Label>
                <Textarea value={form.observacoesTecnicas} onChange={e => setForm({ ...form, observacoesTecnicas: e.target.value })} placeholder="Limpeza realizada, manutenção corretiva, etc." rows={2} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase">Resumo Customizado (override do automático)</Label>
                <Textarea value={form.resumoCustomizado} onChange={e => setForm({ ...form, resumoCustomizado: e.target.value })} placeholder="Deixe vazio para usar o resumo gerado automaticamente" rows={2} className="bg-white" />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-50 pt-4 pb-2 flex justify-between items-center border-t border-slate-200">
              {!editingReport && <p className="text-xs text-slate-400">💡 Salve primeiro para habilitar upload de CSV e PDF</p>}
              {editingReport && <p className="text-xs text-slate-400">Fonte geração: <Badge variant="outline" className="text-[10px]">{editingReport.fonteGeracao || 'manual'}</Badge></p>}
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 shadow-lg">
                  {editingReport ? 'Salvar Alterações' : 'Criar Relatório'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
