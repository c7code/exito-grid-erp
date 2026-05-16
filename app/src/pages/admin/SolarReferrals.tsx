import { useState, useEffect, useRef } from 'react';
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
  Link2, Loader2, Search, RefreshCw, Key, Copy, CheckCheck,
  MapPin, FileUp, FolderOpen, Globe, Lock, Download, X, Tag, Radio,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Consultant { id: string; name: string; email?: string; phone?: string; commissionPercent?: number; status?: string; }
interface Lead {
  id: string; clientName: string; clientPhone?: string; clientEmail?: string;
  status: string; notes?: string; consultantId: string; consultant?: Consultant;
  proposalId?: string; createdAt: string;
  services?: string[]; zipCode?: string; neighborhood?: string; city?: string; state?: string; address?: string;
}
interface LeadDoc {
  id: string; originalName: string; mimeType?: string; url: string; description?: string;
  visibility: 'public' | 'private'; uploadedBy?: string; uploadedByRole?: string;
  targetConsultantId?: string; createdAt: string; docType?: string; fileType?: string;
}
const FILE_TYPES = ['Conta de Luz','CPF / RG','CNPJ','Comprovante de Endereço','Proposta','Contrato','Foto da Instalação','Projeto Elétrico','Laudo Técnico','Orçamento','Outro (personalizado)'];
const CHANNEL_LABELS: Record<string,string> = { all:'Todos os Indicadores', solar:'Energia Solar', oem:'OEM / Transformadores', equipment:'Locação de Equipamentos' };

const SERVICES_LIST = ['Solar Fotovoltaico','OEM / Transformadores','Locação de Equipamentos','Elétrica Industrial','Elétrica Predial','Projeto Elétrico','Manutenção Elétrica','Outros'];
const STATUSES = ['new','contacted','proposal_sent','negotiating','converted','lost'];
const STATUS_LABEL: Record<string,string> = { new:'Novo', contacted:'Contatado', proposal_sent:'Proposta Enviada', negotiating:'Negociando', converted:'Convertido', lost:'Perdido' };
const STATUS_COLOR: Record<string,string> = { new:'bg-blue-100 text-blue-700', contacted:'bg-yellow-100 text-yellow-700', proposal_sent:'bg-purple-100 text-purple-700', negotiating:'bg-orange-100 text-orange-700', converted:'bg-green-100 text-green-700', lost:'bg-red-100 text-red-700' };

