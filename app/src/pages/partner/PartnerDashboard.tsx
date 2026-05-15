import { useEffect, useState } from 'react';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { api } from '@/api';
import {
  Users,
  DollarSign,
  TrendingUp,
  Award,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualified: 'Qualificado',
  account_analysis: 'Análise',
  proposal_sent: 'Proposta Enviada',
  negotiation: 'Negociação',
  closed_won: 'Convertido',
  closed_lost: 'Perdido',
  no_profile: 'Sem Perfil',
};

const STATUS_COLOR: Record<string, string> = {
  new: '#6366f1',
  contacted: '#f59e0b',
  qualified: '#0284c7',
  account_analysis: '#8b5cf6',
  proposal_sent: '#0ea5e9',
  negotiation: '#f97316',
  closed_won: '#10b981',
  closed_lost: '#ef4444',
  no_profile: '#94a3b8',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function PartnerDashboard() {
  const { partnerToken } = usePartnerAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!partnerToken) return;
    Promise.all([
      api.getPartnerLeads(partnerToken),
      api.getPartnerCommissions(partnerToken),
    ]).then(([l, c]) => {
      setLeads(l);
      setCommissions(c);
    }).finally(() => setIsLoading(false));
  }, [partnerToken]);

  const totalLeads = leads.length;
  const converted = leads.filter(l => l.status === 'closed_won').length;
  const pending = commissions.filter(c => c.status === 'pending').reduce((s: number, c: any) => s + Number(c.commissionValue || 0), 0);
  const paid = commissions.filter(c => c.status === 'paid').reduce((s: number, c: any) => s + Number(c.commissionValue || 0), 0);

  const recentLeads = [...leads].slice(0, 5);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe seus indicados e comissões em tempo real.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Indicados" value={totalLeads} sub="todos os períodos" color="#0284c7" />
        <StatCard icon={TrendingUp} label="Convertidos" value={converted} sub={`${totalLeads > 0 ? Math.round(converted / totalLeads * 100) : 0}% de conversão`} color="#10b981" />
        <StatCard icon={Clock} label="Comissão Pendente" value={fmt(pending)} sub="aguardando aprovação" color="#f59e0b" />
        <StatCard icon={Award} label="Comissão Recebida" value={fmt(paid)} sub="total já pago" color="#8b5cf6" />
      </div>

      {/* Leads recentes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Leads Recentes</h2>
          <a href="/partner/leads" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            Ver todos <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        {recentLeads.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum lead cadastrado ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{lead.name}</p>
                  <p className="text-xs text-gray-400">{lead.city || '—'} · {lead.phone || '—'}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3"
                  style={{
                    background: `${STATUS_COLOR[lead.status] || '#94a3b8'}18`,
                    color: STATUS_COLOR[lead.status] || '#94a3b8',
                  }}
                >
                  {STATUS_LABEL[lead.status] || lead.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Últimas comissões */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Últimas Comissões</h2>
          <a href="/partner/commissions" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            Ver todas <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        {commissions.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma comissão registrada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {commissions.slice(0, 5).map((c) => (
              <div key={c.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{c.lead?.name || 'Lead'}</p>
                  <p className="text-xs text-gray-400">{fmt(Number(c.commissionValue || 0))} ({c.commissionPercent}%)</p>
                </div>
                <div className="flex items-center gap-1.5 ml-3">
                  {c.status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {c.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                  {c.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    c.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                    c.status === 'approved' ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {c.status === 'paid' ? 'Pago' : c.status === 'approved' ? 'Aprovado' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
