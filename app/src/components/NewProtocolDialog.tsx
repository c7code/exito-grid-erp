import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
    Building2,
    User,
    Calendar,
    Clock,
    AlertCircle,
    Loader2,
    Search,
    CheckCircle2,
    FileCheck,
    UserPlus,
    Upload,
    FileText,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import type { Work, Client, Task } from '@/types';
import { format } from 'date-fns';
import { ClientDialog } from '@/components/ClientDialog';

interface NewProtocolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialWorkId?: string;
}

export function NewProtocolDialog({ open, onOpenChange, onSuccess, initialWorkId }: NewProtocolDialogProps) {
    const [loading, setLoading] = useState(false);
    const [, setLoadingInitial] = useState(false);
    const [works, setWorks] = useState<Work[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showClientDialog, setShowClientDialog] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const [formData, setFormData] = useState({
        workId: initialWorkId || '',
        clientId: '',
        taskId: '',
        utilityCompany: '',
        concessionaria: '',
        protocolNumber: '',
        description: '',
        type: 'utility',
        priority: 'medium',
        slaDays: 30,
        openedAt: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    useEffect(() => {
        if (formData.workId) {
            loadTasks(formData.workId);
            const work = works.find(w => w.id === formData.workId);
            if (work && work.client && !formData.clientId) {
                setFormData(prev => ({ ...prev, clientId: work.client.id }));
            }
        } else {
            setTasks([]);
        }
    }, [formData.workId, works]);

    const loadData = async () => {
        try {
            setLoadingInitial(true);
            const [worksData, clientsData] = await Promise.all([
                api.getWorks(),
                api.getClients()
            ]);
            setWorks(worksData);
            setClients(clientsData);

            if (initialWorkId) {
                const work = worksData.find((w: any) => w.id === initialWorkId);
                if (work) {
                    setFormData(prev => ({
                        ...prev,
                        workId: initialWorkId,
                        clientId: work.client?.id || ''
                    }));
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar dados auxiliares');
        } finally {
            setLoadingInitial(false);
        }
    };

    const loadTasks = async (workId: string) => {
        try {
            const tasksData = await api.getTasksByWork(workId);
            setTasks(tasksData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.workId || !formData.utilityCompany) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        try {
            setLoading(true);
            const createdProtocol = await api.createProtocol({
                ...formData,
                concessionaria: formData.utilityCompany,
                openedAt: new Date(formData.openedAt),
                status: 'open'
            });

            // Upload attached files to Documents module
            if (attachedFiles.length > 0 && createdProtocol?.id) {
                for (const file of attachedFiles) {
                    try {
                        await api.uploadDocument(file, {
                            name: file.name,
                            workId: formData.workId || undefined,
                            type: 'other',
                        });
                    } catch (err) {
                        console.error('Erro ao enviar anexo:', err);
                    }
                }
                toast.success(`${attachedFiles.length} anexo(s) enviado(s) ao módulo Documentos`);
            }

            toast.success('Protocolo cadastrado com sucesso!');
            onSuccess();
            onOpenChange(false);
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error('Erro ao cadastrar protocolo');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            workId: initialWorkId || '',
            clientId: '',
            taskId: '',
            utilityCompany: '',
            concessionaria: '',
            protocolNumber: '',
            description: '',
            type: 'utility',
            priority: 'medium',
            slaDays: 30,
            openedAt: format(new Date(), 'yyyy-MM-dd'),
        });
        setAttachedFiles([]);
    };

    const handleClientCreated = async () => {
        try {
            const clientsData = await api.getClients();
            const list = Array.isArray(clientsData) ? clientsData : (clientsData?.data ?? []);
            setClients(list);
            if (list.length > 0) {
                const newest = list.reduce((a: Client, b: Client) =>
                    new Date(a.createdAt) > new Date(b.createdAt) ? a : b
                );
                setFormData(prev => ({ ...prev, clientId: newest.id }));
                toast.success(`Cliente "${newest.name}" selecionado automaticamente!`);
            }
        } catch { /* ignore */ }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-900 text-white">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FileCheck className="w-6 h-6 text-amber-500" />
                            Novo Protocolo
                        </DialogTitle>
                        <p className="text-slate-400 text-sm">
                            Cadastre um novo processo ou interação oficial para acompanhamento.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" /> Obra / Projeto *
                                </Label>
                                <Select
                                    value={formData.workId}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, workId: val }))}
                                >
                                    <SelectTrigger className="bg-white border-slate-200">
                                        <SelectValue placeholder="Selecione a obra" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {works.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.code} - {w.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> Cliente
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs text-amber-600 gap-1"
                                        onClick={() => setShowClientDialog(true)}
                                    >
                                        <UserPlus className="w-3 h-3" />
                                        Novo Cliente
                                    </Button>
                                </div>
                                <Select
                                    value={formData.clientId}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, clientId: val }))}
                                >
                                    <SelectTrigger className="bg-white border-slate-200">
                                        <SelectValue placeholder="Selecione o cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" /> Órgão/Concessionária *
                                </Label>
                                <Input
                                    placeholder="Ex: Neoenergia, Prefeitura de SP"
                                    value={formData.utilityCompany}
                                    onChange={(e) => setFormData(prev => ({ ...prev, utilityCompany: e.target.value }))}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5" /> Nº Protocolo / Registro
                                </Label>
                                <Input
                                    placeholder="Opcional"
                                    value={formData.protocolNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, protocolNumber: e.target.value }))}
                                    className="bg-white font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Data de Abertura
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.openedAt}
                                    onChange={(e) => setFormData(prev => ({ ...prev, openedAt: e.target.value }))}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> Prazo SLA (Dias)
                                </Label>
                                <Input
                                    type="text" inputMode="decimal"
                                    value={formData.slaDays}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slaDays: parseInt(e.target.value) || 0 }))}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> Prioridade
                                </Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
                                >
                                    <SelectTrigger className="bg-white border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Baixa</SelectItem>
                                        <SelectItem value="medium">Média</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                        <SelectItem value="critical">Crítica</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                Etapa / Tarefa Relacionada
                            </Label>
                            <Select
                                value={formData.taskId}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, taskId: val }))}
                                disabled={!formData.workId || tasks.length === 0}
                            >
                                <SelectTrigger className="bg-white border-slate-200">
                                    <SelectValue placeholder={!formData.workId ? "Selecione uma obra primeiro" : tasks.length === 0 ? "Nenhuma tarefa encontrada" : "Selecione a tarefa"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {tasks.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Observações Iniciais</Label>
                            <Textarea
                                placeholder="Descreva brevemente o objetivo deste protocolo..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-white min-h-[100px] resize-none"
                            />
                        </div>

                        {/* Anexos */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Anexos
                            </Label>
                            <div className="relative group h-20 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:border-amber-400 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center cursor-pointer">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                        e.target.value = '';
                                    }}
                                />
                                <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                                <span className="text-xs text-slate-500 mt-1">Clique para anexar arquivos</span>
                                <span className="text-[10px] text-slate-400">Salvos automaticamente no módulo Documentos</span>
                            </div>

                            {attachedFiles.length > 0 && (
                                <div className="space-y-1.5">
                                    {attachedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                                            <div className="w-7 h-7 rounded bg-amber-100 flex items-center justify-center shrink-0">
                                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                                                <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-red-500 shrink-0"
                                                onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>

                    <DialogFooter className="p-4 bg-white border-t gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 shadow-lg shadow-amber-100"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Criar Protocolo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Client Dialog for advanced creation */}
            <ClientDialog
                open={showClientDialog}
                onOpenChange={setShowClientDialog}
                onSuccess={handleClientCreated}
            />
        </>
    );
}
