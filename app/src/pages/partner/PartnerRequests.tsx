import { useState, useEffect, useRef } from 'react';
import { api } from '@/api';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { MessageSquare, Plus, Clock, CheckCircle2, XCircle, Send, ChevronRight, ArrowLeft, Loader2, Headphones, BarChart2, Zap, Paperclip, X, FileIcon, Play } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Attachment { url: string; name: string; mimeType?: string; size?: number; }
interface Message { id: string; content: string; senderType: string; senderName: string; createdAt: string; attachments?: Attachment[]; }
interface PartnerRequest { id: string; title: string; description: string; category: string; customCategory?: string; status: string; priority: string; messages: Message[]; createdAt: string; }

const STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Aberto', color: 'text-amber-400 bg-amber-400/15 border-amber-400/30', icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'Em Andamento', color: 'text-blue-400 bg-blue-400/15 border-blue-400/30', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  resolved: { label: 'Resolvido', color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  closed: { label: 'Fechado', color: 'text-zinc-400 bg-zinc-400/15 border-zinc-400/30', icon: <XCircle className="w-3 h-3" /> },
};
const PRIORITY: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-zinc-400' },
  medium: { label: 'Média', color: 'text-amber-400' },
  high: { label: 'Alta', color: 'text-red-400' },
};
const BASE_CATEGORIES = [
  { value: 'fiscal', label: '🧾 Fiscal / Nota Fiscal' },
  { value: 'commercial', label: '📊 Comercial / Comissão' },
  { value: 'technical', label: '🔧 Técnico / Sistema' },
  { value: 'support', label: '💬 Suporte ao Cliente' },
  { value: 'document_request', label: '📄 Solicitação de Documento' },
  { value: 'other', label: '📌 Outro (especificar)' },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] || STATUS.open;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>{s.icon}{s.label}</span>;
}

function AttachmentPreview({ att }: { att: Attachment }) {
  const isImage = att.mimeType?.startsWith('image/');
  const isVideo = att.mimeType?.startsWith('video/');
  if (isImage) return (
    <a href={att.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-zinc-600 max-w-[200px]">
      <img src={att.url} alt={att.name} className="w-full h-32 object-cover hover:opacity-90 transition-opacity" />
    </a>
  );
  if (isVideo) return (
    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg text-xs text-zinc-200 hover:bg-zinc-600 transition-colors max-w-[200px]">
      <Play className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span className="truncate">{att.name}</span>
    </a>
  );
  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg text-xs text-zinc-200 hover:bg-zinc-600 transition-colors max-w-[200px]">
      <FileIcon className="w-4 h-4 text-blue-400 flex-shrink-0" /><span className="truncate">{att.name}</span>
    </a>
  );
}

function FilePickerPreview({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 border-t border-zinc-700">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300">
          <FileIcon className="w-3 h-3 text-blue-400" />
          <span className="max-w-[120px] truncate">{f.name}</span>
          <button onClick={() => onRemove(i)} className="text-zinc-500 hover:text-white ml-0.5"><X className="w-3 h-3" /></button>
        </div>
      ))}
    </div>
  );
}

function NewRequestForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { partnerToken } = usePartnerAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'support', priority: 'medium', customCategory: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { toast.error('Preencha título e descrição'); return; }
    if (form.category === 'other' && !form.customCategory.trim()) { toast.error('Descreva a categoria'); return; }
    setLoading(true);
    try {
      await api.createPartnerRequest(partnerToken!, { ...form, customCategory: form.category === 'other' ? form.customCategory : undefined });
      toast.success('Requisição enviada!'); onCreated();
    } catch { toast.error('Erro ao enviar'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 px-5 py-4 border-b border-zinc-700 flex items-center justify-between z-10">
          <h2 className="text-white font-semibold flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-400" />Nova Requisição</h2>
          <button onClick={onCancel} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Categoria</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
              {BASE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {form.category === 'other' && (
              <input value={form.customCategory} onChange={e => setForm(p => ({ ...p, customCategory: e.target.value }))}
                placeholder="Descreva a categoria..." maxLength={60}
                className="mt-2 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            )}
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Prioridade</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map(p => (
                <button key={p} type="button" onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${form.priority === p
                    ? p === 'high' ? 'bg-red-500/20 border-red-500 text-red-400' : p === 'medium' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-zinc-600/40 border-zinc-500 text-zinc-300'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}>
                  {PRIORITY[p].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Título *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} maxLength={120}
              placeholder="Ex: Solicitação de nota fiscal do cliente João" 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Descrição detalhada *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Descreva sua solicitação com detalhes..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequestThread({ request, onBack, onRefresh }: { request: PartnerRequest; onBack: () => void; onRefresh: () => void }) {
  const { partnerToken } = usePartnerAuth();
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isResolved = request.status === 'resolved' || request.status === 'closed';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [request.messages]);

  const getCategoryLabel = () => {
    const cat = BASE_CATEGORIES.find(c => c.value === request.category);
    if (request.category === 'other' && request.customCategory) return `📌 ${request.customCategory}`;
    return cat?.label.split(' ').slice(1).join(' ') || request.category;
  };

  const sendMessage = async () => {
    if (!message.trim() && !files.length) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('content', message.trim());
      files.forEach(f => fd.append('files', f));
      await api.addPartnerRequestMessage(partnerToken!, request.id, fd as any);
      setMessage(''); setFiles([]);
      onRefresh();
    } catch { toast.error('Erro ao enviar'); } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-start gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex-shrink-0 mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusBadge status={request.status} />
            <span className={`text-xs font-medium ${PRIORITY[request.priority]?.color}`}>● {PRIORITY[request.priority]?.label}</span>
          </div>
          <h2 className="text-white font-semibold text-sm sm:text-base leading-tight">{request.title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{getCategoryLabel()} · {format(new Date(request.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
      </div>

      <div className="bg-zinc-800/60 rounded-xl p-4 mb-4 border border-zinc-700/50">
        <p className="text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wide">Descrição</p>
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{request.description}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3" style={{ maxHeight: '45vh' }}>
        {!request.messages?.length ? (
          <div className="text-center py-8 text-zinc-600 text-sm"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />Nenhuma resposta ainda.</div>
        ) : request.messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderType === 'partner' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 space-y-2 ${msg.senderType === 'partner' ? 'bg-emerald-600/20 border border-emerald-600/30' : 'bg-zinc-800 border border-zinc-700'}`}>
              <p className={`text-xs font-semibold ${msg.senderType === 'partner' ? 'text-emerald-400' : 'text-blue-400'}`}>
                {msg.senderType === 'partner' ? 'Você' : `${msg.senderName} (Equipe)`}
              </p>
              {msg.content && <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
              {msg.attachments?.map((a, i) => <AttachmentPreview key={i} att={a} />)}
              <p className="text-xs text-zinc-500">{format(new Date(msg.createdAt), 'dd/MM HH:mm', { locale: ptBR })}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!isResolved ? (
        <div className="border border-zinc-700 rounded-xl overflow-hidden bg-zinc-800/50">
          <FilePickerPreview files={files} onRemove={i => setFiles(f => f.filter((_, idx) => idx !== i))} />
          <div className="flex items-end gap-2 p-2">
            <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden"
              onChange={e => { const f = Array.from(e.target.files || []); if (files.length + f.length > 5) { toast.error('Máximo 5 arquivos'); return; } setFiles(p => [...p, ...f]); e.target.value = ''; }} />
            <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 transition-colors flex-shrink-0">
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1} placeholder="Mensagem... (Enter para enviar)"
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none resize-none py-2 min-h-[36px] max-h-[120px]"
              style={{ overflow: 'auto' }} />
            <button onClick={sendMessage} disabled={sending || (!message.trim() && !files.length)}
              className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 flex-shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-800/50 rounded-xl px-4 py-3 border border-zinc-700/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          Esta requisição está {request.status === 'resolved' ? 'resolvida' : 'fechada'}.
        </div>
      )}
    </div>
  );
}

export default function PartnerRequests() {
  const { partnerToken } = usePartnerAuth();
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PartnerRequest | null>(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try { const d = await api.getMyPartnerRequests(partnerToken!); setRequests(d || []); }
    catch { toast.error('Erro ao carregar'); } finally { setLoading(false); }
  };

  const refreshSelected = async () => {
    if (!selected) return;
    try { const u = await api.getMyPartnerRequest(partnerToken!, selected.id); setSelected(u); setRequests(p => p.map(r => r.id === u.id ? u : r)); } catch {}
  };

  useEffect(() => { load(); }, []);

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);
  const stats = { total: requests.length, open: requests.filter(r => r.status === 'open').length, progress: requests.filter(r => r.status === 'in_progress').length, resolved: requests.filter(r => r.status === 'resolved' || r.status === 'closed').length };

  if (selected) return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto"><RequestThread request={selected} onBack={() => setSelected(null)} onRefresh={refreshSelected} /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2"><Headphones className="w-5 h-5 text-emerald-400" />Requisições</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Abra chamados e acompanhe o atendimento</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-emerald-900/30 w-full sm:w-auto">
            <Plus className="w-4 h-4" />Nova Requisição
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
          {[{ l: 'Total', v: stats.total, i: <BarChart2 className="w-4 h-4 text-zinc-400" />, c: 'border-zinc-700' },
            { l: 'Abertos', v: stats.open, i: <Clock className="w-4 h-4 text-amber-400" />, c: stats.open > 0 ? 'border-amber-700/50' : 'border-zinc-700' },
            { l: 'Andamento', v: stats.progress, i: <Zap className="w-4 h-4 text-blue-400" />, c: 'border-zinc-700' },
            { l: 'Resolvidos', v: stats.resolved, i: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, c: 'border-zinc-700' },
          ].map(s => (
            <div key={s.l} className={`bg-zinc-900 border ${s.c} rounded-xl p-3`}>
              <div className="flex items-center justify-between mb-1">{s.i}<span className="text-xl font-bold text-white">{s.v}</span></div>
              <p className="text-xs text-zinc-500">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[{ v: 'all', l: 'Todos' }, { v: 'open', l: 'Abertos' }, { v: 'in_progress', l: 'Em Andamento' }, { v: 'resolved', l: 'Resolvidos' }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.v ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'}`}>
              {f.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
        ) : !filtered.length ? (
          <div className="text-center py-14 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-400 font-medium">Nenhuma requisição</p>
            <p className="text-zinc-600 text-sm mt-1">Clique em "Nova Requisição" para abrir um chamado</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(req => (
              <button key={req.id} onClick={() => setSelected(req)} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 text-left transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-white leading-tight">{req.title}</p>
                      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={req.status} />
                      {(req.messages?.filter(m => m.senderType !== 'partner').length || 0) > 0 && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">{req.messages.filter(m => m.senderType !== 'partner').length} resposta(s)</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1.5">{format(new Date(req.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {showForm && <NewRequestForm onCreated={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}
    </div>
  );
}
