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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface QuickClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientCreated: (client: { id: string; name: string }) => void;
}

export default function QuickClientDialog({
    open,
    onOpenChange,
    onClientCreated,
}: QuickClientDialogProps) {
    const [loading, setLoading] = useState(false);
    const [searchingCnpj, setSearchingCnpj] = useState(false);
    const [form, setForm] = useState({
        name: '',
        type: 'company' as 'individual' | 'company',
        document: '',
        companyName: '',
        tradeName: '',
        email: '',
        phone: '',
        segment: 'commercial' as string,
        address: '',
        city: '',
        state: '',
        zipCode: '',
        neighborhood: '',
    });

    const resetForm = () => {
        setForm({
            name: '',
            type: 'company',
            document: '',
            companyName: '',
            tradeName: '',
            email: '',
            phone: '',
            segment: 'commercial',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            neighborhood: '',
        });
    };

    const formatDocument = (value: string, type: string) => {
        const numbers = value.replace(/\D/g, '');
        if (type === 'company') {
            // CNPJ: 00.000.000/0000-00
            return numbers
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .substring(0, 18);
        }
        // CPF: 000.000.000-00
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .substring(0, 14);
    };

    const handleSearchCnpj = async () => {
        const cleanDoc = form.document.replace(/\D/g, '');
        if (cleanDoc.length !== 14) {
            toast.error('CNPJ deve ter 14 dígitos.');
            return;
        }
        setSearchingCnpj(true);
        try {
            const data = await api.fetchCnpjData(cleanDoc);
            setForm(prev => ({
                ...prev,
                name: data.nome_fantasia || data.razao_social || prev.name,
                companyName: data.razao_social || '',
                tradeName: data.nome_fantasia || '',
                email: data.email || prev.email,
                phone: data.ddd_telefone_1 || prev.phone,
                address: data.logradouro || '',
                city: data.municipio || '',
                state: data.uf || '',
                zipCode: data.cep || '',
                neighborhood: data.bairro || '',
            }));
            toast.success('Dados do CNPJ encontrados!');
        } catch {
            toast.error('CNPJ não encontrado na base da Receita Federal.');
        } finally {
            setSearchingCnpj(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Nome do cliente é obrigatório.');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                name: form.name,
                type: form.type,
                segment: form.segment,
            };
            if (form.document) payload.document = form.document.replace(/\D/g, '');
            if (form.companyName) payload.companyName = form.companyName;
            if (form.tradeName) payload.tradeName = form.tradeName;
            if (form.email) payload.email = form.email;
            if (form.phone) payload.phone = form.phone;
            if (form.address) payload.address = form.address;
            if (form.city) payload.city = form.city;
            if (form.state) payload.state = form.state;
            if (form.zipCode) payload.zipCode = form.zipCode;
            if (form.neighborhood) payload.neighborhood = form.neighborhood;

            const result = await api.createClient(payload);
            toast.success(`Cliente "${form.name}" cadastrado com sucesso!`);
            onClientCreated({ id: result.id, name: form.name });
            resetForm();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Erro ao cadastrar cliente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Cadastro Rápido de Cliente</DialogTitle>
                            <DialogDescription>Preencha os dados mínimos para criar um novo cliente.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Tipo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo *</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) => setForm({ ...form, type: v as any })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="company">Pessoa Jurídica</SelectItem>
                                    <SelectItem value="individual">Pessoa Física</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Segmento</Label>
                            <Select
                                value={form.segment}
                                onValueChange={(v) => setForm({ ...form, segment: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="residential">Residencial</SelectItem>
                                    <SelectItem value="commercial">Comercial</SelectItem>
                                    <SelectItem value="industrial">Industrial</SelectItem>
                                    <SelectItem value="condominium">Condomínio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* CPF/CNPJ com busca */}
                    <div>
                        <Label>{form.type === 'company' ? 'CNPJ' : 'CPF'}</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder={form.type === 'company' ? '00.000.000/0000-00' : '000.000.000-00'}
                                value={form.document}
                                onChange={(e) => setForm({ ...form, document: formatDocument(e.target.value, form.type) })}
                                maxLength={form.type === 'company' ? 18 : 14}
                            />
                            {form.type === 'company' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleSearchCnpj}
                                    disabled={searchingCnpj}
                                    title="Buscar CNPJ"
                                    className="shrink-0"
                                >
                                    {searchingCnpj ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Nome */}
                    <div>
                        <Label>Nome *</Label>
                        <Input
                            placeholder="Nome do cliente ou empresa"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Razão Social / Nome Fantasia (PJ) */}
                    {form.type === 'company' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Razão Social</Label>
                                <Input
                                    placeholder="Razão social"
                                    value={form.companyName}
                                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Nome Fantasia</Label>
                                <Input
                                    placeholder="Nome fantasia"
                                    value={form.tradeName}
                                    onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Contato */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>E-mail</Label>
                            <Input
                                type="email"
                                placeholder="email@exemplo.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Telefone</Label>
                            <Input
                                placeholder="(81) 99999-0000"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Endereço (colapsável se tiver dados) */}
                    {(form.address || form.city) && (
                        <div className="border-t pt-3 space-y-3">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">📍 Endereço</p>
                            <div>
                                <Label>Logradouro</Label>
                                <Input
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label>Bairro</Label>
                                    <Input
                                        value={form.neighborhood}
                                        onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Cidade</Label>
                                    <Input
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>UF</Label>
                                    <Input
                                        value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            disabled={loading || !form.name.trim()}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {loading ? 'Salvando...' : 'Cadastrar Cliente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
