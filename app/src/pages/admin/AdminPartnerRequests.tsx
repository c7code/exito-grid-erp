import { useState, useEffect, useRef } from 'react';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageSquare, Clock, CheckCircle2, XCircle, Loader2,
  Send, Headphones, User,
  BarChart2, Zap, ArrowLeft, RefreshCw,
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
  consultantId: string;
  consultantName: string;
  assignedToId?: string;
  assignedToName?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: 'Aberto',       color: 'text-amber-400 bg-amber-400/15 border-amber-400/30',      icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'Em Andamento', color: 'text-blue-400 bg-blue-400/15 border-blue-400/30',         icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  resolved:    { label: 'Resolvido',    color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  closed:      { label: 'Fechado',      color: 'text-zinc-400 bg-zinc-400/15 border-zinc-400/30',          icon: <XCircle className="w-3 h-3" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  low:    { label: 'Baixa',  color: 'text-zinc-400',  dot: 'bg-zinc-500' },
  medium: { label: 'Média',  color: 'text-amber-400', dot: 'bg-amber-500' },
  high:   { label: 'Alta',   color: 'text-red-400',   dot: 'bg-red-500' },
};

const CATEGORIES: Record<string, string> = {
  fiscal:     '🧾 Fiscal',
  commercial: '📊 Comercial',
  technical:  '🔧 Técnico',
  support:    '💬 Suporte',
  other:      '📌 Outro',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Painel de Detalhe ─────────────────────────────────────────────────────
function RequestDetail({ request, onBack, onRefresh }: {
  request: PartnerRequest;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isResolved = request.status === 'resolved' || request.status === 'closed';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [request.messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.addAdminRequestMessage(request.id, message.trim());
      setMessage('');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Sem permissão para responder');
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      await api.updatePartnerRequestStatus(request.id, status);
      toast.success('Status atualizado');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Sem permissão para alterar status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors mt-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusBadge status={request.status} />
            <span className={`text-xs font-medium flex items-center gap-1 ${PRIORITY_CONFIG[request.priority]?.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[request.priority]?.dot}`} />
              Prioridade {PRIORITY_CONFIG[request.priority]?.label}
            </span>
            <span className="text-xs text-zinc-500">{CATEGORIES[request.category] || request.category}</span>
          </div>
          <h2 className="text-white font-semibold text-base">{request.title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            <span className="text-zinc-400 font-medium">{request.consultantName}</span>
            {' · '}
            {format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {request.assignedToName && ` · Atribuído: ${request.assignedToName}`}
          </p>
        </div>
      </div>

      {/* Ações de status */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => changeStatus(key)}
            disabled={updatingStatus || request.status === key}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${
              request.status === key
                ? cfg.color + ' opacity-100'
                : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>

      {/* Descrição */}
      <div className="bg-zinc-800/60 rounded-xl p-4 mb-4 border border-zinc-700/50">
        <p className="text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wide flex items-center gap-1">
          <User className="w-3 h-3" /> Descrição do Parceiro
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{request.description}</p>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1" style={{ maxHeight: '35vh' }}>
        {request.messages.length === 0 ? (
          <div className="text-center py-6 text-zinc-600 text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Nenhuma mensagem ainda.
          </div>
        ) : (
          request.messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType !== 'partner' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.senderType !== 'partner'
                  ? 'bg-blue-600/20 border border-blue-600/30 text-blue-50'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${
                  msg.senderType !== 'partner' ? 'text-blue-400' : 'text-emerald-400'
                }`}>
                  {msg.senderType === 'partner' ? `${msg.senderName} (Parceiro)` : `${msg.senderName} (Equipe)`}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.senderType !== 'partner' ? 'text-blue-500/70' : 'text-zinc-500'}`}>
                  {format(new Date(msg.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isResolved ? (
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={2}
            placeholder="Responder o parceiro... (Enter para enviar)"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
          />
          <button
            onClick={sendMessage} disabled={sending || !message.trim()}
            className="px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 flex items-center"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-800/50 rounded-xl px-4 py-3 border border-zinc-700/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          Requisição {request.status === 'resolved' ? 'resolvida' : 'fechada'}. Mude o status para reabrir.
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────
export default function AdminPartnerRequests() {
  const { } = useAuth(); // auth context mantido para futuras verificações de role
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PartnerRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [noPermission, setNoPermission] = useState(false);

  const load = async () => {
    setLoading(true);
    setNoPermission(false);
    try {
      const data = await api.getAllPartnerRequests({
        status: filterStatus || undefined,
        category: filterCategory || undefined,
      });
      setRequests(data || []);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setNoPermission(true);
      } else {
        toast.error('Erro ao carregar requisições');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshSelected = async () => {
    if (!selected) return;
    await load();
    try {
      const updated = await api.getAdminPartnerRequest(selected.id);
      setSelected(updated);
    } catch {}
  };

  useEffect(() => { load(); }, [filterStatus, filterCategory]);

  const stats = {
    total: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved' || r.status === 'closed').length,
  };

  // Tela sem permissão
  if (noPermission) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">Acesso Restrito</h2>
        <p className="text-zinc-400 max-w-sm">
          Você não tem permissão para acessar o módulo de Requisições de Parceiros.
          Solicite ao administrador que libere a permissão <strong className="text-zinc-200">partner-requests</strong> na sua conta.
        </p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <RequestDetail
            request={selected}
            onBack={() => setSelected(null)}
            onRefresh={refreshSelected}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Headphones className="w-6 h-6 text-blue-400" /> Requisições de Parceiros
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Gerencie e responda as solicitações dos parceiros</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: <BarChart2 className="w-4 h-4 text-zinc-400" />, color: 'border-zinc-700' },
            { label: 'Abertos', value: stats.open, icon: <Clock className="w-4 h-4 text-amber-400" />, color: stats.open > 0 ? 'border-amber-700/60' : 'border-zinc-700' },
            { label: 'Em Andamento', value: stats.progress, icon: <Zap className="w-4 h-4 text-blue-400" />, color: 'border-zinc-700' },
            { label: 'Resolvidos', value: stats.resolved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, color: 'border-zinc-700' },
          ].map(s => (
            <div key={s.label} className={`bg-zinc-900 border ${s.color} rounded-xl p-3`}>
              <div className="flex items-center justify-between mb-1">{s.icon} <span className="text-xl font-bold text-white">{s.value}</span></div>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos os Status</option>
            <option value="open">Aberto</option>
            <option value="in_progress">Em Andamento</option>
            <option value="resolved">Resolvido</option>
            <option value="closed">Fechado</option>
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Todas as Categorias</option>
            <option value="fiscal">Fiscal</option>
            <option value="commercial">Comercial</option>
            <option value="technical">Técnico</option>
            <option value="support">Suporte</option>
            <option value="other">Outro</option>
          </select>
        </div>

        {/* Tabela/Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-400 font-medium">Nenhuma requisição encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const pCfg = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.medium;
              const adminReplies = req.messages?.filter(m => m.senderType !== 'partner').length || 0;
              const partnerReplies = req.messages?.filter(m => m.senderType === 'partner').length || 0;
              return (
                <button
                  key={req.id}
                  onClick={() => setSelected(req)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 text-left transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {/* Prioridade indicator */}
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${pCfg.dot}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-white">{req.title}</p>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {req.consultantName}
                        </span>
                        <span>{CATEGORIES[req.category] || req.category}</span>
                        <span className={pCfg.color}>{pCfg.label}</span>
                        {req.assignedToName && (
                          <span className="text-blue-400">→ {req.assignedToName}</span>
                        )}
                        {req.messages?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {req.messages.length} msg{req.messages.length > 1 ? 's' : ''}
                            {partnerReplies > adminReplies && (
                              <span className="ml-1 text-amber-400 font-medium">• aguardando resposta</span>
                            )}
                          </span>
                        )}
                        <span>{format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
