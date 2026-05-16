import { useState, useEffect, useRef } from 'react';
import { api } from '@/api';
import { MessageSquare, Clock, CheckCircle2, XCircle, Loader2, Send, Headphones, User, BarChart2, Zap, ArrowLeft, RefreshCw, Paperclip, X, FileIcon, Play } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Attachment { url: string; name: string; mimeType?: string; size?: number; }
interface Message { id: string; content: string; senderType: string; senderName: string; createdAt: string; attachments?: Attachment[]; }
interface PartnerRequest { id: string; title: string; description: string; category: string; customCategory?: string; status: string; priority: string; consultantId: string; consultantName: string; assignedToName?: string; messages: Message[]; createdAt: string; }

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Aberto', color: 'text-amber-400 bg-amber-400/15 border-amber-400/30', icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'Em Andamento', color: 'text-blue-400 bg-blue-400/15 border-blue-400/30', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  resolved: { label: 'Resolvido', color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  closed: { label: 'Fechado', color: 'text-zinc-400 bg-zinc-400/15 border-zinc-400/30', icon: <XCircle className="w-3 h-3" /> },
};
const PRIO_CFG: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: 'Baixa', color: 'text-zinc-400', dot: 'bg-zinc-500' },
  medium: { label: 'Média', color: 'text-amber-400', dot: 'bg-amber-500' },
  high: { label: 'Alta', color: 'text-red-400', dot: 'bg-red-500' },
};
const CATS: Record<string, string> = { fiscal: '🧾 Fiscal', commercial: '📊 Comercial', technical: '🔧 Técnico', support: '💬 Suporte', document_request: '📄 Solicitação de Documento', other: '📌 Outro' };

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CFG[status] || STATUS_CFG.open;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>{s.icon}{s.label}</span>;
}

function AttachmentPreview({ att }: { att: Attachment }) {
  const isImage = att.mimeType?.startsWith('image/');
  const isVideo = att.mimeType?.startsWith('video/');
  if (isImage) return <a href={att.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-zinc-600 max-w-[200px]"><img src={att.url} alt={att.name} className="w-full h-32 object-cover hover:opacity-90 transition-opacity" /></a>;
  if (isVideo) return <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg text-xs text-zinc-200 hover:bg-zinc-600 max-w-[200px]"><Play className="w-4 h-4 text-blue-400 flex-shrink-0" /><span className="truncate">{att.name}</span></a>;
  return <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg text-xs text-zinc-200 hover:bg-zinc-600 max-w-[200px]"><FileIcon className="w-4 h-4 text-blue-400 flex-shrink-0" /><span className="truncate">{att.name}</span></a>;
}

function FilePickerPreview({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 border-t border-zinc-700">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300">
          <FileIcon className="w-3 h-3 text-blue-400" /><span className="max-w-[120px] truncate">{f.name}</span>
          <button onClick={() => onRemove(i)} className="text-zinc-500 hover:text-white ml-0.5"><X className="w-3 h-3" /></button>
        </div>
      ))}
    </div>
  );
}

