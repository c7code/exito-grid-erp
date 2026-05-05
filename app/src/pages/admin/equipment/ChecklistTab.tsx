import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ClipboardCheck, CheckCircle2, XCircle, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { fD } from './EquipmentTypes';

interface Props {
  checklists: any[];
  equipment: any[];
  rentals: any[];
  reload: () => void;
}

const CL_STATUS: Record<string, { l: string; c: string }> = {
  pending: { l: 'Pendente', c: 'bg-yellow-100 text-yellow-800' },
  completed: { l: 'Concluído', c: 'bg-green-100 text-green-800' },
};

const CL_TYPE: Record<string, string> = { departure: 'Saída', return: 'Retorno' };
const FUEL_LEVELS = ['empty', '1/4', '1/2', '3/4', 'full'];
const FUEL_LABELS: Record<string, string> = { empty: 'Vazio', '1/4': '1/4', '1/2': '1/2', '3/4': '3/4', full: 'Cheio' };

const DEFAULT_ITEMS = [
  { category: 'Estrutural', items: ['Cabine', 'Chassi', 'Lança/Braço', 'Estabilizadores', 'Pintura/Adesivos'] },
  { category: 'Mecânica', items: ['Motor', 'Transmissão', 'Freios', 'Pneus', 'Suspensão'] },
  { category: 'Hidráulica', items: ['Mangueiras', 'Cilindros', 'Bomba Hidráulica', 'Nível do Óleo'] },
  { category: 'Elétrica', items: ['Faróis', 'Lanternas', 'Buzina', 'Painel de Instrumentos'] },
  { category: 'Segurança', items: ['Extintor', 'Triângulo', 'Cinto de Segurança', 'EPI'] },
  { category: 'Documentos', items: ['CRLV', 'Seguro', 'ART', 'Certificado de Inspeção'] },
];

