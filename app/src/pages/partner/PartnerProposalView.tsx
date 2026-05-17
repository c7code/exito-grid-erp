import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { api } from '@/api';
import { toast } from 'sonner';
import { ArrowLeft, Printer, FileText, Building2, User, Calendar, Tag, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  draft:    { label: 'Rascunho',  color: 'bg-gray-100 text-gray-600',   icon: Clock },
  sent:     { label: 'Enviada',   color: 'bg-blue-100 text-blue-700',   icon: FileText },
  viewed:   { label: 'Visualizada', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  accepted: { label: 'Aprovada',  color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-700',     icon: XCircle },
};

export default function PartnerProposalView() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const { partnerToken } = usePartnerAuth();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proposalId || !partnerToken) return;
    (async () => {
      try {
        const data = await api.getPartnerProposal(proposalId, partnerToken);
        setProposal(data);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Erro ao carregar proposta');
        navigate('/partner/leads');
      } finally {
        setLoading(false);
      }
    })();
  }, [proposalId, partnerToken]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!proposal) return null;

  const st = STATUS_MAP[proposal.status] || STATUS_MAP.draft;
  const StatusIcon = st.icon;
  const items: any[] = Array.isArray(proposal.items) ? proposal.items : [];
  const payments: any[] = Array.isArray(proposal.paymentConditions) ? proposal.paymentConditions : [];
  const total = Number(proposal.total || 0);

  return (
    <div className="max-w-3xl mx-auto pb-16 print:max-w-none print:pb-0">

      {/* Toolbar — hidden on print */}
      <div className="no-print flex items-center justify-between mb-6">
        <button onClick={() => navigate('/partner/leads')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Voltar aos Leads
        </button>
        {proposal.allowDownload && (
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
            <Printer className="w-4 h-4" /> Salvar / Imprimir PDF
          </button>
        )}
      </div>

      {/* Proposal Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#064e3b] to-[#065f46] px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest">Proposta Comercial</p>
              <h1 className="text-2xl font-bold mt-1">{proposal.proposalNumber}</h1>
              {proposal.title && <p className="text-emerald-100 mt-1 text-sm">{proposal.title}</p>}
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${st.color}`}>
              <StatusIcon className="w-3.5 h-3.5" /> {st.label}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {proposal.client?.name && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Cliente</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{proposal.client.name}</p>
                {proposal.client.document && <p className="text-xs text-gray-500 mt-0.5">{proposal.client.document}</p>}
              </div>
            )}
            {total > 0 && (
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">Valor Total</span>
                </div>
                <p className="text-lg font-bold text-emerald-700">
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            )}
            {proposal.validUntil && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Válido até</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(proposal.validUntil).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Itens da Proposta
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Descrição</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 w-16">Qtd</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Unit.</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, idx: number) => {
                      const qty = Number(item.quantity || item.qty || 1);
                      const unit = Number(item.unitPrice || item.price || 0);
                      const lineTotal = Number(item.total || item.lineTotal || qty * unit);
                      return (
                        <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{item.description || item.name || '—'}</p>
                            {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">{qty}</td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {unit > 0 ? unit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            {lineTotal > 0 ? lineTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                      <td colSpan={3} className="px-4 py-3 text-sm font-bold text-emerald-800 text-right">Total Geral</td>
                      <td className="px-4 py-3 text-right text-base font-bold text-emerald-700">
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Condições de pagamento */}
          {payments.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" /> Condições de Pagamento
              </h2>
              <div className="space-y-2">
                {payments.map((pay: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{pay.description || pay.label || `Parcela ${idx + 1}`}</p>
                      {pay.dueDate && (
                        <p className="text-xs text-gray-400">Vencimento: {new Date(pay.dueDate).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-emerald-700">
                      {Number(pay.amount || pay.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {proposal.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-600 mb-1.5 uppercase tracking-wide">Observações</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposal.notes}</p>
            </div>
          )}

          {/* Footer da proposta */}
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-400">
              Proposta gerada em {new Date(proposal.createdAt).toLocaleDateString('pt-BR')} • {proposal.proposalNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