function RequestDetail({ request, onBack, onRefresh }: { request: PartnerRequest; onBack: () => void; onRefresh: () => void }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isResolved = request.status === 'resolved' || request.status === 'closed';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [request.messages]);

  const getCatLabel = () => {
    if (request.category === 'other' && request.customCategory) return `📌 ${request.customCategory}`;
    return CATS[request.category] || request.category;
  };

  const sendMessage = async () => {
    if (!message.trim() && !files.length) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('content', message.trim());
      files.forEach(f => fd.append('files', f));
      await api.addAdminRequestMessage(request.id, fd);
      setMessage(''); setFiles([]); onRefresh();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Sem permissão para responder'); }
    finally { setSending(false); }
  };

  const changeStatus = async (s: string) => {
    setUpdatingStatus(true);
    try { await api.updatePartnerRequestStatus(request.id, s); toast.success('Status atualizado'); onRefresh(); }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Sem permissão'); }
    finally { setUpdatingStatus(false); }
  };

  const p = PRIO_CFG[request.priority] || PRIO_CFG.medium;

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex-shrink-0 mt-0.5"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusBadge status={request.status} />
            <span className={`text-xs font-medium flex items-center gap-1 ${p.color}`}><span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />Prioridade {p.label}</span>
            <span className="text-xs text-zinc-500">{getCatLabel()}</span>
          </div>
          <h2 className="text-white font-semibold text-sm sm:text-base">{request.title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5"><span className="text-zinc-400 font-medium">{request.consultantName}</span> · {format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}{request.assignedToName && ` · ${request.assignedToName}`}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.entries(STATUS_CFG).map(([k, cfg]) => (
          <button key={k} onClick={() => changeStatus(k)} disabled={updatingStatus || request.status === k}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${request.status === k ? cfg.color : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}>
            {cfg.icon}{cfg.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-800/60 rounded-xl p-4 mb-4 border border-zinc-700/50">
        <p className="text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" />Descrição do Parceiro</p>
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{request.description}</p>
      </div>

      <div className="overflow-y-auto space-y-3 mb-3" style={{ maxHeight: '40vh' }}>
        {!request.messages?.length ? (
          <div className="text-center py-6 text-zinc-600 text-sm"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />Nenhuma mensagem ainda.</div>
        ) : request.messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderType !== 'partner' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 space-y-2 ${msg.senderType !== 'partner' ? 'bg-blue-600/20 border border-blue-600/30' : 'bg-zinc-800 border border-zinc-700'}`}>
              <p className={`text-xs font-semibold ${msg.senderType !== 'partner' ? 'text-blue-400' : 'text-emerald-400'}`}>
                {msg.senderType === 'partner' ? `${msg.senderName} (Parceiro)` : `${msg.senderName} (Equipe)`}
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
            <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-700 transition-colors flex-shrink-0">
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1} placeholder="Responder parceiro... (Enter para enviar)"
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none resize-none py-2 min-h-[36px] max-h-[120px]" style={{ overflow: 'auto' }} />
            <button onClick={sendMessage} disabled={sending || (!message.trim() && !files.length)}
              className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 flex-shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
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

export default function AdminPartnerRequests() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PartnerRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [noPermission, setNoPermission] = useState(false);

  const load = async () => {
    setLoading(true); setNoPermission(false);
    try { const d = await api.getAllPartnerRequests({ status: filterStatus || undefined, category: filterCategory || undefined }); setRequests(d || []); }
    catch (err: any) { if (err?.response?.status === 403) setNoPermission(true); else toast.error('Erro ao carregar'); }
    finally { setLoading(false); }
  };

  const refreshSelected = async () => {
    await load();
    if (selected) try { setSelected(await api.getAdminPartnerRequest(selected.id)); } catch {}
  };

  useEffect(() => { load(); }, [filterStatus, filterCategory]);

  const stats = { total: requests.length, open: requests.filter(r => r.status === 'open').length, progress: requests.filter(r => r.status === 'in_progress').length, resolved: requests.filter(r => ['resolved', 'closed'].includes(r.status)).length };

  if (noPermission) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4"><XCircle className="w-8 h-8 text-red-400" /></div>
      <h2 className="text-white text-xl font-semibold mb-2">Acesso Restrito</h2>
      <p className="text-zinc-400 max-w-sm text-sm">Solicite ao administrador a permissão <strong className="text-zinc-200">partner-requests</strong> na sua conta.</p>
    </div>
  );

  if (selected) return (
    <div className="p-4 sm:p-6 bg-zinc-950 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <RequestDetail request={selected} onBack={() => setSelected(null)} onRefresh={refreshSelected} />
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-zinc-950 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Headphones className="w-5 h-5 text-blue-400" />Requisições de Parceiros</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Gerencie e responda as solicitações</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm transition-colors w-full sm:w-auto justify-center">
            <RefreshCw className="w-4 h-4" />Atualizar
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
          {[{ l: 'Total', v: stats.total, i: <BarChart2 className="w-4 h-4 text-zinc-400" />, c: 'border-zinc-700' },
            { l: 'Abertos', v: stats.open, i: <Clock className="w-4 h-4 text-amber-400" />, c: stats.open > 0 ? 'border-amber-700/60' : 'border-zinc-700' },
            { l: 'Andamento', v: stats.progress, i: <Zap className="w-4 h-4 text-blue-400" />, c: 'border-zinc-700' },
            { l: 'Resolvidos', v: stats.resolved, i: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, c: 'border-zinc-700' },
          ].map(s => (
            <div key={s.l} className={`bg-zinc-900 border ${s.c} rounded-xl p-3`}>
              <div className="flex items-center justify-between mb-1">{s.i}<span className="text-xl font-bold">{s.v}</span></div>
              <p className="text-xs text-zinc-500">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
            <option value="">Todos os Status</option>
            <option value="open">Aberto</option>
            <option value="in_progress">Em Andamento</option>
            <option value="resolved">Resolvido</option>
            <option value="closed">Fechado</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
            <option value="">Todas as Categorias</option>
            {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
        ) : !requests.length ? (
          <div className="text-center py-14 bg-zinc-900/50 rounded-2xl border border-zinc-800"><MessageSquare className="w-12 h-12 mx-auto mb-3 text-zinc-700" /><p className="text-zinc-400 font-medium">Nenhuma requisição</p></div>
        ) : (
          <div className="space-y-2.5">
            {requests.map(req => {
              const p = PRIO_CFG[req.priority] || PRIO_CFG.medium;
              const partnerReplies = req.messages?.filter(m => m.senderType === 'partner').length || 0;
              const adminReplies = req.messages?.filter(m => m.senderType !== 'partner').length || 0;
              const catLabel = req.category === 'other' && req.customCategory ? `📌 ${req.customCategory}` : CATS[req.category] || req.category;
              return (
                <button key={req.id} onClick={() => setSelected(req)} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 text-left transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${p.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                        <p className="text-sm font-semibold text-white leading-tight">{req.title}</p>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{req.consultantName}</span>
                        <span>{catLabel}</span>
                        <span className={p.color}>{p.label}</span>
                        {req.messages?.length > 0 && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{req.messages.length} msg{partnerReplies > adminReplies && <span className="text-amber-400 ml-1">• aguardando resposta</span>}</span>}
                        <span>{format(new Date(req.createdAt), 'dd/MM HH:mm', { locale: ptBR })}</span>
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
