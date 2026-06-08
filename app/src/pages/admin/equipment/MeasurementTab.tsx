import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileText, Printer, DollarSign, Clock, Moon, Calendar, TrendingUp, Pencil, Trash2, Eye, CalendarRange, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { DAILY_STATUS, fmt, fD } from './EquipmentTypes';

// Extract YYYY-MM-DD safely from any date format
function safeDate(d: any): string {
  if (!d) return '';
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const dt = new Date(s + (s.length === 10 ? 'T12:00:00' : ''));
  if (isNaN(dt.getTime())) return '';
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}

// Generate adapted dates within a measurement period, distributing logs evenly
function generateAdaptedDates(logs: any[], periodStart: string, periodEnd: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!periodStart || !periodEnd || logs.length === 0) return map;
  const start = new Date(periodStart + 'T12:00:00');
  const end = new Date(periodEnd + 'T12:00:00');
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const step = Math.max(1, Math.floor(totalDays / logs.length));
  logs.forEach((log: any, idx: number) => {
    const offset = Math.min(idx * step, totalDays - 1);
    const adaptedDate = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000);
    const y = adaptedDate.getFullYear();
    const m = String(adaptedDate.getMonth() + 1).padStart(2, '0');
    const d = String(adaptedDate.getDate()).padStart(2, '0');
    map.set(log.id, `${y}-${m}-${d}`);
  });
  return map;
}

interface Props {
  rentals: any[];
  equipment: any[];
  dailyLogs: any[];
  reload: () => void;
}

