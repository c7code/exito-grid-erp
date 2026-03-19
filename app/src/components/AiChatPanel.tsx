import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api';
import {
    Zap, X, Send, Loader2, Bot, User, Sparkles, Trash2,
    FileText, Package, AlertTriangle, Shield, Clock, Users, XCircle, Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const quickSuggestions = [
    { icon: '📦', text: 'Listar materiais do catálogo' },
    { icon: '🏗️', text: 'Quais estruturas eu tenho cadastradas?' },
    { icon: '🏭', text: 'Resumo dos fornecedores' },
    { icon: '💰', text: 'Quais regras de markup estão ativas?' },
    { icon: '📋', text: 'Me ajude a montar uma proposta' },
    { icon: '⚡', text: 'Materiais para extensão de rede BT' },
];

export default function AiChatPanel() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAnalyze, setShowAnalyze] = useState(false);
    const [analyzeText, setAnalyzeText] = useState('');
    const [analyzeResults, setAnalyzeResults] = useState<any[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Token management (admin only)
    const [showTokens, setShowTokens] = useState(false);
    const [tokens, setTokens] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [tokenTargetUser, setTokenTargetUser] = useState<string>('');
    const [tokenDuration, setTokenDuration] = useState(60);
    const [creatingToken, setCreatingToken] = useState(false);

    const loadTokens = async () => {
        try {
            const t = await api.getAiActionTokens();
            setTokens(t);
        } catch { setTokens([]); }
    };

    const loadUsers = async () => {
        try {
            const u = await api.getUsers();
            setAllUsers(u.filter((u: any) => u.role !== 'admin'));
        } catch { setAllUsers([]); }
    };

    const handleCreateToken = async () => {
        setCreatingToken(true);
        try {
            await api.createAiActionToken({
                targetUserId: tokenTargetUser || undefined,
                durationMinutes: tokenDuration,
                description: tokenTargetUser ? `Para usuário específico` : 'Para todos os usuários',
            });
            toast.success('Ações da IA liberadas!');
            setTokenTargetUser('');
            loadTokens();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao criar token');
        }
        setCreatingToken(false);
    };

    const handleRevokeToken = async (id: string) => {
        try {
            await api.revokeAiActionToken(id);
            toast.success('Token revogado');
            loadTokens();
        } catch { toast.error('Erro ao revogar'); }
    };

    useEffect(() => {
        if (showTokens && isAdmin) { loadTokens(); loadUsers(); }
    }, [showTokens]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || loading) return;

        const userMsg: ChatMessage = { role: 'user', content: msg };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
            const response = await api.aiChat(msg, history);
            setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || 'Erro ao se comunicar com a IA. Verifique a API key nas configurações.';
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errorMsg}` }]);
        }
        setLoading(false);
    };

    const handleAnalyze = async () => {
        if (!analyzeText.trim()) return;
        setAnalyzing(true);
        try {
            const response = await api.aiAnalyzeMaterials(analyzeText);
            setAnalyzeResults(response.results || []);
            if (response.results?.length === 0) toast.error('Nenhum material identificado');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro na análise');
        }
        setAnalyzing(false);
    };

    const clearChat = () => {
        setMessages([]);
        setAnalyzeResults([]);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    'fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110',
                    open
                        ? 'bg-slate-800 text-white rotate-90'
                        : 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900'
                )}
            >
                {open ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Zap className="w-5 h-5 md:w-6 md:h-6" />}
            </button>

            {/* Chat Panel */}
            <div className={cn(
                'fixed z-50 bg-white shadow-2xl flex flex-col transition-all duration-300',
                // Mobile: full screen
                'inset-0 md:inset-auto',
                // Desktop: right panel
                'md:bottom-4 md:right-4 md:top-auto md:left-auto md:w-[420px] md:h-[600px] md:rounded-2xl md:border',
                open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-3 md:p-4 border-b bg-gradient-to-r from-slate-900 to-slate-800 text-white md:rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-slate-900" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Exito IA</h3>
                            <p className="text-[10px] text-slate-400">Assistente inteligente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn('h-8 w-8 hover:bg-slate-700', showTokens ? 'text-amber-400' : 'text-slate-400 hover:text-white')}
                                onClick={() => { setShowTokens(!showTokens); setShowAnalyze(false); }}
                                title="Gerenciar ações da IA"
                            >
                                <Shield className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                            onClick={() => { setShowAnalyze(!showAnalyze); setShowTokens(false); }}
                            title="Analisar lista de materiais"
                        >
                            <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                            onClick={clearChat}
                            title="Limpar chat"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                            onClick={() => setOpen(false)}
                            title="Minimizar"
                        >
                            <Minus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Token Management Panel (Admin) */}
                {showTokens && isAdmin && (
                    <div className="p-3 border-b bg-blue-50 space-y-3 max-h-64 overflow-y-auto">
                        <p className="text-xs font-bold text-blue-800 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Liberar Ações da IA
                        </p>

                        {/* Create Token */}
                        <div className="space-y-2 bg-white p-2 rounded-lg border">
                            <div className="flex gap-2">
                                <select
                                    value={tokenTargetUser}
                                    onChange={e => setTokenTargetUser(e.target.value)}
                                    className="flex-1 text-xs border rounded px-2 py-1 bg-white"
                                >
                                    <option value="">🌐 Todos os usuários</option>
                                    {allUsers.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                                <select
                                    value={tokenDuration}
                                    onChange={e => setTokenDuration(Number(e.target.value))}
                                    className="text-xs border rounded px-2 py-1 bg-white w-24"
                                >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={60}>1 hora</option>
                                    <option value={120}>2 horas</option>
                                    <option value={480}>8 horas</option>
                                    <option value={1440}>24 horas</option>
                                </select>
                            </div>
                            <Button
                                onClick={handleCreateToken}
                                disabled={creatingToken}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                                size="sm"
                            >
                                {creatingToken ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                                Liberar Ações
                            </Button>
                        </div>

                        {/* Active Tokens */}
                        {tokens.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-blue-600 font-medium">Tokens ativos:</p>
                                {tokens.map((t: any) => (
                                    <div key={t.id} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3 h-3 text-blue-500" />
                                            <span>{t.targetUser?.name || 'Todos'}</span>
                                            <span className="text-slate-400 flex items-center gap-0.5">
                                                <Clock className="w-2.5 h-2.5" />
                                                {new Date(t.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRevokeToken(t.id)}
                                            className="text-red-400 hover:text-red-600"
                                            title="Revogar"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {tokens.length === 0 && (
                            <p className="text-[10px] text-blue-400 text-center">Nenhum token ativo. As ações estão bloqueadas para não-admins.</p>
                        )}
                    </div>
                )}

                {/* Analyze Panel */}
                {showAnalyze && (
                    <div className="p-3 border-b bg-amber-50 space-y-2">
                        <p className="text-xs font-medium text-amber-800">📋 Colar lista de materiais do fornecedor:</p>
                        <textarea
                            className="w-full border rounded-lg p-2 text-xs h-24 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="Cole aqui a lista de materiais...&#10;Ex:&#10;10x Cabo 10mm²&#10;5x Poste 9m DT&#10;2x Transformador 75kVA"
                            value={analyzeText}
                            onChange={e => setAnalyzeText(e.target.value)}
                        />
                        <Button
                            onClick={handleAnalyze}
                            disabled={analyzing || !analyzeText.trim()}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs h-8"
                            size="sm"
                        >
                            {analyzing ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Analisando...</> : <><Sparkles className="w-3 h-3 mr-1" /> Analisar e fazer matching</>}
                        </Button>

                        {analyzeResults.length > 0 && (
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {analyzeResults.map((r, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-white rounded border text-xs">
                                        <div className="flex-1">
                                            <p className="font-medium">{r.originalDescription}</p>
                                            {r.matchedName ? (
                                                <p className="text-green-600 flex items-center gap-1">
                                                    <Package className="w-3 h-3" /> {r.matchedName}
                                                    <Badge className="text-[8px] bg-green-100 text-green-700">{r.confidence}</Badge>
                                                </p>
                                            ) : (
                                                <p className="text-amber-600 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Não encontrado no catálogo
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-slate-400">{r.quantity} {r.unit}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4">
                            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                                <Sparkles className="w-8 h-8 text-amber-500" />
                            </div>
                            <h4 className="font-bold text-slate-700 mb-1">Olá! Sou o Exito IA</h4>
                            <p className="text-xs text-slate-400 mb-4">
                                Posso ajudar com materiais, estruturas, propostas, custos, normas e muito mais.
                            </p>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                {quickSuggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(s.text)}
                                        className="text-left p-2 border rounded-lg hover:bg-amber-50 hover:border-amber-200 transition-colors text-xs text-slate-600"
                                    >
                                        <span className="mr-1">{s.icon}</span> {s.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                {msg.role === 'assistant' && (
                                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot className="w-3 h-3 text-amber-600" />
                                    </div>
                                )}
                                <div className={cn(
                                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                                    msg.role === 'user'
                                        ? 'bg-amber-500 text-slate-900 rounded-br-sm'
                                        : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                                )}>
                                    <p className="whitespace-pre-wrap break-words text-xs md:text-sm">{msg.content}</p>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                                        <User className="w-3 h-3 text-slate-600" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3 h-3 text-amber-600" />
                            </div>
                            <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-white md:rounded-b-2xl">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder="Pergunte algo..."
                            className="flex-1 text-sm"
                            disabled={loading}
                        />
                        <Button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 h-9 w-9 p-0"
                            size="icon"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
