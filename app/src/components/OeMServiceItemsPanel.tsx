/**
 * OeMServiceItemsPanel
 * Painel de itens de serviços para Proposta O&M — Idêntico ao módulo Comercial.
 * Suporta: itens avulsos, busca no catálogo, agrupamentos (isBundleParent + filhos),
 * showDetailedPrices, showGroupTitle, modos de visibilidade e totalização.
 */
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { api } from '@/api';
import {
    Plus, Trash2, Search, ChevronDown, Eye, EyeOff, Layers,
    FileText, Box,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface OemServiceItem {
    id?: string;
    description: string;
    serviceType: 'service' | 'material';
    unitPrice: string;
    quantity: string;
    unit: string;
    isBundleParent?: boolean;
    parentId?: string;
    showDetailedPrices?: boolean;
    showGroupTitle?: boolean;
    catalogItemId?: string;
    overridePrice?: string;
    internalNote?: string;
}

const UNIT_OPTIONS = ['UN', 'M', 'M²', 'KG', 'CX', 'PCT', 'JG', 'RL', 'PÇ', 'KIT', 'VB', 'SV', 'H'];

const emptyItem = (): OemServiceItem => ({
    id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: '',
    serviceType: 'service',
    unitPrice: '',
    quantity: '1',
    unit: 'SV',
    showDetailedPrices: true,
    showGroupTitle: true,
});

const parseNum = (v: string | number): number => {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    const s = String(v || '').trim();
    if (!s) return 0;
    const n = s.includes(',')
        ? parseFloat(s.replace(/\./g, '').replace(',', '.'))
        : parseFloat(s);
    return isNaN(n) ? 0 : n;
};

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    items: OemServiceItem[];
    onChange: (items: OemServiceItem[]) => void;
    displayMode: 'com_valor' | 'sem_valor' | 'texto';
    onDisplayModeChange: (m: 'com_valor' | 'sem_valor' | 'texto') => void;
    /** Total do checklist pré-configurado (preventiva/preditiva/corretiva) */
    checklistTotal: number;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function OeMServiceItemsPanel({
    items, onChange, displayMode, onDisplayModeChange, checklistTotal,
}: Props) {
    const [searchResults, setSearchResults] = useState<Record<string, any[]>>({});
    const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // ── Cálculos ──────────────────────────────────────────────────────────────

    const getChildrenTotal = useCallback((item: OemServiceItem) =>
        items.filter(i => i.parentId === item.id)
            .reduce((s, i) => s + parseNum(i.unitPrice) * Math.max(parseNum(i.quantity) || 1, 0), 0),
        [items]);

    const getItemTotal = useCallback((item: OemServiceItem): number => {
        if (item.isBundleParent) {
            const pQty = Math.max(parseNum(item.quantity) || 1, 1);
            if (item.overridePrice && item.overridePrice.trim() !== '') return parseNum(item.overridePrice) * pQty;
            return getChildrenTotal(item) * pQty;
        }
        if (item.parentId) {
            const parent = items.find(i => i.id === item.parentId);
            const pQty = parent ? Math.max(parseNum(parent.quantity) || 1, 1) : 1;
            return parseNum(item.unitPrice) * Math.max(parseNum(item.quantity) || 1, 0) * pQty;
        }
        return parseNum(item.unitPrice) * Math.max(parseNum(item.quantity) || 1, 0);
    }, [items, getChildrenTotal]);

    const subtotalItems = items.filter(i => !i.parentId).reduce((s, i) => s + getItemTotal(i), 0);
    const grandTotal = checklistTotal + subtotalItems;

    // ── Item CRUD ─────────────────────────────────────────────────────────────

    const addItem = () => onChange([...items, emptyItem()]);

    const removeItem = (idx: number) => {
        const item = items[idx];
        let next = [...items];
        if (item.isBundleParent) {
            next = next.filter((it, i) => i !== idx && it.parentId !== item.id);
        } else {
            next = next.filter((_, i) => i !== idx);
        }
        if (next.length === 0) next = [emptyItem()];
        onChange(next);
    };

    const updateItem = (idx: number, field: keyof OemServiceItem, value: any) => {
        const next = [...items];
        next[idx] = { ...next[idx], [field]: value };
        onChange(next);
    };

    // ── Busca no catálogo ─────────────────────────────────────────────────────

    const debouncedSearch = useCallback((itemId: string, query: string) => {
        if (searchTimers.current[itemId]) clearTimeout(searchTimers.current[itemId]);
        if (query.length < 2) { setSearchResults(p => ({ ...p, [itemId]: [] })); return; }
        searchTimers.current[itemId] = setTimeout(async () => {
            try {
                const res = await api.searchCatalogItems(query);
                const filtered = (res || []).filter((s: any) => s.dataType !== 'category');
                setSearchResults(p => ({ ...p, [itemId]: filtered }));
            } catch { /* silent */ }
        }, 300);
    }, []);

    // ── Selecionar item do catálogo ───────────────────────────────────────────

    const selectCatalogItem = async (idx: number, cat: any) => {
        const item = items[idx];
        if (!item) return;

        if (cat.dataType === 'grouping' || cat.isBundleParent) {
            // Agrupamento → expandir filhos
            try {
                const groupData = await api.getGroupingItems(cat.id);
                const parentId = item.id || `grp-${Date.now()}`;
                const parent: OemServiceItem = {
                    ...item,
                    id: parentId,
                    description: cat.name || cat.description || '',
                    serviceType: 'service',
                    unitPrice: String(cat.unitPrice || 0),
                    quantity: '1',
                    unit: cat.unit || 'UN',
                    isBundleParent: true,
                    catalogItemId: cat.id,
                    showDetailedPrices: true,
                    showGroupTitle: true,
                };
                const children: OemServiceItem[] = groupData.map((gi: any) => ({
                    id: `child-${gi.childItemId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    description: gi.childItem?.name || '',
                    serviceType: gi.childItem?.type === 'service' ? 'service' : 'material',
                    unitPrice: String(gi.childItem?.unitPrice || 0),
                    quantity: String(gi.quantity || 1),
                    unit: gi.unit || gi.childItem?.unit || 'UN',
                    parentId,
                    catalogItemId: gi.childItemId,
                    showDetailedPrices: true,
                }));
                const next = [...items];
                next.splice(idx, 1, parent, ...children);
                onChange(next);
                toast.success(`Agrupamento "${cat.name}" expandido com ${children.length} item(s)`);
            } catch {
                toast.error('Erro ao expandir agrupamento');
            }
        } else {
            // Item simples
            const next = [...items];
            next[idx] = {
                ...next[idx],
                description: cat.name || '',
                serviceType: cat.type === 'service' ? 'service' : 'material',
                unitPrice: String(cat.unitPrice || 0),
                unit: cat.unit || 'SV',
                catalogItemId: cat.id,
            };
            onChange(next);
        }
        setSearchResults(p => ({ ...p, [item.id || String(idx)]: [] }));
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* ── Cabeçalho + botões ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Serviços Adicionais</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Itens livres com agrupamento, busca no catálogo e modos de exibição.
                        São <strong>somados</strong> ao checklist O&M.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Modo de exibição */}
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                        {(['com_valor', 'sem_valor', 'texto'] as const).map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => onDisplayModeChange(m)}
                                className={`px-2.5 py-1.5 font-medium transition-colors ${displayMode === m
                                    ? m === 'com_valor' ? 'bg-emerald-600 text-white'
                                        : m === 'sem_valor' ? 'bg-blue-600 text-white'
                                            : 'bg-purple-600 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                {m === 'com_valor' ? '💰 Com valor' : m === 'sem_valor' ? '📋 Sem valor' : '📝 Texto'}
                            </button>
                        ))}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900 gap-1 text-xs font-bold">
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar
                                <ChevronDown className="w-3 h-3 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={addItem}>
                                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                Item Avulso
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={addItem}>
                                <Search className="w-4 h-4 mr-2 text-slate-400" />
                                Item do Catálogo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* ── Tabela de itens ── */}
            {items.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[32%] text-xs">Descrição</TableHead>
                                <TableHead className="w-[15%] text-xs">Tipo</TableHead>
                                <TableHead className="w-[10%] text-xs">Qtd</TableHead>
                                <TableHead className="w-[8%] text-xs">Un</TableHead>
                                <TableHead className="w-[14%] text-xs text-right">Valor Unit.</TableHead>
                                <TableHead className="w-[12%] text-xs text-right">Total</TableHead>
                                <TableHead className="w-[9%] text-xs text-center">Opções</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, idx) => {
                                const isChild = !!item.parentId;
                                const isParent = !!item.isBundleParent;
                                const itemKey = item.id || String(idx);
                                const results = searchResults[itemKey] || [];
                                const total = getItemTotal(item);

                                return (
                                    <TableRow
                                        key={itemKey}
                                        className={`
                                            ${isParent ? 'bg-blue-50/60 border-l-4 border-blue-400' : ''}
                                            ${isChild ? 'bg-slate-50/80 border-l-4 border-slate-200 ml-4' : ''}
                                        `}
                                    >
                                        {/* Descrição com busca no catálogo */}
                                        <TableCell className="py-2 pr-2">
                                            <div className="relative">
                                                <div className="flex items-center gap-1.5">
                                                    {isChild && <span className="text-slate-300 text-xs ml-1">↳</span>}
                                                    {isParent && <Box className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                                                    {isParent && (
                                                        <div className="flex items-center gap-1 mr-1">
                                                            <button
                                                                type="button"
                                                                title={item.showGroupTitle ? 'Ocultar título do grupo no PDF' : 'Mostrar título do grupo no PDF'}
                                                                onClick={() => updateItem(idx, 'showGroupTitle', !item.showGroupTitle)}
                                                                className={`text-xs px-1 py-0.5 rounded border transition-colors ${item.showGroupTitle !== false ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                                                            >
                                                                {item.showGroupTitle !== false ? 'G✓' : 'G✗'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    <Input
                                                        value={item.description}
                                                        onChange={e => {
                                                            updateItem(idx, 'description', e.target.value);
                                                            debouncedSearch(itemKey, e.target.value);
                                                        }}
                                                        placeholder={isParent ? 'Nome do agrupamento...' : 'Descrição ou buscar catálogo...'}
                                                        className={`h-8 text-xs flex-1 ${isChild ? 'bg-white/80' : ''} ${isParent ? 'font-semibold text-blue-800 bg-blue-50' : ''}`}
                                                    />
                                                </div>

                                                {/* Dropdown catálogo */}
                                                {results.length > 0 && (
                                                    <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[320px] bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                                                        {results.map((cat: any) => (
                                                            <button
                                                                key={cat.id}
                                                                type="button"
                                                                className="w-full text-left px-3 py-2.5 hover:bg-amber-50 border-b border-slate-100 last:border-0 transition-colors"
                                                                onClick={() => selectCatalogItem(idx, cat)}
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        {cat.dataType === 'grouping' && <Layers className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                                                                        {cat.dataType !== 'grouping' && <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                                                                        <span className="text-xs font-medium text-slate-800 truncate">{cat.name}</span>
                                                                        <Badge variant="outline" className={`text-[10px] px-1 py-0 flex-shrink-0 ${cat.type === 'service' ? 'text-blue-600 border-blue-200' : 'text-amber-700 border-amber-200'}`}>
                                                                            {cat.type === 'service' ? 'Serviço' : 'Material'}
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-emerald-700 flex-shrink-0">
                                                                        R$ {fmtBRL(Number(cat.unitPrice || 0))}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Tipo Serviço/Material */}
                                        <TableCell className="py-2 px-1">
                                            {!isParent ? (
                                                <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs w-full">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItem(idx, 'serviceType', 'service')}
                                                        className={`flex-1 py-1 transition-colors ${item.serviceType === 'service' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                                    >Serv.</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItem(idx, 'serviceType', 'material')}
                                                        className={`flex-1 py-1 border-l border-slate-200 transition-colors ${item.serviceType === 'material' ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                                    >Mat.</button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-md">Grupo</span>
                                            )}
                                        </TableCell>

                                        {/* Quantidade */}
                                        <TableCell className="py-2 px-1">
                                            <Input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                className="h-8 text-xs text-right w-full"
                                            />
                                        </TableCell>

                                        {/* Unidade */}
                                        <TableCell className="py-2 px-1">
                                            <select
                                                value={item.unit}
                                                onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                className="h-8 text-xs rounded-md border border-slate-200 bg-white px-1 w-full focus:outline-none focus:ring-1 focus:ring-amber-400"
                                            >
                                                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </TableCell>

                                        {/* Valor Unit */}
                                        <TableCell className="py-2 px-1">
                                            {isParent ? (
                                                <div className="space-y-1">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={item.overridePrice ?? ''}
                                                        onChange={e => updateItem(idx, 'overridePrice', e.target.value)}
                                                        placeholder="Auto"
                                                        title="Sobrescrever preço do grupo (deixe vazio para usar soma dos filhos)"
                                                        className="h-8 text-xs text-right w-full bg-yellow-50 border-yellow-300"
                                                    />
                                                    <p className="text-[10px] text-slate-400 text-right">override</p>
                                                </div>
                                            ) : (
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                                    className="h-8 text-xs text-right w-full"
                                                    disabled={isChild && !!item.parentId}
                                                />
                                            )}
                                        </TableCell>

                                        {/* Total */}
                                        <TableCell className="py-2 px-1 text-right">
                                            <span className={`text-xs font-bold ${isParent ? 'text-blue-700' : total > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>
                                                {total > 0 ? `R$ ${fmtBRL(total)}` : '—'}
                                            </span>
                                        </TableCell>

                                        {/* Opções */}
                                        <TableCell className="py-2 px-1">
                                            <div className="flex items-center gap-1 justify-center">
                                                {/* Visibilidade do preço no PDF */}
                                                {!isParent && (
                                                    <button
                                                        type="button"
                                                        title={item.showDetailedPrices !== false ? 'Ocultar preço no PDF' : 'Mostrar preço no PDF'}
                                                        onClick={() => updateItem(idx, 'showDetailedPrices', !(item.showDetailedPrices !== false))}
                                                        className={`p-1 rounded transition-colors ${item.showDetailedPrices !== false ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                                    >
                                                        {item.showDetailedPrices !== false
                                                            ? <Eye className="w-3.5 h-3.5" />
                                                            : <EyeOff className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
                                                    className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {items.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                    <Box className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhum item adicionado</p>
                    <p className="text-xs mt-1">Clique em "Adicionar" para incluir serviços extras além do checklist</p>
                </div>
            )}

            {/* ── Totalizador combinado ── */}
            <div className="bg-slate-900 rounded-xl p-4 space-y-2">
                {checklistTotal > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">📋 Checklist O&M</span>
                        <span className="text-slate-300 font-medium">R$ {fmtBRL(checklistTotal)}</span>
                    </div>
                )}
                {subtotalItems > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">➕ Serviços adicionais</span>
                        <span className="text-slate-300 font-medium">R$ {fmtBRL(subtotalItems)}</span>
                    </div>
                )}
                {(checklistTotal > 0 || subtotalItems > 0) && (
                    <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                        <span className="text-white font-bold text-sm">Total da Proposta</span>
                        <span className="text-amber-400 font-black text-xl">R$ {fmtBRL(grandTotal)}</span>
                    </div>
                )}
                {grandTotal === 0 && (
                    <p className="text-slate-500 text-xs text-center">
                        Configure os itens do checklist ou adicione serviços extras
                    </p>
                )}
            </div>
        </div>
    );
}
