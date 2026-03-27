import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Calculator, Plus, Trash2, Search, Loader2, DollarSign, Package, Wrench,
    HardHat, ArrowLeft, Save, Percent, Zap, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';


const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const WORK_TYPES = [
    { value: 'residencial', label: 'Residencial' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'instalacao', label: 'Instalação' },
    { value: 'geral', label: 'Geral' },
];

// fmt defined at bottom of file

export default function Budgets() {
    const [budgetList, setBudgetList] = useState<any[]>([]);
    const [activeBudget, setActiveBudget] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [saving, setSaving] = useState(false);

    // Create dialog state
    const [newName, setNewName] = useState('');
    const [newState, setNewState] = useState('PE');
    const [newType, setNewType] = useState('geral');
    const [newBdi, setNewBdi] = useState('25');

    // SINAPI search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Editing item
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editQty, setEditQty] = useState('');
    const [expandedParametric, setExpandedParametric] = useState<string | null>(null);
    const [recalculating, setRecalculating] = useState(false);

    const loadBudgets = useCallback(async () => {
        try {
            setLoading(true);
            const r = await api.client.get('/budgets');
            setBudgetList(r.data || []);
        } catch { toast.error('Erro ao carregar orçamentos'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadBudgets(); }, [loadBudgets]);

    const loadBudget = async (id: string) => {
        try {
            const r = await api.client.get(`/budgets/${id}`);
            setActiveBudget(r.data);
        } catch { toast.error('Erro ao carregar orçamento'); }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return toast.error('Nome é obrigatório');
        try {
            setSaving(true);
            const r = await api.client.post('/budgets', {
                name: newName, state: newState, workType: newType, bdiPercent: Number(newBdi) || 0,
            });
            toast.success('Orçamento criado!');
            setShowCreate(false);
            setNewName('');
            await loadBudgets();
            setActiveBudget(r.data);
        } catch { toast.error('Erro ao criar'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir orçamento?')) return;
        try {
            await api.client.delete(`/budgets/${id}`);
            toast.success('Excluído');
            if (activeBudget?.id === id) setActiveBudget(null);
            loadBudgets();
        } catch { toast.error('Erro'); }
    };

    // === SINAPI Search (with prices!) ===
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            setSearching(true);
            try {
                const res = await api.client.get('/budgets/search', {
                    params: { q: searchQuery, state: activeBudget?.state || 'PE' },
                });
                setSearchResults(res.data || []);
            } catch {
                // Fallback to old endpoints
                const [compRes, inputRes] = await Promise.all([
                    api.client.get('/sinapi/compositions', { params: { search: searchQuery, limit: 15 } }),
                    api.client.get('/sinapi/inputs', { params: { search: searchQuery, limit: 15 } }),
                ]);
                const comps = (compRes.data?.items || compRes.data || []).map((c: any) => ({ ...c, type: 'composition' }));
                const inputs = (inputRes.data?.items || inputRes.data || []).map((i: any) => ({ ...i, type: 'input' }));
                setSearchResults([...comps, ...inputs]);
            }
        } catch { toast.error('Erro na busca SINAPI'); }
        finally { setSearching(false); }
    };

    const handleAddComposition = async (code: string) => {
        if (!activeBudget) return;
        try {
            setSaving(true);
            await api.client.post(`/budgets/${activeBudget.id}/sinapi/${code}`, {}, { params: { state: activeBudget.state } });
            toast.success(`Composição ${code} adicionada!`);
            await loadBudget(activeBudget.id);
            setShowSearch(false);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Erro ao adicionar');
        } finally { setSaving(false); }
    };

    const handleAddInput = async (code: string) => {
        if (!activeBudget) return;
        try {
            setSaving(true);
            await api.client.post(`/budgets/${activeBudget.id}/input/${code}`, {}, { params: { state: activeBudget.state } });
            toast.success(`Insumo ${code} adicionado!`);
            await loadBudget(activeBudget.id);
            setShowSearch(false);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Erro ao adicionar insumo');
        } finally { setSaving(false); }
    };

    // === Item Edit ===
    const handleUpdateItem = async (itemId: string, quantity: number) => {
        try {
            await api.client.put(`/budgets/items/${itemId}`, { quantity });
            toast.success('Atualizado');
            setEditingItem(null);
            await loadBudget(activeBudget.id);
        } catch { toast.error('Erro'); }
    };

    const handleRemoveItem = async (itemId: string) => {
        try {
            await api.client.delete(`/budgets/items/${itemId}`);
            toast.success('Removido');
            await loadBudget(activeBudget.id);
        } catch { toast.error('Erro'); }
    };

    const handleUpdateBdi = async (bdi: string) => {
        try {
            await api.client.put(`/budgets/${activeBudget.id}`, { bdiPercent: Number(bdi) || 0 });
            await loadBudget(activeBudget.id);
        } catch { toast.error('Erro'); }
    };

    const handleRecalculate = async () => {
        if (!activeBudget) return;
        try {
            setRecalculating(true);
            await api.client.post(`/budgets/${activeBudget.id}/recalculate`, {});
            toast.success('MO recalculada pelo motor paramétrico!');
            await loadBudget(activeBudget.id);
        } catch { toast.error('Erro ao recalcular'); }
        finally { setRecalculating(false); }
    };

    // === RENDER: Budget List ===
    if (!activeBudget) {
        return (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Calculator className="w-7 h-7 text-emerald-600" />
                            Orçamentos
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Orçamentos paramétricos com base SINAPI</p>
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" /> Novo Orçamento
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                ) : budgetList.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                        <Calculator className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Nenhum orçamento ainda</h3>
                        <p className="text-sm text-slate-400 mt-1">Crie seu primeiro orçamento paramétrico baseado em SINAPI</p>
                        <Button className="mt-4 bg-emerald-600" onClick={() => setShowCreate(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Criar Orçamento
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {budgetList.map(b => (
                            <div key={b.id}
                                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow cursor-pointer group"
                                onClick={() => loadBudget(b.id)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">{b.name}</h3>
                                    <Badge variant="outline" className="text-xs">{b.state}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                    <Badge className="bg-slate-100 text-slate-600 text-[10px]">
                                        {WORK_TYPES.find(t => t.value === b.workType)?.label || b.workType}
                                    </Badge>
                                    <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">
                                        BDI {Number(b.bdiPercent || 0)}%
                                    </Badge>
                                </div>
                                <div className="border-t pt-3 flex justify-between items-center">
                                    <span className="text-2xl font-bold text-emerald-700">{fmt(b.total)}</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                                        className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-400">
                                    <div>Mat: {fmt(b.totalMaterial)}</div>
                                    <div>MO: {fmt(b.totalLabor)}</div>
                                    <div>Eq: {fmt(b.totalEquipment)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Dialog */}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-emerald-600" /> Novo Orçamento
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Nome do Orçamento</Label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)}
                                    placeholder="Ex: Instalação Elétrica - Casa Recife" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Estado (UF)</Label>
                                    <Select value={newState} onValueChange={setNewState}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Tipo de Obra</Label>
                                    <Select value={newType} onValueChange={setNewType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {WORK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>BDI (%)</Label>
                                <Input type="number" value={newBdi} onChange={e => setNewBdi(e.target.value)}
                                    placeholder="25" />
                                <p className="text-xs text-slate-400 mt-1">Benefícios e Despesas Indiretas (margem, impostos, administração)</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                            <Button className="bg-emerald-600" onClick={handleCreate} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Criar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // === RENDER: Budget Detail ===
    const items = activeBudget.items || [];
    const materialItems = items.filter((i: any) => i.costCategory === 'material');
    const laborItems = items.filter((i: any) => i.costCategory === 'mao_de_obra');
    const equipItems = items.filter((i: any) => i.costCategory === 'equipamento');

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => { setActiveBudget(null); loadBudgets(); }}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{activeBudget.name}</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Badge variant="outline">{activeBudget.state}</Badge>
                            <Badge className="bg-slate-100 text-slate-600">
                                {WORK_TYPES.find(t => t.value === activeBudget.workType)?.label}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleRecalculate} disabled={recalculating}
                        className="border-amber-300 text-amber-700 hover:bg-amber-50">
                        {recalculating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Recalcular MO
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowSearch(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar SINAPI
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium mb-1">
                        <Package className="w-3.5 h-3.5" /> Material
                    </div>
                    <div className="text-lg font-bold text-blue-800">{fmt(activeBudget.totalMaterial)}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium mb-1">
                        <HardHat className="w-3.5 h-3.5" /> Mão de Obra
                    </div>
                    <div className="text-lg font-bold text-amber-800">{fmt(activeBudget.totalLabor)}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-1.5 text-purple-600 text-xs font-medium mb-1">
                        <Wrench className="w-3.5 h-3.5" /> Equipamento
                    </div>
                    <div className="text-lg font-bold text-purple-800">{fmt(activeBudget.totalEquipment)}</div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium mb-1">
                        <DollarSign className="w-3.5 h-3.5" /> Subtotal
                    </div>
                    <div className="text-lg font-bold text-slate-800">{fmt(activeBudget.subtotal)}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center gap-1.5 text-orange-600 text-xs font-medium mb-1">
                        <Percent className="w-3.5 h-3.5" /> BDI ({Number(activeBudget.bdiPercent)}%)
                    </div>
                    <div className="text-lg font-bold text-orange-800">{fmt(activeBudget.bdiValue)}</div>
                    <input type="number" className="mt-1 w-full border rounded px-2 py-0.5 text-xs"
                        defaultValue={activeBudget.bdiPercent}
                        onBlur={e => handleUpdateBdi(e.target.value)}
                        placeholder="%" />
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium mb-1">
                        <Calculator className="w-3.5 h-3.5" /> Total Final
                    </div>
                    <div className="text-xl font-bold text-emerald-800">{fmt(activeBudget.total)}</div>
                </div>
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-600">Orçamento vazio</h3>
                    <p className="text-sm text-slate-400 mt-1">Adicione composições SINAPI para começar</p>
                    <Button className="mt-4 bg-emerald-600" onClick={() => setShowSearch(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Buscar Composição SINAPI
                    </Button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-10">#</TableHead>
                                <TableHead>Código</TableHead>
                                <TableHead className="w-[300px]">Descrição</TableHead>
                                <TableHead>Un</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Qtd/Coef</TableHead>
                                <TableHead className="text-right">SINAPI</TableHead>
                                <TableHead className="text-right">Custo Un.</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* MO Section */}
                            {laborItems.length > 0 && (
                                <TableRow className="bg-amber-50/50">
                                    <TableCell colSpan={10} className="font-bold text-amber-700 text-sm py-2">
                                        <HardHat className="w-4 h-4 inline mr-2" />Mão de Obra ({laborItems.length} itens) — {fmt(activeBudget.totalLabor)}
                                    </TableCell>
                                </TableRow>
                            )}
                            {laborItems.map((item: any, idx: number) => (
                                <ItemRow key={item.id} item={item} idx={idx}
                                    editing={editingItem === item.id}
                                    editQty={editQty}
                                    onStartEdit={() => { setEditingItem(item.id); setEditQty(String(item.quantity)); }}
                                    onChangeQty={setEditQty}
                                    onSave={() => handleUpdateItem(item.id, Number(editQty))}
                                    onCancel={() => setEditingItem(null)}
                                    onRemove={() => handleRemoveItem(item.id)}
                                    category="mao_de_obra"
                                    expanded={expandedParametric === item.id}
                                    onToggleExpand={() => setExpandedParametric(expandedParametric === item.id ? null : item.id)}
                                />
                            ))}

                            {/* Material Section */}
                            {materialItems.length > 0 && (
                                <TableRow className="bg-blue-50/50">
                                    <TableCell colSpan={10} className="font-bold text-blue-700 text-sm py-2">
                                        <Package className="w-4 h-4 inline mr-2" />Material ({materialItems.length} itens) — {fmt(activeBudget.totalMaterial)}
                                    </TableCell>
                                </TableRow>
                            )}
                            {materialItems.map((item: any, idx: number) => (
                                <ItemRow key={item.id} item={item} idx={idx}
                                    editing={editingItem === item.id}
                                    editQty={editQty}
                                    onStartEdit={() => { setEditingItem(item.id); setEditQty(String(item.quantity)); }}
                                    onChangeQty={setEditQty}
                                    onSave={() => handleUpdateItem(item.id, Number(editQty))}
                                    onCancel={() => setEditingItem(null)}
                                    onRemove={() => handleRemoveItem(item.id)}
                                    category="material"
                                />
                            ))}

                            {/* Equipment Section */}
                            {equipItems.length > 0 && (
                                <TableRow className="bg-purple-50/50">
                                    <TableCell colSpan={10} className="font-bold text-purple-700 text-sm py-2">
                                        <Wrench className="w-4 h-4 inline mr-2" />Equipamento ({equipItems.length} itens) — {fmt(activeBudget.totalEquipment)}
                                    </TableCell>
                                </TableRow>
                            )}
                            {equipItems.map((item: any, idx: number) => (
                                <ItemRow key={item.id} item={item} idx={idx}
                                    editing={editingItem === item.id}
                                    editQty={editQty}
                                    onStartEdit={() => { setEditingItem(item.id); setEditQty(String(item.quantity)); }}
                                    onChangeQty={setEditQty}
                                    onSave={() => handleUpdateItem(item.id, Number(editQty))}
                                    onCancel={() => setEditingItem(null)}
                                    onRemove={() => handleRemoveItem(item.id)}
                                    category="equipamento"
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* SINAPI Search Dialog */}
            <Dialog open={showSearch} onOpenChange={setShowSearch}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-emerald-600" /> Buscar Composição SINAPI
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2">
                        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Ex: tomada, quadro distribuicao, eletricista..."
                            onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                        <Button onClick={handleSearch} disabled={searching}>
                            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>
                    <div className="space-y-2 mt-2">
                        {searchResults.map((r: any) => (
                            <div key={r.id || r.code}
                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-emerald-50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-sm text-emerald-600 font-bold">{r.code}</span>
                                        <Badge variant="outline" className="text-[10px]">{r.unit}</Badge>
                                        <Badge className={`text-[10px] ${r.type === 'composition' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {r.type === 'composition' ? 'Composição' : 'Insumo'}
                                        </Badge>
                                        {Number(r.price || r.totalNotTaxed || r.priceNotTaxed || 0) > 0 && (
                                            <span className={`text-sm font-bold ${
                                                r.priceSource === 'sinapi' || !r.priceSource ? 'text-emerald-700' :
                                                r.priceSource?.startsWith('estimado') ? 'text-yellow-700' : 'text-orange-600'
                                            }`}>
                                                {fmt(r.price || r.totalNotTaxed || r.priceNotTaxed || 0)}
                                            </span>
                                        )}
                                        {r.priceSource?.startsWith('estimado') && (
                                            <span className="text-[8px] text-yellow-600 bg-yellow-50 border border-dashed border-yellow-300 rounded px-1">
                                                📊 Estimado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1 truncate">{r.description}</p>
                                </div>
                                <div className="ml-3 shrink-0">
                                    {r.type === 'composition' ? (
                                        <Button size="sm" className="bg-emerald-600" onClick={() => handleAddComposition(r.code)}
                                            disabled={saving}>
                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        </Button>
                                    ) : (
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAddInput(r.code)}
                                            disabled={saving}>
                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {searchResults.length === 0 && searchQuery && !searching && (
                            <p className="text-center text-sm text-slate-400 py-4">Nenhum resultado. Tente outro termo.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// === Item Row Component (with Parametric Data) ===
function ItemRow({ item, idx, editing, editQty, onStartEdit, onChangeQty, onSave, onCancel, onRemove, category, expanded, onToggleExpand }: any) {
    const isParametric = item.itemType === 'mao_de_obra_parametrica';
    const pd = item.parametricData;
    const confidence = item.confidenceLevel;

    const confidenceBadge: any = {
        alta: { bg: 'bg-green-100 text-green-700 border-green-300', icon: '⚡', label: 'Auto' },
        media: { bg: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '⚙️', label: 'Média' },
        manual: { bg: 'bg-orange-100 text-orange-700 border-orange-300', icon: '✏️', label: 'Manual' },
        sinapi: { bg: 'bg-slate-100 text-slate-600 border-slate-300', icon: '📊', label: 'SINAPI' },
    };
    const badge = confidenceBadge[confidence] || confidenceBadge.sinapi;

    return (
        <>
        <TableRow className={`hover:bg-slate-50 text-sm ${isParametric ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-400' : ''}`}>
            <TableCell className="text-slate-400 text-xs">{isParametric ? '⚡' : idx + 1}</TableCell>
            <TableCell>
                <span className="font-mono text-xs text-emerald-600">{item.sinapiCode}</span>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${isParametric ? 'font-semibold text-amber-800' : ''}`}>
                        {isParametric ? item.description.replace('⚡ MO PARAMÉTRICA: ', '') : item.description}
                    </span>
                    {isParametric && pd && (
                        <button onClick={onToggleExpand}
                            className="text-amber-500 hover:text-amber-700 ml-1">
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
                {isParametric && pd && (
                    <div className="flex items-center gap-1 mt-0.5">
                        <Badge className={`text-[9px] border ${badge.bg}`}>
                            {badge.icon} {badge.label}
                        </Badge>
                        {pd.bandLabel && (
                            <Badge className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200">
                                {pd.bandLabel}
                            </Badge>
                        )}
                        {item.isManualOverride && (
                            <Badge className="text-[9px] bg-orange-50 text-orange-600 border border-orange-200">
                                ✏️ Editado
                            </Badge>
                        )}
                    </div>
                )}
            </TableCell>
            <TableCell>
                <Badge variant="outline" className="text-[10px]">{item.unit}</Badge>
            </TableCell>
            <TableCell>
                <Badge className={`text-[10px] ${
                    isParametric ? 'bg-amber-100 text-amber-700' :
                    category === 'mao_de_obra' ? 'text-amber-600 bg-amber-50' :
                    category === 'material' ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50'
                }`}>
                    {isParametric ? '⚡ Motor' : category === 'mao_de_obra' ? 'MO' : category === 'material' ? 'Mat' : 'Eq'}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                {editing ? (
                    <div className="flex items-center gap-1 justify-end">
                        <Input type="number" value={editQty} onChange={e => onChangeQty(e.target.value)}
                            className="w-20 h-7 text-xs text-right" autoFocus
                            onKeyDown={(e: any) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onSave}>
                            <Save className="w-3 h-3 text-emerald-600" />
                        </Button>
                    </div>
                ) : (
                    <button onClick={onStartEdit}
                        className="font-bold text-slate-800 hover:text-emerald-600 hover:underline cursor-pointer transition-colors">
                        {Number(item.quantity).toFixed(4)}
                    </button>
                )}
            </TableCell>
            <TableCell className="text-right text-[10px] text-slate-400">
                {item.sinapiCoefficient ? Number(item.sinapiCoefficient).toFixed(4) : '—'}
            </TableCell>
            <TableCell className="text-right font-medium">
                {Number(item.unitCost) > 0 ? (
                    <div>
                        <span className={item.priceSource && item.priceSource !== 'sinapi' && item.priceSource !== 'motor_parametrico'
                            ? 'text-yellow-700' : ''}>
                            {fmt(item.unitCost)}
                        </span>
                        {item.priceSource && item.priceSource.startsWith('estimado') && (
                            <div className="text-[8px] text-yellow-600 bg-yellow-50 border border-dashed border-yellow-300 rounded px-1 mt-0.5 inline-block">
                                📊 Estimado
                            </div>
                        )}
                        {item.priceSource === 'sugerido_familia' && (
                            <div className="text-[8px] text-orange-600 bg-orange-50 border border-dashed border-orange-300 rounded px-1 mt-0.5 inline-block">
                                🔍 Sugerido
                            </div>
                        )}
                        {item.suggestedCost && item.isManualOverride && (
                            <div className="text-[9px] text-slate-400 line-through">{fmt(item.suggestedCost)}</div>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <span className="text-slate-300">—</span>
                        <div className="text-[8px] text-red-400 bg-red-50 border border-dashed border-red-200 rounded px-1 mt-0.5 inline-block">
                            ⚠️ Sem preço
                        </div>
                    </div>
                )}
            </TableCell>
            <TableCell className={`text-right font-bold ${
                isParametric ? 'text-amber-700' :
                Number(item.unitCost) === 0 ? 'text-red-300' :
                item.priceSource && item.priceSource !== 'sinapi' && item.priceSource !== 'motor_parametrico' ? 'text-yellow-700' :
                'text-emerald-700'
            }`}>
                {fmt(item.subtotal)}
            </TableCell>
            <TableCell>
                <button onClick={onRemove} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </TableCell>
        </TableRow>
        {/* Expanded parametric breakdown */}
        {isParametric && expanded && pd && (
            <TableRow className="bg-amber-50/80">
                <TableCell colSpan={10}>
                    <div className="p-3 rounded-lg bg-white border border-amber-200 text-xs space-y-2 mx-4 my-1">
                        <div className="font-semibold text-amber-800 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" /> Composição de Preço — {pd.ruleName}
                        </div>
                        <div className="text-slate-600">{pd.reasoning}</div>
                        <div className="grid grid-cols-2 gap-4">
                            {pd.professional && pd.professional.hours > 0 && (
                                <div className="bg-slate-50 rounded p-2">
                                    <div className="font-medium text-slate-700">👷 {pd.professional.label} ({pd.professional.code})</div>
                                    <div className="mt-1 space-y-0.5 text-slate-500">
                                        <div>Base SINAPI: {fmt(pd.professional.baseCostHour)}/h</div>
                                        <div>+ Encargos {pd.professional.encargosPercent}%: {fmt(pd.professional.encargosValue)}</div>
                                        <div className="font-medium text-slate-700">= Custo Real: {fmt(pd.professional.realCostHour)}/h</div>
                                        <div>× {pd.professional.hours}h = <span className="font-bold text-amber-700">{fmt(pd.professional.subtotal)}</span></div>
                                    </div>
                                </div>
                            )}
                            {pd.helper && pd.helper.hours > 0 && (
                                <div className="bg-slate-50 rounded p-2">
                                    <div className="font-medium text-slate-700">🔧 {pd.helper.label} ({pd.helper.code})</div>
                                    <div className="mt-1 space-y-0.5 text-slate-500">
                                        <div>Base SINAPI: {fmt(pd.helper.baseCostHour)}/h</div>
                                        <div>+ Encargos {pd.helper.encargosPercent}%: {fmt(pd.helper.encargosValue)}</div>
                                        <div className="font-medium text-slate-700">= Custo Real: {fmt(pd.helper.realCostHour)}/h</div>
                                        <div>× {pd.helper.hours}h = <span className="font-bold text-amber-700">{fmt(pd.helper.subtotal)}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="border-t pt-2 flex items-center justify-between">
                            <div>
                                <span className="text-slate-500">MO Direta: </span>
                                <span className="font-medium">{fmt(pd.laborCostDirect)}</span>
                                <span className="text-slate-500 ml-3">+ BDI {pd.bdiComposition?.bdiPercent?.toFixed(1)}%: </span>
                                <span className="font-medium">{fmt(pd.bdiComposition?.bdiValue)}</span>
                            </div>
                            <div className="text-base font-bold text-amber-800">
                                Total: {fmt(pd.laborCostWithBdi)}
                            </div>
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        )}
        </>
    );
}

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
