import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface DynamicSelectProps {
  group: string; // 'category' | 'service_type' | 'document_category'
  defaultOptions: Record<string, string>; // hardcoded options (without "Outro")
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DynamicSelect({ group, defaultOptions, value, onValueChange, placeholder, className }: DynamicSelectProps) {
  const [customOptions, setCustomOptions] = useState<{ id: string; key: string; label: string }[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getEquipmentOptions(group).then(setCustomOptions).catch(() => {});
  }, [group]);

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      const created = await api.createEquipmentOption({ group, label: newLabel.trim() });
      setCustomOptions(prev => [...prev, created]);
      onValueChange(created.key);
      setNewLabel('');
      setAdding(false);
      toast.success(`"${created.label}" adicionado!`);
    } catch { toast.error('Erro ao adicionar opção'); }
    setSaving(false);
  }

  // Merge all options
  const allOptions = { ...defaultOptions };
  customOptions.forEach(opt => { allOptions[opt.key] = opt.label; });

  return (
    <div className={className}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger><SelectValue placeholder={placeholder || 'Selecione...'} /></SelectTrigger>
        <SelectContent>
          {Object.entries(defaultOptions).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
          {customOptions.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t mt-1 pt-2">Personalizados</div>
              {customOptions.map(opt => (
                <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
              ))}
            </>
          )}
          <div className="border-t mt-1 pt-1 px-1 pb-1">
            {adding ? (
              <div className="flex items-center gap-1">
                <Input
                  autoFocus
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Nova opção..."
                  className="h-7 text-xs"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleAdd(); } if (e.key === 'Escape') setAdding(false); }}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleAdd} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 text-green-600" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setAdding(false); setNewLabel(''); }}>
                  <X className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors font-medium"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAdding(true); }}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar opção
              </button>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

/** Helper to resolve a key to its label, checking both default and custom options */
export function resolveOptionLabel(key: string, defaultOptions: Record<string, string>, customOptions: { key: string; label: string }[]): string {
  if (defaultOptions[key]) return defaultOptions[key];
  const custom = customOptions.find(o => o.key === key);
  return custom?.label || key;
}
