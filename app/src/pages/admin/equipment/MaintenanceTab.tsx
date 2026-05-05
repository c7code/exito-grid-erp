import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Wrench, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { MAINT_STATUS, fmt, fD } from './EquipmentTypes';

interface Props {
  maintenances: any[];
  equipment: any[];
  reload: () => void;
}

const MAINT_TYPES: Record<string, string> = { preventive: 'Preventiva', corrective: 'Corretiva', inspection: 'Inspeção' };

const defaultForm = {
  equipmentId: '', type: 'preventive', description: '', cost: '',
  performedBy: '', performedAt: '', nextDueDate: '', status: 'scheduled', notes: '',
};

export default function MaintenanceTab({ maintenances, equipment, reload }: Props) {
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const F = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  function openNew() { setForm({ ...defaultForm }); setEditId(null); setDlgOpen(true); }

  function openEdit(m: any) {
    setEditId(m.id);
    setForm({
      equipmentId: m.equipmentId || '', type: m.type || 'preventive',
      description: m.description || '', cost: String(m.cost || ''),
      performedBy: m.performedBy || '',
      performedAt: m.performedAt ? m.performedAt.substring(0, 10) : '',
      nextDueDate: m.nextDueDate ? m.nextDueDate.substring(0, 10) : '',
      status: m.status || 'scheduled', notes: m.notes || '',
    });
    setDlgOpen(true);
  }

  async function save() {
    if (!form.equipmentId || !form.description) { toast.error('Equipamento e descrição são obrigatórios'); return; }
    try {
      const data = { ...form, cost: Number(form.cost) || 0 };
      if (editId) {
        await api.updateEquipmentMaintenance(editId, data);
        toast.success('Manutenção atualizada!');
      } else {
        await api.createEquipmentMaintenance(data);
        toast.success('Manutenção registrada!');
      }
      setDlgOpen(false); setEditId(null); reload();
    } catch { toast.error('Erro ao salvar'); }
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta manutenção?')) return;
    try { await api.deleteEquipmentMaintenance(id); toast.success('Manutenção excluída'); reload(); }
    catch { toast.error('Erro ao excluir'); }
  }

  async function updateStatus(id: string, status: string) {
    try { await api.updateEquipmentMaintenance(id, { status }); toast.success('Status atualizado!'); reload(); }
    catch { toast.error('Erro ao atualizar'); }
  }

  const totalCost = maintenances.reduce((s, m) => s + Number(m.cost || 0), 0);

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">{maintenances.length} manutenção(ões)</p>
          <Badge variant="outline" className="text-xs">Custo total: {fmt(totalCost)}</Badge>
        </div>
        <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />Nova Manutenção
        </Button>
      </div>

      <Card>
        <div className="divide-y">
          {maintenances.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors group">
              <Wrench className={`h-5 w-5 shrink-0 ${m.status === 'completed' ? 'text-green-500' : m.status === 'in_progress' ? 'text-blue-500' : 'text-yellow-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-slate-800">{m.description}</span>
                  <Badge className={MAINT_STATUS[m.status]?.c || ''}>{MAINT_STATUS[m.status]?.l || m.status}</Badge>
                  <Badge variant="outline" className="text-xs">{MAINT_TYPES[m.type] || m.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {m.equipment?.name || '—'} • {fD(m.performedAt)}
                  {m.performedBy && ` • ${m.performedBy}`}
                </p>
                {m.nextDueDate && (
                  <p className="text-xs text-amber-600 mt-0.5">Próxima: {fD(m.nextDueDate)}</p>
                )}
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-sm font-semibold">{fmt(m.cost)}</p>
                <div className="flex gap-1 justify-end items-center">
                  {m.status === 'scheduled' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, 'in_progress')}>Iniciar</Button>
                  )}
                  {m.status === 'in_progress' && (
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300"
                      onClick={() => updateStatus(m.id, 'completed')}>Concluir</Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {maintenances.length === 0 && (
            <div className="p-12 text-center">
              <Wrench className="h-14 w-14 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium">Nenhuma manutenção registrada</p>
              <p className="text-sm text-slate-400 mt-1">Preventivas, corretivas e inspeções</p>
            </div>
          )}
        </div>
      </Card>

      {/* Dialog */}
      <Dialog open={dlgOpen} onOpenChange={v => { if (!v) { setDlgOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nova'} Manutenção</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Equipamento *</Label>
              <Select value={form.equipmentId} onValueChange={v => F('equipmentId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.code} - {e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => F('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MAINT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição *</Label><Input value={form.description} onChange={e => F('description', e.target.value)} placeholder="Ex: Troca de óleo hidráulico" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Custo (R$)</Label><Input type="number" value={form.cost} onChange={e => F('cost', e.target.value)} /></div>
              <div><Label>Executado por</Label><Input value={form.performedBy} onChange={e => F('performedBy', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data Execução</Label><Input type="date" value={form.performedAt} onChange={e => F('performedAt', e.target.value)} /></div>
              <div><Label>Próxima Manutenção</Label><Input type="date" value={form.nextDueDate} onChange={e => F('nextDueDate', e.target.value)} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => F('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MAINT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => F('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDlgOpen(false); setEditId(null); }}>Cancelar</Button>
            <Button onClick={save} className="bg-amber-500 hover:bg-amber-600 text-white">{editId ? 'Salvar' : 'Registrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
