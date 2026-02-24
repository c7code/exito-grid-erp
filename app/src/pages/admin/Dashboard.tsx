import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2, ClipboardList, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, ArrowRight, Plus, Users, Shield,
  AlertTriangle, Target, Award, Percent, Activity, BarChart3,
  FileText, MapPin, Briefcase, Zap, Eye, Calendar, Filter, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '@/api';
import { toast } from 'sonner';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (v: number) => v >= 1000000 ? `R$${(v / 1_000_000).toFixed(1)}M` : `R$${(v / 1000).toFixed(0)}k`;

const STATUS_COLORS: Record<string, string> = {
  in_progress: '#3b82f6', completed: '#10b981', pending: '#f59e0b',
  cancelled: '#ef4444', draft: '#94a3b8', on_hold: '#f97316',
  waiting_utility: '#fb923c', waiting_client: '#a855f7',
};
const STATUS_LABELS: Record<string, string> = {
  in_progress: 'Em Andamento', completed: 'Concluída', pending: 'Pendente',
  cancelled: 'Cancelada', draft: 'Rascunho', on_hold: 'Pausada',
  waiting_utility: 'Aguard. Concessionária', waiting_client: 'Aguard. Cliente',
};
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#f97316', '#94a3b8', '#06b6d4'];
const REQUIRED_DOCS = ['aso', 'nr10', 'nr35', 'cpf_rg', 'contract'];
const BR_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_3', label: 'Últimos 3 Meses' },
  { value: 'last_6', label: 'Últimos 6 Meses' },
  { value: 'this_year', label: 'Este Ano' },
  { value: 'all', label: 'Todo Período' },
];

