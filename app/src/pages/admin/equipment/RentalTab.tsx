import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, FileText, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { RENT_STATUS, fmt, fD } from './EquipmentTypes';

interface Props {
  rentals: any[];
  equipment: any[];
  clients: any[];
  employees: any[];
  reload: () => void;
}

const defaultForm = {
  equipmentId: '', clientId: '', operatorId: '', operatorName: '',
  rentalType: 'with_operator', billingType: 'daily', unitRate: '', quantity: '1',
  startDate: '', endDate: '', deliveryAddress: '', deliveryCity: '', deliveryState: '', notes: '',
};

export default function RentalTab({ rentals, equipment, clients, employees, reload }: Props) {
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const F = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  function openNew() { setForm({ ...defaultForm }); setEditId(null); setDlgOpen(true); }

  function openEdit(r: any) {
    setEditId(r.id);
    setForm({
      equipmentId: r.equipmentId || '', clientId: r.clientId || '',
      operatorId: r.operatorId || '', operatorName: r.operatorName || '',
      rentalType: r.rentalType || 'with_operator', billingType: r.billingType || 'daily',
      unitRate: String(r.unitRate || ''), quantity: String(r.quantity || '1'),
      startDate: r.startDate ? r.startDate.substring(0, 10) : '',
      endDate: r.endDate ? r.endDate.substring(0, 10) : '',
      deliveryAddress: r.deliveryAddress || '', deliveryCity: r.deliveryCity || '',
      deliveryState: r.deliveryState || '', notes: r.notes || '',
    });
    setDlgOpen(true);
  }

  async function save() {
    if (!form.equipmentId) { toast.error('Selecione o equipamento'); return; }
    try {
      const tv = Number(form.unitRate || 0) * Number(form.quantity || 1);
      const data = { ...form, unitRate: Number(form.unitRate) || 0, quantity: Number(form.quantity) || 1, totalValue: tv };
      if (editId) {
        await api.updateEquipmentRental(editId, data);
        toast.success('Locação atualizada!');
      } else {
        await api.createEquipmentRental({ ...data, status: 'draft' });
        toast.success('Locação criada!');
      }
      setDlgOpen(false); setEditId(null); reload();
    } catch { toast.error('Erro ao salvar locação'); }
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta locação?')) return;
    try { await api.deleteEquipmentRental(id); toast.success('Locação excluída'); reload(); }
    catch { toast.error('Erro ao excluir'); }
  }

  async function updateStatus(id: string, status: string) {
    try { await api.updateEquipmentRentalStatus(id, status); toast.success('Status atualizado!'); reload(); }
    catch { toast.error('Erro ao atualizar status'); }
  }

  const statusActions: Record<string, { label: string; next: string }> = {
    draft: { label: 'Confirmar', next: 'confirmed' },
    confirmed: { label: 'Ativar', next: 'active' },
    active: { label: 'Concluir', next: 'completed' },
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{rentals.length} locação(ões)</p>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />Nova Locação
        </Button>
      </div>

      <Card>
        <div className="divide-y">
          {rentals.map(r => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-slate-800">{r.code}</span>
                  <Badge className={RENT_STATUS[r.status]?.c || ''}>{RENT_STATUS[r.status]?.l || r.status}</Badge>
                  <Badge variant="outline" className="text-xs">{r.rentalType === 'with_operator' ? 'Com Operador' : 'Sem Operador'}</Badge>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{r.equipment?.name || '—'}</p>
                <p className="text-xs text-muted-foreground">{r.client?.name || 'Sem cliente'} • {fD(r.startDate)} a {fD(r.endDate)}</p>
                {r.deliveryCity && <p className="text-xs text-slate-400 mt-0.5">📍 {r.deliveryCity}{r.deliveryState ? ` / ${r.deliveryState}` : ''}</p>}
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-lg font-bold text-slate-800">{fmt(r.totalValue)}</p>
                <div className="flex gap-1 justify-end items-center">
                  {statusActions[r.status] && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, statusActions[r.status].next)}>
                      {statusActions[r.status].label}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {rentals.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium">Nenhuma locação registrada</p>
            </div>
          )}
        </div>
      </Card>

      {/* Dialog */}
      <Dialog open={dlgOpen} onOpenChange={v => { if (!v) { setDlgOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nova'} Locação</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label>Equipamento *</Label>
              <Select value={form.equipmentId} onValueChange={v => F('equipmentId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{(editId ? equipment : equipment.filter(e => e.status === 'available')).map(e => <SelectItem key={e.id} value={e.id}>{e.code} - {e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={form.clientId} onValueChange={v => F('clientId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Locação</Label>
              <Select value={form.rentalType} onValueChange={v => F('rentalType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="with_operator">Com Operador</SelectItem>
                  <SelectItem value="without_operator">Sem Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.rentalType === 'with_operator' && (
              <div>
                <Label>Operador</Label>
                <Select value={form.operatorId} onValueChange={v => { const em = employees.find(e => e.id === v); F('operatorId', v); setForm(prev => ({ ...prev, operatorName: em?.name || '' })); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Faturamento</Label>
              <Select value={form.billingType} onValueChange={v => F('billingType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Por Hora</SelectItem>
                  <SelectItem value="daily">Por Dia</SelectItem>
                  <SelectItem value="monthly">Por Mês</SelectItem>
                  <SelectItem value="fixed">Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Unitário (R$)</Label><Input type="number" value={form.unitRate} onChange={e => F('unitRate', e.target.value)} /></div>
            <div><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={e => F('quantity', e.target.value)} /></div>
            <div className="flex items-end pb-2">
              <p className="text-sm font-semibold text-slate-700">Total: {fmt(Number(form.unitRate || 0) * Number(form.quantity || 1))}</p>
            </div>
            <div><Label>Data Início</Label><Input type="date" value={form.startDate} onChange={e => F('startDate', e.target.value)} /></div>
            <div><Label>Data Fim</Label><Input type="date" value={form.endDate} onChange={e => F('endDate', e.target.value)} /></div>
            <div className="col-span-2"><Label>Endereço de Entrega</Label><Input value={form.deliveryAddress} onChange={e => F('deliveryAddress', e.target.value)} /></div>
            <div><Label>Cidade</Label><Input value={form.deliveryCity} onChange={e => F('deliveryCity', e.target.value)} /></div>
            <div><Label>Estado</Label><Input value={form.deliveryState} onChange={e => F('deliveryState', e.target.value)} /></div>
            <div className="col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => F('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDlgOpen(false); setEditId(null); }}>Cancelar</Button>
            <Button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white">{editId ? 'Salvar' : 'Criar Locação'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