export default function MeasurementTab({ rentals, reload }: Props) {
  const [selectedRentalId, setSelectedRentalId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editDlg, setEditDlg] = useState(false);
  const [viewDlg, setViewDlg] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  // Boletim Adaptado (datas fictícias para faturamento)
  const [adaptedMode, setAdaptedMode] = useState(false);
  const [adaptedStart, setAdaptedStart] = useState('');
  const [adaptedEnd, setAdaptedEnd] = useState('');

  async function loadReport() {
    if (!selectedRentalId) { toast.error('Selecione uma locação'); return; }
    try {
      setLoading(true);
      const data = await api.getMeasurementReport(selectedRentalId, startDate || undefined, endDate || undefined);
      setReport(data);
    } catch { toast.error('Erro ao gerar boletim'); }
    finally { setLoading(false); }
  }

  async function billPeriod() {
    if (!selectedRentalId) return;
    try {
      const r = await api.billEquipmentDailyLogs(selectedRentalId);
      toast.success(`${r.count} diária(s) faturada(s): ${fmt(r.totalValue)}`);
      reload();
      loadReport();
    } catch { toast.error('Erro ao faturar'); }
  }

  function openEditLog(log: any) {
    setSelectedLog(log);
    setEditForm({
      date: safeDate(log.date),
      startTime: log.startTime || '', endTime: log.endTime || '',
      normalHours: String(log.normalHours || log.hoursWorked || ''),
      overtimeHours: String(log.overtimeHours || '0'),
      nightHours: String(log.nightHours || '0'),
      isHoliday: log.isHoliday || false, isWeekend: log.isWeekend || false,
      dailyRate: String(log.dailyRate || ''), description: log.description || '',
      workLocation: log.workLocation || '',
      overtimeValue: log.overtimeValue ? String(log.overtimeValue) : '',
      nightValue: log.nightValue ? String(log.nightValue) : '',
      holidayValue: log.holidayValue ? String(log.holidayValue) : '',
      weekendValue: log.weekendValue ? String(log.weekendValue) : '',
    });
    setEditDlg(true);
  }

  function openViewLog(log: any) {
    setSelectedLog(log);
    setViewDlg(true);
  }

  async function saveEditLog() {
    if (!selectedLog) return;
    try {
      const updateData: any = {
        date: editForm.date,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        workLocation: editForm.workLocation,
        description: editForm.description,
        isHoliday: editForm.isHoliday,
        isWeekend: editForm.isWeekend,
        hoursWorked: Number(editForm.normalHours || 0) + Number(editForm.overtimeHours || 0),
        normalHours: Number(editForm.normalHours || 0),
        overtimeHours: Number(editForm.overtimeHours || 0),
        nightHours: Number(editForm.nightHours || 0),
        dailyRate: Number(editForm.dailyRate || 0),
      };
      // Include manual value overrides only if user entered them
      if (editForm.overtimeValue !== '' && editForm.overtimeValue !== undefined) updateData.overtimeValue = Number(editForm.overtimeValue);
      if (editForm.nightValue !== '' && editForm.nightValue !== undefined) updateData.nightValue = Number(editForm.nightValue);
      if (editForm.holidayValue !== '' && editForm.holidayValue !== undefined) updateData.holidayValue = Number(editForm.holidayValue);
      if (editForm.weekendValue !== '' && editForm.weekendValue !== undefined) updateData.weekendValue = Number(editForm.weekendValue);
      await api.updateEquipmentDailyLog(selectedLog.id, updateData);
      toast.success('Diária atualizada!');
      setEditDlg(false); setSelectedLog(null);
      loadReport();
      reload();
    } catch { toast.error('Erro ao atualizar'); }
  }

  async function deleteLog(id: string) {
    if (!confirm('Excluir esta diária do boletim?')) return;
    try {
      await api.deleteEquipmentDailyLog(id);
      toast.success('Diária excluída');
      loadReport();
      reload();
    } catch { toast.error('Erro ao excluir'); }
  }

  const EF = (field: string, val: any) => setEditForm(prev => ({ ...prev, [field]: val }));

  async function printReport() {
    if (!report) return;
    const r = report.rental;
    const isAdapted = adaptedMode && adaptedStart && adaptedEnd;
    const adaptedDates = isAdapted ? generateAdaptedDates(report.logs || [], adaptedStart, adaptedEnd) : new Map();

    // Converter logo para base64 para funcionar no window.open()
    let logoBase64 = '';
    try {
      const resp = await fetch('/exito-grid-logo.png');
      const blob = await resp.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch { /* logo opcional */ }
    const s = report.summary;
    const logs = report.logs || [];

    const logsHtml = logs.map((log: any) => {
      const displayDate = isAdapted && adaptedDates.has(log.id) ? fD(adaptedDates.get(log.id)!) : fD(log.date);
      return `
      <tr>
        <td>${displayDate}</td>
        <td>${log.startTime || '—'}</td>
        <td>${log.endTime || '—'}</td>
        <td class="right">${Number(log.normalHours || 0).toFixed(1)}</td>
        <td class="right">${Number(log.overtimeHours || 0).toFixed(1)}</td>
        <td class="right">${Number(log.nightHours || 0).toFixed(1)}</td>
        <td class="center">${log.isHoliday ? '✓' : log.isWeekend ? 'FS' : '—'}</td>
        <td class="right">${fmt(log.totalValue)}</td>
        <td>${log.workLocation || '—'}</td>
      </tr>
    `;
    }).join('');

    // Clauses
    const clausesHtml = (r.proposalClauses || [])
      .filter((c: any) => c.enabled)
      .map((c: any, i: number) => `<li>${i + 1}. ${c.text}</li>`)
      .join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Boletim de Medição - ${r.code}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 20px; color: #1e40af; }
  .header .code { font-size: 14px; color: #64748b; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 16px; }
  .info-grid .item { display: flex; gap: 6px; }
  .info-grid .label { font-weight: 600; color: #475569; min-width: 100px; }
  .info-grid .value { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10px; }
  table th { background: #1e40af; color: white; padding: 6px 8px; text-align: left; font-weight: 600; }
  table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  table tr:nth-child(even) { background: #f8fafc; }
  table .right { text-align: right; }
  table .center { text-align: center; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
  .summary-card { background: #f1f5f9; border-radius: 6px; padding: 10px 12px; text-align: center; }
  .summary-card .label { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 600; }
  .summary-card .value { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px; }
  .summary-card.total { background: #1e40af; }
  .summary-card.total .label, .summary-card.total .value { color: white; }
  .clauses { margin: 16px 0; }
  .clauses h3 { font-size: 12px; font-weight: 700; color: #1e40af; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .clauses ul { list-style: none; padding: 0; }
  .clauses li { padding: 3px 0; font-size: 10px; color: #475569; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; padding-top: 20px; }
  .sig-block { text-align: center; }
  .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; margin-top: 40px; font-size: 10px; color: #475569; }
  .sig-name { font-weight: 600; font-size: 11px; color: #1e293b; margin-top: 2px; }
  .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
</style>
</head><body>
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px">
      ${logoBase64 ? `<img src="${logoBase64}" style="height:48px;width:auto;object-fit:contain" alt="Logo" />` : ''}
      <div>
        <h1>BOLETIM DE MEDIÇÃO</h1>
        <div class="code">${r.code}</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;font-weight:700;color:#1e40af">Exito Grid</div>
      <div style="font-size:8px;color:#475569">Exito Grid Comercio Serviços Elétrico LTDA</div>
      <div style="font-size:8px;color:#64748b">CNPJ: 55.303.935/0001-39</div>
      <div style="font-size:9px;color:#64748b;margin-top:4px">Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="item"><span class="label">Equipamento:</span><span class="value">${r.equipment?.name || '—'} (${r.equipment?.code || ''})</span></div>
    <div class="item"><span class="label">Cliente:</span><span class="value">${r.client?.name || '—'}</span></div>
    <div class="item"><span class="label">Operador:</span><span class="value">${r.operatorName || '—'}</span></div>
    <div class="item"><span class="label">Período:</span><span class="value">${isAdapted ? fD(adaptedStart) + ' a ' + fD(adaptedEnd) : (startDate ? fD(startDate) : fD(r.startDate)) + ' a ' + (endDate ? fD(endDate) : fD(r.endDate))}</span></div>
    <div class="item"><span class="label">Valor Diária:</span><span class="value">${fmt(r.unitRate)}</span></div>
    <div class="item"><span class="label">Horas/Dia:</span><span class="value">${r.contractedHoursPerDay || 8}h</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th><th>Início</th><th>Fim</th>
        <th class="right">Normal</th><th class="right">Extra</th><th class="right">Noturno</th>
        <th class="center">Fer/FS</th><th class="right">Valor</th><th>Local</th>
      </tr>
    </thead>
    <tbody>${logsHtml}</tbody>
  </table>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Horas Normais</div>
      <div class="value">${s.totalNormalHours.toFixed(1)}h</div>
      <div class="label" style="margin-top:4px">${fmt(s.totalNormalValue)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Horas Extras</div>
      <div class="value" style="color:#ea580c">${s.totalOvertimeHours.toFixed(1)}h</div>
      <div class="label" style="margin-top:4px;color:#ea580c">${fmt(s.totalOvertimeValue)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Adic. Noturno + Feriado + FS</div>
      <div class="value" style="color:#6366f1">${s.totalNightHours.toFixed(1)}h</div>
      <div class="label" style="margin-top:4px;color:#6366f1">${fmt(s.totalNightValue + s.totalHolidayValue + s.totalWeekendValue)}</div>
    </div>
    <div class="summary-card total">
      <div class="label">TOTAL DO PERÍODO</div>
      <div class="value">${fmt(s.totalValue)}</div>
      <div class="label" style="margin-top:4px">${s.totalDays} dia(s) trabalhado(s)</div>
    </div>
  </div>

  ${clausesHtml ? `
  <div class="clauses">
    <h3>CLÁUSULAS E CONDIÇÕES</h3>
    <ul>${clausesHtml}</ul>
  </div>
  ` : ''}

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">CONTRATADA</div>
      <div class="sig-name">Exito Grid Comercio Serviços Elétrico LTDA</div>
      <div style="font-size:9px;color:#64748b">CNPJ: 55.303.935/0001-39</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">CONTRATANTE</div>
      <div class="sig-name">${r.client?.name || '___________________'}</div>
    </div>
  </div>

  <div class="footer">
    Boletim de Medição gerado automaticamente pelo sistema Exito Grid ERP • ${r.code}
  </div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  }

  const activeRentals = rentals.filter(r => ['active', 'confirmed', 'completed'].includes(r.status));

  return (
    <>
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 items-end">
          <div className="col-span-2">
            <Label>Locação</Label>
            <Select value={selectedRentalId} onValueChange={setSelectedRentalId}>
              <SelectTrigger><SelectValue placeholder="Selecione a locação..." /></SelectTrigger>
              <SelectContent>
                {activeRentals.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.code} — {r.equipment?.name || ''} ({r.client?.name || 'Sem cliente'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data Início</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Data Fim</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={loadReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <TrendingUp className="h-4 w-4 mr-1" />}
            Gerar Boletim
          </Button>
          {report && (
            <>
              <Button variant="outline" onClick={printReport}>
                <Printer className="h-4 w-4 mr-1" />{adaptedMode ? 'Imprimir Adaptado' : 'Imprimir / PDF'}
              </Button>
              <Button variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={billPeriod}>
                <DollarSign className="h-4 w-4 mr-1" />Faturar Período
              </Button>
            </>
          )}
        </div>

        {/* Boletim Adaptado para Faturamento */}
        <div className="mt-3 border-t pt-3">
          <div className="flex items-center gap-3">
            <Switch checked={adaptedMode} onCheckedChange={setAdaptedMode} />
            <div className="flex items-center gap-1.5">
              <CalendarRange className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-slate-700">Boletim Adaptado (Faturamento)</span>
            </div>
          </div>
          {adaptedMode && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Modo adaptado ativado.</strong> As datas reais serão mantidas no sistema. Ao imprimir, 
                  as datas do boletim serão redistribuídas dentro do período de medição informado abaixo 
                  para fins de faturamento junto à construtora.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-amber-800">Início do Período de Medição</Label>
                  <Input type="date" value={adaptedStart} onChange={e => setAdaptedStart(e.target.value)} className="mt-1 border-amber-300" />
                </div>
                <div>
                  <Label className="text-xs text-amber-800">Fim do Período de Medição</Label>
                  <Input type="date" value={adaptedEnd} onChange={e => setAdaptedEnd(e.target.value)} className="mt-1 border-amber-300" />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Report View */}
      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryCard icon={Clock} label="Horas Normais" value={`${report.summary.totalNormalHours.toFixed(1)}h`} sub={fmt(report.summary.totalNormalValue)} color="text-blue-600" bg="bg-blue-50" />
            <SummaryCard icon={Clock} label="Horas Extras" value={`${report.summary.totalOvertimeHours.toFixed(1)}h`} sub={fmt(report.summary.totalOvertimeValue)} color="text-orange-600" bg="bg-orange-50" />
            <SummaryCard icon={Moon} label="Noturno" value={`${report.summary.totalNightHours.toFixed(1)}h`} sub={fmt(report.summary.totalNightValue)} color="text-indigo-600" bg="bg-indigo-50" />
            <SummaryCard icon={Calendar} label="Feriados/FS" value={`${report.summary.holidayDays + report.summary.weekendDays} dia(s)`} sub={fmt(report.summary.totalHolidayValue + report.summary.totalWeekendValue)} color="text-red-600" bg="bg-red-50" />
            <SummaryCard icon={DollarSign} label="TOTAL PERÍODO" value={fmt(report.summary.totalValue)} sub={`${report.summary.totalDays} dia(s)`} color="text-white" bg="bg-blue-700" />
          </div>

          {/* Detail Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-xs">
                    <th className="px-4 py-2.5 text-left font-semibold">Data</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Horário</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Normal</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Extra</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Noturno</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Fer/FS</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Valor</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Local</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.logs || []).map((log: any) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2 font-medium">
                        {fD(log.date)}
                        {adaptedMode && adaptedStart && adaptedEnd && (() => {
                          const adapted = generateAdaptedDates(report.logs || [], adaptedStart, adaptedEnd);
                          const ad = adapted.get(log.id);
                          return ad ? <span className="block text-[10px] text-amber-600">📋 {fD(ad)}</span> : null;
                        })()}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{log.startTime || '—'} - {log.endTime || '—'}</td>
                      <td className="px-3 py-2 text-right">{Number(log.normalHours || 0).toFixed(1)}h</td>
                      <td className="px-3 py-2 text-right text-orange-600 font-medium">{Number(log.overtimeHours || 0) > 0 ? `${Number(log.overtimeHours).toFixed(1)}h` : '—'}</td>
                      <td className="px-3 py-2 text-right text-indigo-600">{Number(log.nightHours || 0) > 0 ? `${Number(log.nightHours).toFixed(1)}h` : '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {log.isHoliday ? <Badge className="bg-red-100 text-red-700 text-[10px]">Feriado</Badge>
                          : log.isWeekend ? <Badge className="bg-purple-100 text-purple-700 text-[10px]">FS</Badge>
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(log.totalValue)}</td>
                      <td className="px-3 py-2 text-slate-500 text-xs">{log.workLocation || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <Badge className={`text-[10px] ${DAILY_STATUS[log.status]?.c || ''}`}>{DAILY_STATUS[log.status]?.l || log.status}</Badge>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex gap-0.5 justify-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openViewLog(log)} title="Visualizar">
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLog(log)} title="Editar">
                            <Pencil className="h-3.5 w-3.5 text-blue-500" />
                          </Button>
                          {log.status === 'registered' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteLog(log.id)} title="Excluir">
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 font-bold text-sm">
                    <td className="px-4 py-2.5" colSpan={2}>TOTAIS</td>
                    <td className="px-3 py-2.5 text-right">{report.summary.totalNormalHours.toFixed(1)}h</td>
                    <td className="px-3 py-2.5 text-right text-orange-600">{report.summary.totalOvertimeHours.toFixed(1)}h</td>
                    <td className="px-3 py-2.5 text-right text-indigo-600">{report.summary.totalNightHours.toFixed(1)}h</td>
                    <td className="px-3 py-2.5 text-center">{report.summary.holidayDays + report.summary.weekendDays}</td>
                    <td className="px-3 py-2.5 text-right text-blue-700">{fmt(report.summary.totalValue)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Clauses if any */}
          {report.rental.proposalClauses?.filter((c: any) => c.enabled).length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Cláusulas e Condições</h3>
              <div className="space-y-1">
                {report.rental.proposalClauses.filter((c: any) => c.enabled).map((c: any, i: number) => (
                  <p key={i} className="text-xs text-slate-600">{i + 1}. {c.text}</p>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {!report && !loading && (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-slate-200" />
          <p className="text-slate-500 font-medium">Selecione uma locação e período para gerar o Boletim de Medição</p>
          <p className="text-xs text-slate-400 mt-1">O boletim consolida todas as diárias registradas com detalhamento de horas normais, extras, noturnas e feriados</p>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={viewDlg} onOpenChange={setViewDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes da Diária</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="grid grid-cols-2 gap-3 text-sm mt-2">
              <div><span className="text-slate-400">Data:</span> <strong>{fD(selectedLog.date)}</strong></div>
              <div><span className="text-slate-400">Horário:</span> {selectedLog.startTime || '—'} - {selectedLog.endTime || '—'}</div>
              <div><span className="text-slate-400">Horas Normais:</span> {Number(selectedLog.normalHours || 0).toFixed(1)}h</div>
              <div><span className="text-slate-400">Horas Extras:</span> <span className="text-orange-600">{Number(selectedLog.overtimeHours || 0).toFixed(1)}h</span></div>
              <div><span className="text-slate-400">Horas Noturnas:</span> <span className="text-indigo-600">{Number(selectedLog.nightHours || 0).toFixed(1)}h</span></div>
              <div><span className="text-slate-400">Feriado:</span> {selectedLog.isHoliday ? 'Sim' : 'Não'}</div>
              <div><span className="text-slate-400">Fim de Semana:</span> {selectedLog.isWeekend ? 'Sim' : 'Não'}</div>
              <div><span className="text-slate-400">Valor Normal:</span> {fmt(selectedLog.normalValue)}</div>
              <div><span className="text-slate-400">Valor Extras:</span> <span className="text-orange-600">{fmt(selectedLog.overtimeValue)}</span></div>
              <div><span className="text-slate-400">Valor Noturno:</span> <span className="text-indigo-600">{fmt(selectedLog.nightValue)}</span></div>
              <div><span className="text-slate-400">Valor Feriado:</span> <span className="text-red-600">{fmt(selectedLog.holidayValue)}</span></div>
              <div><span className="text-slate-400">Valor F.Semana:</span> <span className="text-purple-600">{fmt(selectedLog.weekendValue)}</span></div>
              <div className="col-span-2 border-t pt-2"><span className="text-slate-400">TOTAL:</span> <strong className="text-blue-700 text-lg">{fmt(selectedLog.totalValue)}</strong></div>
              <div><span className="text-slate-400">Local:</span> {selectedLog.workLocation || '—'}</div>
              <div><span className="text-slate-400">Status:</span> <Badge className={`text-[10px] ${DAILY_STATUS[selectedLog.status]?.c || ''}`}>{DAILY_STATUS[selectedLog.status]?.l || selectedLog.status}</Badge></div>
              {selectedLog.description && <div className="col-span-2"><span className="text-slate-400">Descrição:</span> {selectedLog.description}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDlg} onOpenChange={v => { if (!v) { setEditDlg(false); setSelectedLog(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Diária — {selectedLog ? fD(selectedLog.date) : ''}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div><Label>Data</Label><Input type="date" value={editForm.date} onChange={e => EF('date', e.target.value)} /></div>
            <div><Label>Local</Label><Input value={editForm.workLocation} onChange={e => EF('workLocation', e.target.value)} /></div>
            <div><Label>Horário Início</Label><Input type="time" value={editForm.startTime} onChange={e => EF('startTime', e.target.value)} /></div>
            <div><Label>Horário Fim</Label><Input type="time" value={editForm.endTime} onChange={e => EF('endTime', e.target.value)} /></div>
            <div><Label className="text-xs text-blue-700">Horas Normais</Label><Input type="number" value={editForm.normalHours} onChange={e => EF('normalHours', e.target.value)} /></div>
            <div><Label className="text-xs text-orange-600">Horas Extras</Label><Input type="number" value={editForm.overtimeHours} onChange={e => EF('overtimeHours', e.target.value)} /></div>
            <div><Label className="text-xs text-indigo-600">Horas Noturnas</Label><Input type="number" value={editForm.nightHours} onChange={e => EF('nightHours', e.target.value)} /></div>
            <div><Label>Valor Diária Base (R$)</Label><Input type="number" value={editForm.dailyRate} onChange={e => EF('dailyRate', e.target.value)} /></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={editForm.isHoliday} onCheckedChange={v => EF('isHoliday', v)} /><span className="text-xs">Feriado</span></div>
              <div className="flex items-center gap-2"><Switch checked={editForm.isWeekend} onCheckedChange={v => EF('isWeekend', v)} /><span className="text-xs">F.Semana</span></div>
            </div>

            {/* Valores Adicionais - Editáveis */}
            <div className="col-span-2 bg-amber-50/60 rounded-lg p-3">
              <Label className="text-xs text-amber-800 font-semibold mb-2 block">Valores Adicionais (R$) — Sobrescrever cálculo da proposta</Label>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-orange-600">Valor H.Extra</Label>
                  <Input type="number" step="0.01" value={editForm.overtimeValue} onChange={e => EF('overtimeValue', e.target.value)} className="mt-1" placeholder="Auto" />
                </div>
                <div>
                  <Label className="text-xs text-indigo-600">Valor Noturno</Label>
                  <Input type="number" step="0.01" value={editForm.nightValue} onChange={e => EF('nightValue', e.target.value)} className="mt-1" placeholder="Auto" />
                </div>
                <div>
                  <Label className="text-xs text-red-600">Valor Feriado</Label>
                  <Input type="number" step="0.01" value={editForm.holidayValue} onChange={e => EF('holidayValue', e.target.value)} className="mt-1" placeholder="Auto" />
                </div>
                <div>
                  <Label className="text-xs text-purple-600">Valor F.Semana</Label>
                  <Input type="number" step="0.01" value={editForm.weekendValue} onChange={e => EF('weekendValue', e.target.value)} className="mt-1" placeholder="Auto" />
                </div>
              </div>
            </div>

            <div className="col-span-2"><Label>Descrição</Label><Textarea value={editForm.description} onChange={e => EF('description', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => { setEditDlg(false); setSelectedLog(null); }}>Cancelar</Button>
            <Button onClick={saveEditLog} className="bg-blue-600 hover:bg-blue-700 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: any; label: string; value: string; sub: string; color: string; bg: string;
}) {
  return (
    <Card className={`${bg} p-3 border-0`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className={`text-[10px] font-semibold uppercase ${color} opacity-80`}>{label}</span>
      </div>
      <p className={`text-xl font-bold ${color} mt-1`}>{value}</p>
      <p className={`text-xs ${color} opacity-70`}>{sub}</p>
    </Card>
  );
}