// ── Filter Chip ───────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${active
        ? 'bg-amber-500 text-slate-900 shadow-sm'
        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        }`}
    >
      {label}
    </button>
  );
}

// ── Mini KPI Card ─────────────────────────────────────────────────────────
function KPI({ icon: Icon, label, value, sub, color = 'text-slate-700', accent = 'bg-slate-100', iconColor = 'text-slate-500', trend, trendUp }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; accent?: string; iconColor?: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${accent}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{label}</p>
          {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
          {trend && (
            <p className={`text-[10px] flex items-center gap-0.5 font-semibold mt-0.5 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {trend}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Main Component ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  // ── RAW DATA ────────────────────────────────────────────────────────
  const [works, setWorks] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── FILTERS ─────────────────────────────────────────────────────────
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEmpType, setFilterEmpType] = useState('all');
  const [filterWorkType, setFilterWorkType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [filterPeriod, filterState, filterStatus, filterEmpType, filterWorkType].filter(f => f !== 'all').length;

  const clearFilters = () => { setFilterPeriod('all'); setFilterState('all'); setFilterStatus('all'); setFilterEmpType('all'); setFilterWorkType('all'); };

  // ── FETCH ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [w, t, e, p, pr, py, c] = await Promise.allSettled([
          api.getWorks(), api.getTasks(), api.getEmployees(),
          api.getProposals(), api.getProtocols(), api.getPayments(), api.getClients(),
        ]);
        setWorks(w.status === 'fulfilled' ? (Array.isArray(w.value) ? w.value : w.value?.data ?? []) : []);
        setTasks(t.status === 'fulfilled' ? (Array.isArray(t.value) ? t.value : t.value?.data ?? []) : []);
        setEmployees(e.status === 'fulfilled' ? (Array.isArray(e.value) ? e.value : e.value?.data ?? []) : []);
        setProposals(p.status === 'fulfilled' ? (Array.isArray(p.value) ? p.value : p.value?.data ?? []) : []);
        setProtocols(pr.status === 'fulfilled' ? (Array.isArray(pr.value) ? pr.value : pr.value?.data ?? []) : []);
        setPayments(py.status === 'fulfilled' ? (Array.isArray(py.value) ? py.value : py.value?.data ?? []) : []);
        setClients(c.status === 'fulfilled' ? (Array.isArray(c.value) ? c.value : c.value?.data ?? []) : []);
      } catch { toast.error('Erro ao carregar dashboard'); }
      finally { setLoading(false); }
    })();
  }, []);

  // ── Available filter options (dynamic) ──────────────────────────────
  const availableStates = useMemo(() => {
    const s = new Set<string>();
    works.forEach(w => { if (w.state) s.add(w.state); });
    employees.forEach(e => { if (e.state) s.add(e.state); });
    return Array.from(s).sort();
  }, [works, employees]);

  const availableStatuses = useMemo(() => {
    const s = new Set<string>();
    works.forEach(w => { if (w.status) s.add(w.status); });
    return Array.from(s);
  }, [works]);

  const availableWorkTypes = useMemo(() => {
    const s = new Set<string>();
    works.forEach(w => { if (w.type) s.add(w.type); });
    return Array.from(s);
  }, [works]);

  // ── FILTERED DATA ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Period range
    let periodStart: Date | null = null;
    if (filterPeriod === 'this_month') { periodStart = new Date(thisYear, thisMonth, 1); }
    else if (filterPeriod === 'last_3') { periodStart = new Date(thisYear, thisMonth - 2, 1); }
    else if (filterPeriod === 'last_6') { periodStart = new Date(thisYear, thisMonth - 5, 1); }
    else if (filterPeriod === 'this_year') { periodStart = new Date(thisYear, 0, 1); }

    const inPeriod = (dateStr: string) => {
      if (!periodStart) return true;
      return new Date(dateStr) >= periodStart;
    };

    const fWorks = works.filter(w => {
      if (!inPeriod(w.createdAt)) return false;
      if (filterState !== 'all' && w.state !== filterState) return false;
      if (filterStatus !== 'all' && w.status !== filterStatus) return false;
      if (filterWorkType !== 'all' && w.type !== filterWorkType) return false;
      return true;
    });

    const workIds = new Set(fWorks.map(w => w.id));

    const fTasks = tasks.filter(t => {
      if (t.workId && !workIds.has(t.workId)) return false;
      if (!inPeriod(t.createdAt)) return false;
      return true;
    });

    const fPayments = payments.filter(p => {
      if (p.workId && !workIds.has(p.workId)) return false;
      if (!inPeriod(p.createdAt)) return false;
      return true;
    });

    const fProposals = proposals.filter(p => inPeriod(p.createdAt));
    const fProtocols = protocols.filter(p => {
      if (p.workId && !workIds.has(p.workId)) return false;
      if (!inPeriod(p.createdAt)) return false;
      return true;
    });

    const fEmployees = employees.filter(e => {
      if (filterState !== 'all' && e.state && e.state !== filterState) return false;
      if (filterEmpType !== 'all' && (e.employmentType || 'clt') !== filterEmpType) return false;
      return true;
    });

    const fClients = filterState !== 'all' ? clients.filter(c => c.state === filterState) : clients;

    return { works: fWorks, tasks: fTasks, employees: fEmployees, proposals: fProposals, protocols: fProtocols, payments: fPayments, clients: fClients };
  }, [works, tasks, employees, proposals, protocols, payments, clients, filterPeriod, filterState, filterStatus, filterEmpType, filterWorkType]);

  // ── Computed KPIs (from filtered data) ──────────────────────────────
  const kpis = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const fw = filtered.works;
    const ft = filtered.tasks;
    const fe = filtered.employees;
    const fp = filtered.proposals;
    const fpr = filtered.protocols;
    const fpy = filtered.payments;
    const fc = filtered.clients;

    // Works
    const activeWorks = fw.filter(w => ['in_progress', 'pending', 'on_hold', 'waiting_utility', 'waiting_client'].includes(w.status));
    const completedWorks = fw.filter(w => w.status === 'completed');
    const worksThisMonth = fw.filter(w => { const d = new Date(w.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });

    // Financial
    const totalRevenue = fw.reduce((s, w) => s + Number(w.totalValue || 0), 0);
    const totalCost = fw.reduce((s, w) => s + Number(w.cost || 0), 0);
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
    const avgMarginPerWork = completedWorks.length > 0
      ? completedWorks.reduce((s, w) => { const v = Number(w.totalValue || 0); const c = Number(w.cost || 0); return s + (v > 0 ? ((v - c) / v) * 100 : 0); }, 0) / completedWorks.length : 0;
    const worksOverBudget = fw.filter(w => Number(w.cost || 0) > Number(w.totalValue || 0) && Number(w.totalValue || 0) > 0);
    const worksWithinBudget = fw.filter(w => Number(w.cost || 0) <= Number(w.totalValue || 0) && Number(w.totalValue || 0) > 0);

    // Payments
    const paidPayments = fpy.filter(p => p.status === 'paid');
    const totalReceived = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const pendingPayments = fpy.filter(p => p.status !== 'paid' && p.status !== 'cancelled');
    const totalPending = pendingPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const overduePayments = pendingPayments.filter(p => p.dueDate && new Date(p.dueDate) < now);

    // Tasks
    const pendingTasks = ft.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
    const completedTasksCount = ft.filter(t => t.status === 'completed').length;
    const taskCompletionRate = ft.length > 0 ? (completedTasksCount / ft.length) * 100 : 0;

    // Employees
    const activeEmps = fe.filter(e => e.status === 'active');
    const cltEmps = fe.filter(e => (e.employmentType || 'clt') === 'clt');
    const contractEmps = fe.filter(e => e.employmentType === 'contract');
    const outsourcedEmps = fe.filter(e => e.employmentType === 'outsourced');

    // Doc compliance
    const empsWithDocs = fe.map(e => {
      const docs = e.documents || [];
      const hasAll = REQUIRED_DOCS.every(rt => docs.some((d: any) => d.type === rt));
      const expired = docs.filter((d: any) => d.expiryDate && new Date(d.expiryDate) < now);
      const expiring30 = docs.filter((d: any) => { if (!d.expiryDate) return false; const diff = (new Date(d.expiryDate).getTime() - now.getTime()) / 86400000; return diff > 0 && diff <= 30; });
      return { ...e, hasAllDocs: hasAll, expiredDocs: expired, expiringDocs: expiring30, docCount: docs.length };
    });
    const compliantEmps = empsWithDocs.filter(e => e.hasAllDocs && e.expiredDocs.length === 0 && activeEmps.some(ae => ae.id === e.id));
    const complianceRate = activeEmps.length > 0 ? (compliantEmps.length / activeEmps.length) * 100 : 0;
    const totalExpiredDocs = empsWithDocs.reduce((s, e) => s + e.expiredDocs.length, 0);
    const totalExpiringDocs = empsWithDocs.reduce((s, e) => s + e.expiringDocs.length, 0);

    // Proposals
    const openProposals = fp.filter(p => p.status === 'draft' || p.status === 'sent');
    const acceptedProposals = fp.filter(p => p.status === 'accepted');
    const conversionRate = fp.length > 0 ? (acceptedProposals.length / fp.length) * 100 : 0;
    const pipelineValue = openProposals.reduce((s, p) => s + Number(p.totalValue || p.value || 0), 0);

    // Protocols
    const pendingProtocols = fpr.filter(p => p.status === 'pending' || p.status === 'in_progress');

    // SLA
    const worksWithDeadline = completedWorks.filter(w => w.deadline || w.expectedEndDate);
    const onTimeDeliveries = worksWithDeadline.filter(w => {
      const dl = new Date(w.deadline || w.expectedEndDate);
      const act = new Date(w.actualEndDate || w.updatedAt);
      return act <= dl;
    });
    const slaRate = worksWithDeadline.length > 0 ? (onTimeDeliveries.length / worksWithDeadline.length) * 100 : 100;

    // Revenue per employee
    const revenuePerEmp = activeEmps.length > 0 ? totalRevenue / activeEmps.length : 0;

    // Status chart
    const statusCounts: Record<string, number> = {};
    fw.forEach(w => { statusCounts[w.status] = (statusCounts[w.status] || 0) + 1; });
    const statusChartData = Object.entries(statusCounts).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v, color: STATUS_COLORS[k] || '#94a3b8' }));

    // Monthly revenue
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData: Record<string, { revenue: number; cost: number; count: number }> = {};
    fw.forEach(w => {
      const d = new Date(w.createdAt);
      if (d.getFullYear() === thisYear) {
        const m = months[d.getMonth()];
        if (!monthlyData[m]) monthlyData[m] = { revenue: 0, cost: 0, count: 0 };
        monthlyData[m].revenue += Number(w.totalValue || 0);
        monthlyData[m].cost += Number(w.cost || 0);
        monthlyData[m].count += 1;
      }
    });
    const revenueChartData = months.slice(0, thisMonth + 1).map(m => ({
      month: m, receita: monthlyData[m]?.revenue || 0, custo: monthlyData[m]?.cost || 0, obras: monthlyData[m]?.count || 0,
    }));

    // Margin per work top 10
    const marginPerWork = fw
      .filter(w => Number(w.totalValue || 0) > 0)
      .map(w => ({
        name: (w.title?.slice(0, 25) || w.code || 'S/N'),
        margin: ((Number(w.totalValue || 0) - Number(w.cost || 0)) / Number(w.totalValue || 0)) * 100,
        value: Number(w.totalValue || 0), cost: Number(w.cost || 0),
      }))
      .sort((a, b) => b.margin - a.margin).slice(0, 10);

    // State chart
    const byState: Record<string, number> = {};
    fw.forEach(w => { const s = w.state || 'N/I'; byState[s] = (byState[s] || 0) + 1; });
    const stateChartData = Object.entries(byState).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    return {
      totalWorks: fw.length, activeWorks: activeWorks.length, completedWorks: completedWorks.length,
      worksThisMonth: worksThisMonth.length, worksOverBudget: worksOverBudget.length, worksWithinBudget: worksWithinBudget.length,
      totalRevenue, totalCost, grossMargin, avgMarginPerWork, totalReceived, totalPending,
      overduePayments: overduePayments.length,
      pendingTasksCount: pendingTasks.length, overdueTasks: overdueTasks.length, taskCompletionRate,
      totalEmps: fe.length, activeEmps: activeEmps.length,
      cltEmps: cltEmps.length, contractEmps: contractEmps.length, outsourcedEmps: outsourcedEmps.length,
      complianceRate, totalExpiredDocs, totalExpiringDocs,
      openProposals: openProposals.length, conversionRate, pipelineValue,
      pendingProtocols: pendingProtocols.length, slaRate, revenuePerEmp,
      totalClients: fc.length, acceptedProposals: acceptedProposals.length,
      empsWithDocs, statusChartData, revenueChartData, marginPerWork, stateChartData,
      pendingTasks: pendingTasks.sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()).slice(0, 8),
      recentWorks: [...fw].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6),
      alertEmployees: empsWithDocs.filter(e => e.expiredDocs.length > 0 || !e.hasAllDocs).slice(0, 6),
    };
  }, [filtered]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 text-slate-500">Carregando dashboard...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-xl md:text-2xl font-bold text-slate-900">Dashboard Operacional</h1>
          <p className="text-sm text-slate-500">Visão completa da operação — EXITO Engenharia</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Filtros</span><span className="sm:hidden">Filtrar</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-[10px] text-slate-900 font-bold flex items-center justify-center">{activeFilterCount}</span>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild><Link to="/admin/works"><Eye className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Ver Obras</span></Link></Button>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900" asChild>
            <Link to="/admin/works"><Plus className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Nova Obra</span></Link>
          </Button>
        </div>
      </div>

      {/* ── FILTER BAR ─────────────────────────────────────────────── */}
      {showFilters && (
        <Card className="border-amber-200 bg-amber-50/30 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-sm text-slate-700">Filtros Segmentados</span>
                {activeFilterCount > 0 && (
                  <Badge className="bg-amber-500 text-slate-900 text-[10px]">{activeFilterCount} ativo(s)</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600">
                    <X className="w-3 h-3 mr-1" />Limpar Filtros
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)} className="w-7 h-7">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Period */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Período</p>
              <div className="flex flex-wrap gap-2">
                {PERIOD_OPTIONS.map(o => (
                  <Chip key={o.value} label={o.label} active={filterPeriod === o.value} onClick={() => setFilterPeriod(o.value)} />
                ))}
              </div>
            </div>

            {/* State */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Estado (UF)</p>
              <div className="flex flex-wrap gap-2">
                <Chip label="Todos" active={filterState === 'all'} onClick={() => setFilterState('all')} />
                {availableStates.length > 0 ? availableStates.map(s => (
                  <Chip key={s} label={s} active={filterState === s} onClick={() => setFilterState(s)} />
                )) : BR_STATES.slice(0, 10).map(s => (
                  <Chip key={s} label={s} active={filterState === s} onClick={() => setFilterState(s)} />
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Status da Obra</p>
              <div className="flex flex-wrap gap-2">
                <Chip label="Todos" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
                {availableStatuses.map(s => (
                  <Chip key={s} label={STATUS_LABELS[s] || s} active={filterStatus === s} onClick={() => setFilterStatus(s)} />
                ))}
              </div>
            </div>

            {/* Work Type */}
            {availableWorkTypes.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Tipo de Obra</p>
                <div className="flex flex-wrap gap-2">
                  <Chip label="Todos" active={filterWorkType === 'all'} onClick={() => setFilterWorkType('all')} />
                  {availableWorkTypes.map(t => (
                    <Chip key={t} label={t} active={filterWorkType === t} onClick={() => setFilterWorkType(t)} />
                  ))}
                </div>
              </div>
            )}

            {/* Employment Type */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Tipo de Colaborador</p>
              <div className="flex flex-wrap gap-2">
                <Chip label="Todos" active={filterEmpType === 'all'} onClick={() => setFilterEmpType('all')} />
                <Chip label="CLT (Fixo)" active={filterEmpType === 'clt'} onClick={() => setFilterEmpType('clt')} />
                <Chip label="Empreiteiro" active={filterEmpType === 'contract'} onClick={() => setFilterEmpType('contract')} />
                <Chip label="Pontual" active={filterEmpType === 'outsourced'} onClick={() => setFilterEmpType('outsourced')} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active filter summary ──────────────────────────────────── */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs text-slate-500 font-semibold">Filtros:</span>
          {filterPeriod !== 'all' && <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-300">{PERIOD_OPTIONS.find(p => p.value === filterPeriod)?.label}</Badge>}
          {filterState !== 'all' && <Badge variant="outline" className="text-[10px] bg-blue-50 border-blue-300">UF: {filterState}</Badge>}
          {filterStatus !== 'all' && <Badge variant="outline" className="text-[10px] bg-green-50 border-green-300">{STATUS_LABELS[filterStatus] || filterStatus}</Badge>}
          {filterWorkType !== 'all' && <Badge variant="outline" className="text-[10px] bg-purple-50 border-purple-300">Tipo: {filterWorkType}</Badge>}
          {filterEmpType !== 'all' && <Badge variant="outline" className="text-[10px] bg-cyan-50 border-cyan-300">Colab: {filterEmpType}</Badge>}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[10px] text-red-500 h-5 px-2"><X className="w-3 h-3 mr-0.5" />Limpar</Button>
        </div>
      )}

      {/* ═══ ROW 1: OPERATIONAL KPIs ════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon={Building2} label="Total de Obras" value={kpis.totalWorks} sub={`+${kpis.worksThisMonth} este mês`} accent="bg-blue-50" iconColor="text-blue-600" />
        <KPI icon={Activity} label="Obras Ativas" value={kpis.activeWorks} sub="Em andamento" accent="bg-emerald-50" iconColor="text-emerald-600" />
        <KPI icon={CheckCircle2} label="Concluídas" value={kpis.completedWorks} accent="bg-green-50" iconColor="text-green-600" />
        <KPI icon={Target} label="SLA Entrega" value={`${kpis.slaRate.toFixed(0)}%`} sub="No prazo" accent="bg-cyan-50" iconColor="text-cyan-600" color={kpis.slaRate >= 80 ? 'text-emerald-600' : 'text-red-600'} />
        <KPI icon={ClipboardList} label="Tarefas Pendentes" value={kpis.pendingTasksCount} sub={kpis.overdueTasks > 0 ? `${kpis.overdueTasks} atrasadas!` : 'Nenhuma atrasada'} accent="bg-amber-50" iconColor="text-amber-600" />
        <KPI icon={Award} label="Taxa Conclusão" value={`${kpis.taskCompletionRate.toFixed(0)}%`} sub="Tarefas concluídas" accent="bg-indigo-50" iconColor="text-indigo-600" />
      </div>

      {/* ═══ ROW 2: FINANCIAL KPIs ══════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon={DollarSign} label="Receita Total" value={`R$ ${fmtK(kpis.totalRevenue)}`} accent="bg-emerald-50" iconColor="text-emerald-600" color="text-emerald-700" />
        <KPI icon={TrendingDown} label="Custo Total" value={`R$ ${fmtK(kpis.totalCost)}`} accent="bg-rose-50" iconColor="text-rose-600" color="text-rose-600" />
        <KPI icon={Percent} label="Margem Bruta" value={`${kpis.grossMargin.toFixed(1)}%`} accent="bg-violet-50" iconColor="text-violet-600" color={kpis.grossMargin >= 20 ? 'text-emerald-600' : 'text-red-600'} />
        <KPI icon={BarChart3} label="Margem Média/Obra" value={`${kpis.avgMarginPerWork.toFixed(1)}%`} accent="bg-purple-50" iconColor="text-purple-600" />
        <KPI icon={DollarSign} label="Recebido" value={`R$ ${fmtK(kpis.totalReceived)}`} accent="bg-teal-50" iconColor="text-teal-600" color="text-teal-700" />
        <KPI icon={AlertCircle} label="A Receber" value={`R$ ${fmtK(kpis.totalPending)}`} sub={kpis.overduePayments > 0 ? `${kpis.overduePayments} em atraso!` : ''} accent="bg-orange-50" iconColor="text-orange-600" color="text-orange-600" />
      </div>

      {/* ═══ ROW 3: HR & PIPELINE KPIs ══════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon={Users} label="Colaboradores" value={kpis.totalEmps} sub={`${kpis.cltEmps} CLT · ${kpis.contractEmps} Emp. · ${kpis.outsourcedEmps} Pont.`} accent="bg-blue-50" iconColor="text-blue-600" />
        <KPI icon={Shield} label="Compliance Docs" value={`${kpis.complianceRate.toFixed(0)}%`} sub="Documentação em dia" accent={kpis.complianceRate >= 80 ? 'bg-emerald-50' : 'bg-red-50'} iconColor={kpis.complianceRate >= 80 ? 'text-emerald-600' : 'text-red-600'} color={kpis.complianceRate >= 80 ? 'text-emerald-600' : 'text-red-600'} />
        <KPI icon={AlertTriangle} label="Docs Vencidos" value={kpis.totalExpiredDocs} sub={kpis.totalExpiringDocs > 0 ? `${kpis.totalExpiringDocs} vencem em 30d` : ''} accent="bg-red-50" iconColor="text-red-600" color={kpis.totalExpiredDocs > 0 ? 'text-red-600' : 'text-emerald-600'} />
        <KPI icon={FileText} label="Propostas Abertas" value={kpis.openProposals} sub={`Pipeline: R$ ${fmtK(kpis.pipelineValue)}`} accent="bg-indigo-50" iconColor="text-indigo-600" />
        <KPI icon={Zap} label="Taxa Conversão" value={`${kpis.conversionRate.toFixed(0)}%`} sub={`${kpis.acceptedProposals} aceitas`} accent="bg-amber-50" iconColor="text-amber-600" />
        <KPI icon={MapPin} label="Protocolos Pend." value={kpis.pendingProtocols} accent="bg-sky-50" iconColor="text-sky-600" />
      </div>

      {/* ═══ ROW 4: EXTRA KPIs ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon={Briefcase} label="Clientes Ativos" value={kpis.totalClients} accent="bg-pink-50" iconColor="text-pink-600" />
        <KPI icon={DollarSign} label="Receita / Colaborador" value={`R$ ${fmtK(kpis.revenuePerEmp)}`} accent="bg-lime-50" iconColor="text-lime-600" />
        <KPI icon={AlertCircle} label="Obras Acima Custo" value={kpis.worksOverBudget} accent={kpis.worksOverBudget > 0 ? 'bg-red-50' : 'bg-emerald-50'} iconColor={kpis.worksOverBudget > 0 ? 'text-red-600' : 'text-emerald-600'} color={kpis.worksOverBudget > 0 ? 'text-red-600' : 'text-emerald-600'} />
        <KPI icon={CheckCircle2} label="Dentro do Orçamento" value={kpis.worksWithinBudget} accent="bg-emerald-50" iconColor="text-emerald-600" color="text-emerald-600" />
        <KPI icon={Calendar} label="Pagtos Atrasados" value={kpis.overduePayments} accent={kpis.overduePayments > 0 ? 'bg-red-50' : 'bg-emerald-50'} iconColor={kpis.overduePayments > 0 ? 'text-red-600' : 'text-emerald-600'} color={kpis.overduePayments > 0 ? 'text-red-600' : 'text-emerald-600'} />
        <KPI icon={Activity} label="Tarefas Atrasadas" value={kpis.overdueTasks} accent={kpis.overdueTasks > 0 ? 'bg-red-50' : 'bg-emerald-50'} iconColor={kpis.overdueTasks > 0 ? 'text-red-600' : 'text-emerald-600'} color={kpis.overdueTasks > 0 ? 'text-red-600' : 'text-emerald-600'} />
      </div>

      {/* ═══ CHARTS ROW 1 ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Cost */}
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-amber-500" />Receita vs Custo (Mensal)</CardTitle></CardHeader>
          <CardContent>
            {kpis.revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={kpis.revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => fmtK(v)} />
                  <Tooltip formatter={(v: number) => `R$ ${fmt(v)}`} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custo" name="Custo" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center py-12">Sem dados para o período</p>}
          </CardContent>
        </Card>

        {/* Works by Status */}
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" />Obras por Status</CardTitle></CardHeader>
          <CardContent>
            {kpis.statusChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={kpis.statusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {kpis.statusChartData.map((entry: any, i: number) => <Cell key={i} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {kpis.statusChartData.map((item: any) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-slate-400 text-center py-12">Nenhuma obra</p>}
          </CardContent>
        </Card>
      </div>

      {/* ═══ CHARTS ROW 2 ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin per Work */}
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Percent className="w-5 h-5 text-violet-500" />Margem por Obra (Top 10)</CardTitle></CardHeader>
          <CardContent>
            {kpis.marginPerWork.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={kpis.marginPerWork} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={120} fontSize={10} tick={{ fill: '#475569' }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
                  <Bar dataKey="margin" name="Margem">
                    {kpis.marginPerWork.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.margin >= 20 ? '#10b981' : entry.margin >= 0 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center py-12">Sem dados</p>}
          </CardContent>
        </Card>

        {/* Works by State */}
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-pink-500" />Obras por Estado</CardTitle></CardHeader>
          <CardContent>
            {kpis.stateChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={kpis.stateChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
                  <Bar dataKey="value" name="Obras" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center py-12">Sem dados por estado</p>}
          </CardContent>
        </Card>
      </div>

      {/* ═══ TABLES ROW ═════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Works Cost Analysis */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Obras — Custo vs Valor</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/works">Ver todas <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis.recentWorks.length === 0 ? (
                <p className="text-slate-400 text-center py-6">Nenhuma obra</p>
              ) : kpis.recentWorks.map((w: any) => {
                const val = Number(w.totalValue || 0);
                const cost = Number(w.cost || 0);
                const margin = val > 0 ? ((val - cost) / val) * 100 : 0;
                const overBudget = cost > val && val > 0;
                return (
                  <Link key={w.id} to={`/admin/works/${w.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono text-slate-400">{w.code || '—'}</span>
                        {w.state && <Badge variant="outline" className="text-[9px] px-1">{w.state}</Badge>}
                        <Badge variant="outline" className={`text-[9px] px-1.5 ${overBudget ? 'border-red-300 text-red-600 bg-red-50' : 'border-emerald-300 text-emerald-600 bg-emerald-50'}`}>
                          {overBudget ? '⚠ ACIMA' : '✓ OK'}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm text-slate-800 truncate">{w.title}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                        <span>Valor: R$ {fmt(val)}</span>
                        <span>Custo: R$ {fmt(cost)}</span>
                        <span className={margin >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>Mg: {margin.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <p className="text-xs text-slate-500">{w.progress || 0}%</p>
                      <Progress value={w.progress || 0} className="h-1.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Employee Document Alerts */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />Alertas de Documentação
            </CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/employees">Ver todos <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis.alertEmployees.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-600 font-semibold text-sm">Todos colaboradores com documentação em dia!</p>
                </div>
              ) : kpis.alertEmployees.map((emp: any) => (
                <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 border border-red-100">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{emp.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {emp.expiredDocs.length > 0 && <Badge className="bg-red-500 text-white text-[9px]">{emp.expiredDocs.length} vencido(s)</Badge>}
                      {emp.expiringDocs.length > 0 && <Badge className="bg-amber-500 text-white text-[9px]">{emp.expiringDocs.length} vence em 30d</Badge>}
                      {!emp.hasAllDocs && <Badge className="bg-slate-500 text-white text-[9px]">Docs incompletos</Badge>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                    <Link to="/admin/employees">Verificar</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Pending Tasks ══════════════════════════════════════════ */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tarefas Pendentes</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link to="/admin/tasks">Ver todas <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
        </CardHeader>
        <CardContent>
          {kpis.pendingTasks.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-600 font-semibold text-sm">Sem tarefas pendentes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.pendingTasks.map((task: any) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                return (
                  <div key={task.id} className={`p-3 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${task.priority === 'urgent' || task.priority === 'high' ? 'text-red-500'
                        : task.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        {task.dueDate && (
                          <p className={`text-[10px] mt-0.5 ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                            {isOverdue ? '⚠ ATRASADA — ' : 'Prazo: '}{new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        <Badge variant={task.priority === 'urgent' || task.priority === 'high' ? 'destructive' : 'outline'} className="text-[9px] mt-1">
                          {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
