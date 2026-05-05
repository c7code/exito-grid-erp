import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Printer, DollarSign, Clock, Moon, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { DAILY_STATUS, fmt, fD } from './EquipmentTypes';

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

  function printReport() {
    if (!report) return;
    const r = report.rental;
    const s = report.summary;
    const logs = report.logs || [];

    const logsHtml = logs.map((log: any) => `
      <tr>
        <td>${fD(log.date)}</td>
        <td>${log.startTime || '—'}</td>
        <td>${log.endTime || '—'}</td>
        <td class="right">${Number(log.normalHours || 0).toFixed(1)}</td>
        <td class="right">${Number(log.overtimeHours || 0).toFixed(1)}</td>
        <td class="right">${Number(log.nightHours || 0).toFixed(1)}</td>
        <td class="center">${log.isHoliday ? '✓' : log.isWeekend ? 'FS' : '—'}</td>
        <td class="right">${fmt(log.totalValue)}</td>
        <td>${log.workLocation || '—'}</td>
      </tr>
    `).join('');

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
    <div>
      <h1>BOLETIM DE MEDIÇÃO</h1>
      <div class="code">${r.code}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;font-weight:700;color:#1e40af">Electraflow Engenharia</div>
      <div style="font-size:9px;color:#64748b">Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="item"><span class="label">Equipamento:</span><span class="value">${r.equipment?.name || '—'} (${r.equipment?.code || ''})</span></div>
    <div class="item"><span class="label">Cliente:</span><span class="value">${r.client?.name || '—'}</span></div>
    <div class="item"><span class="label">Operador:</span><span class="value">${r.operatorName || '—'}</span></div>
    <div class="item"><span class="label">Período:</span><span class="value">${startDate ? fD(startDate) : fD(r.startDate)} a ${endDate ? fD(endDate) : fD(r.endDate)}</span></div>
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
      <div class="sig-name">Electraflow Engenharia</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">CONTRATANTE</div>
      <div class="sig-name">${r.client?.name || '___________________'}</div>
    </div>
  </div>

  <div class="footer">
    Boletim de Medição gerado automaticamente pelo sistema Electraflow ERP • ${r.code}
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
                <Printer className="h-4 w-4 mr-1" />Imprimir / PDF
              </Button>
              <Button variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={billPeriod}>
                <DollarSign className="h-4 w-4 mr-1" />Faturar Período
              </Button>
            </>
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
                  </tr>
                </thead>
                <tbody>
                  {(report.logs || []).map((log: any) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2 font-medium">{fD(log.date)}</td>
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
                    <td colSpan={2}></td>
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
