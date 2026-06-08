import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import CategorySelect from '@/components/ui/CategorySelect';
import {
    FileText,
    Loader2,
    Download,
    Pencil,
    X,
    Save,
    Calendar,
    HardDrive,
    FolderOpen,
    User,
    Tag,
    Target,
    Building,
    Info,
    File,
    Image,
    FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface DocumentDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: any | null;
    onDocumentUpdated: () => void;
    clients?: { id: string; name: string }[];
    folders?: { id: string; name: string }[];
}



const categoryStyles: Record<string, { color: string; icon: any }> = {
    project: { color: 'bg-blue-100 text-blue-700', icon: FileText },
    contract: { color: 'bg-emerald-100 text-emerald-700', icon: FileText },
    report: { color: 'bg-indigo-100 text-indigo-700', icon: FileText },
    art: { color: 'bg-orange-100 text-orange-700', icon: FileText },
    memorial: { color: 'bg-cyan-100 text-cyan-700', icon: FileText },
    photo: { color: 'bg-purple-100 text-purple-700', icon: Image },
    invoice: { color: 'bg-green-100 text-green-700', icon: FileSpreadsheet },
    certificate: { color: 'bg-yellow-100 text-yellow-700', icon: FileText },
    norm: { color: 'bg-rose-100 text-rose-700', icon: FileText },
    pop: { color: 'bg-teal-100 text-teal-700', icon: FileText },
    supplier_catalog: { color: 'bg-amber-100 text-amber-700', icon: FileSpreadsheet },
    protocol: { color: 'bg-pink-100 text-pink-700', icon: FileText },
    other: { color: 'bg-slate-100 text-slate-700', icon: File },
};

