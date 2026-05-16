import { useState, useEffect, useRef } from 'react';
import { api } from '@/api';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import {
  MessageSquare, Plus, Clock, CheckCircle2,
  XCircle, Send, ChevronRight, ArrowLeft, Loader2,
  Headphones, BarChart2, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  content: string;
  senderType: 'partner' | 'admin' | 'employee';
  senderName: string;
  createdAt: string;
}

interface PartnerRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  consultantName: string;
  assignedToName?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: 'Aberto',      color: 'text-amber-400 bg-amber-400/15 border-amber-400/30',     icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'Em Andamento',color: 'text-blue-400 bg-blue-400/15 border-blue-400/30',        icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  resolved:    { label: 'Resolvido',   color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30',icon: <CheckCircle2 className="w-3 h-3" /> },
  closed:      { label: 'Fechado',     color: 'text-zinc-400 bg-zinc-400/15 border-zinc-400/30',         icon: <XCircle className="w-3 h-3" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Baixa',  color: 'text-zinc-400' },
  medium: { label: 'Média',  color: 'text-amber-400' },
  high:   { label: 'Alta',   color: 'text-red-400' },
};

const CATEGORIES = [
  { value: 'fiscal',      label: '🧾 Fiscal / Nota Fiscal' },
  { value: 'commercial',  label: '📊 Comercial / Comissão' },
  { value: 'technical',   label: '🔧 Técnico / Sistema' },
  { value: 'support',     label: '💬 Suporte ao Cliente' },
  { value: 'other',       label: '📌 Outro' },
];

// ─── Componente StatusBadge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Componente NewRequestForm ─────────────────────────────────────────────
function NewRequestForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { partnerToken } = usePartnerAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'other', priority: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Preencha título e descrição');
      return;
    }
    setLoading(true);
    try {
      await api.createPartnerRequest(partnerToken!, form);
      toast.success('Requisição enviada com sucesso!');
      onCreated();
    } catch {
      toast.error('Erro ao enviar requisição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Nova Requisição
          </h2>
          <button onClick={onCancel} className="text-zinc-400 hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Categoria */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Categoria</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {/* Prioridade */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Prioridade</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.priority === p
                      ? p === 'high' ? 'bg-red-500/20 border-red-500 text-red-400'
                        : p === 'medium' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-zinc-600/40 border-zinc-500 text-zinc-300'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>
          {/* Título */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Título do Chamado *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Solicitação de nota fiscal — Lead João Silva"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              maxLength={120}
            />
          </div>
          {/* Descrição */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Descrição detalhada *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={4}
              placeholder="Descreva sua solicitação com o máximo de detalhes possível..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 transition-colors">
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Enviando...' : 'Enviar Requisição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente RequestThread ──────────────────────────────────────────────
function RequestThread({ request, onBack, onRefresh }: {
  request: PartnerRequest;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const { partnerToken } = usePartnerAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [request.messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.addPartnerRequestMessage(partnerToken!, request.id, message.trim());
      setMessage('');
      onRefresh();
    } catch {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const isResolved = request.status === 'resolved' || request.status === 'closed';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusBadge status={request.status} />
            <span className={`text-xs font-medium ${PRIORITY_CONFIG[request.priority]?.color || 'text-zinc-400'}`}>
              ● {PRIORITY_CONFIG[request.priority]?.label || 'Média'}
            </span>
          </div>
          <h2 className="text-white font-semibold text-base leading-tight">{request.title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {request.assignedToName && ` · Atribuído a ${request.assignedToName}`}
          </p>
        </div>
      </div>

      {/* Descrição inicial */}
      <div className="bg-zinc-800/60 rounded-xl p-4 mb-4 border border-zinc-700/50">
        <p className="text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wide">Descrição</p>
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{request.description}</p>
      </div>

      {/* Thread de mensagens */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1" style={{ maxHeight: '40vh' }}>
        {request.messages.length === 0 ? (
          <div className="text-center py-6 text-zinc-600 text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Nenhuma resposta ainda. Nossa equipe irá responder em breve.
          </div>
        ) : (
          request.messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === 'partner' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.senderType === 'partner'
                  ? 'bg-emerald-600/20 border border-emerald-600/30 text-emerald-50'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${
                  msg.senderType === 'partner' ? 'text-emerald-400' : 'text-blue-400'
                }`}>
                  {msg.senderType === 'partner' ? 'Você' : `${msg.senderName} (Equipe)`}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.senderType === 'partner' ? 'text-emerald-500/70' : 'text-zinc-500'}`}>
                  {format(new Date(msg.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de resposta */}
      {!isResolved ? (
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={2}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
          />
          <button
            onClick={sendMessage} disabled={sending || !message.trim()}
            className="px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 flex items-center"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-800/50 rounded-xl px-4 py-3 border border-zinc-700/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          Esta requisição foi {request.status === 'resolved' ? 'resolvida' : 'fechada'} e não aceita mais respostas.
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────
export default function PartnerRequests() {
  const { partnerToken } = usePartnerAuth();
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PartnerRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  const load = async () => {
    try {
      const data = await api.getMyPartnerRequests(partnerToken!);
      setRequests(data || []);
    } catch {
      toast.error('Erro ao carregar requisições');
    } finally {
      setLoading(false);
    }
  };

  const refreshSelected = async () => {
    if (!selected) return;
    try {
      const updated = await api.getMyPartnerRequest(partnerToken!, selected.id);
      setSelected(updated);
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);
  const stats = {
    total: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved' || r.status === 'closed').length,
  };

  if (selected) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <RequestThread
            request={selected}
            onBack={() => setSelected(null)}
            onRefresh={refreshSelected}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Headphones className="w-6 h-6 text-emerald-400" /> Requisições
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Abra chamados e acompanhe o atendimento da equipe</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" /> Nova Requisição
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: <BarChart2 className="w-4 h-4 text-zinc-400" />, color: 'border-zinc-700' },
            { label: 'Abertos', value: stats.open, icon: <Clock className="w-4 h-4 text-amber-400" />, color: 'border-amber-800/50' },
            { label: 'Em Andamento', value: stats.progress, icon: <Zap className="w-4 h-4 text-blue-400" />, color: 'border-blue-800/50' },
            { label: 'Resolvidos', value: stats.resolved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, color: 'border-emerald-800/50' },
          ].map(s => (
            <div key={s.label} className={`bg-zinc-900 border ${s.color} rounded-xl p-3`}>
              <div className="flex items-center justify-between mb-1">{s.icon} <span className="text-xl font-bold text-white">{s.value}</span></div>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'open', label: 'Abertos' },
            { value: 'in_progress', label: 'Em Andamento' },
            { value: 'resolved', label: 'Resolvidos' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-400 font-medium">Nenhuma requisição encontrada</p>
            <p className="text-zinc-600 text-sm mt-1">Clique em "Nova Requisição" para abrir um chamado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const unreadAdmin = req.messages?.filter(m => m.senderType !== 'partner').length || 0;
              return (
                <button
                  key={req.id}
                  onClick={() => setSelected(req)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 text-left transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-700 transition-colors">
                      <Headphones className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm font-semibold text-white truncate">{req.title}</p>
                        <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover:text-zinc-400 transition-colors" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={req.status} />
                        <span className="text-xs text-zinc-500">
                          {CATEGORIES.find(c => c.value === req.category)?.label.split(' ').slice(1).join(' ') || req.category}
                        </span>
                        {unreadAdmin > 0 && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
                            {unreadAdmin} resposta{unreadAdmin > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 mt-1.5">
                        {format(new Date(req.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <NewRequestForm
          onCreated={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
