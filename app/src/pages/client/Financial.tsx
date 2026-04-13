import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DollarSign, Loader2, Calendar, Receipt, Download, FileText,
  CheckCircle2, Clock, AlertTriangle, Copy, CreditCard,
  Building2, Barcode, QrCode, Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ═══ HELPERS ════════════════════════════════════════════════════════════════

const fmt = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

function getPaymentStatusConfig(status: string) {
  const map: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CreditCard },
    paid: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    overdue: { label: 'Atrasado', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
    cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock },
    scheduled: { label: 'Programado', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Calendar },
    // Fiscal invoice
    authorized: { label: 'Autorizada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: FileText },
    processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Loader2 },
    error: { label: 'Erro', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
    // Receipt
    issued: { label: 'Emitido', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  };
  return map[status] || map.pending;
}

const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  bank_transfer: 'Transferência',
  credit_card: 'Cartão',
  boleto: 'Boleto',
  cash: 'Dinheiro',
};

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'paid' || status === 'cancelled') return false;
  return new Date(dueDate) < new Date();
}

// ═══ COMPONENT ═════════════════════════════════════════════════════════════

export default function ClientFinancial() {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cobrancas');

  useEffect(() => {
    const load = async () => {
      try {
        const [payData, invData, recData, schData, measData] = await Promise.all([
          api.getClientMyPublications('payment').catch(() => []),
          api.getClientMyPublications('fiscal_invoice').catch(() => []),
          api.getClientMyPublications('receipt').catch(() => []),
          api.getClientMyPublications('payment_schedule').catch(() => []),
          api.getClientMyPublications('measurement').catch(() => []),
        ]);

        const extract = (data: any) => (Array.isArray(data) ? data : [])
          .filter((p: any) => p.content)
          .map((p: any) => ({ ...p.content, publicationTitle: p.title, publicationId: p.id, publishedAt: p.createdAt }));

        setPayments(extract(payData));
        setInvoices(extract(invData));
        setReceipts([
          ...extract(recData),
          ...extract(measData).map((m: any) => ({ ...m, itemType: 'measurement' })),
        ]);
        setSchedules(extract(schData));
      } catch { /* empty */ }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  // ═══ STATS ═══
  const stats = useMemo(() => {
    const totalPayments = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalPending = payments.filter(p => ['pending', 'partial'].includes(p.status)).reduce((acc, p) => acc + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);
    const totalOverdue = payments.filter(p => p.status === 'overdue' || isOverdue(p.dueDate, p.status)).reduce((acc, p) => acc + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);
    const totalNFs = invoices.reduce((acc, n) => acc + Number(n.totalValue || 0), 0);
    const totalReceipts = receipts.filter(r => r.itemType !== 'measurement').reduce((acc, r) => acc + Number(r.amount || 0), 0);
    return { totalPayments, totalPaid, totalPending, totalOverdue, totalNFs, totalReceipts, invoiceCount: invoices.length, receiptCount: receipts.length, scheduleCount: schedules.length, paymentCount: payments.length };
  }, [payments, invoices, receipts, schedules]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  const empty = payments.length === 0 && invoices.length === 0 && receipts.length === 0 && schedules.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Financeiro</h1>
        <p className="text-slate-500">Cobranças, notas fiscais e recibos das suas obras</p>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{fmt(stats.totalPaid)}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pago</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">{fmt(stats.totalPending)}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pendente</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">{fmt(stats.totalOverdue)}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Atrasado</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{stats.invoiceCount}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notas Fiscais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ SEARCH ═══ */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por descrição, número..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {empty ? (
        <Card><CardContent className="p-12 text-center"><DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Nenhum lançamento financeiro disponível</p></CardContent></Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="cobrancas" className="gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Barcode className="w-3.5 h-3.5" /> Cobranças {stats.paymentCount > 0 && <Badge variant="outline" className="text-[10px] ml-1">{stats.paymentCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="notas" className="gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <FileText className="w-3.5 h-3.5" /> Notas Fiscais {stats.invoiceCount > 0 && <Badge variant="outline" className="text-[10px] ml-1">{stats.invoiceCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="recibos" className="gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Receipt className="w-3.5 h-3.5" /> Recibos {stats.receiptCount > 0 && <Badge variant="outline" className="text-[10px] ml-1">{stats.receiptCount}</Badge>}
            </TabsTrigger>
            {schedules.length > 0 && (
              <TabsTrigger value="cronograma" className="gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Calendar className="w-3.5 h-3.5" /> Cronograma <Badge variant="outline" className="text-[10px] ml-1">{stats.scheduleCount}</Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {/* ═══ TAB: COBRANÇAS ═══ */}
          <TabsContent value="cobrancas" className="space-y-3 mt-4">
            {payments.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-slate-500">Nenhuma cobrança disponível</CardContent></Card>
            ) : (
              payments
                .filter(p => !searchTerm || p.description?.toLowerCase().includes(searchTerm.toLowerCase()) || p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(payment => {
                  const stCfg = getPaymentStatusConfig(isOverdue(payment.dueDate, payment.status) ? 'overdue' : payment.status);
                  const StIcon = stCfg.icon;
                  return (
                    <Card key={payment.id} className="border-none shadow-md overflow-hidden">
                      <CardContent className="p-0">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
                              payment.paymentMethod === 'boleto' ? 'bg-blue-100' :
                              payment.paymentMethod === 'pix' ? 'bg-emerald-100' : 'bg-indigo-100'
                            )}>
                              {payment.paymentMethod === 'boleto' ? <Barcode className="w-5 h-5 text-blue-600" /> :
                               payment.paymentMethod === 'pix' ? <QrCode className="w-5 h-5 text-emerald-600" /> :
                               <CreditCard className="w-5 h-5 text-indigo-600" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800">{payment.description || 'Cobrança'}</h3>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                {payment.workTitle && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{payment.workCode ? `${payment.workCode} — ` : ''}{payment.workTitle}</span>}
                                {payment.invoiceNumber && <span>NF: {payment.invoiceNumber}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">{fmt(payment.amount)}</p>
                            <Badge className={cn('text-[10px] gap-0.5 border', stCfg.color)}>
                              <StIcon className="w-3 h-3" /> {stCfg.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 flex flex-wrap items-center gap-4 text-sm">
                          {payment.dueDate && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Vencimento: <strong>{fmtDate(payment.dueDate)}</strong></span>
                            </div>
                          )}
                          {payment.paymentMethod && (
                            <Badge variant="outline" className="text-xs">
                              {METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                            </Badge>
                          )}
                          {payment.paidAt && (
                            <span className="text-xs text-emerald-600">Pago em {fmtDate(payment.paidAt)}</span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="p-4 pt-0 flex flex-wrap gap-2">
                          {payment.boletoUrl && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5" asChild>
                              <a href={payment.boletoUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3.5 h-3.5" />
                                Baixar Boleto
                              </a>
                            </Button>
                          )}
                          {payment.pixQrCode && (
                            <>
                              <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                onClick={() => copyToClipboard(payment.pixQrCode, 'Código PIX')}
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Copiar PIX
                              </Button>
                              {payment.pixQrCodeImage && (
                                <div className="ml-auto">
                                  <img src={payment.pixQrCodeImage} alt="QR Code PIX" className="w-20 h-20 rounded-lg border" />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </TabsContent>

          {/* ═══ TAB: NOTAS FISCAIS ═══ */}
          <TabsContent value="notas" className="space-y-3 mt-4">
            {invoices.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-slate-500">Nenhuma nota fiscal disponível</CardContent></Card>
            ) : (
              invoices
                .filter(n => !searchTerm || n.description?.toLowerCase().includes(searchTerm.toLowerCase()) || n.invoiceNumber?.includes(searchTerm) || n.accessKey?.includes(searchTerm))
                .map(nf => {
                  const stCfg = getPaymentStatusConfig(nf.status);
                  const StIcon = stCfg.icon;
                  return (
                    <Card key={nf.id} className="border-none shadow-md">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800">
                                  {nf.type === 'nfse' ? 'NFS-e' : 'NF-e'} {nf.invoiceNumber ? `#${nf.invoiceNumber}` : ''}
                                </h3>
                                <Badge className={cn('text-[10px] gap-0.5 border', stCfg.color)}>
                                  <StIcon className="w-3 h-3" /> {stCfg.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mt-0.5">{nf.description || nf.naturezaOperacao || 'Nota Fiscal'}</p>
                              {nf.recipientName && <p className="text-xs text-slate-400 mt-0.5">{nf.recipientName}{nf.recipientDocument ? ` — ${nf.recipientDocument}` : ''}</p>}
                              {nf.installmentNumber && (
                                <Badge variant="outline" className="text-[10px] mt-1">
                                  Parcela {nf.installmentNumber}/{nf.installmentTotal || '?'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">{fmt(nf.totalValue)}</p>
                            <p className="text-xs text-slate-500">{fmtDate(nf.issueDate || nf.createdAt)}</p>
                          </div>
                        </div>

                        {/* Access key + Actions */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {nf.accessKey && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-slate-600"
                              onClick={() => copyToClipboard(nf.accessKey, 'Chave de acesso')}
                            >
                              <Copy className="w-3 h-3" /> Copiar Chave de Acesso
                            </Button>
                          )}
                          {nf.danfePdfPath && (
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5" asChild>
                              <a href={nf.danfePdfPath} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3.5 h-3.5" /> Baixar DANFE
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </TabsContent>

          {/* ═══ TAB: RECIBOS ═══ */}
          <TabsContent value="recibos" className="space-y-3 mt-4">
            {receipts.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-slate-500">Nenhum recibo disponível</CardContent></Card>
            ) : (
              receipts
                .filter(r => !searchTerm || r.description?.toLowerCase().includes(searchTerm.toLowerCase()) || r.receiptNumber?.includes(searchTerm) || r.publicationTitle?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item, idx) => {
                  const isMeas = item.itemType === 'measurement';
                  return (
                    <Card key={item.id || idx} className="border-none shadow-md">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', isMeas ? 'bg-blue-100' : 'bg-emerald-100')}>
                              {isMeas ? <DollarSign className="w-5 h-5 text-blue-600" /> : <Receipt className="w-5 h-5 text-emerald-600" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-500">{item.receiptNumber || item.publicationTitle}</span>
                                <Badge variant="outline" className={cn('text-[10px]', isMeas ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200')}>
                                  {isMeas ? 'Medição' : 'Recibo'}
                                </Badge>
                              </div>
                              <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.description || item.publicationTitle || '—'}</h3>
                            </div>
                          </div>
                          {item.amount && (
                            <p className="text-lg font-bold text-emerald-600">{fmt(item.amount)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-3">
                          <Calendar className="w-3.5 h-3.5" />
                          {fmtDate(item.paymentDate || item.paidAt || item.createdAt)}
                          {item.paymentMethod && (
                            <Badge variant="outline" className="text-[10px] ml-2">
                              {METHOD_LABELS[item.paymentMethod] || item.paymentMethod}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </TabsContent>

          {/* ═══ TAB: CRONOGRAMA ═══ */}
          {schedules.length > 0 && (
            <TabsContent value="cronograma" className="space-y-3 mt-4">
              <Card className="border-none shadow-md overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                  <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Cronograma de Pagamentos
                  </h3>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    {schedules.length} parcela(s) — Total: {fmt(schedules.reduce((a: number, s: any) => a + Number(s.amount || 0), 0))}
                  </p>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {schedules
                      .filter((s: any) => !searchTerm || s.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                      .sort((a: any, b: any) => a.installmentNumber - b.installmentNumber)
                      .map((sch: any) => {
                        const overdue = isOverdue(sch.dueDate, sch.status);
                        const stCfg = getPaymentStatusConfig(overdue ? 'overdue' : sch.status);
                        const StIcon = stCfg.icon;
                        return (
                          <div key={sch.id} className={cn('flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors', overdue && 'bg-red-50/50')}>
                            <div className="flex items-center gap-3">
                              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                                sch.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                overdue ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-600'
                              )}>
                                {sch.installmentNumber || '—'}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-slate-800">{sch.description || `Parcela ${sch.installmentNumber}/${sch.totalInstallments}`}</p>
                                <p className="text-xs text-slate-500">
                                  Vencimento: {fmtDate(sch.dueDate)}
                                  {sch.workTitle && <span className="ml-2">• {sch.workTitle}</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-slate-800">{fmt(sch.amount)}</p>
                              <Badge className={cn('text-[10px] gap-0.5 border', stCfg.color)}>
                                <StIcon className="w-3 h-3" /> {stCfg.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
