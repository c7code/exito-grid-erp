import { useState } from 'react';
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
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import type { WorkType } from '@/types';

interface NewWorkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onWorkCreated: () => void;
}

const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const typeLabels: Record<WorkType, string> = {
    residential: 'Residencial',
    commercial: 'Comercial',
    industrial: 'Industrial',
};

export default function NewWorkDialog({
    open,
    onOpenChange,
    onWorkCreated,
}: NewWorkDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: '' as WorkType | '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        address: '',
        city: '',
        state: '',
        estimatedValue: '',
        description: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (!formData.type) newErrors.type = 'Tipo é obrigatório';
        if (!formData.clientName.trim()) newErrors.clientName = 'Nome do cliente é obrigatório';
        if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
        if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
        if (!formData.state) newErrors.state = 'Estado é obrigatório';
        if (!formData.estimatedValue || Number(formData.estimatedValue) <= 0) {
            newErrors.estimatedValue = 'Valor estimado deve ser maior que zero';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetForm = () => {
        setFormData({
            title: '',
            type: '' as WorkType | '',
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            address: '',
            city: '',
            state: '',
            estimatedValue: '',
            description: '',
        });
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await api.createWork({
                title: formData.title,
                type: formData.type,
                status: 'pending', // Default status for new works
                totalValue: Number(formData.estimatedValue),
                address: formData.address,
                city: formData.city,
                state: formData.state,
                description: formData.description || undefined,
                clientName: formData.clientName,
                clientEmail: formData.clientEmail || undefined,
                clientPhone: formData.clientPhone || undefined,
            });

            toast.success('Obra cadastrada com sucesso!');
            resetForm();
            onOpenChange(false);
            onWorkCreated();
        } catch (error: any) {
            console.error('Erro ao cadastrar obra:', error);
            toast.error(error?.response?.data?.message || 'Erro ao cadastrar obra. Tente novamente.');
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
                            <Building2 className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Nova Obra</DialogTitle>
                            <DialogDescription>
                                Preencha os dados para cadastrar uma nova obra no sistema.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                    {/* Informações da Obra */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Informações da Obra
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Label htmlFor="title">Título da Obra *</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: Instalação Elétrica Residencial"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <Label htmlFor="type">Tipo *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value as WorkType })}
                                >
                                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.keys(typeLabels) as WorkType[]).map((key) => (
                                            <SelectItem key={key} value={key}>
                                                {typeLabels[key]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                            </div>

                            <div>
                                <Label htmlFor="estimatedValue">Valor Estimado (R$) *</Label>
                                <Input
                                    id="estimatedValue"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="25000.00"
                                    value={formData.estimatedValue}
                                    onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                                    className={errors.estimatedValue ? 'border-red-500' : ''}
                                />
                                {errors.estimatedValue && (
                                    <p className="text-red-500 text-xs mt-1">{errors.estimatedValue}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dados do Cliente */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Dados do Cliente
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Label htmlFor="clientName">Nome do Cliente *</Label>
                                <Input
                                    id="clientName"
                                    placeholder="Ex: João Silva"
                                    value={formData.clientName}
                                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                    className={errors.clientName ? 'border-red-500' : ''}
                                />
                                {errors.clientName && (
                                    <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="clientEmail">Email do Cliente</Label>
                                <Input
                                    id="clientEmail"
                                    type="email"
                                    placeholder="cliente@email.com"
                                    value={formData.clientEmail}
                                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="clientPhone">Telefone do Cliente</Label>
                                <Input
                                    id="clientPhone"
                                    placeholder="(11) 99999-9999"
                                    value={formData.clientPhone}
                                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Localização */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Localização
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Label htmlFor="address">Endereço *</Label>
                                <Input
                                    id="address"
                                    placeholder="Rua, número, complemento"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className={errors.address ? 'border-red-500' : ''}
                                />
                                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                            </div>

                            <div>
                                <Label htmlFor="city">Cidade *</Label>
                                <Input
                                    id="city"
                                    placeholder="São Paulo"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className={errors.city ? 'border-red-500' : ''}
                                />
                                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                            </div>

                            <div>
                                <Label htmlFor="state">Estado (UF) *</Label>
                                <Select
                                    value={formData.state}
                                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                                >
                                    <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brazilianStates.map((uf) => (
                                            <SelectItem key={uf} value={uf}>
                                                {uf}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="description"
                            placeholder="Detalhes adicionais sobre a obra..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
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
                            {loading ? 'Cadastrando...' : 'Cadastrar Obra'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
