import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Truck, Plus, Pencil, Trash2, Search, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { STATUS_MAP, CAT_MAP, fmt } from './EquipmentTypes';

interface Props {
  equipment: any[];
  reload: () => void;
}

const defaultForm = {
  name: '', description: '', type: 'mobile', category: 'munck',
  brand: '', model: '', year: '', plate: '', serialNumber: '', chassisNumber: '',
  hourlyRate: '', dailyRate: '', monthlyRate: '', location: '', notes: '',
};

export default function EquipmentList({ equipment, reload }: Props) {
  const [search, setSearch] = useState('');
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filtered = equipment.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.code?.toLowerCase().includes(search.toLowerCase())
  );

  function openNew() { setForm({ ...defaultForm }); setEditId(null); setDlgOpen(true); }

  function openEdit(e: any) {
    setEditId(e.id);
    setForm({
      name: e.name || '', description: e.description || '', type: e.type || 'mobile',
      category: e.category || 'munck', brand: e.brand || '', model: e.model || '',
      year: e.year || '', plate: e.plate || '', serialNumber: e.serialNumber || '',
      chassisNumber: e.chassisNumber || '', hourlyRate: String(e.hourlyRate || ''),
      dailyRate: String(e.dailyRate || ''), monthlyRate: String(e.monthlyRate || ''),
      location: e.location || '', notes: e.notes || '',
    });
    setDlgOpen(true);
  }

  async function save() {
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    try {
      const data = { ...form, hourlyRate: Number(form.hourlyRate) || 0, dailyRate: Number(form.dailyRate) || 0, monthlyRate: Number(form.monthlyRate) || 0 };
      if (editId) await api.updateEquipment(editId, data);
      else await api.createEquipment(data);
      toast.success(editId ? 'Equipamento atualizado!' : 'Equipamento cadastrado!');
      setDlgOpen(false); setEditId(null); reload();
    } catch { toast.error('Erro ao salvar equipamento'); }
  }

  async function remove(id: string) {
    if (!confirm('Excluir este equipamento?')) return;
    try { await api.deleteEquipment(id); toast.success('Equipamento excluído'); reload(); }
    catch { toast.error('Erro ao excluir'); }
  }

  const F = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />Novo Equipamento
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(eq => (
          <Card key={eq.id} className="hover:shadow-lg transition-all duration-200 group">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">{eq.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {eq.code} • {CAT_MAP[eq.category] || eq.category}
                  </p>
                </div>
                <Badge className={STATUS_MAP[eq.status]?.c || 'bg-gray-100 text-gray-600'}>
                  {STATUS_MAP[eq.status]?.l || eq.status}
                </Badge>
              </div>

              {(eq.brand || eq.model) && (
                <p className="text-sm text-slate-500 mb-1">
                  {[eq.brand, eq.model, eq.year].filter(Boolean).join(' ')}
                </p>
              )}
              {eq.plate && <p className="text-xs text-slate-500">Placa: <span className="font-medium">{eq.plate}</span></p>}
              {eq.location && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{eq.location}
                </p>
              )}

              {/* Rates */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: 'Hora', value: eq.hourlyRate },
                  { label: 'Dia', value: eq.dailyRate },
                  { label: 'Mês', value: eq.monthlyRate },
                ].map(r => (
                  <div key={r.label} className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{r.label}</p>
                    <p className="text-sm font-semibold text-slate-700">{fmt(r.value)}</p>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span>{eq.totalRentals || 0} locações</span>
                <span>•</span>
                <span>{Number(eq.totalHoursUsed || 0).toFixed(0)}h trabalhadas</span>
              </div>

              {/* Actions */}
              <div className="flex gap-1 mt-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(eq)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => remove(eq.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full p-12 text-center">
            <Truck className="h-14 w-14 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">Nenhum equipamento encontrado</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Novo Equipamento" para cadastrar</p>
          </Card>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dlgOpen} onOpenChange={v => { if (!v) { setDlgOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar' : 'Novo'} Equipamento</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => F('name', e.target.value)} placeholder="Ex: Munck 12t Madal" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => F('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">Móvel</SelectItem>
                  <SelectItem value="stationary">Estacionário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => F('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CAT_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Marca</Label><Input value={form.brand} onChange={e => F('brand', e.target.value)} /></div>
            <div><Label>Modelo</Label><Input value={form.model} onChange={e => F('model', e.target.value)} /></div>
            <div><Label>Ano</Label><Input value={form.year} onChange={e => F('year', e.target.value)} /></div>
            <div><Label>Placa</Label><Input value={form.plate} onChange={e => F('plate', e.target.value)} /></div>
            <div><Label>Nº Série</Label><Input value={form.serialNumber} onChange={e => F('serialNumber', e.target.value)} /></div>
            <div><Label>Chassi</Label><Input value={form.chassisNumber} onChange={e => F('chassisNumber', e.target.value)} /></div>
            <div><Label>R$/Hora</Label><Input type="number" value={form.hourlyRate} onChange={e => F('hourlyRate', e.target.value)} /></div>
            <div><Label>R$/Dia</Label><Input type="number" value={form.dailyRate} onChange={e => F('dailyRate', e.target.value)} /></div>
            <div><Label>R$/Mês</Label><Input type="number" value={form.monthlyRate} onChange={e => F('monthlyRate', e.target.value)} /></div>
            <div><Label>Localização</Label><Input value={form.location} onChange={e => F('location', e.target.value)} /></div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => F('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDlgOpen(false); setEditId(null); }}>Cancelar</Button>
            <Button onClick={save} className="bg-orange-500 hover:bg-orange-600 text-white">{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
