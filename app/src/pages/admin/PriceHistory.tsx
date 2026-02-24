import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/api';
import {
    History, Calculator, Search, Package, DollarSign, Plus, ArrowUpRight,
    ArrowDownRight, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sourceLabels: Record<string, { label: string; color: string }> = {
    quotation: { label: 'Cotação', color: 'bg-blue-100 text-blue-700' },
    manual: { label: 'Manual', color: 'bg-slate-100 text-slate-700' },
    import: { label: 'Importação', color: 'bg-purple-100 text-purple-700' },
};

export default function PriceHistoryPage() {
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [bestPrices, setBestPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showMarkupDialog, setShowMarkupDialog] = useState(false);
    const [saving, setSaving] = useState(false);

    const [addForm, setAddForm] = useState({ supplierId: '', unitPrice: 0, date: '' });
    const [markupForm, setMarkupForm] = useState({ markupPercent: 30, supplierId: '' });
    const [markupResult, setMarkupResult] = useState<any>(null);

    const load = async () => {
        try {
            setLoading(true);
            const [items, supps] = await Promise.all([api.getCatalogItems(), api.getSuppliers()]);
            setCatalogItems(items);
            setSuppliers(supps);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const selectItem = async (item: any) => {
        setSelectedItem(item);
        setMarkupResult(null);
        try {
            const [h, bp] = await Promise.all([
                api.getPriceHistory(item.id),
                api.getBestPrice(item.id),
            ]);
            setHistory(h);
            setBestPrices(bp);
        } catch (e) { console.error(e); }
    };

    const handleAddPrice = async () => {
        if (!selectedItem || !addForm.supplierId || !addForm.unitPrice) return;
        setSaving(true);
        try {
            await api.addPriceManual({
                catalogItemId: selectedItem.id,
                supplierId: addForm.supplierId,
                unitPrice: addForm.unitPrice,
                date: addForm.date || undefined,
            });
            setShowAddDialog(false);
            setAddForm({ supplierId: '', unitPrice: 0, date: '' });
            selectItem(selectedItem);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleCalculateMarkup = async () => {
        if (!selectedItem) return;
        try {
            const result = await api.calculateMarkup({
                catalogItemId: selectedItem.id,
                markupPercent: markupForm.markupPercent,
                supplierId: markupForm.supplierId || undefined,
            });
            setMarkupResult(result);
        } catch (e) { console.error(e); }
    };

    const filteredItems = catalogItems.filter(i =>
        i.name?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase())
    );

    const priceVariation = history.length >= 2
        ? ((Number(history[0].unitPrice) - Number(history[1].unitPrice)) / Number(history[1].unitPrice) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-7 h-7 text-amber-500" /> Memorial de Preços
                    </h1>
                    <p className="text-slate-500 mt-1">Histórico de preços, rastreabilidade e calculadora de markup</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left: Catalog Items */}
                <div className="col-span-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                            </div>
                            <div className="space-y-1 max-h-[600px] overflow-y-auto">
                                {loading ? (
                                    <p className="text-sm text-slate-500 text-center py-4">Carregando...</p>
                                ) : filteredItems.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">Nenhum item</p>
                                ) : (
                                    filteredItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => selectItem(item)}
                                            className={cn(
                                                'w-full text-left p-3 rounded-lg flex items-center gap-3 text-sm transition-colors',
                                                selectedItem?.id === item.id
                                                    ? 'bg-amber-50 border-2 border-amber-300'
                                                    : 'hover:bg-slate-50 border border-transparent'
                                            )}
                                        >
                                            <Package className="w-4 h-4 text-slate-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.unit} • R$ {Number(item.unitPrice).toFixed(2)}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Price History */}
                <div className="col-span-8 space-y-4">
                    {!selectedItem ? (
                        <Card>
                            <CardContent className="p-12 text-center text-slate-400">
                                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-lg font-medium">Selecione um item do catálogo</p>
                                <p className="text-sm">O histórico de preços será exibido aqui</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-slate-500">Preço Catálogo</p>
                                                <p className="text-xl font-bold text-slate-900">R$ {Number(selectedItem.unitPrice).toFixed(2)}</p>
                                            </div>
                                            <DollarSign className="w-8 h-8 text-slate-300" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-slate-500">Melhor Preço</p>
                                                <p className="text-xl font-bold text-green-600">
                                                    {bestPrices.length > 0 ? `R$ ${Number(bestPrices[0].unitPrice).toFixed(2)}` : '—'}
                                                </p>
                                                {bestPrices.length > 0 && <p className="text-xs text-slate-500">{bestPrices[0].supplier?.name}</p>}
                                            </div>
                                            <Star className="w-8 h-8 text-green-200" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-slate-500">Variação</p>
                                                <p className={cn('text-xl font-bold', priceVariation > 0 ? 'text-red-600' : priceVariation < 0 ? 'text-green-600' : 'text-slate-600')}>
                                                    {priceVariation !== 0 ? `${priceVariation > 0 ? '+' : ''}${priceVariation.toFixed(1)}%` : '—'}
                                                </p>
                                            </div>
                                            {priceVariation > 0 ? <ArrowUpRight className="w-8 h-8 text-red-200" /> : <ArrowDownRight className="w-8 h-8 text-green-200" />}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                                    <Plus className="w-4 h-4 mr-1" /> Registrar Preço
                                </Button>
                                <Button onClick={() => { setMarkupResult(null); setShowMarkupDialog(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Calculator className="w-4 h-4 mr-1" /> Calculadora Markup
                                </Button>
                            </div>

                            {/* History Table */}
                            <Card>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-slate-50">
                                                <th className="py-3 px-4 text-left">Data</th>
                                                <th className="py-3 px-4 text-left">Fornecedor</th>
                                                <th className="py-3 px-4 text-right">Preço Unit</th>
                                                <th className="py-3 px-4 text-left">Fonte</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.length === 0 ? (
                                                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Nenhum registro de preço</td></tr>
                                            ) : (
                                                history.map((h: any, idx: number) => {
                                                    const src = sourceLabels[h.source] || sourceLabels.manual;
                                                    const prev = history[idx + 1];
                                                    const diff = prev ? ((Number(h.unitPrice) - Number(prev.unitPrice)) / Number(prev.unitPrice) * 100) : 0;
                                                    return (
                                                        <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                            <td className="py-3 px-4">{new Date(h.date).toLocaleDateString('pt-BR')}</td>
                                                            <td className="py-3 px-4 font-medium">{h.supplier?.name || '—'}</td>
                                                            <td className="py-3 px-4 text-right font-mono">
                                                                R$ {Number(h.unitPrice).toFixed(2)}
                                                                {diff !== 0 && (
                                                                    <span className={cn('text-xs ml-1', diff > 0 ? 'text-red-500' : 'text-green-500')}>
                                                                        ({diff > 0 ? '+' : ''}{diff.toFixed(1)}%)
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4"><Badge className={cn('text-xs', src.color)}>{src.label}</Badge></td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>

            {/* Dialog: Adicionar Preço Manual */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Registrar Preço — {selectedItem?.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Fornecedor *</label>
                            <select value={addForm.supplierId} onChange={e => setAddForm(p => ({ ...p, supplierId: e.target.value }))} className="flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                                <option value="">Selecionar...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Preço Unitário *</label>
                            <Input type="number" step="0.01" value={addForm.unitPrice || ''} onChange={e => setAddForm(p => ({ ...p, unitPrice: Number(e.target.value) }))} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Data</label>
                            <Input type="date" value={addForm.date} onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))} />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                            <Button onClick={handleAddPrice} disabled={!addForm.supplierId || !addForm.unitPrice || saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                                {saving ? 'Salvando...' : 'Registrar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog: Calculadora de Markup */}
            <Dialog open={showMarkupDialog} onOpenChange={setShowMarkupDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-blue-600" /> Calculadora de Markup — {selectedItem?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Margem de Interesse (%)</label>
                                <Input type="number" step="0.1" value={markupForm.markupPercent} onChange={e => setMarkupForm(p => ({ ...p, markupPercent: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Base de Custo</label>
                                <select value={markupForm.supplierId} onChange={e => setMarkupForm(p => ({ ...p, supplierId: e.target.value }))} className="flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                                    <option value="">Melhor preço geral</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <Button onClick={handleCalculateMarkup} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Calculator className="w-4 h-4 mr-2" /> Calcular
                        </Button>

                        {markupResult && (
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <p className="text-xs text-slate-500">Custo Base</p>
                                        <p className="text-xl font-bold text-slate-900">R$ {markupResult.baseCost.toFixed(2)}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <p className="text-xs text-slate-500">Markup</p>
                                        <p className="text-xl font-bold text-amber-600">{markupResult.markupPercent}%</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-xs text-green-600">Preço de Venda</p>
                                        <p className="text-2xl font-bold text-green-700">R$ {markupResult.sellingPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-xs text-blue-600">Lucro</p>
                                        <p className="text-2xl font-bold text-blue-700">R$ {markupResult.profit.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