export default function ChecklistTab({ checklists, equipment, rentals, reload }: Props) {
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewDlg, setViewDlg] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    rentalId: '', equipmentId: '', type: 'departure' as string,
    inspectorName: '', odometerReading: '', fuelLevel: '1/2',
    generalNotes: '',
  });
  const [checkItems, setCheckItems] = useState<Array<{ item: string; category: string; ok: boolean; observations?: string }>>(
    DEFAULT_ITEMS.flatMap(g => g.items.map(item => ({ item, category: g.category, ok: true })))
  );

  const F = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  function toggleItem(idx: number) {
    setCheckItems(prev => prev.map((it, i) => i === idx ? { ...it, ok: !it.ok } : it));
  }

  function setItemObs(idx: number, obs: string) {
    setCheckItems(prev => prev.map((it, i) => i === idx ? { ...it, observations: obs } : it));
  }

  function onRentalChange(rentalId: string) {
    const rental = rentals.find(r => r.id === rentalId);
    setForm(prev => ({ ...prev, rentalId, equipmentId: rental?.equipmentId || '' }));
  }

  async function save() {
    if (!form.equipmentId) { toast.error('Selecione equipamento ou locação'); return; }
    try {
      const data = {
        ...form,
        odometerReading: Number(form.odometerReading) || null,
        items: checkItems,
        status: 'completed',
        inspectedAt: new Date().toISOString(),
      };
      if (editId) {
        await api.updateEquipmentChecklist(editId, data);
        toast.success('Vistoria atualizada!');
      } else {
        await api.createEquipmentChecklist(data);
        toast.success('Vistoria registrada!');
      }
      setDlgOpen(false); setEditId(null); reload();
    } catch { toast.error('Erro ao salvar vistoria'); }
  }

  function openEdit(cl: any) {
    setEditId(cl.id);
    setForm({
      rentalId: cl.rentalId || '', equipmentId: cl.equipmentId || '',
      type: cl.type || 'departure', inspectorName: cl.inspectorName || '',
      odometerReading: String(cl.odometerReading || ''), fuelLevel: cl.fuelLevel || '1/2',
      generalNotes: cl.generalNotes || '',
    });
    if (cl.items?.length) {
      setCheckItems(cl.items.map((it: any) => ({ item: it.item, category: it.category, ok: it.ok, observations: it.observations })));
    } else {
      setCheckItems(DEFAULT_ITEMS.flatMap(g => g.items.map(item => ({ item, category: g.category, ok: true }))));
    }
    setDlgOpen(true);
  }

  async function removeChecklist(id: string) {
    if (!confirm('Excluir esta vistoria?')) return;
    try {
      await api.updateEquipmentChecklist(id, { status: 'cancelled' } as any);
      toast.success('Vistoria excluída');
      reload();
    } catch { toast.error('Erro ao excluir'); }
  }

  // Group items by category for display
  const groupByCategory = (items: any[]) => {
    return items.reduce((acc: Record<string, any[]>, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{checklists.length} vistoria(s)</p>
        <Button onClick={() => {
          setCheckItems(DEFAULT_ITEMS.flatMap(g => g.items.map(item => ({ item, category: g.category, ok: true }))));
          setForm({ rentalId: '', equipmentId: '', type: 'departure', inspectorName: '', odometerReading: '', fuelLevel: '1/2', generalNotes: '' });
          setDlgOpen(true);
        }} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />Nova Vistoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checklists.map(cl => {
          const items = cl.items || [];
          const okCount = items.filter((i: any) => i.ok).length;
          const totalCount = items.length;
          const pct = totalCount > 0 ? Math.round((okCount / totalCount) * 100) : 0;

          return (
            <Card key={cl.id} className="hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="cursor-pointer flex-1" onClick={() => { setSelected(cl); setViewDlg(true); }}>
                    <div className="flex items-center gap-2">
                      <Badge className={CL_STATUS[cl.status]?.c || ''}>{CL_STATUS[cl.status]?.l || cl.status}</Badge>
                      <Badge variant="outline" className="text-xs">{CL_TYPE[cl.type] || cl.type}</Badge>
                    </div>
                    <p className="font-semibold text-sm mt-1.5">{cl.equipment?.name || '—'}</p>
                    {cl.rental && <p className="text-xs text-muted-foreground">Locação: {cl.rental.code}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelected(cl); setViewDlg(true); }}>
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(cl); }}>
                      <Pencil className="h-3.5 w-3.5 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); removeChecklist(cl.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{okCount}/{totalCount}</span>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>{cl.inspectorName || 'Sem inspetor'}</span>
                  <span>{fD(cl.inspectedAt || cl.createdAt)}</span>
                </div>
                {cl.odometerReading && <p className="text-xs text-slate-400 mt-1">Odômetro: {Number(cl.odometerReading).toLocaleString('pt-BR')} km</p>}
                {cl.fuelLevel && <p className="text-xs text-slate-400">Combustível: {FUEL_LABELS[cl.fuelLevel] || cl.fuelLevel}</p>}
              </div>
            </Card>
          );
        })}
        {checklists.length === 0 && (
          <Card className="col-span-full p-12 text-center">
            <ClipboardCheck className="h-14 w-14 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">Nenhuma vistoria registrada</p>
            <p className="text-sm text-slate-400 mt-1">Vistorias de saída e retorno de equipamentos</p>
          </Card>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDlg} onOpenChange={setViewDlg}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-teal-500" />
              Vistoria — {selected?.equipment?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg text-sm">
                <div><span className="text-slate-400">Tipo:</span> {CL_TYPE[selected.type] || selected.type}</div>
                <div><span className="text-slate-400">Data:</span> {fD(selected.inspectedAt || selected.createdAt)}</div>
                <div><span className="text-slate-400">Inspetor:</span> {selected.inspectorName || '—'}</div>
                <div><span className="text-slate-400">Combustível:</span> {FUEL_LABELS[selected.fuelLevel] || '—'}</div>
                {selected.odometerReading && <div><span className="text-slate-400">Odômetro:</span> {Number(selected.odometerReading).toLocaleString('pt-BR')} km</div>}
              </div>

              {selected.items?.length > 0 && Object.entries(groupByCategory(selected.items)).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">{cat}</p>
                  <div className="space-y-1">
                    {(items as any[]).map((it, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm py-1">
                        {it.ok ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                        <span className={it.ok ? 'text-slate-700' : 'text-red-700 font-medium'}>{it.item}</span>
                        {it.observations && <span className="text-xs text-slate-400 ml-auto">({it.observations})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {selected.generalNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs uppercase font-bold text-amber-600">Observações Gerais</p>
                  <p className="text-sm text-amber-800 mt-1">{selected.generalNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dlgOpen} onOpenChange={v => { if (!v) { setDlgOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nova'} Vistoria de Equipamento</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Locação (opcional)</Label>
                <Select value={form.rentalId} onValueChange={onRentalChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{rentals.map(r => <SelectItem key={r.id} value={r.id}>{r.code} - {r.equipment?.name || ''}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipamento *</Label>
                <Select value={form.equipmentId} onValueChange={v => F('equipmentId', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.code} - {e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => F('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departure">Saída</SelectItem>
                    <SelectItem value="return">Retorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Inspetor</Label><Input value={form.inspectorName} onChange={e => F('inspectorName', e.target.value)} /></div>
              <div><Label>Odômetro (km)</Label><Input type="number" value={form.odometerReading} onChange={e => F('odometerReading', e.target.value)} /></div>
            </div>
            <div>
              <Label>Nível de Combustível</Label>
              <Select value={form.fuelLevel} onValueChange={v => F('fuelLevel', v)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{FUEL_LEVELS.map(f => <SelectItem key={f} value={f}>{FUEL_LABELS[f]}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Checklist Items */}
            <div className="border rounded-lg p-4 space-y-4">
              <p className="text-sm font-semibold text-slate-700">Itens de Vistoria</p>
              {Object.entries(groupByCategory(checkItems)).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1.5">{cat}</p>
                  <div className="space-y-1.5">
                    {(items as any[]).map((it) => {
                      const idx = checkItems.findIndex(ci => ci.item === it.item && ci.category === it.category);
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <Checkbox checked={it.ok} onCheckedChange={() => toggleItem(idx)} />
                          <span className="text-sm flex-1">{it.item}</span>
                          <Input className="w-40 h-7 text-xs" placeholder="Obs..."
                            value={it.observations || ''} onChange={e => setItemObs(idx, e.target.value)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div><Label>Observações Gerais</Label><Textarea value={form.generalNotes} onChange={e => F('generalNotes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDlgOpen(false); setEditId(null); }}>Cancelar</Button>
            <Button onClick={save} className="bg-teal-600 hover:bg-teal-700 text-white">{editId ? 'Salvar' : 'Registrar Vistoria'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
