import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    MessageSquare,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    X,
    Eye,
    Send,
    FileText,
    Film,
    Download,
    Paperclip,
    Search,
    User,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/api';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    open: { label: 'Aberta', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    in_progress: { label: 'Em Análise', color: 'bg-amber-100 text-amber-700', icon: Clock },
    resolved: { label: 'Resolvida', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    closed: { label: 'Fechada', color: 'bg-slate-100 text-slate-700', icon: XCircle },
};

const typeLabels: Record<string, string> = {
    information: 'Informação',
    service: 'Serviço',
    complaint: 'Reclamação',
    approval: 'Aprovação',
    other: 'Outro',
};

const priorityLabels: Record<string, { label: string; color: string }> = {
    low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
    medium: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
    high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminClientRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [responseText, setResponseText] = useState('');
    const [responseStatus, setResponseStatus] = useState('in_progress');
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');

    const loadRequests = async () => {
        try {
            const data = await api.getAllClientRequests();
            setRequests(data || []);
        } catch (err) {
            console.error('Erro ao carregar solicitações:', err);
            toast.error('Erro ao carregar solicitações');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadRequests(); }, []);

    const handleRespond = async () => {
        if (!selectedRequest || !responseText.trim()) {
            toast.error('Digite uma resposta');
            return;
        }
        setSubmitting(true);
        try {
            await api.respondToClientRequest(selectedRequest.id, {
                adminResponse: responseText,
                status: responseStatus,
            });
            toast.success('Resposta enviada com sucesso!');
            setSelectedRequest(null);
            setResponseText('');
            setResponseStatus('in_progress');
            setIsLoading(true);
            await loadRequests();
        } catch (err) {
            toast.error('Erro ao responder solicitação');
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickStatus = async (requestId: string, status: string) => {
        try {
            await api.respondToClientRequest(requestId, {
                adminResponse: status === 'in_progress' ? 'Solicitação em análise pela equipe.' : 'Solicitação encerrada.',
                status,
            });
            toast.success('Status atualizado!');
            setIsLoading(true);
            await loadRequests();
        } catch (err) {
            toast.error('Erro ao atualizar status');
        }
    };

    // Filters
    const filtered = requests.filter(r => {
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (filterType !== 'all' && r.type !== filterType) return false;
        if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchSubject = r.subject?.toLowerCase().includes(q);
            const matchClient = r.client?.name?.toLowerCase().includes(q) || r.client?.email?.toLowerCase().includes(q);
            const matchDesc = r.description?.toLowerCase().includes(q);
            if (!matchSubject && !matchClient && !matchDesc) return false;
        }
        return true;
    });

    const openCount = requests.filter(r => r.status === 'open').length;
    const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
    const resolvedCount = requests.filter(r => r.status === 'resolved').length;
    const totalCount = requests.length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Solicitações de Clientes</h1>
                <p className="text-slate-500">Gerencie e responda as solicitações recebidas</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalCount}</p>
                            <p className="text-xs text-slate-500">Total</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('open')}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{openCount}</p>
                            <p className="text-xs text-slate-500">Abertas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('in_progress')}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{inProgressCount}</p>
                            <p className="text-xs text-slate-500">Em Análise</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('resolved')}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{resolvedCount}</p>
                            <p className="text-xs text-slate-500">Resolvidas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por assunto, cliente ou descrição..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="border rounded-md px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all">Todos Status</option>
                                <option value="open">Abertas</option>
                                <option value="in_progress">Em Análise</option>
                                <option value="resolved">Resolvidas</option>
                                <option value="closed">Fechadas</option>
                            </select>
                            <select className="border rounded-md px-3 py-2 text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="all">Todos Tipos</option>
                                <option value="information">Informação</option>
                                <option value="service">Serviço</option>
                                <option value="complaint">Reclamação</option>
                                <option value="approval">Aprovação</option>
                                <option value="other">Outro</option>
                            </select>
                            <select className="border rounded-md px-3 py-2 text-sm" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                                <option value="all">Prioridade</option>
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Requests Table */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhuma solicitação encontrada</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map((req: any) => {
                        const status = statusConfig[req.status] || statusConfig.open;
                        const StatusIcon = status.icon;
                        const priority = priorityLabels[req.priority] || priorityLabels.medium;
                        const hasAttachments = req.attachments && req.attachments.length > 0;

                        return (
                            <Card key={req.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 md:p-5">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Status Icon */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${status.color}`}>
                                            <StatusIcon className="w-5 h-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold truncate">{req.subject}</h3>
                                                <Badge className={status.color}>{status.label}</Badge>
                                                <Badge variant="outline">{typeLabels[req.type] || req.type}</Badge>
                                                <Badge className={priority.color}>{priority.label}</Badge>
                                                {hasAttachments && (
                                                    <Badge variant="outline" className="gap-1">
                                                        <Paperclip className="w-3 h-3" /> {req.attachments.length}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    {req.client?.name || req.client?.email || 'Cliente'}
                                                </span>
                                                {req.work && <span>📋 {req.work.code}</span>}
                                                <span>{new Date(req.createdAt).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{req.description}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {req.status === 'open' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                                    onClick={() => handleQuickStatus(req.id, 'in_progress')}
                                                >
                                                    <Clock className="w-4 h-4 mr-1" /> Analisar
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                className="bg-slate-800 hover:bg-slate-900 text-white"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setResponseText(req.adminResponse || '');
                                                    setResponseStatus(req.status === 'open' ? 'in_progress' : req.status);
                                                }}
                                            >
                                                <Eye className="w-4 h-4 mr-1" /> Ver
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Detail / Response Panel */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg">{selectedRequest.subject}</CardTitle>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge className={statusConfig[selectedRequest.status]?.color}>
                                        {statusConfig[selectedRequest.status]?.label}
                                    </Badge>
                                    <Badge variant="outline">{typeLabels[selectedRequest.type]}</Badge>
                                    <Badge className={priorityLabels[selectedRequest.priority]?.color}>
                                        {priorityLabels[selectedRequest.priority]?.label}
                                    </Badge>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Client Info */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-amber-700" />
                                </div>
                                <div>
                                    <p className="font-medium">{selectedRequest.client?.name || 'Cliente'}</p>
                                    <p className="text-sm text-slate-500">
                                        {selectedRequest.client?.email}
                                        {selectedRequest.client?.phone && ` • ${selectedRequest.client.phone}`}
                                    </p>
                                </div>
                            </div>

                            {/* Work */}
                            {selectedRequest.work && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-sm font-medium text-blue-800">📋 Obra vinculada</p>
                                    <p className="text-sm text-blue-700">{selectedRequest.work.code} — {selectedRequest.work.title}</p>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <Label className="text-sm font-medium text-slate-600 block mb-2">Descrição do cliente</Label>
                                <div className="p-4 bg-slate-50 rounded-lg border text-sm whitespace-pre-wrap">
                                    {selectedRequest.description}
                                </div>
                            </div>

                            {/* Attachments */}
                            {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                                <div>
                                    <Label className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                                        <Paperclip className="w-4 h-4" /> Anexos ({selectedRequest.attachments.length})
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                        {selectedRequest.attachments.map((att: any) => (
                                            <a
                                                key={att.id}
                                                href={`${API_URL}${att.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors group"
                                            >
                                                {att.mimeType?.startsWith('image/') ? (
                                                    <img
                                                        src={`${API_URL}${att.url}`}
                                                        alt={att.originalName}
                                                        className="w-14 h-14 object-cover rounded-lg border"
                                                    />
                                                ) : att.mimeType?.startsWith('video/') ? (
                                                    <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                                                        <Film className="w-6 h-6 text-purple-500" />
                                                    </div>
                                                ) : (
                                                    <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center">
                                                        <FileText className="w-6 h-6 text-amber-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{att.originalName}</p>
                                                    <p className="text-xs text-slate-400">{formatFileSize(att.size)}</p>
                                                </div>
                                                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Previous Response */}
                            {selectedRequest.adminResponse && selectedRequest.respondedAt && (
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <p className="text-sm font-medium text-emerald-800">Resposta anterior:</p>
                                    <p className="text-sm text-emerald-700 mt-1 whitespace-pre-wrap">{selectedRequest.adminResponse}</p>
                                    <p className="text-xs text-emerald-500 mt-2">
                                        Por {selectedRequest.respondedBy} em {new Date(selectedRequest.respondedAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            )}

                            {/* Response Form */}
                            <div className="space-y-3 border-t pt-4">
                                <Label className="font-medium">Responder ao cliente</Label>
                                <Textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Escreva sua resposta para o cliente..."
                                    rows={4}
                                />
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <select
                                        className="border rounded-md px-3 py-2 text-sm flex-1"
                                        value={responseStatus}
                                        onChange={(e) => setResponseStatus(e.target.value)}
                                    >
                                        <option value="in_progress">Em Análise</option>
                                        <option value="resolved">Resolvida</option>
                                        <option value="closed">Fechada</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setSelectedRequest(null)}>
                                            Cancelar
                                        </Button>
                                        <Button
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                                            onClick={handleRespond}
                                            disabled={submitting || !responseText.trim()}
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                                            Enviar Resposta
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 text-center">
                                Criada em {new Date(selectedRequest.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