function formatSize(bytes: number) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function DocumentDetailDialog({
    open,
    onOpenChange,
    document: doc,
    onDocumentUpdated,
    clients = [],
    folders = [],
}: DocumentDetailDialogProps) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        type: '',
        description: '',
        clientId: '',
        folderId: '',
        purpose: '',
        sourceOrganization: '',
        tagsInput: '',
    });

    useEffect(() => {
        if (doc && open) {
            setEditing(false);
            setEditForm({
                name: doc.name || '',
                type: doc.type || '',
                description: doc.description || '',
                clientId: doc.clientId || '',
                folderId: doc.folderId || '',
                purpose: doc.purpose || '',
                sourceOrganization: doc.sourceOrganization || '',
                tagsInput: Array.isArray(doc.tags) ? doc.tags.join(', ') : '',
            });
        }
    }, [doc, open]);

    if (!doc) return null;

    const cat = categoryStyles[doc.type] || categoryStyles.other;
    const CatIcon = cat.icon;

    const handleSave = async () => {
        if (!editForm.name.trim()) {
            toast.error('Nome do documento é obrigatório.');
            return;
        }
        setSaving(true);
        try {
            const tags = editForm.tagsInput
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            await api.updateDocument(doc.id, {
                name: editForm.name,
                type: editForm.type,
                description: editForm.description || null,
                clientId: editForm.clientId || null,
                folderId: editForm.folderId || null,
                purpose: editForm.purpose || null,
                sourceOrganization: editForm.sourceOrganization || null,
                tags: tags.length > 0 ? tags : null,
            });
            toast.success('Documento atualizado com sucesso!');
            setEditing(false);
            onDocumentUpdated();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Erro ao atualizar documento.');
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!doc.url) {
            toast.error('URL do documento não disponível.');
            return;
        }
        try {
            toast.info('Iniciando download...');
            const response = await fetch(doc.url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = blobUrl;
            link.download = doc.name || doc.fileName;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success('Download concluído!');
        } catch {
            window.open(doc.url, '_blank');
        }
    };

    const clientName = doc.client?.name || clients.find(c => c.id === doc.clientId)?.name;
    const folderName = doc.folder?.name || folders.find(f => f.id === doc.folderId)?.name;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${cat.color}`}>
                            <CatIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl truncate">{doc.name}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {doc.type || 'Outro'}
                                </Badge>
                                <span className="text-xs text-slate-400">{formatSize(doc.size)}</span>
                                {doc.fileName && (
                                    <span className="text-xs text-slate-400 truncate max-w-[200px]" title={doc.fileName}>
                                        {doc.fileName}
                                    </span>
                                )}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                            {!editing ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditing(true)}
                                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                                >
                                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                    Editar
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEditing(false);
                                        setEditForm({
                                            name: doc.name || '',
                                            type: doc.type || '',
                                            description: doc.description || '',
                                            clientId: doc.clientId || '',
                                            folderId: doc.folderId || '',
                                            purpose: doc.purpose || '',
                                            sourceOrganization: doc.sourceOrganization || '',
                                            tagsInput: Array.isArray(doc.tags) ? doc.tags.join(', ') : '',
                                        });
                                    }}
                                    className="text-slate-500"
                                >
                                    <X className="w-3.5 h-3.5 mr-1" />
                                    Cancelar
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                            >
                                <Download className="w-3.5 h-3.5 mr-1.5" />
                                Download
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {editing ? (
                    /* ════════ MODO EDIÇÃO ════════ */
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="edit-name">Nome do Documento *</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Tipo</Label>
                                <CategorySelect
                                    group="document_type"
                                    value={editForm.type}
                                    onChange={(v) => setEditForm({ ...editForm, type: v })}
                                />
                            </div>
                            <div>
                                <Label>Cliente</Label>
                                <Select
                                    value={editForm.clientId || 'none'}
                                    onValueChange={(v) => setEditForm({ ...editForm, clientId: v === 'none' ? '' : v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Nenhum" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {clients.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Pasta</Label>
                            <Select
                                value={editForm.folderId || 'none'}
                                onValueChange={(v) => setEditForm({ ...editForm, folderId: v === 'none' ? '' : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Raiz (sem pasta)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Raiz (sem pasta)</SelectItem>
                                    {folders.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="edit-desc">Descrição</Label>
                            <Textarea
                                id="edit-desc"
                                rows={3}
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Descrição do documento..."
                            />
                        </div>

                        {/* IA Classification */}
                        <div className="border-t pt-4 space-y-4">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">🎯 Classificação para IA</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Finalidade</Label>
                                    <CategorySelect
                                        group="document_purpose"
                                        value={editForm.purpose}
                                        onChange={(v) => setEditForm({ ...editForm, purpose: v })}
                                        placeholder="Nenhuma"
                                    />
                                </div>
                                <div>
                                    <Label>Origem</Label>
                                    <Input
                                        placeholder="Ex: ABNT, Neoenergia, WEG"
                                        value={editForm.sourceOrganization}
                                        onChange={(e) => setEditForm({ ...editForm, sourceOrganization: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Tags</Label>
                                <Input
                                    placeholder="Separar por vírgula: BT, CE4, poste_9m"
                                    value={editForm.tagsInput}
                                    onChange={(e) => setEditForm({ ...editForm, tagsInput: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setEditing(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* ════════ MODO VISUALIZAÇÃO ════════ */
                    <div className="mt-4 space-y-1">
                        {/* Descrição — destacada */}
                        {doc.description && (
                            <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Descrição</span>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{doc.description}</p>
                            </div>
                        )}

                        {/* Grid de informações */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {/* Data de Upload */}
                            <div className="flex items-center gap-2.5">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <div>
                                    <p className="text-[11px] text-slate-400 font-medium">Data de Upload</p>
                                    <p className="text-sm text-slate-700">
                                        {new Date(doc.createdAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Tamanho */}
                            <div className="flex items-center gap-2.5">
                                <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
                                <div>
                                    <p className="text-[11px] text-slate-400 font-medium">Tamanho</p>
                                    <p className="text-sm text-slate-700">{formatSize(doc.size)}</p>
                                </div>
                            </div>

                            {/* Pasta */}
                            {folderName && (
                                <div className="flex items-center gap-2.5">
                                    <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-medium">Pasta</p>
                                        <p className="text-sm text-slate-700">{folderName}</p>
                                    </div>
                                </div>
                            )}

                            {/* Cliente */}
                            {clientName && (
                                <div className="flex items-center gap-2.5">
                                    <User className="w-4 h-4 text-blue-500 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-medium">Cliente</p>
                                        <p className="text-sm text-slate-700">{clientName}</p>
                                    </div>
                                </div>
                            )}

                            {/* Finalidade */}
                            {doc.purpose && doc.purpose !== 'other' && (
                                <div className="flex items-center gap-2.5">
                                    <Target className="w-4 h-4 text-rose-500 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-medium">Finalidade</p>
                                        <p className="text-sm text-slate-700">{doc.purpose}</p>
                                    </div>
                                </div>
                            )}

                            {/* Origem */}
                            {doc.sourceOrganization && (
                                <div className="flex items-center gap-2.5">
                                    <Building className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-medium">Origem</p>
                                        <p className="text-sm text-slate-700">{doc.sourceOrganization}</p>
                                    </div>
                                </div>
                            )}

                            {/* Versão */}
                            {doc.version && doc.version > 1 && (
                                <div className="flex items-center gap-2.5">
                                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-medium">Versão</p>
                                        <p className="text-sm text-slate-700">v{doc.version}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {doc.tags && doc.tags.length > 0 && (
                            <div className="pt-3 mt-3 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag className="w-4 h-4 text-slate-400" />
                                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {doc.tags.map((tag: string, i: number) => (
                                        <span
                                            key={i}
                                            className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sem informação extra */}
                        {!doc.description && !clientName && !doc.purpose && !doc.sourceOrganization && (!doc.tags || doc.tags.length === 0) && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-amber-700">
                                    Este documento não possui descrição ou informações adicionais.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 text-amber-600 border-amber-300 hover:bg-amber-100"
                                    onClick={() => setEditing(true)}
                                >
                                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                    Adicionar Informações
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
