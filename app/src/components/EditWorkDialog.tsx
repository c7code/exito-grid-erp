import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

const defaultTypeLabels: Record<string, string> = {
    muc: 'MUC',
    rede_bt: 'Rede BT',
    rede_mt: 'Rede MT',
    rede_mt_bt: 'Rede MT e BT',
    subestacao_definitiva: 'Subestação Definitiva',
    subestacao_provisoria: 'Subestação Provisória',
    pde: 'PDE',
    pde_bt: 'PDE BT',
    pde_at: 'PDE AT',
    project_bt: 'Projeto BT',
    project_mt: 'Projeto MT',
    project_at: 'Projeto AT',
    solar: 'Solar',
    network_donation: 'Doação de Rede',
    network_work: 'Obra de Rede',
    report: 'Laudo',
    spda: 'SPDA',
    grounding: 'Aterramento',
    maintenance: 'Manutenção',
    residential: 'Residencial',
    commercial: 'Comercial',
    industrial: 'Industrial',
    adequacy: 'Adequação',
};

interface EditWorkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    work: any;
    onWorkUpdated: () => void;
}

export default function EditWorkDialog({ open, onOpenChange, work, onWorkUpdated }: EditWorkDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        status: '',
        address: '',
        city: '',
        state: '',
        totalValue: '',
        description: '',
    });

    // Dynamic types
    const [dynamicTypes, setDynamicTypes] = useState<{ key: string; label: string }[]>([]);
    const [newTypeName, setNewTypeName] = useState('');
    const [showNewTypeInput, setShowNewTypeInput] = useState(false);
    const [creatingType, setCreatingType] = useState(false);

    const allTypes = (() => {
        const merged: Record<string, string> = { ...defaultTypeLabels };
        dynamicTypes.forEach(t => { merged[t.key] = t.label; });
        return Object.entries(merged).sort(([,a], [,b]) => a.localeCompare(b));
    })();

    useEffect(() => {
        if (work && open) {
            setFormData({
                title: work.title || '',
                type: work.type || '',
                status: work.status || '',
                address: work.address || '',
                city: work.city || '',
                state: work.state || '',
                totalValue: work.totalValue?.toString() || '',
                description: work.description || '',
            });
            api.getWorkTypes().then((data: any[]) => {
                setDynamicTypes((data || []).map((t: any) => ({ key: t.key, label: t.label })));
            }).catch(() => {});
        }
    }, [work, open]);

    const handleCreateType = async () => {
        if (!newTypeName.trim()) return;
        setCreatingType(true);
        try {
            const created = await api.createWorkType({ label: newTypeName.trim() });
            setDynamicTypes(prev => [...prev, { key: created.key, label: created.label }]);
            setFormData(f => ({ ...f, type: created.key }));
            setNewTypeName('');
            setShowNewTypeInput(false);
            toast.success(`Tipo "${created.label}" cadastrado!`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao criar tipo');
        } finally {
            setCreatingType(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!work) return;

        setLoading(true);
        try {
            await api.updateWork(work.id, {
                title: formData.title,
                type: formData.type,
                status: formData.status,
                address: formData.address || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                totalValue: formData.totalValue ? Number(formData.totalValue) : undefined,
                description: formData.description || undefined,
            });
            toast.success('Obra atualizada com sucesso!');
            onOpenChange(false);
            onWorkUpdated();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Erro ao atualizar obra.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Obra</DialogTitle>
                    <DialogDescription>Atualize as informações da obra.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Tipo</Label>
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-blue-600 gap-1"
                                    onClick={() => setShowNewTypeInput(!showNewTypeInput)}
                                >
                                    <Plus className="w-3 h-3" />
                                    Novo
                                </Button>
                            </div>
                            {showNewTypeInput && (
                                <div className="flex gap-1 mb-1">
                                    <Input
                                        placeholder="Ex: Infraestrutura"
                                        value={newTypeName}
                                        onChange={e => setNewTypeName(e.target.value)}
                                        className="h-7 text-xs flex-1"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateType(); } }}
                                    />
                                    <Button type="button" size="sm" className="h-7 w-7 p-0 bg-blue-600" disabled={creatingType || !newTypeName.trim()} onClick={handleCreateType}>
                                        {creatingType ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    </Button>
                                </div>
                            )}
                            <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allTypes.map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                                    <SelectItem value="waiting_utility">Aguardando Concessionária</SelectItem>
                                    <SelectItem value="waiting_client">Aguardando Cliente</SelectItem>
                                    <SelectItem value="completed">Concluída</SelectItem>
                                    <SelectItem value="cancelled">Cancelada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Endereço</Label>
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cidade</Label>
                            <Input
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Input
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                maxLength={2}
                                placeholder="UF"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Valor Total (R$)</Label>
                        <Input
                            type="text" inputMode="decimal"
                            value={formData.totalValue}
                            onChange={(e) => setFormData({ ...formData, totalValue: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
