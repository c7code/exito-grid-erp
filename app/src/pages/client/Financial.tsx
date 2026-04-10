import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Loader2, Calendar, Receipt } from 'lucide-react';
import { api } from '@/api';

export default function ClientFinancial() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [receiptData, measurementData] = await Promise.all([
          api.getClientMyPublications('receipt').catch(() => []),
          api.getClientMyPublications('measurement').catch(() => []),
        ]);
        setReceipts((Array.isArray(receiptData) ? receiptData : []).filter((p: any) => p.content).map((p: any) => ({ ...p.content, publicationTitle: p.title })));
        setMeasurements((Array.isArray(measurementData) ? measurementData : []).filter((p: any) => p.content).map((p: any) => ({ ...p.content, publicationTitle: p.title })));
      } catch { /* empty */ }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  const allItems = [
    ...receipts.map(r => ({ ...r, itemType: 'receipt' })),
    ...measurements.map(m => ({ ...m, itemType: 'measurement' })),
  ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const totalPaid = receipts.reduce((acc, r) => acc + Number(r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Financeiro</h1>
        <p className="text-slate-500">Recibos e medições das suas obras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{receipts.length}</p>
              <p className="text-sm text-slate-500">Recibos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{measurements.length}</p>
              <p className="text-sm text-slate-500">Medições</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              <p className="text-sm text-slate-500">Total Pago</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {allItems.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Nenhum lançamento financeiro disponível</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {allItems.map((item: any, idx) => (
            <Card key={item.id || idx} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-medium text-slate-500">{item.receiptNumber || item.publicationTitle}</span>
                      <Badge variant="outline" className={item.itemType === 'receipt' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}>
                        {item.itemType === 'receipt' ? 'Recibo' : 'Medição'}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{item.description || item.publicationTitle || '-'}</h3>
                  </div>
                  {item.amount && (
                    <p className="text-lg font-bold text-emerald-600">R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-3">
                  <Calendar className="w-3.5 h-3.5" />
                  {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('pt-BR') : item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '-'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
