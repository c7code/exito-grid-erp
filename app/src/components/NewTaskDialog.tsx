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
import { ClipboardList, Loader2, Link2, Link2Off, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface NewTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaskCreated: () => void;
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

interface WorkOption {
    id: string;
    code?: string;
    title: string;
}

export default function NewTaskDialog({
    open,
    onOpenChange,
    onTaskCreated,
}: NewTaskDialogProps) {
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
        workId: '',
        weightPercentage: '',
        dueDate: '',
        estimatedHours: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load works when toggle is activated
    useEffect(() => {
        if (linkedToWork && worksOptions.length === 0) {
            loadWorks();
        }
    }, [linkedToWork]);

    // Load employees on open
    useEffect(() => {
        if (open && employees.length === 0) {
            loadEmployees();
        }
    }, [open]);

    const loadWorks = async () => {
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
            toast.error('Não foi possível carregar as obras.');
        } finally {
            setLoadingWorks(false);
        }
    };

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

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            type: 'internal',
            priority: 'medium',
            workId: '',
            weightPercentage: '',
            dueDate: '',
            estimatedHours: '',
        });
        setLinkedToWork(false);
        setSelectedResolvers([]);
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const payload: any = {
                title: formData.title,
                type: formData.type,
                priority: formData.priority,
                status: 'pending',
            };

            if (formData.description.trim()) {
                payload.description = formData.description;
            }
            if (linkedToWork && formData.workId) {
                payload.workId = formData.workId;
                if (formData.weightPercentage && Number(formData.weightPercentage) > 0) {
                    payload.weightPercentage = Number(formData.weightPercentage);
                }
            }
            if (formData.dueDate) {
                payload.dueDate = formData.dueDate;
            }
            if (formData.estimatedHours && Number(formData.estimatedHours) > 0) {
                payload.estimatedHours = Number(formData.estimatedHours);
            }

            if (selectedResolvers.length > 0) {
                payload.resolverIds = selectedResolvers;
            }

            await api.createTask(payload);
            toast.success('Tarefa criada com sucesso!');
            resetForm();
            onOpenChange(false);
            onTaskCreated();
        } catch (error: any) {
            console.error('Erro ao criar tarefa:', error);
            toast.error(
                error?.response?.data?.message || 'Erro ao criar tarefa. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Nova Tarefa</DialogTitle>
                            <DialogDescription>
                                Crie uma tarefa independente ou vinculada a uma obra.
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
                                <Label htmlFor="task-title">Título *</Label>
                                <Input
                                    id="task-title"
                                    placeholder="Ex: Vistoria técnica no local"
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
                                <Label htmlFor="task-type">Tipo</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="task-priority">Prioridade</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, priority: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a prioridade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(priorityLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="task-dueDate">Prazo</Label>
                                <Input
                                    id="task-dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, dueDate: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <Label htmlFor="task-estimatedHours">Horas Estimadas</Label>
                                <Input
                                    id="task-estimatedHours"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="Ex: 4"
                                    value={formData.estimatedHours}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            estimatedHours: e.target.value,
                                        })
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
                                    setFormData({ ...formData, workId: '' });
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
                                    <Label htmlFor="task-workId">Obra *</Label>
                                    {loadingWorks ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Carregando obras...
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.workId}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, workId: value })
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
                                    <Label htmlFor="task-weightPercentage">Percentual na Obra (%)</Label>
                                    <Input
                                        id="task-weightPercentage"
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
                        <Label htmlFor="task-description">Descrição</Label>
                        <Textarea
                            id="task-description"
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
                            {loading ? 'Criando...' : 'Criar Tarefa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
