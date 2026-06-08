import { useState, useRef, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { api } from '@/api';
import { Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

// ─── Props ───
interface CategorySelectProps {
  group: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** If true, use label as the stored value instead of value slug (for backward compat with string[] patterns) */
  useLabelAsValue?: boolean;
  className?: string;
  disabled?: boolean;
}

// ─── Slugify ───
function slugify(str: string): string {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY SELECT
// ═══════════════════════════════════════════════════════════════
export default function CategorySelect({
  group, value, onChange, placeholder = 'Selecione...', useLabelAsValue = false, className = '', disabled = false,
}: CategorySelectProps) {
  const { categories, loading, invalidate } = useCategories(group);
  const [showModal, setShowModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // ─── Get display label ───
  const selectedLabel = (() => {
    if (!value) return '';
    const cat = categories.find(c => useLabelAsValue ? c.label === value : c.value === value);
    return cat?.label || value;
  })();

  // ─── Create new category ───
  async function handleCreate() {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const created = await api.createCategory({
        group,
        label: newLabel.trim(),
        value: slugify(newLabel.trim()),
      });
      invalidate();
      onChange(useLabelAsValue ? created.label : created.value);
      setNewLabel('');
      setShowModal(false);
      setOpen(false);
      toast.success(`Categoria "${newLabel.trim()}" criada!`);
    } catch {
      toast.error('Erro ao criar categoria');
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      {/* ── Custom Select ── */}
      <div ref={containerRef} className={`relative ${className}`}>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm bg-white transition-colors h-10
            ${open ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${!value ? 'text-slate-400' : 'text-slate-800'}`}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {/* Empty option */}
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-50"
              >
                Limpar seleção
              </button>
            )}

            {/* Category options */}
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { onChange(useLabelAsValue ? cat.label : cat.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors
                  ${(useLabelAsValue ? cat.label : cat.value) === value
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Divider + Create */}
            <div className="border-t">
              <button
                type="button"
                onClick={() => { setShowModal(true); setOpen(false); setNewLabel(''); }}
                className="w-full text-left px-3 py-2.5 text-sm text-amber-600 hover:bg-amber-50 font-medium flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Nova categoria
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Criar Categoria ── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-600" />
                Nova Categoria
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Nome da categoria</label>
                <input
                  autoFocus
                  placeholder="Ex: Galpão Logístico"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="button" onClick={handleCreate} disabled={creating || !newLabel.trim()}
                  className="flex-1 px-3 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-md font-medium disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
