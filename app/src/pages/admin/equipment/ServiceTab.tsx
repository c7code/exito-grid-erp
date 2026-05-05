import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Zap, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { SVC_TYPE, SVC_STATUS, fmt, fD } from './EquipmentTypes';

interface Props {
  services: any[];
  equipment: any[];
  clients: any[];
  employees: any[];
  reload: () => void;
}

export default function ServiceTab({ services, equipment, clients, employees, reload }: Props) {
  const [dlgOpen, setDlgOpen] = useState(false);
  const [form, setForm] = useState({
    equipmentId: '', clientId: '', operatorId: '', operatorName: '',
    serviceType: 'lifting', description: '', address: '', city: '', state: '',
    scheduledDate: '', unitRate: '', quantity: '1', notes: '',
  });

  const F = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  async function save() {
    if (!form.equipmentId) { toast.error('Selecione o equipamento'); return; }
    try {
      await api.createEquipmentService({
        ...form, unitRate: Number(form.unitRate) || 0, quantity: Number(form.quantity) || 1,
      });
      toast.success('Serviço criado!');
      setDlgOpen(false); reload();
    } catch { toast.error('Erro ao criar serviço'); }
  }

  async function bill(id: string) {
    try {
      const result = await api.billEquipmentService(id);
      toast.success(`Serviço faturado — ${fmt(result.totalValue)}`);
      reload();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao faturar'); }
  }

  async function updateStatus(id: string, status: string) {
    try { await api.updateEquipmentService(id, { status }); toast.success('Status atualizado!'); reload(); }
    catch { toast.error('Erro ao atualizar'); }
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{services.length} serviço(s)</p>
        <Button onClick={() => setDlgOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />Novo Serviço
        </Button>
      </div>

      <Card>
        <div className="divide-y">
          {services.map(s => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-slate-800">{s.code}</span>
                  <Badge className={SVC_STATUS[s.status]?.c || ''}>{SVC_STATUS[s.status]?.l || s.status}</Badge>
                  <Badge variant="outline" className="text-xs">{SVC_TYPE[s.serviceType] || s.serviceType}</Badge>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{s.equipment?.name || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {s.client?.name || 'Sem cliente'} • {fD(s.scheduledDate)}
                </p>
                {s.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{s.description}</p>}
                {s.city && <p className="text-xs text-slate-400">📍 {s.city}{s.state ? ` / ${s.state}` : ''}</p>}
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-lg font-bold text-slate-800">{fmt(s.totalValue)}</p>
                <div className="flex gap-1 justify-end">
                  {s.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, 'scheduled')}>Agendar</Button>
                  )}
                  {s.status === 'scheduled' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, 'in_progress')}>Iniciar</Button>
                  )}
                  {s.status === 'in_progress' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, 'completed')}>Concluir</Button>
                  )}
                  {s.status === 'completed' && (
                    <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300"
                      onClick={() => bill(s.id)}>
                      <Receipt className="h-3.5 w-3.5 mr-1" />Faturar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="p-12 text-center">
              <Zap className="h-14 w-14 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium">Nenhum serviço pontual</p>
              <p className="text-sm text-slate-400 mt-1">Içamentos, transportes e outros serviços pontuais</p>
            </div>
          )}
        </div>
      </Card>

      {/* Dialog */}
      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Serviço Pontual</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label>Equipamento *</Label>
              <Select value={form.equipmentId} onValueChange={v => F('equipmentId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.code} - {e.name}</SelectItem>)}</SelectContent>
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
              <Label>Tipo de Serviço</Label>
              <Select value={form.serviceType} onValueChange={v => F('serviceType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SVC_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operador</Label>
              <Select value={form.operatorId} onValueChange={v => { const em = employees.find(e => e.id === v); setForm(prev => ({ ...prev, operatorId: v, operatorName: em?.name || '' })); }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data Agendada</Label><Input type="date" value={form.scheduledDate} onChange={e => F('scheduledDate', e.target.value)} /></div>
            <div><Label>Valor Unitário (R$)</Label><Input type="number" value={form.unitRate} onChange={e => F('unitRate', e.target.value)} /></div>
            <div><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={e => F('quantity', e.target.value)} /></div>
            <div className="col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => F('description', e.target.value)} rows={2} /></div>
            <div className="col-span-2"><Label>Endereço</Label><Input value={form.address} onChange={e => F('address', e.target.value)} /></div>
            <div><Label>Cidade</Label><Input value={form.city} onChange={e => F('city', e.target.value)} /></div>
            <div><Label>Estado</Label><Input value={form.state} onChange={e => F('state', e.target.value)} /></div>
            <div className="col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => F('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDlgOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-purple-600 hover:bg-purple-700 text-white">Criar Serviço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
