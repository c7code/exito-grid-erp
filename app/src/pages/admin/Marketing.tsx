import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Target, TrendingUp, Users, DollarSign, Percent,
  ArrowUpRight, Plus, Eye, BarChart2, Megaphone,
  Star, Zap, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = (v: number) => v.toLocaleString('pt-BR');
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const CHANNEL_LABEL: Record<string, string> = {
  google_ads: 'Google Ads', instagram: 'Instagram', facebook: 'Facebook',
  linkedin: 'LinkedIn', email: 'E-mail', event: 'Evento', flyer: 'Panfleto',
  indication: 'Indicação', whatsapp: 'WhatsApp', youtube: 'YouTube',
  tiktok: 'TikTok', other: 'Outros',
};
const CHANNEL_COLOR: Record<string, string> = {
  google_ads: 'bg-blue-100 text-blue-700', instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-indigo-100 text-indigo-700', linkedin: 'bg-sky-100 text-sky-700',
  email: 'bg-amber-100 text-amber-700', event: 'bg-purple-100 text-purple-700',
  flyer: 'bg-orange-100 text-orange-700', indication: 'bg-green-100 text-green-700',
  whatsapp: 'bg-emerald-100 text-emerald-700', youtube: 'bg-red-100 text-red-700',
  tiktok: 'bg-slate-100 text-slate-700', other: 'bg-gray-100 text-gray-700',
};

export default function Marketing() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMarketingKpis();
      setKpis(data);
    } catch { toast.error('Erro ao carregar dados de marketing'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const roiColor = (roi: number) => roi >= 0 ? 'text-emerald-600' : 'text-red-500';

  // Funil percentages
  const funnel = kpis?.funnel || { reached: 0, leads: 0, qualified: 0, converted: 0 };
  const funnelMax = Math.max(funnel.reached, funnel.leads, funnel.qualified, funnel.converted, 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-7 h-7 text-rose-500" /> Marketing
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Campanhas, ações, ROI e indicadores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button className="bg-rose-500 hover:bg-rose-600 text-white" onClick={() => navigate('/admin/marketing/campaigns')}>
            <Plus className="w-4 h-4 mr-1.5" /> Nova Campanha
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-rose-400" />
        </div>
      ) : (
        <>
          {/* KPI Cards Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-rose-400">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">ROI</span>
                <TrendingUp className="w-4 h-4 text-rose-400" />
              </div>
              <p className={`text-2xl font-bold ${roiColor(kpis?.roi || 0)}`}>{fmtPct(kpis?.roi || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Retorno sobre investimento</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-violet-400">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">CAC</span>
                <DollarSign className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-slate-800">R$ {fmt(kpis?.cac || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Custo por cliente adquirido</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-sky-400">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">CPL</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-slate-800">R$ {fmt(kpis?.cpl || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Custo por lead gerado</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-400">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Conversão</span>
                <Percent className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{fmtPct(kpis?.conversionRate || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Lead → Cliente</p>
            </Card>
          </div>

          {/* KPI Cards Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Investido</p>
              <p className="text-xl font-bold text-slate-800">R$ {fmt(kpis?.totalSpent || 0)}</p>
              <p className="text-xs text-slate-400">de R$ {fmt(kpis?.totalBudget || 0)} orçados</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Receita Gerada</p>
              <p className="text-xl font-bold text-emerald-700">R$ {fmt(kpis?.revenue || 0)}</p>
              <p className="text-xs text-slate-400">Ticket médio: R$ {fmt(kpis?.avgTicket || 0)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Leads Gerados</p>
              <p className="text-xl font-bold text-slate-800">{fmtN(kpis?.totalLeads || 0)}</p>
              <p className="text-xs text-slate-400">{fmtN(kpis?.convertedLeads || 0)} convertidos</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Campanhas</p>
              <p className="text-xl font-bold text-slate-800">{kpis?.totalCampaigns || 0}</p>
              <p className="text-xs text-slate-400">{kpis?.activeCampaigns || 0} ativas</p>
            </Card>
          </div>

          {/* Funil + Campanhas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Funil de conversão */}
            <Card className="p-5">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-rose-500" /> Funil de Conversão
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Alcance Total', value: funnel.reached, color: 'bg-sky-400' },
                  { label: 'Leads Gerados', value: funnel.leads, color: 'bg-violet-400' },
                  { label: 'Leads Qualificados', value: funnel.qualified, color: 'bg-amber-400' },
                  { label: 'Convertidos (Clientes)', value: funnel.converted, color: 'bg-emerald-500' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold">{fmtN(value)}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${funnelMax > 0 ? (value / funnelMax) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Campanhas ativas */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-rose-500" /> Campanhas Ativas
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/marketing/campaigns')}>
                  Ver todas <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                {(kpis?.campaigns || []).filter((c: any) => c.status === 'active').slice(0, 5).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate('/admin/marketing/campaigns')}>
                    <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CHANNEL_COLOR[c.channel] || 'bg-slate-100'}`}>
                          {CHANNEL_LABEL[c.channel] || c.channel}
                        </span>
                        <span className="text-xs text-slate-400">{c.leadsCount} leads</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">R$ {fmt(Number(c.amountSpent || 0))}</p>
                      <p className="text-xs text-slate-400">investido</p>
                    </div>
                  </div>
                ))}
                {(kpis?.campaigns || []).filter((c: any) => c.status === 'active').length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">Nenhuma campanha ativa</p>
                )}
              </div>
            </Card>
          </div>

          {/* Indicadores adicionais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Eye className="w-5 h-5 text-sky-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-800">{fmtN(kpis?.totalReach || 0)}</p>
              <p className="text-xs text-slate-500">Alcance Total</p>
            </Card>
            <Card className="p-4 text-center">
              <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-800">{fmtN(kpis?.totalEngagements || 0)}</p>
              <p className="text-xs text-slate-500">Engajamentos</p>
            </Card>
            <Card className="p-4 text-center">
              <Zap className="w-5 h-5 text-violet-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-800">{kpis?.totalActions || 0}</p>
              <p className="text-xs text-slate-500">Ações Realizadas</p>
            </Card>
            <Card className="p-4 text-center">
              <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-800">R$ {fmt(kpis?.avgTicket || 0)}</p>
              <p className="text-xs text-slate-500">Ticket Médio</p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
