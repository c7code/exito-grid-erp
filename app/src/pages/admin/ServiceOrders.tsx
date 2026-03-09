import { useState, useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Wrench, Plus, Search, Loader2, Clock, CheckCircle2, AlertCircle, Pause, Eye,
    Calendar, User, Building2, MapPin, ArrowLeft, Save,
    DollarSign, ClipboardList, Trash2,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    open: { label: 'Aberta', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
    in_progress: { label: 'Em Andamento', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    completed: { label: 'Concluída', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
    on_hold: { label: 'Suspensa', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Pause },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
    medium: { label: 'Média', color: 'bg-blue-100 text-blue-600' },
    high: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
    urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

const categoryOptions = [
    { value: 'installation', label: 'Instalação Elétrica' },
    { value: 'maintenance', label: 'Manutenção' },
    { value: 'repair', label: 'Reparo / Corretiva' },
    { value: 'inspection', label: 'Inspeção / Vistoria' },
    { value: 'network_extension', label: 'Extensão de Rede' },
    { value: 'solar', label: 'Energia Solar' },
    { value: 'grounding', label: 'Aterramento / SPDA' },
    { value: 'measurement', label: 'Medição / Laudo' },
    { value: 'commissioning', label: 'Comissionamento' },
    { value: 'other', label: 'Outro' },
];

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ServiceOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [works, setWorks] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Views
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selected, setSelected] = useState<any>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [saving, setSaving] = useState(false);

    const emptyForm = {
        title: '', description: '', status: 'open', priority: 'medium', category: '',
        workId: '', clientId: '', assignedToId: '',
        address: '', neighborhood: '', city: '', state: '', zipCode: '',
        scheduledDate: '', startTime: '', endTime: '',
        technicianNotes: '', laborCost: '', materialCost: '',
        useClientAddress: true,
    };
    const [form, setForm] = useState<any>(emptyForm);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [osData, wkData, clData, empData] = await Promise.allSettled([
                api.getServiceOrders(),
                api.getWorks(),
                api.getClients(),
                api.getEmployees?.() || Promise.resolve([]),
            ]);
            setOrders(osData.status === 'fulfilled' ? (Array.isArray(osData.value) ? osData.value : []) : []);
            setWorks(wkData.status === 'fulfilled' ? (Array.isArray(wkData.value) ? wkData.value : (wkData.value?.data ?? [])) : []);
            setClients(clData.status === 'fulfilled' ? (Array.isArray(clData.value) ? clData.value : (clData.value?.data ?? [])) : []);
            setEmployees(empData.status === 'fulfilled' ? (Array.isArray(empData.value) ? empData.value : (empData.value?.data ?? [])) : []);
        } catch { /* */ } finally { setLoading(false); }
    };

    // ══ Smart Address ══ When client changes, auto-fill address
    const handleClientChange = (clientId: string) => {
        setForm((f: any) => {
            const updated = { ...f, clientId };
            if (clientId && clientId !== '__none__') {
                const client = clients.find((c: any) => c.id === clientId);
                if (client && f.useClientAddress) {
                    updated.address = client.address || '';
                    updated.neighborhood = client.neighborhood || '';
                    updated.city = client.city || '';
                    updated.state = client.state || '';
                    updated.zipCode = client.zipCode || '';
                }
            }
            return updated;
        });
    };

    // When work changes, auto-fill address from work (and its client)
    const handleWorkChange = (workId: string) => {
        setForm((f: any) => {
            const updated = { ...f, workId };
            if (workId && workId !== '__none__') {
                const work = works.find((w: any) => w.id === workId);
                if (work) {
                    // Auto-set client from work
                    if (work.clientId && !f.clientId) {
                        updated.clientId = work.clientId;
                    }
                    // Use work address if available
                    if (work.address && f.useClientAddress) {
                        updated.address = work.address || '';
                        updated.city = work.city || '';
                        updated.state = work.state || '';
                    }
                }
            }
            return updated;
        });
    };

    const handleToggleClientAddress = (checked: boolean) => {
        setForm((f: any) => {
            const updated = { ...f, useClientAddress: checked };
            if (checked && f.clientId) {
                const client = clients.find((c: any) => c.id === f.clientId);
                if (client) {
                    updated.address = client.address || '';
                    updated.neighborhood = client.neighborhood || '';
                    updated.city = client.city || '';
                    updated.state = client.state || '';
                    updated.zipCode = client.zipCode || '';
                }
            } else if (!checked) {
                updated.address = '';
                updated.neighborhood = '';
                updated.city = '';
                updated.state = '';
                updated.zipCode = '';
            }
            return updated;
        });
    };

    const handleCreate = async () => {
        if (!form.title) { toast.error('Título obrigatório'); return; }
        setSaving(true);
        try {
            const payload = { ...form };
            // Clean sentinel values
            if (payload.clientId === '__none__') payload.clientId = '';
            if (payload.workId === '__none__') payload.workId = '';
            if (payload.assignedToId === '__none__') payload.assignedToId = '';
            if (payload.category === '__none__') payload.category = '';
            delete payload.useClientAddress;
            // Build full address string
            const parts = [payload.address, payload.neighborhood, payload.city, payload.state].filter(Boolean);
            if (parts.length > 1 && !payload.address.includes(payload.city || '###')) {
                payload.address = parts.join(', ');
            }
            await api.createServiceOrder(payload);
            toast.success('OS criada com sucesso!');
            setShowCreateDialog(false);
            setForm(emptyForm);
            loadData();
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao criar OS'); }
        finally { setSaving(false); }
    };

    const handleSave = async () => {
        if (!selected?.id) return;
        setSaving(true);
        try {
            const payload = { ...form };
            if (payload.clientId === '__none__') payload.clientId = '';
            if (payload.workId === '__none__') payload.workId = '';
            if (payload.assignedToId === '__none__') payload.assignedToId = '';
            if (payload.category === '__none__') payload.category = '';
            delete payload.useClientAddress;
            await api.updateServiceOrder(selected.id, payload);
            toast.success('OS atualizada!');
            loadData();
            // Reload detail
            const updated = await api.getServiceOrder?.(selected.id) || payload;
            setSelected({ ...selected, ...updated });
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta OS?')) return;
        try {
            await api.deleteServiceOrder(id);
            toast.success('OS excluída');
            setView('list');
            loadData();
        } catch { toast.error('Erro ao excluir'); }
    };

    const orderToForm = (o: any) => ({
        title: o.title || '', description: o.description || '', status: o.status || 'open',
        priority: o.priority || 'medium', category: o.category || '',
        workId: o.workId || '', clientId: o.clientId || '', assignedToId: o.assignedToId || '',
        address: o.address || '', neighborhood: '', city: o.city || '', state: o.state || '', zipCode: '',
        scheduledDate: o.scheduledDate?.slice?.(0, 10) || '', startTime: o.startTime || '', endTime: o.endTime || '',
        technicianNotes: o.technicianNotes || '', laborCost: o.laborCost || '', materialCost: o.materialCost || '',
        useClientAddress: false,
    });

    const openDetail = (o: any) => {
        setSelected(o);
        setForm(orderToForm(o));
        setView('detail');
    };

    const openNew = () => {
        setForm(emptyForm);
        setShowCreateDialog(true);
    };

    const filtered = orders.filter(o => {
        if (filterStatus !== 'all' && o.status !== filterStatus) return false;
        if (!search) return true;
        const s = search.toLowerCase();
        return o.title?.toLowerCase().includes(s) || o.code?.toLowerCase().includes(s) || o.client?.name?.toLowerCase().includes(s);
    });

    const stats = {
        total: orders.length,
        open: orders.filter(o => o.status === 'open').length,
        inProgress: orders.filter(o => o.status === 'in_progress').length,
        completed: orders.filter(o => o.status === 'completed').length,
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

    // ═══════════ DETAIL VIEW ═══════════
    if (view === 'detail' && selected) {
        return (
            <div className="space-y-4">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => { setView('list'); setSelected(null); }}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                        </Button>
                        <span className="font-mono text-sm text-slate-400">{selected.code}</span>
                        {selected.status && (() => {
                            const st = statusConfig[selected.status] || statusConfig.open;
                            return <Badge className={st.color}>{st.label}</Badge>;
                        })()}
                    </div>
                    <div className="flex items-center gap-2">
                        {selected.id && (
                            <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDelete(selected.id)}>
                                <Trash2 className="w-4 h-4 mr-1" /> Excluir
                            </Button>
                        )}
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                            <Save className="w-4 h-4 mr-1" /> Salvar
                        </Button>
                    </div>
                </div>

                {/* Tabbed Editor */}
                <Tabs defaultValue="geral" className="bg-white rounded-xl border">
                    <TabsList className="w-full justify-start border-b rounded-none bg-slate-50 px-4 pt-2">
                        <TabsTrigger value="geral" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Dados Gerais</TabsTrigger>
                        <TabsTrigger value="local" className="gap-1.5"><MapPin className="w-3.5 h-3.5" /> Local / Endereço</TabsTrigger>
                        <TabsTrigger value="exec" className="gap-1.5"><Wrench className="w-3.5 h-3.5" /> Execução</TabsTrigger>
                        <TabsTrigger value="financeiro" className="gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Financeiro</TabsTrigger>
                    </TabsList>

                    {/* TAB: Dados Gerais */}
                    <TabsContent value="geral" className="p-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Label className="text-xs font-medium text-slate-600">Título *</Label>
                                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Categoria</Label>
                                <Select value={form.category || '__none__'} onValueChange={v => setForm({ ...form, category: v === '__none__' ? '' : v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Selecione...</SelectItem>
                                        {categoryOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Status</Label>
                                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Prioridade</Label>
                                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Cliente</Label>
                                <Select value={form.clientId || '__none__'} onValueChange={handleClientChange}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Nenhum</SelectItem>
                                        {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Obra</Label>
                                <Select value={form.workId || '__none__'} onValueChange={handleWorkChange}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Nenhuma</SelectItem>
                                        {works.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.code} - {w.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Técnico Responsável</Label>
                                <Select value={form.assignedToId || '__none__'} onValueChange={v => setForm({ ...form, assignedToId: v === '__none__' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Nenhum</SelectItem>
                                        {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Data Agendada</Label>
                                <Input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} />
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Hora Início</Label>
                                <Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Hora Fim</Label>
                                <Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                            </div>
                            <div className="col-span-3">
                                <Label className="text-xs font-medium text-slate-600">Descrição do Serviço</Label>
                                <Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva detalhadamente o serviço a ser executado..." />
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB: Local / Endereço */}
                    <TabsContent value="local" className="p-6">
                        <div className="space-y-4">
                            {form.clientId && (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <input type="checkbox" checked={form.useClientAddress}
                                        onChange={e => handleToggleClientAddress(e.target.checked)}
                                        className="rounded border-blue-300" />
                                    <span className="text-sm text-blue-800">
                                        Usar endereço do cliente ({clients.find((c: any) => c.id === form.clientId)?.name})
                                    </span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <Label className="text-xs font-medium text-slate-600">Endereço</Label>
                                    <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value, useClientAddress: false })} placeholder="Rua, Av..." />
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-slate-600">Bairro</Label>
                                    <Input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-slate-600">Cidade</Label>
                                    <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-slate-600">Estado</Label>
                                    <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="PE" />
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-slate-600">CEP</Label>
                                    <Input value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} placeholder="00000-000" />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB: Execução */}
                    <TabsContent value="exec" className="p-6 space-y-4">
                        <div>
                            <Label className="text-xs font-medium text-slate-600">Notas do Técnico</Label>
                            <Textarea rows={5} value={form.technicianNotes} onChange={e => setForm({ ...form, technicianNotes: e.target.value })} placeholder="Observações sobre a execução do serviço..." />
                        </div>
                        {selected?.checklist?.length > 0 && (
                            <div>
                                <Label className="text-xs font-medium text-slate-600 uppercase">Checklist</Label>
                                <div className="space-y-2 mt-2">
                                    {selected.checklist.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                                            <input type="checkbox" checked={item.completed} readOnly className="rounded" />
                                            <span className={`text-sm ${item.completed ? 'line-through text-slate-400' : ''}`}>{item.item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {selected?.materialsUsed?.length > 0 && (
                            <div>
                                <Label className="text-xs font-medium text-slate-600 uppercase">Materiais Utilizados</Label>
                                <div className="mt-2 border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr><th className="px-3 py-2 text-left">Material</th><th className="px-3 py-2">Qtd</th><th className="px-3 py-2">Unid</th><th className="px-3 py-2 text-right">Custo</th></tr>
                                        </thead>
                                        <tbody>
                                            {selected.materialsUsed.map((m: any, i: number) => (
                                                <tr key={i} className="border-t">
                                                    <td className="px-3 py-2">{m.name}</td>
                                                    <td className="px-3 py-2 text-center">{m.quantity}</td>
                                                    <td className="px-3 py-2 text-center">{m.unit}</td>
                                                    <td className="px-3 py-2 text-right">{fmt(m.unitCost)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* TAB: Financeiro */}
                    <TabsContent value="financeiro" className="p-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Custo Mão de Obra (R$)</Label>
                                <Input type="number" step="0.01" value={form.laborCost} onChange={e => setForm({ ...form, laborCost: e.target.value })} />
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Custo Material (R$)</Label>
                                <Input type="number" step="0.01" value={form.materialCost} onChange={e => setForm({ ...form, materialCost: e.target.value })} />
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-slate-600">Total (R$)</Label>
                                <div className="px-3 py-2 bg-slate-50 rounded-md border font-bold text-lg text-slate-900 mt-0.5">
                                    {fmt(Number(form.laborCost || 0) + Number(form.materialCost || 0))}
                                </div>
                            </div>
                        </div>
                        {selected?.completedAt && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800">
                                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                Concluída em {new Date(selected.completedAt).toLocaleString('pt-BR')}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    // ═══════════ LIST VIEW ═══════════
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Wrench className="w-7 h-7 text-amber-500" /> Ordens de Serviço</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestão de ordens de serviço e atendimentos técnicos</p>
                </div>
                <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg"><Plus className="w-4 h-4 mr-2" /> Nova OS</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Total</p><p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-blue-500 uppercase font-bold">Abertas</p><p className="text-2xl font-bold text-blue-600 mt-1">{stats.open}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-amber-500 uppercase font-bold">Em Andamento</p><p className="text-2xl font-bold text-amber-600 mt-1">{stats.inProgress}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-green-500 uppercase font-bold">Concluídas</p><p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar OS..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos os status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-400"><Wrench className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="font-medium">Nenhuma OS encontrada</p></div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(o => {
                        const st = statusConfig[o.status] || statusConfig.open;
                        const pr = priorityConfig[o.priority] || priorityConfig.medium;
                        const cat = categoryOptions.find(c => c.value === o.category);
                        const StIcon = st.icon;
                        return (
                            <div key={o.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(o)}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-mono text-xs text-slate-400">{o.code}</span>
                                            <Badge className={st.color}><StIcon className="w-3 h-3 mr-1" />{st.label}</Badge>
                                            <Badge className={pr.color}>{pr.label}</Badge>
                                            {cat && <Badge variant="outline" className="text-xs">{cat.label}</Badge>}
                                        </div>
                                        <h3 className="font-semibold text-slate-900">{o.title}</h3>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                                            {o.client && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{o.client.name}</span>}
                                            {o.assignedTo && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{o.assignedTo.name}</span>}
                                            {o.scheduledDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(o.scheduledDate).toLocaleDateString('pt-BR')}</span>}
                                            {o.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{o.address.substring(0, 40)}{o.address.length > 40 ? '...' : ''}</span>}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ ENHANCED CREATE DIALOG ═══ */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Wrench className="w-5 h-5 text-amber-500" /> Nova Ordem de Serviço</DialogTitle>
                        <DialogDescription>Preencha os dados da nova OS. O endereço será preenchido automaticamente ao selecionar o cliente.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        {/* Row 1: Title + Category */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <Label>Título *</Label>
                                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Manutenção quadro elétrico - Unid A" />
                            </div>
                            <div>
                                <Label>Categoria</Label>
                                <Select value={form.category || '__none__'} onValueChange={v => setForm({ ...form, category: v === '__none__' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Selecione...</SelectItem>
                                        {categoryOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 2: Priority, Date, Time */}
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <Label>Prioridade</Label>
                                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Data Agendada</Label>
                                <Input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} />
                            </div>
                            <div>
                                <Label>Hora Início</Label>
                                <Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                            </div>
                            <div>
                                <Label>Hora Fim</Label>
                                <Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                            </div>
                        </div>

                        {/* Row 3: Client, Work, Technician */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label>Cliente</Label>
                                <Select value={form.clientId || '__none__'} onValueChange={handleClientChange}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Nenhum</SelectItem>
                                        {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Obra Vinculada</Label>
                                <Select value={form.workId || '__none__'} onValueChange={handleWorkChange}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Nenhuma</SelectItem>
                                        {works.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.code} - {w.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Técnico Responsável</Label>
                                <Select value={form.assignedToId || '__none__'} onValueChange={v => setForm({ ...form, assignedToId: v === '__none__' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Nenhum</SelectItem>
                                        {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="border rounded-lg p-4 space-y-3 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                                    <MapPin className="w-4 h-4 text-amber-500" /> Endereço do Atendimento
                                </Label>
                                {form.clientId && form.clientId !== '__none__' && (
                                    <label className="flex items-center gap-2 text-xs text-blue-700 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                                        <input type="checkbox" checked={form.useClientAddress}
                                            onChange={e => handleToggleClientAddress(e.target.checked)}
                                            className="rounded border-blue-300" />
                                        Usar endereço do cliente
                                    </label>
                                )}
                            </div>
                            {form.address && form.useClientAddress && (
                                <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200 text-xs text-green-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Endereço preenchido a partir do cliente: <strong>{clients.find((c: any) => c.id === form.clientId)?.name}</strong>
                                </div>
                            )}
                            <div className="grid grid-cols-6 gap-3">
                                <div className="col-span-4">
                                    <Label className="text-xs text-slate-500">Endereço</Label>
                                    <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value, useClientAddress: false })} placeholder="Rua, Av, Número..." />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs text-slate-500">Bairro</Label>
                                    <Input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs text-slate-500">Cidade</Label>
                                    <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Estado</Label>
                                    <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="PE" maxLength={2} />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">CEP</Label>
                                    <Input value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} placeholder="00000-000" />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <Label>Descrição do Serviço</Label>
                            <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva detalhadamente o serviço a ser executado..." />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar OS
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
