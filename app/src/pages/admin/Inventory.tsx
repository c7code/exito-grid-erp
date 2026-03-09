import { useState, useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Loader2, AlertTriangle, ArrowDown, ArrowUp, RotateCcw, Warehouse, TrendingDown, Boxes } from 'lucide-react';

const movTypeLabel: Record<string, string> = { entry: 'Entrada', exit: 'Saída', transfer: 'Transferência', adjustment: 'Ajuste', return: 'Devolução' };
const movTypeColor: Record<string, string> = { entry: 'bg-green-100 text-green-700', exit: 'bg-red-100 text-red-700', transfer: 'bg-blue-100 text-blue-700', adjustment: 'bg-yellow-100 text-yellow-700', return: 'bg-purple-100 text-purple-700' };

export default function Inventory() {
    const [items, setItems] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [works, setWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'items' | 'movements'>('items');
    const [showItemDialog, setShowItemDialog] = useState(false);
    const [showMovDialog, setShowMovDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [summary, setSummary] = useState<any>({});

    const emptyItem = { name: '', code: '', category: '', unit: 'un', currentStock: 0, minimumStock: 0, unitCost: 0, location: '', supplier: '', description: '' };
    const emptyMov = { itemId: '', type: 'entry', quantity: 0, unitCost: 0, workId: '', reason: '', invoiceNumber: '' };
    const [itemForm, setItemForm] = useState(emptyItem);
    const [movForm, setMovForm] = useState(emptyMov);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [it, mv, wk, sm] = await Promise.all([
                api.getInventoryItems(), api.getInventoryMovements(), api.getWorks(), api.getInventorySummary(),
            ]);
            setItems(Array.isArray(it) ? it : []);
            setMovements(Array.isArray(mv) ? mv : []);
            setWorks(Array.isArray(wk) ? wk : (wk?.data ?? []));
            setSummary(sm || {});
        } catch { /* */ } finally { setLoading(false); }
    };

    const handleCreateItem = async () => {
        if (!itemForm.name) { toast.error('Nome obrigatório'); return; }
        setSaving(true);
        try { await api.createInventoryItem(itemForm); toast.success('Item cadastrado!'); setShowItemDialog(false); setItemForm(emptyItem); loadData(); }
        catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); } finally { setSaving(false); }
    };

    const handleCreateMov = async () => {
        if (!movForm.itemId || !movForm.quantity) { toast.error('Preencha item e quantidade'); return; }
        setSaving(true);
        try { await api.createInventoryMovement(movForm); toast.success('Movimentação registrada!'); setShowMovDialog(false); setMovForm(emptyMov); loadData(); }
        catch (e: any) { toast.error(e?.response?.data?.message || 'Erro'); } finally { setSaving(false); }
    };

    const filtered = items.filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.code?.toLowerCase().includes(search.toLowerCase()));
    const lowStock = items.filter(i => Number(i.minimumStock) > 0 && Number(i.currentStock) <= Number(i.minimumStock));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Warehouse className="w-7 h-7 text-amber-500" /> Estoque / Almoxarifado</h1>
                    <p className="text-sm text-slate-500 mt-1">Controle de materiais, entradas, saídas e alertas</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowMovDialog(true)}><ArrowDown className="w-4 h-4 mr-1 text-green-500" /> Movimentação</Button>
                    <Button onClick={() => setShowItemDialog(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"><Plus className="w-4 h-4 mr-2" /> Novo Item</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Itens</p><p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalItems || 0}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Valor Total</p><p className="text-2xl font-bold text-green-600 mt-1">R$ {Number(summary.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold"><AlertTriangle className="w-3 h-3 inline text-red-500" /> Estoque Baixo</p><p className="text-2xl font-bold text-red-600 mt-1">{lowStock.length}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Movimentações</p><p className="text-2xl font-bold text-blue-600 mt-1">{movements.length}</p></div>
            </div>

            {lowStock.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="font-bold text-red-700 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4" /> Estoque Abaixo do Mínimo</h3>
                    <div className="flex flex-wrap gap-2 mt-2">{lowStock.map(i => <Badge key={i.id} variant="outline" className="bg-red-100 text-red-700 border-red-300">{i.name} ({i.currentStock}/{i.minimumStock} {i.unit})</Badge>)}</div>
                </div>
            )}

            <div className="flex gap-2 border-b">
                <button className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'items' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`} onClick={() => setTab('items')}><Boxes className="w-4 h-4 inline mr-1" /> Itens</button>
                <button className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'movements' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`} onClick={() => setTab('movements')}><RotateCcw className="w-4 h-4 inline mr-1" /> Movimentações</button>
            </div>

            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>

            {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div> : tab === 'items' ? (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Estoque</TableHead><TableHead>Mín.</TableHead><TableHead>Custo Un.</TableHead><TableHead>Local</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">Nenhum item</TableCell></TableRow> : filtered.map(i => {
                            const isLow = Number(i.minimumStock) > 0 && Number(i.currentStock) <= Number(i.minimumStock);
                            return <TableRow key={i.id} className={isLow ? 'bg-red-50' : ''}><TableCell className="font-mono text-xs">{i.code || '-'}</TableCell><TableCell className="font-medium">{i.name}</TableCell><TableCell><Badge variant="outline">{i.category || '-'}</Badge></TableCell><TableCell className={`font-bold ${isLow ? 'text-red-600' : ''}`}>{i.currentStock} {i.unit}</TableCell><TableCell className="text-slate-400">{i.minimumStock} {i.unit}</TableCell><TableCell>R$ {Number(i.unitCost || 0).toFixed(2)}</TableCell><TableCell className="text-xs">{i.location || '-'}</TableCell><TableCell>{isLow ? <Badge className="bg-red-100 text-red-700"><TrendingDown className="w-3 h-3 mr-1" />Baixo</Badge> : <Badge className="bg-green-100 text-green-700">OK</Badge>}</TableCell></TableRow>;
                        })}</TableBody></Table></div>
            ) : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Item</TableHead><TableHead>Qtd</TableHead><TableHead>Obra</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
                        <TableBody>{movements.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">Nenhuma movimentação</TableCell></TableRow> : movements.slice(0, 50).map((m: any) => (
                            <TableRow key={m.id}><TableCell className="text-xs">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('pt-BR') : '-'}</TableCell><TableCell><Badge className={movTypeColor[m.type] || ''}>{m.type === 'entry' && <ArrowDown className="w-3 h-3 mr-1" />}{m.type === 'exit' && <ArrowUp className="w-3 h-3 mr-1" />}{movTypeLabel[m.type]}</Badge></TableCell><TableCell className="font-medium">{m.item?.name || '-'}</TableCell><TableCell className="font-bold">{m.quantity} {m.item?.unit || 'un'}</TableCell><TableCell className="text-xs">{m.work?.title || '-'}</TableCell><TableCell className="text-xs">{m.reason || '-'}</TableCell></TableRow>
                        ))}</TableBody></Table></div>
            )}

            {/* New Item Dialog */}
            <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Novo Item</DialogTitle><DialogDescription>Cadastre material</DialogDescription></DialogHeader>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><Label>Nome *</Label><Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Cabo PP 3x2.5mm" /></div>
                        <div><Label>Código</Label><Input value={itemForm.code} onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })} /></div>
                        <div><Label>Categoria</Label><Input value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} /></div>
                        <div><Label>Unidade</Label><Select value={itemForm.unit} onValueChange={(v) => setItemForm({ ...itemForm, unit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="un">un</SelectItem><SelectItem value="m">m</SelectItem><SelectItem value="kg">kg</SelectItem><SelectItem value="pc">pç</SelectItem><SelectItem value="cx">cx</SelectItem></SelectContent></Select></div>
                        <div><Label>Estoque Atual</Label><Input type="number" value={itemForm.currentStock} onChange={(e) => setItemForm({ ...itemForm, currentStock: Number(e.target.value) })} /></div>
                        <div><Label>Estoque Mínimo</Label><Input type="number" value={itemForm.minimumStock} onChange={(e) => setItemForm({ ...itemForm, minimumStock: Number(e.target.value) })} /></div>
                        <div><Label>Custo Un. (R$)</Label><Input type="number" step="0.01" value={itemForm.unitCost} onChange={(e) => setItemForm({ ...itemForm, unitCost: Number(e.target.value) })} /></div>
                        <div className="col-span-2"><Label>Local</Label><Input value={itemForm.location} onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })} placeholder="Almoxarifado Central" /></div>
                    </div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancelar</Button><Button onClick={handleCreateItem} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Cadastrar</Button></DialogFooter>
            </DialogContent></Dialog>

            {/* Movement Dialog */}
            <Dialog open={showMovDialog} onOpenChange={setShowMovDialog}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Nova Movimentação</DialogTitle><DialogDescription>Entrada, saída ou transferência</DialogDescription></DialogHeader>
                <div className="space-y-4">
                    <div><Label>Item *</Label><Select value={movForm.itemId} onValueChange={(v) => setMovForm({ ...movForm, itemId: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.currentStock} {i.unit})</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><Label>Tipo</Label><Select value={movForm.type} onValueChange={(v) => setMovForm({ ...movForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="entry">Entrada</SelectItem><SelectItem value="exit">Saída</SelectItem><SelectItem value="transfer">Transferência</SelectItem><SelectItem value="adjustment">Ajuste</SelectItem></SelectContent></Select></div>
                        <div><Label>Quantidade</Label><Input type="number" value={movForm.quantity} onChange={(e) => setMovForm({ ...movForm, quantity: Number(e.target.value) })} /></div>
                    </div>
                    <div><Label>Obra</Label><Select value={movForm.workId} onValueChange={(v) => setMovForm({ ...movForm, workId: v })}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma</SelectItem>{works.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Motivo</Label><Input value={movForm.reason} onChange={(e) => setMovForm({ ...movForm, reason: e.target.value })} /></div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setShowMovDialog(false)}>Cancelar</Button><Button onClick={handleCreateMov} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Registrar</Button></DialogFooter>
            </DialogContent></Dialog>
        </div>
    );
}
