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
import { Plus, FileText, Pencil, Trash2, ChevronDown, ChevronUp, Shield, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { RENT_STATUS, BILLING_MODALITY, DEFAULT_CLAUSES, fmt, fD } from './EquipmentTypes';

interface Props {
  rentals: any[];
  equipment: any[];
  clients: any[];
  employees: any[];
  reload: () => void;
}

const defaultForm: Record<string, any> = {
  equipmentId: '', clientId: '', operatorId: '', operatorName: '',
  rentalType: 'with_operator', billingType: 'daily', billingModality: 'daily',
  unitRate: '', quantity: '1', contractedPeriodDays: '', contractedHoursPerDay: '8',
  overtimeMode: 'percent', overtimeRate: '50', nightMode: 'percent', nightRate: '30',
  holidayMode: 'percent', holidayRate: '100', weekendMode: 'percent', weekendRate: '50',
  includesOperator: true, operatorCostPerDay: '',
  startDate: '', endDate: '', deliveryAddress: '', deliveryCity: '', deliveryState: '', notes: '',
  accessRestrictions: '', clientResponsibilities: '',
  proposalClauses: DEFAULT_CLAUSES.map(t => ({ text: t, enabled: true })),
};

export default function RentalTab({ rentals, equipment, clients, employees, reload }: Props) {
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({ ...defaultForm });
  const [showRates, setShowRates] = useState(false);
  const [showClauses, setShowClauses] = useState(false);

  const F = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }));

  function openNew() {
    setForm({ ...defaultForm, proposalClauses: DEFAULT_CLAUSES.map(t => ({ text: t, enabled: true })) });
    setEditId(null); setShowRates(false); setShowClauses(false); setDlgOpen(true);
  }

  function openEdit(r: any) {
    setEditId(r.id);
    setForm({
      equipmentId: r.equipmentId || '', clientId: r.clientId || '',
      operatorId: r.operatorId || '', operatorName: r.operatorName || '',
      rentalType: r.rentalType || 'with_operator',
      billingType: r.billingType || 'daily', billingModality: r.billingModality || 'daily',
      unitRate: String(r.unitRate || ''), quantity: String(r.quantity || '1'),
      contractedPeriodDays: String(r.contractedPeriodDays || ''),
      contractedHoursPerDay: String(r.contractedHoursPerDay || '8'),
      overtimeMode: r.overtimeMode || 'percent', overtimeRate: String(r.overtimeRate ?? '50'),
      nightMode: r.nightMode || 'percent', nightRate: String(r.nightRate ?? '30'),
      holidayMode: r.holidayMode || 'percent', holidayRate: String(r.holidayRate ?? '100'),
      weekendMode: r.weekendMode || 'percent', weekendRate: String(r.weekendRate ?? '50'),
      includesOperator: r.includesOperator ?? true,
      operatorCostPerDay: String(r.operatorCostPerDay || ''),
      startDate: r.startDate ? r.startDate.substring(0, 10) : '',
      endDate: r.endDate ? r.endDate.substring(0, 10) : '',
      deliveryAddress: r.deliveryAddress || '', deliveryCity: r.deliveryCity || '',
      deliveryState: r.deliveryState || '', notes: r.notes || '',
      accessRestrictions: r.accessRestrictions || '',
      clientResponsibilities: r.clientResponsibilities || '',
      proposalClauses: r.proposalClauses || DEFAULT_CLAUSES.map(t => ({ text: t, enabled: true })),
    });
    setDlgOpen(true);
  }

  async function save() {
    if (!form.equipmentId) { toast.error('Selecione o equipamento'); return; }
    try {
      const tv = Number(form.unitRate || 0) * Number(form.quantity || 1);
      const data = {
        ...form,
        unitRate: Number(form.unitRate) || 0,
        quantity: Number(form.quantity) || 1,
        totalValue: tv,
        contractedPeriodDays: Number(form.contractedPeriodDays) || null,
        contractedHoursPerDay: Number(form.contractedHoursPerDay) || 8,
        overtimeRate: Number(form.overtimeRate) || 0,
        nightRate: Number(form.nightRate) || 0,
        holidayRate: Number(form.holidayRate) || 0,
        weekendRate: Number(form.weekendRate) || 0,
        operatorCostPerDay: Number(form.operatorCostPerDay) || 0,
      };
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

  function toggleClause(idx: number) {
    const cls = [...(form.proposalClauses || [])];
    cls[idx] = { ...cls[idx], enabled: !cls[idx].enabled };
    F('proposalClauses', cls);
  }

  function updateClauseText(idx: number, text: string) {
    const cls = [...(form.proposalClauses || [])];
    cls[idx] = { ...cls[idx], text };
    F('proposalClauses', cls);
  }

  function addCustomClause() {
    F('proposalClauses', [...(form.proposalClauses || []), { text: '', enabled: true }]);
  }

  function removeClause(idx: number) {
    const cls = [...(form.proposalClauses || [])];
    cls.splice(idx, 1);
    F('proposalClauses', cls);
  }

  // Rate addon helper
  function RateField({ label, modeKey, rateKey }: { label: string; modeKey: string; rateKey: string }) {
    return (
      <div className="grid grid-cols-[1fr_100px] gap-2 items-end">
        <div>
          <Label className="text-xs">{label}</Label>
          <div className="flex gap-1 mt-1">
            <Select value={form[modeKey]} onValueChange={v => F(modeKey, v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">%</SelectItem>
                <SelectItem value="fixed">R$</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Input type="number" className="h-8 text-xs" value={form[rateKey]}
            onChange={e => F(rateKey, e.target.value)}
            placeholder={form[modeKey] === 'percent' ? '50%' : 'R$ 150'}
          />
        </div>
      </div>
    );
  }

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
                  <Badge variant="outline" className="text-xs">{BILLING_MODALITY[r.billingModality] || BILLING_MODALITY[r.billingType] || 'Diária'}</Badge>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{r.equipment?.name || '—'}</p>
                <p className="text-xs text-muted-foreground">{r.client?.name || 'Sem cliente'} • {fD(r.startDate)} a {fD(r.endDate)}</p>
                {r.deliveryCity && <p className="text-xs text-slate-400 mt-0.5">📍 {r.deliveryCity}{r.deliveryState ? ` / ${r.deliveryState}` : ''}</p>}
                {r.proposalClauses?.filter((c: any) => c.enabled).length > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5"><Shield className="h-3 w-3 inline mr-1" />{r.proposalClauses.filter((c: any) => c.enabled).length} cláusula(s) ativa(s)</p>
                )}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nova'} Locação</DialogTitle></DialogHeader>

          {/* ── Dados Básicos ── */}
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
              <Label>Modalidade de Faturamento</Label>
              <Select value={form.billingModality} onValueChange={v => { F('billingModality', v); F('billingType', v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="hourly">Por Hora</SelectItem>
                  <SelectItem value="fixed_period">Período Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Unitário (R$)</Label><Input type="number" value={form.unitRate} onChange={e => F('unitRate', e.target.value)} /></div>
            <div><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={e => F('quantity', e.target.value)} /></div>
            {form.billingModality === 'fixed_period' && (
              <div><Label>Período Contratado (dias)</Label><Input type="number" value={form.contractedPeriodDays} onChange={e => F('contractedPeriodDays', e.target.value)} placeholder="30" /></div>
            )}
            <div><Label>Horas/Dia Contratadas</Label><Input type="number" value={form.contractedHoursPerDay} onChange={e => F('contractedHoursPerDay', e.target.value)} placeholder="8" /></div>
            <div className="flex items-end pb-2">
              <p className="text-sm font-semibold text-slate-700">Total: {fmt(Number(form.unitRate || 0) * Number(form.quantity || 1))}</p>
            </div>
          </div>

          {/* ── Operador ── */}
          <div className="grid grid-cols-2 gap-4 mt-2 border-t pt-3">
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={form.includesOperator} onCheckedChange={v => F('includesOperator', v)} />
              <span className="text-sm font-medium">Inclui operador da empresa</span>
            </div>
            {form.includesOperator && (
              <>
                <div>
                  <Label>Operador</Label>
                  <Select value={form.operatorId} onValueChange={v => { const em = employees.find(e => e.id === v); F('operatorId', v); F('operatorName', em?.name || ''); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Custo do Operador/Dia (R$)</Label><Input type="number" value={form.operatorCostPerDay} onChange={e => F('operatorCostPerDay', e.target.value)} placeholder="0" /></div>
              </>
            )}
          </div>

          {/* ── Datas e Local ── */}
          <div className="grid grid-cols-2 gap-4 mt-2 border-t pt-3">
            <div><Label>Data Início</Label><Input type="date" value={form.startDate} onChange={e => F('startDate', e.target.value)} /></div>
            <div><Label>Data Fim</Label><Input type="date" value={form.endDate} onChange={e => F('endDate', e.target.value)} /></div>
            <div className="col-span-2"><Label>Endereço de Entrega</Label><Input value={form.deliveryAddress} onChange={e => F('deliveryAddress', e.target.value)} /></div>
            <div><Label>Cidade</Label><Input value={form.deliveryCity} onChange={e => F('deliveryCity', e.target.value)} /></div>
            <div><Label>Estado</Label><Input value={form.deliveryState} onChange={e => F('deliveryState', e.target.value)} /></div>
          </div>

          {/* ── Adicionais (colapsável) ── */}
          <button
            type="button"
            className="flex items-center gap-2 w-full py-2 mt-2 border-t text-sm font-medium text-blue-700 hover:text-blue-800"
            onClick={() => setShowRates(!showRates)}
          >
            <Clock className="h-4 w-4" />
            Adicionais (Hora Extra, Noturno, Feriado, Fim de Semana)
            {showRates ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>
          {showRates && (
            <div className="grid grid-cols-2 gap-3 bg-blue-50/50 rounded-lg p-3">
              <RateField label="Hora Extra" modeKey="overtimeMode" rateKey="overtimeRate" />
              <RateField label="Adicional Noturno (22h-05h)" modeKey="nightMode" rateKey="nightRate" />
              <RateField label="Adicional Feriado" modeKey="holidayMode" rateKey="holidayRate" />
              <RateField label="Adicional Fim de Semana" modeKey="weekendMode" rateKey="weekendRate" />
            </div>
          )}

          {/* ── Cláusulas e Responsabilidades (colapsável) ── */}
          <button
            type="button"
            className="flex items-center gap-2 w-full py-2 mt-1 border-t text-sm font-medium text-amber-700 hover:text-amber-800"
            onClick={() => setShowClauses(!showClauses)}
          >
            <Shield className="h-4 w-4" />
            Cláusulas da Proposta e Responsabilidades
            {showClauses ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>
          {showClauses && (
            <div className="space-y-3 bg-amber-50/50 rounded-lg p-3">
              <div>
                <Label className="text-xs font-semibold text-amber-800">Cláusulas da Proposta</Label>
                <div className="space-y-2 mt-2">
                  {(form.proposalClauses || []).map((clause: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 bg-white rounded p-2 border">
                      <Switch checked={clause.enabled} onCheckedChange={() => toggleClause(idx)} className="mt-0.5" />
                      <Textarea
                        className="flex-1 min-h-[36px] text-xs resize-none"
                        value={clause.text}
                        onChange={e => updateClauseText(idx, e.target.value)}
                        rows={1}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-red-400 hover:text-red-600" onClick={() => removeClause(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addCustomClause} className="w-full text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar cláusula personalizada
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />Restrições de Acesso
                </Label>
                <Textarea
                  className="mt-1 text-xs"
                  value={form.accessRestrictions}
                  onChange={e => F('accessRestrictions', e.target.value)}
                  placeholder="Ex: Áreas com solo instável, declives >15°, ou próximas a redes elétricas exigem avaliação prévia do operador..."
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-amber-800">Responsabilidades do Cliente</Label>
                <Textarea
                  className="mt-1 text-xs"
                  value={form.clientResponsibilities}
                  onChange={e => F('clientResponsibilities', e.target.value)}
                  placeholder="Ex: Garantir acesso adequado, sinalização da área, fornecimento de energia..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* ── Observações ── */}
          <div className="mt-2 border-t pt-3">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => F('notes', e.target.value)} rows={2} />
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
