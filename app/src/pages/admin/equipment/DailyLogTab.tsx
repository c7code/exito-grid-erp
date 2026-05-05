import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Clock, Pencil, Trash2, Moon, Sun, Calendar, MapPin, DollarSign, CheckCircle2 } from 'lucide-react';
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

const defaultForm: Record<string, any> = {
  rentalId: '', equipmentId: '', operatorId: '', operatorName: '',
  date: '', startTime: '', endTime: '',
  normalHours: '', overtimeHours: '0', nightHours: '0',
  isHoliday: false, isWeekend: false,
  dailyRate: '', description: '', workLocation: '',
};

export default function DailyLogTab({ dailyLogs, rentals, reload }: Props) {
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({ ...defaultForm });

  const F = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }));

  function openNew() { setForm({ ...defaultForm }); setEditId(null); setDlgOpen(true); }

  function openEdit(log: any) {
    setEditId(log.id);
    setForm({
      rentalId: log.rentalId || '', equipmentId: log.equipmentId || '',
      operatorId: log.operatorId || '', operatorName: log.operatorName || '',
      date: log.date ? String(log.date).substring(0, 10) : '',
      startTime: log.startTime || '', endTime: log.endTime || '',
      normalHours: String(log.normalHours || log.hoursWorked || ''),
      overtimeHours: String(log.overtimeHours || '0'),
      nightHours: String(log.nightHours || '0'),
      isHoliday: log.isHoliday || false, isWeekend: log.isWeekend || false,
      dailyRate: String(log.dailyRate || ''), description: log.description || '',
      workLocation: log.workLocation || '',
    });
    setDlgOpen(true);
  }

  function onRentalSelect(rentalId: string) {
    const r = rentals.find((rt: any) => rt.id === rentalId);
    F('rentalId', rentalId);
    if (r) {
      setForm(prev => ({
        ...prev,
        rentalId,
        equipmentId: r.equipmentId || prev.equipmentId,
        operatorId: r.operatorId || prev.operatorId,
        operatorName: r.operatorName || prev.operatorName,
        dailyRate: String(r.unitRate || prev.dailyRate),
        normalHours: String(r.contractedHoursPerDay || '8'),
      }));
    }
  }

  // Auto-detect weekend from date
  function onDateChange(dateStr: string) {
    F('date', dateStr);
    if (dateStr) {
      const d = new Date(dateStr + 'T12:00:00');
      const day = d.getDay();
      F('isWeekend', day === 0 || day === 6);
    }
  }

  async function save() {
    if (!form.rentalId || !form.date) { toast.error('Selecione a locação e a data'); return; }
    try {
      const data = {
        ...form,
        hoursWorked: Number(form.normalHours || 0) + Number(form.overtimeHours || 0),
        normalHours: Number(form.normalHours || 0),
        overtimeHours: Number(form.overtimeHours || 0),
        nightHours: Number(form.nightHours || 0),
        dailyRate: Number(form.dailyRate || 0),
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
    try { const r = await api.billEquipmentDailyLogs(rentalId); toast.success(`${r.count} diária(s) faturada(s): ${fmt(r.totalValue)}`); reload(); }
    catch { toast.error('Erro ao faturar'); }
  }

  // Group by rental
  const grouped = rentals.map((r: any) => ({
    rental: r,
    logs: dailyLogs.filter((d: any) => d.rentalId === r.id),
  })).filter(g => g.logs.length > 0);

  const unlinked = dailyLogs.filter((d: any) => !rentals.find((r: any) => r.id === d.rentalId));

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{dailyLogs.length} diária(s) registrada(s)</p>
        <Button onClick={openNew} className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />Registrar Diária
        </Button>
      </div>

      {grouped.map(({ rental, logs }) => (
        <Card key={rental.id} className="overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm">{rental.code}</span>
              <span className="text-slate-500 text-xs ml-2">{rental.equipment?.name || ''}</span>
              <span className="text-slate-400 text-xs ml-2">({rental.client?.name || 'Sem cliente'})</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-emerald-700 font-semibold">
                {fmt(logs.reduce((s: number, d: any) => s + Number(d.totalValue || 0), 0))}
              </span>
              {logs.some((d: any) => d.status === 'registered') && (
                <Button size="sm" variant="outline" onClick={() => billRental(rental.id)}>
                  <DollarSign className="h-3.5 w-3.5 mr-1" />Faturar
                </Button>
              )}
            </div>
          </div>
          <div className="divide-y">
            {logs.map((d: any) => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{fD(d.date)}</span>
                    <Badge className={DAILY_STATUS[d.status]?.c || ''}>{DAILY_STATUS[d.status]?.l || d.status}</Badge>
                    {d.startTime && d.endTime && (
                      <span className="text-xs text-slate-500">{d.startTime} - {d.endTime}</span>
                    )}
                    {Number(d.overtimeHours || 0) > 0 && <Badge variant="outline" className="text-xs text-orange-600 border-orange-300"><Clock className="h-3 w-3 mr-0.5" />{d.overtimeHours}h extra</Badge>}
                    {Number(d.nightHours || 0) > 0 && <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-300"><Moon className="h-3 w-3 mr-0.5" />{d.nightHours}h not.</Badge>}
                    {d.isHoliday && <Badge variant="outline" className="text-xs text-red-600 border-red-300"><Calendar className="h-3 w-3 mr-0.5" />Feriado</Badge>}
                    {d.isWeekend && !d.isHoliday && <Badge variant="outline" className="text-xs text-purple-600 border-purple-300"><Sun className="h-3 w-3 mr-0.5" />F.Semana</Badge>}
                    {d.clientApproval === 'approved' && <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="h-3 w-3 mr-0.5" />Aprovado</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {d.operatorName || '—'} • {Number(d.normalHours || d.hoursWorked || 0)}h normal
                    {d.workLocation && <><MapPin className="h-3 w-3 inline ml-2 mr-0.5" />{d.workLocation}</>}
                  </p>
                  {d.description && <p className="text-xs text-slate-400 truncate">{d.description}</p>}
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-sm font-bold text-slate-800">{fmt(d.totalValue)}</p>
                  {(Number(d.overtimeValue || 0) > 0 || Number(d.nightValue || 0) > 0 || Number(d.holidayValue || 0) > 0) && (
                    <div className="text-[10px] text-slate-400 space-y-0">
                      {Number(d.normalValue || 0) > 0 && <div>Normal: {fmt(d.normalValue)}</div>}
                      {Number(d.overtimeValue || 0) > 0 && <div className="text-orange-500">Extra: {fmt(d.overtimeValue)}</div>}
                      {Number(d.nightValue || 0) > 0 && <div className="text-indigo-500">Noturno: {fmt(d.nightValue)}</div>}
                      {Number(d.holidayValue || 0) > 0 && <div className="text-red-500">Feriado: {fmt(d.holidayValue)}</div>}
                      {Number(d.weekendValue || 0) > 0 && <div className="text-purple-500">F.Sem: {fmt(d.weekendValue)}</div>}
                    </div>
                  )}
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => openEdit(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {d.status === 'registered' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100" onClick={() => remove(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {unlinked.length > 0 && (
        <Card>
          <div className="bg-slate-50 px-5 py-3 border-b"><span className="font-semibold text-sm text-slate-500">Sem locação vinculada</span></div>
          <div className="divide-y">
            {unlinked.map((d: any) => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-3 group">
                <div className="flex-1"><span className="text-sm">{fD(d.date)}</span> <span className="text-xs text-slate-400">{d.description || '—'}</span></div>
                <span className="text-sm font-semibold">{fmt(d.totalValue)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {dailyLogs.length === 0 && (
        <Card className="p-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">Nenhuma diária registrada</p>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dlgOpen} onOpenChange={v => { if (!v) { setDlgOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Registrar'} Diária</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label>Locação *</Label>
              <Select value={form.rentalId} onValueChange={onRentalSelect}>
                <SelectTrigger><SelectValue placeholder="Selecione a locação..." /></SelectTrigger>
                <SelectContent>
                  {rentals.filter((r: any) => r.status === 'active' || r.status === 'confirmed' || editId).map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.code} - {r.equipment?.name || ''} ({r.client?.name || 'Sem cliente'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.date} onChange={e => onDateChange(e.target.value)} />
            </div>
            <div>
              <Label>Local de Trabalho</Label>
              <Input value={form.workLocation} onChange={e => F('workLocation', e.target.value)} placeholder="Ex: Obra XPTO, Galpão 2" />
            </div>
            <div><Label>Horário Início</Label><Input type="time" value={form.startTime} onChange={e => F('startTime', e.target.value)} /></div>
            <div><Label>Horário Fim</Label><Input type="time" value={form.endTime} onChange={e => F('endTime', e.target.value)} /></div>

            {/* Hours breakdown */}
            <div className="col-span-2 bg-blue-50/60 rounded-lg p-3 grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-blue-700">Horas Normais</Label>
                <Input type="number" value={form.normalHours} onChange={e => F('normalHours', e.target.value)} className="mt-1" placeholder="8" />
              </div>
              <div>
                <Label className="text-xs text-orange-600">Horas Extras</Label>
                <Input type="number" value={form.overtimeHours} onChange={e => F('overtimeHours', e.target.value)} className="mt-1" placeholder="0" />
              </div>
              <div>
                <Label className="text-xs text-indigo-600">Horas Noturnas</Label>
                <Input type="number" value={form.nightHours} onChange={e => F('nightHours', e.target.value)} className="mt-1" placeholder="0" />
              </div>
            </div>

            {/* Flags */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isHoliday} onCheckedChange={v => F('isHoliday', v)} />
                <span className="text-xs">Feriado</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isWeekend} onCheckedChange={v => F('isWeekend', v)} />
                <span className="text-xs">Fim de Semana</span>
              </div>
            </div>
            <div>
              <Label>Valor Diária Base (R$)</Label>
              <Input type="number" value={form.dailyRate} onChange={e => F('dailyRate', e.target.value)} />
            </div>

            <div className="col-span-2"><Label>Descrição / Atividades</Label><Textarea value={form.description} onChange={e => F('description', e.target.value)} rows={2} placeholder="Atividades realizadas no dia..." /></div>
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
