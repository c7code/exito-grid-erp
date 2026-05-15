import { useState, useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  UserPlus, Users, TrendingUp, DollarSign, Plus, Pencil, Trash2,
  Link2, Loader2, Search, RefreshCw,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Consultant { id: string; name: string; email?: string; phone?: string; commissionPercent?: number; status?: string; }
interface Lead { id: string; clientName: string; clientPhone?: string; status: string; notes?: string; consultantId: string; consultant?: Consultant; proposalId?: string; createdAt: string; }

const STATUSES = ['new','contacted','proposal_sent','negotiating','converted','lost'];
const STATUS_LABEL: Record<string,string> = { new:'Novo', contacted:'Contatado', proposal_sent:'Proposta Enviada', negotiating:'Negociando', converted:'Convertido', lost:'Perdido' };
const STATUS_COLOR: Record<string,string> = { new:'bg-blue-100 text-blue-700', contacted:'bg-yellow-100 text-yellow-700', proposal_sent:'bg-purple-100 text-purple-700', negotiating:'bg-orange-100 text-orange-700', converted:'bg-green-100 text-green-700', lost:'bg-red-100 text-red-700' };

export default function SolarReferrals() {
  const [tab, setTab] = useState<'leads'|'consultants'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Consultant dialog
  const [consultantDialog, setConsultantDialog] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<any>(null);
  const [cForm, setCForm] = useState({ name:'', email:'', phone:'', commissionPercent:'', status:'active' });

  // Lead dialog
  const [leadDialog, setLeadDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [lForm, setLForm] = useState({ clientName:'', clientPhone:'', clientEmail:'', consultantId:'', status:'new', notes:'' });

  // Link proposal dialog
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkLead, setLinkLead] = useState<Lead|null>(null);
  const [linkProposalId, setLinkProposalId] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [l, c] = await Promise.all([api.getReferralLeads({}), api.getReferralConsultants({})]);
      setLeads(Array.isArray(l) ? l : []);
      setConsultants(Array.isArray(c) ? c : []);
    } catch { toast.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ─── Consultant CRUD ──────────────────────────────────────────────────────
  const openNewConsultant = () => {
    setEditingConsultant(null);
    setCForm({ name:'', email:'', phone:'', commissionPercent:'', status:'active' });
    setConsultantDialog(true);
  };
  const openEditConsultant = (c: Consultant) => {
    setEditingConsultant(c);
    setCForm({ name: c.name||'', email: c.email||'', phone: c.phone||'', commissionPercent: String(c.commissionPercent||''), status: c.status||'active' });
    setConsultantDialog(true);
  };
  const saveConsultant = async () => {
    if (!cForm.name.trim()) return toast.error('Nome obrigatório');
    try {
      const data = { ...cForm, commissionPercent: cForm.commissionPercent ? Number(cForm.commissionPercent) : 0 };
      if (editingConsultant) { await api.updateReferralConsultant(editingConsultant.id, data); toast.success('Consultor atualizado!'); }
      else { await api.createReferralConsultant(data); toast.success('Consultor criado!'); }
      setConsultantDialog(false); load();
    } catch { toast.error('Erro ao salvar consultor'); }
  };
  const deleteConsultant = async (id: string) => {
    if (!confirm('Excluir consultor?')) return;
    try { await api.deleteReferralConsultant(id); toast.success('Excluído!'); load(); } catch { toast.error('Erro ao excluir'); }
  };

  // ─── Lead CRUD ────────────────────────────────────────────────────────────
  const openNewLead = () => {
    setEditingLead(null);
    setLForm({ clientName:'', clientPhone:'', clientEmail:'', consultantId:'', status:'new', notes:'' });
    setLeadDialog(true);
  };
  const openEditLead = (l: Lead) => {
    setEditingLead(l);
    setLForm({ clientName: l.clientName||'', clientPhone: (l as any).clientPhone||'', clientEmail: (l as any).clientEmail||'', consultantId: l.consultantId||'', status: l.status||'new', notes: l.notes||'' });
    setLeadDialog(true);
  };
  const saveLead = async () => {
    if (!lForm.clientName.trim()) return toast.error('Nome obrigatório');
    if (!lForm.consultantId) return toast.error('Selecione o consultor');
    try {
      if (editingLead) { await api.updateReferralLead(editingLead.id, lForm); toast.success('Lead atualizado!'); }
      else { await api.createReferralLead(lForm); toast.success('Lead criado!'); }
      setLeadDialog(false); load();
    } catch { toast.error('Erro ao salvar lead'); }
  };
  const deleteLead = async (id: string) => {
    if (!confirm('Excluir lead?')) return;
    try { await api.deleteReferralLead(id); toast.success('Excluído!'); load(); } catch { toast.error('Erro ao excluir'); }
  };
  const updateLeadStatus = async (lead: Lead, status: string) => {
    try { await api.updateReferralLead(lead.id, { status }); load(); } catch { toast.error('Erro ao atualizar status'); }
  };

  // ─── Link proposal ────────────────────────────────────────────────────────
  const openLink = async (lead: Lead) => {
    setLinkLead(lead);
    setLinkProposalId(lead.proposalId || '');
    setLinkDialog(true);
    if (proposals.length === 0) {
      try { const p = await api.getProposals(); setProposals(Array.isArray(p) ? p : (p?.data || [])); } catch {}
    }
  };
  const saveLink = async () => {
    if (!linkLead) return;
    try {
      await api.updateReferralLead(linkLead.id, { proposalId: linkProposalId || null });
      toast.success('Proposta vinculada!');
      setLinkDialog(false); load();
    } catch { toast.error('Erro ao vincular proposta'); }
  };

  // ─── Filtered ─────────────────────────────────────────────────────────────
  const filteredLeads = leads.filter(l => l.clientName?.toLowerCase().includes(search.toLowerCase()) || l.consultant?.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredConsultants = consultants.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-emerald-500" /> Canal de Indicações
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie parceiros indicadores e seus leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</Button>
          {tab === 'consultants' && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openNewConsultant}><Plus className="w-4 h-4 mr-1" /> Novo Parceiro</Button>}
          {tab === 'leads' && <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={openNewLead}><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Parceiros', value: consultants.length, color: 'text-blue-600' },
          { icon: TrendingUp, label: 'Leads Ativos', value: leads.filter(l => !['converted','lost'].includes(l.status)).length, color: 'text-amber-600' },
          { icon: UserPlus, label: 'Convertidos', value: leads.filter(l => l.status === 'converted').length, color: 'text-emerald-600' },
          { icon: DollarSign, label: 'Com Proposta', value: leads.filter(l => l.proposalId).length, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={['text-2xl font-bold', s.color].join(' ')}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {(['leads','consultants'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={['px-6 py-3 text-sm font-medium border-b-2 transition-colors', tab === t ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-transparent text-slate-500 hover:text-slate-700'].join(' ')}
            >
              {t === 'leads' ? 'Leads' : 'Parceiros'}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" /> Carregando...
            </div>
          )}

          {/* Leads Table */}
          {!loading && tab === 'leads' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Cliente</th>
                    <th className="pb-3 pr-4">Parceiro</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Proposta</th>
                    <th className="pb-3 pr-4">Data</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50 group">
                      <td className="py-3 pr-4 font-medium text-slate-800">{lead.clientName}</td>
                      <td className="py-3 pr-4 text-slate-600">{lead.consultant?.name || '—'}</td>
                      <td className="py-3 pr-4">
                        <Select value={lead.status} onValueChange={v => updateLeadStatus(lead, v)}>
                          <SelectTrigger className="h-7 text-xs w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => <SelectItem key={s} value={s}><span className={['px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLOR[s]].join(' ')}>{STATUS_LABEL[s]}</span></SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 pr-4">
                        {lead.proposalId ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Vinculada</Badge>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-400 text-xs">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500" title="Vincular proposta" onClick={() => openLink(lead)}><Link2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500" onClick={() => openEditLead(lead)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteLead(lead.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400">Nenhum lead encontrado. Clique em "Novo Lead" para adicionar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Consultants Table */}
          {!loading && tab === 'consultants' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Nome</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Telefone</th>
                    <th className="pb-3 pr-4">Comissão</th>
                    <th className="pb-3 pr-4">Leads</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredConsultants.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 group">
                      <td className="py-3 pr-4 font-medium text-slate-800">{c.name}</td>
                      <td className="py-3 pr-4 text-slate-500">{c.email || '—'}</td>
                      <td className="py-3 pr-4 text-slate-500">{c.phone || '—'}</td>
                      <td className="py-3 pr-4">{c.commissionPercent ? `${c.commissionPercent}%` : '—'}</td>
                      <td className="py-3 pr-4">{leads.filter(l => l.consultantId === c.id).length}</td>
                      <td className="py-3 pr-4">
                        <Badge className={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                          {c.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500" onClick={() => openEditConsultant(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteConsultant(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredConsultants.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400">Nenhum parceiro. Clique em "Novo Parceiro" para adicionar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Consultant Dialog */}
      <Dialog open={consultantDialog} onOpenChange={setConsultantDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingConsultant ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
            <DialogDescription>Preencha os dados do consultor parceiro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Nome *</Label><Input value={cForm.name} onChange={e => setCForm({...cForm, name: e.target.value})} placeholder="Nome completo" /></div>
            <div><Label>Email</Label><Input value={cForm.email} onChange={e => setCForm({...cForm, email: e.target.value})} placeholder="email@exemplo.com" /></div>
            <div><Label>Telefone</Label><Input value={cForm.phone} onChange={e => setCForm({...cForm, phone: e.target.value})} placeholder="(00) 00000-0000" /></div>
            <div><Label>Comissão (%)</Label><Input type="number" value={cForm.commissionPercent} onChange={e => setCForm({...cForm, commissionPercent: e.target.value})} placeholder="Ex: 5" /></div>
            <div>
              <Label>Status</Label>
              <Select value={cForm.status} onValueChange={v => setCForm({...cForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setConsultantDialog(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveConsultant}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Dialog */}
      <Dialog open={leadDialog} onOpenChange={setLeadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
            <DialogDescription>Registre um lead indicado por parceiro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Nome do Cliente *</Label><Input value={lForm.clientName} onChange={e => setLForm({...lForm, clientName: e.target.value})} placeholder="Nome do cliente" /></div>
            <div><Label>Telefone</Label><Input value={lForm.clientPhone} onChange={e => setLForm({...lForm, clientPhone: e.target.value})} placeholder="(00) 00000-0000" /></div>
            <div><Label>Email</Label><Input value={lForm.clientEmail} onChange={e => setLForm({...lForm, clientEmail: e.target.value})} placeholder="email@cliente.com" /></div>
            <div>
              <Label>Parceiro Indicador *</Label>
              <Select value={lForm.consultantId} onValueChange={v => setLForm({...lForm, consultantId: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione o parceiro" /></SelectTrigger>
                <SelectContent>
                  {consultants.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={lForm.status} onValueChange={v => setLForm({...lForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Input value={lForm.notes} onChange={e => setLForm({...lForm, notes: e.target.value})} placeholder="Detalhes do lead..." /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setLeadDialog(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={saveLead}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Proposal Dialog */}
      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Link2 className="w-4 h-4 text-emerald-500" /> Vincular Proposta</DialogTitle>
            <DialogDescription>Lead: <strong>{linkLead?.clientName}</strong> — Parceiro: <strong>{linkLead?.consultant?.name}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Proposta</Label>
              <Select value={linkProposalId || '__none__'} onValueChange={v => setLinkProposalId(v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a proposta..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma / Remover vínculo</SelectItem>
                  {proposals.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.proposalNumber} — {p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {linkProposalId && <p className="text-xs text-emerald-600">✓ A comissão será registrada automaticamente ao fechar a venda.</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setLinkDialog(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveLink}>Salvar Vínculo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
