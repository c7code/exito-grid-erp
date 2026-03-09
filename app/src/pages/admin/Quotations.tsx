import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/api';
import {
    FileText, Plus, Search, Eye, BarChart3, Package, CheckCircle, Clock, Trash2,
    ArrowRight, TrendingDown, Building2, Loader2, Send, DollarSign, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700', icon: FileText },
    sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700', icon: ArrowRight },
    received: { label: 'Recebida', color: 'bg-amber-100 text-amber-700', icon: Package },
    analyzed: { label: 'Analisada', color: 'bg-purple-100 text-purple-700', icon: BarChart3 },
    closed: { label: 'Fechada', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

const emptyItem = { description: '', quantity: 1, unit: 'un', catalogItemId: '', estimatedUnitPrice: 0, targetSupplierIds: [] as string[] };

export default function Quotations() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [works, setWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showResponseDialog, setShowResponseDialog] = useState(false);
    const [showCompareDialog, setShowCompareDialog] = useState(false);
    const [selected, setSelected] = useState<any>(null);
    const [comparison, setComparison] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [expandedItem, setExpandedItem] = useState<number | null>(null);

    const [newForm, setNewForm] = useState({ title: '', deadline: '', notes: '', workId: '', items: [{ ...emptyItem }] as any[] });
    const [responseForm, setResponseForm] = useState({ supplierId: '', deliveryDays: 0, paymentTerms: '', validUntil: '', notes: '', items: [] as any[] });

    const load = async () => {
        try {
            setLoading(true);
            const [q, s, c, w] = await Promise.all([
                api.getQuotations(), api.getSuppliers(), api.getCatalogItems(), api.getWorks(),
            ]);
            setQuotations(q);
            setSuppliers(Array.isArray(s) ? s : []);
            setCatalogItems(Array.isArray(c) ? c : []);
            const wks = Array.isArray(w) ? w : (w?.data ?? []);
            setWorks(wks);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!newForm.title || newForm.items.length === 0) { toast.error('Preencha título e itens'); return; }
        setSaving(true);
        try {
            await api.createQuotation(newForm);
            toast.success('Cotação criada!');
            setShowNewDialog(false);
            setNewForm({ title: '', deadline: '', notes: '', workId: '', items: [{ ...emptyItem }] });
            load();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const openDetail = async (id: string) => {
        try {
            const q = await api.getQuotation(id);
            setSelected(q);
            setShowDetailDialog(true);
        } catch (e) { console.error(e); }
    };

    const openResponse = () => {
        if (!selected) return;
        setResponseForm({
            supplierId: '', deliveryDays: 0, paymentTerms: '', validUntil: '', notes: '',
            items: selected.items.map((i: any) => ({ quotationItemId: i.id, unitPrice: 0, totalPrice: 0, notes: '' })),
        });
        setShowResponseDialog(true);
    };

    const handleResponse = async () => {
        if (!selected || !responseForm.supplierId) return;
        setSaving(true);
        try {
            await api.addQuotationResponse(selected.id, responseForm);
            toast.success('Resposta registrada!');
            setShowResponseDialog(false);
            const updated = await api.getQuotation(selected.id);
            setSelected(updated);
            load();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const openCompare = async () => {
        if (!selected) return;
        try {
            const data = await api.compareQuotation(selected.id);
            setComparison(data);
            setShowCompareDialog(true);
        } catch (e) { console.error(e); }
    };

    const handleSelectResponse = async (responseId: string) => {
        try {
            await api.selectQuotationResponse(responseId);
            toast.success('Fornecedor selecionado!');
            load();
            setShowCompareDialog(false);
            setShowDetailDialog(false);
        } catch (e) { console.error(e); }
    };

    const addItem = () => setNewForm(p => ({ ...p, items: [...p.items, { ...emptyItem }] }));
    const removeItem = (idx: number) => setNewForm(p => ({ ...p, items: p.items.filter((_: any, i: number) => i !== idx) }));

    const updateItem = (idx: number, field: string, value: any) => {
        setNewForm(p => ({
            ...p, items: p.items.map((item: any, i: number) => {
                if (i !== idx) return item;
                if (field === 'catalogItemId' && value) {
                    const cat = catalogItems.find((c: any) => c.id === value);
                    return {
                        ...item,
                        catalogItemId: value,
                        description: cat?.name || item.description,
                        unit: cat?.unit || 'un',
                        estimatedUnitPrice: cat?.costPrice || cat?.unitPrice || 0,
                    };
                }
                return { ...item, [field]: value };
            }),
        }));
    };

    const toggleSupplierForItem = (itemIdx: number, supplierId: string) => {
        setNewForm(p => ({
            ...p, items: p.items.map((item: any, i: number) => {
                if (i !== itemIdx) return item;
                const ids: string[] = item.targetSupplierIds || [];
                return {
                    ...item,
                    targetSupplierIds: ids.includes(supplierId) ? ids.filter((id: string) => id !== supplierId) : [...ids, supplierId],
                };
            }),
        }));
    };

    const selectAllSuppliersForItem = (itemIdx: number) => {
        setNewForm(p => ({
            ...p, items: p.items.map((item: any, i: number) => {
                if (i !== itemIdx) return item;
                return { ...item, targetSupplierIds: suppliers.map((s: any) => s.id) };
            }),
        }));
    };

    const updateResponseItem = (idx: number, field: string, value: any) => {
        setResponseForm(p => ({
            ...p, items: p.items.map((item: any, i: number) => {
                if (i !== idx) return item;
                const updated = { ...item, [field]: Number(value) };
                if (field === 'unitPrice') {
                    const qItem = selected.items[idx];
                    updated.totalPrice = Number(value) * Number(qItem?.quantity || 1);
                }
                return updated;
            }),
        }));
    };

    const filtered = quotations.filter(q => q.title?.toLowerCase().includes(search.toLowerCase()) || q.code?.includes(search));
    const totalEstimated = newForm.items.reduce((s: number, i: any) => s + (Number(i.estimatedUnitPrice || 0) * Number(i.quantity || 1)), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-7 h-7 text-amber-500" /> Cotações
                    </h1>
                    <p className="text-slate-500 mt-1">Solicitações de cotação com roteamento por fornecedor</p>
                </div>
                <Button onClick={() => setShowNewDialog(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
                    <Plus className="w-4 h-4 mr-2" /> Nova Cotação
                </Button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Buscar por título ou código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Total</p><p className="text-2xl font-bold mt-1">{quotations.length}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Rascunhos</p><p className="text-2xl font-bold text-slate-500 mt-1">{quotations.filter(q => q.status === 'draft').length}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Aguardando</p><p className="text-2xl font-bold text-amber-600 mt-1">{quotations.filter(q => q.status === 'sent').length}</p></div>
                <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Fechadas</p><p className="text-2xl font-bold text-green-600 mt-1">{quotations.filter(q => q.status === 'closed').length}</p></div>
            </div>

            {/* Quotation List */}
            <Card>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-slate-50">
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Código</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Título</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Obra</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Itens</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Respostas</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Data</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-8 text-slate-500">Nenhuma cotação</td></tr>
                            ) : (
                                filtered.map(q => {
                                    const st = statusConfig[q.status] || statusConfig.draft;
                                    return (
                                        <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4 font-mono text-sm font-medium text-amber-600">{q.code}</td>
                                            <td className="py-3 px-4 text-sm font-medium">{q.title}</td>
                                            <td className="py-3 px-4 text-sm text-slate-500">
                                                {q.work ? (
                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                                        <Building2 className="w-3 h-3 mr-1" />{q.work.title}
                                                    </Badge>
                                                ) : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="py-3 px-4 text-sm">{q.items?.length || 0}</td>
                                            <td className="py-3 px-4 text-sm">{q.responses?.length || 0} fornecedores</td>
                                            <td className="py-3 px-4"><Badge className={cn('text-xs', st.color)}>{st.label}</Badge></td>
                                            <td className="py-3 px-4 text-sm text-slate-500">{new Date(q.createdAt).toLocaleDateString('pt-BR')}</td>
                                            <td className="py-3 px-4 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => openDetail(q.id)}>
                                                    <Eye className="w-4 h-4 mr-1" /> Detalhes
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* ═══ Dialog: Nova Cotação ═══ */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" />Nova Cotação</DialogTitle></DialogHeader>
                    <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-4">
                            <div><Label>Título *</Label><Input value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))} /></div>
                            <div><Label>Prazo</Label><Input type="date" value={newForm.deadline} onChange={e => setNewForm(p => ({ ...p, deadline: e.target.value }))} /></div>
                            <div><Label>Obra (opcional)</Label>
                                <Select value={newForm.workId} onValueChange={v => setNewForm(p => ({ ...p, workId: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        {works.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div><Label>Observações</Label><textarea className="w-full border rounded-md p-2 text-sm h-16 resize-none" value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))} /></div>

                        {/* Items Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Label className="text-sm font-bold">Itens da Cotação</Label>
                                    {totalEstimated > 0 && (
                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                            <DollarSign className="w-3 h-3 mr-1" />
                                            Estimado: R$ {totalEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Badge>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Item</Button>
                            </div>
                            <div className="space-y-3">
                                {newForm.items.map((item: any, idx: number) => (
                                    <div key={idx} className="border rounded-lg overflow-hidden">
                                        {/* Item Row */}
                                        <div className="flex gap-2 items-end p-3 bg-white">
                                            <div className="w-48">
                                                <label className="text-xs text-slate-500">Item do catálogo</label>
                                                <select
                                                    value={item.catalogItemId}
                                                    onChange={e => updateItem(idx, 'catalogItemId', e.target.value)}
                                                    className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                                                >
                                                    <option value="">Manual</option>
                                                    {catalogItems.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-500">Descrição</label>
                                                <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="h-9" />
                                            </div>
                                            <div className="w-20">
                                                <label className="text-xs text-slate-500">Qtd</label>
                                                <Input type="text" inputMode="decimal" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="h-9" />
                                            </div>
                                            <div className="w-16">
                                                <label className="text-xs text-slate-500">Un</label>
                                                <Input value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="h-9" />
                                            </div>
                                            <div className="w-28">
                                                <label className="text-xs text-slate-500">Preço Ref. (R$)</label>
                                                <Input type="text" inputMode="decimal" value={item.estimatedUnitPrice || ''} onChange={e => updateItem(idx, 'estimatedUnitPrice', Number(e.target.value))} className="h-9 bg-green-50 border-green-200" placeholder="0,00" />
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setExpandedItem(expandedItem === idx ? null : idx)} title="Selecionar fornecedores">
                                                    <Users className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                {newForm.items.length > 1 && (
                                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeItem(idx)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Supplier Selection (expandable) */}
                                        {expandedItem === idx && (
                                            <div className="p-3 bg-blue-50 border-t border-blue-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                                                        <Send className="w-3 h-3" /> Enviar este item para quais fornecedores?
                                                    </span>
                                                    <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => selectAllSuppliersForItem(idx)}>Selecionar todos</Button>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {suppliers.map((s: any) => (
                                                        <label key={s.id} className={cn(
                                                            "flex items-center gap-2 p-2 rounded-md border cursor-pointer text-xs transition",
                                                            (item.targetSupplierIds || []).includes(s.id)
                                                                ? "bg-blue-100 border-blue-300 text-blue-800"
                                                                : "bg-white border-slate-200 hover:bg-slate-50"
                                                        )}>
                                                            <Checkbox
                                                                checked={(item.targetSupplierIds || []).includes(s.id)}
                                                                onCheckedChange={() => toggleSupplierForItem(idx, s.id)}
                                                            />
                                                            <span className="font-medium">{s.name}</span>
                                                            <Badge variant="outline" className="text-[10px] ml-auto">{s.segment === 'material' ? 'Material' : s.segment === 'service' ? 'Serviço' : 'Ambos'}</Badge>
                                                        </label>
                                                    ))}
                                                </div>
                                                {(item.targetSupplierIds || []).length > 0 && (
                                                    <p className="text-xs text-blue-600 mt-2">{(item.targetSupplierIds || []).length} fornecedor(es) selecionado(s)</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Item total row */}
                                        {item.estimatedUnitPrice > 0 && (
                                            <div className="px-3 py-1.5 bg-slate-50 border-t text-xs text-slate-500 flex justify-between">
                                                <span>Subtotal estimado:</span>
                                                <span className="font-mono font-bold text-slate-700">
                                                    R$ {(Number(item.estimatedUnitPrice) * Number(item.quantity || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={!newForm.title || saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Criar Cotação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ Dialog: Detalhes ═══ */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><span className="text-amber-600 font-mono">{selected?.code}</span> {selected?.title}</DialogTitle></DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                                <Badge className={cn('text-xs', statusConfig[selected.status]?.color)}>{statusConfig[selected.status]?.label}</Badge>
                                {selected.deadline && <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />Prazo: {new Date(selected.deadline).toLocaleDateString('pt-BR')}</Badge>}
                                {selected.work && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700"><Building2 className="w-3 h-3 mr-1" />{selected.work.title}</Badge>}
                            </div>

                            <div>
                                <h4 className="font-medium text-sm mb-2">Itens ({selected.items?.length})</h4>
                                <table className="w-full text-sm border rounded-lg overflow-hidden">
                                    <thead><tr className="bg-slate-50 border-b">
                                        <th className="py-2 px-3 text-left">Descrição</th>
                                        <th className="py-2 px-3 text-right">Qtd</th>
                                        <th className="py-2 px-3 text-left">Un</th>
                                        <th className="py-2 px-3 text-right">Preço Ref.</th>
                                        <th className="py-2 px-3 text-left">Fornecedores</th>
                                    </tr></thead>
                                    <tbody>
                                        {selected.items?.map((item: any) => (
                                            <tr key={item.id} className="border-b">
                                                <td className="py-2 px-3">{item.description}</td>
                                                <td className="py-2 px-3 text-right">{item.quantity}</td>
                                                <td className="py-2 px-3">{item.unit}</td>
                                                <td className="py-2 px-3 text-right font-mono">
                                                    {item.estimatedUnitPrice ? `R$ ${Number(item.estimatedUnitPrice).toFixed(2)}` : '—'}
                                                </td>
                                                <td className="py-2 px-3">
                                                    {item.targetSupplierIds?.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.targetSupplierIds.map((sId: string) => {
                                                                const sup = suppliers.find((s: any) => s.id === sId);
                                                                return sup ? <Badge key={sId} variant="outline" className="text-[10px]">{sup.name}</Badge> : null;
                                                            })}
                                                        </div>
                                                    ) : <span className="text-slate-300 text-xs">Todos</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {(selected.responses?.length > 0) && (
                                <div>
                                    <h4 className="font-medium text-sm mb-2">Respostas ({selected.responses.length})</h4>
                                    <div className="space-y-2">
                                        {selected.responses.map((r: any) => (
                                            <div key={r.id} className="p-3 border rounded-lg flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">{r.supplier?.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {r.deliveryDays ? `${r.deliveryDays} dias` : ''} {r.paymentTerms ? `• ${r.paymentTerms}` : ''}
                                                    </p>
                                                </div>
                                                <Badge className={cn('text-xs', r.status === 'selected' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>
                                                    {r.status === 'selected' ? 'Selecionado' : r.status === 'rejected' ? 'Rejeitado' : 'Recebido'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={openResponse}><Plus className="w-4 h-4 mr-1" /> Registrar Resposta</Button>
                                {(selected.responses?.length >= 2) && (
                                    <Button onClick={openCompare} className="bg-blue-600 hover:bg-blue-700 text-white"><BarChart3 className="w-4 h-4 mr-1" /> Comparar</Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ Dialog: Registrar Resposta ═══ */}
            <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Registrar Resposta de Fornecedor</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Fornecedor *</Label>
                                <Select value={responseForm.supplierId} onValueChange={v => setResponseForm(p => ({ ...p, supplierId: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                                    <SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div><Label>Prazo Entrega (dias)</Label><Input type="text" inputMode="decimal" value={responseForm.deliveryDays} onChange={e => setResponseForm(p => ({ ...p, deliveryDays: Number(e.target.value) }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Condições Pagamento</Label><Input value={responseForm.paymentTerms} onChange={e => setResponseForm(p => ({ ...p, paymentTerms: e.target.value }))} /></div>
                            <div><Label>Validade</Label><Input type="date" value={responseForm.validUntil} onChange={e => setResponseForm(p => ({ ...p, validUntil: e.target.value }))} /></div>
                        </div>

                        <div>
                            <h4 className="font-medium text-sm mb-2">Preços por Item</h4>
                            <div className="space-y-2">
                                {selected?.items?.map((item: any, idx: number) => (
                                    <div key={item.id} className="flex gap-3 items-center p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{item.description}</p>
                                            <p className="text-xs text-slate-500">
                                                {item.quantity} {item.unit}
                                                {item.estimatedUnitPrice ? ` • Ref: R$ ${Number(item.estimatedUnitPrice).toFixed(2)}` : ''}
                                            </p>
                                        </div>
                                        <div className="w-32">
                                            <label className="text-xs text-slate-500">Preço Unit</label>
                                            <Input type="text" inputMode="decimal" step="0.01" value={responseForm.items[idx]?.unitPrice || ''} onChange={e => updateResponseItem(idx, 'unitPrice', e.target.value)} className="h-9" />
                                        </div>
                                        <div className="w-32">
                                            <label className="text-xs text-slate-500">Total</label>
                                            <p className="text-sm font-mono font-medium pt-1">R$ {(responseForm.items[idx]?.totalPrice || 0).toFixed(2)}</p>
                                        </div>
                                        {item.estimatedUnitPrice > 0 && responseForm.items[idx]?.unitPrice > 0 && (
                                            <div className="w-16 text-center">
                                                {Number(responseForm.items[idx]?.unitPrice) <= Number(item.estimatedUnitPrice) ? (
                                                    <Badge className="bg-green-100 text-green-700 text-[10px]"><TrendingDown className="w-3 h-3" /></Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 text-[10px]">+{((Number(responseForm.items[idx]?.unitPrice) / Number(item.estimatedUnitPrice) - 1) * 100).toFixed(0)}%</Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResponseDialog(false)}>Cancelar</Button>
                        <Button onClick={handleResponse} disabled={!responseForm.supplierId || saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Registrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ Dialog: Comparativo ═══ */}
            <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Comparativo — {comparison?.quotation?.code}</DialogTitle></DialogHeader>
                    {comparison && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border rounded-lg">
                                    <thead><tr className="bg-slate-50 border-b">
                                        <th className="py-3 px-4 text-left">Item</th>
                                        <th className="py-3 px-4 text-right">Qtd</th>
                                        <th className="py-3 px-4 text-right">Ref.</th>
                                        {comparison.comparison[0]?.prices?.map((p: any) => (
                                            <th key={p.supplierId} className="py-3 px-4 text-right">{p.supplierName}</th>
                                        ))}
                                        <th className="py-3 px-4 text-right text-green-700">Melhor</th>
                                    </tr></thead>
                                    <tbody>
                                        {comparison.comparison.map((item: any) => (
                                            <tr key={item.itemId} className="border-b">
                                                <td className="py-3 px-4 font-medium">{item.description}</td>
                                                <td className="py-3 px-4 text-right">{item.quantity} {item.unit}</td>
                                                <td className="py-3 px-4 text-right font-mono text-slate-400">
                                                    {item.estimatedUnitPrice ? `R$ ${Number(item.estimatedUnitPrice).toFixed(2)}` : '—'}
                                                </td>
                                                {item.prices.map((p: any) => (
                                                    <td key={p.supplierId} className={cn(
                                                        'py-3 px-4 text-right font-mono',
                                                        item.bestPrice?.supplierId === p.supplierId ? 'text-green-700 font-bold bg-green-50' : ''
                                                    )}>
                                                        R$ {Number(p.unitPrice).toFixed(2)}
                                                        {item.bestPrice?.supplierId === p.supplierId && <TrendingDown className="w-3 h-3 inline ml-1" />}
                                                    </td>
                                                ))}
                                                <td className="py-3 px-4 text-right font-mono text-green-700 font-bold">
                                                    {item.bestPrice ? `R$ ${Number(item.bestPrice.unitPrice).toFixed(2)}` : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {selected?.responses?.filter((r: any) => r.status !== 'selected' && r.status !== 'rejected').length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Selecionar Fornecedor Vencedor</p>
                                    <div className="flex gap-2">
                                        {selected.responses.filter((r: any) => r.status === 'received').map((r: any) => (
                                            <Button key={r.id} variant="outline" onClick={() => handleSelectResponse(r.id)} className="text-sm">
                                                <CheckCircle className="w-4 h-4 mr-1 text-green-600" /> {r.supplier?.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
