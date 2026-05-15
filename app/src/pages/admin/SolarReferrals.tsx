
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  UserPlus, Users, DollarSign, TrendingUp, Search, Filter, Plus, X,
  ChevronDown, Download, Link2, Key, Eye, EyeOff, CheckCircle2,
  Clock, Award, MoreHorizontal, Phone, MapPin, Loader2, RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type LeadStatus = 'new'|'contacted'|'qualified'|'account_analysis'|'proposal_sent'|'negotiation'|'closed_won'|'closed_lost'|'no_profile';
type TabKey = 'leads'|'consultants'|'commissions'|'dashboard';
type ConsultantTab = 'personal'|'address'|'commercial'|'access';

const LEAD_COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'new', label: 'Novo', color: '#6366f1' },
  { status: 'contacted', label: 'Contactado', color: '#f59e0b' },
  { status: 'qualified', label: 'Qualificado', color: '#0284c7' },
  { status: 'proposal_sent', label: 'Proposta Enviada', color: '#0ea5e9' },
  { status: 'negotiation', label: 'Negociação', color: '#f97316' },
  { status: 'closed_won', label: 'Convertido', color: '#10b981' },
  { status: 'closed_lost', label: 'Perdido', color: '#ef4444' },
];

const STATUS_LABEL: Record<string, string> = {
  new:'Novo', contacted:'Contactado', qualified:'Qualificado',
  account_analysis:'Análise', proposal_sent:'Proposta Enviada',
  negotiation:'Negociação', closed_won:'Convertido', closed_lost:'Perdido', no_profile:'Sem Perfil',
};

const CHANNEL_LABEL: Record<string,string> = { solar:'Solar', oem:'O&M', equipment:'Equipamentos', all:'Todos' };
const COMM_STATUS: Record<string,{label:string;bg:string;text:string}> = {
  pending:{label:'Pendente',bg:'#fefce8',text:'#a16207'},
  approved:{label:'Aprovada',bg:'#eff6ff',text:'#1d4ed8'},
  paid:{label:'Paga',bg:'#f0fdf4',text:'#15803d'},
};
const fmt = (v:number) => Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

