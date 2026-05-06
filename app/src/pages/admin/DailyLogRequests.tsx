import { useState, useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Loader2, MessageSquare, Clock, AlertTriangle, CheckCircle2, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-red-100 text-red-700 border-red-200', icon: Clock },
  answered: { label: 'Respondido', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: MessageSquare },
  resolved: { label: 'Concluído', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
};
const priorityConfig: Record<string, { label: string; color: string }> = {
  normal: { label: 'Normal', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  urgent: { label: 'Urgente', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: 'Crítico', color: 'bg-red-100 text-red-800 border-red-300' },
};
const categoryLabels: Record<string, string> = {
  tecnica: 'Técnica', material: 'Material', aprovacao: 'Aprovação',
  financeira: 'Financeira', documentacao: 'Documentação', outro: 'Outro',
};

export default function DailyLogRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterWork, setFilterWork] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const [form, setForm] = useState({
    workId: '', subject: '', description: '', requestedTo: '',
    requestedToEmail: '', category: 'tecnica', priority: 'normal',
    requestDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [responseForm, setResponseForm] = useState({
    respondedBy: '', content: '', responseDate: format(new Date(), 'yyyy-MM-dd'), attachmentUrl: '',
  });

  useEffect(() => { loadData(); }, [filterWork, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, worksData, statsData] = await Promise.all([
        api.getDailyLogRequests(filterWork || undefined, filterStatus || undefined),
        api.getWorks(),
        api.getDailyLogRequestStats(filterWork || undefined),
      ]);
      setRequests(Array.isArray(reqs) ? reqs : []);
      const w = Array.isArray(worksData) ? worksData : (worksData?.data ?? []);
      setWorks(w);
      setStats(statsData);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.workId || !form.subject || !form.requestedTo) {
      toast.error('Preencha obra, assunto e destinatário'); return;
    }
    setSaving(true);
    try {
      await api.createDailyLogRequest(form);
      toast.success('Solicitação registrada!');
      setShowCreateDialog(false);
      setForm({ workId: '', subject: '', description: '', requestedTo: '', requestedToEmail: '', category: 'tecnica', priority: 'normal', requestDate: format(new Date(), 'yyyy-MM-dd') });
      loadData();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); } finally { setSaving(false); }
  };

  const handleAddResponse = async () => {
    if (!responseForm.respondedBy || !responseForm.content) {
      toast.error('Preencha quem respondeu e o conteúdo'); return;
    }
    setSaving(true);
    try {
      await api.addDailyLogResponse(selectedRequest.id, responseForm);
      toast.success('Resposta registrada!');
      setShowResponseForm(false);
      setResponseForm({ respondedBy: '', content: '', responseDate: format(new Date(), 'yyyy-MM-dd'), attachmentUrl: '' });
      const updated = await api.getDailyLogRequest(selectedRequest.id);
      setSelectedRequest(updated);
      loadData();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateDailyLogRequest(id, { status });
      toast.success('Status atualizado');
      if (selectedRequest?.id === id) {
        const updated = await api.getDailyLogRequest(id);
        setSelectedRequest(updated);
      }
      loadData();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const filtered = requests.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.subject?.toLowerCase().includes(s) || r.requestedTo?.toLowerCase().includes(s) || r.description?.toLowerCase().includes(s) || r.work?.title?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-violet-500" />
            Solicitações & Acompanhamento
          </h1>
          <p className="text-sm text-slate-500 mt-1">Rastreie pedidos, respostas e prazos de engenheiros e fornecedores</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-500 hover:bg-violet-600 text-white font-bold shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Nova Solicitação
        </Button>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-900' },
            { label: 'Pendentes', value: stats.pending, color: 'text-red-600' },
            { label: 'Respondidas', value: stats.answered, color: 'text-yellow-600' },
            { label: 'Concluídas', value: stats.resolved, color: 'text-green-600' },
            { label: 'Canceladas', value: stats.cancelled, color: 'text-slate-400' },
            { label: 'Urgentes Pendentes', value: stats.urgent, color: 'text-orange-600' },
            { label: 'Média Resposta', value: `${stats.avgResponseDays}d`, color: 'text-blue-600' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
              <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar assunto, destinatário..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterWork} onValueChange={setFilterWork}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Todas obras" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as obras</SelectItem>
            {works.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Todos status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const sc = statusConfig[req.status] || statusConfig.pending;
            const pc = priorityConfig[req.priority] || priorityConfig.normal;
            const StatusIcon = sc.icon;
            return (
              <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setSelectedRequest(req); setShowTimelineDialog(true); }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className={sc.color}><StatusIcon className="w-3 h-3 mr-1" />{sc.label}</Badge>
                      <Badge variant="outline" className={pc.color}>{pc.label}</Badge>
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{categoryLabels[req.category] || req.category}</Badge>
                      {req.priority === 'critical' && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{req.subject}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>Para: <strong>{req.requestedTo}</strong></span>
                      <span>Obra: {req.work?.title || '—'}</span>
                      <span>{req.requestDate ? format(new Date(req.requestDate), 'dd/MM/yyyy') : ''}</span>
                      {req.responses?.length > 0 && <span className="text-violet-600 font-medium">{req.responses.length} resposta(s)</span>}
                      {req.responseTimeDays != null && <span className="text-green-600">Resolvido em {req.responseTimeDays} dias</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-violet-500" />Nova Solicitação</DialogTitle>
            <DialogDescription>Registre uma solicitação para acompanhar prazos e respostas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Obra *</Label>
                <Select value={form.workId} onValueChange={v => setForm({ ...form, workId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{works.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data da Solicitação *</Label><Input type="date" value={form.requestDate} onChange={e => setForm({ ...form, requestDate: e.target.value })} /></div>
            </div>
            <div><Label>Assunto *</Label><Input placeholder="Ex: Laudo do transformador" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Destinatário *</Label><Input placeholder="Eng. Carlos, Fornecedor X..." value={form.requestedTo} onChange={e => setForm({ ...form, requestedTo: e.target.value })} /></div>
              <div><Label>Email (opcional)</Label><Input type="email" placeholder="email@empresa.com" value={form.requestedToEmail} onChange={e => setForm({ ...form, requestedToEmail: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição detalhada</Label><Textarea rows={3} placeholder="Descreva o que foi solicitado..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button className="bg-violet-500 hover:bg-violet-600 text-white font-bold" onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeline Dialog */}
      <Dialog open={showTimelineDialog} onOpenChange={v => { setShowTimelineDialog(v); if (!v) setShowResponseForm(false); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-violet-500" />Timeline — {selectedRequest?.subject}</DialogTitle>
            <DialogDescription>{selectedRequest?.work?.title} • Para: {selectedRequest?.requestedTo}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-2">
              {/* Status + Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(statusConfig).map(([k, v]) => (
                  <Button key={k} size="sm" variant={selectedRequest.status === k ? 'default' : 'outline'}
                    className={selectedRequest.status === k ? 'bg-violet-500 text-white' : ''}
                    onClick={() => handleStatusChange(selectedRequest.id, k)}>
                    {v.label}
                  </Button>
                ))}
              </div>

              {/* Request info */}
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-violet-600 font-bold mb-1">
                  <Send className="w-3 h-3" />
                  SOLICITAÇÃO — {selectedRequest.requestDate ? format(new Date(selectedRequest.requestDate), "dd/MM/yyyy (EEEE)", { locale: ptBR }) : ''}
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRequest.description || selectedRequest.subject}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                  <Badge variant="outline" className={priorityConfig[selectedRequest.priority]?.color}>{priorityConfig[selectedRequest.priority]?.label}</Badge>
                  <span>Categoria: {categoryLabels[selectedRequest.category]}</span>
                  {selectedRequest.createdBy && <span>Por: {selectedRequest.createdBy.name}</span>}
                </div>
              </div>

              {/* Responses timeline */}
              <div className="space-y-3">
                {(selectedRequest.responses || []).map((resp: any, idx: number) => (
                  <div key={resp.id || idx} className="relative pl-6 border-l-2 border-green-300">
                    <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-green-500" />
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-green-700 font-bold mb-1">
                        <MessageSquare className="w-3 h-3" />
                        RESPOSTA — {resp.responseDate ? format(new Date(resp.responseDate), "dd/MM/yyyy (EEEE)", { locale: ptBR }) : ''}
                        <span className="text-slate-500 font-normal">por {resp.respondedBy}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{resp.content}</p>
                      {resp.attachmentUrl && (
                        <a href={resp.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1 block">📎 Anexo</a>
                      )}
                    </div>
                  </div>
                ))}
                {(selectedRequest.responses || []).length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Aguardando resposta...
                  </div>
                )}
              </div>

              {/* Add response form */}
              {!showResponseForm ? (
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={() => setShowResponseForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />Adicionar Resposta
                </Button>
              ) : (
                <div className="p-4 bg-slate-50 border rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>Quem respondeu *</Label><Input placeholder="Nome da pessoa" value={responseForm.respondedBy} onChange={e => setResponseForm({ ...responseForm, respondedBy: e.target.value })} /></div>
                    <div><Label>Data da resposta</Label><Input type="date" value={responseForm.responseDate} onChange={e => setResponseForm({ ...responseForm, responseDate: e.target.value })} /></div>
                  </div>
                  <div><Label>Conteúdo da resposta *</Label><Textarea rows={3} placeholder="O que foi respondido..." value={responseForm.content} onChange={e => setResponseForm({ ...responseForm, content: e.target.value })} /></div>
                  <div><Label>Link do anexo (opcional)</Label><Input placeholder="https://..." value={responseForm.attachmentUrl} onChange={e => setResponseForm({ ...responseForm, attachmentUrl: e.target.value })} /></div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowResponseForm(false)}>Cancelar</Button>
                    <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleAddResponse} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar Resposta
                    </Button>
                  </div>
                </div>
              )}

              {/* Resolution info */}
              {selectedRequest.status === 'resolved' && selectedRequest.responseTimeDays != null && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-green-700">Resolvido em {selectedRequest.responseTimeDays} dias</p>
                  <p className="text-xs text-slate-500">{selectedRequest.resolvedDate ? format(new Date(selectedRequest.resolvedDate), 'dd/MM/yyyy') : ''}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
