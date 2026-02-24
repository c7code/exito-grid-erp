import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    FileText,
    Upload,
    X,
    User,
    Building2,
    MapPin,
    Phone,
    Globe,
    ExternalLink,
    Loader2,
    Copy,
    Check,
    KeyRound,
    RefreshCw,
    MessageCircle,
    Eye,
    EyeOff,
} from 'lucide-react';
import { api } from '@/api';
import type { Client, ClientSegment, ClientType } from '@/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    client?: Client;
}

export function ClientDialog({
    open,
    onOpenChange,
    onSuccess,
    client
}: ClientDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        document: '',
        email: '',
        phone: '',
        whatsapp: '',
        segment: 'residential' as ClientSegment,
        type: 'company' as ClientType,
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        stateRegistration: '',
        notes: '',
    });
    const [isLookupLoading, setIsLookupLoading] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);

    const [files, setFiles] = useState<{ file: File; type: string; issueDate?: string; expiryDate?: string }[]>([]);

    // Password reveal state
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [passwordCopied, setPasswordCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    useEffect(() => {
        if (open) {
            if (client) {
                setFormData({
                    name: client.name || '',
                    companyName: client.companyName || '',
                    document: client.document || '',
                    email: client.email || '',
                    phone: client.phone || '',
                    whatsapp: client.whatsapp || '',
                    segment: client.segment || 'residential',
                    type: client.type || 'company',
                    address: client.address || '',
                    number: client.number || '',
                    complement: client.complement || '',
                    neighborhood: client.neighborhood || '',
                    city: client.city || '',
                    state: client.state || '',
                    zipCode: client.zipCode || '',
                    stateRegistration: client.stateRegistration || '',
                    notes: client.notes || '',
                });
            } else {
                setFormData({
                    name: '',
                    companyName: '',
                    document: '',
                    email: '',
                    phone: '',
                    whatsapp: '',
                    segment: 'residential',
                    type: 'company',
                    address: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    stateRegistration: '',
                    notes: '',
                });
            }
            setFiles([]);
        }
    }, [open, client]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        if (e.target.files) {
            const now = new Date().toISOString().split('T')[0];
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                type,
                issueDate: now,
                expiryDate: '',
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const updateFileData = (index: number, key: string, value: any) => {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f));
    }

    const handleCnpjLookup = async (cnpj: string) => {
        const cleanCnpj = cnpj.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) return;

        setIsLookupLoading(true);
        try {
            const data = await api.fetchCnpjData(cleanCnpj);
            setFormData(prev => ({
                ...prev,
                name: data.razao_social || prev.name,
                companyName: data.nome_fantasia || prev.companyName || data.razao_social,
                address: data.logradouro || prev.address,
                number: data.numero || prev.number,
                neighborhood: data.bairro || prev.neighborhood,
                city: data.municipio || prev.city,
                state: data.uf || prev.state,
                zipCode: data.cep || prev.zipCode,
            }));
            toast.success('Dados da empresa carregados automaticamente');
        } catch (error) {
            console.error('Erro no lookup de CNPJ:', error);
            toast.error('Não foi possível carregar os dados do CNPJ automaticamente');
        } finally {
            setIsLookupLoading(false);
        }
    };

    useEffect(() => {
        if (formData.type === 'company' && formData.document.replace(/\D/g, '').length === 14) {
            const timer = setTimeout(() => {
                handleCnpjLookup(formData.document);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [formData.document, formData.type]);

    // ═══ AUTO-PREENCHIMENTO CEP ═══
    const handleCepLookup = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setIsCepLoading(true);
        try {
            const data = await api.fetchCepData(cleanCep);
            setFormData(prev => ({
                ...prev,
                address: data.logradouro || prev.address,
                neighborhood: data.bairro || prev.neighborhood,
                city: data.localidade || prev.city,
                state: data.uf || prev.state,
            }));
            toast.success('Endereço preenchido automaticamente');
        } catch (error) {
            console.error('Erro no lookup de CEP:', error);
        } finally {
            setIsCepLoading(false);
        }
    };

    useEffect(() => {
        if (formData.zipCode.replace(/\D/g, '').length === 8) {
            const timer = setTimeout(() => {
                handleCepLookup(formData.zipCode);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [formData.zipCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let savedClient;
            if (client) {
                savedClient = await api.updateClient(client.id, formData);
                toast.success('Cliente atualizado com sucesso');
            } else {
                savedClient = await api.createClient(formData);
                // Capture the generated portal password
                if (savedClient.portalPassword) {
                    setGeneratedPassword(savedClient.portalPassword);
                    setShowPasswordDialog(true);
                }
                toast.success('Cliente cadastrado com sucesso');
            }

            // Upload files (Mocked for now as we did for employees)
            for (const item of files) {
                const mockUrl = `https://supabase.storage/client-vault/${item.file.name}`;
                await api.addClientDocument(savedClient.id, {
                    name: item.file.name,
                    url: mockUrl,
                    type: item.type,
                    issueDate: item.issueDate || null,
                    expiryDate: item.expiryDate || null
                });
            }

            onSuccess();
            // Only close the dialog if we're NOT showing a password
            if (!savedClient.portalPassword) {
                onOpenChange(false);
            }
        } catch (error) {
            toast.error('Erro ao salvar cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveDoc = async (docId: string) => {
        if (!confirm('Deseja remover este documento?')) return;
        try {
            await api.removeClientDocument(docId);
            toast.success('Documento removido');
            onSuccess();
        } catch (error) {
            toast.error('Erro ao remover documento');
        }
    }

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(url, '_blank');
        }
    };

    const handleCopyPassword = async () => {
        if (!generatedPassword) return;
        try {
            await navigator.clipboard.writeText(generatedPassword);
            setPasswordCopied(true);
            toast.success('Senha copiada!');
            setTimeout(() => setPasswordCopied(false), 2000);
        } catch {
            toast.error('Erro ao copiar senha');
        }
    };

    const handleShareWhatsApp = () => {
        if (!generatedPassword || !formData.whatsapp) return;
        const phone = formData.whatsapp.replace(/\D/g, '');
        const msg = encodeURIComponent(
            `Olá ${formData.name}!\n\nSeu acesso ao Portal do Cliente foi criado:\n\n📧 Login: ${formData.email}\n🔑 Senha: ${generatedPassword}\n\nAcesse em: ${window.location.origin}/client`
        );
        window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
    };

    const handleRegeneratePassword = async () => {
        if (!client) return;
        setRegenerating(true);
        try {
            const result = await api.generateClientAccess(client.id);
            setGeneratedPassword(result.portalPassword);
            setShowPasswordDialog(true);
            toast.success('Nova senha gerada!');
        } catch {
            toast.error('Erro ao gerar nova senha');
        } finally {
            setRegenerating(false);
        }
    };

    const handleClosePasswordDialog = () => {
        setShowPasswordDialog(false);
        setGeneratedPassword(null);
        setShowPassword(false);
        setPasswordCopied(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
                <DialogHeader className="p-6 bg-slate-900 text-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-slate-900 font-bold shadow-lg ring-4 ring-white/10">
                            <Building2 className="w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Preencha as informações completas de identificação e anexos.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 bg-slate-50">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                            <User className="w-4 h-4" />
                            <span>Identificação Base</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Nome / Razão Social</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-white border-slate-200 focus:ring-amber-500 h-10"
                                    placeholder="Ex: João Silva ou Empresa LTDA"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">CPF / CNPJ</Label>
                                <div className="relative">
                                    <Input
                                        value={formData.document}
                                        onChange={e => setFormData({ ...formData, document: e.target.value })}
                                        className="bg-white border-slate-200 focus:ring-amber-500 h-10 pr-10"
                                        placeholder="00.000.000/0000-00"
                                    />
                                    {isLookupLoading && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                        </div>
                                    )}
                                </div>
                                {formData.type === 'company' && formData.document.replace(/\D/g, '').length === 14 && !isLookupLoading && (
                                    <p className="text-[10px] text-amber-600 font-medium">Buscando dados automaticamente...</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Tipo</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={v => setFormData({ ...formData, type: v as any })}
                                >
                                    <SelectTrigger className="bg-white h-10 border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Pessoa Física</SelectItem>
                                        <SelectItem value="company">Pessoa Jurídica</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Inscrição Estadual</Label>
                                <Input
                                    value={formData.stateRegistration}
                                    onChange={e => setFormData({ ...formData, stateRegistration: e.target.value })}
                                    className="bg-white border-slate-200 focus:ring-amber-500 h-10"
                                    placeholder="Isento ou Nº"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                            <MapPin className="w-4 h-4" />
                            <span>Endereço e Localização</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">CEP</Label>
                                <div className="relative">
                                    <Input
                                        value={formData.zipCode}
                                        onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                                        className="bg-white border-slate-200 focus:ring-amber-500 h-10 pr-10"
                                        placeholder="00000-000"
                                        maxLength={9}
                                    />
                                    {isCepLoading && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Logradouro</Label>
                                <Input
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="bg-white"
                                    placeholder="Rua, Avenida, etc."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Número</Label>
                                <Input
                                    value={formData.number}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    className="bg-white"
                                    placeholder="123"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Bairro</Label>
                                <Input
                                    value={formData.neighborhood}
                                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Cidade</Label>
                                <Input
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">UF</Label>
                                <Input
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    className="bg-white"
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                            <Phone className="w-4 h-4" />
                            <span>Contato e Comunicação</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">E-mail</Label>
                                <Input
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-white"
                                    type="email"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Telefone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">WhatsApp</Label>
                                <Input
                                    value={formData.whatsapp}
                                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                            <FileText className="w-4 h-4" />
                            <span>Documentação e Arquivos</span>
                        </div>

                        {/* Existing Docs */}
                        {client?.documents && client.documents.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Arquivos Atuais</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {client.documents.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm group">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-slate-700 truncate">{doc.name}</p>
                                                    <Badge variant="outline" className="text-[8px] h-4 uppercase">{doc.type}</Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-500" onClick={() => handleDownload(doc.url, doc.name)}>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleRemoveDoc(doc.id)}>
                                                    <X className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* File Uploads */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Contratos</Label>
                                <div className="relative group/upload h-24 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:border-amber-400 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center cursor-pointer">
                                    <Input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={e => handleFileChange(e, 'contract')}
                                        multiple
                                    />
                                    <Upload className="w-6 h-6 text-slate-400 group-hover/upload:text-amber-500 transition-colors" />
                                    <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Selecionar</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Identificação</Label>
                                <div className="relative group/upload h-24 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:border-amber-400 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center cursor-pointer">
                                    <Input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={e => handleFileChange(e, 'id')}
                                        multiple
                                    />
                                    <User className="w-6 h-6 text-slate-400 group-hover/upload:text-amber-500 transition-colors" />
                                    <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Selecionar</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Projeto</Label>
                                <div className="relative group/upload h-24 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:border-amber-400 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center cursor-pointer">
                                    <Input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={e => handleFileChange(e, 'project')}
                                        multiple
                                    />
                                    <Globe className="w-6 h-6 text-slate-400 group-hover/upload:text-amber-500 transition-colors" />
                                    <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Selecionar</span>
                                </div>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Uploads Pendentes</Label>
                                <div className="space-y-2">
                                    {files.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{item.file.name}</p>
                                                    <Badge variant="outline" className="text-[8px] h-4 uppercase">{item.type}</Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Vencimento</label>
                                                    <input
                                                        type="date"
                                                        value={item.expiryDate}
                                                        onChange={e => updateFileData(idx, 'expiryDate', e.target.value)}
                                                        className="text-[10px] bg-slate-50 border rounded px-1 h-6 focus:outline-amber-500"
                                                    />
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removeFile(idx)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Portal access - Regenerate password (edit mode only) */}
                    {client && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                                <KeyRound className="w-4 h-4" />
                                <span>Acesso ao Portal</span>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700">Gerar nova senha de acesso</p>
                                    <p className="text-xs text-slate-500">A senha atual será substituída por uma nova senha aleatória.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRegeneratePassword}
                                    disabled={regenerating}
                                    className="shrink-0"
                                >
                                    {regenerating ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-1" />
                                    )}
                                    Gerar Senha
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="sticky bottom-0 bg-slate-50 pt-4 pb-2 mt-8 flex justify-end gap-3 border-t border-slate-200">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 shadow-lg" disabled={loading}>
                            {loading ? 'Salvando...' : (client ? 'Salvar Alterações' : 'Finalizar Cadastro')}
                        </Button>
                    </div>
                </form>
            </DialogContent>

            {/* Password Reveal Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={(open) => { if (!open) handleClosePasswordDialog(); }}>
                <DialogContent className="max-w-md p-0 border-none shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <KeyRound className="w-7 h-7" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold">Acesso ao Portal Criado</DialogTitle>
                                <DialogDescription className="text-emerald-200 text-sm">
                                    Envie estas credenciais para o cliente
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail (Login)</p>
                                <p className="text-sm font-medium text-slate-800">{formData.email}</p>
                            </div>
                            <div className="border-t border-slate-200 pt-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Senha Gerada</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-lg font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 tracking-widest">
                                        {showPassword ? generatedPassword : '••••••••'}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-9 w-9 shrink-0 ${passwordCopied ? 'text-emerald-600' : ''}`}
                                        onClick={handleCopyPassword}
                                    >
                                        {passwordCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs text-amber-700">
                                ⚠️ <strong>Atenção:</strong> Esta senha não será exibida novamente. Copie e envie para o cliente agora.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {formData.whatsapp && (
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={handleShareWhatsApp}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Enviar via WhatsApp
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleCopyPassword}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                {passwordCopied ? 'Copiado!' : 'Copiar Senha'}
                            </Button>
                        </div>

                        <Button
                            className="w-full mt-2"
                            variant="ghost"
                            onClick={handleClosePasswordDialog}
                        >
                            Fechar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
