import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

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
        }
    }, [work, open]);

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
                            <Label>Tipo</Label>
                            <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="residential">Residencial</SelectItem>
                                    <SelectItem value="commercial">Comercial</SelectItem>
                                    <SelectItem value="industrial">Industrial</SelectItem>
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
                            type="number"
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
