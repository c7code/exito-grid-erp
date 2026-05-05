import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Truck, Plus, Pencil, Trash2, Search, MapPin, Eye, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { STATUS_MAP, TYPE_MAP, CAT_MAP, SPEC_FIELDS, fmt } from './EquipmentTypes';
import type { SpecField } from './EquipmentTypes';
import DynamicSelect from './DynamicSelect';

interface Props {
  equipment: any[];
  reload: () => void;
}

const defaultForm: Record<string, any> = {
  name: '', description: '', type: 'mobile', category: 'munck', customCategory: '',
  brand: '', model: '', year: '', plate: '', serialNumber: '', chassisNumber: '',
  hourlyRate: '', dailyRate: '', monthlyRate: '', location: '', notes: '',
  specifications: {} as Record<string, any>,
};

export default function EquipmentList({ equipment, reload }: Props) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dlgOpen, setDlgOpen] = useState(false);
  const [viewDlg, setViewDlg] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({ ...defaultForm });
  const [specOpen, setSpecOpen] = useState(true);
  const [viewEq, setViewEq] = useState<any>(null);

  const filtered = equipment.filter(e => {
    const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.code?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || e.category === catFilter;
    return matchSearch && matchCat;
  });

  function openNew() {
    setForm({ ...defaultForm, specifications: {} });
    setEditId(null); setSpecOpen(true); setDlgOpen(true);
  }

  function openEdit(e: any) {
    setEditId(e.id);
    setForm({
      name: e.name || '', description: e.description || '', type: e.type || 'mobile',
      category: e.category || 'munck', customCategory: e.customCategory || '',
      brand: e.brand || '', model: e.model || '', year: e.year || '',
      plate: e.plate || '', serialNumber: e.serialNumber || '',
      chassisNumber: e.chassisNumber || '', hourlyRate: String(e.hourlyRate || ''),
      dailyRate: String(e.dailyRate || ''), monthlyRate: String(e.monthlyRate || ''),
      location: e.location || '', notes: e.notes || '',
      specifications: e.specifications || {},
    });
    setSpecOpen(true); setDlgOpen(true);
  }

  function openView(e: any) {
    setViewEq(e); setViewDlg(true);
  }

  async function save() {
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    try {
      const data = {
        ...form,
        hourlyRate: Number(form.hourlyRate) || 0,
        dailyRate: Number(form.dailyRate) || 0,
        monthlyRate: Number(form.monthlyRate) || 0,
      };
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

  const F = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }));
  const SF = (key: string, val: any) => setForm(prev => ({
    ...prev,
    specifications: { ...prev.specifications, [key]: val },
  }));

  // Get specs for current category
  const currentSpecs: SpecField[] = SPEC_FIELDS[form.category] || SPEC_FIELDS['other'] || [];

  // Active categories for filter
  const activeCats = [...new Set(equipment.map(e => e.category))].filter(Boolean);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {activeCats.map(cat => (
              <SelectItem key={cat} value={cat}>{CAT_MAP[cat] || cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />Novo Equipamento
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(eq => {
          const specs = eq.specifications || {};
          const specFields = SPEC_FIELDS[eq.category] || [];
          // Show up to 3 key specs on card
          const highlights = specFields.slice(0, 3).filter(sf => specs[sf.key]);

          return (
            <Card key={eq.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{eq.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {eq.code} • {CAT_MAP[eq.category] || eq.customCategory || eq.category}
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

                {/* Key specs highlights */}
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {highlights.map(sf => (
                      <Badge key={sf.key} variant="outline" className="text-[10px] text-slate-600 bg-slate-50">
                        {sf.label}: {specs[sf.key]}{sf.unit ? ` ${sf.unit}` : ''}
                      </Badge>
                    ))}
                  </div>
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
                <div className="flex gap-1 mt-3 justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(eq)}>
                    <Eye className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(eq)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => remove(eq.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full p-12 text-center">
            <Truck className="h-14 w-14 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">Nenhum equipamento encontrado</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Novo Equipamento" para cadastrar</p>
          </Card>
        )}
      </div>

      {/* ═══ View Dialog ═══ */}
      <Dialog open={viewDlg} onOpenChange={setViewDlg}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              {viewEq?.name}
              <Badge className={STATUS_MAP[viewEq?.status]?.c || ''}>{STATUS_MAP[viewEq?.status]?.l || viewEq?.status}</Badge>
            </DialogTitle>
          </DialogHeader>
          {viewEq && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-slate-50 rounded-lg">
                <div><span className="text-slate-400">Código:</span> <strong>{viewEq.code}</strong></div>
                <div><span className="text-slate-400">Categoria:</span> {CAT_MAP[viewEq.category] || viewEq.customCategory || viewEq.category}</div>
                <div><span className="text-slate-400">Tipo:</span> {TYPE_MAP[viewEq.type] || viewEq.type}</div>
                <div><span className="text-slate-400">Marca/Modelo:</span> {[viewEq.brand, viewEq.model, viewEq.year].filter(Boolean).join(' ') || '—'}</div>
                {viewEq.plate && <div><span className="text-slate-400">Placa:</span> {viewEq.plate}</div>}
                {viewEq.serialNumber && <div><span className="text-slate-400">Nº Série:</span> {viewEq.serialNumber}</div>}
                {viewEq.chassisNumber && <div><span className="text-slate-400">Chassi:</span> {viewEq.chassisNumber}</div>}
                {viewEq.location && <div><span className="text-slate-400">Localização:</span> {viewEq.location}</div>}
              </div>

              {/* Specs */}
              {viewEq.specifications && Object.keys(viewEq.specifications).length > 0 && (
                <div>
                  <p className="text-xs uppercase font-bold text-orange-600 tracking-wider mb-2">
                    <Settings2 className="h-3.5 w-3.5 inline mr-1" />Especificações Técnicas
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {(SPEC_FIELDS[viewEq.category] || SPEC_FIELDS['other'] || [])
                      .filter(sf => viewEq.specifications[sf.key])
                      .map(sf => (
                        <div key={sf.key} className="flex gap-2 py-1 border-b border-slate-100">
                          <span className="text-slate-400 min-w-[140px]">{sf.label}:</span>
                          <span className="font-medium">{viewEq.specifications[sf.key]}{sf.unit ? ` ${sf.unit}` : ''}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Rates */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'R$/Hora', value: viewEq.hourlyRate },
                  { label: 'R$/Dia', value: viewEq.dailyRate },
                  { label: 'R$/Mês', value: viewEq.monthlyRate },
                ].map(r => (
                  <div key={r.label} className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-emerald-600 uppercase font-semibold">{r.label}</p>
                    <p className="text-lg font-bold text-emerald-700">{fmt(r.value)}</p>
                  </div>
                ))}
              </div>

              {viewEq.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs uppercase font-bold text-amber-600">Observações</p>
                  <p className="text-sm text-amber-800 mt-1">{viewEq.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Create/Edit Dialog ═══ */}
      <Dialog open={dlgOpen} onOpenChange={v => { if (!v) { setDlgOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar' : 'Novo'} Equipamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => F('name', e.target.value)} placeholder="Ex: Munck 12t Madal MD12005" />
              </div>
              <div>
                <Label>Tipo</Label>
                <DynamicSelect
                  group="type"
                  defaultOptions={TYPE_MAP}
                  value={form.type}
                  onValueChange={v => F('type', v)}
                  placeholder="Selecione o tipo"
                />
              </div>
              <div>
                <Label>Categoria *</Label>
                <DynamicSelect
                  group="category"
                  defaultOptions={CAT_MAP}
                  value={form.category}
                  onValueChange={v => { F('category', v); F('specifications', {}); }}
                  placeholder="Selecione a categoria"
                />
              </div>
            </div>

            {/* Vehicle/ID section */}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Marca</Label><Input value={form.brand} onChange={e => F('brand', e.target.value)} placeholder="Ex: Madal, Palfinger" /></div>
              <div><Label>Modelo</Label><Input value={form.model} onChange={e => F('model', e.target.value)} placeholder="Ex: MD 12005" /></div>
              <div><Label>Ano</Label><Input value={form.year} onChange={e => F('year', e.target.value)} placeholder="2024" /></div>
              <div><Label>Placa</Label><Input value={form.plate} onChange={e => F('plate', e.target.value)} placeholder="ABC-1D23" /></div>
              <div><Label>Nº Série</Label><Input value={form.serialNumber} onChange={e => F('serialNumber', e.target.value)} /></div>
              <div><Label>Chassi</Label><Input value={form.chassisNumber} onChange={e => F('chassisNumber', e.target.value)} /></div>
            </div>

            {/* ═══ Specifications Section ═══ */}
            {currentSpecs.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 bg-orange-50/60 hover:bg-orange-50 transition-colors text-left"
                  onClick={() => setSpecOpen(!specOpen)}
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-800">
                      Especificações Técnicas — {CAT_MAP[form.category] || form.customCategory || 'Equipamento'}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {Object.keys(form.specifications || {}).filter(k => form.specifications[k]).length}/{currentSpecs.length}
                    </Badge>
                  </div>
                  {specOpen ? <ChevronUp className="h-4 w-4 text-orange-500" /> : <ChevronDown className="h-4 w-4 text-orange-500" />}
                </button>
                {specOpen && (
                  <div className="grid grid-cols-2 gap-3 p-4">
                    {currentSpecs.map(sf => (
                      <div key={sf.key}>
                        <Label className="text-xs text-slate-600">
                          {sf.label}
                          {sf.unit && <span className="text-slate-400 ml-1">({sf.unit})</span>}
                        </Label>
                        {sf.type === 'select' && sf.options ? (
                          <Select
                            value={form.specifications?.[sf.key] || ''}
                            onValueChange={v => SF(sf.key, v)}
                          >
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                              {sf.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={sf.type === 'number' ? 'number' : 'text'}
                            className="mt-1"
                            value={form.specifications?.[sf.key] || ''}
                            onChange={e => SF(sf.key, e.target.value)}
                            placeholder={sf.label}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rates */}
            <div className="grid grid-cols-3 gap-4">
              <div><Label>R$/Hora</Label><Input type="number" value={form.hourlyRate} onChange={e => F('hourlyRate', e.target.value)} /></div>
              <div><Label>R$/Dia</Label><Input type="number" value={form.dailyRate} onChange={e => F('dailyRate', e.target.value)} /></div>
              <div><Label>R$/Mês</Label><Input type="number" value={form.monthlyRate} onChange={e => F('monthlyRate', e.target.value)} /></div>
            </div>

            <div>
              <Label>Localização</Label>
              <Input value={form.location} onChange={e => F('location', e.target.value)} placeholder="Ex: Pátio sede, Obra XPTO" />
            </div>
            <div>
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
