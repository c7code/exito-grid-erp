import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api } from '@/api';
import { Truck, Plus, Search, MoreVertical, Star, Phone, Mail, MapPin, Trash2, Edit, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const segmentLabels: Record<string, string> = { material: 'Material', service: 'Serviço', both: 'Ambos' };
const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
    inactive: { label: 'Inativo', color: 'bg-slate-100 text-slate-600' },
    blocked: { label: 'Bloqueado', color: 'bg-red-100 text-red-700' },
};

const emptyForm = {
    name: '', tradeName: '', cnpj: '', email: '', phone: '', whatsapp: '',
    address: '', city: '', state: '', zipCode: '',
    segment: 'material', status: 'active', rating: 0, notes: '', paymentTerms: '',
};

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterSegment, setFilterSegment] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [showContactDialog, setShowContactDialog] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState(emptyForm);
    const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', role: '', isPrimary: false });
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [cnpjLoading, setCnpjLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const data = await api.getSuppliers(filterSegment ? { segment: filterSegment } : undefined);
            setSuppliers(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [filterSegment]);

    // ═══ AUTO-PREENCHIMENTO CNPJ ═══
    useEffect(() => {
        const clean = form.cnpj.replace(/\D/g, '');
        if (clean.length === 14) {
            const timer = setTimeout(async () => {
                setCnpjLoading(true);
                try {
                    const data = await api.fetchCnpjData(clean);
                    setForm(p => ({
                        ...p,
                        name: data.razao_social || p.name,
                        tradeName: data.nome_fantasia || p.tradeName,
                        address: data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'}` : p.address,
                        city: data.municipio || p.city,
                        state: data.uf || p.state,
                        zipCode: data.cep || p.zipCode,
                    }));
                    toast.success('Dados do fornecedor preenchidos pelo CNPJ');
                } catch {
                    // Silently fail
                } finally { setCnpjLoading(false); }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [form.cnpj]);

    // ═══ AUTO-PREENCHIMENTO CEP ═══
    useEffect(() => {
        const clean = form.zipCode.replace(/\D/g, '');
        if (clean.length === 8) {
            const timer = setTimeout(async () => {
                setCepLoading(true);
                try {
                    const data = await api.fetchCepData(clean);
                    setForm(p => ({
                        ...p,
                        address: data.logradouro || p.address,
                        city: data.localidade || p.city,
                        state: data.uf || p.state,
                    }));
                    toast.success('Endereço preenchido pelo CEP');
                } catch {
                    // Silently fail
                } finally { setCepLoading(false); }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [form.zipCode]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) {
                await api.updateSupplier(editing.id, form);
            } else {
                await api.createSupplier(form);
            }
            setShowDialog(false);
            load();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Erro ao salvar');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir este fornecedor?')) return;
        try { await api.deleteSupplier(id); load(); } catch (e) { console.error(e); }
    };

    const openEdit = (s: any) => {
        setEditing(s);
        setForm({ name: s.name, tradeName: s.tradeName || '', cnpj: s.cnpj || '', email: s.email || '', phone: s.phone || '', whatsapp: s.whatsapp || '', address: s.address || '', city: s.city || '', state: s.state || '', zipCode: s.zipCode || '', segment: s.segment, status: s.status, rating: s.rating, notes: s.notes || '', paymentTerms: s.paymentTerms || '' });
        setShowDialog(true);
    };

    const openNew = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };

    const handleAddContact = async () => {
        if (!selectedSupplier || !contactForm.name) return;
        setSaving(true);
        try {
            await api.addSupplierContact(selectedSupplier.id, contactForm);
            setContactForm({ name: '', email: '', phone: '', role: '', isPrimary: false });
            const updated = await api.getSupplier(selectedSupplier.id);
            setSelectedSupplier(updated);
            load();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDeleteContact = async (contactId: string) => {
        try {
            await api.deleteSupplierContact(contactId);
            const updated = await api.getSupplier(selectedSupplier.id);
            setSelectedSupplier(updated);
            load();
        } catch (e) { console.error(e); }
    };

    const filtered = suppliers.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.cnpj?.includes(search) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-7 h-7 text-amber-500" /> Fornecedores
                    </h1>
                    <p className="text-slate-500 mt-1">Cadastro e gestão de fornecedores</p>
                </div>
                <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
                    <Plus className="w-4 h-4 mr-2" /> Novo Fornecedor
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Buscar por nome, CNPJ ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterSegment} onValueChange={setFilterSegment}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Segmento" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="service">Serviço</SelectItem>
                        <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{suppliers.length}</p><p className="text-sm text-slate-500">Total</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{suppliers.filter(s => s.status === 'active').length}</p><p className="text-sm text-slate-500">Ativos</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{suppliers.filter(s => s.segment === 'material').length}</p><p className="text-sm text-slate-500">Material</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{suppliers.filter(s => s.segment === 'service').length}</p><p className="text-sm text-slate-500">Serviço</p></CardContent></Card>
            </div>

            {/* Supplier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <p className="text-slate-500 col-span-3 text-center py-12">Carregando...</p>
                ) : filtered.length === 0 ? (
                    <p className="text-slate-500 col-span-3 text-center py-12">Nenhum fornecedor encontrado</p>
                ) : (
                    filtered.map(s => {
                        const st = statusConfig[s.status] || statusConfig.active;
                        return (
                            <Card key={s.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                                <Truck className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{s.name}</h3>
                                                {s.tradeName && <p className="text-xs text-slate-500">{s.tradeName}</p>}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(s)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setSelectedSupplier(s); setShowContactDialog(true); }}><UserPlus className="w-4 h-4 mr-2" />Contatos</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="space-y-1.5 text-sm text-slate-600">
                                        {s.cnpj && <p className="font-mono text-xs">{s.cnpj}</p>}
                                        {s.email && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{s.email}</p>}
                                        {s.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{s.phone}</p>}
                                        {s.city && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{s.city}/{s.state}</p>}
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-xs">{segmentLabels[s.segment]}</Badge>
                                            <Badge className={cn('text-xs', st.color)}>{st.label}</Badge>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star key={i} className={cn('w-3.5 h-3.5', i <= s.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Dialog Fornecedor */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium">Razão Social *</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                            <div><label className="text-sm font-medium">Nome Fantasia</label><Input value={form.tradeName} onChange={e => setForm(p => ({ ...p, tradeName: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium">CNPJ</label>
                                <div className="relative">
                                    <Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} />
                                    {cnpjLoading && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div><label className="text-sm font-medium">E-mail</label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                            <div><label className="text-sm font-medium">Telefone</label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium">WhatsApp</label><Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} /></div>
                            <div>
                                <label className="text-sm font-medium">Segmento</label>
                                <Select value={form.segment} onValueChange={v => setForm(p => ({ ...p, segment: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="material">Material</SelectItem>
                                        <SelectItem value="service">Serviço</SelectItem>
                                        <SelectItem value="both">Ambos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium">CEP</label>
                                <div className="relative">
                                    <Input value={form.zipCode} onChange={e => setForm(p => ({ ...p, zipCode: e.target.value }))} />
                                    {cepLoading && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-2"><label className="text-sm font-medium">Endereço</label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
                            <div><label className="text-sm font-medium">Cidade</label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="text-sm font-medium">UF</label><Input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} maxLength={2} /></div>
                            <div><label className="text-sm font-medium">Condições de Pagamento</label><Input value={form.paymentTerms} onChange={e => setForm(p => ({ ...p, paymentTerms: e.target.value }))} placeholder="Ex: 30/60/90 dias" /></div>
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                        <SelectItem value="blocked">Bloqueado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Avaliação</label>
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <button key={i} type="button" onClick={() => setForm(p => ({ ...p, rating: i }))}>
                                        <Star className={cn('w-6 h-6 cursor-pointer', i <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div><label className="text-sm font-medium">Observações</label><textarea className="w-full border rounded-md p-2 text-sm h-20 resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={!form.name || saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog Contatos */}
            <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Contatos — {selectedSupplier?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {(selectedSupplier?.contacts || []).length > 0 && (
                            <div className="space-y-2">
                                {selectedSupplier.contacts.map((c: any) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{c.name} {c.isPrimary && <Badge className="ml-1 text-xs bg-amber-100 text-amber-700">Principal</Badge>}</p>
                                            <p className="text-xs text-slate-500">{c.role} • {c.email} • {c.phone}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteContact(c.id)}>
                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-2">Adicionar Contato</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Nome" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
                                <Input placeholder="Cargo" value={contactForm.role} onChange={e => setContactForm(p => ({ ...p, role: e.target.value }))} />
                                <Input placeholder="E-mail" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
                                <Input placeholder="Telefone" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} />
                            </div>
                            <label className="flex items-center gap-2 mt-2 text-sm">
                                <input type="checkbox" checked={contactForm.isPrimary} onChange={e => setContactForm(p => ({ ...p, isPrimary: e.target.checked }))} />
                                Contato principal
                            </label>
                            <Button onClick={handleAddContact} disabled={!contactForm.name || saving} className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-slate-900">
                                {saving ? 'Salvando...' : 'Adicionar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