// ─── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ lead, onStatusChange, onLinkProposal }:{lead:any;onStatusChange:(id:string,s:LeadStatus)=>void;onLinkProposal:(lead:any)=>void}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <p className="font-semibold text-gray-900 text-sm truncate">{lead.name}</p>
      {lead.consultant?.name && <p className="text-xs text-gray-400 mt-0.5 truncate">via {lead.consultant.name}</p>}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {lead.phone && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3"/>{lead.phone}</span>}
        {lead.city && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3"/>{lead.city}</span>}
      </div>
      {lead.potentialValue && <p className="text-xs text-emerald-600 font-semibold mt-1.5">{fmt(Number(lead.potentialValue))}</p>}
      <div className="flex gap-1 mt-2">
        <select value={lead.status}
          onChange={e => { e.stopPropagation(); onStatusChange(lead.id, e.target.value as LeadStatus); }}
          onClick={e => e.stopPropagation()}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-1.5 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400">
          {LEAD_COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
        </select>
        <button onClick={e=>{e.stopPropagation();onLinkProposal(lead);}}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Vincular Proposta">
          <Link2 className="w-3.5 h-3.5"/>
        </button>
      </div>
    </div>
  );
}

// ─── Consultant Dialog (4 tabs) ───────────────────────────────────────────────
const emptyConsultant = {
  name:'', email:'', phone:'', whatsapp:'', document:'', status:'active' as const,
  zipCode:'', street:'', city:'', state:'', region:'',
  responsibleUserId:'', weeklyGoal:'', monthlyGoal:'', commissionPercent:'2', accessChannel:'all', bankName:'', pixKey:'',
  notes:'',
};

function ConsultantDialog({ open, onClose, initial, onSaved }:{open:boolean;onClose:()=>void;initial?:any;onSaved:()=>void}) {
  const [tab, setTab] = useState<ConsultantTab>('personal');
  const [form, setForm] = useState({ ...emptyConsultant });
  const [users, setUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [accessResult, setAccessResult] = useState<{email:string;password:string}|null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) setForm({ ...emptyConsultant, ...initial, weeklyGoal: String(initial.weeklyGoal||''), monthlyGoal: String(initial.monthlyGoal||''), commissionPercent: String(initial.commissionPercent||'2') });
    else setForm({ ...emptyConsultant });
    setTab('personal'); setAccessResult(null);
    api.getUsers().then(setUsers).catch(()=>{});
  }, [open, initial]);

  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCep = async (cep:string) => {
    if (cep.replace(/\D/g,'').length < 8) return;
    setCepLoading(true);
    try {
      const d = await api.fetchCepData(cep);
      setForm(f => ({ ...f, street: d.logradouro||f.street, city: d.localidade||f.city, state: d.uf||f.state }));
    } catch { toast.error('CEP não encontrado'); }
    finally { setCepLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    setIsSaving(true);
    try {
      const payload = { ...form, weeklyGoal: Number(form.weeklyGoal)||0, monthlyGoal: Number(form.monthlyGoal)||0, commissionPercent: Number(form.commissionPercent)||2 };
      if (initial?.id) await api.updateReferralConsultant(initial.id, payload);
      else await api.createReferralConsultant(payload);
      toast.success(initial?.id ? 'Consultor atualizado' : 'Consultor criado');
      onSaved(); onClose();
    } catch(e:any) { toast.error(e?.response?.data?.message||'Erro ao salvar'); }
    finally { setIsSaving(false); }
  };

  const handleGenerateAccess = async () => {
    if (!initial?.id) { toast.error('Salve o consultor primeiro'); return; }
    setIsGenerating(true);
    try {
      const r = await api.generateConsultantAccess(initial.id);
      setAccessResult({ email: r.email, password: r.password });
      toast.success('Acesso gerado! Guarde a senha.');
    } catch(e:any) { toast.error(e?.response?.data?.message||'Erro ao gerar acesso'); }
    finally { setIsGenerating(false); }
  };

  const tabs: { key:ConsultantTab; label:string }[] = [
    {key:'personal',label:'Dados Pessoais'},{key:'address',label:'Endereço'},
    {key:'commercial',label:'Comercial'},{key:'access',label:'Acesso Portal'},
  ];

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900">
          <h2 className="font-bold text-white">{initial?.id ? 'Editar Consultor' : 'Novo Consultor'}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex border-b border-gray-100 overflow-x-auto flex-shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 }>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab==='personal' && <>
            {[{l:'Nome *',k:'name',t:'text'},{l:'E-mail',k:'email',t:'email'},{l:'Telefone',k:'phone',t:'tel'},{l:'WhatsApp',k:'whatsapp',t:'tel'},{l:'CPF / CNPJ',k:'document',t:'text'}].map(({l,k,t})=>(
              <div key={k}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                <input type={t} value={(form as any)[k]} onChange={set(k)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"/>
              </div>
            ))}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={set('status')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm">
                {['active','inactive','training','idle'].map(s=><option key={s} value={s}>{s==='active'?'Ativo':s==='inactive'?'Inativo':s==='training'?'Em Treinamento':'Ocioso'}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea value={form.notes} onChange={set('notes')} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm resize-none"/>
            </div>
          </>}
          {tab==='address' && <>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">CEP {cepLoading&&<span className="text-amber-500 text-xs ml-1">buscando...</span>}</label>
              <input type="text" value={form.zipCode} onChange={e=>{set('zipCode')(e);handleCep(e.target.value);}} placeholder="00000-000" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"/>
            </div>
            {[{l:'Logradouro',k:'street'},{l:'Cidade',k:'city'},{l:'Estado',k:'state'},{l:'Região de Atuação',k:'region'}].map(({l,k})=>(
              <div key={k}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                <input type="text" value={(form as any)[k]} onChange={set(k)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"/>
              </div>
            ))}
          </>}
          {tab==='commercial' && <>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Responsável Interno</label>
              <select value={form.responsibleUserId} onChange={set('responsibleUserId')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm">
                <option value="">Selecione...</option>
                {users.map((u:any)=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            {[{l:'Meta Semanal',k:'weeklyGoal',t:'number'},{l:'Meta Mensal',k:'monthlyGoal',t:'number'},{l:'Comissão (%)',k:'commissionPercent',t:'number'}].map(({l,k,t})=>(
              <div key={k}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                <input type={t} value={(form as any)[k]} onChange={set(k)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"/>
              </div>
            ))}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Canal de Atuação</label>
              <select value={form.accessChannel} onChange={set('accessChannel')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm">
                {Object.entries(CHANNEL_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {[{l:'Banco',k:'bankName'},{l:'Chave PIX',k:'pixKey'}].map(({l,k})=>(
              <div key={k}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                <input type="text" value={(form as any)[k]} onChange={set(k)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"/>
              </div>
            ))}
          </>}
          {tab==='access' && <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm font-medium text-blue-800 mb-1">E-mail de acesso</p>
              <p className="text-blue-600 font-mono text-sm">{form.email || <span className="text-blue-400 italic">Defina o e-mail na aba Dados Pessoais</span>}</p>
            </div>
            {!initial?.id && <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">Salve o consultor primeiro para poder gerar o acesso ao portal.</div>}
            {initial?.id && <>
              <button onClick={handleGenerateAccess} disabled={isGenerating||!form.email}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                style={{background:'linear-gradient(135deg,#059669,#0284c7)'}}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Key className="w-4 h-4"/>}
                {isGenerating ? 'Gerando...' : 'Gerar Acesso ao Portal'}
              </button>
              {accessResult && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <p className="text-sm font-bold text-emerald-800">✅ Acesso gerado! Guarde — não será exibido novamente.</p>
                  <div><p className="text-xs text-emerald-600 font-medium">E-mail:</p><p className="font-mono text-sm text-emerald-900">{accessResult.email}</p></div>
                  <div><p className="text-xs text-emerald-600 font-medium">Senha temporária:</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-emerald-900">{showPass ? accessResult.password : '••••••••••••'}</p>
                      <button onClick={()=>setShowPass(s=>!s)} className="text-emerald-600 hover:text-emerald-800">
                        {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {initial?.lastLoginAt && <p className="text-xs text-gray-400">Último acesso: {new Date(initial.lastLoginAt).toLocaleString('pt-BR')}</p>}
            </>}
          </div>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          {tab!=='access' && <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>}
        </div>
      </div>
    </div>
  );
}

// ─── Link Proposal Dialog ─────────────────────────────────────────────────────
function LinkProposalDialog({ lead, onClose, onLinked }:{lead:any;onClose:()=>void;onLinked:()=>void}) {
  const [proposalId, setProposalId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const handleLink = async () => {
    if (!proposalId.trim()) { toast.error('Informe o ID da proposta'); return; }
    setIsSaving(true);
    try {
      await api.linkReferralLeadToProposal(lead.id, proposalId.trim());
      toast.success('Proposta vinculada!');
      onLinked(); onClose();
    } catch { toast.error('Erro ao vincular'); }
    finally { setIsSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Vincular Proposta</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400"/></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-600">Lead: <strong>{lead.name}</strong></p>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">ID da Proposta</label>
            <input type="text" value={proposalId} onChange={e=>setProposalId(e.target.value)} placeholder="Cole o UUID da proposta..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"/>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Cancelar</button>
          <button onClick={handleLink} disabled={isSaving} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60">
            {isSaving?'Vinculando...':'Vincular'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Dialog ─────────────────────────────────────────────────────────────
function LeadDialog({ open, onClose, consultants, onSaved }:{open:boolean;onClose:()=>void;consultants:any[];onSaved:()=>void}) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', city:'', state:'', consultantId:'', potentialValue:'', notes:'' });
  const [isSaving, setIsSaving] = useState(false);
  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setForm(f=>({...f,[k]:e.target.value}));
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    setIsSaving(true);
    try {
      await api.createReferralLead({ ...form, potentialValue: form.potentialValue ? Number(form.potentialValue) : undefined });
      toast.success('Lead criado!'); onSaved(); onClose();
      setForm({ name:'', phone:'', email:'', city:'', state:'', consultantId:'', potentialValue:'', notes:'' });
    } catch { toast.error('Erro ao criar lead'); }
    finally { setIsSaving(false); }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900">
          <h2 className="font-bold text-white">Novo Lead</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {[{l:'Nome *',k:'name',t:'text'},{l:'Telefone',k:'phone',t:'tel'},{l:'E-mail',k:'email',t:'email'},{l:'Cidade',k:'city',t:'text'},{l:'Estado',k:'state',t:'text'},{l:'Valor Potencial (R$)',k:'potentialValue',t:'number'}].map(({l,k,t})=>(
            <div key={k}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input type={t} value={(form as any)[k]} onChange={set(k)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"/>
            </div>
          ))}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Consultor Indicador</label>
            <select value={form.consultantId} onChange={set('consultantId')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm">
              <option value="">Selecione...</option>
              {consultants.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm resize-none"/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Cancelar</button>
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-60">
            {isSaving?'Salvando...':'Criar Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SolarReferrals() {
  const [activeTab, setActiveTab] = useState<TabKey>('leads');
  const [leads, setLeads] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterConsultant, setFilterConsultant] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [showConsultantDialog, setShowConsultantDialog] = useState(false);
  const [editConsultant, setEditConsultant] = useState<any>(null);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [linkLead, setLinkLead] = useState<any>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [l, c, cm, d] = await Promise.all([
        api.getReferralLeads({ consultantId: filterConsultant||undefined }),
        api.getReferralConsultants({}),
        api.getReferralCommissions({}),
        api.getReferralsDashboard(),
      ]);
      setLeads(l); setConsultants(c); setCommissions(cm); setDashboard(d);
    } catch { toast.error('Erro ao carregar dados'); }
    finally { setIsLoading(false); }
  }, [filterConsultant]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;
    if (!LEAD_COLUMNS.find(c => c.status === newStatus)) return;
    try {
      await api.updateReferralLead(leadId, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    } catch { toast.error('Erro ao mover lead'); }
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      await api.updateReferralLead(id, { status });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      if (status === 'closed_won') {
        const lead = leads.find(l => l.id === id);
        if (lead?.consultantId) {
          const consultant = consultants.find(c => c.id === lead.consultantId);
          if (consultant && lead.potentialValue) {
            const ok = window.confirm(Lead convertido! Criar comissão automática para ?);
            if (ok) {
              const saleValue = Number(lead.potentialValue);
              await api.createReferralCommission({ consultantId: consultant.id, leadId: id, saleValue, commissionPercent: Number(consultant.commissionPercent||2) });
              toast.success('Comissão criada automaticamente!');
              fetchAll();
            }
          }
        }
      }
    } catch { toast.error('Erro ao atualizar status'); }
  };

  const exportCSV = () => {
    const rows = [['Nome','Telefone','Email','Cidade','Status','Consultor','Valor Potencial','Data']];
    filteredLeads.forEach(l => rows.push([l.name,l.phone||'',l.email||'',l.city||'',STATUS_LABEL[l.status]||l.status,l.consultant?.name||'',l.potentialValue||'',new Date(l.createdAt).toLocaleDateString('pt-BR')]));
    const csv = rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv); a.download = 'leads.csv'; a.click();
  };

  const filteredLeads = leads.filter(l => {
    if (search && !l.name?.toLowerCase().includes(search.toLowerCase()) && !l.phone?.includes(search)) return false;
    if (filterMonth) { const m = new Date(l.createdAt).toISOString().slice(0,7); if (m !== filterMonth) return false; }
    return true;
  });

  const pendingCommissions = commissions.filter(c=>c.status==='pending').reduce((s,c)=>s+Number(c.commissionValue||0),0);
  const paidCommissions = commissions.filter(c=>c.status==='paid').reduce((s,c)=>s+Number(c.commissionValue||0),0);

  const TABS: { key:TabKey; label:string; icon:any }[] = [
    {key:'leads',label:'Kanban de Leads',icon:TrendingUp},
    {key:'consultants',label:'Consultores',icon:Users},
    {key:'commissions',label:'Comissões',icon:DollarSign},
    {key:'dashboard',label:'Dashboard',icon:Award},
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900">Canal de Indicações</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie consultores, leads e comissões do canal solar.</p>
        </div>
        <div className="flex gap-2">
          {activeTab==='leads' && <>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"><Download className="w-4 h-4"/>Exportar</button>
            <button onClick={()=>setShowLeadDialog(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold"><Plus className="w-4 h-4"/>Novo Lead</button>
          </>}
          {activeTab==='consultants' && <button onClick={()=>{setEditConsultant(null);setShowConsultantDialog(true);}} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold"><UserPlus className="w-4 h-4"/>Novo Consultor</button>}
          <button onClick={fetchAll} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"><RefreshCw className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Consultores',value:dashboard?.activeConsultants||0,icon:Users,color:'#0284c7'},
          {label:'Leads/Mês',value:dashboard?.leadsThisMonth||0,icon:TrendingUp,color:'#10b981'},
          {label:'Pendente',value:fmt(pendingCommissions),icon:Clock,color:'#f59e0b'},
          {label:'Pago',value:fmt(paidCommissions),icon:Award,color:'#8b5cf6'},
        ].map(({label,value,icon:Icon,color})=>(
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:color+'18'}}><Icon className="w-5 h-5" style={{color}}/></div>
            <div><p className="text-gray-500 text-xs">{label}</p><p className="font-bold text-gray-900 text-lg leading-tight">{value}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            className={lex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all }>
            <t.icon className="w-4 h-4"/>{t.label}
          </button>
        ))}
      </div>

      {/* Filters bar */}
      {(activeTab==='leads'||activeTab==='commissions') && (
        <div className="flex gap-2 flex-wrap">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar lead..." className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-48"/>
          </div>
          <select value={filterConsultant} onChange={e=>setFilterConsultant(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">Todos os consultores</option>
            {consultants.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500"/></div>
      ) : (
        <>
          {/* KANBAN TAB */}
          {activeTab==='leads' && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {LEAD_COLUMNS.map(col=>{
                  const colLeads = filteredLeads.filter(l=>l.status===col.status);
                  return (
                    <SortableContext key={col.status} items={colLeads.map(l=>l.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex-shrink-0 w-60 rounded-xl overflow-hidden" style={{background:col.color+'10',border:1px solid 30}}>
                        <div className="px-3 py-2.5 flex items-center justify-between" style={{background:col.color+'20'}}>
                          <span className="text-sm font-bold" style={{color:col.color}}>{col.label}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{background:col.color+'30',color:col.color}}>{colLeads.length}</span>
                        </div>
                        <div className="p-2 space-y-2 min-h-[100px]">
                          {colLeads.map(lead=>(
                            <KanbanCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} onLinkProposal={setLinkLead}/>
                          ))}
                        </div>
                      </div>
                    </SortableContext>
                  );
                })}
              </div>
            </DndContext>
          )}

          {/* CONSULTANTS TAB */}
          {activeTab==='consultants' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  {['Consultor','Contato','Canal','Comissão','Leads','Status',''].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {consultants.map((c:any)=>(
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3"><p className="font-semibold text-gray-900 text-sm">{c.name}</p><p className="text-xs text-gray-400">{c.email}</p></td>
                      <td className="px-5 py-3 text-sm text-gray-600">{c.phone||'—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{CHANNEL_LABEL[c.accessChannel]||'—'}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-emerald-600">{c.commissionPercent}%</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{c.leads?.length||0}</td>
                      <td className="px-5 py-3">
                        <span className={	ext-xs font-semibold px-2 py-0.5 rounded-full }>
                          {c.status==='active'?'Ativo':c.status==='training'?'Treinamento':c.status==='idle'?'Ocioso':'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={()=>{setEditConsultant(c);setShowConsultantDialog(true);}} className="text-gray-400 hover:text-gray-700 transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* COMMISSIONS TAB */}
          {activeTab==='commissions' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  {['Consultor','Lead','Venda','Comissão','Status',''].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {commissions.map((c:any)=>{
                    const sc = COMM_STATUS[c.status]||COMM_STATUS.pending;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.consultant?.name||'—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{c.lead?.name||'—'}</td>
                        <td className="px-5 py-3 text-sm font-mono text-gray-800">{c.saleValue?fmt(Number(c.saleValue)):'—'}</td>
                        <td className="px-5 py-3 text-sm font-bold text-emerald-600 font-mono">{c.commissionValue?fmt(Number(c.commissionValue)):'—'}</td>
                        <td className="px-5 py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{background:sc.bg,color:sc.text}}>{sc.label}</span></td>
                        <td className="px-5 py-3">
                          {c.status==='pending'&&<button onClick={async()=>{try{await api.updateReferralCommission(c.id,{status:'approved'});toast.success('Aprovada');fetchAll();}catch{toast.error('Erro');}}} className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">Aprovar</button>}
                          {c.status==='approved'&&<button onClick={async()=>{try{await api.updateReferralCommission(c.id,{status:'paid'});toast.success('Marcada como paga');fetchAll();}catch{toast.error('Erro');}}} className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">Pagar</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab==='dashboard' && dashboard && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Leads por Mês (últimos 6 meses)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dashboard.leadsByMonth||[]} margin={{top:5,right:20,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="month" tick={{fontSize:12}} tickFormatter={(v:string)=>v.slice(5)}/>
                    <YAxis tick={{fontSize:12}}/>
                    <Tooltip formatter={(v:any)=>[v,'Leads']} labelFormatter={(l:string)=>Mês: }/>
                    <Bar dataKey="total" fill="#f59e0b" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Top Consultores por Leads</h3></div>
                <table className="w-full"><thead><tr className="border-b border-gray-100">{['Consultor','Total','Convertidos'].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(dashboard.leadsByConsultant||[]).map((c:any)=>(
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{c.total}</td>
                      <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{c.won}</span></td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <ConsultantDialog open={showConsultantDialog} onClose={()=>{setShowConsultantDialog(false);setEditConsultant(null);}} initial={editConsultant} onSaved={fetchAll}/>
      <LeadDialog open={showLeadDialog} onClose={()=>setShowLeadDialog(false)} consultants={consultants} onSaved={fetchAll}/>
      {linkLead && <LinkProposalDialog lead={linkLead} onClose={()=>setLinkLead(null)} onLinked={fetchAll}/>}
    </div>
  );
}

