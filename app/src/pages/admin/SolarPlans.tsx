import { useState, useEffect, useMemo } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Wallet, Plus, Search, Loader2, Users, TrendingUp, DollarSign,
  Sun, Calendar, CheckCircle2, Clock, AlertTriangle, MoreVertical,
  Zap, XCircle, Wrench, Edit2, Trash2,
  Calculator, CreditCard,
} from 'lucide-react';

const fmt = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const pct = (v: number) => `${Number(v || 0).toFixed(1)}%`;

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  awaiting: { label: 'Aguard. Adesão', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  active: { label: 'Ativo', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Zap },
  contemplated: { label: 'Contemplado', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CheckCircle2 },
  installing: { label: 'Instalando', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Wrench },
  completed: { label: 'Instalado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Sun },
  settled: { label: 'Quitado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  defaulting: { label: 'Inadimplente', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
};

export default function SolarPlans() {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [search, setSearch] = useState('');

  // Dialog states
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [simDialogOpen, setSimDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

  // Form states
  const [planForm, setPlanForm] = useState<any>({
    name: '', description: '', totalInstallments: '48',
    enrollmentFeePercent: '10', contemplationThresholdPercent: '50',
    cancellationFeePercent: '20', gracePeriodDays: '7',
    adjustmentIndex: 'IGPM', safetyMarginPercent: '15',
    minPowerKwp: '', maxPowerKwp: '',
    // Kit fields
    systemPowerKwp: '', basePrice: '', equipmentCost: '', installationCost: '',
    maxSlots: '0', equipment: [],
  });

  const [subForm, setSubForm] = useState<any>({
    planId: '', clientId: '', totalValue: '',
    systemPowerKwp: '', currentMonthlyBill: '',
    currentConsumptionKwh: '', utilityCompany: '',
    equipmentCost: '', installationCost: '',
    propertyAddress: '', propertyCity: '', propertyState: '', propertyCep: '',
    notes: '',
  });

  const [simForm, setSimForm] = useState<any>({
    totalValue: '', currentMonthlyBill: '', installments: '48',
    enrollmentPercent: '10', contemplationPercent: '50',
  });
  const [simResult, setSimResult] = useState<any>(null);

  const [payForm, setPayForm] = useState({ paidAmount: '', paymentMethod: 'pix' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, s, c, d] = await Promise.allSettled([
        api.getSolarPlans(), api.getSolarPlanSubscriptions(),
        api.getClients(), api.getSolarPlanDashboard(),
      ]);
      setPlans(p.status === 'fulfilled' ? (Array.isArray(p.value) ? p.value : []) : []);
      setSubscriptions(s.status === 'fulfilled' ? (Array.isArray(s.value) ? s.value : []) : []);
      setClients(c.status === 'fulfilled' ? (Array.isArray(c.value) ? c.value : (c.value?.data ?? [])) : []);
      setDashboard(d.status === 'fulfilled' ? d.value : null);
    } catch { /* */ } finally { setLoading(false); }
  };

  // ═══ PLAN CRUD ═══
  const handleSavePlan = async () => {
    try {
      const payload: any = { ...planForm };
      ['totalInstallments', 'gracePeriodDays', 'maxSlots'].forEach(k => { payload[k] = parseInt(payload[k] || '0'); });
      ['enrollmentFeePercent', 'contemplationThresholdPercent', 'cancellationFeePercent',
        'safetyMarginPercent', 'minPowerKwp', 'maxPowerKwp',
        'systemPowerKwp', 'basePrice', 'equipmentCost', 'installationCost',
      ].forEach(k => { payload[k] = parseFloat(payload[k] || '0'); });
      if (editingPlan?.id) { await api.updateSolarPlan(editingPlan.id, payload); toast.success('Plano/Kit atualizado'); }
      else { await api.createSolarPlan(payload); toast.success('Plano/Kit criado'); }
      setPlanDialogOpen(false); setEditingPlan(null); loadAll();
    } catch { toast.error('Erro ao salvar plano'); }
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || '', description: plan.description || '',
      totalInstallments: String(plan.totalInstallments || 48),
      enrollmentFeePercent: String(plan.enrollmentFeePercent || 10),
      contemplationThresholdPercent: String(plan.contemplationThresholdPercent || 50),
      cancellationFeePercent: String(plan.cancellationFeePercent || 20),
      gracePeriodDays: String(plan.gracePeriodDays || 7),
      adjustmentIndex: plan.adjustmentIndex || 'IGPM',
      safetyMarginPercent: String(plan.safetyMarginPercent || 15),
      minPowerKwp: String(plan.minPowerKwp || ''), maxPowerKwp: String(plan.maxPowerKwp || ''),
      systemPowerKwp: String(plan.systemPowerKwp || ''),
      basePrice: String(plan.basePrice || ''),
      equipmentCost: String(plan.equipmentCost || ''),
      installationCost: String(plan.installationCost || ''),
      maxSlots: String(plan.maxSlots || '0'),
      equipment: plan.equipment || [],
    });
    setPlanDialogOpen(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Excluir este plano?')) return;
    try { await api.deleteSolarPlan(id); toast.success('Plano excluído'); loadAll(); } catch { toast.error('Erro'); }
  };

  // ═══ SUBSCRIPTION (ADESÃO) ═══
  const handleCreateSubscription = async () => {
    try {
      const payload: any = { ...subForm };
      ['totalValue', 'systemPowerKwp', 'currentMonthlyBill', 'currentConsumptionKwh',
        'equipmentCost', 'installationCost'].forEach(k => { payload[k] = parseFloat(payload[k] || '0'); });
      if (!payload.planId) { toast.error('Selecione um plano/kit'); return; }
      if (!payload.clientId) { toast.error('Selecione um cliente'); return; }
      await api.createSolarPlanSubscription(payload);
      toast.success('Adesão criada com parcelas geradas!');
      setSubDialogOpen(false); loadAll();
    } catch { toast.error('Erro ao criar adesão'); }
  };

  const handleViewDetail = async (sub: any) => {
    try {
      const full = await api.getSolarPlanSubscription(sub.id);
      setSelectedSub(full);
      setDetailDialogOpen(true);
    } catch { toast.error('Erro ao carregar detalhes'); }
  };

  const handlePayInstallment = async () => {
    if (!selectedInstallment) return;
    try {
      await api.paySolarPlanInstallment(selectedInstallment.id, {
        paidAmount: parseFloat(payForm.paidAmount || String(selectedInstallment.amount)),
        paymentMethod: payForm.paymentMethod,
      });
      toast.success('Parcela registrada!');
      setPayDialogOpen(false);
      if (selectedSub) handleViewDetail(selectedSub);
      loadAll();
    } catch { toast.error('Erro ao registrar pagamento'); }
  };

  const handleStartInstallation = async (id: string) => {
    try { await api.startSolarPlanInstallation(id); toast.success('Instalação iniciada!'); loadAll(); if (selectedSub) handleViewDetail({ id }); } catch { toast.error('Erro'); }
  };
  const handleCompleteInstallation = async (id: string) => {
    try { await api.completeSolarPlanInstallation(id); toast.success('Instalação concluída!'); loadAll(); if (selectedSub) handleViewDetail({ id }); } catch { toast.error('Erro'); }
  };
  const handleCancel = async (id: string) => {
    const reason = prompt('Motivo do cancelamento:');
    if (!reason) return;
    try {
      const result = await api.cancelSolarPlanSubscription(id, reason);
      toast.success(`Cancelado. Devolução: ${fmt(result.refundAmount)} | Multa: ${fmt(result.feeAmount)}`);
      loadAll(); setDetailDialogOpen(false);
    } catch { toast.error('Erro ao cancelar'); }
  };

  // ═══ SIMULADOR ═══
  const handleSimulate = async () => {
    try {
      const result = await api.simulateSolarPlan({
        totalValue: parseFloat(simForm.totalValue || '0'),
        currentMonthlyBill: parseFloat(simForm.currentMonthlyBill || '0'),
        installments: parseInt(simForm.installments || '48'),
        enrollmentPercent: parseFloat(simForm.enrollmentPercent || '10'),
        contemplationPercent: parseFloat(simForm.contemplationPercent || '50'),
      });
      setSimResult(result);
    } catch { toast.error('Erro na simulação'); }
  };

  // ═══ FILTERED SUBS ═══
  const filtered = useMemo(() => subscriptions.filter(s => {
    if (!search) return true;
    const t = search.toLowerCase();
    return s.code?.toLowerCase().includes(t) || s.client?.name?.toLowerCase().includes(t) || s.status?.includes(t);
  }), [subscriptions, search]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 md:w-7 md:h-7 text-amber-500" /> Plano de Acesso Solar
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Sua conta de luz é sua aprovação</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => { setSimForm({ totalValue: '', currentMonthlyBill: '', installments: '48', enrollmentPercent: '10', contemplationPercent: '50' }); setSimResult(null); setSimDialogOpen(true); }}>
            <Calculator className="w-4 h-4 mr-1.5" /> Simulador
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" onClick={() => { setSubForm({ planId: plans[0]?.id || '', clientId: '', totalValue: '', systemPowerKwp: '', currentMonthlyBill: '', currentConsumptionKwh: '', utilityCompany: '', equipmentCost: '', installationCost: '', propertyAddress: '', propertyCity: '', propertyState: '', propertyCep: '', notes: '' }); setSubDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Nova Adesão
          </Button>
        </div>
      </div>

      {/* Dashboard */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          <Card className="border-none shadow-sm"><CardContent className="p-4">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-lg font-bold text-slate-900">{dashboard.activeSubscriptions}</p><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ativos</p></div></div>
          </CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-amber-600" /></div>
            <div><p className="text-lg font-bold text-amber-600">{dashboard.pendingInstallation}</p><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contemplados</p></div></div>
          </CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-lg font-bold text-emerald-600">{fmt(dashboard.totalAccumulated)}</p><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Acumulado</p></div></div>
          </CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-4 h-4 text-indigo-600" /></div>
            <div><p className="text-lg font-bold text-indigo-600">{pct(dashboard.avgProgress)}</p><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Progresso Médio</p></div></div>
          </CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
            <div><p className="text-lg font-bold text-red-600">{dashboard.defaulting}</p><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inadimplentes</p></div></div>
          </CardContent></Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="subscriptions" className="gap-1 text-xs md:text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white"><Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Adesões</span><span className="sm:hidden">Adesões</span> <Badge variant="outline" className="text-[10px] ml-0.5">{subscriptions.length}</Badge></TabsTrigger>
          <TabsTrigger value="plans" className="gap-1 text-xs md:text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white"><CreditCard className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Kits/Planos</span><span className="sm:hidden">Kits</span> <Badge variant="outline" className="text-[10px] ml-0.5">{plans.length}</Badge></TabsTrigger>
        </TabsList>

        {/* ═══ TAB: ADESÕES ═══ */}
        <TabsContent value="subscriptions" className="mt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar por código, cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><Wallet className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="font-medium">Nenhuma adesão encontrada</p></div>
          ) : (
            <div className="space-y-3">
              {filtered.map((sub: any) => {
                const st = STATUS_MAP[sub.status] || STATUS_MAP.awaiting;
                const StIcon = st.icon;
                const progress = Number(sub.totalValue) > 0 ? (Number(sub.paidAmount) / Number(sub.totalValue) * 100) : 0;
                return (
                  <Card key={sub.id} className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDetail(sub)}>
                    <CardContent className="p-3 md:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Sun className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] md:text-xs text-slate-400">{sub.code}</span>
                              <Badge className={`text-[9px] md:text-[10px] gap-0.5 border ${st.color}`}><StIcon className="w-2.5 h-2.5 md:w-3 md:h-3" /> {st.label}</Badge>
                            </div>
                            <h3 className="font-bold text-sm md:text-base text-slate-900 mt-0.5 truncate">{sub.client?.name || 'Cliente'}</h3>
                            <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs text-slate-500 mt-0.5 flex-wrap">
                              {sub.plan && <span className="truncate max-w-[100px] md:max-w-none">{sub.plan.name}</span>}
                              {sub.systemPowerKwp > 0 && <span>{Number(sub.systemPowerKwp).toFixed(1)} kWp</span>}
                              <span className="hidden sm:flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(sub.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-lg font-bold text-slate-900">{fmt(sub.totalValue)}</p>
                          <p className="text-[10px] md:text-xs text-emerald-600 font-medium">Pago: {fmt(sub.paidAmount)}</p>
                          {Number(sub.monthlySavingsFromDay1) > 0 && (
                            <p className="text-[9px] md:text-[10px] text-amber-600 font-bold mt-0.5">Ec. {fmt(sub.monthlySavingsFromDay1)}/mês</p>
                          )}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{pct(progress)} pago</span>
                          <span>{sub.paidInstallments}/{sub.totalInstallments} parcelas</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        {Number(sub.contemplationThreshold) > 0 && (
                          <div className="relative h-0">
                            <div className="absolute top-[-10px] text-[8px] text-amber-600 font-bold" style={{ left: `${sub.contemplationThreshold}%`, transform: 'translateX(-50%)' }}>
                              ▼ Contempla
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB: PLANOS ═══ */}
        <TabsContent value="plans" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingPlan(null); setPlanForm({ name: '', description: '', totalInstallments: '48', enrollmentFeePercent: '10', contemplationThresholdPercent: '50', cancellationFeePercent: '20', gracePeriodDays: '7', adjustmentIndex: 'IGPM', safetyMarginPercent: '15', minPowerKwp: '', maxPowerKwp: '', systemPowerKwp: '', basePrice: '', equipmentCost: '', installationCost: '', maxSlots: '0', equipment: [] }); setPlanDialogOpen(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              <Plus className="w-4 h-4 mr-2" /> Novo Kit/Plano
            </Button>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="font-medium">Nenhum kit/plano cadastrado — crie o primeiro!</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {plans.map((plan: any) => (
                <Card key={plan.id} className="border-none shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">{plan.name}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{plan.description || 'Sem descrição'}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPlan(plan)}><Edit2 className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePlan(plan.id)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Kit info */}
                    {Number(plan.basePrice) > 0 && (
                      <div className="mt-3 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-lg p-3 border border-amber-100">
                        <div className="flex items-center justify-between">
                          <div><p className="text-lg font-bold text-amber-800">{fmt(plan.basePrice)}</p><p className="text-[10px] text-amber-600 uppercase font-bold">Preço do Kit</p></div>
                          {Number(plan.systemPowerKwp) > 0 && <div className="text-right"><p className="text-lg font-bold text-blue-700">{Number(plan.systemPowerKwp).toFixed(1)} kWp</p><p className="text-[10px] text-blue-600 uppercase font-bold">Potência</p></div>}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-slate-900">{plan.totalInstallments}x</p><p className="text-[10px] text-slate-500 uppercase font-bold">Parcelas</p></div>
                      <div className="bg-amber-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-amber-700">{plan.contemplationThresholdPercent}%</p><p className="text-[10px] text-amber-600 uppercase font-bold">Contemplação</p></div>
                      <div className="bg-blue-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-blue-700">{plan.enrollmentFeePercent}%</p><p className="text-[10px] text-blue-600 uppercase font-bold">Taxa Adesão</p></div>
                      <div className="bg-red-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-red-700">{plan.cancellationFeePercent}%</p><p className="text-[10px] text-red-600 uppercase font-bold">Multa Cancel.</p></div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">{plan.status === 'active' ? '✅ Ativo' : '❌ Inativo'}</Badge>
                      {Number(plan.maxSlots) > 0 && (
                        <Badge variant="outline" className={`text-xs ${plan.availableSlots <= 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {plan.availableSlots > 0 ? `${plan.usedSlots}/${plan.maxSlots} vagas usadas` : '⚠ ESGOTADO'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ DIALOG: PLANO ═══ */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base md:text-lg">{editingPlan ? 'Editar' : 'Novo'} Kit / Plano</DialogTitle></DialogHeader>
          <div className="space-y-5 py-4">
            {/* Identity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label className="text-xs md:text-sm">Nome do Kit/Plano *</Label><Input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Ex: Kit Solar 5.5 kWp - 48x" /></div>
              <div className="space-y-2 col-span-2"><Label>Descrição</Label><Input value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Ex: Sistema completo para consumo de até 600 kWh/mês" /></div>
            </div>

            {/* Kit System */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 space-y-3">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2"><Sun className="w-4 h-4" /> Configuração do Kit</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">Potência (kWp)</Label><Input type="number" step="0.1" value={planForm.systemPowerKwp} onChange={e => setPlanForm({ ...planForm, systemPowerKwp: e.target.value })} placeholder="Ex: 5.5" className="bg-white" /></div>
                <div className="space-y-1"><Label className="text-xs">Preço Base (R$)</Label><Input type="number" value={planForm.basePrice} onChange={e => setPlanForm({ ...planForm, basePrice: e.target.value })} placeholder="Ex: 28000" className="bg-white" /></div>
                <div className="space-y-1"><Label className="text-xs">Máx. Vagas (0 = ilimitado)</Label><Input type="number" value={planForm.maxSlots} onChange={e => setPlanForm({ ...planForm, maxSlots: e.target.value })} placeholder="Ex: 10" className="bg-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Custo Equipamento (R$)</Label><Input type="number" value={planForm.equipmentCost} onChange={e => setPlanForm({ ...planForm, equipmentCost: e.target.value })} className="bg-white" /></div>
                <div className="space-y-1"><Label className="text-xs">Custo Instalação (R$)</Label><Input type="number" value={planForm.installationCost} onChange={e => setPlanForm({ ...planForm, installationCost: e.target.value })} className="bg-white" /></div>
              </div>
            </div>

            {/* Financial */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-2"><Label>Parcelas</Label><Input type="number" value={planForm.totalInstallments} onChange={e => setPlanForm({ ...planForm, totalInstallments: e.target.value })} /></div>
              <div className="space-y-2"><Label>Taxa Adesão (%)</Label><Input type="number" step="0.1" value={planForm.enrollmentFeePercent} onChange={e => setPlanForm({ ...planForm, enrollmentFeePercent: e.target.value })} /></div>
              <div className="space-y-2"><Label>Contemplação (%)</Label><Input type="number" step="0.1" value={planForm.contemplationThresholdPercent} onChange={e => setPlanForm({ ...planForm, contemplationThresholdPercent: e.target.value })} /></div>
              <div className="space-y-2"><Label>Multa Cancel. (%)</Label><Input type="number" step="0.1" value={planForm.cancellationFeePercent} onChange={e => setPlanForm({ ...planForm, cancellationFeePercent: e.target.value })} /></div>
              <div className="space-y-2"><Label>Carência (dias)</Label><Input type="number" value={planForm.gracePeriodDays} onChange={e => setPlanForm({ ...planForm, gracePeriodDays: e.target.value })} /></div>
              <div className="space-y-2"><Label>Reajuste</Label>
                <Select value={planForm.adjustmentIndex} onValueChange={v => setPlanForm({ ...planForm, adjustmentIndex: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="IGPM">IGPM</SelectItem><SelectItem value="IPCA">IPCA</SelectItem><SelectItem value="NONE">Sem reajuste</SelectItem></SelectContent></Select>
              </div>
            </div>

            {/* Preview */}
            {Number(planForm.basePrice) > 0 && (() => {
              const total = Number(planForm.basePrice);
              const enrollment = total * Number(planForm.enrollmentFeePercent || 10) / 100;
              const monthly = (total - enrollment) / Number(planForm.totalInstallments || 48);
              return (
                <div className="bg-slate-900 rounded-lg p-4 text-white">
                  <p className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">📊 Pré-visualização</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-lg font-bold">{fmt(enrollment)}</p><p className="text-[10px] text-slate-400">TAXA ADESÃO</p></div>
                    <div><p className="text-lg font-bold text-amber-400">{fmt(monthly)}</p><p className="text-[10px] text-slate-400">PARCELA MENSAL</p></div>
                    <div><p className="text-lg font-bold">{fmt(total)}</p><p className="text-[10px] text-slate-400">VALOR TOTAL</p></div>
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePlan} className="bg-amber-500 hover:bg-amber-600 text-slate-900">Salvar Kit/Plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: NOVA ADESÃO ═══ */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base md:text-lg">Nova Adesão — Plano de Acesso Solar</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 py-4">
            <div className="space-y-2"><Label>Kit/Plano *</Label>
              <Select value={subForm.planId} onValueChange={v => {
                const plan = plans.find((p: any) => p.id === v);
                setSubForm({ ...subForm, planId: v,
                  totalValue: plan?.basePrice ? String(plan.basePrice) : subForm.totalValue,
                  systemPowerKwp: plan?.systemPowerKwp ? String(plan.systemPowerKwp) : subForm.systemPowerKwp,
                  equipmentCost: plan?.equipmentCost ? String(plan.equipmentCost) : subForm.equipmentCost,
                  installationCost: plan?.installationCost ? String(plan.installationCost) : subForm.installationCost,
                });
              }}><SelectTrigger><SelectValue placeholder="Selecione o kit..." /></SelectTrigger>
              <SelectContent>{plans.filter((p: any) => p.status === 'active').map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.totalInstallments}x){Number(p.basePrice) > 0 ? ` — ${fmt(p.basePrice)}` : ''}{Number(p.maxSlots) > 0 ? ` [${p.availableSlots ?? '?'} vagas]` : ''}
                </SelectItem>
              ))}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Cliente *</Label>
              <Select value={subForm.clientId} onValueChange={v => setSubForm({ ...subForm, clientId: v })}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2 sm:col-span-2 bg-amber-50 rounded-lg p-3 md:p-4 border border-amber-200">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2"><Zap className="w-4 h-4" /> Prova de Capacidade — "Sua conta de luz é sua aprovação"</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 mt-2">
                <div><Label className="text-xs">Conta de Luz Mensal (R$)</Label><Input type="number" value={subForm.currentMonthlyBill} onChange={e => setSubForm({ ...subForm, currentMonthlyBill: e.target.value })} placeholder="Ex: 400" className="bg-white" /></div>
                <div><Label className="text-xs">Consumo (kWh)</Label><Input type="number" value={subForm.currentConsumptionKwh} onChange={e => setSubForm({ ...subForm, currentConsumptionKwh: e.target.value })} placeholder="Ex: 500" className="bg-white" /></div>
                <div><Label className="text-xs">Concessionária</Label><Input value={subForm.utilityCompany} onChange={e => setSubForm({ ...subForm, utilityCompany: e.target.value })} placeholder="Ex: ENEL" className="bg-white" /></div>
              </div>
            </div>
            <div className="space-y-2"><Label>Valor Total (R$) <span className="text-[10px] text-amber-600">← auto do kit</span></Label><Input type="number" value={subForm.totalValue} onChange={e => setSubForm({ ...subForm, totalValue: e.target.value })} placeholder="Auto-preenchido pelo kit" className={subForm.totalValue ? 'bg-amber-50 border-amber-200' : ''} /></div>
            <div className="space-y-2"><Label>Potência (kWp)</Label><Input type="number" value={subForm.systemPowerKwp} onChange={e => setSubForm({ ...subForm, systemPowerKwp: e.target.value })} /></div>
            <div className="space-y-2"><Label>Custo Equipamentos (R$)</Label><Input type="number" value={subForm.equipmentCost} onChange={e => setSubForm({ ...subForm, equipmentCost: e.target.value })} /></div>
            <div className="space-y-2"><Label>Custo Instalação (R$)</Label><Input type="number" value={subForm.installationCost} onChange={e => setSubForm({ ...subForm, installationCost: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Endereço de Instalação</Label><Input value={subForm.propertyAddress} onChange={e => setSubForm({ ...subForm, propertyAddress: e.target.value })} /></div>
            <div className="space-y-2"><Label>Cidade</Label><Input value={subForm.propertyCity} onChange={e => setSubForm({ ...subForm, propertyCity: e.target.value })} /></div>
            <div className="space-y-2"><Label>Estado</Label><Input value={subForm.propertyState} onChange={e => setSubForm({ ...subForm, propertyState: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSubDialogOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleCreateSubscription} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900">Criar Adesão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: DETALHE DA ADESÃO ═══ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
          {selectedSub && (() => {
            const sub = selectedSub;
            const st = STATUS_MAP[sub.status] || STATUS_MAP.awaiting;
            const StIcon = st.icon;
            const progress = Number(sub.totalValue) > 0 ? (Number(sub.paidAmount) / Number(sub.totalValue) * 100) : 0;
            const installments = sub.installments || [];
            return (<>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-slate-400">{sub.code}</span>
                  <Badge className={`text-[10px] gap-0.5 border ${st.color}`}><StIcon className="w-3 h-3" /> {st.label}</Badge>
                </DialogTitle>
              </DialogHeader>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-2">
                <div className="bg-slate-50 rounded-lg p-2 md:p-3 text-center"><p className="text-sm md:text-lg font-bold">{fmt(sub.totalValue)}</p><p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold">Valor Total</p></div>
                <div className="bg-emerald-50 rounded-lg p-2 md:p-3 text-center"><p className="text-sm md:text-lg font-bold text-emerald-700">{fmt(sub.paidAmount)}</p><p className="text-[9px] md:text-[10px] text-emerald-600 uppercase font-bold">Pago</p></div>
                <div className="bg-amber-50 rounded-lg p-2 md:p-3 text-center"><p className="text-sm md:text-lg font-bold text-amber-700">{fmt(sub.monthlyPayment)}</p><p className="text-[9px] md:text-[10px] text-amber-600 uppercase font-bold">Parcela</p></div>
                <div className="bg-blue-50 rounded-lg p-2 md:p-3 text-center"><p className="text-sm md:text-lg font-bold text-blue-700">{pct(progress)}</p><p className="text-[9px] md:text-[10px] text-blue-600 uppercase font-bold">Progresso</p></div>
              </div>

              {/* Savings highlight */}
              {Number(sub.currentMonthlyBill) > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-lg p-3 md:p-4 border border-amber-200 mt-3">
                  <p className="text-xs md:text-sm font-bold text-amber-800">💡 Argumento de Vendas</p>
                  <p className="text-xs md:text-sm text-slate-700 mt-1">
                    Luz: <strong>{fmt(sub.currentMonthlyBill)}</strong> → Parcela: <strong>{fmt(sub.monthlyPayment)}</strong>
                    {Number(sub.monthlySavingsFromDay1) > 0 && <><br className="sm:hidden" /><span className="text-emerald-700 font-bold"> Economia: {fmt(sub.monthlySavingsFromDay1)}/mês</span></>}
                  </p>
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{sub.paidInstallments}/{sub.totalInstallments} parcelas</span>
                  <span>Contempla em {pct(sub.contemplationThreshold)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 relative">
                  <div className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                  <div className="absolute top-0 h-3 w-0.5 bg-amber-600" style={{ left: `${sub.contemplationThreshold}%` }} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {sub.status === 'contemplated' && <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleStartInstallation(sub.id)}><Wrench className="w-3.5 h-3.5 mr-1" /> Iniciar Instalação</Button>}
                {sub.status === 'installing' && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleCompleteInstallation(sub.id)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Instalação Concluída</Button>}
                {!['settled', 'cancelled'].includes(sub.status) && <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleCancel(sub.id)}><XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar</Button>}
              </div>

              {/* Installments table */}
              <div className="mt-4">
                <h3 className="font-bold text-sm text-slate-700 mb-2">Parcelas ({installments.length})</h3>
                <div className="max-h-[300px] overflow-auto rounded-lg border">
                  <Table className="text-xs md:text-sm">
                    <TableHeader><TableRow className="bg-slate-50"><TableHead className="w-10 md:w-16 px-2">#</TableHead><TableHead className="hidden sm:table-cell">Tipo</TableHead><TableHead className="px-2">Venc.</TableHead><TableHead className="text-right px-2">Valor</TableHead><TableHead className="px-2">Status</TableHead><TableHead className="text-right px-2">Ação</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {installments.sort((a: any, b: any) => a.installmentNumber - b.installmentNumber).map((inst: any) => {
                        const isPaid = inst.status === 'paid';
                        const isOverdue = !isPaid && inst.status !== 'cancelled' && new Date(inst.dueDate) < new Date();
                        return (
                          <TableRow key={inst.id} className={isOverdue ? 'bg-red-50' : ''}>
                            <TableCell className="font-mono text-[10px] md:text-xs px-2">{inst.installmentNumber === 0 ? 'ADH' : inst.installmentNumber}</TableCell>
                            <TableCell className="text-xs hidden sm:table-cell">{inst.type === 'enrollment_fee' ? 'Adesão' : 'Mensal'}</TableCell>
                            <TableCell className="text-[10px] md:text-sm px-2">{fmtDate(inst.dueDate)}</TableCell>
                            <TableCell className="text-right font-semibold px-2">{fmt(inst.amount)}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${isPaid ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                {isPaid ? '✅ Pago' : isOverdue ? '🔴 Atrasado' : '⏳ Pendente'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {!isPaid && inst.status !== 'cancelled' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedInstallment(inst); setPayForm({ paidAmount: String(inst.amount), paymentMethod: 'pix' }); setPayDialogOpen(true); }}>
                                  <DollarSign className="w-3 h-3 mr-1" /> Pagar
                                </Button>
                              )}
                              {isPaid && <span className="text-xs text-slate-400">{fmtDate(inst.paidAt)}</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>);
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: PAGAR PARCELA ═══ */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
          {selectedInstallment && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-sm text-slate-500">Parcela {selectedInstallment.installmentNumber === 0 ? 'Adesão' : `#${selectedInstallment.installmentNumber}`}</p>
                <p className="text-xl font-bold">{fmt(selectedInstallment.amount)}</p>
              </div>
              <div className="space-y-2"><Label>Valor Pago (R$)</Label><Input type="number" value={payForm.paidAmount} onChange={e => setPayForm({ ...payForm, paidAmount: e.target.value })} /></div>
              <div className="space-y-2"><Label>Método de Pagamento</Label>
                <Select value={payForm.paymentMethod} onValueChange={v => setPayForm({ ...payForm, paymentMethod: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pix">PIX</SelectItem><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="bank_transfer">Transferência</SelectItem><SelectItem value="cash">Dinheiro</SelectItem></SelectContent></Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handlePayInstallment} className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: SIMULADOR ═══ */}
      <Dialog open={simDialogOpen} onOpenChange={setSimDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-base md:text-lg"><Calculator className="w-5 h-5 text-amber-500" /> Simulador Solar</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 md:gap-4 py-3 md:py-4">
            <div className="space-y-1.5"><Label className="text-xs md:text-sm">Valor do Sistema (R$)</Label><Input type="number" inputMode="decimal" value={simForm.totalValue} onChange={e => setSimForm({ ...simForm, totalValue: e.target.value })} placeholder="28000" /></div>
            <div className="space-y-1.5"><Label className="text-xs md:text-sm">Conta de Luz (R$)</Label><Input type="number" inputMode="decimal" value={simForm.currentMonthlyBill} onChange={e => setSimForm({ ...simForm, currentMonthlyBill: e.target.value })} placeholder="400" /></div>
            <div className="space-y-1.5"><Label className="text-xs md:text-sm">Parcelas</Label><Input type="number" inputMode="numeric" value={simForm.installments} onChange={e => setSimForm({ ...simForm, installments: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs md:text-sm">Contemplação (%)</Label><Input type="number" inputMode="decimal" value={simForm.contemplationPercent} onChange={e => setSimForm({ ...simForm, contemplationPercent: e.target.value })} /></div>
          </div>
          <Button onClick={handleSimulate} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-sm md:text-base py-3"><Calculator className="w-4 h-4 mr-2" /> Simular</Button>

          {simResult && (
            <div className="space-y-4 mt-4 border-t pt-4">
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="bg-amber-50 rounded-lg p-2 md:p-3 text-center"><p className="text-sm md:text-lg font-bold text-amber-700">{fmt(simResult.enrollmentFee)}</p><p className="text-[9px] md:text-[10px] text-amber-600 uppercase font-bold">Adesão</p></div>
                <div className="bg-blue-50 rounded-lg p-2 md:p-3 text-center"><p className="text-sm md:text-lg font-bold text-blue-700">{fmt(simResult.monthlyPayment)}</p><p className="text-[9px] md:text-[10px] text-blue-600 uppercase font-bold">Parcela</p></div>
                <div className="bg-emerald-50 rounded-lg p-2 md:p-3 text-center"><p className="text-sm md:text-lg font-bold text-emerald-700">{fmt(simResult.savingsFromDay1)}</p><p className="text-[9px] md:text-[10px] text-emerald-600 uppercase font-bold">Economia</p></div>
              </div>

              {/* Timeline */}
              <div className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-lg p-3 md:p-4 border border-amber-200">
                <p className="text-xs md:text-sm font-bold text-amber-800">📅 Linha do Tempo</p>
                <div className="mt-2 space-y-1.5 text-xs md:text-sm text-slate-700">
                  <p>🟡 <strong>Hoje</strong> — Adesão de {fmt(simResult.enrollmentFee)}</p>
                  <p>🔵 <strong>1-{simResult.contemplationMonth} meses</strong> — {fmt(simResult.monthlyPayment)}/mês (economia {fmt(simResult.savingsFromDay1)}/mês)</p>
                  <p>🟢 <strong>Mês {simResult.contemplationMonth}</strong> — CONTEMPLADO! Instalação</p>
                  <p>⚡ <strong>Pós-instalação</strong> — Luz zerada. Economia {fmt(simResult.netMonthlySavingsAfterInstall)}/mês</p>
                  <p>🎯 <strong>Quitação</strong> — {fmt(simResult.savingsAfterInstallation)}/mês por 25+ anos</p>
                </div>
              </div>

              {/* Pitch ready */}
              <div className="bg-slate-900 rounded-lg p-3 md:p-4 text-white">
                <p className="text-[10px] md:text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">💬 Argumento de Vendas</p>
                <p className="text-xs md:text-sm leading-relaxed">{simResult.argument}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">Economia em 25 anos:</span> <strong className="text-emerald-700">{fmt(simResult.lifetimeSavings)}</strong></div>
                <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">ROI:</span> <strong className="text-blue-700">{pct(simResult.roi)}</strong></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