export default function SolarReferrals() {
  const [tab, setTab] = useState<'leads'|'consultants'|'broadcast'>('leads');
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
  const [lForm, setLForm] = useState({
    clientName:'', clientPhone:'', clientEmail:'', consultantId:'', status:'new', notes:'',
    services: [] as string[], zipCode:'', neighborhood:'', city:'', state:'', address:'',
  });

  // Document channel
  const [docDialog, setDocDialog] = useState(false);
  const [docLead, setDocLead] = useState<Lead|null>(null);
  const [docs, setDocs] = useState<LeadDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadVisibility, setUploadVisibility] = useState<'public'|'private'>('public');
  const [uploadTarget, setUploadTarget] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFileType, setUploadFileType] = useState('');
  const [customFileType, setCustomFileType] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [togglingDoc, setTogglingDoc] = useState<string|null>(null);

  // Broadcast docs
  const [broadcastDocs, setBroadcastDocs] = useState<any[]>([]);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastUploading, setBroadcastUploading] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState<'all'|'solar'|'oem'|'equipment'>('all');
  const [broadcastDesc, setBroadcastDesc] = useState('');
  const broadcastFileRef = useRef<HTMLInputElement>(null);

  // Link proposal dialog
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkLead, setLinkLead] = useState<Lead|null>(null);
  const [linkProposalId, setLinkProposalId] = useState('');
  const [linkVisiblePartner, setLinkVisiblePartner] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);

  // Generate access dialog
  const [accessDialog, setAccessDialog] = useState(false);
  const [accessCredentials, setAccessCredentials] = useState<{email:string;password:string}|null>(null);
  const [generatingAccess, setGeneratingAccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string|null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [l, c] = await Promise.all([api.getReferralLeads({}), api.getReferralConsultants({})]);
      setLeads(Array.isArray(l) ? l : []);
      setConsultants(Array.isArray(c) ? c : []);
    } catch { toast.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  };

  const loadBroadcast = async () => {
    setBroadcastLoading(true);
    try { const d = await api.getBroadcastDocuments(); setBroadcastDocs(Array.isArray(d) ? d : []); }
    catch { toast.error('Erro ao carregar documentos gerais'); }
    finally { setBroadcastLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === 'broadcast') loadBroadcast(); }, [tab]);

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
    setLForm({ clientName:'', clientPhone:'', clientEmail:'', consultantId:'', status:'new', notes:'', services:[], zipCode:'', neighborhood:'', city:'', state:'', address:'' });
    setLeadDialog(true);
  };
  const openEditLead = (l: Lead) => {
    setEditingLead(l);
    setLForm({
      clientName: l.clientName||'', clientPhone: l.clientPhone||'', clientEmail: l.clientEmail||'',
      consultantId: l.consultantId||'', status: l.status||'new', notes: l.notes||'',
      services: l.services||[], zipCode: l.zipCode||'', neighborhood: l.neighborhood||'',
      city: l.city||'', state: l.state||'', address: l.address||'',
    });
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
      // Se há proposta e visível para parceiro, sinaliza via followup
      if (linkProposalId && linkVisiblePartner) {
        try { await api.createReferralFollowup({ leadId: linkLead.id, consultantId: linkLead.consultantId, type: 'internal_note', description: `Proposta vinculada e compartilhada com o parceiro.` }); } catch {}
      }
      toast.success('Proposta vinculada!');
      setLinkDialog(false); load();
    } catch { toast.error('Erro ao vincular proposta'); }
  };

  // ─── Generate Access ─────────────────────────────────────────────────────
  const generateAccess = async (consultant: Consultant) => {
    setGeneratingAccess(true);
    try {
      const result = await api.generateConsultantAccess(consultant.id);
      setAccessCredentials({ email: result.email, password: result.password });
      setAccessDialog(true);
      toast.success('Acesso gerado com sucesso!');
    } catch { toast.error('Erro ao gerar acesso'); }
    finally { setGeneratingAccess(false); }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ─── Document Channel ─────────────────────────────────────────────────────
  const openDocs = async (lead: Lead) => {
    setDocLead(lead); setDocDialog(true); setDocsLoading(true);
    try { const d = await api.getLeadDocuments(lead.id); setDocs(Array.isArray(d) ? d : []); }
    catch { toast.error('Erro ao carregar documentos'); }
    finally { setDocsLoading(false); }
  };
  const uploadDoc = async () => {
    if (!fileRef.current?.files?.[0] || !docLead) return;
    const file = fileRef.current.files[0];
    setUploading(true);
    try {
      const effectiveType = uploadFileType === 'Outro (personalizado)' ? (customFileType.trim() || 'Outro') : uploadFileType;
      const desc = [effectiveType, uploadDesc].filter(Boolean).join(' — ');
      await api.uploadLeadDocument(docLead.id, file, { visibility: uploadVisibility, targetConsultantId: uploadTarget || undefined, description: desc || undefined });
      toast.success('Documento enviado!');
      setUploadDesc(''); setUploadTarget(''); setUploadVisibility('public'); setUploadFileType(''); setCustomFileType('');
      if (fileRef.current) fileRef.current.value = '';
      const d = await api.getLeadDocuments(docLead.id); setDocs(Array.isArray(d) ? d : []);
    } catch { toast.error('Erro ao enviar documento'); }
    finally { setUploading(false); }
  };

  const uploadBroadcast = async () => {
    if (!broadcastFileRef.current?.files?.[0]) return;
    const file = broadcastFileRef.current.files[0];
    setBroadcastUploading(true);
    try {
      await api.uploadBroadcastDocument(file, { targetChannel: broadcastChannel, description: broadcastDesc || undefined });
      toast.success('Documento geral enviado!');
      setBroadcastDesc('');
      if (broadcastFileRef.current) broadcastFileRef.current.value = '';
      await loadBroadcast();
    } catch { toast.error('Erro ao enviar documento'); }
    finally { setBroadcastUploading(false); }
  };

  const deleteBroadcastDoc = async (docId: string) => {
    if (!confirm('Remover documento geral?')) return;
    try { await api.deleteBroadcastDocument(docId); setBroadcastDocs(p => p.filter(d => d.id !== docId)); toast.success('Removido!'); }
    catch { toast.error('Erro ao remover'); }
  };
  const toggleDocVisibility = async (doc: LeadDoc) => {
    setTogglingDoc(doc.id);
    const next = doc.visibility === 'public' ? 'private' : 'public';
    try {
      await api.updateLeadDocumentVisibility(doc.id, next, next === 'private' ? (docLead?.consultantId || undefined) : undefined);
      setDocs(p => p.map(d => d.id === doc.id ? { ...d, visibility: next } : d));
      toast.success(next === 'public' ? 'Visível para o parceiro' : 'Privado (só admin)');
    } catch { toast.error('Erro ao alterar visibilidade'); }
    finally { setTogglingDoc(null); }
  };
  const deleteDoc = async (docId: string) => {
    if (!confirm('Remover documento?')) return;
    try { await api.deleteLeadDocument(docId); setDocs(p => p.filter(d => d.id !== docId)); toast.success('Removido!'); }
    catch { toast.error('Erro ao remover'); }
  };
  const toggleService = (svc: string) => {
    setLForm(p => ({ ...p, services: p.services.includes(svc) ? p.services.filter(s => s !== svc) : [...p.services, svc] }));
  };
  const isImage = (mime?: string) => mime?.startsWith('image/');
  const resolveUrl = (url: string) => url?.startsWith('http') ? url : `${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '')}${url}`;

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
          {([
            { key: 'leads', label: 'Leads' },
            { key: 'consultants', label: 'Parceiros' },
            { key: 'broadcast', label: '📢 Documentos Gerais' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={['px-6 py-3 text-sm font-medium border-b-2 transition-colors', tab === t.key ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-transparent text-slate-500 hover:text-slate-700'].join(' ')}
            >
              {t.label}
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
                      <td className="py-3 pr-4 text-slate-400 text-xs">
                        <div>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</div>
                        {lead.services && lead.services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.services.slice(0,2).map(s => <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">{s}</span>)}
                            {lead.services.length > 2 && <span className="text-[10px] text-slate-400">+{lead.services.length - 2}</span>}
                          </div>
                        )}
                        {lead.city && <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400"><MapPin className="w-2.5 h-2.5" />{lead.city}{lead.state ? `, ${lead.state}` : ''}</div>}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-500" title="Canal de documentos" onClick={() => openDocs(lead)}><FolderOpen className="w-3.5 h-3.5" /></Button>
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
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500" title="Gerar Acesso ao Portal" disabled={generatingAccess} onClick={() => generateAccess(c)}><Key className="w-3.5 h-3.5" /></Button>
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

          {/* ─── Broadcast Docs Tab ──────────────────────────────────────── */}
          {tab === 'broadcast' && (
            <div className="space-y-5">
              {/* Upload section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-500" /> Enviar Documento para Indicadores
                </p>
                <input ref={broadcastFileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Canal Destino</label>
                    <Select value={broadcastChannel} onValueChange={(v) => setBroadcastChannel(v as any)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">📢 Todos os Indicadores</SelectItem>
                        <SelectItem value="solar">☀️ Energia Solar</SelectItem>
                        <SelectItem value="oem">⚡ OEM / Transformadores</SelectItem>
                        <SelectItem value="equipment">🏗️ Locação de Equipamentos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Descrição (opcional)</label>
                    <Input value={broadcastDesc} onChange={e => setBroadcastDesc(e.target.value)} placeholder="Ex: Manual de vendas Solar" />
                  </div>
                </div>
                <Button size="sm" onClick={uploadBroadcast} disabled={broadcastUploading} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                  {broadcastUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <FileUp className="w-3.5 h-3.5 mr-1" />}
                  Enviar para Indicadores
                </Button>
              </div>

              {/* List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Documentos Enviados ({broadcastDocs.length})</p>
                  <Button variant="outline" size="sm" onClick={loadBroadcast}><RefreshCw className="w-3.5 h-3.5 mr-1" />Atualizar</Button>
                </div>
                {broadcastLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div>}
                {!broadcastLoading && broadcastDocs.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                    <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhum documento geral enviado ainda.
                  </div>
                )}
                <div className="space-y-2">
                  {broadcastDocs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3 hover:border-amber-200 transition-colors">
                      <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                        {doc.mimeType === 'application/pdf' ? '📄' : doc.mimeType?.startsWith('image/') ? '🖼️' : '📁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{doc.description || doc.originalName}</p>
                        <p className="text-xs text-slate-400">{doc.originalName} · {doc.uploadedBy} · {new Date(doc.createdAt).toLocaleDateString('pt-BR')}</p>
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {CHANNEL_LABELS[doc.targetChannel] || doc.targetChannel}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <a href={resolveUrl(doc.url)} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500"><Download className="w-3.5 h-3.5" /></Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteBroadcastDoc(doc.id)}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
            <DialogDescription>Registre um lead indicado por parceiro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nome do Cliente *</Label><Input value={lForm.clientName} onChange={e => setLForm({...lForm, clientName: e.target.value})} placeholder="Nome do cliente" /></div>
              <div><Label>Telefone</Label><Input value={lForm.clientPhone} onChange={e => setLForm({...lForm, clientPhone: e.target.value})} placeholder="(00) 00000-0000" /></div>
              <div><Label>Email</Label><Input value={lForm.clientEmail} onChange={e => setLForm({...lForm, clientEmail: e.target.value})} placeholder="email@cliente.com" /></div>
            </div>

            {/* Serviços de interesse */}
            <div>
              <Label className="flex items-center gap-1 mb-2"><Tag className="w-3.5 h-3.5" />Serviços de Interesse</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICES_LIST.map(svc => (
                  <button key={svc} type="button" onClick={() => toggleService(svc)}
                    className={['px-2.5 py-1 rounded-full text-xs font-medium border transition-colors', lForm.services.includes(svc) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'].join(' ')}>
                    {svc}
                  </button>
                ))}
              </div>
            </div>

            {/* Localização */}
            <div>
              <Label className="flex items-center gap-1 mb-2"><MapPin className="w-3.5 h-3.5" />Localização</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input value={lForm.zipCode} onChange={e => setLForm({...lForm, zipCode: e.target.value})} placeholder="CEP" />
                <Input value={lForm.neighborhood} onChange={e => setLForm({...lForm, neighborhood: e.target.value})} placeholder="Bairro" />
                <Input value={lForm.city} onChange={e => setLForm({...lForm, city: e.target.value})} placeholder="Cidade" />
                <Input value={lForm.state} onChange={e => setLForm({...lForm, state: e.target.value})} placeholder="UF" maxLength={2} />
                <div className="col-span-2"><Input value={lForm.address} onChange={e => setLForm({...lForm, address: e.target.value})} placeholder="Endereço completo" /></div>
              </div>
            </div>

            <div>
              <Label>Parceiro Indicador *</Label>
              <Select value={lForm.consultantId} onValueChange={v => setLForm({...lForm, consultantId: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione o parceiro" /></SelectTrigger>
                <SelectContent>{consultants.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={lForm.status} onValueChange={v => setLForm({...lForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
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
            {linkProposalId && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <button type="button" onClick={() => setLinkVisiblePartner(p => !p)}
                  className={['w-10 h-5 rounded-full transition-colors relative shrink-0', linkVisiblePartner ? 'bg-emerald-500' : 'bg-slate-300'].join(' ')}>
                  <span className={['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', linkVisiblePartner ? 'translate-x-5' : 'translate-x-0.5'].join(' ')} />
                </button>
                <div>
                  <p className="text-xs font-medium text-slate-700">{linkVisiblePartner ? '✓ Visível para o parceiro' : 'Oculto do parceiro'}</p>
                  <p className="text-[10px] text-slate-400">O parceiro verá esta proposta no portal de leads</p>
                </div>
              </div>
            )}
            {linkProposalId && <p className="text-xs text-emerald-600">✓ A comissão será registrada automaticamente ao fechar a venda.</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setLinkDialog(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveLink}>Salvar Vínculo</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Credentials Dialog */}
      <Dialog open={accessDialog} onOpenChange={setAccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" /> Acesso Gerado com Sucesso
            </DialogTitle>
            <DialogDescription>
              Envie estas credenciais ao parceiro. A senha <strong>não poderá ser visualizada novamente</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">URL de Acesso</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border border-slate-200 rounded px-3 py-2 text-blue-600 break-all">
                    {window.location.origin}/partner/login
                  </code>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(`${window.location.origin}/partner/login`, 'url')}>
                    {copiedField === 'url' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border border-slate-200 rounded px-3 py-2 text-slate-800">
                    {accessCredentials?.email}
                  </code>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(accessCredentials?.email || '', 'email')}>
                    {copiedField === 'email' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Senha Temporária</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-bold bg-white border border-emerald-300 rounded px-3 py-2 text-emerald-700">
                    {accessCredentials?.password}
                  </code>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(accessCredentials?.password || '', 'password')}>
                    {copiedField === 'password' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
              ⚠️ Copie e envie agora via WhatsApp ou Email. Esta senha não será exibida novamente.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={() => {
                const text = `*Acesso ao Portal de Indicações*\n\nURL: ${window.location.origin}/partner/login\nEmail: ${accessCredentials?.email}\nSenha: ${accessCredentials?.password}\n\nAcesse e acompanhe seus leads e comissões!`;
                copyToClipboard(text, 'all');
              }}
            >
              {copiedField === 'all' ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copiar Tudo para WhatsApp
            </Button>
            <Button variant="outline" onClick={() => setAccessDialog(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Document Channel Dialog ─────────────────────────────────────── */}
      <Dialog open={docDialog} onOpenChange={setDocDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-500" /> Canal de Documentos
            </DialogTitle>
            <DialogDescription>Lead: <strong>{docLead?.clientName}</strong> · Parceiro: <strong>{docLead?.consultant?.name || consultants.find(c => c.id === docLead?.consultantId)?.name || '—'}</strong></DialogDescription>
          </DialogHeader>

          {/* Upload Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><FileUp className="w-4 h-4 text-purple-500" />Enviar Arquivo</p>
            <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Select value={uploadFileType} onValueChange={(v) => { setUploadFileType(v); if (v !== 'Outro (personalizado)') setCustomFileType(''); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tipo / finalidade do arquivo" /></SelectTrigger>
                  <SelectContent>{FILE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Observação (opcional)" />
              </div>
              {uploadFileType === 'Outro (personalizado)' && (
                <Input value={customFileType} onChange={e => setCustomFileType(e.target.value)}
                  placeholder="Digite o tipo do documento..." className="border-amber-300 focus:ring-amber-400" />
              )}
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex gap-2">
                <button type="button" onClick={() => setUploadVisibility('public')}
                  className={['flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors', uploadVisibility === 'public' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-200'].join(' ')}>
                  <Globe className="w-3 h-3" /> Visível ao parceiro
                </button>
                <button type="button" onClick={() => setUploadVisibility('private')}
                  className={['flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors', uploadVisibility === 'private' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'].join(' ')}>
                  <Lock className="w-3 h-3" /> Só admin
                </button>
              </div>
              <Button size="sm" onClick={uploadDoc} disabled={uploading} className="bg-purple-600 hover:bg-purple-700 text-white ml-auto">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <FileUp className="w-3.5 h-3.5 mr-1" />} Enviar
              </Button>
            </div>
          </div>

          {/* Document List */}
          <div className="mt-2">
            <p className="text-sm font-semibold text-slate-700 mb-3">Arquivos do Canal ({docs.length})</p>
            {docsLoading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>}
            {!docsLoading && docs.length === 0 && <p className="text-center text-slate-400 text-sm py-6">Nenhum documento ainda.</p>}
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3 hover:border-purple-200 transition-colors">
                  {isImage(doc.mimeType) ? (
                    <img src={resolveUrl(doc.url)} alt={doc.originalName} className="w-12 h-12 object-cover rounded-lg border" />
                  ) : (
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-lg">
                      {doc.mimeType === 'application/pdf' ? '📄' : doc.mimeType?.includes('sheet') ? '📊' : '📁'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.description || doc.originalName}</p>
                    <p className="text-xs text-slate-400">{doc.originalName} · {doc.uploadedBy} · {new Date(doc.createdAt).toLocaleDateString('pt-BR')}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <button type="button" onClick={() => toggleDocVisibility(doc)} disabled={togglingDoc === doc.id}
                        className={['flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors cursor-pointer', doc.visibility === 'public' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'].join(' ')}>
                        {doc.visibility === 'public' ? <><Globe className="w-2.5 h-2.5" />Visível ao parceiro</> : <><Lock className="w-2.5 h-2.5" />Só admin</>}
                      </button>
                      <span className="text-[10px] text-slate-400">{doc.uploadedByRole === 'admin' ? '👨‍💼 Admin' : '🤝 Parceiro'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <a href={resolveUrl(doc.url)} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500"><Download className="w-3.5 h-3.5" /></Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteDoc(doc.id)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setDocDialog(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
