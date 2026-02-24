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
    FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import type { Work, Client, Task } from '@/types';
import { format } from 'date-fns';

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
            await api.createProtocol({
                ...formData,
                concessionaria: formData.utilityCompany, // Ensuring compatibility
                openedAt: new Date(formData.openedAt),
                status: 'open'
            });
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
    };

    return (
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
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> Cliente
                            </Label>
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
                                type="number"
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
    );
}
