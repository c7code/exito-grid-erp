import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileText, Printer, DollarSign, Clock, Moon, Calendar, TrendingUp, Pencil, Trash2, Eye, CalendarRange, AlertTriangle, Save, Info, Layers, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { DAILY_STATUS, fmt, fD } from './EquipmentTypes';
import { isNationalHoliday } from './holidays';

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

// Not used anymore — replaced by manual per-log date editing

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

  // Boletim selection & history
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [boletins, setBoletins] = useState<any[]>([]);
  const [showBoletimHistory, setShowBoletimHistory] = useState(true);
  const [savingBoletim, setSavingBoletim] = useState(false);

  // Boletim Adaptado (datas fictícias para faturamento)
  const [adaptedMode, setAdaptedMode] = useState(false);
  const [adaptedStart, setAdaptedStart] = useState('');
  const [adaptedEnd, setAdaptedEnd] = useState('');
  const [adaptedDates, setAdaptedDates] = useState<Record<string, string>>({});

  // Boletim detail view (expand to see dailies inside a boletim)
  const [expandedBoletimId, setExpandedBoletimId] = useState<string | null>(null);
  const [expandedBoletimLogs, setExpandedBoletimLogs] = useState<any[]>([]);

  // Edição de Boletim
  const [editBoletimDlg, setEditBoletimDlg] = useState(false);
  const [editBoletimData, setEditBoletimData] = useState<any>(null);
  const [editBoletimNotes, setEditBoletimNotes] = useState('');
  const [editBoletimStatus, setEditBoletimStatus] = useState('');

  // Medição Coletiva
  const [collectiveDlg, setCollectiveDlg] = useState(false);
  const [collectiveStartDate, setCollectiveStartDate] = useState('');
  const [collectiveEndDate, setCollectiveEndDate] = useState('');
  const [collectivePreview, setCollectivePreview] = useState<any[]>([]);
  const [collectiveSelected, setCollectiveSelected] = useState<Set<string>>(new Set());
  const [collectiveLoading, setCollectiveLoading] = useState(false);
  const [collectiveSaving, setCollectiveSaving] = useState(false);
  const [collectiveExpanded, setCollectiveExpanded] = useState<Set<string>>(new Set());
  const [collectiveAdaptedDates, setCollectiveAdaptedDates] = useState<Record<string, string>>({});

  const loadBoletins = async () => {
    if (!selectedRentalId) return;
    try {
      const data = await api.getEquipmentBoletins(selectedRentalId);
      setBoletins(Array.isArray(data) ? data : []);
    } catch { setBoletins([]); }
  };

  const measuredLogIds = useMemo(() => {
    const ids = new Set<string>();
    boletins.forEach(b => {
      const logIds = typeof b.dailyLogIds === 'string' ? JSON.parse(b.dailyLogIds || '[]') : (b.dailyLogIds || []);
      logIds.forEach((id: string) => ids.add(id));
    });
    return ids;
  }, [boletins]);

  async function loadReport() {
    if (!selectedRentalId) { toast.error('Selecione uma locação'); return; }
    try {
      setLoading(true);
      const data = await api.getMeasurementReport(selectedRentalId, startDate || undefined, endDate || undefined);
      setReport(data);
      await loadBoletins();
    } catch { toast.error('Erro ao gerar boletim'); }
    finally { setLoading(false); }
  }

  const handleSaveBoletim = async () => {
    if (selectedLogIds.size === 0) return toast.error('Selecione pelo menos uma diária');
    setSavingBoletim(true);
    try {
      await api.createEquipmentBoletim({
        rentalId: selectedRentalId,
        dailyLogIds: Array.from(selectedLogIds),
      });
      toast.success('Boletim salvo com sucesso!');
      setSelectedLogIds(new Set());
      await loadReport();
      await loadBoletins();
    } catch (err: any) {
      toast.error('Erro ao salvar boletim: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSavingBoletim(false);
    }
  };

  const handleDeleteBoletim = async (id: string) => {
    if (!confirm('Excluir este boletim? As diárias voltarão a ficar disponíveis.')) return;
    try {
      await api.deleteEquipmentBoletim(id);
      toast.success('Boletim excluído');
      await loadBoletins();
      await loadReport();
    } catch (err: any) {
      toast.error('Erro ao excluir boletim');
    }
  };

  const handlePrintBoletim = async (boletim: any) => {
    try {
      const data = await api.getEquipmentBoletim(boletim.id);
      // Use the existing printReport logic but with the boletim's logs
      const tempReport = { ...report, logs: data.logs };
      const prevReport = report;
      setReport(tempReport);
      setTimeout(() => {
        printReport();
        setReport(prevReport);
      }, 100);
    } catch {
      toast.error('Erro ao carregar boletim para impressão');
    }
  };

  // Expand/collapse boletim to see its dailies with internal control info
  const handleToggleBoletimDetail = async (boletimId: string) => {
    if (expandedBoletimId === boletimId) {
      setExpandedBoletimId(null);
      setExpandedBoletimLogs([]);
      return;
    }
    try {
      const data = await api.getEquipmentBoletim(boletimId);
      setExpandedBoletimLogs(data.logs || []);
      setExpandedBoletimId(boletimId);
    } catch {
      toast.error('Erro ao carregar diárias do boletim');
    }
  };

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

  // ─── Edição de Boletim ───
  function openEditBoletim(boletim: any) {
    setEditBoletimData(boletim);
    setEditBoletimNotes(boletim.notes || '');
    setEditBoletimStatus(boletim.status || 'generated');
    setEditBoletimDlg(true);
  }

  async function saveEditBoletim() {
    if (!editBoletimData) return;
    try {
      await api.updateEquipmentBoletim(editBoletimData.id, {
        notes: editBoletimNotes,
        status: editBoletimStatus,
      });
      toast.success('Boletim atualizado!');
      setEditBoletimDlg(false);
      setEditBoletimData(null);
      await loadBoletins();
    } catch (err: any) {
      toast.error('Erro ao atualizar boletim: ' + (err?.response?.data?.message || err.message));
    }
  }

  // ─── Medição Coletiva ───
  async function loadCollectivePreview() {
    if (!collectiveStartDate || !collectiveEndDate) {
      toast.error('Informe o período (data início e fim)');
      return;
    }
    setCollectiveLoading(true);
    try {
      const data = await api.getCollectiveMeasurementPreview(collectiveStartDate, collectiveEndDate);
      setCollectivePreview(Array.isArray(data) ? data : []);
      setCollectiveSelected(new Set(data.map((d: any) => d.rental.id)));
    } catch (err: any) {
      toast.error('Erro ao carregar preview: ' + (err?.response?.data?.message || err.message));
    } finally {
      setCollectiveLoading(false);
    }
  }

  async function generateCollectiveBoletins() {
    const selectedItems = collectivePreview.filter(p => collectiveSelected.has(p.rental.id));
    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos uma locação');
      return;
    }
    setCollectiveSaving(true);
    try {
      // First, save any adapted dates
      const dateEntries = Object.entries(collectiveAdaptedDates);
      if (dateEntries.length > 0) {
        for (const [logId, newDate] of dateEntries) {
          if (newDate) {
            await api.updateEquipmentDailyLog(logId, { date: newDate });
          }
        }
      }

      const items = selectedItems.map(p => ({
        rentalId: p.rental.id,
        dailyLogIds: p.dailyLogIds,
      }));
      const results = await api.createCollectiveBoletins(items);
      toast.success(`${results.length} boletim(ns) gerado(s) com sucesso!`);
      setCollectiveDlg(false);
      setCollectivePreview([]);
      setCollectiveSelected(new Set());
      setCollectiveExpanded(new Set());
      setCollectiveAdaptedDates({});
      reload();
      if (selectedRentalId) {
        await loadReport();
        await loadBoletins();
      }
    } catch (err: any) {
      toast.error('Erro ao gerar boletins: ' + (err?.response?.data?.message || err.message));
    } finally {
      setCollectiveSaving(false);
    }
  }

  function toggleCollectiveExpand(rentalId: string) {
    const s = new Set(collectiveExpanded);
    if (s.has(rentalId)) s.delete(rentalId);
    else s.add(rentalId);
    setCollectiveExpanded(s);
  }

  function setCollectiveLogDate(logId: string, newDate: string) {
    setCollectiveAdaptedDates(prev => ({ ...prev, [logId]: newDate }));
  }

  const EF = (field: string, val: any) => setEditForm(prev => ({ ...prev, [field]: val }));

  async function printReport() {
    if (!report) return;
    const r = report.rental;
    const isAdapted = adaptedMode && adaptedStart && adaptedEnd;
    const adaptedDatesMap = new Map<string, string>();
    if (isAdapted) {
      Object.entries(adaptedDates).forEach(([logId, date]) => {
        if (date) adaptedDatesMap.set(logId, date);
      });
    }

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
    const allLogs = report.logs || [];
    const logs = selectedLogIds.size > 0
      ? allLogs.filter((l: any) => selectedLogIds.has(l.id))
      : allLogs;

    const logsHtml = logs.map((log: any) => {
      const displayDate = isAdapted && adaptedDatesMap.has(log.id) ? fD(adaptedDatesMap.get(log.id)!) : fD(log.date);
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
        <div className="flex gap-2 mt-3 flex-wrap items-center">
          <Button onClick={loadReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <TrendingUp className="h-4 w-4 mr-1" />}
            Carregar Diárias
          </Button>
          <Button variant="outline" className="text-purple-700 border-purple-300 hover:bg-purple-50" onClick={() => setCollectiveDlg(true)}>
            <Layers className="h-4 w-4 mr-1" />Medição Coletiva
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
          {selectedLogIds.size > 0 && (
            <>
              <span className="text-xs text-slate-500 ml-2">{selectedLogIds.size} selecionada(s)</span>
              <Button onClick={handleSaveBoletim} disabled={savingBoletim} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4 mr-1" />
                Salvar Boletim ({selectedLogIds.size} diária{selectedLogIds.size > 1 ? 's' : ''})
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
                    <th className="w-8 px-2 py-2.5">
                      <input
                        type="checkbox"
                        checked={report?.logs?.filter((l: any) => !measuredLogIds.has(l.id)).length > 0 &&
                          report?.logs?.filter((l: any) => !measuredLogIds.has(l.id)).every((l: any) => selectedLogIds.has(l.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSet = new Set(selectedLogIds);
                            report?.logs?.filter((l: any) => !measuredLogIds.has(l.id)).forEach((l: any) => newSet.add(l.id));
                            setSelectedLogIds(newSet);
                          } else {
                            setSelectedLogIds(new Set());
                          }
                        }}
                        className="rounded"
                      />
                    </th>
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
                    <tr key={log.id} className={`border-b hover:bg-slate-50/60 transition-colors ${measuredLogIds.has(log.id) ? 'opacity-60' : ''}`}>
                      <td className="px-2 py-2 text-center">
                        {measuredLogIds.has(log.id) ? (
                          <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">
                            Medido
                          </Badge>
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedLogIds.has(log.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedLogIds);
                              if (e.target.checked) newSet.add(log.id);
                              else newSet.delete(log.id);
                              setSelectedLogIds(newSet);
                            }}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium">
                        <div className="flex items-center gap-1.5">
                          {fD(log.date)}
                          {log.originalDate && safeDate(log.originalDate) !== safeDate(log.date) && (
                            <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 bg-amber-50 ml-1">
                              <AlertTriangle className="h-3 w-3 mr-0.5" />Ajustada
                            </Badge>
                          )}
                        </div>
                        {log.createdAt && (
                          <span className="block text-[10px] text-slate-400">📝 Reg: {new Date(log.createdAt).toLocaleDateString('pt-BR')} {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {log.originalDate && safeDate(log.originalDate) !== safeDate(log.date) && (
                              <span className="text-amber-600 font-medium"> • Data original: {fD(log.originalDate)}</span>
                            )}
                          </span>
                        )}
                        {isNationalHoliday(safeDate(log.date)) && (
                          <span className="block text-[10px] text-red-500">🎉 {isNationalHoliday(safeDate(log.date))!.name}</span>
                        )}
                        {adaptedMode && (
                          <div className="mt-1">
                            <Input
                              type="date"
                              className="h-7 text-xs border-amber-300 bg-amber-50"
                              value={adaptedDates[log.id] || ''}
                              onChange={e => setAdaptedDates(prev => ({ ...prev, [log.id]: e.target.value }))}
                              placeholder="Data adaptada"
                            />
                          </div>
                        )}
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
                    <td></td>
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

          {/* Histórico de Boletins */}
          {boletins.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Boletins Salvos ({boletins.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowBoletimHistory(!showBoletimHistory)}>
                  {showBoletimHistory ? 'Ocultar' : 'Ver Histórico'}
                </Button>
              </div>
              {showBoletimHistory && (
                <div className="space-y-2">
                  {boletins.map((b: any) => {
                    const logIds = typeof b.dailyLogIds === 'string' ? JSON.parse(b.dailyLogIds || '[]') : (b.dailyLogIds || []);
                    const isExpanded = expandedBoletimId === b.id;
                    // Count adjusted dailies in expanded logs
                    const adjustedCount = isExpanded
                      ? expandedBoletimLogs.filter((l: any) => l.originalDate && safeDate(l.originalDate) !== safeDate(l.date)).length
                      : 0;
                    return (
                      <div key={b.id} className="bg-gray-50 rounded-lg border overflow-hidden">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">Boletim #{b.boletimNumber}</span>
                              <span className="text-xs text-gray-500">
                                {b.periodStart && new Date(b.periodStart).toLocaleDateString('pt-BR')} — {b.periodEnd && new Date(b.periodEnd).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({logIds.length} diária{logIds.length > 1 ? 's' : ''})
                              </span>
                              {isExpanded && adjustedCount > 0 && (
                                <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 bg-amber-50">
                                  <AlertTriangle className="h-3 w-3 mr-0.5" />{adjustedCount} com data ajustada
                                </Badge>
                              )}
                            </div>
                            {b.createdAt && (
                              <span className="block text-[10px] text-slate-400 mt-0.5">
                                📝 Gerado em: {new Date(b.createdAt).toLocaleDateString('pt-BR')} às {new Date(b.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[9px] ${b.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : b.status === 'billed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                              {b.status === 'approved' ? 'Aprovado' : b.status === 'billed' ? 'Faturado' : 'Gerado'}
                            </Badge>
                            <span className="text-sm font-semibold text-green-700">
                              R$ {Number(b.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleBoletimDetail(b.id)} title="Ver diárias">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditBoletim(b)} title="Editar boletim">
                              <Pencil className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handlePrintBoletim(b)}>
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteBoletim(b.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded: show dailies inside this boletim with internal control */}
                        {isExpanded && (
                          <div className="border-t bg-white">
                            <div className="px-3 py-2 bg-blue-50 border-b flex items-center gap-2">
                              <Info className="h-3.5 w-3.5 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-700">Controle Interno — Diárias deste Boletim</span>
                              {adjustedCount > 0 && (
                                <span className="text-[10px] text-amber-600 font-medium ml-auto">⚠️ {adjustedCount} diária{adjustedCount > 1 ? 's' : ''} com data ajustada para medição</span>
                              )}
                            </div>
                            <div className="divide-y">
                              {expandedBoletimLogs.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((log: any) => {
                                const hasAdjustedDate = log.originalDate && safeDate(log.originalDate) !== safeDate(log.date);
                                return (
                                  <div key={log.id} className={`px-4 py-2.5 text-sm flex items-start gap-3 ${hasAdjustedDate ? 'bg-amber-50/50' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">{fD(log.date)}</span>
                                        {log.startTime && log.endTime && (
                                          <span className="text-xs text-slate-500">{log.startTime} - {log.endTime}</span>
                                        )}
                                        <span className="text-xs text-slate-500">{Number(log.normalHours || 0).toFixed(1)}h normal</span>
                                        {Number(log.overtimeHours || 0) > 0 && (
                                          <span className="text-xs text-orange-600">{Number(log.overtimeHours).toFixed(1)}h extra</span>
                                        )}
                                        {hasAdjustedDate && (
                                          <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 bg-amber-50">
                                            <AlertTriangle className="h-3 w-3 mr-0.5" />Data ajustada p/ medição
                                          </Badge>
                                        )}
                                      </div>
                                      {log.createdAt && (
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                          📝 Registrado no sistema em: {new Date(log.createdAt).toLocaleDateString('pt-BR')} às {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                          {hasAdjustedDate && (
                                            <span className="text-amber-600 font-medium"> → Data original: {fD(log.originalDate)} → Ajustada para: {fD(log.date)}</span>
                                          )}
                                        </p>
                                      )}
                                      {log.workLocation && (
                                        <p className="text-[10px] text-slate-400">📍 {log.workLocation}</p>
                                      )}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 shrink-0">{fmt(log.totalValue)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

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
              <div><span className="text-slate-400">Data da Diária:</span> <strong>{fD(selectedLog.date)}</strong></div>
              <div><span className="text-slate-400">Horário:</span> {selectedLog.startTime || '—'} - {selectedLog.endTime || '—'}</div>
              {/* Controle Interno: Data de Registro */}
              <div className="col-span-2 bg-slate-50 rounded-lg p-2.5 border">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-600">Controle Interno</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Registrado no sistema em:</span>
                    <span className="text-xs font-medium">
                      {selectedLog.createdAt
                        ? `${new Date(selectedLog.createdAt).toLocaleDateString('pt-BR')} às ${new Date(selectedLog.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Data informada p/ medição:</span>
                    <span className="text-xs font-medium">{fD(selectedLog.date)}</span>
                  </div>
                </div>
                {selectedLog.originalDate && safeDate(selectedLog.originalDate) !== safeDate(selectedLog.date) && (
                  <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-amber-50 rounded border border-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="text-[10px] text-amber-700 font-medium">
                      Data ajustada para medição: original era {fD(selectedLog.originalDate)}, alterada para {fD(selectedLog.date)}
                    </span>
                  </div>
                )}
              </div>
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

      {/* Edit Boletim Dialog */}
      <Dialog open={editBoletimDlg} onOpenChange={v => { if (!v) { setEditBoletimDlg(false); setEditBoletimData(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Boletim #{editBoletimData?.boletimNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Status</Label>
              <Select value={editBoletimStatus} onValueChange={setEditBoletimStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="generated">Gerado</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="billed">Faturado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={editBoletimNotes} onChange={e => setEditBoletimNotes(e.target.value)} rows={3} placeholder="Observações sobre o boletim..." />
            </div>
            {editBoletimData && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Período:</span>
                  <span>{editBoletimData.periodStart ? fD(editBoletimData.periodStart) : '—'} a {editBoletimData.periodEnd ? fD(editBoletimData.periodEnd) : '—'}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Diárias:</span>
                  <span>{(editBoletimData.dailyLogIds || []).length}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Total:</span>
                  <strong className="text-green-700">{fmt(editBoletimData.totalValue)}</strong>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => { setEditBoletimDlg(false); setEditBoletimData(null); }}>Cancelar</Button>
            <Button onClick={saveEditBoletim} className="bg-blue-600 hover:bg-blue-700 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collective Measurement Dialog */}
      <Dialog open={collectiveDlg} onOpenChange={v => { if (!v) { setCollectiveDlg(false); setCollectivePreview([]); setCollectiveSelected(new Set()); } }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              Medição Coletiva
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Period Selection */}
            <div className="grid grid-cols-3 gap-3 items-end">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={collectiveStartDate} onChange={e => setCollectiveStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={collectiveEndDate} onChange={e => setCollectiveEndDate(e.target.value)} />
              </div>
              <Button onClick={loadCollectivePreview} disabled={collectiveLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                {collectiveLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <TrendingUp className="h-4 w-4 mr-1" />}
                Carregar
              </Button>
            </div>

            {/* Preview Results */}
            {collectivePreview.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    <strong>{collectivePreview.length}</strong> locação(ões) com diárias não medidas no período
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setCollectiveSelected(new Set(collectivePreview.map(p => p.rental.id)))}>
                      Selecionar Todos
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCollectiveSelected(new Set())}>
                      Limpar
                    </Button>
                  </div>
                </div>

                {/* Adapted dates info */}
                {Object.keys(collectiveAdaptedDates).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Datas adaptadas para faturamento</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        {Object.keys(collectiveAdaptedDates).length} diária(s) com data alterada. As datas originais serão preservadas no controle interno.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {collectivePreview.map((item: any) => (
                    <div
                      key={item.rental.id}
                      className={`border rounded-lg transition-all ${collectiveSelected.has(item.rental.id) ? 'border-purple-400 bg-purple-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      {/* Rental header */}
                      <div
                        className="flex items-start justify-between p-3 cursor-pointer"
                        onClick={() => {
                          const s = new Set(collectiveSelected);
                          if (s.has(item.rental.id)) s.delete(item.rental.id);
                          else s.add(item.rental.id);
                          setCollectiveSelected(s);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={collectiveSelected.has(item.rental.id)}
                            onChange={() => {}}
                            className="mt-1 rounded"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{item.rental.code}</span>
                              <span className="text-xs text-slate-500">{item.rental.equipmentName}</span>
                              {item.rental.operatorName && (
                                <Badge variant="outline" className="text-[10px]">👷 {item.rental.operatorName}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{item.rental.clientName}</p>
                            {item.rental.deliveryCity && (
                              <p className="text-[10px] text-slate-400">📍 {item.rental.deliveryCity}</p>
                            )}
                            {item.rental.cnpjFaturamento && (
                              <p className="text-[10px] text-slate-400">🏢 CNPJ Faturamento: {item.rental.cnpjFaturamento}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-green-700">{fmt(item.totalValue)}</p>
                            <p className="text-xs text-slate-500">{item.totalDays} diária(s)</p>
                            <p className="text-xs text-slate-400">{item.totalHours.toFixed(1)}h total</p>
                          </div>
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => { e.stopPropagation(); toggleCollectiveExpand(item.rental.id); }}
                            title="Ver/editar diárias"
                          >
                            <CalendarRange className="h-3.5 w-3.5 mr-1" />
                            {collectiveExpanded.has(item.rental.id) ? 'Ocultar' : 'Datas'}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded daily logs with date editing */}
                      {collectiveExpanded.has(item.rental.id) && item.dailyLogs && (
                        <div className="border-t bg-white px-3 pb-3">
                          <div className="flex items-center gap-2 py-2 mb-1">
                            <CalendarRange className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-[10px] font-semibold text-amber-700 uppercase">Editar datas para faturamento (datas originais preservadas)</span>
                          </div>
                          <div className="space-y-1">
                            {item.dailyLogs.map((log: any) => {
                              const origDate = safeDate(log.originalDate || log.date);
                              const currentDate = collectiveAdaptedDates[log.id] || safeDate(log.date);
                              const isAdapted = collectiveAdaptedDates[log.id] && collectiveAdaptedDates[log.id] !== origDate;
                              return (
                                <div key={log.id} className={`flex items-center gap-3 py-1.5 px-2 rounded text-xs ${isAdapted ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Input
                                      type="date"
                                      className="h-7 text-xs w-[140px]"
                                      value={currentDate}
                                      onChange={e => setCollectiveLogDate(log.id, e.target.value)}
                                    />
                                    {isAdapted && (
                                      <span className="text-[10px] text-amber-600 whitespace-nowrap">
                                        (orig: {fD(origDate)})
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-slate-500 whitespace-nowrap">{Number(log.normalHours || 0).toFixed(1)}h</span>
                                  <span className="font-medium text-green-700 whitespace-nowrap">{fmt(log.totalValue)}</span>
                                  {log.description && (
                                    <span className="text-slate-400 truncate max-w-[120px]" title={log.description}>{log.description}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-purple-800">
                        {collectiveSelected.size} locação(ões) selecionada(s)
                      </p>
                      <p className="text-xs text-purple-600">
                        {collectivePreview.filter(p => collectiveSelected.has(p.rental.id)).reduce((s, p) => s + p.totalDays, 0)} diária(s) total
                        {Object.keys(collectiveAdaptedDates).length > 0 && (
                          <span className="text-amber-600 ml-2">• {Object.keys(collectiveAdaptedDates).length} data(s) adaptada(s)</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-800">
                        {fmt(collectivePreview.filter(p => collectiveSelected.has(p.rental.id)).reduce((s, p) => s + p.totalValue, 0))}
                      </p>
                      <p className="text-[10px] text-purple-500">Valor total dos boletins</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {collectivePreview.length === 0 && !collectiveLoading && collectiveStartDate && collectiveEndDate && (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                <p className="font-medium">Nenhuma diária não medida encontrada no período</p>
                <p className="text-xs mt-1">Todas as diárias do período já foram incluídas em boletins</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setCollectiveDlg(false); setCollectivePreview([]); }}>
              Cancelar
            </Button>
            <Button
              onClick={generateCollectiveBoletins}
              disabled={collectiveSaving || collectiveSelected.size === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {collectiveSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckSquare className="h-4 w-4 mr-1" />}
              Gerar {collectiveSelected.size} Boletim(ns) Individual(is)
            </Button>
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
