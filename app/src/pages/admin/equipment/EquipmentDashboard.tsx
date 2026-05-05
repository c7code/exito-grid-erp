import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package, CheckCircle2, Activity, DollarSign, Wrench, TrendingUp,
  BarChart3, Clock, AlertTriangle, Percent
} from 'lucide-react';
import { fmt } from './EquipmentTypes';

interface Props { stats: any; }

export default function EquipmentDashboard({ stats }: Props) {
  if (!stats) {
    return (
      <Card className="p-12 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-medium text-slate-500">Cadastre equipamentos para ver o dashboard</p>
        <p className="text-sm text-slate-400 mt-1">Os dados aparecerão automaticamente aqui</p>
      </Card>
    );
  }

  const cards = [
    { label: 'Total Equipamentos', value: stats.totalEquipment, icon: Package, color: 'blue', border: 'border-l-blue-500' },
    { label: 'Disponíveis', value: stats.available, icon: CheckCircle2, color: 'green', border: 'border-l-green-500' },
    { label: 'Locados', value: stats.rented, icon: Activity, color: 'orange', border: 'border-l-orange-500' },
    { label: 'Em Manutenção', value: stats.inMaintenance, icon: Wrench, color: 'yellow', border: 'border-l-yellow-500' },
  ];

  const finCards = [
    { label: 'Receita Mensal (Locações)', value: fmt(stats.monthlyRevenue), icon: DollarSign, color: 'emerald' },
    { label: 'Receita Total (Locações)', value: fmt(stats.totalRevenue), icon: TrendingUp, color: 'blue' },
    { label: 'Receita Serviços', value: fmt(stats.servicesRevenue), icon: BarChart3, color: 'purple' },
    { label: 'Receita Diárias', value: fmt(stats.dailiesRevenue), icon: Clock, color: 'cyan' },
  ];

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className={`border-l-4 ${c.border} hover:shadow-md transition-shadow`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</p>
                    <p className={`text-3xl font-bold mt-1 text-${c.color}-600`}>{c.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl bg-${c.color}-50 flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 text-${c.color}-400`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Occupancy + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Percent className="h-5 w-5 text-indigo-500" />
              <p className="text-sm font-semibold text-slate-700">Taxa de Ocupação</p>
            </div>
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${stats.occupancyRate || 0}%` }}
              />
            </div>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{stats.occupancyRate || 0}%</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-semibold text-slate-700">Manutenção Próxima</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.maintenanceDue || 0}</p>
            <p className="text-xs text-muted-foreground">equipamento(s) nos próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-cyan-500" />
              <p className="text-sm font-semibold text-slate-700">Diárias Pendentes</p>
            </div>
            <p className="text-2xl font-bold text-cyan-600">{stats.pendingDailies || 0}</p>
            <p className="text-xs text-muted-foreground">diária(s) sem faturar</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {finCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 text-${c.color}-500`} />
                  <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                </div>
                <p className={`text-xl font-bold text-${c.color}-600`}>{c.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom: Top Equipment + Revenue Chart + Upcoming Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Equipment */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Top Equipamentos
            </p>
            {stats.topEquipment?.length > 0 ? (
              <div className="space-y-2">
                {stats.topEquipment.map((eq: any, i: number) => (
                  <div key={eq.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{eq.name}</p>
                        <p className="text-xs text-muted-foreground">{eq.code}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{eq.totalRentals} loc.</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Nenhum dado</p>}
          </CardContent>
        </Card>

        {/* Revenue Chart (simplified bar chart) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" /> Receita Mensal (6 meses)
            </p>
            {stats.monthlyChart?.length > 0 ? (
              <div className="space-y-2">
                {stats.monthlyChart.map((m: any) => {
                  const max = Math.max(...stats.monthlyChart.map((x: any) => x.total), 1);
                  const pct = Math.round((m.total / max) * 100);
                  return (
                    <div key={m.month} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-16 shrink-0">{m.month}</span>
                      <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 w-20 text-right">{fmt(m.total)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground">Nenhum dado</p>}
          </CardContent>
        </Card>

        {/* Upcoming Maintenance */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-500" /> Próximas Manutenções
            </p>
            {stats.upcomingMaintenance?.length > 0 ? (
              <div className="space-y-2">
                {stats.upcomingMaintenance.map((eq: any) => (
                  <div key={eq.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{eq.name}</p>
                      <p className="text-xs text-muted-foreground">{eq.code}</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      {eq.nextDate ? new Date(eq.nextDate).toLocaleDateString('pt-BR') : '—'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Nenhuma manutenção agendada</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
