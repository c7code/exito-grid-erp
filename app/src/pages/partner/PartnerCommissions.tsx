import { useEffect, useState } from 'react';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { api } from '@/api';
import { DollarSign, Clock, CheckCircle2, Award } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_CONFIG: Record<string, { label: string; icon: any; bg: string; text: string; border: string }> = {
  pending: { label: 'Pendente', icon: Clock, bg: '#fefce8', text: '#a16207', border: '#fde68a' },
  approved: { label: 'Aprovada', icon: CheckCircle2, bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  paid: { label: 'Paga', icon: Award, bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
};

export default function PartnerCommissions() {
  const { partnerToken } = usePartnerAuth();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');

  useEffect(() => {
    if (!partnerToken) return;
    api.getPartnerCommissions(partnerToken)
      .then(setCommissions)
      .finally(() => setIsLoading(false));
  }, [partnerToken]);

  const filtered = filter === 'all' ? commissions : commissions.filter(c => c.status === filter);

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.commissionValue || 0), 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.commissionValue || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commissionValue || 0), 0);

  const tabs: { key: 'all' | 'pending' | 'approved' | 'paid'; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: commissions.length },
    { key: 'pending', label: 'Pendentes', count: commissions.filter(c => c.status === 'pending').length },
    { key: 'approved', label: 'Aprovadas', count: commissions.filter(c => c.status === 'approved').length },
    { key: 'paid', label: 'Pagas', count: commissions.filter(c => c.status === 'paid').length },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-500 text-sm mt-1">Suas comissões por indicações de leads convertidos.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pendente', value: totalPending, color: '#f59e0b', icon: Clock },
          { label: 'Aprovada', value: totalApproved, color: '#0284c7', icon: CheckCircle2 },
          { label: 'Recebida', value: totalPaid, color: '#10b981', icon: Award },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
          <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Nenhuma comissão neste filtro</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Lead</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Valor Venda</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">%</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Comissão</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => {
                  const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                  const Icon = sc.icon;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 text-sm">{c.lead?.name || '—'}</p>
                        {c.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{c.notes}</p>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600 font-mono">
                        {c.saleValue ? fmt(Number(c.saleValue)) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {c.commissionPercent ? `${c.commissionPercent}%` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 font-mono">
                        {c.commissionValue ? fmt(Number(c.commissionValue)) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                        >
                          <Icon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-gray-400">
                        {c.paidAt
                          ? new Date(c.paidAt).toLocaleDateString('pt-BR')
                          : new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
