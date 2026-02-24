import { useState, useEffect } from 'react';
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
import {
    FileText,
    Loader2,
    CheckCircle2,
    Paperclip,
    TrendingUp,
    X,
    Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import type { ProtocolEvent, ProtocolEventType } from '@/types';

interface ProtocolEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    protocolId: string;
    initialEvent?: ProtocolEvent;
    currentProgress?: number;
}

export function ProtocolEventDialog({
    open,
    onOpenChange,
    onSuccess,
    protocolId,
    initialEvent,
    currentProgress = 0
}: ProtocolEventDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'comment' as ProtocolEventType,
        description: '',
        progress: currentProgress,
    });
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (open) {
            if (initialEvent) {
                setFormData({
                    type: initialEvent.type,
                    description: initialEvent.description,
                    progress: initialEvent.progress ?? currentProgress,
                });
            } else {
                setFormData({
                    type: 'comment',
                    description: '',
                    progress: currentProgress,
                });
            }
            setFiles([]);
        }
    }, [open, initialEvent, currentProgress]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description) {
            toast.error('Informe uma descrição para o evento');
            return;
        }

        try {
            setLoading(true);

            let savedEvent;
            if (initialEvent) {
                savedEvent = await api.updateProtocolEvent(initialEvent.id, formData);
                toast.success('Evento atualizado!');
            } else {
                savedEvent = await api.addProtocolEvent(protocolId, formData);
                toast.success('Evento adicionado!');
            }

            // Handle file uploads if any
            if (files.length > 0 && savedEvent?.id) {
                for (const file of files) {
                    // In a real scenario, this would be the URL from Supabase Storage
                    const mockUrl = `https://[PROJECT_ID].supabase.co/storage/v1/object/public/protocol-evidences/${file.name}`;

                    await api.addProtocolAttachment(savedEvent.id, {
                        name: file.name,
                        url: mockUrl,
                        mimeType: file.type,
                        size: file.size
                    });
                }
            }

            onSuccess();
            onOpenChange(false);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar evento');
        } finally {
            setLoading(false);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-slate-900 text-white">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {initialEvent ? <FileText className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                        {initialEvent ? 'Editar Evento' : 'Novo Registro no Histórico'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {initialEvent ? 'Atualize as informações do evento selecionado.' : 'Registre uma nova atualização para este protocolo.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 bg-slate-50 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            Tipo de Ocorrência
                        </Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, type: val as ProtocolEventType }))}
                        >
                            <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="comment">Comentário / Nota</SelectItem>
                                <SelectItem value="status_change">Mudança de Status</SelectItem>
                                <SelectItem value="document_attached">Documento Anexado</SelectItem>
                                <SelectItem value="requirement_received">Exigência Recebida</SelectItem>
                                <SelectItem value="external_update">Atualização Externa (Portal)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição detalhada *</Label>
                        <Textarea
                            placeholder="Descreva o que ocorreu..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="bg-white min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" /> Evolução da Obra (%)
                            </Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                                    className="bg-white w-24 font-bold text-amber-600"
                                />
                                <span className="text-sm text-slate-400">Progresso atual da etapa vinculada</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5" /> Anexos / Evidências
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-medium border border-amber-100">
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(idx)} className="hover:text-amber-900">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-dashed border-slate-300 rounded cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors text-xs font-bold text-slate-400 hover:text-amber-600">
                                <Plus className="w-3.5 h-3.5" /> Adicionar Arquivo
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </form>

                <DialogFooter className="p-4 bg-white border-t gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-100"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        {initialEvent ? 'Salvar Edição' : 'Registrar Evento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
