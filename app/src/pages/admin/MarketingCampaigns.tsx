import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Target, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Zap, Users, DollarSign,
  Megaphone, Calendar, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CHANNELS = [
  { value: 'google_ads', label: 'Google Ads' }, { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' }, { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'E-mail' }, { value: 'event', label: 'Evento' },
  { value: 'flyer', label: 'Panfleto/Flyer' }, { value: 'indication', label: 'Indicação' },
  { value: 'whatsapp', label: 'WhatsApp' }, { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' }, { value: 'other', label: 'Outros' },
];
const GOALS = [
  { value: 'lead_generation', label: 'Geração de Leads' },
  { value: 'brand_awareness', label: 'Reconhecimento de Marca' },
  { value: 'retention', label: 'Retenção de Clientes' },
  { value: 'upsell', label: 'Upsell / Cross-sell' },
  { value: 'reactivation', label: 'Reativação de Clientes' },
];
const STATUS_OPT = [
  { value: 'draft', label: 'Rascunho' }, { value: 'active', label: 'Ativa' },
  { value: 'paused', label: 'Pausada' }, { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
];
const ACTION_TYPES = [
  { value: 'post', label: 'Post/Publicação' }, { value: 'email', label: 'E-mail' },
  { value: 'event', label: 'Evento' }, { value: 'visit', label: 'Visita' },
  { value: 'call', label: 'Ligação' }, { value: 'ad', label: 'Anúncio' },
  { value: 'content', label: 'Conteúdo' }, { value: 'other', label: 'Outros' },
];
const ACTION_STATUS = [
  { value: 'planned', label: 'Planejada' }, { value: 'in_progress', label: 'Em andamento' },
  { value: 'done', label: 'Concluída' }, { value: 'cancelled', label: 'Cancelada' },
];

const CHANNEL_LABEL: Record<string, string> = Object.fromEntries(CHANNELS.map(c => [c.value, c.label]));
const CHANNEL_COLOR: Record<string, string> = {
  google_ads: 'bg-blue-100 text-blue-700', instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-indigo-100 text-indigo-700', linkedin: 'bg-sky-100 text-sky-700',
  email: 'bg-amber-100 text-amber-700', event: 'bg-purple-100 text-purple-700',
  flyer: 'bg-orange-100 text-orange-700', indication: 'bg-green-100 text-green-700',
  whatsapp: 'bg-emerald-100 text-emerald-700', youtube: 'bg-red-100 text-red-700',
  tiktok: 'bg-slate-100 text-slate-700', other: 'bg-gray-100 text-gray-700',
};
const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600', active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700', completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};
const ACTION_STATUS_COLOR: Record<string, string> = {
  planned: 'bg-slate-100 text-slate-600', in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUS_OPT.map(s => [s.value, s.label]));
const ACTION_STATUS_LABEL: Record<string, string> = Object.fromEntries(ACTION_STATUS.map(s => [s.value, s.label]));
const ACTION_TYPE_LABEL: Record<string, string> = Object.fromEntries(ACTION_TYPES.map(t => [t.value, t.label]));

const defaultCampaign = {
  name: '', description: '', channel: 'other', status: 'draft', goal: 'lead_generation',
  startDate: '', endDate: '', budget: '', amountSpent: '', targetLeads: '', targetRevenue: '', notes: '',
};
const defaultAction = {
  title: '', description: '', type: 'other', status: 'planned',
  scheduledDate: '', completedDate: '', cost: '', reach: '', engagements: '', leadsGenerated: '', notes: '',
};

export default function MarketingCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [campaignDetail, setCampaignDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Campaign dialog
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [form, setForm] = useState({ ...defaultCampaign });
  const [saving, setSaving] = useState(false);

  // Action dialog
  const [actionDlgOpen, setActionDlgOpen] = useState(false);
  const [editAction, setEditAction] = useState<any>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string>('');
  const [actionForm, setActionForm] = useState({ ...defaultAction });
  const [actionSaving, setActionSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMarketingCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch { toast.error('Erro ao carregar campanhas'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const d = await api.getMarketingCampaign(id);
      setCampaignDetail(d);
    } catch { }
    setDetailLoading(false);
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); setCampaignDetail(null); return; }
    setExpandedId(id);
    loadDetail(id);
  };

  // Campaign CRUD
  function openNew() { setForm({ ...defaultCampaign }); setEditCampaign(null); setDlgOpen(true); }
  function openEdit(c: any) {
    setEditCampaign(c);
    setForm({
      name: c.name || '', description: c.description || '',
      channel: c.channel || 'other', status: c.status || 'draft',
      goal: c.goal || 'lead_generation',
      startDate: c.startDate ? c.startDate.substring(0, 10) : '',
      endDate: c.endDate ? c.endDate.substring(0, 10) : '',
      budget: String(c.budget || ''), amountSpent: String(c.amountSpent || ''),
      targetLeads: String(c.targetLeads || ''), targetRevenue: String(c.targetRevenue || ''),
      notes: c.notes || '',
    });
    setDlgOpen(true);
  }

  async function saveCampaign() {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const data = { ...form, budget: Number(form.budget) || 0, amountSpent: Number(form.amountSpent) || 0, targetLeads: Number(form.targetLeads) || 0, targetRevenue: Number(form.targetRevenue) || 0, startDate: form.startDate || null, endDate: form.endDate || null };
      if (editCampaign?.id) { await api.updateMarketingCampaign(editCampaign.id, data); toast.success('Campanha atualizada!'); }
      else { await api.createMarketingCampaign(data); toast.success('Campanha criada!'); }
      setDlgOpen(false); load();
    } catch { toast.error('Erro ao salvar campanha'); }
    setSaving(false);
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Excluir esta campanha?')) return;
    try { await api.deleteMarketingCampaign(id); toast.success('Campanha excluída'); load(); }
    catch { toast.error('Erro ao excluir'); }
  }

  // Action CRUD
  function openNewAction(campaignId: string) {
    setActionForm({ ...defaultAction }); setEditAction(null);
    setActiveCampaignId(campaignId); setActionDlgOpen(true);
  }
  function openEditAction(a: any, campaignId: string) {
    setEditAction(a); setActiveCampaignId(campaignId);
    setActionForm({
      title: a.title || '', description: a.description || '',
      type: a.type || 'other', status: a.status || 'planned',
      scheduledDate: a.scheduledDate ? a.scheduledDate.substring(0, 10) : '',
      completedDate: a.completedDate ? a.completedDate.substring(0, 10) : '',
      cost: String(a.cost || ''), reach: String(a.reach || ''),
      engagements: String(a.engagements || ''), leadsGenerated: String(a.leadsGenerated || ''),
      notes: a.notes || '',
    });
    setActionDlgOpen(true);
  }

  async function saveAction() {
    if (!actionForm.title.trim()) { toast.error('Título obrigatório'); return; }
    setActionSaving(true);
    try {
      const data = { ...actionForm, campaignId: activeCampaignId, cost: Number(actionForm.cost) || 0, reach: Number(actionForm.reach) || 0, engagements: Number(actionForm.engagements) || 0, leadsGenerated: Number(actionForm.leadsGenerated) || 0, scheduledDate: actionForm.scheduledDate || null, completedDate: actionForm.completedDate || null };
      if (editAction?.id) { await api.updateMarketingAction(editAction.id, data); toast.success('Ação atualizada!'); }
      else { await api.createMarketingAction(data); toast.success('Ação criada!'); }
      setActionDlgOpen(false); loadDetail(activeCampaignId);
    } catch { toast.error('Erro ao salvar ação'); }
    setActionSaving(false);
  }

  async function deleteAction(id: string) {
    if (!confirm('Excluir esta ação?')) return;
    try { await api.deleteMarketingAction(id); toast.success('Ação excluída'); loadDetail(expandedId!); }
    catch { toast.error('Erro ao excluir ação'); }
  }

  // Budget progress
  const budgetPct = (c: any) => {
    const b = Number(c.budget || 0); const s = Number(c.amountSpent || 0);
    return b > 0 ? Math.min((s / b) * 100, 100) : 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-rose-500" /> Campanhas de Marketing
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{campaigns.length} campanha(s) cadastrada(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="bg-rose-500 hover:bg-rose-600 text-white" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" /> Nova Campanha
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-rose-400" /></div>
      ) : campaigns.length === 0 ? (
        <Card className="p-16 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-slate-200" />
          <p className="text-lg font-medium text-slate-500">Nenhuma campanha cadastrada</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Crie sua primeira campanha de marketing</p>
          <Button className="bg-rose-500 hover:bg-rose-600 text-white" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" /> Nova Campanha
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <Card key={c.id} className="overflow-hidden">
              {/* Campaign row */}
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[c.status] || 'bg-slate-100'}`}>{STATUS_LABEL[c.status] || c.status}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CHANNEL_COLOR[c.channel] || 'bg-slate-100'}`}>{CHANNEL_LABEL[c.channel] || c.channel}</span>
                  </div>
                  {/* Budget bar */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-[200px]">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: `${budgetPct(c)}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">
                      R$ {fmt(Number(c.amountSpent || 0))} / R$ {fmt(Number(c.budget || 0))}
                    </span>
                    {c.startDate && <span className="text-xs text-slate-400 hidden md:block">
                      <Calendar className="w-3 h-3 inline mr-0.5" />{new Date(c.startDate).toLocaleDateString('pt-BR')}
                    </span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Excluir" onClick={() => deleteCampaign(c.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpand(c.id)}>
                    {expandedId === c.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === c.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 space-y-4">
                  {detailLoading ? (
                    <div className="flex justify-center py-6"><RefreshCw className="w-5 h-5 animate-spin text-slate-400" /></div>
                  ) : (
                    <>
                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                          <p className="text-xs text-slate-500">Ações Realizadas</p>
                          <p className="text-lg font-bold">{campaignDetail?.actions?.length || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                          <p className="text-xs text-slate-500">Leads Vinculados</p>
                          <p className="text-lg font-bold text-sky-600">{campaignDetail?.leads?.length || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                          <p className="text-xs text-slate-500">Meta de Leads</p>
                          <p className="text-lg font-bold">{c.targetLeads || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                          <p className="text-xs text-slate-500">Meta de Receita</p>
                          <p className="text-lg font-bold text-emerald-600">R$ {fmt(Number(c.targetRevenue || 0))}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-violet-500" /> Ações da Campanha
                          </h4>
                          <Button size="sm" variant="outline" onClick={() => openNewAction(c.id)}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Nova Ação
                          </Button>
                        </div>
                        {(campaignDetail?.actions || []).length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-3">Nenhuma ação cadastrada</p>
                        ) : (
                          <div className="space-y-1.5">
                            {(campaignDetail?.actions || []).map((a: any) => (
                              <div key={a.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700">{a.title}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ACTION_STATUS_COLOR[a.status] || ''}`}>{ACTION_STATUS_LABEL[a.status] || a.status}</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{ACTION_TYPE_LABEL[a.type] || a.type}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                                    {a.scheduledDate && <span><Calendar className="w-3 h-3 inline mr-0.5" />{new Date(a.scheduledDate).toLocaleDateString('pt-BR')}</span>}
                                    {Number(a.cost) > 0 && <span><DollarSign className="w-3 h-3 inline" />R$ {fmt(Number(a.cost))}</span>}
                                    {Number(a.leadsGenerated) > 0 && <span><Users className="w-3 h-3 inline mr-0.5" />{a.leadsGenerated} leads</span>}
                                  </div>
                                </div>
                                <div className="flex gap-0.5">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditAction(a, c.id)}>
                                    <Pencil className="h-3 w-3 text-blue-400" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteAction(a.id)}>
                                    <Trash2 className="h-3 w-3 text-red-400" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Leads */}
                      {(campaignDetail?.leads || []).length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-sky-500" /> Leads desta Campanha ({campaignDetail.leads.length})
                          </h4>
                          <div className="space-y-1">
                            {(campaignDetail.leads || []).slice(0, 5).map((l: any) => (
                              <div key={l.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2 text-sm">
                                <span className="font-medium text-slate-700">{l.name}</span>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <span>{l.email}</span>
                                  {Number(l.estimatedValue) > 0 && <span className="text-emerald-600 font-medium">R$ {fmt(Number(l.estimatedValue))}</span>}
                                </div>
                              </div>
                            ))}
                            {campaignDetail.leads.length > 5 && (
                              <p className="text-xs text-slate-400 text-center">+{campaignDetail.leads.length - 5} leads</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Campaign Dialog */}
      <Dialog open={dlgOpen} onOpenChange={v => { if (!v) setDlgOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editCampaign ? 'Editar' : 'Nova'} Campanha</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2"><Label>Nome da Campanha *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Campanha Verão 2026" /></div>
            <div><Label>Canal</Label>
              <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPT.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Objetivo</Label>
              <Select value={form.goal} onValueChange={v => setForm(p => ({ ...p, goal: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GOALS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Orçamento (R$)</Label><Input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="0,00" /></div>
            <div><Label>Valor Investido (R$)</Label><Input type="number" value={form.amountSpent} onChange={e => setForm(p => ({ ...p, amountSpent: e.target.value }))} placeholder="0,00" /></div>
            <div><Label>Meta de Leads</Label><Input type="number" value={form.targetLeads} onChange={e => setForm(p => ({ ...p, targetLeads: e.target.value }))} /></div>
            <div><Label>Meta de Receita (R$)</Label><Input type="number" value={form.targetRevenue} onChange={e => setForm(p => ({ ...p, targetRevenue: e.target.value }))} /></div>
            <div><Label>Data de Início</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
            <div><Label>Data de Fim</Label><Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div className="col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDlgOpen(false)}>Cancelar</Button>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white" onClick={saveCampaign} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : null}
              {editCampaign ? 'Salvar' : 'Criar Campanha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDlgOpen} onOpenChange={v => { if (!v) setActionDlgOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editAction ? 'Editar' : 'Nova'} Ação</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2"><Label>Título *</Label><Input value={actionForm.title} onChange={e => setActionForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Post no Instagram" /></div>
            <div><Label>Tipo</Label>
              <Select value={actionForm.type} onValueChange={v => setActionForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={actionForm.status} onValueChange={v => setActionForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTION_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data Prevista</Label><Input type="date" value={actionForm.scheduledDate} onChange={e => setActionForm(p => ({ ...p, scheduledDate: e.target.value }))} /></div>
            <div><Label>Data Concluída</Label><Input type="date" value={actionForm.completedDate} onChange={e => setActionForm(p => ({ ...p, completedDate: e.target.value }))} /></div>
            <div><Label>Custo (R$)</Label><Input type="number" value={actionForm.cost} onChange={e => setActionForm(p => ({ ...p, cost: e.target.value }))} placeholder="0,00" /></div>
            <div><Label>Alcance</Label><Input type="number" value={actionForm.reach} onChange={e => setActionForm(p => ({ ...p, reach: e.target.value }))} /></div>
            <div><Label>Engajamentos</Label><Input type="number" value={actionForm.engagements} onChange={e => setActionForm(p => ({ ...p, engagements: e.target.value }))} /></div>
            <div><Label>Leads Gerados</Label><Input type="number" value={actionForm.leadsGenerated} onChange={e => setActionForm(p => ({ ...p, leadsGenerated: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Descrição</Label><Textarea value={actionForm.description} onChange={e => setActionForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div className="col-span-2"><Label>Observações</Label><Textarea value={actionForm.notes} onChange={e => setActionForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setActionDlgOpen(false)}>Cancelar</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={saveAction} disabled={actionSaving}>
              {editAction ? 'Salvar' : 'Criar Ação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
