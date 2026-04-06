// ═══════════════════════════════════════════════════════════════════════════
// MaterialAllocationPanel — Painel de alocação de materiais reutilizável
// Usado no módulo O&M (Serviços) e potencialmente em OS / Propostas
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api';
import {
  Package, Trash2, Search, Loader2, Database, PenLine, X,
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface OemMaterial {
  id?: string;           // UUID do catalog_item (se veio do catálogo)
  description: string;   // Nome/descrição
  unit: string;          // Unidade (un, m, kg, pç, etc.)
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

const fmt = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function MaterialAllocationPanel({ materials, onChange, readOnly }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ description: '', unit: 'un', quantity: 1, unitPrice: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<any>(null);

  // ── Total geral dos materiais ──
  const totalMaterials = materials.reduce((sum, m) => sum + m.total, 0);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Search catalog with debounce ──
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const items = await api.searchCatalogItems(query);
        setSearchResults(Array.isArray(items) ? items.slice(0, 10) : []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
  }, []);

  // ── Add from catalog ──
  const addFromCatalog = (item: any) => {
    const newMat: OemMaterial = {
      id: item.id,
      description: item.description || item.name || '',
      unit: item.unit || 'un',
      quantity: 1,
      unitPrice: Number(item.unitPrice || item.price || 0),
      total: Number(item.unitPrice || item.price || 0),
      fromCatalog: true,
    };
    onChange([...materials, newMat]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  // ── Add manual ──
  const addManual = () => {
    if (!manualForm.description.trim()) return;
    const total = manualForm.quantity * manualForm.unitPrice;
    const newMat: OemMaterial = {
      description: manualForm.description.trim(),
      unit: manualForm.unit || 'un',
      quantity: manualForm.quantity || 1,
      unitPrice: manualForm.unitPrice || 0,
      total,
      fromCatalog: false,
    };
    onChange([...materials, newMat]);
    setManualForm({ description: '', unit: 'un', quantity: 1, unitPrice: 0 });
    setShowManualForm(false);
  };

  // ── Update material row ──
  const updateMaterial = (idx: number, field: keyof OemMaterial, value: any) => {
    const updated = [...materials];
    (updated[idx] as any)[field] = value;
    // Recalc total
    if (field === 'quantity' || field === 'unitPrice') {
      updated[idx].total = Number(updated[idx].quantity || 0) * Number(updated[idx].unitPrice || 0);
    }
    onChange(updated);
  };

  // ── Remove ──
  const removeMaterial = (idx: number) => {
    onChange(materials.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-slate-50 border rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-sm text-slate-700">Materiais Utilizados</h3>
          {materials.length > 0 && (
            <Badge variant="outline" className="text-xs">{materials.length} {materials.length === 1 ? 'item' : 'itens'}</Badge>
          )}
        </div>
        {!readOnly && totalMaterials > 0 && (
          <span className="text-sm font-bold text-blue-700">{fmt(totalMaterials)}</span>
        )}
      </div>

      {/* Search bar */}
      {!readOnly && (
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar material no catálogo..."
              className="pl-8 pr-10 h-9 text-sm"
            />
            {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />}
            {searchQuery && !searching && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {searchResults.map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between gap-2 border-b border-slate-50 last:border-0 transition-colors"
                  onClick={() => addFromCatalog(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{item.description || item.name}</span>
                    </div>
                    {item.category?.name && (
                      <span className="text-xs text-slate-400 ml-5.5">{item.category.name}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-green-600">{fmt(item.unitPrice || item.price || 0)}</span>
                    <span className="text-xs text-slate-400 block">{item.unit || 'un'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-center text-sm text-slate-400">
              Nenhum item encontrado no catálogo
            </div>
          )}
        </div>
      )}

      {/* Material rows */}
      {materials.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Material</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 w-16">Unid</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 w-20">Qtd</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-slate-500 w-24">Preço Unit</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-slate-500 w-24">Total</th>
                {!readOnly && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {materials.map((m, idx) => (
                <tr key={idx} className="border-t border-slate-100 group hover:bg-slate-50/50">
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      {m.fromCatalog ? (
                        <span title="Do catálogo"><Database className="w-3.5 h-3.5 text-blue-400 shrink-0" /></span>
                      ) : (
                        <span title="Manual"><PenLine className="w-3.5 h-3.5 text-amber-400 shrink-0" /></span>
                      )}
                      {readOnly ? (
                        <span className="text-slate-700 truncate">{m.description}</span>
                      ) : (
                        <Input
                          value={m.description}
                          onChange={e => updateMaterial(idx, 'description', e.target.value)}
                          className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {readOnly ? (
                      <span className="text-xs text-slate-500">{m.unit}</span>
                    ) : (
                      <Input
                        value={m.unit}
                        onChange={e => updateMaterial(idx, 'unit', e.target.value)}
                        className="h-7 text-xs text-center w-14 mx-auto"
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {readOnly ? (
                      <span className="text-xs">{m.quantity}</span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={m.quantity || ''}
                        onChange={e => updateMaterial(idx, 'quantity', Number(e.target.value) || 0)}
                        className="h-7 text-xs text-center w-16 mx-auto"
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {readOnly ? (
                      <span className="text-xs">{fmt(m.unitPrice)}</span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={m.unitPrice || ''}
                        onChange={e => updateMaterial(idx, 'unitPrice', Number(e.target.value) || 0)}
                        className="h-7 text-xs text-right w-20 ml-auto"
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <span className="text-xs font-semibold text-green-700">{fmt(m.total)}</span>
                  </td>
                  {!readOnly && (
                    <td className="px-1 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeMaterial(idx)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Totalizador */}
          <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Total de Materiais</span>
            </div>
            <span className="text-lg font-bold text-blue-400">{fmt(totalMaterials)}</span>
          </div>
        </div>
      )}

      {materials.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-2">Nenhum material adicionado</p>
      )}

      {/* Manual entry form */}
      {!readOnly && showManualForm && (
        <div className="bg-white border border-amber-200 rounded-lg p-3 space-y-2">
          <Label className="text-xs font-medium text-amber-700">Adicionar material avulso</Label>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-5">
              <Input
                value={manualForm.description}
                onChange={e => setManualForm({ ...manualForm, description: e.target.value })}
                placeholder="Descrição do material"
                className="h-8 text-xs"
                onKeyDown={e => e.key === 'Enter' && addManual()}
              />
            </div>
            <div className="col-span-2">
              <Input
                value={manualForm.unit}
                onChange={e => setManualForm({ ...manualForm, unit: e.target.value })}
                placeholder="un"
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={manualForm.quantity || ''}
                onChange={e => setManualForm({ ...manualForm, quantity: Number(e.target.value) || 0 })}
                placeholder="Qtd"
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={manualForm.unitPrice || ''}
                onChange={e => setManualForm({ ...manualForm, unitPrice: Number(e.target.value) || 0 })}
                placeholder="R$ Unit"
                className="h-8 text-xs text-right"
              />
            </div>
            <div className="col-span-1 flex gap-1">
              <Button type="button" variant="default" size="sm" onClick={addManual} className="h-8 px-2 bg-amber-500 hover:bg-amber-600 text-xs">
                ✓
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowManualForm(!showManualForm)}
            className="h-8 text-xs"
          >
            <PenLine className="w-3.5 h-3.5 mr-1" />
            {showManualForm ? 'Cancelar' : 'Material avulso'}
          </Button>
        </div>
      )}
    </div>
  );
}
