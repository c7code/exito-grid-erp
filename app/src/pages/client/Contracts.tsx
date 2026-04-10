import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Loader2, Calendar } from 'lucide-react';
import { api } from '@/api';

export default function ClientContracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getClientMyPublications('contract');
        setContracts((Array.isArray(data) ? data : []).filter((p: any) => p.content).map((p: any) => ({ ...p.content, publicationTitle: p.title })));
      } catch { /* empty */ }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Meus Contratos</h1>
        <p className="text-slate-500">Contratos vinculados às suas obras</p>
      </div>

      {contracts.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Nenhum contrato disponível</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract: any) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-500">{contract.contractNumber}</span>
                    <h3 className="text-lg font-bold text-slate-900">{contract.title || contract.publicationTitle || 'Contrato'}</h3>
                    <Badge variant="outline" className="mt-2">{contract.status === 'active' ? 'Ativo' : contract.status === 'signed' ? 'Assinado' : contract.status || 'Pendente'}</Badge>
                  </div>
                  <div className="text-right">
                    {contract.totalValue && <p className="text-lg font-bold text-emerald-600">R$ {Number(contract.totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500 mb-1"><Calendar className="w-3.5 h-3.5" /><span className="text-xs">Início</span></div>
                    <p className="text-sm font-medium">{contract.startDate ? new Date(contract.startDate).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500 mb-1"><Calendar className="w-3.5 h-3.5" /><span className="text-xs">Término</span></div>
                    <p className="text-sm font-medium">{contract.endDate ? new Date(contract.endDate).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
