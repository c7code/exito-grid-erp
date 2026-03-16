import { useState, useEffect, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Package,
    Search,
    Plus,
    Loader2,
    Trash2,
    Layers,
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface GroupingChild {
    childItemId: string;
    name: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    categoryName?: string;
}

interface NewGroupingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    activeTab: 'material' | 'service';
    initialItem?: any;
}

export default function NewGroupingDialog({
    open,
    onOpenChange,
    onSuccess,
    activeTab,
    initialItem,
}: NewGroupingDialogProps) {
    const isEditing = !!initialItem;
    const [saving, setSaving] = useState(false);
    const [kitName, setKitName] = useState('');
    const [children, setChildren] = useState<GroupingChild[]>([]);

    // Product search
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (!open) {
            setKitName('');
            setChildren([]);
            setSearchTerm('');
            setSearchResults([]);
        } else if (open && initialItem) {
            // Modo edição: pré-preencher dados
            setKitName(initialItem.name || '');
            // Carregar os itens filhos do agrupamento
            api.getGroupingItems(initialItem.id).then((data: any[]) => {
                setChildren(data.map((gi: any) => ({
                    childItemId: gi.childItemId,
                    name: gi.childItem?.name || gi.description || '',
                    unit: gi.unit || gi.childItem?.unit || 'UN',
                    unitPrice: Number(gi.childItem?.unitPrice || 0),
                    quantity: Number(gi.quantity || 1),
                    categoryName: gi.childItem?.category?.name || '',
                })));
            }).catch(() => setChildren([]));
        }
    }, [open, initialItem]);

    const handleSearch = useCallback(async (term: string) => {
        if (term.length < 2) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const items = await api.searchCatalogItems(term);
            // Filter out items already added
            const existingIds = new Set(children.map(c => c.childItemId));
            setSearchResults(items.filter((i: any) =>
                (i.type || 'material') === activeTab && !existingIds.has(i.id)
            ));
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, [children, activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => handleSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, handleSearch]);

    const addChild = (item: any) => {
        setChildren(prev => [...prev, {
            childItemId: item.id,
            name: item.name,
            unit: item.unit || 'UN',
            unitPrice: Number(item.unitPrice) || 0,
            quantity: 1,
            categoryName: item.category?.name || item.categories?.map((c: any) => c.name).join(', ') || '',
        }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeChild = (idx: number) => {
        setChildren(prev => prev.filter((_, i) => i !== idx));
    };

    const updateQuantity = (idx: number, qty: number) => {
        setChildren(prev => prev.map((c, i) => i === idx ? { ...c, quantity: Math.max(0.001, qty) } : c));
    };

    const updateUnit = (idx: number, unit: string) => {
        setChildren(prev => prev.map((c, i) => i === idx ? { ...c, unit } : c));
    };

    const updateUnitPrice = (idx: number, price: number) => {
        setChildren(prev => prev.map((c, i) => i === idx ? { ...c, unitPrice: Math.max(0, price) } : c));
    };

    const totalPrice = children.reduce((sum, c) => sum + (c.unitPrice * c.quantity), 0);

    const handleSave = async () => {
        if (!kitName.trim()) { toast.error('Informe o nome do agrupamento'); return; }
        if (children.length === 0) { toast.error('Adicione pelo menos um produto ao agrupamento'); return; }

        setSaving(true);
        try {
            let parentId: string;

            if (isEditing) {
                await api.updateCatalogItem(initialItem.id, {
                    name: kitName,
                    unitPrice: totalPrice,
                    costPrice: totalPrice,
                });
                parentId = initialItem.id;
            } else {
                const parentItem = await api.createCatalogItem({
                    name: kitName,
                    type: activeTab,
                    isGrouping: true,
                    unitPrice: totalPrice,
                    costPrice: totalPrice,
                    unit: 'KIT',
                    isActive: true,
                    isSoldSeparately: true,
                });
                parentId = parentItem.id;
            }

            // Salvar os itens filhos (substitui todos)
            await api.saveGroupingItems(parentId, children.map((c, idx) => ({
                childItemId: c.childItemId,
                quantity: c.quantity,
                unit: c.unit,
                sortOrder: idx,
            })));

            // Sincronizar preços dos filhos no catálogo (se foram alterados)
            const priceUpdates = children.map(c =>
                api.updateCatalogItem(c.childItemId, {
                    unitPrice: c.unitPrice,
                    costPrice: c.unitPrice,
                }).catch(() => null) // silently ignore individual failures
            );
            await Promise.all(priceUpdates);

            toast.success(`Agrupamento "${kitName}" ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} agrupamento`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
                {/* Header */}
                <DialogHeader className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg ring-4 ring-white/10">
                            <Layers className="w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{isEditing ? 'Editar Agrupamento (Kit)' : 'Novo Agrupamento (Kit)'}</DialogTitle>
                            <DialogDescription className="text-blue-200">
                                Crie um kit composto por produtos já cadastrados com quantidades pré-definidas.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 bg-slate-50">
                    {/* Kit Name & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Nome do Agrupamento *</Label>
                            <Input
                                value={kitName}
                                onChange={e => setKitName(e.target.value)}
                                placeholder="Ex: CE1, Kit Padrão MT, etc."
                                className="bg-white h-10"
                            />
                        </div>
                    </div>

                    {/* Product Search */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                            <Package className="w-4 h-4" />
                            <span>Produtos do Kit</span>
                            <Badge variant="outline" className="ml-auto text-xs">{children.length} produto(s)</Badge>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar produto para adicionar ao kit..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white"
                            />
                            {searching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                            )}

                            {/* Dropdown results */}
                            {searchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {searchResults.slice(0, 10).map((item: any) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                                            onClick={() => addChild(item)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                                                <p className="text-xs text-slate-400">
                                                    {item.sku && `${item.sku} • `}
                                                    {item.unit || 'UN'} • R$ {Number(item.unitPrice || 0).toFixed(2)}
                                                    {item.category?.name && ` • ${item.category.name}`}
                                                </p>
                                            </div>
                                            <Plus className="w-4 h-4 text-blue-500 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Children Table */}
                    {children.length > 0 && (
                        <div className="border rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-2 font-semibold text-slate-600">Produto</th>
                                        <th className="text-left px-2 py-2 font-semibold text-slate-600 w-24">Qtd</th>
                                        <th className="text-left px-2 py-2 font-semibold text-slate-600 w-24">Unidade</th>
                                        <th className="text-right px-2 py-2 font-semibold text-slate-600 w-28">Preço Unit.</th>
                                        <th className="text-right px-4 py-2 font-semibold text-slate-600 w-28">Subtotal</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {children.map((child, idx) => (
                                        <tr key={child.childItemId} className="border-b last:border-0 hover:bg-blue-50/30">
                                            <td className="px-4 py-2.5">
                                                <p className="font-medium text-slate-700">{child.name}</p>
                                                {child.categoryName && (
                                                    <p className="text-[10px] text-slate-400">{child.categoryName}</p>
                                                )}
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <Input
                                                    type="number"
                                                    min={0.001}
                                                    step="any"
                                                    value={child.quantity}
                                                    onChange={e => updateQuantity(idx, parseFloat(e.target.value) || 1)}
                                                    className="h-8 w-20 text-sm"
                                                />
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <Select value={child.unit} onValueChange={v => updateUnit(idx, v)}>
                                                    <SelectTrigger className="h-8 w-20 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="UN">UN</SelectItem>
                                                        <SelectItem value="KG">KG</SelectItem>
                                                        <SelectItem value="M">M</SelectItem>
                                                        <SelectItem value="M2">M²</SelectItem>
                                                        <SelectItem value="M3">M³</SelectItem>
                                                        <SelectItem value="L">L</SelectItem>
                                                        <SelectItem value="PC">PC</SelectItem>
                                                        <SelectItem value="CX">CX</SelectItem>
                                                        <SelectItem value="RL">RL</SelectItem>
                                                        <SelectItem value="KIT">KIT</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-slate-400 text-sm">R$</span>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={child.unitPrice}
                                                        onChange={e => updateUnitPrice(idx, parseFloat(e.target.value) || 0)}
                                                        className="h-8 w-24 text-sm text-right"
                                                        title="Editar preço unitário do material"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                                                R$ {(child.unitPrice * child.quantity).toFixed(2)}
                                            </td>
                                            <td className="pr-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-400 hover:text-red-600"
                                                    onClick={() => removeChild(idx)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-3 text-right font-bold text-blue-800 text-sm uppercase">
                                            Total do Kit:
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-800 text-lg">
                                            R$ {totalPrice.toFixed(2)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {children.length === 0 && (
                        <div className="text-center py-8 text-slate-400 bg-white border-2 border-dashed rounded-xl">
                            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">Nenhum produto adicionado</p>
                            <p className="text-xs mt-1">Use a busca acima para adicionar produtos ao kit</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="sticky bottom-0 bg-slate-50 pt-4 pb-2 flex justify-end gap-3 border-t border-slate-200">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg"
                            disabled={saving}
                        >
                        {saving ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
                            ) : (
                                <><Layers className="w-4 h-4 mr-2" /> {isEditing ? 'Salvar Alterações' : 'Criar Agrupamento'}</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
