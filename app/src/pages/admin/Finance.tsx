import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { ReceiptPDFTemplate } from '@/components/ReceiptPDFTemplate';
import { PurchaseOrderPDFTemplate } from '@/components/PurchaseOrderPDFTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  Plus, Search, Filter, Loader2, Edit2, Trash2,
  CheckCircle, MoreVertical, FileText, Upload, Share2,
  Download, Building2, Banknote, X, GitBranch,
  Receipt, Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '@/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORY_COLORS: Record<string, string> = {
  materials: '#ef4444',
  labor: '#f59e0b',
  equipment: '#8b5cf6',
  tax: '#3b82f6',
  office: '#10b981',
  project: '#06b6d4',
  utilities: '#64748b',
  marketing: '#eab308',
  other: '#94a3b8',
};

export default function AdminFinance() {
  const [summary, setSummary] = useState<any>(null);
  const [dre, setDre] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle URL params from Proposals/Contracts shortcuts
  useEffect(() => {
    const tab = searchParams.get('tab');
    const proposalId = searchParams.get('proposalId');
    if (tab) setActiveTab(tab);
    if (tab === 'receipts' && proposalId) {
      setTimeout(() => {
        setEditingReceiptId(null);
        setReceiptForm({
          description: searchParams.get('title') ? decodeURIComponent(searchParams.get('title')!) : '',
          amount: '', percentage: '100',
          totalProposalValue: searchParams.get('total') || '0',
          paymentMethod: 'pix',
          paidAt: new Date().toISOString().split('T')[0],
          notes: `Ref. Proposta ${searchParams.get('proposalNumber') || ''}`,
          status: 'issued',
          clientId: searchParams.get('clientId') || '',
          proposalId,
          proposalNumber: searchParams.get('proposalNumber') || '',
        });
        setReceiptDialogOpen(true);
        setSearchParams({});
      }, 500);
    } else if (tab === 'purchase-orders' && proposalId) {
      setTimeout(async () => {
        setEditingPOId(null);
        setPOForm({
          type: 'company_billing', status: 'draft',
          totalValue: '', paymentTerms: '',
          notes: `Ref. Proposta ${searchParams.get('proposalNumber') || ''}`,
          internalNotes: '', internalMargin: '0',
          deliveryDate: '', deliveryAddress: '',
          supplierId: '',
          clientId: searchParams.get('clientId') || '',
          proposalId,
          proposalNumber: searchParams.get('proposalNumber') || '',
        });
        // Auto-populate items from proposal
        try {
          const proposal = await api.getProposal(proposalId);
          const proposalItems = proposal.items || [];
          if (proposalItems.length > 0) {
            const mapped = proposalItems.filter((i: any) => !i.parentId || !i.isBundleParent).map((i: any) => ({
              description: i.description || '',
              quantity: String(i.quantity || 1),
              unit: i.unit || (i.serviceType === 'material' ? 'un' : 'sv'),
              unitPrice: String(i.unitPrice || 0),
              totalPrice: String(Number(i.quantity || 1) * Number(i.unitPrice || 0)),
              internalCost: '',
            }));
            setPOItems(mapped.length > 0 ? mapped : [{ description: '', quantity: '1', unit: 'un', unitPrice: '0', totalPrice: '0', internalCost: '' }]);
          } else {
            setPOItems([{ description: '', quantity: '1', unit: 'un', unitPrice: '0', totalPrice: '0', internalCost: '' }]);
          }
        } catch {
          setPOItems([{ description: '', quantity: '1', unit: 'un', unitPrice: '0', totalPrice: '0', internalCost: '' }]);
        }
        setPODialogOpen(true);
        setSearchParams({});
      }, 500);
    } else if (tab) {
      setSearchParams({});
    }
  }, [searchParams]);

  // ── Recibos ──
  const [receipts, setReceipts] = useState<any[]>([]);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState<any>({ description: '', amount: '', percentage: '100', totalProposalValue: '0', paymentMethod: 'pix', paidAt: new Date().toISOString().split('T')[0], notes: '', status: 'issued', clientId: '', proposalId: '' });
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);

  // ── Pedidos de Compra ──
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poDialogOpen, setPODialogOpen] = useState(false);
  const [poForm, setPOForm] = useState<any>({ type: 'company_billing', status: 'draft', totalValue: '', paymentTerms: '', notes: '', internalNotes: '', internalMargin: '0', deliveryDate: '', deliveryAddress: '', supplierId: '', clientId: '', proposalId: '', proposalNumber: '', contractNumber: '', workName: '' });
  const [poItems, setPOItems] = useState<any[]>([{ description: '', quantity: '1', unit: 'un', unitPrice: '0', totalPrice: '0', internalCost: '' }]);
  const [editingPOId, setEditingPOId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // ── PDF Print ──
  const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
  const [poToPrint, setPOToPrint] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  const emptyForm = {
    description: '', amount: '', type: 'income', category: 'other',
    dueDate: '', billingDate: '', scheduledPaymentDate: '',
    workId: '', invoiceNumber: '', notes: '',
    retentionPercentage: '0', taxWithholding: '0',
    taxISS: '0', taxISSAmount: '0',
    taxCSLL: '0', taxCSLLAmount: '0',
    taxPISCOFINS: '0', taxPISCOFINSAmount: '0',
    taxIRRF: '0', taxIRRFAmount: '0',
    taxICMS: '0', taxICMSAmount: '0',
    taxObservation: '', taxCost: '0',
    costCenter: '', financialOrigin: '',
  };

  const [formData, setFormData] = useState<any>(emptyForm);
  const [apportionmentItems, setApportionmentItems] = useState<Array<{ description: string; percentage: string; amount: string }>>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [activeFormTab, setActiveFormTab] = useState('basics');

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [registerData, setRegisterData] = useState({
    amount: 0,
    method: 'transfer',
    transactionId: '',
  });

  useEffect(() => {
    loadData();
    loadWorks();
    loadReceipts();
    loadPurchaseOrders();
    loadSuppliers();
    loadClients();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, dreData, paymentsData] = await Promise.all([
        api.getFinanceSummary(),
        api.getDREReport(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          new Date().toISOString()
        ),
        api.getPayments(),
      ]);
      setSummary(sum);
      setDre(dreData);
      setPayments(paymentsData);
      // Load company data for PDF templates
      try { const cos = await api.getCompanies(); if (cos?.length) setCompanyData(cos[0]); } catch {}
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados financeiros.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorks = async () => { try { setWorks(await api.getWorks()); } catch {} };
  const loadReceipts = async () => { try { setReceipts(await api.getReceipts()); } catch {} };
  const loadPurchaseOrders = async () => { try { setPurchaseOrders(await api.getPurchaseOrders()); } catch {} };
  const loadSuppliers = async () => { try { setSuppliers(await api.getSuppliers()); } catch {} };
  const loadClients = async () => { try { setClients(await api.getClients()); } catch {} };

  // ── Receipt CRUD ──
  const handleSaveReceipt = async () => {
    try {
      const data: any = { ...receiptForm, amount: Number(receiptForm.amount || 0), percentage: Number(receiptForm.percentage || 100), totalProposalValue: Number(receiptForm.totalProposalValue || 0) };
      if (!data.clientId) data.clientId = null;
      if (!data.proposalId) data.proposalId = null;
      if (editingReceiptId) { await api.updateReceipt(editingReceiptId, data); toast.success('Recibo atualizado'); }
      else { await api.createReceipt(data); toast.success('Recibo criado'); }
      setReceiptDialogOpen(false); setEditingReceiptId(null); loadReceipts();
    } catch { toast.error('Erro ao salvar recibo'); }
  };
  const handleEditReceipt = (r: any) => {
    setEditingReceiptId(r.id);
    setReceiptForm({ description: r.description || '', amount: String(r.amount || ''), percentage: String(r.percentage || 100), totalProposalValue: String(r.totalProposalValue || 0), paymentMethod: r.paymentMethod || 'pix', paidAt: r.paidAt?.split('T')[0] || '', notes: r.notes || '', status: r.status || 'issued', clientId: r.clientId || '', proposalId: r.proposalId || '' });
    setReceiptDialogOpen(true);
  };
  const handleDeleteReceipt = async (id: string) => { if (!confirm('Excluir recibo?')) return; try { await api.deleteReceipt(id); toast.success('Recibo excluído'); loadReceipts(); } catch { toast.error('Erro'); } };

  // ── Purchase Order CRUD ──
  const handleSavePO = async () => {
    try {
      const items = poItems.filter(i => i.description?.trim()).map(i => ({ ...i, quantity: Number(i.quantity || 1), unitPrice: Number(i.unitPrice || 0), totalPrice: Number(i.quantity || 1) * Number(i.unitPrice || 0), internalCost: i.internalCost ? Number(i.internalCost) : undefined }));
      const data: any = { ...poForm, totalValue: items.reduce((s: number, i: any) => s + i.totalPrice, 0), internalMargin: Number(poForm.internalMargin || 0), items };
      // Sanitize empty strings to null for UUID fields
      if (!data.supplierId) data.supplierId = null;
      if (!data.clientId) data.clientId = null;
      if (!data.proposalId) data.proposalId = null;
      if (!data.deliveryDate) data.deliveryDate = null;
      if (editingPOId) { await api.updatePurchaseOrder(editingPOId, data); toast.success('Pedido atualizado'); }
      else { await api.createPurchaseOrder(data); toast.success('Pedido criado'); }
      setPODialogOpen(false); setEditingPOId(null); loadPurchaseOrders();
    } catch { toast.error('Erro ao salvar pedido'); }
  };
  const handleEditPO = (po: any) => {
    setEditingPOId(po.id);
    setPOForm({ type: po.type || 'company_billing', status: po.status || 'draft', totalValue: String(po.totalValue || ''), paymentTerms: po.paymentTerms || '', notes: po.notes || '', internalNotes: po.internalNotes || '', internalMargin: String(po.internalMargin || 0), deliveryDate: po.deliveryDate?.split('T')[0] || '', deliveryAddress: po.deliveryAddress || '', supplierId: po.supplierId || '', clientId: po.clientId || '', proposalId: po.proposalId || '', proposalNumber: po.proposalNumber || '', contractNumber: po.contractNumber || '', workName: po.workName || '' });
    setPOItems(po.items?.length ? po.items.map((i: any) => ({ description: i.description, quantity: String(i.quantity), unit: i.unit || 'un', unitPrice: String(i.unitPrice), totalPrice: String(i.totalPrice), internalCost: i.internalCost ? String(i.internalCost) : '', notes: i.notes || '' })) : [{ description: '', quantity: '1', unit: 'un', unitPrice: '0', totalPrice: '0', internalCost: '' }]);
    setPODialogOpen(true);
  };
  const handleDeletePO = async (id: string) => { if (!confirm('Excluir pedido de compra?')) return; try { await api.deletePurchaseOrder(id); toast.success('Pedido excluído'); loadPurchaseOrders(); } catch { toast.error('Erro'); } };

  // ── PDF Generation ──
  const pdfOpts = (filename: string, elWidth = 794) => ({
    margin: [10, 0, 12, 0] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 3, dpi: 192, useCORS: true, letterRendering: true, width: elWidth, windowWidth: elWidth },
    jsPDF: { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] } as any,
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.next-page', avoid: ['tr', '.pdf-keep-together', '.pdf-section-title', '.sig-block', '.avoid-page-break'] },
  });

  const handleDownloadReceiptPDF = (receipt: any) => {
    toast.info('Gerando PDF do recibo...');
    setReceiptToPrint(receipt);
    setTimeout(() => {
      const el = document.getElementById('receipt-pdf-content');
      if (!el) { toast.error('Erro ao gerar PDF'); setReceiptToPrint(null); return; }
      html2pdf().from(el).set(pdfOpts(`recibo_${receipt.receiptNumber || 'novo'}.pdf`)).save()
        .then(() => { setReceiptToPrint(null); toast.success('PDF do recibo gerado!'); })
        .catch(() => { toast.error('Erro ao gerar PDF'); setReceiptToPrint(null); });
    }, 600);
  };

  const handleDownloadPOPDF = (po: any) => {
    toast.info('Gerando PDF do pedido...');
    setPOToPrint(po);
    setTimeout(() => {
      const el = document.getElementById('po-pdf-content');
      if (!el) { toast.error('Erro ao gerar PDF'); setPOToPrint(null); return; }
      html2pdf().from(el).set(pdfOpts(`pedido_compra_${po.orderNumber || 'novo'}.pdf`)).save()
        .then(() => { setPOToPrint(null); toast.success('PDF do pedido gerado!'); })
        .catch(() => { toast.error('Erro ao gerar PDF'); setPOToPrint(null); });
    }, 600);
  };

  // ── Publish payment to client portal ──
  const handlePublishPaymentToPortal = async (payment: any) => {
    if (payment.type !== 'income') { toast.error('Apenas cobranças (receitas) podem ser publicadas no portal'); return; }
    const clientId = payment.clientId || payment.work?.client?.id;
    if (!clientId) { toast.error('Pagamento não possui cliente vinculado. Vincule uma obra ou cliente antes de publicar.'); return; }
    try {
      await api.publishToPortal({
        clientId,
        contentType: 'payment',
        contentId: payment.id,
        title: payment.description || 'Cobrança',
        description: `Vencimento: ${payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('pt-BR') : '—'} — R$ ${Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        metadata: { amount: payment.amount, dueDate: payment.dueDate, paymentMethod: payment.paymentMethod, status: payment.status },
      });
      toast.success('Cobrança publicada no portal do cliente!');
    } catch { toast.error('Erro ao publicar no portal'); }
  };

  // ── Publish receipt to client portal ──
  const handlePublishReceiptToPortal = async (receipt: any) => {
    const clientId = receipt.clientId;
    if (!clientId) { toast.error('Recibo não possui cliente vinculado'); return; }
    try {
      await api.publishToPortal({
        clientId,
        contentType: 'receipt',
        contentId: receipt.id,
        title: `Recibo ${receipt.receiptNumber}`,
        description: receipt.description || `R$ ${Number(receipt.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        metadata: { amount: receipt.amount, receiptNumber: receipt.receiptNumber, paymentMethod: receipt.paymentMethod },
      });
      toast.success('Recibo publicado no portal do cliente!');
    } catch { toast.error('Erro ao publicar recibo no portal'); }
  };

  const handleEdit = (payment: any) => {
    setEditingPaymentId(payment.id);
    setFormData({
      description: payment.description,
      amount: payment.amount.toString(),
      type: payment.type,
      category: payment.category || 'other',
      dueDate: payment.dueDate?.split('T')[0] || '',
      billingDate: payment.billingDate?.split('T')[0] || '',
      scheduledPaymentDate: payment.scheduledPaymentDate?.split('T')[0] || '',
      workId: payment.workId || '',
      invoiceNumber: payment.invoiceNumber || '',
      notes: payment.notes || '',
      retentionPercentage: (payment.retentionPercentage || 0).toString(),
      taxWithholding: (payment.taxWithholding || 0).toString(),
      taxISS: (payment.taxISS || 0).toString(),
      taxISSAmount: (payment.taxISSAmount || 0).toString(),
      taxCSLL: (payment.taxCSLL || 0).toString(),
      taxCSLLAmount: (payment.taxCSLLAmount || 0).toString(),
      taxPISCOFINS: (payment.taxPISCOFINS || 0).toString(),
      taxPISCOFINSAmount: (payment.taxPISCOFINSAmount || 0).toString(),
      taxIRRF: (payment.taxIRRF || 0).toString(),
      taxIRRFAmount: (payment.taxIRRFAmount || 0).toString(),
      taxICMS: (payment.taxICMS || 0).toString(),
      taxICMSAmount: (payment.taxICMSAmount || 0).toString(),
      taxObservation: payment.taxObservation || '',
      taxCost: (payment.taxCost || 0).toString(),
      costCenter: payment.costCenter || '',
      financialOrigin: payment.financialOrigin || '',
    });
    setApportionmentItems(
      (payment.apportionmentItems || []).map((i: any) => ({
        description: i.description,
        percentage: i.percentage.toString(),
        amount: i.amount.toString(),
      }))
    );
    setInvoiceFile(null);
    setActiveFormTab('basics');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este lançamento?')) return;
    try {
      await api.deletePayment(id);
      toast.success('Lançamento removido com sucesso!');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover lançamento.');
    }
  };

  /** Abre o dialog de edição diretamente em uma aba específica */
  const openPaymentOnTab = (payment: any, tab: string) => {
    handleEdit(payment);
    // Override the tab set by handleEdit
    setTimeout(() => setActiveFormTab(tab), 0);
  };

  const handleOpenRegister = (payment: any) => {
    setSelectedPayment(payment);
    setRegisterData({
      amount: payment.amount,
      method: 'transfer',
      transactionId: '',
    });
    setIsRegisterDialogOpen(true);
  };

  const handleRegisterPayment = async () => {
    if (!selectedPayment) return;
    try {
      await api.registerPayment(selectedPayment.id, registerData);
      toast.success('Baixa realizada com sucesso!');
      setIsRegisterDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao realizar baixa.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numFields = [
        'amount', 'taxWithholding', 'taxCost', 'retentionPercentage',
        'taxISS', 'taxISSAmount', 'taxCSLL', 'taxCSLLAmount',
        'taxPISCOFINS', 'taxPISCOFINSAmount', 'taxIRRF', 'taxIRRFAmount',
        'taxICMS', 'taxICMSAmount',
      ];
      const payload: any = { ...formData };
      numFields.forEach(f => { payload[f] = Number(payload[f] || 0); });
      payload.apportionmentItems = apportionmentItems.map(i => ({
        description: i.description,
        percentage: Number(i.percentage),
        amount: Number(i.amount),
      }));

      let savedId = editingPaymentId;
      if (editingPaymentId) {
        await api.updatePayment(editingPaymentId, payload);
        toast.success('Lançamento atualizado!');
      } else {
        const created = await api.createPayment(payload);
        savedId = created.id;
        toast.success('Lançamento criado!');
      }

      if (invoiceFile && savedId) {
        await api.uploadPaymentInvoice(savedId, invoiceFile);
        toast.success('Nota fiscal anexada!');
      }

      setIsDialogOpen(false);
      setEditingPaymentId(null);
      setFormData(emptyForm);
      setApportionmentItems([]);
      setInvoiceFile(null);
      setActiveFormTab('basics');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar lançamento.');
    }
  };

  const revenueVsExpense = [
    { name: 'Receitas', value: summary?.receivedThisMonth || 0 },
    { name: 'Despesas', value: summary?.paidThisMonth || 0 },
  ];

  const expenseByCategory = dre?.expense ? Object.entries(dre.expense).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number(value),
    key: name,
  })) : [];

  const filteredPayments = activeTab === 'overview'
    ? payments
    : payments.filter(p => p.type === (activeTab === 'receivable' ? 'income' : 'expense'));

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Carregando financeiro...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Financeiro Profissional</h1>
          <p className="text-slate-500">Gestão de fluxo de caixa, DRE e medições</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>Atualizar</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[820px] max-h-[92vh] flex flex-col overflow-hidden p-0">
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2">
                  <DialogTitle>{editingPaymentId ? 'Editar' : 'Novo'} Lançamento Financeiro</DialogTitle>
                </DialogHeader>
                <Tabs value={activeFormTab} onValueChange={setActiveFormTab} className="flex flex-col flex-1 overflow-hidden">
                  <TabsList className="grid grid-cols-5 mx-6 mb-1">
                    <TabsTrigger value="basics">Dados</TabsTrigger>
                    <TabsTrigger value="taxes">Impostos</TabsTrigger>
                    <TabsTrigger value="invoice">Nota Fiscal</TabsTrigger>
                    <TabsTrigger value="split">Rateio</TabsTrigger>
                    <TabsTrigger value="costcenter">Centro</TabsTrigger>
                  </TabsList>
                  <div className="overflow-y-auto flex-1 px-6">
                    {/* ── ABA 1: DADOS BÁSICOS ────────────────────────────────── */}
                    <TabsContent value="basics" className="mt-0">
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2 col-span-2">
                          <Label>Descrição *</Label>
                          <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Bruto (R$) *</Label>
                          <Input type="text" inputMode="decimal" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo *</Label>
                          <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Receita (A Receber)</SelectItem>
                              <SelectItem value="expense">Despesa (A Pagar)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="materials">Materiais</SelectItem>
                              <SelectItem value="labor">Mão de Obra</SelectItem>
                              <SelectItem value="equipment">Equipamentos</SelectItem>
                              <SelectItem value="tax">Impostos</SelectItem>
                              <SelectItem value="office">Escritório</SelectItem>
                              <SelectItem value="project">Projeto</SelectItem>
                              <SelectItem value="utilities">Utilidades</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="other">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Obra/Projeto</Label>
                          <Select value={formData.workId} onValueChange={v => setFormData({ ...formData, workId: v })}>
                            <SelectTrigger><SelectValue placeholder="Selecione uma obra" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma</SelectItem>
                              {works.map(w => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Vencimento *</Label>
                          <Input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Data de Faturamento</Label>
                          <Input type="date" value={formData.billingDate} onChange={e => setFormData({ ...formData, billingDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Pagamento Programado</Label>
                          <Input type="date" value={formData.scheduledPaymentDate} onChange={e => setFormData({ ...formData, scheduledPaymentDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Nº da Nota Fiscal</Label>
                          <Input value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="Ex: 001234" />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Observações</Label>
                          <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── ABA 2: RETENÇÕES E IMPOSTOS ─────────────────────────── */}
                    <TabsContent value="taxes" className="mt-0">
                      <div className="space-y-4 py-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                            <Banknote className="w-4 h-4" /> Retenção Contratual
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-sm">Percentual (%)</Label>
                              <Input type="text" inputMode="decimal" step="0.01" min="0" max="100"
                                value={formData.retentionPercentage}
                                onChange={e => {
                                  const pct = e.target.value;
                                  const base = Number(formData.amount) || 0;
                                  setFormData({ ...formData, retentionPercentage: pct, taxWithholding: ((Number(pct) / 100) * base).toFixed(2) });
                                }} placeholder="0,00" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm">Valor Retido (R$)</Label>
                              <Input type="text" inputMode="decimal" step="0.01" min="0"
                                value={formData.taxWithholding}
                                onChange={e => {
                                  const val = e.target.value;
                                  const base = Number(formData.amount) || 0;
                                  setFormData({ ...formData, taxWithholding: val, retentionPercentage: base > 0 ? ((Number(val) / base) * 100).toFixed(2) : '0' });
                                }} placeholder="0,00" />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b">
                            <span className="font-semibold text-slate-700 text-sm">Impostos Retidos na Fonte</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {[
                              { label: 'ISS — Municipal', pctKey: 'taxISS', amtKey: 'taxISSAmount', badge: 'Municipal', color: 'blue' },
                              { label: 'CSLL — Federal', pctKey: 'taxCSLL', amtKey: 'taxCSLLAmount', badge: 'Federal', color: 'purple' },
                              { label: 'PIS/COFINS — Federal', pctKey: 'taxPISCOFINS', amtKey: 'taxPISCOFINSAmount', badge: 'Federal', color: 'purple' },
                              { label: 'IRRF — Federal', pctKey: 'taxIRRF', amtKey: 'taxIRRFAmount', badge: 'Federal', color: 'purple' },
                              { label: 'ICMS — Estadual', pctKey: 'taxICMS', amtKey: 'taxICMSAmount', badge: 'Estadual', color: 'green' },
                            ].map(({ label, pctKey, amtKey, badge, color }) => (
                              <div key={pctKey} className="grid grid-cols-[1fr_100px_100px] gap-2 items-center px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700">{label}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded bg-${color}-100 text-${color}-700`}>{badge}</span>
                                </div>
                                <Input type="text" inputMode="decimal" step="0.01" min="0" max="100" className="h-8 text-sm"
                                  placeholder="%"
                                  value={formData[pctKey]}
                                  onChange={e => {
                                    const pct = e.target.value;
                                    const base = Number(formData.amount) || 0;
                                    setFormData({ ...formData, [pctKey]: pct, [amtKey]: ((Number(pct) / 100) * base).toFixed(2) });
                                  }} />
                                <Input type="text" inputMode="decimal" step="0.01" min="0" className="h-8 text-sm"
                                  placeholder="R$"
                                  value={formData[amtKey]}
                                  onChange={e => {
                                    const val = e.target.value;
                                    const base = Number(formData.amount) || 0;
                                    setFormData({ ...formData, [amtKey]: val, [pctKey]: base > 0 ? ((Number(val) / base) * 100).toFixed(2) : '0' });
                                  }} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Observações sobre Impostos</Label>
                          <Input value={formData.taxObservation} onChange={e => setFormData({ ...formData, taxObservation: e.target.value })}
                            placeholder="Descreva qual imposto está sendo retido e o motivo..." />
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── ABA 3: NOTA FISCAL ──────────────────────────────────── */}
                    <TabsContent value="invoice" className="mt-0">
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Número da Nota Fiscal</Label>
                          <Input value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="Ex: 001234" />
                        </div>
                        <div className="space-y-2">
                          <Label>Anexar Arquivo da NF</Label>
                          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                            {invoiceFile ? (
                              <div className="flex items-center justify-center gap-3">
                                <FileText className="w-8 h-8 text-emerald-500" />
                                <div>
                                  <p className="font-medium text-slate-700">{invoiceFile.name}</p>
                                  <p className="text-sm text-slate-400">{(invoiceFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setInvoiceFile(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Clique para selecionar ou arraste o arquivo</p>
                                <p className="text-xs text-slate-400 mt-1">PDF, XML, PNG, JPG — Máx. 10MB</p>
                                <input type="file" className="hidden" accept=".pdf,.xml,.png,.jpg,.jpeg"
                                  onChange={e => setInvoiceFile(e.target.files?.[0] || null)} />
                              </label>
                            )}
                          </div>
                        </div>
                        {editingPaymentId && (
                          <Button type="button" variant="outline" className="w-full"
                            onClick={async () => {
                              const blob = await api.downloadPaymentInvoice(editingPaymentId);
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a'); a.href = url; a.download = 'nota-fiscal'; a.click();
                            }}>
                            <Download className="w-4 h-4 mr-2" /> Baixar NF Existente
                          </Button>
                        )}
                      </div>
                    </TabsContent>

                    {/* ── ABA 4: RATEIO ───────────────────────────────────────── */}
                    <TabsContent value="split" className="mt-0">
                      <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-700">Rateio de Pagamento</h3>
                            <p className="text-xs text-slate-400">Distribua o valor entre centros ou responsáveis. Total deve ser 100%.</p>
                          </div>
                          <Button type="button" size="sm" variant="outline"
                            onClick={() => setApportionmentItems([...apportionmentItems, { description: '', percentage: '0', amount: '0' }])}>
                            <Plus className="w-4 h-4 mr-1" /> Adicionar
                          </Button>
                        </div>
                        {apportionmentItems.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-lg">
                            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Nenhum item de rateio adicionado</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-[1fr_80px_90px_32px] gap-2 text-xs font-medium text-slate-500 px-1">
                              <span>Descrição</span><span className="text-center">%</span><span className="text-center">Valor R$</span><span />
                            </div>
                            {apportionmentItems.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-[1fr_80px_90px_32px] gap-2 items-center">
                                <Input className="h-8 text-sm" placeholder="Ex: Centro Elétrico" value={item.description}
                                  onChange={e => { const ns = [...apportionmentItems]; ns[idx].description = e.target.value; setApportionmentItems(ns); }} />
                                <Input type="text" inputMode="decimal" step="0.01" min="0" max="100" className="h-8 text-sm text-center" value={item.percentage}
                                  onChange={e => {
                                    const ns = [...apportionmentItems];
                                    ns[idx].percentage = e.target.value;
                                    ns[idx].amount = ((Number(e.target.value) / 100) * (Number(formData.amount) || 0)).toFixed(2);
                                    setApportionmentItems(ns);
                                  }} />
                                <Input type="text" inputMode="decimal" step="0.01" min="0" className="h-8 text-sm text-center" value={item.amount}
                                  onChange={e => {
                                    const ns = [...apportionmentItems];
                                    const base = Number(formData.amount) || 0;
                                    ns[idx].amount = e.target.value;
                                    ns[idx].percentage = base > 0 ? ((Number(e.target.value) / base) * 100).toFixed(2) : '0';
                                    setApportionmentItems(ns);
                                  }} />
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500"
                                  onClick={() => setApportionmentItems(apportionmentItems.filter((_, i) => i !== idx))}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex justify-between pt-2 border-t text-sm font-semibold">
                              <span>Total</span>
                              <span className={Math.abs(apportionmentItems.reduce((s, i) => s + Number(i.percentage || 0), 0) - 100) < 0.01 ? 'text-emerald-600' : 'text-rose-500'}>
                                {apportionmentItems.reduce((s, i) => s + Number(i.percentage || 0), 0).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* ── ABA 5: CENTRO DE CUSTO ──────────────────────────────── */}
                    <TabsContent value="costcenter" className="mt-0">
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Centro de Custo</Label>
                          <Input value={formData.costCenter} onChange={e => setFormData({ ...formData, costCenter: e.target.value })}
                            placeholder="Ex: Obra 001 — Subestação Norte, Departamento Administrativo..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Origem Financeira</Label>
                          <Select value={formData.financialOrigin} onValueChange={v => setFormData({ ...formData, financialOrigin: v })}>
                            <SelectTrigger><SelectValue placeholder="Selecione ou descreva a origem" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conta_principal">Conta Corrente Principal</SelectItem>
                              <SelectItem value="conta_obra">Conta Específica de Obra</SelectItem>
                              <SelectItem value="financiamento">Financiamento Bancário</SelectItem>
                              <SelectItem value="capital_proprio">Capital Próprio</SelectItem>
                              <SelectItem value="adiantamento_cliente">Adiantamento do Cliente</SelectItem>
                              <SelectItem value="medição">Liberação de Medição</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          {formData.financialOrigin === 'outro' && (
                            <Input className="mt-2" placeholder="Descreva a origem..." value={formData.financialOriginCustom || ''}
                              onChange={e => setFormData({ ...formData, financialOriginCustom: e.target.value })} />
                          )}
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
                          <p className="text-sm font-semibold text-slate-600">Resumo do Lançamento</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <span className="text-slate-500">Valor Bruto:</span>
                            <span className="font-medium">R$ {Number(formData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500">(-) Retenção:</span>
                            <span className="text-rose-600">R$ {Number(formData.taxWithholding || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({formData.retentionPercentage || 0}%)</span>
                            <span className="text-slate-500">(-) Total Impostos:</span>
                            <span className="text-rose-600">R$ {[formData.taxISSAmount, formData.taxCSLLAmount, formData.taxPISCOFINSAmount, formData.taxIRRFAmount, formData.taxICMSAmount].reduce((s, v) => s + Number(v || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-700 font-semibold border-t pt-1">(=) Valor Líquido:</span>
                            <span className="font-bold text-emerald-600 border-t pt-1">R$ {(Number(formData.amount || 0) - Number(formData.taxWithholding || 0) - [formData.taxISSAmount, formData.taxCSLLAmount, formData.taxPISCOFINSAmount, formData.taxIRRFAmount, formData.taxICMSAmount].reduce((s, v) => s + Number(v || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
                <DialogFooter className="px-6 pb-6 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Salvar Lançamento</Button>
                </DialogFooter>
              </form>
            </DialogContent>

          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
          <TabsTrigger value="payable">A Pagar</TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-1"><Receipt className="w-3 h-3" /> Recibos</TabsTrigger>
          <TabsTrigger value="purchase-orders" className="flex items-center gap-1"><Package className="w-3 h-3" /> Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Saldo Atual</CardTitle>
                <Wallet className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-slate-900">
                  R$ {(summary?.currentBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Receitas</CardTitle>
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  R$ {(summary?.receivedThisMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">Neste mês</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Despesas</CardTitle>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">
                  R$ {(summary?.paidThisMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">Neste mês</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Lucro Projetado</CardTitle>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {(summary?.projectedProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueVsExpense}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} />
                      <Tooltip
                        formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {revenueVsExpense.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[expenseByCategory[index].key] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {expenseByCategory.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.key] || '#94a3b8' }} />
                        <span className="text-xs text-slate-500">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Demonstrativo de Resultados (DRE)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[300px]">Item</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">% Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-bold bg-emerald-50/30">
                    <TableCell className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      Receita Operacional Bruta
                    </TableCell>
                    <TableCell className="text-right">R$ {(dre?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="pl-8 text-slate-500 italic">(-) Impostos e Deduções</TableCell>
                    <TableCell className="text-right text-rose-500">R$ {(dre?.taxes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-slate-400">
                      {dre?.revenue > 0 ? `${((dre.taxes / dre.revenue) * 100).toFixed(1)}%` : '0%'}
                    </TableCell>
                  </TableRow>

                  <TableRow className="font-semibold bg-slate-50/50">
                    <TableCell className="pl-4">(=) Receita Líquida</TableCell>
                    <TableCell className="text-right">R$ {(dre?.netRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      {dre?.revenue > 0 ? `${((dre.netRevenue / dre.revenue) * 100).toFixed(1)}%` : '0%'}
                    </TableCell>
                  </TableRow>

                  {expenseByCategory.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-8 text-slate-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.key] || '#94a3b8' }} />
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right text-rose-500">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-slate-400">
                        {dre?.revenue > 0 ? `${((item.value / dre.revenue) * 100).toFixed(1)}%` : '0%'}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="font-bold border-t-2 border-slate-200 bg-amber-50/30">
                    <TableCell className="flex items-center gap-2 uppercase tracking-tight">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      Lucro Líquido do Período
                    </TableCell>
                    <TableCell className="text-right text-lg text-amber-600">R$ {(dre?.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-medium text-amber-600">
                      {dre?.revenue > 0 ? `${((dre.netProfit / dre.revenue) * 100).toFixed(1)}%` : '0%'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivable" className="mt-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contas a Receber</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Buscar recebimentos..." className="pl-9 w-[300px]" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Obra/Projeto</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right min-w-[220px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Nenhum recebimento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell>{payment.work?.title || '-'}</TableCell>
                        <TableCell>{new Date(payment.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-emerald-600 font-semibold">
                          R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            payment.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {payment.status === 'paid' ? 'Recebido' :
                              payment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" title="Nota Fiscal"
                              onClick={() => openPaymentOnTab(payment, 'invoice')}>
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600" title="Impostos e Retenções"
                              onClick={() => openPaymentOnTab(payment, 'taxes')}>
                              <Banknote className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-purple-600" title="Rateio de Pagamento"
                              onClick={() => openPaymentOnTab(payment, 'split')}>
                              <GitBranch className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600" title="Centro de Custo"
                              onClick={() => openPaymentOnTab(payment, 'costcenter')}>
                              <Building2 className="w-3.5 h-3.5" />
                            </Button>
                            <div className="w-px h-4 bg-slate-200 mx-1" />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                {payment.status !== 'paid' && (
                                  <DropdownMenuItem onClick={() => handleOpenRegister(payment)}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> {payment.type === 'income' ? 'Baixar' : 'Dar Baixa'}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleEdit(payment)}>
                                  <Edit2 className="w-4 h-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                {payment.type === 'income' && (
                                  <DropdownMenuItem onClick={() => handlePublishPaymentToPortal(payment)}>
                                    <Share2 className="w-4 h-4 mr-2" /> Publicar no Portal
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(payment.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payable" className="mt-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contas a Pagar</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Buscar despesas..." className="pl-9 w-[300px]" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Nenhuma despesa encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[payment.category] || '#94a3b8' }} />
                            {payment.category.charAt(0).toUpperCase() + payment.category.slice(1)}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(payment.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-rose-600 font-semibold">
                          R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            payment.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {payment.status === 'paid' ? 'Pago' :
                              payment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" title="Nota Fiscal"
                              onClick={() => openPaymentOnTab(payment, 'invoice')}>
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600" title="Impostos e Retenções"
                              onClick={() => openPaymentOnTab(payment, 'taxes')}>
                              <Banknote className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-purple-600" title="Rateio de Pagamento"
                              onClick={() => openPaymentOnTab(payment, 'split')}>
                              <GitBranch className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600" title="Centro de Custo"
                              onClick={() => openPaymentOnTab(payment, 'costcenter')}>
                              <Building2 className="w-3.5 h-3.5" />
                            </Button>
                            <div className="w-px h-4 bg-slate-200 mx-1" />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                {payment.status !== 'paid' && (
                                  <DropdownMenuItem onClick={() => handleOpenRegister(payment)}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Dar Baixa
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleEdit(payment)}>
                                  <Edit2 className="w-4 h-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(payment.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ RECIBOS TAB ═══ */}
        <TabsContent value="receipts" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recibos de Pagamento</h2>
              <p className="text-sm text-slate-500">Registre pagamentos parciais ou totais de clientes</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setEditingReceiptId(null); setReceiptForm({ description: '', amount: '', percentage: '100', totalProposalValue: '0', paymentMethod: 'pix', paidAt: new Date().toISOString().split('T')[0], notes: '', status: 'issued', clientId: '', proposalId: '' }); setReceiptDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Recibo
            </Button>
          </div>
          <Card className="border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Nº</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">Nenhum recibo cadastrado</TableCell></TableRow>
                  ) : receipts.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs text-blue-600">{r.receiptNumber}</TableCell>
                      <TableCell className="font-medium">{r.description}</TableCell>
                      <TableCell className="text-sm text-slate-500">{r.client?.name || '—'}</TableCell>
                      <TableCell className="text-center">{r.percentage}%</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">R$ {Number(r.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs">{r.paymentMethod === 'pix' ? 'PIX' : r.paymentMethod === 'bank_transfer' ? 'Transferência' : r.paymentMethod === 'boleto' ? 'Boleto' : r.paymentMethod || '—'}</TableCell>
                      <TableCell className="text-sm">{r.paidAt ? new Date(r.paidAt).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-500" title="Baixar PDF" onClick={() => handleDownloadReceiptPDF(r)}><Download className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-indigo-500" title="Publicar no Portal" onClick={() => handlePublishReceiptToPortal(r)}><Share2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditReceipt(r)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500" onClick={() => handleDeleteReceipt(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ PURCHASE ORDERS TAB ═══ */}
        <TabsContent value="purchase-orders" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pedidos de Compra</h2>
              <p className="text-sm text-slate-500">Gerencie pedidos para fornecedores (faturamento empresa ou direto)</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditingPOId(null); setPOForm({ type: 'company_billing', status: 'draft', totalValue: '', paymentTerms: '', notes: '', internalNotes: '', internalMargin: '0', deliveryDate: '', deliveryAddress: '', supplierId: '', clientId: '', proposalId: '' }); setPOItems([{ description: '', quantity: '1', unit: 'un', unitPrice: '0', totalPrice: '0', internalCost: '' }]); setPODialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Pedido
            </Button>
          </div>
          <Card className="border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Nº</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">Nenhum pedido cadastrado</TableCell></TableRow>
                  ) : purchaseOrders.map((po: any) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-xs text-blue-600">{po.orderNumber}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${po.type === 'company_billing' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {po.type === 'company_billing' ? 'Empresa' : 'Direto'}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{po.supplier?.name || '—'}</TableCell>
                      <TableCell className="text-sm text-slate-500">{po.client?.name || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">R$ {Number(po.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${po.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : po.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : po.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {po.status === 'draft' ? 'Rascunho' : po.status === 'sent' ? 'Enviado' : po.status === 'confirmed' ? 'Confirmado' : po.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-500" title="Baixar PDF" onClick={() => handleDownloadPOPDF(po)}><Download className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditPO(po)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500" onClick={() => handleDeletePO(po.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Baixa - {selectedPayment?.description}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reg-amount">Valor Pago/Recebido</Label>
              <Input
                id="reg-amount"
                type="text" inputMode="decimal"
                step="0.01"
                value={registerData.amount}
                onChange={(e) => setRegisterData({ ...registerData, amount: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-method">Método de Pagamento</Label>
              <Select
                value={registerData.method}
                onValueChange={(val) => setRegisterData({ ...registerData, method: val })}
              >
                <SelectTrigger id="reg-method">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-txid">ID da Transação / Comprovante (Opcional)</Label>
              <Input
                id="reg-txid"
                value={registerData.transactionId}
                onChange={(e) => setRegisterData({ ...registerData, transactionId: e.target.value })}
                placeholder="Ex: NSU, Autenticação, ID PIX..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRegisterPayment}>
              Confirmar Baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ RECEIPT DIALOG ═══ */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" /> {editingReceiptId ? 'Editar' : 'Novo'} Recibo de Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label>Descrição *</Label>
              <Input value={receiptForm.description} onChange={e => setReceiptForm({ ...receiptForm, description: e.target.value })} placeholder="Serviço de instalação elétrica..." />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={receiptForm.clientId || 'none'} onValueChange={v => setReceiptForm({ ...receiptForm, clientId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Total da Proposta (R$)</Label>
              <Input type="text" inputMode="decimal" value={receiptForm.totalProposalValue} onChange={e => {
                const total = e.target.value;
                const pct = Number(receiptForm.percentage || 100);
                setReceiptForm({ ...receiptForm, totalProposalValue: total, amount: ((Number(total) * pct) / 100).toFixed(2) });
              }} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Percentual (%)</Label>
              <Input type="text" inputMode="decimal" value={receiptForm.percentage} onChange={e => {
                const pct = e.target.value;
                const total = Number(receiptForm.totalProposalValue || 0);
                setReceiptForm({ ...receiptForm, percentage: pct, amount: ((total * Number(pct)) / 100).toFixed(2) });
              }} placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>Valor do Recibo (R$) *</Label>
              <Input type="text" inputMode="decimal" value={receiptForm.amount} onChange={e => setReceiptForm({ ...receiptForm, amount: e.target.value })} placeholder="0,00" className="font-bold text-lg" />
            </div>
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select value={receiptForm.paymentMethod} onValueChange={v => setReceiptForm({ ...receiptForm, paymentMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input type="date" value={receiptForm.paidAt} onChange={e => setReceiptForm({ ...receiptForm, paidAt: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Observações</Label>
              <Input value={receiptForm.notes} onChange={e => setReceiptForm({ ...receiptForm, notes: e.target.value })} placeholder="Referente a..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReceiptDialogOpen(false); setEditingReceiptId(null); }}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveReceipt}>Salvar Recibo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ PURCHASE ORDER DIALOG ═══ */}
      <Dialog open={poDialogOpen} onOpenChange={setPODialogOpen}>
        <DialogContent className="sm:max-w-[820px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" /> {editingPOId ? 'Editar' : 'Novo'} Pedido de Compra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo do Pedido *</Label>
                <Select value={poForm.type} onValueChange={v => setPOForm({ ...poForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_billing">Faturamento Empresa</SelectItem>
                    <SelectItem value="direct_billing">Faturamento Direto (Cliente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={poForm.status} onValueChange={v => setPOForm({ ...poForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fornecedor *</Label>
                <Select value={poForm.supplierId || 'none'} onValueChange={v => setPOForm({ ...poForm, supplierId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {poForm.type === 'direct_billing' && (
                <div className="space-y-2">
                  <Label>Cliente (Faturamento Direto)</Label>
                  <Select value={poForm.clientId || 'none'} onValueChange={v => setPOForm({ ...poForm, clientId: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Condições de Pagamento</Label>
                <Input value={poForm.paymentTerms} onChange={e => setPOForm({ ...poForm, paymentTerms: e.target.value })} placeholder="30/60/90 dias, à vista..." />
              </div>
              <div className="space-y-2">
                <Label>Data de Entrega</Label>
                <Input type="date" value={poForm.deliveryDate} onChange={e => setPOForm({ ...poForm, deliveryDate: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Endereço de Entrega</Label>
                <Input value={poForm.deliveryAddress} onChange={e => setPOForm({ ...poForm, deliveryAddress: e.target.value })} />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
              <h3 className="font-semibold text-purple-800 text-sm flex items-center gap-2">📋 Referência (Proposta / Contrato / Obra)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Nº Proposta</Label>
                  <Input className="h-8 text-sm" value={poForm.proposalNumber} onChange={e => setPOForm({ ...poForm, proposalNumber: e.target.value })} placeholder="PROP-2026-XXX" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Nº Contrato</Label>
                  <Input className="h-8 text-sm" value={poForm.contractNumber} onChange={e => setPOForm({ ...poForm, contractNumber: e.target.value })} placeholder="CONT-XXX" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Obra / Centro de Custo</Label>
                  <Input className="h-8 text-sm" value={poForm.workName} onChange={e => setPOForm({ ...poForm, workName: e.target.value })} placeholder="Nome da obra" />
                </div>
              </div>
            </div>

            {/* Internal fields */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2">🔒 Informações Internas (não aparecem no PDF)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Margem Interna (%)</Label>
                  <Input type="text" inputMode="decimal" value={poForm.internalMargin} onChange={e => setPOForm({ ...poForm, internalMargin: e.target.value })} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-sm">Notas Internas</Label>
                  <Input value={poForm.internalNotes} onChange={e => setPOForm({ ...poForm, internalNotes: e.target.value })} placeholder="Negociação com fornecedor, condições especiais..." />
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Itens do Pedido</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setPOItems([...poItems, { description: '', quantity: '1', unit: 'un', unitPrice: '0', totalPrice: '0', internalCost: '' }])}>
                  <Plus className="w-3 h-3 mr-1" /> Item
                </Button>
              </div>
              <div className="space-y-2">
                {poItems.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-[1fr_60px_50px_80px_80px_32px] gap-2 items-end">
                    <div><Label className="text-[10px]">Descrição</Label><Input className="h-8 text-sm" value={item.description} onChange={e => { const n = [...poItems]; n[idx].description = e.target.value; setPOItems(n); }} /></div>
                    <div><Label className="text-[10px]">Qtd</Label><Input className="h-8 text-sm" type="text" inputMode="decimal" value={item.quantity} onChange={e => { const n = [...poItems]; n[idx].quantity = e.target.value; n[idx].totalPrice = (Number(e.target.value) * Number(n[idx].unitPrice)).toFixed(2); setPOItems(n); }} /></div>
                    <div><Label className="text-[10px]">UN</Label><Input className="h-8 text-sm" value={item.unit} onChange={e => { const n = [...poItems]; n[idx].unit = e.target.value; setPOItems(n); }} /></div>
                    <div><Label className="text-[10px]">Vlr Unit.</Label><Input className="h-8 text-sm" type="text" inputMode="decimal" value={item.unitPrice} onChange={e => { const n = [...poItems]; n[idx].unitPrice = e.target.value; n[idx].totalPrice = (Number(n[idx].quantity) * Number(e.target.value)).toFixed(2); setPOItems(n); }} /></div>
                    <div><Label className="text-[10px]">Custo Int.</Label><Input className="h-8 text-sm" type="text" inputMode="decimal" value={item.internalCost} onChange={e => { const n = [...poItems]; n[idx].internalCost = e.target.value; setPOItems(n); }} placeholder="-" /></div>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500" onClick={() => setPOItems(poItems.filter((_: any, i: number) => i !== idx))}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
                <div className="text-right text-sm font-semibold text-slate-700">
                  Total: R$ {poItems.reduce((s: number, i: any) => s + (Number(i.quantity || 1) * Number(i.unitPrice || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={poForm.notes} onChange={e => setPOForm({ ...poForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPODialogOpen(false); setEditingPOId(null); }}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSavePO}>Salvar Pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden containers for PDF generation */}
      <div className="fixed -left-[9999px] top-0">
        {receiptToPrint && <ReceiptPDFTemplate receipt={receiptToPrint} company={companyData} />}
        {poToPrint && <PurchaseOrderPDFTemplate order={poToPrint} company={companyData} />}
      </div>
    </div>
  );
}
