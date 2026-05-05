import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Clock, Receipt, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { DAILY_STATUS, fmt, fD } from './EquipmentTypes';

interface Props {
  dailyLogs: any[];
  rentals: any[];
  equipment: any[];
  employees: any[];
  reload: () => void;
}

const defaultForm = {
  rentalId: '', equipmentId: '', operatorId: '', operatorName: '',
  date: '', hoursWorked: '', dailyRate: '', description: '',
};

export default function DailyLogTab({ dailyLogs, rentals, equipment: _equipment, employees, reload }: Props) {
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const F = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  const activeRentals = rentals.filter(r => r.status === 'active');

  function openNew() { setForm({ ...defaultForm }); setEditId(null); setDlgOpen(true); }

  function openEdit(log: any) {
    setEditId(log.id);
    setForm({
      rentalId: log.rentalId || '', equipmentId: log.equipmentId || '',
      operatorId: log.operatorId || '', operatorName: log.operatorName || '',
      date: log.date ? log.date.substring(0, 10) : '',
      hoursWorked: String(log.hoursWorked || ''), dailyRate: String(log.dailyRate || ''),
      description: log.description || '',
    });
    setDlgOpen(true);
  }

  function onRentalChange(rentalId: string) {
    const rental = rentals.find(r => r.id === rentalId);
    setForm(prev => ({
      ...prev,
      rentalId,
      equipmentId: rental?.equipmentId || '',
      operatorId: rental?.operatorId || '',
      operatorName: rental?.operatorName || '',
      dailyRate: String(rental?.unitRate || rental?.equipment?.dailyRate || ''),
    }));
  }

  async function save() {
    if (!form.rentalId || !form.date) { toast.error('Locação e data são obrigatórios'); return; }
    try {
      const data = {
        ...form,
        hoursWorked: Number(form.hoursWorked) || 8,
        dailyRate: Number(form.dailyRate) || 0,
      };
      if (editId) {
        await api.updateEquipmentDailyLog(editId, data);
        toast.success('Diária atualizada!');
      } else {
        await api.createEquipmentDailyLog(data);
        toast.success('Diária registrada!');
      }
      setDlgOpen(false); setEditId(null); reload();
    } catch { toast.error('Erro ao salvar diária'); }
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta diária?')) return;
    try { await api.deleteEquipmentDailyLog(id); toast.success('Diária excluída'); reload(); }
    catch { toast.error('Erro ao excluir'); }
  }

  async function billRental(rentalId: string) {
    try {
      const result = await api.billEquipmentDailyLogs(rentalId);
      toast.success(`${result.count} diária(s) faturada(s) — ${fmt(result.totalValue)}`);
      reload();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao faturar'); }
  }

  // Group by rental
  const grouped = dailyLogs.reduce((acc: Record<string, any[]>, log) => {
    const key = log.rentalId || 'sem-locacao';
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const unbilledByRental = (rentalId: string) =>
    dailyLogs.filter(d => d.rentalId === rentalId && d.status === 'registered').length;

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{dailyLogs.length} diária(s) registrada(s)</p>
        <Button onClick={openNew} className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />Nova Diária
        </Button>
      </div>

      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([rentalId, logs]) => {
            const rental = rentals.find(r => r.id === rentalId);
            const unbilled = unbilledByRental(rentalId);
            const totalValue = (logs as any[]).reduce((s, l) => s + Number(l.totalValue || 0), 0);

            return (
              <Card key={rentalId} className="overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">
                      {rental?.code || 'Sem locação'} — {rental?.equipment?.name || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">{rental?.client?.name || ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">{fmt(totalValue)}</span>
                    {unbilled > 0 && (
                      <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => billRental(rentalId)}>
                        <Receipt className="h-3.5 w-3.5 mr-1" />Faturar ({unbilled})
                      </Button>
                    )}
                  </div>
                </div>

                <div className="divide-y">
                  {(logs as any[]).map(log => (
                    <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/30 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{fD(log.date)}</span>
                          <Badge className={DAILY_STATUS[log.status]?.c || ''}>
                            {DAILY_STATUS[log.status]?.l || log.status}
                          </Badge>
                        </div>
                        {log.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{log.description}</p>}
                        {log.operatorName && <p className="text-xs text-slate-400">Operador: {log.operatorName}</p>}
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />{Number(log.hoursWorked || 0)}h
                        </p>
                        <p className="text-sm font-semibold">{fmt(log.totalValue)}</p>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(log)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {log.status === 'registered' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove(log.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Clock className="h-14 w-14 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">Nenhuma diária registrada</p>
          <p className="text-sm text-slate-400 mt-1">Registre diárias das locações ativas</p>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dlgOpen} onOpenChange={v => { if (!v) { setDlgOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Registrar'} Diária</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Locação Ativa *</Label>
              <Select value={form.rentalId} onValueChange={onRentalChange}>
                <SelectTrigger><SelectValue placeholder="Selecione a locação..." /></SelectTrigger>
                <SelectContent>
                  {(editId ? rentals : activeRentals).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.code} - {r.equipment?.name || '—'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data *</Label><Input type="date" value={form.date} onChange={e => F('date', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Horas Trabalhadas</Label><Input type="number" value={form.hoursWorked} onChange={e => F('hoursWorked', e.target.value)} placeholder="8" /></div>
              <div><Label>Valor Diária (R$)</Label><Input type="number" value={form.dailyRate} onChange={e => F('dailyRate', e.target.value)} /></div>
            </div>
            <div>
              <Label>Operador</Label>
              <Select value={form.operatorId} onValueChange={v => { const em = employees.find(e => e.id === v); setForm(prev => ({ ...prev, operatorId: v, operatorName: em?.name || '' })); }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => F('description', e.target.value)} rows={2} placeholder="Atividades realizadas..." /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDlgOpen(false); setEditId(null); }}>Cancelar</Button>
            <Button onClick={save} className="bg-cyan-600 hover:bg-cyan-700 text-white">{editId ? 'Salvar' : 'Registrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
