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
import { Pencil, Loader2, Link2, Link2Off, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import type { Task } from '@/types';

interface TaskActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
    onTaskUpdated: () => void;
}

const typeLabels: Record<string, string> = {
    call: 'Ligação',
    email: 'Email',
    visit: 'Visita',
    document: 'Documento',
    follow_up: 'Acompanhamento',
    internal: 'Interna',
};

const priorityLabels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
};

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
};

interface WorkOption {
    id: string;
    code?: string;
    title: string;
}

export default function TaskActionDialog({
    open,
    onOpenChange,
    task,
    onTaskUpdated,
}: TaskActionDialogProps) {
    const [loading, setLoading] = useState(false);
    const [linkedToWork, setLinkedToWork] = useState(false);
    const [worksOptions, setWorksOptions] = useState<WorkOption[]>([]);
    const [loadingWorks, setLoadingWorks] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [selectedResolvers, setSelectedResolvers] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'internal',
        priority: 'medium',
        status: 'pending',
        workId: '',
        weightPercentage: '',
        dueDate: '',
        estimatedHours: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Populate form when task changes
    useEffect(() => {
        if (task && open) {
            const hasWork = !!task.workId;
            setLinkedToWork(hasWork);
            setFormData({
                title: task.title || '',
                description: task.description || '',
                type: task.type || 'internal',
                priority: task.priority || 'medium',
                status: task.status || 'pending',
                workId: task.workId || '',
                weightPercentage: task.weightPercentage ? String(task.weightPercentage) : '',
                dueDate: task.deadline ? task.deadline.split('T')[0] : '',
                estimatedHours: task.estimatedHours ? String(task.estimatedHours) : '',
            });
            if (hasWork) {
                loadWorks();
            }
            // Pre-populate resolvers
            if ((task as any).resolvers && Array.isArray((task as any).resolvers)) {
                setSelectedResolvers((task as any).resolvers.map((r: any) => r.employeeId));
            } else {
                setSelectedResolvers([]);
            }
            loadEmployees();
        }
    }, [task, open]);

    const loadWorks = async () => {
        if (worksOptions.length > 0) return;
        setLoadingWorks(true);
        try {
            const data = await api.getWorks();
            const works = Array.isArray(data) ? data : (data?.data ?? []);
            setWorksOptions(
                works.map((w: any) => ({
                    id: w.id,
                    code: w.code,
                    title: w.title,
                }))
            );
        } catch (error) {
            console.error('Erro ao carregar obras:', error);
        } finally {
            setLoadingWorks(false);
        }
    };

    // Load works when toggle is activated
    useEffect(() => {
        if (linkedToWork && worksOptions.length === 0) {
            loadWorks();
        }
    }, [linkedToWork]);

    const loadEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const data = await api.getEmployees();
            const list = Array.isArray(data) ? data : (data?.data ?? []);
            setEmployees(list);
        } catch (error) {
            console.error('Erro ao carregar colaboradores:', error);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (linkedToWork && !formData.workId) {
            newErrors.workId = 'Selecione uma obra';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task || !validate()) return;

        setLoading(true);
        try {
            const payload: any = {
                title: formData.title,
                type: formData.type,
                priority: formData.priority,
                status: formData.status,
                description: formData.description || null,
                dueDate: formData.dueDate || null,
                estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : null,
                resolverIds: selectedResolvers,
            };

            if (linkedToWork && formData.workId) {
                payload.workId = formData.workId;
                payload.weightPercentage = formData.weightPercentage
                    ? Number(formData.weightPercentage)
                    : 0;
            } else {
                payload.workId = null;
                payload.weightPercentage = 0;
            }

            await api.updateTask(task.id, payload);

            const statusChanged = formData.status !== task.status;
            if (formData.status === 'completed' && statusChanged) {
                toast.success('Tarefa concluída! Progresso da obra atualizado.');
            } else {
                toast.success('Tarefa atualizada com sucesso!');
            }

            onOpenChange(false);
            onTaskUpdated();
        } catch (error: any) {
            console.error('Erro ao atualizar tarefa:', error);
            toast.error(
                error?.response?.data?.message || 'Erro ao atualizar tarefa. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setErrors({});
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Pencil className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Editar Tarefa</DialogTitle>
                            <DialogDescription>
                                Atualize os dados da tarefa e seu vínculo com a obra.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                    {/* Informações da Tarefa */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Informações da Tarefa
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Label htmlFor="edit-title">Título *</Label>
                                <Input
                                    id="edit-title"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && (
                                    <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                                )}
                            </div>

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
                                        {Object.entries(typeLabels).map(([k, l]) => (
                                            <SelectItem key={k} value={k}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Prioridade</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(priorityLabels).map(([k, l]) => (
                                            <SelectItem key={k} value={k}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusLabels).map(([k, l]) => (
                                            <SelectItem key={k} value={k}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formData.status === 'completed' && linkedToWork && formData.workId && (
                                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                                        ✅ Ao salvar, o progresso da obra será atualizado automaticamente
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="edit-dueDate">Prazo</Label>
                                <Input
                                    id="edit-dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, dueDate: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-estimatedHours">Horas Estimadas</Label>
                                <Input
                                    id="edit-estimatedHours"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.estimatedHours}
                                    onChange={(e) =>
                                        setFormData({ ...formData, estimatedHours: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vínculo com Obra */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Vínculo com Obra
                        </h3>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setLinkedToWork(false);
                                    setFormData({ ...formData, workId: '', weightPercentage: '' });
                                }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${!linkedToWork
                                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                <Link2Off className="w-4 h-4" />
                                Independente
                            </button>
                            <button
                                type="button"
                                onClick={() => setLinkedToWork(true)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${linkedToWork
                                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                <Link2 className="w-4 h-4" />
                                Vinculada a Obra
                            </button>
                        </div>

                        {linkedToWork && (
                            <>
                                <div>
                                    <Label>Obra *</Label>
                                    {loadingWorks ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Carregando obras...
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.workId}
                                            onValueChange={(v) =>
                                                setFormData({ ...formData, workId: v })
                                            }
                                        >
                                            <SelectTrigger
                                                className={errors.workId ? 'border-red-500' : ''}
                                            >
                                                <SelectValue placeholder="Selecione uma obra" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {worksOptions.map((work) => (
                                                    <SelectItem key={work.id} value={work.id}>
                                                        {work.code
                                                            ? `${work.code} — ${work.title}`
                                                            : work.title}
                                                    </SelectItem>
                                                ))}
                                                {worksOptions.length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-slate-400">
                                                        Nenhuma obra cadastrada
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {errors.workId && (
                                        <p className="text-red-500 text-xs mt-1">{errors.workId}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="edit-weightPercentage">
                                        Percentual na Obra (%)
                                    </Label>
                                    <Input
                                        id="edit-weightPercentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        placeholder="Ex: 30"
                                        value={formData.weightPercentage}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                weightPercentage: e.target.value,
                                            })
                                        }
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        Quanto esta tarefa representa na evolução da obra (0-100%)
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Descrição</Label>
                        <Textarea
                            id="edit-description"
                            placeholder="Detalhes adicionais sobre a tarefa..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                        />
                    </div>

                    {/* Resolvedores */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Resolvedores
                        </h3>
                        <p className="text-xs text-slate-400">
                            Selecione os colaboradores responsáveis por executar esta tarefa.
                        </p>
                        {loadingEmployees ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Carregando colaboradores...
                            </div>
                        ) : employees.length === 0 ? (
                            <p className="text-sm text-slate-400 py-2">Nenhum colaborador cadastrado.</p>
                        ) : (
                            <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                                {employees.map((emp: any) => {
                                    const roleLabel = emp.role === 'operational' ? 'Operacional' : emp.role === 'engineering' ? 'Engenharia' : emp.role === 'administrative' ? 'Administrativo' : emp.role || '';
                                    const typeLabel = emp.employmentType === 'clt' ? 'CLT' : emp.employmentType === 'contract' ? 'Empreiteiro' : emp.employmentType === 'outsourced' ? 'Terceirizado' : '';
                                    return (
                                        <label key={emp.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50/50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                                checked={selectedResolvers.includes(emp.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedResolvers([...selectedResolvers, emp.id]);
                                                    } else {
                                                        setSelectedResolvers(selectedResolvers.filter(id => id !== emp.id));
                                                    }
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-slate-700">{emp.name}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {roleLabel && <span className="text-xs text-slate-400">{roleLabel}</span>}
                                                    {typeLabel && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{typeLabel}</span>}
                                                    {emp.specialty && <span className="text-xs text-slate-400">• {emp.specialty}</span>}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        {selectedResolvers.length > 0 && (
                            <p className="text-xs text-amber-600 font-medium">
                                {selectedResolvers.length} resolvedor(es) selecionado(s)
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
