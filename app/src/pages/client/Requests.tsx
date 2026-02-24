import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    MessageSquare,
    Plus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    X,
    Upload,
    FileText,
    Image as ImageIcon,
    Film,
    Trash2,
    Download,
    Paperclip,
} from 'lucide-react';
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

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (mimeType?.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500" />;
    return <FileText className="w-5 h-5 text-amber-500" />;
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [works, setWorks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        type: 'information',
        subject: '',
        description: '',
        workId: '',
        priority: 'medium',
    });

    const loadData = async () => {
        try {
            const [reqData, worksData] = await Promise.all([
                api.getClientMyRequests(),
                api.getClientMyWorks(),
            ]);
            setRequests(reqData || []);
            setWorks(worksData || []);
        } catch (err) {
            console.error('Erro ao carregar solicitações:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleFiles = (files: FileList | File[]) => {
        const newFiles = Array.from(files);
        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createClientRequest({
                type: form.type,
                subject: form.subject,
                description: form.description,
                workId: form.workId || undefined,
                priority: form.priority,
            }, selectedFiles.length > 0 ? selectedFiles : undefined);
            toast.success('Solicitação criada com sucesso!');
            setShowDialog(false);
            setForm({ type: 'information', subject: '', description: '', workId: '', priority: 'medium' });
            setSelectedFiles([]);
            setIsLoading(true);
            await loadData();
        } catch (err) {
            toast.error('Erro ao criar solicitação');
        } finally {
            setSubmitting(false);
        }
    };

    const openCount = requests.filter(r => r.status === 'open').length;
    const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
    const resolvedCount = requests.filter(r => r.status === 'resolved').length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Solicitações</h1>
                    <p className="text-slate-500">Envie e acompanhe suas solicitações</p>
                </div>
                <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => setShowDialog(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Solicitação
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{openCount}</p>
                            <p className="text-sm text-slate-500">Abertas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{inProgressCount}</p>
                            <p className="text-sm text-slate-500">Em Análise</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{resolvedCount}</p>
                            <p className="text-sm text-slate-500">Resolvidas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {requests.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhuma solicitação encontrada</p>
                        <p className="text-sm text-slate-400 mt-1">Clique em "Nova Solicitação" para enviar uma</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {requests.map((req: any) => {
                        const status = statusConfig[req.status] || statusConfig.open;
                        const StatusIcon = status.icon;
                        return (
                            <Card key={req.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${status.color}`}>
                                                <StatusIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg">{req.subject}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <Badge variant="outline">{typeLabels[req.type] || req.type}</Badge>
                                                    <Badge className={priorityLabels[req.priority]?.color || 'bg-slate-100'}>
                                                        {priorityLabels[req.priority]?.label || req.priority}
                                                    </Badge>
                                                    <Badge className={status.color}>{status.label}</Badge>
                                                </div>
                                                <p className="text-slate-600 mt-3">{req.description}</p>
                                                {req.work && (
                                                    <p className="text-sm text-slate-400 mt-2">📋 Obra: {req.work.code} — {req.work.title}</p>
                                                )}

                                                {/* Attachments */}
                                                {req.attachments && req.attachments.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                                                            <Paperclip className="w-4 h-4" /> {req.attachments.length} anexo(s)
                                                        </p>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                            {req.attachments.map((att: any) => (
                                                                <a
                                                                    key={att.id}
                                                                    href={`${API_URL}${att.url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors text-sm"
                                                                >
                                                                    {att.mimeType?.startsWith('image/') ? (
                                                                        <img
                                                                            src={`${API_URL}${att.url}`}
                                                                            alt={att.originalName}
                                                                            className="w-10 h-10 object-cover rounded"
                                                                        />
                                                                    ) : (
                                                                        getFileIcon(att.mimeType)
                                                                    )}
                                                                    <span className="truncate flex-1 text-xs">{att.originalName}</span>
                                                                    <Download className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <p className="text-xs text-slate-400 mt-2">
                                                    Criada em {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {req.adminResponse && (
                                        <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <p className="text-sm font-medium text-emerald-800">Resposta da equipe:</p>
                                            <p className="text-sm text-emerald-700 mt-1">{req.adminResponse}</p>
                                            {req.respondedAt && (
                                                <p className="text-xs text-emerald-500 mt-2">
                                                    Respondida em {new Date(req.respondedAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Dialog: Nova Solicitação */}
            {showDialog && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Nova Solicitação</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => { setShowDialog(false); setSelectedFiles([]); }}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <select
                                        className="w-full border rounded-md px-3 py-2 text-sm"
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    >
                                        <option value="information">Informação</option>
                                        <option value="service">Serviço</option>
                                        <option value="complaint">Reclamação</option>
                                        <option value="approval">Aprovação</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Prioridade</Label>
                                    <select
                                        className="w-full border rounded-md px-3 py-2 text-sm"
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>

                                {works.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Obra (opcional)</Label>
                                        <select
                                            className="w-full border rounded-md px-3 py-2 text-sm"
                                            value={form.workId}
                                            onChange={(e) => setForm({ ...form, workId: e.target.value })}
                                        >
                                            <option value="">Não vinculada a uma obra</option>
                                            {works.map((w: any) => (
                                                <option key={w.id} value={w.id}>{w.code} — {w.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Assunto</Label>
                                    <Input
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        placeholder="Resumo da solicitação"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Descreva sua solicitação em detalhes..."
                                        rows={4}
                                        required
                                    />
                                </div>

                                {/* File Upload Zone */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        <Paperclip className="w-4 h-4" /> Anexos (opcional)
                                    </Label>
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActive
                                                ? 'border-emerald-400 bg-emerald-50'
                                                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-600">
                                            Arraste arquivos aqui ou <span className="text-emerald-600 font-medium">clique para selecionar</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Imagens, vídeos e documentos (máx. 10 arquivos)
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            className="hidden"
                                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                                            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
                                        />
                                    </div>

                                    {/* Selected Files Preview */}
                                    {selectedFiles.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border">
                                                    {file.type.startsWith('image/') ? (
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            alt={file.name}
                                                            className="w-10 h-10 object-cover rounded"
                                                        />
                                                    ) : file.type.startsWith('video/') ? (
                                                        <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                                                            <Film className="w-5 h-5 text-purple-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 bg-amber-100 rounded flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-amber-500" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm truncate">{file.name}</p>
                                                        <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400 hover:text-red-600"
                                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowDialog(false); setSelectedFiles([]); }}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" disabled={submitting}>
                                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Enviar Solicitação
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
