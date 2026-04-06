// ═══════════════════════════════════════════════════════════════════════════
// MaterialAllocationPanel — Painel de itens (Materiais + Serviços) para O&M
// Mesma experiência do módulo de Propostas: busca, tipo, qtd, preço, total
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { api } from '@/api';
import {
  Package, Trash2, Search, Plus, ChevronDown, Database, PenLine, Loader2,
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface OemMaterial {
  id?: string;           // UUID do catalog_item (se veio do catálogo)
  description: string;   // Nome/descrição
  serviceType: string;   // 'material' | 'service'
  unit: string;          // Unidade (UN, M, M², KG, etc.)
  quantity: number;      // Quantidade
  unitPrice: number;     // Preço unitário
  total: number;         // quantity × unitPrice
  fromCatalog: boolean;  // Se veio do catálogo
}

interface Props {
  materials: OemMaterial[];
  onChange: (materials: OemMaterial[]) => void;
  readOnly?: boolean;
}

const unitOptions = ['UN', 'M', 'M²', 'KG', 'CX', 'PCT', 'JG', 'RL', 'PÇ', 'CDA', 'KIT', 'VB'];

const fmt = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const parseNum = (v: string | number): number => {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  const s = String(v).trim();
  if (!s) return 0;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function MaterialAllocationPanel({ materials, onChange, readOnly }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const searchTimeout = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Totals ──
  const subtotalMaterial = materials.filter(m => m.serviceType === 'material').reduce((s, m) => s + m.total, 0);
  const subtotalService = materials.filter(m => m.serviceType === 'service').reduce((s, m) => s + m.total, 0);
  const grandTotal = subtotalMaterial + subtotalService;

  // ── Catalog search ──
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await api.searchCatalogItems(query);
        setSearchResults(results.filter((r: any) => r.dataType !== 'category').slice(0, 8));
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
  }, []);

  // ── Add item from catalog ──
  const addFromCatalog = (catalogItem: any) => {
    const newItem: OemMaterial = {
      id: catalogItem.id,
      description: catalogItem.name || catalogItem.description || '',
      serviceType: catalogItem.type === 'service' ? 'service' : 'material',
      unit: catalogItem.unit || 'UN',
      quantity: 1,
      unitPrice: Number(catalogItem.unitPrice || 0),
      total: Number(catalogItem.unitPrice || 0),
      fromCatalog: true,
    };
    onChange([...materials, newItem]);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    setActiveSearchIndex(null);
  };

  // ── Add manual item ──
  const addManualItem = (type: string) => {
    const newItem: OemMaterial = {
      description: '',
      serviceType: type,
      unit: 'UN',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      fromCatalog: false,
    };
    onChange([...materials, newItem]);
  };

  // ── Update item ──
  const updateItem = (index: number, field: keyof OemMaterial, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate total
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? parseNum(value) : updated[index].quantity;
      const price = field === 'unitPrice' ? parseNum(value) : updated[index].unitPrice;
      updated[index].quantity = qty;
      updated[index].unitPrice = price;
      updated[index].total = qty * price;
    }

    onChange(updated);
  };

  // ── Remove item ──
  const removeItem = (index: number) => {
    onChange(materials.filter((_, i) => i !== index));
  };

  // ── Inline search for description field ──
  const handleDescriptionChange = (index: number, value: string) => {
    updateItem(index, 'description', value);
    setActiveSearchIndex(index);
    debouncedSearch(value);
    setShowSearch(true);
  };

  const selectSearchResult = (index: number, catalogItem: any) => {
    const updated = [...materials];
    updated[index] = {
      ...updated[index],
      id: catalogItem.id,
      description: catalogItem.name || catalogItem.description || '',
      serviceType: catalogItem.type === 'service' ? 'service' : 'material',
      unit: catalogItem.unit || updated[index].unit,
      unitPrice: Number(catalogItem.unitPrice || 0),
      total: updated[index].quantity * Number(catalogItem.unitPrice || 0),
      fromCatalog: true,
    };
    onChange(updated);
    setShowSearch(false);
    setActiveSearchIndex(null);
    setSearchResults([]);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
            Atividades / Serviços
          </h3>
        </div>

        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Adicionar <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => addManualItem('service')}>
                <PenLine className="w-4 h-4 mr-2 text-blue-500" />
                Item Avulso
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSearch(true)}>
                <Search className="w-4 h-4 mr-2 text-emerald-500" />
                Item do Catálogo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Catalog search (top-level) */}
      {showSearch && activeSearchIndex === null && (
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                autoFocus
                placeholder="Buscar no catálogo..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); debouncedSearch(e.target.value); }}
                className="pl-9 text-sm"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(''); }}>
              ✕
            </Button>
          </div>
          {(searchResults.length > 0 || searching) && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searching && <div className="p-3 flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" />Buscando...</div>}
              {searchResults.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between gap-2 border-b border-slate-50 last:border-0 transition-colors"
                  onClick={() => addFromCatalog(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{item.name || item.description}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5">
                      {item.sku && <span className="text-xs text-slate-400">SKU: {item.sku}</span>}
                      {item.brand && <span className="text-xs text-slate-400">• {item.brand}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-green-600">{fmt(item.unitPrice || 0)}</span>
                    <span className="text-xs text-slate-400 block">{item.unit || 'UN'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Items table */}
      {materials.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-white">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_100px_80px_70px_90px_80px_32px] gap-1 px-3 py-2 bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div>Descrição</div>
            <div>Tipo</div>
            <div className="text-right">Preço Unit.</div>
            <div className="text-right">Qtd</div>
            <div className="text-center">UN</div>
            <div className="text-right">Total</div>
            <div></div>
          </div>

          {/* Table body */}
          {materials.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_100px_80px_70px_90px_80px_32px] gap-1 px-3 py-1.5 border-b border-slate-50 last:border-0 items-center hover:bg-slate-50/50 group relative"
            >
              {/* Description with inline catalog search */}
              <div className="relative">
                {readOnly ? (
                  <div className="flex items-center gap-1.5">
                    {item.fromCatalog && <Database className="w-3 h-3 text-blue-400 shrink-0" />}
                    <span className="text-sm text-slate-700 truncate">{item.description}</span>
                  </div>
                ) : (
                  <>
                    <Input
                      value={item.description}
                      onChange={e => handleDescriptionChange(index, e.target.value)}
                      onFocus={() => setActiveSearchIndex(index)}
                      onBlur={() => setTimeout(() => { if (activeSearchIndex === index) { setShowSearch(false); setActiveSearchIndex(null); } }, 200)}
                      placeholder="Descrição..."
                      className="text-sm h-8 border-0 shadow-none bg-transparent px-1 focus-visible:ring-1"
                    />
                    {/* Inline search results */}
                    {showSearch && activeSearchIndex === index && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-0.5 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto left-0 top-full">
                        {searchResults.map(sr => (
                          <button
                            key={sr.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between gap-2 border-b border-slate-50 last:border-0"
                            onMouseDown={e => { e.preventDefault(); selectSearchResult(index, sr); }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Database className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate">{sr.name || sr.description}</span>
                            </div>
                            <span className="text-xs font-medium text-green-600 shrink-0">{fmt(sr.unitPrice || 0)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Type */}
              {readOnly ? (
                <span className="text-xs text-slate-500">{item.serviceType === 'service' ? 'Serviço' : 'Material'}</span>
              ) : (
                <Select
                  value={item.serviceType}
                  onValueChange={v => updateItem(index, 'serviceType', v)}
                >
                  <SelectTrigger className="h-8 text-xs border-0 shadow-none bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Serviço</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Unit Price */}
              {readOnly ? (
                <span className="text-sm text-right text-slate-700">{parseNum(item.unitPrice).toFixed(2)}</span>
              ) : (
                <Input
                  type="text"
                  inputMode="decimal"
                  value={item.unitPrice}
                  onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                  className="text-sm h-8 text-right border-0 shadow-none bg-transparent px-1"
                />
              )}

              {/* Quantity */}
              {readOnly ? (
                <span className="text-sm text-right text-slate-700">{item.quantity}</span>
              ) : (
                <Input
                  type="text"
                  inputMode="decimal"
                  value={item.quantity}
                  onChange={e => updateItem(index, 'quantity', e.target.value)}
                  className="text-sm h-8 text-right border-0 shadow-none bg-transparent px-1"
                />
              )}

              {/* Unit */}
              {readOnly ? (
                <span className="text-xs text-center text-slate-500">{item.unit}</span>
              ) : (
                <Select
                  value={item.unit}
                  onValueChange={v => updateItem(index, 'unit', v)}
                >
                  <SelectTrigger className="h-8 text-xs border-0 shadow-none bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Total */}
              <span className="text-sm text-right font-medium text-slate-800">
                {fmt(item.total)}
              </span>

              {/* Delete */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      {materials.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex justify-end px-4 py-2 gap-8 text-sm">
            {subtotalMaterial > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Materiais:</span>
                <span className="font-medium text-slate-700">{fmt(subtotalMaterial)}</span>
              </div>
            )}
            {subtotalService > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Serviços:</span>
                <span className="font-medium text-slate-700">{fmt(subtotalService)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-end px-4 py-2.5 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-300">Total:</span>
              <span className="text-lg font-bold text-emerald-400">{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {materials.length === 0 && !showSearch && (
        <div className="text-center py-6 text-sm text-slate-400">
          Nenhum item adicionado. Clique em <strong>+ Adicionar</strong> para incluir materiais ou serviços.
        </div>
      )}
    </div>
  );
}
