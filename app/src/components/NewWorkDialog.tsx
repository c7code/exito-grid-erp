import { useState, useEffect, useCallback } from 'react';
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
import { Building2, Loader2, Search, UserPlus, X, User, Check, Upload, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import type { Client } from '@/types';
import { ClientDialog } from '@/components/ClientDialog';

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

// Default hardcoded types (fallback if DB is empty)
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

// Technical spec fields per type
const techSpecFields: Record<string, { key: string; label: string; unit: string; placeholder: string }[]> = {
    subestacao_definitiva: [
        { key: 'power', label: 'Potência', unit: 'kVA', placeholder: 'Ex: 300' },
        { key: 'amperage', label: 'Amperagem', unit: 'A', placeholder: 'Ex: 150' },
        { key: 'voltage', label: 'Tensão', unit: 'kV', placeholder: 'Ex: 13.8' },
    ],
    subestacao_provisoria: [
        { key: 'power', label: 'Potência', unit: 'kVA', placeholder: 'Ex: 150' },
        { key: 'amperage', label: 'Amperagem', unit: 'A', placeholder: 'Ex: 75' },
        { key: 'voltage', label: 'Tensão', unit: 'kV', placeholder: 'Ex: 13.8' },
    ],
    rede_mt: [
        { key: 'voltage', label: 'Tensão', unit: 'kV', placeholder: 'Ex: 13.8' },
        { key: 'resistance', label: 'Resistência', unit: 'Ω', placeholder: 'Ex: 10' },
    ],
    rede_bt: [
        { key: 'voltage', label: 'Tensão', unit: 'V', placeholder: 'Ex: 220' },
        { key: 'amperage', label: 'Amperagem', unit: 'A', placeholder: 'Ex: 63' },
    ],
    rede_mt_bt: [
        { key: 'voltage', label: 'Tensão MT', unit: 'kV', placeholder: 'Ex: 13.8' },
        { key: 'voltageBT', label: 'Tensão BT', unit: 'V', placeholder: 'Ex: 220' },
        { key: 'amperage', label: 'Amperagem', unit: 'A', placeholder: 'Ex: 100' },
    ],
    muc: [
        { key: 'power', label: 'Potência', unit: 'kVA', placeholder: 'Ex: 75' },
    ],
};

export default function NewWorkDialog({
    open,
    onOpenChange,
    onWorkCreated,
}: NewWorkDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: '' as string,
        address: '',
        city: '',
        state: '',
        estimatedValue: '',
        description: '',
    });
    const [techSpecs, setTechSpecs] = useState<Record<string, string>>({});

    // Client selection
    const [clients, setClients] = useState<Client[]>([]);
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);

    // ClientDialog for creating new client
    const [showClientDialog, setShowClientDialog] = useState(false);

    // File attachments
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    // CEP lookup
    const [isCepLoading, setIsCepLoading] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Dynamic work types
    const [dynamicTypes, setDynamicTypes] = useState<{ key: string; label: string }[]>([]);
    const [newTypeName, setNewTypeName] = useState('');
    const [showNewTypeInput, setShowNewTypeInput] = useState(false);
    const [creatingType, setCreatingType] = useState(false);

    // Merge defaults + DB types, deduplicated, sorted alphabetically
    const allTypes = (() => {
        const merged: Record<string, string> = { ...defaultTypeLabels };
        dynamicTypes.forEach(t => { merged[t.key] = t.label; });
        return Object.entries(merged).sort(([,a], [,b]) => a.localeCompare(b));
    })();

    const loadClients = useCallback(async () => {
        setLoadingClients(true);
        try {
            const data = await api.getClients();
            const list = Array.isArray(data) ? data : (data?.data ?? []);
            setClients(list);
        } catch {
            console.error('Erro ao carregar clientes');
        } finally {
            setLoadingClients(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            loadClients();
            // Load dynamic types
            api.getWorkTypes().then((data: any[]) => {
                setDynamicTypes((data || []).map((t: any) => ({ key: t.key, label: t.label })));
            }).catch(() => {});
        }
    }, [open, loadClients]);

    // Separate CEP field state
    const [zipCode, setZipCode] = useState('');

    useEffect(() => {
        if (zipCode.replace(/\D/g, '').length === 8) {
            const timer = setTimeout(async () => {
                setIsCepLoading(true);
                try {
                    const data = await api.fetchCepData(zipCode.replace(/\D/g, ''));
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro || prev.address,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state,
                    }));
                    toast.success('Endereço preenchido automaticamente!');
                } catch {
                    // silent
                } finally {
                    setIsCepLoading(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [zipCode]);

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.document?.includes(clientSearch) ||
        c.email?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (!formData.type) newErrors.type = 'Tipo é obrigatório';
        if (!selectedClient) newErrors.client = 'Selecione ou cadastre um cliente';
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
            type: '',
            address: '',
            city: '',
            state: '',
            estimatedValue: '',
            description: '',
        });
        setSelectedClient(null);
        setClientSearch('');
        setZipCode('');
        setAttachedFiles([]);
        setTechSpecs({});
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const createdWork = await api.createWork({
                title: formData.title,
                type: formData.type,
                status: 'pending',
                totalValue: Number(formData.estimatedValue),
                address: formData.address,
                city: formData.city,
                state: formData.state,
                description: formData.description || undefined,
                clientId: selectedClient!.id,
                technicalData: Object.keys(techSpecs).length > 0 ? techSpecs : undefined,
            });

            // Upload attached files to Documents module
            if (attachedFiles.length > 0 && createdWork?.id) {
                for (const file of attachedFiles) {
                    try {
                        await api.uploadDocument(file, {
                            name: file.name,
                            workId: createdWork.id,
                            type: 'other',
                        });
                    } catch (err) {
                        console.error('Erro ao enviar anexo:', err);
                    }
                }
                toast.success(`${attachedFiles.length} anexo(s) enviado(s) ao módulo Documentos`);
            }

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

    const handleClientCreated = () => {
        // Reload clients and auto-select the newest one
        loadClients().then(() => {
            // After reload, the newest client will be first (sorted by updatedAt DESC)
            setTimeout(async () => {
                try {
                    const data = await api.getClients();
                    const list = Array.isArray(data) ? data : (data?.data ?? []);
                    setClients(list);
                    if (list.length > 0) {
                        // Select the most recently created client
                        const newest = list.reduce((a: Client, b: Client) =>
                            new Date(a.createdAt) > new Date(b.createdAt) ? a : b
                        );
                        setSelectedClient(newest);
                        setClientSearch('');
                        toast.success(`Cliente "${newest.name}" selecionado automaticamente!`);
                    }
                } catch { /* ignore */ }
            }, 300);
        });
    };

    return (
        <>
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
                                    <div className="flex items-center justify-between mb-1">
                                        <Label htmlFor="type">Tipo *</Label>
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-xs text-blue-600 gap-1"
                                            onClick={() => setShowNewTypeInput(!showNewTypeInput)}
                                        >
                                            <Plus className="w-3 h-3" />
                                            Novo Tipo
                                        </Button>
                                    </div>
                                    {showNewTypeInput && (
                                        <div className="flex gap-2 mb-2">
                                            <Input
                                                placeholder="Ex: Infraestrutura"
                                                value={newTypeName}
                                                onChange={e => setNewTypeName(e.target.value)}
                                                className="h-8 text-sm flex-1"
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (!newTypeName.trim()) return;
                                                        setCreatingType(true);
                                                        try {
                                                            const created = await api.createWorkType({ label: newTypeName.trim() });
                                                            setDynamicTypes(prev => [...prev, { key: created.key, label: created.label }]);
                                                            setFormData(f => ({ ...f, type: created.key }));
                                                            setTechSpecs({});
                                                            setNewTypeName('');
                                                            setShowNewTypeInput(false);
                                                            toast.success(`Tipo "${created.label}" cadastrado!`);
                                                        } catch (err: any) {
                                                            toast.error(err?.response?.data?.message || 'Erro ao criar tipo');
                                                        } finally {
                                                            setCreatingType(false);
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-8 bg-blue-600 hover:bg-blue-700"
                                                disabled={creatingType || !newTypeName.trim()}
                                                onClick={async () => {
                                                    if (!newTypeName.trim()) return;
                                                    setCreatingType(true);
                                                    try {
                                                        const created = await api.createWorkType({ label: newTypeName.trim() });
                                                        setDynamicTypes(prev => [...prev, { key: created.key, label: created.label }]);
                                                        setFormData(f => ({ ...f, type: created.key }));
                                                        setTechSpecs({});
                                                        setNewTypeName('');
                                                        setShowNewTypeInput(false);
                                                        toast.success(`Tipo "${created.label}" cadastrado!`);
                                                    } catch (err: any) {
                                                        toast.error(err?.response?.data?.message || 'Erro ao criar tipo');
                                                    } finally {
                                                        setCreatingType(false);
                                                    }
                                                }}
                                            >
                                                {creatingType ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                            </Button>
                                        </div>
                                    )}
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => {
                                            setFormData({ ...formData, type: value });
                                            setTechSpecs({});
                                        }}
                                    >
                                        <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allTypes.map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="estimatedValue">Valor Estimado (R$) *</Label>
                                    <Input
                                        id="estimatedValue"
                                        type="text" inputMode="decimal"
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

                        {/* Technical Specs (contextual) */}
                        {formData.type && techSpecFields[formData.type] && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                                    ⚡ Dados Técnicos
                                    <span className="text-xs font-normal text-slate-400 normal-case">(opcional)</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                                    {techSpecFields[formData.type].map((spec) => (
                                        <div key={spec.key} className="space-y-1">
                                            <Label className="text-xs text-slate-600">{spec.label} ({spec.unit})</Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder={spec.placeholder}
                                                value={techSpecs[spec.key] || ''}
                                                onChange={(e) => setTechSpecs(prev => ({ ...prev, [spec.key]: e.target.value }))}
                                                className="bg-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cliente */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    Cliente
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
                                    onClick={() => setShowClientDialog(true)}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Cadastrar Novo Cliente
                                </Button>
                            </div>

                            {selectedClient ? (
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-emerald-800">{selectedClient.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-emerald-600">
                                            {selectedClient.document && <span>{selectedClient.document}</span>}
                                            {selectedClient.email && <span>• {selectedClient.email}</span>}
                                            {selectedClient.phone && <span>• {selectedClient.phone}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-red-500"
                                            onClick={() => {
                                                setSelectedClient(null);
                                                setClientSearch('');
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Buscar por nome, CNPJ/CPF ou e-mail..."
                                            value={clientSearch}
                                            onChange={(e) => {
                                                setClientSearch(e.target.value);
                                                setShowClientDropdown(true);
                                            }}
                                            onFocus={() => setShowClientDropdown(true)}
                                            className={`pl-10 ${errors.client ? 'border-red-500' : ''}`}
                                        />
                                        {loadingClients && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-500" />
                                        )}
                                    </div>
                                    {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client}</p>}

                                    {showClientDropdown && clientSearch.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {filteredClients.length === 0 ? (
                                                <div className="p-3 text-center">
                                                    <p className="text-sm text-slate-400">Nenhum cliente encontrado</p>
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        size="sm"
                                                        className="text-amber-600 mt-1"
                                                        onClick={() => {
                                                            setShowClientDropdown(false);
                                                            setShowClientDialog(true);
                                                        }}
                                                    >
                                                        <UserPlus className="w-3 h-3 mr-1" />
                                                        Cadastrar novo cliente
                                                    </Button>
                                                </div>
                                            ) : (
                                                filteredClients.slice(0, 8).map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50 transition-colors text-left"
                                                        onClick={() => {
                                                            setSelectedClient(c);
                                                            setClientSearch('');
                                                            setShowClientDropdown(false);
                                                            setErrors(prev => {
                                                                const next = { ...prev };
                                                                delete next.client;
                                                                return next;
                                                            });
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                                            <span className="text-xs font-bold text-amber-600">
                                                                {c.name?.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-700 truncate">{c.name}</p>
                                                            <p className="text-xs text-slate-400 truncate">
                                                                {[c.document, c.email, c.phone].filter(Boolean).join(' • ')}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Localização */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                Localização
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="zipCode">CEP</Label>
                                    <div className="relative">
                                        <Input
                                            id="zipCode"
                                            placeholder="00000-000"
                                            value={zipCode}
                                            onChange={(e) => setZipCode(e.target.value)}
                                            maxLength={9}
                                        />
                                        {isCepLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

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

                        {/* Anexos */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                Anexos
                            </h3>
                            <div className="relative group h-24 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:border-amber-400 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center cursor-pointer">
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
                                <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-500 transition-colors" />
                                <span className="text-xs text-slate-500 mt-1">Clique ou arraste arquivos aqui</span>
                                <span className="text-[10px] text-slate-400">Os anexos serão salvos no módulo Documentos</span>
                            </div>

                            {attachedFiles.length > 0 && (
                                <div className="space-y-2">
                                    {attachedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg">
                                            <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                                                <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-red-500 shrink-0"
                                                onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
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
                                {loading ? 'Cadastrando...' : 'Cadastrar Obra'}
                            </Button>
                        </DialogFooter>
                    </form>
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
