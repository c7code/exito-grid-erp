/**
 * OeMServiceItemsPanel — Idêntico ao painel de itens do módulo Comercial (NewProposalDialog).
 * Suporta: busca de catálogo, agrupamentos (parent/filho), ver consolidado,
 * exibir detalhes, showGroupTitle, Cobrar override, notas internas, modo de exibição.
 */
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { api } from '@/api';
import {
    Plus, Trash2, Eye, EyeOff, Layers, FileText, Box,
    ChevronDown, Calculator, MessageSquareText,
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

const UNIT_OPTIONS = ['UN', 'M', 'M²', 'M³', 'KG', 'CX', 'PCT', 'JG', 'RL', 'PÇ', 'KIT', 'VB', 'SV', 'H', 'CDA', 'L'];
const SERVICE_TYPES: Record<string, string> = {
    service: 'Serviço',
    material: 'Material',
};

const genId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyItem = (): OemServiceItem => ({
    id: genId(),
    description: '',
    serviceType: 'service',
    unitPrice: '',
    quantity: '1',
    unit: 'SV',
    showDetailedPrices: true,
    showGroupTitle: true,
});

export const parseNum = (v: string | number): number => {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    const s = String(v || '').trim();
    if (!s) return 0;
    const n = s.includes(',')
        ? parseFloat(s.replace(/\./g, '').replace(',', '.'))
        : parseFloat(s);
    return isNaN(n) ? 0 : n;
};

const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    items: OemServiceItem[];
    onChange: (items: OemServiceItem[]) => void;
    displayMode: 'com_valor' | 'sem_valor' | 'texto';
    onDisplayModeChange: (m: 'com_valor' | 'sem_valor' | 'texto') => void;
    /** Total do checklist pré-configurado (preventiva/preditiva/corretiva) */
    checklistTotal: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function OeMServiceItemsPanel({
    items, onChange, displayMode, onDisplayModeChange, checklistTotal,
}: Props) {
    const [searchResults, setSearchResults] = useState<Record<string, any[]>>({});
    const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const [consolidatedView, setConsolidatedView] = useState(false);

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

    const getEffectiveQty = useCallback((item: OemServiceItem): number => {
        const qty = Math.max(parseNum(item.quantity) || 1, 0);
        if (!item.parentId) return qty;
        const parent = items.find(i => i.id === item.parentId);
        const pQty = parent ? Math.max(parseNum(parent.quantity) || 1, 1) : 1;
        return qty * pQty;
    }, [items]);

    const subtotalItems = items.filter(i => !i.parentId).reduce((s, i) => s + getItemTotal(i), 0);
    const grandTotal = checklistTotal + subtotalItems;

    // ── Item CRUD ──────────────────────────────────────────────────────────────

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

    // Multiplicar qty do pai nos filhos permanentemente
    const applyParentQtyToChildren = (parentIdx: number) => {
        const parent = items[parentIdx];
        if (!parent?.isBundleParent) return;
        const pQty = Math.max(parseNum(parent.quantity) || 1, 1);
        if (pQty <= 1) { toast.info('Quantidade do kit já é 1'); return; }

        const next = [...items];
        for (let i = 0; i < next.length; i++) {
            if (next[i].parentId === parent.id) {
                const childQty = parseNum(next[i].quantity) || 1;
                next[i] = { ...next[i], quantity: String(parseFloat((childQty * pQty).toFixed(3))) };
            }
        }
        next[parentIdx] = { ...next[parentIdx], quantity: '1' };
        onChange(next);
        toast.success(`Quantidades multiplicadas por ${pQty}`);
    };

    // ── Busca no catálogo ──────────────────────────────────────────────────────

    const debouncedSearch = useCallback((itemId: string, query: string) => {
        if (searchTimers.current[itemId]) clearTimeout(searchTimers.current[itemId]);
        if (query.length < 2) {
            setSearchResults(p => ({ ...p, [itemId]: [] }));
            return;
        }
        searchTimers.current[itemId] = setTimeout(async () => {
            try {
                const res = await api.searchCatalogItems(query);
                const filtered = (res || []).filter((s: any) => s.dataType !== 'category');
                setSearchResults(p => ({ ...p, [itemId]: filtered }));
            } catch { /* silent */ }
        }, 300);
    }, []);

    const clearSearch = (itemId: string) => {
        setTimeout(() => setSearchResults(p => ({ ...p, [itemId]: [] })), 200);
    };

    const selectCatalogItem = async (idx: number, cat: any) => {
        const item = items[idx];
        if (!item) return;
        const itemId = item.id || String(idx);

        if (cat.isGrouping || cat.dataType === 'grouping') {
            const parentTempId = genId();
            const next = [...items];
            next[idx] = {
                ...next[idx],
                id: parentTempId,
                description: cat.name || '',
                serviceType: cat.type === 'service' ? 'service' : 'material',
                unitPrice: String(cat.unitPrice || 0),
                quantity: '1',
                unit: cat.unit || 'UN',
                isBundleParent: true,
                catalogItemId: cat.id,
                showDetailedPrices: true,
                showGroupTitle: true,
            };
            try {
                const groupData = await api.getGroupingItems(cat.id);
                const children: OemServiceItem[] = groupData.map((gi: any) => ({
                    id: genId(),
                    description: gi.childItem?.name || gi.description || '',
                    serviceType: gi.childItem?.type === 'service' ? 'service' : 'material',
                    unitPrice: String(gi.childItem?.unitPrice || gi.unitPrice || 0),
                    quantity: String(gi.quantity || 1),
                    unit: gi.unit || gi.childItem?.unit || 'UN',
                    parentId: parentTempId,
                    catalogItemId: gi.childItemId,
                    showDetailedPrices: true,
                }));
                next.splice(idx + 1, 0, ...children);
                toast.success(`Kit "${cat.name}" expandido com ${children.length} item(s)`);
            } catch {
                toast.error('Erro ao carregar itens do agrupamento');
            }
            onChange(next);
        } else {
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
        setSearchResults(p => ({ ...p, [itemId]: [] }));
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* ── Cabeçalho: modo exibição + botão adicionar ── */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Serviços / Materiais Adicionais</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Itens extras além do checklist — buscados do catálogo, com suporte a agrupamentos.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
                            <Button type="button" size="sm" variant="outline" className="gap-1 text-xs h-8">
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar
                                <ChevronDown className="w-3 h-3 opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={addItem}>
                                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                Item Avulso
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={addItem}>
                                <Box className="w-4 h-4 mr-2 text-amber-500" />
                                Item do Catálogo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* ── Tabela principal ── */}
            <div className="border rounded-lg overflow-x-auto">
                {/* Cabeçalho da tabela + Ver Consolidado */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Atividades / Serviços
                    </span>
                    <Button
                        type="button"
                        variant={consolidatedView ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setConsolidatedView(!consolidatedView)}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        {consolidatedView ? 'Voltar p/ Kits' : 'Ver Consolidado'}
                    </Button>
                </div>

                {/* ── Vista normal (editável) ── */}
                {!consolidatedView && (
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[220px]">Descrição</TableHead>
                                <TableHead className="w-[110px]">Tipo</TableHead>
                                <TableHead className="w-[120px]">Preço Unit.</TableHead>
                                <TableHead className="w-[90px]">Qtd</TableHead>
                                <TableHead className="w-[80px]">UN</TableHead>
                                <TableHead className="w-[130px]">Total</TableHead>
                                <TableHead className="w-[40px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                                        Nenhum item adicionado. Clique em Adicionar para incluir serviços extras.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((item, index) => {
                                // Ocultar filhos cujo pai está com showDetailedPrices=false
                                if (item.parentId) {
                                    const parent = items.find(it => it.id === item.parentId);
                                    if (parent && !parent.showDetailedPrices) return null;
                                }

                                const itemId = item.id || String(index);
                                const results = searchResults[itemId] || [];

                                return (
                                    <TableRow
                                        key={itemId}
                                        className={item.isBundleParent ? 'bg-slate-50/50' : item.parentId ? 'bg-white' : ''}
                                    >
                                        {/* ── Descrição (com busca inline) ─── */}
                                        <TableCell className="relative">
                                            <div className={`space-y-1 ${item.parentId ? 'pl-6 border-l-2 border-slate-100 ml-2' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                    {item.isBundleParent && (
                                                        <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                                                    )}
                                                    <Input
                                                        placeholder={item.isBundleParent ? 'Nome do Kit...' : 'Descrição ou pesquisar catálogo...'}
                                                        value={item.description}
                                                        onChange={e => {
                                                            updateItem(index, 'description', e.target.value);
                                                            debouncedSearch(itemId, e.target.value);
                                                        }}
                                                        onBlur={() => clearSearch(itemId)}
                                                        className="h-8 text-sm min-w-[180px]"
                                                    />
                                                </div>

                                                {/* Dropdown do catálogo */}
                                                {results.length > 0 && (
                                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-52 overflow-y-auto">
                                                        {results.map((cat: any) => (
                                                            <div
                                                                key={cat.id}
                                                                className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm border-b last:border-0"
                                                                onMouseDown={e => e.preventDefault()}
                                                                onClick={() => selectCatalogItem(index, cat)}
                                                            >
                                                                <div className="flex items-center justify-between w-full">
                                                                    {cat.isGrouping ? (
                                                                        <div className="flex items-center gap-3 w-full">
                                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 shrink-0">
                                                                                <Layers className="w-4 h-4 text-blue-600" />
                                                                            </div>
                                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                                <span className="font-semibold text-blue-900 text-sm truncate">{cat.name}</span>
                                                                                <span className="text-xs text-blue-500">R$ {fmtBRL(Number(cat.unitPrice || 0))} · Agrupamento</span>
                                                                            </div>
                                                                            <span className="text-[11px] bg-blue-600 text-white px-2 py-1 rounded-md font-bold shrink-0">KIT</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2 w-full">
                                                                            <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                                <span className="font-medium text-sm truncate">{cat.name}</span>
                                                                                <span className="text-xs text-slate-500">R$ {fmtBRL(Number(cat.unitPrice || 0))} · {cat.type === 'material' ? 'Material' : 'Serviço'}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* ── Tipo ── */}
                                        <TableCell>
                                            <Select
                                                value={item.serviceType}
                                                onValueChange={v => updateItem(index, 'serviceType', v)}
                                            >
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(SERVICE_TYPES).map(([k, l]) => (
                                                        <SelectItem key={k} value={k}>{l}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        {/* ── Preço Unit. ── */}
                                        <TableCell>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.01"
                                                placeholder="0,00"
                                                value={item.unitPrice}
                                                onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                                                className="h-8 text-sm w-28"
                                            />
                                        </TableCell>

                                        {/* ── Qtd ── */}
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(index, 'quantity', e.target.value)}
                                                    className="h-8 text-sm w-20"
                                                />
                                                {item.parentId && (() => {
                                                    const effQty = getEffectiveQty(item);
                                                    const rawQty = parseNum(item.quantity) || 1;
                                                    return effQty !== rawQty ? (
                                                        <span className="text-[10px] text-blue-500 mt-0.5 whitespace-nowrap">
                                                            Total: {effQty.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </div>
                                        </TableCell>

                                        {/* ── UN ── */}
                                        <TableCell>
                                            <Select
                                                value={item.unit || 'UN'}
                                                onValueChange={v => updateItem(index, 'unit', v)}
                                            >
                                                <SelectTrigger className="h-8 text-sm w-20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {UNIT_OPTIONS.map(u => (
                                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        {/* ── Total + controles de grupo ── */}
                                        <TableCell>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-medium ${item.isBundleParent ? 'text-amber-700 font-bold' : ''}`}>
                                                    R$ {fmtBRL(getItemTotal(item))}
                                                </span>
                                                {item.isBundleParent && (
                                                    <>
                                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                                            Calculado: R$ {fmtBRL(getChildrenTotal(item))}
                                                        </span>
                                                        {/* Override de preço */}
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <span className="text-[10px] text-amber-600 font-semibold whitespace-nowrap">Cobrar:</span>
                                                            <Input
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="auto"
                                                                value={item.overridePrice || ''}
                                                                onChange={e => updateItem(index, 'overridePrice', e.target.value)}
                                                                className="h-6 text-xs w-20 text-right"
                                                            />
                                                        </div>
                                                        {/* EXIBIR DETALHES + TÍTULO + APLICAR QTD */}
                                                        <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                                                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Exibir Detalhes:</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-8 p-0 hover:bg-amber-100"
                                                                onClick={() => updateItem(index, 'showDetailedPrices', !item.showDetailedPrices)}
                                                            >
                                                                {item.showDetailedPrices
                                                                    ? <Eye className="w-4 h-4 text-amber-600" />
                                                                    : <EyeOff className="w-4 h-4 text-slate-400" />}
                                                            </Button>
                                                            <span className="text-[10px] text-slate-400 uppercase font-semibold ml-1">Título:</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                title={item.showGroupTitle !== false
                                                                    ? 'Título do agrupamento VISÍVEL na proposta'
                                                                    : 'Título do agrupamento OCULTO na proposta (itens aparecem como avulsos)'}
                                                                className={`h-6 w-8 p-0 ${item.showGroupTitle !== false ? 'hover:bg-violet-100' : 'hover:bg-slate-100'}`}
                                                                onClick={() => updateItem(index, 'showGroupTitle', item.showGroupTitle === false ? true : false)}
                                                            >
                                                                {item.showGroupTitle !== false
                                                                    ? <Eye className="w-4 h-4 text-violet-600" />
                                                                    : <EyeOff className="w-4 h-4 text-slate-400" />}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Aplicar quantidade do kit nos itens filhos (multiplicar permanentemente)"
                                                                className="h-6 px-1.5 p-0 hover:bg-green-100 text-[10px] gap-0.5"
                                                                onClick={() => applyParentQtyToChildren(index)}
                                                            >
                                                                <Calculator className="w-3.5 h-3.5 text-green-600" />
                                                                <span className="text-green-700 font-semibold">Aplicar Qtd</span>
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* ── Ações (nota + lixeira) ── */}
                                        <TableCell>
                                            <div className="flex items-center gap-0.5">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    title={item.internalNote ? `Nota: ${item.internalNote}` : 'Adicionar nota interna (oculta no PDF)'}
                                                    className={`h-7 w-7 ${item.internalNote ? 'text-blue-500 hover:text-blue-700' : 'text-slate-300 hover:text-blue-500'}`}
                                                    onClick={() => {
                                                        const note = prompt(
                                                            'Nota interna (visível apenas para a equipe, NÃO aparece na proposta/PDF):',
                                                            item.internalNote || ''
                                                        );
                                                        if (note !== null) updateItem(index, 'internalNote', note);
                                                    }}
                                                >
                                                    <MessageSquareText className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-400 hover:text-red-600"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                            {item.internalNote && (
                                                <div className="mt-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 max-w-[150px] truncate" title={item.internalNote}>
                                                    📝 {item.internalNote}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}

                {/* ── Vista Consolidada ── */}
                {consolidatedView && (() => {
                    const childItems = items.filter(i => i.parentId && !i.isBundleParent);
                    const parentItems = items.filter(i => !i.parentId && !i.isBundleParent);

                    interface MergedChild {
                        key: string;
                        description: string;
                        unitPrice: number;
                        totalQty: number;
                        unit: string;
                        serviceType: string;
                        kits: string[];
                    }

                    const mergedMap = new Map<string, MergedChild>();
                    for (const child of childItems) {
                        const key = child.catalogItemId || child.description;
                        const parent = items.find(i => i.id === child.parentId);
                        const pQty = parent ? Math.max(parseNum(parent.quantity) || 1, 1) : 1;
                        const effectiveQty = (parseNum(child.quantity) || 1) * pQty;

                        if (mergedMap.has(key)) {
                            const ex = mergedMap.get(key)!;
                            ex.totalQty += effectiveQty;
                            if (parent && !ex.kits.includes(parent.description)) ex.kits.push(parent.description);
                        } else {
                            mergedMap.set(key, {
                                key,
                                description: child.description,
                                unitPrice: parseNum(child.unitPrice),
                                totalQty: effectiveQty,
                                unit: child.unit || 'UN',
                                serviceType: child.serviceType || 'material',
                                kits: parent ? [parent.description] : [],
                            });
                        }
                    }
                    const mergedItems = Array.from(mergedMap.values()).sort((a, b) => a.description.localeCompare(b.description));

                    return (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[35%]">Material</TableHead>
                                    <TableHead>Preço Unit.</TableHead>
                                    <TableHead>Qtd Total</TableHead>
                                    <TableHead>UN</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Kits</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parentItems.map((item, idx) => (
                                    <TableRow key={'standalone-' + idx}>
                                        <TableCell><span className="text-sm font-medium">{item.description || '—'}</span></TableCell>
                                        <TableCell><span className="text-sm">R$ {fmtBRL(parseNum(item.unitPrice))}</span></TableCell>
                                        <TableCell><span className="text-sm font-semibold">{parseNum(item.quantity) || 1}</span></TableCell>
                                        <TableCell><span className="text-sm">{item.unit || 'UN'}</span></TableCell>
                                        <TableCell><span className="text-sm font-medium">R$ {fmtBRL(getItemTotal(item))}</span></TableCell>
                                        <TableCell><span className="text-xs text-slate-400">—</span></TableCell>
                                    </TableRow>
                                ))}
                                {mergedItems.map(merged => {
                                    const total = merged.unitPrice * merged.totalQty;
                                    return (
                                        <TableRow key={merged.key} className="bg-blue-50/40">
                                            <TableCell>
                                                <span className="text-sm font-medium">{merged.description}</span>
                                            </TableCell>
                                            <TableCell><span className="text-sm">R$ {fmtBRL(merged.unitPrice)}</span></TableCell>
                                            <TableCell><span className="text-sm font-semibold text-blue-700">{parseFloat(merged.totalQty.toFixed(3))}</span></TableCell>
                                            <TableCell><span className="text-sm">{merged.unit}</span></TableCell>
                                            <TableCell><span className="text-sm font-medium">R$ {fmtBRL(total)}</span></TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {merged.kits.map((k, i) => (
                                                        <span key={i} className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{k}</span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {mergedItems.length === 0 && parentItems.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-sm text-slate-400 py-4">
                                            Nenhum item para consolidar
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    );
                })()}
            </div>

            {/* ── Totalizador ── */}
            <div className="flex flex-col items-end gap-1 text-sm">
                {checklistTotal > 0 && (
                    <div className="flex gap-4">
                        <span className="text-slate-500">📋 Checklist O&M:</span>
                        <span className="font-medium w-32 text-right">R$ {fmtBRL(checklistTotal)}</span>
                    </div>
                )}
                {subtotalItems > 0 && (
                    <div className="flex gap-4">
                        <span className="text-slate-500">➕ Serviços extras:</span>
                        <span className="font-medium w-32 text-right">R$ {fmtBRL(subtotalItems)}</span>
                    </div>
                )}
                {(checklistTotal > 0 || subtotalItems > 0) && (
                    <div className="flex gap-4 font-bold text-base border-t border-slate-200 pt-2 mt-1">
                        <span className="text-slate-700">Total da Proposta:</span>
                        <span className="text-amber-600 w-32 text-right">R$ {fmtBRL(grandTotal)}</span>
                    </div>
                )}
                {grandTotal === 0 && (
                    <p className="text-slate-400 text-xs">Configure valores no checklist ou adicione serviços extras</p>
                )}
            </div>
        </div>
    );
}
