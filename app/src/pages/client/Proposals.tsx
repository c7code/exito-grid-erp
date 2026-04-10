import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { api } from '@/api';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: any; color: string }> = {
  sent: { label: 'Enviada', variant: 'secondary', icon: Send, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  viewed: { label: 'Visualizada', variant: 'secondary', icon: Eye, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  accepted: { label: 'Aprovada', variant: 'default', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

export default function ClientProposals() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProposals = async () => {
      try {
        const data = await api.getClientMyProposals();
        setProposals(data || []);
      } catch (err) {
        console.error('Erro ao carregar propostas:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProposals();
  }, []);

  const pendingCount = proposals.filter(p => p.status === 'sent' || p.status === 'viewed').length;
  const totalValue = proposals
    .filter(p => p.status === 'accepted')
    .reduce((acc, p) => acc + Number(p.total || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Minhas Propostas</h1>
        <p className="text-slate-500">Acompanhe suas propostas comerciais</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{proposals.length}</p>
              <p className="text-sm text-slate-500">Total de Propostas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-slate-500">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              <p className="text-sm text-slate-500">Valor Aprovado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma proposta disponível</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal: any) => {
            const statusInfo = statusLabels[proposal.status] || statusLabels.sent;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-slate-500">{proposal.proposalNumber}</span>
                        <Badge className={`flex items-center gap-1 ${statusInfo.color} border`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{proposal.title || 'Proposta Comercial'}</h3>
                      {proposal.scope && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{proposal.scope}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-emerald-600">
                        R$ {Number(proposal.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">Emitida em</span>
                      </div>
                      <p className="text-sm font-medium">{proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">Validade</span>
                      </div>
                      <p className="text-sm font-medium">{proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    {proposal.deadline && (
                      <div className="p-3 bg-slate-50 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">Prazo</span>
                        </div>
                        <p className="text-sm font-medium">{proposal.deadline}</p>
                      </div>
                    )}
                    {proposal.paymentConditions && (
                      <div className="p-3 bg-slate-50 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="text-xs">Pagamento</span>
                        </div>
                        <p className="text-sm font-medium truncate">{proposal.paymentConditions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
