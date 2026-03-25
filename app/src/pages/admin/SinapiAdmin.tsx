import { useState, useEffect, useRef } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Database, Upload, FileSpreadsheet, Search, Loader2, CheckCircle2, XCircle,
    RefreshCw, Trash2, Settings2, Calculator, Building2, DollarSign, TrendingUp, Eye, Plus,
    Star, ChevronDown, ChevronRight, BarChart3
} from 'lucide-react';

type Tab = 'import' | 'references' | 'profiles' | 'search' | 'logs';
const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export default function SinapiAdmin() {
    const [tab, setTab] = useState<Tab>('import');
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try { const r = await api.client.get('/sinapi/stats'); setStats(r.data || {}); }
        catch { /* */ } finally { setLoading(false); }
    };

    const tabs: { key: Tab; label: string; icon: any }[] = [
        { key: 'import', label: 'Importação', icon: Upload },
        { key: 'references', label: 'Referências', icon: Database },
        { key: 'profiles', label: 'Perfis Comerciais', icon: DollarSign },
        { key: 'search', label: 'Consulta', icon: Search },
        { key: 'logs', label: 'Logs', icon: BarChart3 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Database className="w-7 h-7 text-blue-600" /> SINAPI — Base de Custos
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Importação, consulta de referências, perfis de precificação e auditoria</p>
                </div>
                <Button variant="outline" onClick={loadStats} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Referências</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.references || 0}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Insumos</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{(stats.inputs || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Composições</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{(stats.compositions || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Preços</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{(stats.prices || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Perfis</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{stats.profiles || 0}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b overflow-x-auto">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        onClick={() => setTab(t.key)}
                    >
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'import' && <TabImport onRefresh={loadStats} />}
            {tab === 'references' && <TabReferences onRefresh={loadStats} />}
            {tab === 'profiles' && <TabProfiles onRefresh={loadStats} />}
            {tab === 'search' && <TabSearch />}
            {tab === 'logs' && <TabLogs />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TAB: IMPORTAÇÃO
// ═══════════════════════════════════════════════════════════════
function TabImport({ onRefresh }: { onRefresh: () => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({ state: '', year: '', month: '', taxRegime: '', fileType: '' });
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    useEffect(() => { loadLogs(); }, []);

    const loadLogs = async () => {
        setLoadingLogs(true);
        try { const r = await api.client.get('/sinapi/import/logs?limit=20'); setLogs(Array.isArray(r.data) ? r.data : []); }
        catch { /* */ } finally { setLoadingLogs(false); }
    };

    const handleUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) { toast.error('Selecione um arquivo'); return; }

        const fd = new FormData();
        fd.append('file', file);
        if (form.state) fd.append('state', form.state);
        if (form.year) fd.append('year', form.year);
        if (form.month) fd.append('month', form.month);
        if (form.taxRegime) fd.append('taxRegime', form.taxRegime);
        if (form.fileType) fd.append('fileType', form.fileType);

        setUploading(true);
        try {
            const token = localStorage.getItem('electraflow_token');
            const r = await api.client.post('/sinapi/import/upload', fd, {
                headers: {
                    'Content-Type': undefined as any, // Let axios set multipart boundary automatically
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                timeout: 120000, // 2 min timeout for large files
            });
            toast.success(`Importação concluída: ${r.data?.rowsProcessed || 0} registros`);
            if (fileRef.current) fileRef.current.value = '';
            loadLogs(); onRefresh();
        } catch (e: any) {
            if (e?.response?.status !== 401) {
                toast.error(e?.response?.data?.message || 'Erro na importação');
            }
        }
        finally { setUploading(false); }
    };

    const handleRollback = async (logId: string) => {
        if (!confirm('Tem certeza que deseja reverter esta importação?')) return;
        try { await api.client.post(`/sinapi/import/rollback/${logId}`); toast.success('Importação revertida'); loadLogs(); onRefresh(); }
        catch (e: any) { toast.error(e?.response?.data?.message || 'Erro no rollback'); }
    };

    return (
        <div className="space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-xl border p-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Importar Arquivo SINAPI
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                        <Label>Arquivo (XLSX, XLS ou CSV)</Label>
                        <Input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" className="mt-1" />
                    </div>
                    <div>
                        <Label>UF (auto-detecção se vazio)</Label>
                        <Select value={form.state} onValueChange={v => setForm({ ...form, state: v })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Auto" /></SelectTrigger>
                            <SelectContent>{UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div><Label>Ano</Label><Input type="number" placeholder="Auto" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="mt-1" /></div>
                        <div><Label>Mês</Label><Input type="number" placeholder="Auto" min={1} max={12} value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="mt-1" /></div>
                    </div>
                    <div>
                        <Label>Regime</Label>
                        <Select value={form.taxRegime} onValueChange={v => setForm({ ...form, taxRegime: v })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Auto" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nao_desonerado">Não Desonerado</SelectItem>
                                <SelectItem value="desonerado">Desonerado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleUpload} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {uploading ? 'Importando...' : 'Importar'}
                    </Button>
                </div>
            </div>

            {/* Import Logs */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Histórico de Importações</h3>
                    <Button variant="ghost" size="sm" onClick={loadLogs}><RefreshCw className="w-3.5 h-3.5" /></Button>
                </div>
                {loadingLogs ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
                    <Table>
                        <TableHeader><TableRow>
                            <TableHead>Data</TableHead><TableHead>Arquivo</TableHead><TableHead>Status</TableHead>
                            <TableHead>Registros</TableHead><TableHead>UF</TableHead><TableHead>Ações</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {logs.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">Nenhuma importação</TableCell></TableRow>
                            : logs.map((l: any) => (
                                <TableRow key={l.id}>
                                    <TableCell className="text-xs">{l.createdAt ? new Date(l.createdAt).toLocaleString('pt-BR') : '-'}</TableCell>
                                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{l.fileName || '-'}</TableCell>
                                    <TableCell>
                                        <Badge className={l.status === 'completed' ? 'bg-green-100 text-green-700' : l.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                            {l.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {l.status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                                            {l.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{l.rowsProcessed || 0}</TableCell>
                                    <TableCell><Badge variant="outline">{l.state || '-'}</Badge></TableCell>
                                    <TableCell>
                                        {l.status === 'completed' && (
                                            <Button variant="ghost" size="sm" onClick={() => handleRollback(l.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TAB: REFERÊNCIAS
// ═══════════════════════════════════════════════════════════════
function TabReferences({ onRefresh }: { onRefresh: () => void }) {
    const [refs, setRefs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterUF, setFilterUF] = useState('');
    const [showNewRef, setShowNewRef] = useState(false);
    const [newRef, setNewRef] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, state: 'PE', label: '' });

    useEffect(() => { loadRefs(); }, [filterUF]);

    const loadRefs = async () => {
        setLoading(true);
        try { const r = await api.client.get('/sinapi/references', { params: { state: filterUF || undefined } }); setRefs(Array.isArray(r.data) ? r.data : []); }
        catch { /* */ } finally { setLoading(false); }
    };

    const handleCreate = async () => {
        try { await api.client.post('/sinapi/references', newRef); toast.success('Referência criada'); setShowNewRef(false); loadRefs(); onRefresh(); }
        catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); }
    };

    const handleActivate = async (id: string) => {
        try { await api.client.post('/sinapi/config', { key: `active_reference_${refs.find(r => r.id === id)?.state}`, value: id }); toast.success('Referência ativada'); loadRefs(); }
        catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Select value={filterUF} onValueChange={setFilterUF}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="Todas UFs" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value=" ">Todas</SelectItem>
                        {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button onClick={() => setShowNewRef(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-1" /> Nova Referência</Button>
            </div>

            {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <Table>
                        <TableHeader><TableRow>
                            <TableHead>Competência</TableHead><TableHead>UF</TableHead><TableHead>Label</TableHead>
                            <TableHead>Status</TableHead><TableHead>Publicação</TableHead><TableHead>Ações</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {refs.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">Nenhuma referência</TableCell></TableRow>
                            : refs.map((r: any) => (
                                <TableRow key={r.id} className={r.status === 'active' ? 'bg-blue-50' : ''}>
                                    <TableCell className="font-bold">{String(r.month).padStart(2, '0')}/{r.year}</TableCell>
                                    <TableCell><Badge variant="outline">{r.state}</Badge></TableCell>
                                    <TableCell className="text-sm">{r.label || '-'}</TableCell>
                                    <TableCell>
                                        <Badge className={r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                                            {r.status === 'active' && <Star className="w-3 h-3 mr-1" />}
                                            {r.status === 'active' ? 'Ativa' : r.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">{r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                    <TableCell>
                                        {r.status !== 'active' && (
                                            <Button variant="ghost" size="sm" onClick={() => handleActivate(r.id)} className="text-blue-600">
                                                <Star className="w-3.5 h-3.5 mr-1" /> Ativar
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* New Reference Dialog */}
            <Dialog open={showNewRef} onOpenChange={setShowNewRef}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Nova Referência SINAPI</DialogTitle><DialogDescription>Registre uma nova competência mensal</DialogDescription></DialogHeader>
                    <div className="grid grid-cols-3 gap-3">
                        <div><Label>Ano</Label><Input type="number" value={newRef.year} onChange={e => setNewRef({ ...newRef, year: Number(e.target.value) })} /></div>
                        <div><Label>Mês</Label><Input type="number" min={1} max={12} value={newRef.month} onChange={e => setNewRef({ ...newRef, month: Number(e.target.value) })} /></div>
                        <div><Label>UF</Label><Select value={newRef.state} onValueChange={v => setNewRef({ ...newRef, state: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div>
                        <div className="col-span-3"><Label>Label</Label><Input value={newRef.label} onChange={e => setNewRef({ ...newRef, label: e.target.value })} placeholder="SINAPI JAN/2025 - PE" /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setShowNewRef(false)}>Cancelar</Button><Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">Criar</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TAB: PERFIS COMERCIAIS
// ═══════════════════════════════════════════════════════════════
function TabProfiles({ onRefresh }: { onRefresh: () => void }) {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const emptyProfile = {
        name: '', description: '', isDefault: false,
        bdiAdminPercent: 0, bdiFinancialPercent: 0, bdiInsurancePercent: 0, bdiProfitPercent: 0,
        mobilizationPercent: 0, localAdminPercent: 0, logisticsPercent: 0, contingencyPercent: 0,
        technicalVisitCost: 0, artPermitCost: 0, otherFixedCosts: 0,
        issPercent: 0, pisPercent: 0, cofinsPercent: 0, irpjPercent: 0, csllPercent: 0, inssPercent: 0, otherTaxPercent: 0,
        roundingMode: 'none', calculationMethod: 'standard',
    };
    const [form, setForm] = useState<any>(emptyProfile);

    useEffect(() => { loadProfiles(); }, []);

    const loadProfiles = async () => {
        setLoading(true);
        try { const r = await api.client.get('/sinapi/pricing/profiles'); setProfiles(Array.isArray(r.data) ? r.data : []); }
        catch { /* */ } finally { setLoading(false); }
    };

    const openEdit = (p: any) => { setForm({ ...p }); setEditId(p.id); setShowDialog(true); };
    const openNew = () => { setForm({ ...emptyProfile }); setEditId(null); setShowDialog(true); };

    const handleSave = async () => {
        try {
            if (editId) { await api.client.put(`/sinapi/pricing/profiles/${editId}`, form); }
            else { await api.client.post('/sinapi/pricing/profiles', form); }
            toast.success(editId ? 'Perfil atualizado' : 'Perfil criado');
            setShowDialog(false); loadProfiles(); onRefresh();
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir perfil?')) return;
        try { await api.client.delete(`/sinapi/pricing/profiles/${id}`); toast.success('Perfil excluído'); loadProfiles(); onRefresh(); }
        catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); }
    };

    const PctField = ({ label, field }: { label: string; field: string }) => (
        <div>
            <Label className="text-xs">{label}</Label>
            <div className="relative"><Input type="number" step="0.01" className="pr-6 mt-0.5" value={form[field] || 0} onChange={e => setForm({ ...form, [field]: Number(e.target.value) })} /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span></div>
        </div>
    );

    const CurrField = ({ label, field }: { label: string; field: string }) => (
        <div>
            <Label className="text-xs">{label}</Label>
            <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span><Input type="number" step="0.01" className="pl-8 mt-0.5" value={form[field] || 0} onChange={e => setForm({ ...form, [field]: Number(e.target.value) })} /></div>
        </div>
    );

    const totalBdi = (Number(form.bdiAdminPercent) + Number(form.bdiFinancialPercent) + Number(form.bdiInsurancePercent) + Number(form.bdiProfitPercent)).toFixed(2);
    const totalTax = (Number(form.issPercent) + Number(form.pisPercent) + Number(form.cofinsPercent) + Number(form.irpjPercent) + Number(form.csllPercent) + Number(form.inssPercent) + Number(form.otherTaxPercent)).toFixed(2);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-1" /> Novo Perfil</Button>
            </div>

            {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
                <div className="grid gap-4">
                    {profiles.length === 0 ? <div className="text-center text-slate-400 py-10">Nenhum perfil comercial cadastrado</div>
                    : profiles.map((p: any) => {
                        const bdi = (Number(p.bdiAdminPercent) + Number(p.bdiFinancialPercent) + Number(p.bdiInsurancePercent) + Number(p.bdiProfitPercent)).toFixed(1);
                        const tax = (Number(p.issPercent) + Number(p.pisPercent) + Number(p.cofinsPercent) + Number(p.irpjPercent) + Number(p.csllPercent) + Number(p.inssPercent) + Number(p.otherTaxPercent)).toFixed(1);
                        return (
                            <div key={p.id} className={`bg-white rounded-xl border p-5 ${p.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Settings2 className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 flex items-center gap-2">{p.name} {p.isDefault && <Badge className="bg-blue-100 text-blue-700 text-xs">Padrão</Badge>}</h4>
                                            <p className="text-xs text-slate-500">{p.description || 'Sem descrição'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Eye className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-3 mt-3 text-xs">
                                    <div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-500">BDI</span><p className="font-bold text-slate-900">{bdi}%</p></div>
                                    <div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-500">Impostos</span><p className="font-bold text-slate-900">{tax}%</p></div>
                                    <div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-500">Visita Téc.</span><p className="font-bold text-slate-900">R$ {Number(p.technicalVisitCost || 0).toFixed(2)}</p></div>
                                    <div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-500">Fórmula</span><p className="font-bold text-slate-900">{p.calculationMethod === 'tcpo' ? 'TCPO' : 'Padrão'}</p></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Profile Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editId ? 'Editar Perfil' : 'Novo Perfil de Precificação'}</DialogTitle>
                        <DialogDescription>Configure as regras comerciais para orçamento</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Padrão" className="mt-1" /></div>
                            <div className="col-span-2"><Label>Descrição</Label><Input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
                            <div className="flex items-center gap-2"><input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} /><Label className="text-sm">Perfil padrão</Label></div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-bold text-sm text-blue-700 mb-3 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> BDI — Benefícios e Despesas Indiretas ({totalBdi}%)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <PctField label="Adm. Central" field="bdiAdminPercent" />
                                <PctField label="Desp. Financeiras" field="bdiFinancialPercent" />
                                <PctField label="Seguros/Garantias" field="bdiInsurancePercent" />
                                <PctField label="Lucro" field="bdiProfitPercent" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-bold text-sm text-emerald-700 mb-3 flex items-center gap-1"><Building2 className="w-4 h-4" /> Custos Diretos Adicionais</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <PctField label="Mobilização" field="mobilizationPercent" />
                                <PctField label="Adm. Local" field="localAdminPercent" />
                                <PctField label="Logística" field="logisticsPercent" />
                                <PctField label="Contingência" field="contingencyPercent" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-bold text-sm text-amber-700 mb-3 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Custos Fixos</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <CurrField label="Visita Técnica" field="technicalVisitCost" />
                                <CurrField label="ART / Laudo" field="artPermitCost" />
                                <CurrField label="Outros Fixos" field="otherFixedCosts" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-bold text-sm text-red-700 mb-3 flex items-center gap-1"><Calculator className="w-4 h-4" /> Impostos ({totalTax}%)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <PctField label="ISS" field="issPercent" />
                                <PctField label="PIS" field="pisPercent" />
                                <PctField label="COFINS" field="cofinsPercent" />
                                <PctField label="IRPJ" field="irpjPercent" />
                                <PctField label="CSLL" field="csllPercent" />
                                <PctField label="INSS / CPP" field="inssPercent" />
                                <PctField label="Outros" field="otherTaxPercent" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-bold text-sm text-slate-700 mb-3">Configurações</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Fórmula de Cálculo</Label>
                                    <Select value={form.calculationMethod} onValueChange={v => setForm({ ...form, calculationMethod: v })}>
                                        <SelectTrigger className="mt-0.5"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Padrão (por fora)</SelectItem>
                                            <SelectItem value="tcpo">TCPO/Pini (por dentro)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">Arredondamento</Label>
                                    <Select value={form.roundingMode} onValueChange={v => setForm({ ...form, roundingMode: v })}>
                                        <SelectTrigger className="mt-0.5"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sem arredondamento</SelectItem>
                                            <SelectItem value="ceil_10">Arredondar p/ cima (R$ 10)</SelectItem>
                                            <SelectItem value="ceil_50">Arredondar p/ cima (R$ 50)</SelectItem>
                                            <SelectItem value="ceil_100">Arredondar p/ cima (R$ 100)</SelectItem>
                                            <SelectItem value="round_10">Arredondar (R$ 10)</SelectItem>
                                            <SelectItem value="round_50">Arredondar (R$ 50)</SelectItem>
                                            <SelectItem value="round_100">Arredondar (R$ 100)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">{editId ? 'Salvar' : 'Criar Perfil'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TAB: CONSULTA (INSUMOS E COMPOSIÇÕES)
// ═══════════════════════════════════════════════════════════════
function TabSearch() {
    const [mode, setMode] = useState<'inputs' | 'compositions'>('inputs');
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const handleSearch = async (p = 1) => {
        if (!search.trim()) return;
        setLoading(true); setPage(p);
        try {
            const endpoint = mode === 'inputs' ? '/sinapi/inputs' : '/sinapi/compositions';
            const r = await api.client.get(endpoint, { params: { search, page: p, limit: 25 } });
            const data = r.data;
            if (Array.isArray(data)) { setResults(data); setTotal(data.length); }
            else { setResults(data?.data || data?.items || []); setTotal(data?.total || 0); }
        } catch { setResults([]); } finally { setLoading(false); }
    };

    const viewDetail = async (item: any) => {
        setDetailLoading(true);
        try {
            if (mode === 'inputs') {
                const r = await api.client.get(`/sinapi/inputs/${item.code || item.id}/price`, { params: { state: 'PE' } });
                setDetail({ ...item, priceData: r.data });
            } else {
                const r = await api.client.get(`/sinapi/compositions/${item.code || item.id}/tree`, { params: { state: 'PE' } });
                setDetail(r.data);
            }
        } catch { setDetail(item); } finally { setDetailLoading(false); }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                    <button className={`px-3 py-1.5 text-xs font-medium rounded-md ${mode === 'inputs' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} onClick={() => { setMode('inputs'); setResults([]); }}>Insumos</button>
                    <button className={`px-3 py-1.5 text-xs font-medium rounded-md ${mode === 'compositions' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} onClick={() => { setMode('compositions'); setResults([]); }}>Composições</button>
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder={mode === 'inputs' ? 'Buscar insumo por código ou descrição...' : 'Buscar composição...'}
                        className="pl-10"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <Button onClick={() => handleSearch()} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                </Button>
            </div>

            {results.length > 0 && (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="p-3 border-b text-xs text-slate-500">{total} resultado(s)</div>
                    <Table>
                        <TableHeader><TableRow>
                            <TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Unidade</TableHead>
                            {mode === 'inputs' && <TableHead>Tipo</TableHead>}
                            <TableHead></TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {results.map((r: any) => (
                                <TableRow key={r.id} className="cursor-pointer hover:bg-slate-50" onClick={() => viewDetail(r)}>
                                    <TableCell className="font-mono text-xs font-bold text-blue-600">{r.code}</TableCell>
                                    <TableCell className="text-sm max-w-[400px]">{r.description}</TableCell>
                                    <TableCell><Badge variant="outline">{r.unit}</Badge></TableCell>
                                    {mode === 'inputs' && <TableCell><Badge className="bg-slate-100 text-slate-600 text-xs">{r.type || '-'}</Badge></TableCell>}
                                    <TableCell><Eye className="w-4 h-4 text-slate-400" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {total > 25 && (
                        <div className="flex justify-center gap-2 p-3 border-t">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handleSearch(page - 1)}>Anterior</Button>
                            <span className="text-xs text-slate-500 self-center">Pág. {page}</span>
                            <Button variant="outline" size="sm" onClick={() => handleSearch(page + 1)}>Próxima</Button>
                        </div>
                    )}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="font-mono text-blue-600">{detail?.composition?.code || detail?.code}</span>
                            {detail?.composition?.description || detail?.description}
                        </DialogTitle>
                    </DialogHeader>
                    {detailLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : detail && (
                        <div className="space-y-4">
                            {/* Input price detail */}
                            {detail?.priceData?.price && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-bold text-green-700 text-sm mb-2">Preço na Referência Ativa</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div><span className="text-slate-500">Não Desonerado:</span> <span className="font-bold">R$ {Number(detail.priceData.price.priceNotTaxed || 0).toFixed(2)}</span></div>
                                        <div><span className="text-slate-500">Desonerado:</span> <span className="font-bold">R$ {Number(detail.priceData.price.priceTaxed || 0).toFixed(2)}</span></div>
                                    </div>
                                </div>
                            )}

                            {/* Composition tree */}
                            {detail?.tree && (
                                <>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-bold text-blue-700 text-sm mb-2">Custo Consolidado</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div><span className="text-slate-500">Total:</span> <span className="font-bold text-lg text-blue-700">R$ {Number(detail.consolidatedCost?.totalNotTaxed || 0).toFixed(2)}</span></div>
                                            <div><span className="text-slate-500">Material:</span> <span className="font-bold">R$ {Number(detail.consolidatedCost?.materialCost || 0).toFixed(2)}</span></div>
                                            <div><span className="text-slate-500">MO:</span> <span className="font-bold">R$ {Number(detail.consolidatedCost?.laborCost || 0).toFixed(2)}</span></div>
                                            <div><span className="text-slate-500">Equip.:</span> <span className="font-bold">R$ {Number(detail.consolidatedCost?.equipmentCost || 0).toFixed(2)}</span></div>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-sm text-slate-700">Árvore da Composição</h4>
                                    <div className="text-xs space-y-1 max-h-[300px] overflow-y-auto">
                                        {(detail.tree || []).map((node: any, i: number) => (
                                            <div key={i} className={`flex justify-between items-center p-2 rounded ${node.type === 'composicao_auxiliar' ? 'bg-purple-50' : 'bg-slate-50'}`}>
                                                <div className="flex items-center gap-2">
                                                    {node.type === 'composicao_auxiliar' ? <ChevronRight className="w-3.5 h-3.5 text-purple-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                                    <span className="font-mono text-blue-600">{node.code}</span>
                                                    <span className="max-w-[250px] truncate">{node.description}</span>
                                                    <Badge variant="outline" className="text-[10px]">{node.unit}</Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-right">
                                                    <span className="text-slate-400">×{node.coefficient}</span>
                                                    {node.subtotal && <span className="font-bold">R$ {Number(node.subtotal.notTaxed).toFixed(2)}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TAB: LOGS DE AUDITORIA
// ═══════════════════════════════════════════════════════════════
function TabLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [configs, setConfigs] = useState<any[]>([]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [logR, cfgR] = await Promise.all([
                api.client.get('/sinapi/import/logs?limit=50'),
                api.client.get('/sinapi/config'),
            ]);
            setLogs(Array.isArray(logR.data) ? logR.data : []);
            setConfigs(Array.isArray(cfgR.data) ? cfgR.data : []);
        } catch { /* */ } finally { setLoading(false); }
    };

    const success = logs.filter(l => l.status === 'completed').length;
    const errors = logs.filter(l => l.status === 'error').length;
    const totalRows = logs.reduce((s: number, l: any) => s + (Number(l.rowsProcessed) || 0), 0);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Importações</p><p className="text-2xl font-bold">{logs.length}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Sucesso</p><p className="text-2xl font-bold text-green-600">{success}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Erros</p><p className="text-2xl font-bold text-red-600">{errors}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Registros</p><p className="text-2xl font-bold text-blue-600">{totalRows.toLocaleString('pt-BR')}</p></div>
            </div>

            {/* Active Configs */}
            {configs.length > 0 && (
                <div className="bg-white rounded-xl border p-4">
                    <h4 className="font-bold text-sm text-slate-700 mb-2">Configurações Ativas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {configs.map((c: any) => (
                            <div key={c.id || c.key} className="bg-slate-50 rounded-lg p-2 text-xs">
                                <span className="text-slate-500">{c.key}:</span> <span className="font-bold">{c.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Full Log Table */}
            {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <Table>
                        <TableHeader><TableRow>
                            <TableHead>Data</TableHead><TableHead>Arquivo</TableHead><TableHead>UF</TableHead>
                            <TableHead>Ano/Mês</TableHead><TableHead>Regime</TableHead><TableHead>Status</TableHead>
                            <TableHead>Registros</TableHead><TableHead>Erros</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {logs.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">Sem logs</TableCell></TableRow>
                            : logs.map((l: any) => (
                                <TableRow key={l.id}>
                                    <TableCell className="text-xs">{l.createdAt ? new Date(l.createdAt).toLocaleString('pt-BR') : '-'}</TableCell>
                                    <TableCell className="text-sm font-medium max-w-[150px] truncate">{l.fileName || '-'}</TableCell>
                                    <TableCell><Badge variant="outline">{l.state || '-'}</Badge></TableCell>
                                    <TableCell className="text-xs">{l.year && l.month ? `${String(l.month).padStart(2, '0')}/${l.year}` : '-'}</TableCell>
                                    <TableCell className="text-xs">{l.taxRegime || '-'}</TableCell>
                                    <TableCell>
                                        <Badge className={l.status === 'completed' ? 'bg-green-100 text-green-700' : l.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                            {l.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{Number(l.rowsProcessed || 0).toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-xs text-red-500">{l.errorCount || 0}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
