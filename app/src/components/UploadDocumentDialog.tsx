import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FileText, Loader2, Upload, X, File as FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface UploadDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDocumentCreated: () => void;
    preselectedWorkId?: string;
    preselectedFolderId?: string;
}

interface WorkOption {
    id: string;
    title: string;
    code: string;
}

interface FolderOption {
    id: string;
    name: string;
}

const documentTypes: Record<string, string> = {
    project: 'Projeto',
    report: 'Relatório',
    art: 'ART',
    memorial: 'Memorial',
    photo: 'Foto',
    contract: 'Contrato',
    invoice: 'Nota Fiscal',
    certificate: 'Certificado',
    other: 'Outro',
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDocumentDialog({
    open,
    onOpenChange,
    onDocumentCreated,
    preselectedWorkId,
    preselectedFolderId,
}: UploadDocumentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [works, setWorks] = useState<WorkOption[]>([]);
    const [folders, setFolders] = useState<FolderOption[]>([]);
    const [loadingWorks, setLoadingWorks] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'other' as string,
        workId: preselectedWorkId || '',
        folderId: preselectedFolderId || '',
        description: '',
    });

    useEffect(() => {
        if (open) {
            loadWorks();
            setFormData(prev => ({
                ...prev,
                workId: preselectedWorkId || prev.workId,
                folderId: preselectedFolderId || prev.folderId,
            }));
        }
    }, [open, preselectedWorkId, preselectedFolderId]);

    useEffect(() => {
        if (formData.workId) {
            loadFolders(formData.workId);
        } else {
            loadFolders();
        }
    }, [formData.workId]);

    const loadWorks = async () => {
        setLoadingWorks(true);
        try {
            const data = await api.getWorks();
            const list = Array.isArray(data) ? data : (data?.data ?? []);
            setWorks(list.map((w: any) => ({ id: w.id, title: w.title, code: w.code })));
        } catch (e) {
            console.error('Erro ao carregar obras:', e);
        } finally {
            setLoadingWorks(false);
        }
    };

    const loadFolders = async (workId?: string) => {
        try {
            const data = await api.getDocumentFolders(workId);
            const list = Array.isArray(data) ? data : (data?.data ?? []);
            setFolders(list.map((f: any) => ({ id: f.id, name: f.name })));
        } catch (e) {
            console.error('Erro ao carregar pastas:', e);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'other',
            workId: preselectedWorkId || '',
            folderId: preselectedFolderId || '',
            description: '',
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (!formData.name) {
                setFormData(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, '') }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Selecione um arquivo para upload.');
            return;
        }
        if (!formData.name.trim()) {
            toast.error('Nome do documento é obrigatório.');
            return;
        }

        setLoading(true);
        try {
            await api.uploadDocument(selectedFile, {
                name: formData.name,
                type: formData.type,
                workId: formData.workId || undefined,
                folderId: formData.folderId || undefined,
                description: formData.description || undefined,
            });
            toast.success('Documento enviado com sucesso!');
            resetForm();
            onOpenChange(false);
            onDocumentCreated();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Erro ao enviar documento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Upload de Documento</DialogTitle>
                            <DialogDescription>Selecione um arquivo do seu computador.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* File Picker */}
                    <div>
                        <Label>Arquivo *</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.dwg,.zip,.rar"
                        />
                        {selectedFile ? (
                            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mt-1">
                                <FileIcon className="w-5 h-5 text-green-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                    <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 w-full p-6 mt-1 border-2 border-dashed border-slate-300 rounded-lg hover:border-amber-400 hover:bg-amber-50/50 transition-colors text-sm text-slate-500"
                            >
                                <Upload className="w-5 h-5" />
                                Clique para selecionar ou arraste um arquivo
                            </button>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="doc-name">Nome do Documento *</Label>
                        <Input
                            id="doc-name"
                            placeholder="Ex: Projeto Elétrico - OB-2024-001"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData({ ...formData, type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(documentTypes).map(([k, l]) => (
                                        <SelectItem key={k} value={k}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Obra</Label>
                            {loadingWorks ? (
                                <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Carregando...
                                </div>
                            ) : (
                                <Select
                                    value={formData.workId}
                                    onValueChange={(v) => setFormData({ ...formData, workId: v === 'none' ? '' : v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma obra" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        {works.map((w) => (
                                            <SelectItem key={w.id} value={w.id}>
                                                {w.code} - {w.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    {folders.length > 0 && (
                        <div>
                            <Label>Pasta</Label>
                            <Select
                                value={formData.folderId}
                                onValueChange={(v) => setFormData({ ...formData, folderId: v === 'none' ? '' : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma pasta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Raiz (sem pasta)</SelectItem>
                                    {folders.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="doc-desc">Descrição</Label>
                        <Textarea
                            id="doc-desc"
                            placeholder="Descrição opcional..."
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                            disabled={loading || !selectedFile}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {loading ? 'Enviando...' : 'Enviar Arquivo'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
