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
  Receipt, Package, Calendar, TrendingDown,
  BarChart3, PieChart as PieChartIcon, Target, AlertTriangle,
  ChevronDown, ChevronRight, CreditCard, Layers,
  Paperclip,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  Line,
  ComposedChart,
  Legend,
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
import { Badge } from '@/components/ui/badge';

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

// ── Period helpers ──
const PERIOD_OPTIONS = [
  { value: 'current_month', label: 'Mês Atual' },
  { value: 'last_month', label: 'Mês Anterior' },
  { value: 'last_quarter', label: 'Último Trimestre' },
  { value: 'last_semester', label: 'Último Semestre' },
  { value: 'current_year', label: 'Ano Atual' },
];

function getPeriodDates(period: string): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'last_month': return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) };
    case 'last_quarter': return { start: new Date(now.getFullYear(), now.getMonth() - 3, 1), end: now };
    case 'last_semester': return { start: new Date(now.getFullYear(), now.getMonth() - 6, 1), end: now };
    case 'current_year': return { start: new Date(now.getFullYear(), 0, 1), end: now };
    default: return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
}

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctOf = (v: number, base: number) => base > 0 ? ((v / base) * 100).toFixed(1) + '%' : '0.0%';

export default function AdminFinance() {
  const [summary, setSummary] = useState<any>(null);
  const [summaryExt, setSummaryExt] = useState<any>(null);
  const [dre, setDre] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [monthlyEvolution, setMonthlyEvolution] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [drePeriod, setDrePeriod] = useState('current_month');
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle URL params from Proposals/Contracts shortcuts
  useEffect(() => {
    const tab = searchParams.get('tab');
    const proposalId = searchParams.get('proposalId');
    if (!tab && !proposalId) return; // ← guard: nothing to process
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
        setSearchParams({}, { replace: true });
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
        setSearchParams({}, { replace: true });
      }, 500);
    } else if (tab) {
      setSearchParams({}, { replace: true });
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
  const [workMeasurements, setWorkMeasurements] = useState<any[]>([]);

  // ── PDF Print ──
  const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
  const [poToPrint, setPOToPrint] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  const emptyForm = {
    description: '', amount: '', type: 'income', category: 'other',
    dueDate: '', billingDate: '', scheduledPaymentDate: '',
    workId: '', measurementId: '', invoiceNumber: '', notes: '',
    retentionPercentage: '0', taxWithholding: '0',
    taxISS: '0', taxISSAmount: '0',
    taxCSLL: '0', taxCSLLAmount: '0',
    taxPISCOFINS: '0', taxPISCOFINSAmount: '0',
    taxIRRF: '0', taxIRRFAmount: '0',
    taxICMS: '0', taxICMSAmount: '0',
    taxObservation: '', taxCost: '0',
    costCenter: '', financialOrigin: '',
    // Antecipação
    isAnticipated: false, anticipatedDate: '', anticipationDiscount: '0',
    // INSS
    inssBasePercentage: '0', inssRate: '11', inssAmount: '0', inssGpsNumber: '',
    // Simples Nacional (DAS)
    simplesRate: '0', simplesAmount: '0',
  };

  // Helper: converte entrada monetária BR (25.015,67 ou 25015,67) → número JS
  const parseBRL = (raw: string): string => {
    if (!raw) return '0';
    let v = raw.trim();
    // Se tem vírgula, trata como formato BR
    if (v.includes(',')) {
      v = v.replace(/\./g, '');   // remove separador milhar
      v = v.replace(',', '.');    // troca vírgula decimal → ponto
    }
    return v;
  };

  const [formData, setFormData] = useState<any>(emptyForm);
  const [apportionmentItems, setApportionmentItems] = useState<Array<{ description: string; percentage: string; amount: string }>>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [activeFormTab, setActiveFormTab] = useState('basics');

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [registerData, setRegisterData] = useState({
    amount: '',
    method: 'transfer',
    transactionId: '',
  });
  const [registerReceiptFile, setRegisterReceiptFile] = useState<File | null>(null);

  // ── Parcelas ──
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [installmentsMap, setInstallmentsMap] = useState<Record<string, any[]>>({});
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false);
  const [installmentPayment, setInstallmentPayment] = useState<any>(null);
  const [installmentConfig, setInstallmentConfig] = useState({ count: 2, intervalDays: 30, mode: 'equal' as 'equal' | 'custom' });
  const [customInstallments, setCustomInstallments] = useState<Array<{ percentage: string; dueDate: string; description: string }>>([]);
  const [payInstallmentDialogOpen, setPayInstallmentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [payInstData, setPayInstData] = useState({ amount: '', method: 'pix', transactionId: '' });
  const [payInstReceiptFile, setPayInstReceiptFile] = useState<File | null>(null);

  // DAS Consolidation
  const [dasDialogOpen, setDasDialogOpen] = useState(false);
  const [dasCompetence, setDasCompetence] = useState(new Date().toISOString().substring(0, 7));
  const [dasAmount, setDasAmount] = useState('');
  const [dasStatus, setDasStatus] = useState<'provisioned' | 'realized'>('realized');
  const [dasSelectedIds, setDasSelectedIds] = useState<Set<string>>(new Set());
  const [dasLoading, setDasLoading] = useState(false);

  // ── Dívidas ──
  const [debts, setDebts] = useState<any[]>([]);
  const [debtSummary, setDebtSummary] = useState<any>(null);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [debtForm, setDebtForm] = useState<any>({ description: '', creditor: '', type: 'other', nature: 'neutral', originalAmount: '', currentBalance: '', interestRate: '', interestPeriod: 'monthly', interestType: 'fixed', totalInstallments: '', monthlyPayment: '', startDate: '', endDate: '', contractNumber: '', notes: '' });
  const [debtPayDialogOpen, setDebtPayDialogOpen] = useState(false);
  const [debtPayForm, setDebtPayForm] = useState<any>({ amount: '', principalAmount: '', interestAmount: '', method: 'pix', reference: '', notes: '' });
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);

  // ── Conciliação Bancária ──
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [statements, setStatements] = useState<any[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [statementEntries, setStatementEntries] = useState<any[]>([]);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [newStatementDialog, setNewStatementDialog] = useState(false);
  const [stmtMonth, setStmtMonth] = useState(new Date().toISOString().substring(0, 7));
  const [stmtRows, setStmtRows] = useState<Array<{ date: string; description: string; amount: string; entryType: string }>>([{ date: new Date().toISOString().split('T')[0], description: '', amount: '', entryType: 'credit' }]);

  // ── CFO Dashboard ──
  const [cfoDashboard, setCfoDashboard] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadWorks();
    loadReceipts();
    loadPurchaseOrders();
    loadSuppliers();
    loadClients();
    loadDebts();
    loadBankAccounts();
    loadCFODashboard();
  }, []);

  useEffect(() => { loadData(); }, [drePeriod]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getPeriodDates(drePeriod);
      const [sum, dreData, paymentsData, evolution, extSummary] = await Promise.all([
        api.getFinanceSummary(),
        api.getDREReport(start.toISOString(), end.toISOString()),
        api.getPayments(),
        api.getMonthlyEvolution(6).catch(() => []),
        api.getSummaryExtended(start.toISOString(), end.toISOString()).catch(() => null),
      ]);
      setSummary(sum);
      setDre(dreData);
      setPayments(paymentsData);
      setMonthlyEvolution(evolution);
      if (extSummary) setSummaryExt(extSummary);
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
  const loadDebts = async () => { try { setDebts(await api.getDebts()); setDebtSummary(await api.getDebtSummary()); } catch {} };
  const loadBankAccounts = async () => { try { const accs = await api.getBankAccounts(); setBankAccounts(Array.isArray(accs) ? accs : []); } catch {} };
  const loadStatements = async (bankAccountId?: string) => { try { setStatements(await api.getBankStatements(bankAccountId)); } catch {} };
  const loadCFODashboard = async () => { try { setCfoDashboard(await api.getCFODashboard()); } catch {} };
  const loadMeasurementsForWork = async (workId: string) => {
    if (!workId || workId === 'none') { setWorkMeasurements([]); return; }
    try { setWorkMeasurements(await api.getMeasurements(workId)); } catch { setWorkMeasurements([]); }
  };

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
      measurementId: payment.measurementId || '',
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
      isAnticipated: payment.isAnticipated || false,
      anticipatedDate: payment.anticipatedDate?.split('T')[0] || '',
      anticipationDiscount: (payment.anticipationDiscount || 0).toString(),
      inssBasePercentage: (payment.inssBasePercentage || 0).toString(),
      inssRate: (payment.inssRate || 11).toString(),
      inssAmount: (payment.inssAmount || 0).toString(),
      inssGpsNumber: payment.inssGpsNumber || '',
      simplesRate: (payment.simplesRate || 0).toString(),
      simplesAmount: (payment.simplesAmount || 0).toString(),
    });
    // Load measurements for the linked work
    if (payment.workId) loadMeasurementsForWork(payment.workId);
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
      amount: String(payment.amount || 0),
      method: 'transfer',
      transactionId: '',
    });
    setRegisterReceiptFile(null);
    setIsRegisterDialogOpen(true);
  };

  const handleRegisterPayment = async () => {
    if (!selectedPayment) return;
    try {
      const parsedAmount = Number(parseBRL(String(registerData.amount)));
      await api.registerPayment(selectedPayment.id, { ...registerData, amount: parsedAmount });
      // Upload receipt if file was attached
      if (registerReceiptFile) {
        try { await api.uploadPaymentInvoice(selectedPayment.id, registerReceiptFile); } catch {}
      }
      toast.success('Baixa realizada com sucesso!' + (registerReceiptFile ? ' Comprovante anexado.' : ''));
      setIsRegisterDialogOpen(false);
      setRegisterReceiptFile(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao realizar baixa.');
    }
  };

  // ── Installment Handlers ──
  const handleOpenInstallmentDialog = (payment: any) => {
    setInstallmentPayment(payment);
    setInstallmentConfig({ count: 2, intervalDays: 30, mode: 'equal' });
    setCustomInstallments([]);
    setInstallmentDialogOpen(true);
  };

  const handleGenerateInstallments = async () => {
    if (!installmentPayment) return;
    try {
      let installments: Array<{ percentage: number; dueDate: string; description?: string }> = [];
      if (installmentConfig.mode === 'equal') {
        const pct = parseFloat((100 / installmentConfig.count).toFixed(2));
        for (let i = 0; i < installmentConfig.count; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i * installmentConfig.intervalDays);
          installments.push({ percentage: i === installmentConfig.count - 1 ? (100 - pct * (installmentConfig.count - 1)) : pct, dueDate: d.toISOString().split('T')[0], description: `Parcela ${i + 1}/${installmentConfig.count}` });
        }
      } else {
        installments = customInstallments.map((c, i) => ({ percentage: Number(c.percentage), dueDate: c.dueDate, description: c.description || `Parcela ${i + 1}/${customInstallments.length}` }));
      }
      await api.generateInstallments(installmentPayment.id, installments);
      toast.success(`${installments.length} parcelas geradas!`);
      setInstallmentDialogOpen(false);
      loadData();
    } catch { toast.error('Erro ao gerar parcelas'); }
  };

  const toggleExpandPayment = async (paymentId: string) => {
    if (expandedPaymentId === paymentId) { setExpandedPaymentId(null); return; }
    setExpandedPaymentId(paymentId);
    if (!installmentsMap[paymentId]) {
      try {
        const insts = await api.getInstallments(paymentId);
        setInstallmentsMap(prev => ({ ...prev, [paymentId]: insts }));
      } catch { setInstallmentsMap(prev => ({ ...prev, [paymentId]: [] })); }
    }
  };

  const handleOpenPayInstallment = (inst: any) => {
    setSelectedInstallment(inst);
    setPayInstData({ amount: String(Number(inst.amount) - Number(inst.paidAmount || 0)), method: 'pix', transactionId: '' });
    setPayInstReceiptFile(null);
    setPayInstallmentDialogOpen(true);
  };

  const handlePayInstallment = async () => {
    if (!selectedInstallment) return;
    try {
      await api.payInstallment(selectedInstallment.id, { ...payInstData, amount: Number(parseBRL(String(payInstData.amount))) });
      // Upload receipt if file was attached
      if (payInstReceiptFile) {
        await api.uploadInstallmentReceipt(selectedInstallment.id, payInstReceiptFile);
      }
      toast.success('Parcela baixada com sucesso!' + (payInstReceiptFile ? ' Comprovante anexado.' : ''));
      setPayInstallmentDialogOpen(false);
      setPayInstReceiptFile(null);
      // Refresh installments
      const parentId = selectedInstallment.paymentId;
      const insts = await api.getInstallments(parentId);
      setInstallmentsMap(prev => ({ ...prev, [parentId]: insts }));
      loadData();
    } catch { toast.error('Erro ao baixar parcela'); }
  };

  const handleCancelInstallment = async (inst: any) => {
    if (!confirm('Cancelar esta parcela?')) return;
    try {
      await api.cancelInstallment(inst.id);
      toast.success('Parcela cancelada');
      const insts = await api.getInstallments(inst.paymentId);
      setInstallmentsMap(prev => ({ ...prev, [inst.paymentId]: insts }));
      loadData();
    } catch { toast.error('Erro ao cancelar parcela'); }
  };

  const handleUploadReceipt = async (inst: any, file: File) => {
    try {
      await api.uploadInstallmentReceipt(inst.id, file);
      toast.success('Comprovante anexado!');
      const insts = await api.getInstallments(inst.paymentId);
      setInstallmentsMap(prev => ({ ...prev, [inst.paymentId]: insts }));
    } catch { toast.error('Erro ao anexar comprovante'); }
  };

  const handleDownloadReceipt = async (inst: any) => {
    try {
      const blob = await api.downloadInstallmentReceipt(inst.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = inst.receiptFileName || 'comprovante';
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Erro ao baixar comprovante'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numFields = [
        'amount', 'taxWithholding', 'taxCost', 'retentionPercentage',
        'taxISS', 'taxISSAmount', 'taxCSLL', 'taxCSLLAmount',
        'taxPISCOFINS', 'taxPISCOFINSAmount', 'taxIRRF', 'taxIRRFAmount',
        'taxICMS', 'taxICMSAmount', 'anticipationDiscount',
        'inssBasePercentage', 'inssRate', 'inssAmount',
        'simplesRate', 'simplesAmount',
      ];
      const payload: any = { ...formData };
      numFields.forEach(f => { payload[f] = Number(payload[f] || 0); });
      payload.apportionmentItems = apportionmentItems.map(i => ({
        description: i.description,
        percentage: Number(i.percentage),
        amount: Number(i.amount),
      }));

      // ── Sanitize UUID fields: 'none' or '' → null ──
      if (!payload.workId || payload.workId === 'none') payload.workId = null;
      if (!payload.clientId || payload.clientId === 'none') payload.clientId = null;
      if (!payload.supplierId || payload.supplierId === 'none') payload.supplierId = null;
      if (!payload.measurementId || payload.measurementId === 'none') payload.measurementId = null;

      // ── Sanitize empty date strings → null ──
      if (!payload.billingDate) payload.billingDate = null;
      if (!payload.scheduledPaymentDate) payload.scheduledPaymentDate = null;
      if (!payload.dueDate) payload.dueDate = null;
      if (!payload.anticipatedDate) payload.anticipatedDate = null;

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
                          <Input type="text" inputMode="decimal" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseBRL(e.target.value) })} placeholder="Ex: 25.015,67" required />
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
                          <Select value={formData.workId} onValueChange={v => { setFormData({ ...formData, workId: v, measurementId: '' }); loadMeasurementsForWork(v); }}>
                            <SelectTrigger><SelectValue placeholder="Selecione uma obra" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma</SelectItem>
                              {works.map(w => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Medição vinculada */}
                        {formData.workId && formData.workId !== 'none' && workMeasurements.length > 0 && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">📐 Vincular Medição</Label>
                            <Select value={formData.measurementId || 'none'} onValueChange={v => {
                              if (v === 'none') { setFormData({ ...formData, measurementId: '' }); return; }
                              const m = workMeasurements.find((m: any) => m.id === v);
                              if (m) {
                                setFormData({
                                  ...formData,
                                  measurementId: v,
                                  amount: String(m.netAmount || m.totalAmount || 0),
                                  description: formData.description || `Medição #${m.number} — ${m.description || ''}`.trim(),
                                  category: 'project',
                                });
                              }
                            }}>
                              <SelectTrigger><SelectValue placeholder="Vincular medição" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhuma</SelectItem>
                                {workMeasurements.map((m: any) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    #{m.number} — R$ {Number(m.netAmount || m.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({m.status})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {/* Antecipação de Pagamento */}
                        <div className="space-y-2 col-span-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.isAnticipated || false} onChange={e => setFormData({ ...formData, isAnticipated: e.target.checked })} className="rounded border-amber-300 text-amber-500" />
                            <span className="text-sm font-medium text-slate-700">💰 Antecipação de Pagamento</span>
                            <span className="text-[10px] text-slate-400">(recebimento antes do vencimento com desconto)</span>
                          </label>
                        </div>
                        {formData.isAnticipated && (
                          <>
                            <div className="space-y-2">
                              <Label>Data do Recebimento Antecipado</Label>
                              <Input type="date" value={formData.anticipatedDate} onChange={e => setFormData({ ...formData, anticipatedDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Desconto / Juros da Antecipação (R$)</Label>
                              <Input type="text" inputMode="decimal" value={formData.anticipationDiscount} onChange={e => setFormData({ ...formData, anticipationDiscount: parseBRL(e.target.value) })} placeholder="Ex: 1.250,50" />
                            </div>
                          </>
                        )}
                        {/* ══════ RESUMO DE LIQUIDAÇÃO (Dados tab) ══════ */}
                        {Number(formData.amount) > 0 && (() => {
                          const bruto = Number(formData.amount) || 0;
                          const iss = Number(formData.taxISSAmount) || 0;
                          const csll = Number(formData.taxCSLLAmount) || 0;
                          const pis = Number(formData.taxPISCOFINSAmount) || 0;
                          const irrf = Number(formData.taxIRRFAmount) || 0;
                          const icms = Number(formData.taxICMSAmount) || 0;
                          const ret = Number(formData.taxWithholding) || 0;
                          const inss = Number(formData.inssAmount) || 0;
                          const antecipacao = Number(formData.anticipationDiscount) || 0;
                          const totalDeducoes = iss + csll + pis + irrf + icms + ret + inss + antecipacao;
                          const liquido = bruto - totalDeducoes;
                          const deductions = [
                            { label: 'Retenção Contratual', value: ret },
                            { label: `ISS (${formData.taxISS || 0}%)`, value: iss },
                            { label: `CSLL (${formData.taxCSLL || 0}%)`, value: csll },
                            { label: `PIS/COFINS (${formData.taxPISCOFINS || 0}%)`, value: pis },
                            { label: `IRRF (${formData.taxIRRF || 0}%)`, value: irrf },
                            { label: `ICMS (${formData.taxICMS || 0}%)`, value: icms },
                            { label: `INSS (${formData.inssBasePercentage || 0}%×${formData.inssRate || 0}%)`, value: inss },
                            { label: 'Juros Antecipação', value: antecipacao },
                          ].filter(d => d.value > 0);
                          if (deductions.length === 0) return null;
                          return (
                            <div className="col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl p-4 space-y-1.5">
                              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">📋 Resumo de Liquidação</h3>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Valor Bruto NF</span>
                                <span className="font-mono font-bold text-slate-900">R$ {bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              {deductions.map((d, i) => (
                                <div key={i} className="flex justify-between text-sm text-red-600">
                                  <span>(-) {d.label}</span>
                                  <span className="font-mono">- R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))}
                              <div className={`flex justify-between border-t-2 border-slate-400 pt-2 mt-1 font-bold text-sm ${liquido >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                <span>= Valor Líquido Recebido</span>
                                <span className="font-mono text-base">R$ {liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          );
                        })()}
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
                                  const pct = parseBRL(e.target.value);
                                  const base = Number(formData.amount) || 0;
                                  setFormData({ ...formData, retentionPercentage: pct, taxWithholding: ((Number(pct) / 100) * base).toFixed(2) });
                                }} placeholder="0,00" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm">Valor Retido (R$)</Label>
                              <Input type="text" inputMode="decimal" step="0.01" min="0"
                                value={formData.taxWithholding}
                                onChange={e => {
                                  const val = parseBRL(e.target.value);
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
                                    const pct = parseBRL(e.target.value);
                                    const base = Number(formData.amount) || 0;
                                    setFormData({ ...formData, [pctKey]: pct, [amtKey]: ((Number(pct) / 100) * base).toFixed(2) });
                                  }} />
                                <Input type="text" inputMode="decimal" step="0.01" min="0" className="h-8 text-sm"
                                  placeholder="R$"
                                  value={formData[amtKey]}
                                  onChange={e => {
                                    const val = parseBRL(e.target.value);
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

                        {/* ── INSS (Retenção Previdenciária) ── */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                            🏛️ INSS — Retenção Previdenciária (Art. 31 Lei 8.212)
                          </h3>
                          <p className="text-xs text-indigo-600 mb-3">
                            Para serviços de construção, a retenção é calculada sobre a parcela de mão de obra da NF. Ex: 50% da NF é mão de obra → 11% sobre essa base.
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-sm">Base de Cálculo (%)</Label>
                              <Input type="text" inputMode="decimal" className="h-8 text-sm"
                                placeholder="Ex: 50"
                                value={formData.inssBasePercentage}
                                onChange={e => {
                                  const basePct = parseBRL(e.target.value);
                                  const base = Number(formData.amount) || 0;
                                  const baseCalc = base * (Number(basePct) / 100);
                                  const amt = baseCalc * (Number(formData.inssRate) / 100);
                                  setFormData({ ...formData, inssBasePercentage: basePct, inssAmount: amt.toFixed(2) });
                                }} />
                              <p className="text-[10px] text-indigo-400">% da NF que é mão de obra</p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm">Alíquota INSS (%)</Label>
                              <Input type="text" inputMode="decimal" className="h-8 text-sm"
                                placeholder="11"
                                value={formData.inssRate}
                                onChange={e => {
                                  const rate = parseBRL(e.target.value);
                                  const base = Number(formData.amount) || 0;
                                  const baseCalc = base * (Number(formData.inssBasePercentage) / 100);
                                  const amt = baseCalc * (Number(rate) / 100);
                                  setFormData({ ...formData, inssRate: rate, inssAmount: amt.toFixed(2) });
                                }} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm">Valor Retido (R$)</Label>
                              <Input type="text" inputMode="decimal" className="h-8 text-sm font-bold"
                                value={formData.inssAmount}
                                onChange={e => setFormData({ ...formData, inssAmount: parseBRL(e.target.value) })} />
                            </div>
                          </div>
                          {Number(formData.inssBasePercentage) > 0 && Number(formData.amount) > 0 && (
                            <div className="mt-2 text-xs text-indigo-600 bg-indigo-100/50 rounded p-2">
                              Base cálculo: R$ {(Number(formData.amount) * Number(formData.inssBasePercentage) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              {' '}({formData.inssBasePercentage}% de R$ {Number(formData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                              {' '}× {formData.inssRate}% = <strong>R$ {Number(formData.inssAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                            </div>
                          )}
                          <div className="mt-3 space-y-1">
                            <Label className="text-sm">Nº GPS / Título INSS (para compensação)</Label>
                            <Input value={formData.inssGpsNumber} onChange={e => setFormData({ ...formData, inssGpsNumber: e.target.value })}
                              placeholder="Nº da guia GPS ou título gerado pela retenção" className="h-8 text-sm" />
                            <p className="text-[10px] text-indigo-400">Este valor pode ser compensado com o INSS dos funcionários</p>
                          </div>
                        </div>

                        {/* ══════ SIMPLES NACIONAL (DAS) ══════ */}
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-4 mt-4">
                          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">🏛️ Simples Nacional (DAS)</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-amber-700">Alíquota Simples (%)</Label>
                              <Input className="h-8 text-sm" placeholder="Ex: 6" type="text" inputMode="decimal"
                                value={formData.simplesRate}
                                onChange={e => {
                                  const rate = parseBRL(e.target.value);
                                  const bruto = Number(parseBRL(formData.amount)) || 0;
                                  const das = bruto * Number(rate) / 100;
                                  setFormData({ ...formData, simplesRate: rate, simplesAmount: das.toFixed(2) });
                                }} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-amber-700">Valor DAS Estimado (R$)</Label>
                              <Input className="h-8 text-sm bg-amber-50 font-mono font-bold"
                                value={formData.simplesAmount}
                                onChange={e => setFormData({ ...formData, simplesAmount: parseBRL(e.target.value) })} />
                            </div>
                            <div className="flex items-end">
                              <p className="text-[10px] text-amber-600 pb-2">Guia DAS a pagar referente a esta NF</p>
                            </div>
                          </div>
                          {Number(formData.simplesRate) > 0 && Number(formData.amount) > 0 && (
                            <div className="mt-2 text-xs text-amber-700 bg-amber-100/60 rounded p-2">
                              💰 Base: R$ {Number(formData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              {' '}× {formData.simplesRate}% = <strong>DAS R$ {Number(formData.simplesAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                            </div>
                          )}
                        </div>

                        {/* ══════ RESUMO DE LIQUIDAÇÃO ══════ */}
                        {Number(formData.amount) > 0 && (() => {
                          const bruto = Number(formData.amount) || 0;
                          const iss = Number(formData.taxISSAmount) || 0;
                          const csll = Number(formData.taxCSLLAmount) || 0;
                          const pis = Number(formData.taxPISCOFINSAmount) || 0;
                          const irrf = Number(formData.taxIRRFAmount) || 0;
                          const icms = Number(formData.taxICMSAmount) || 0;
                          const ret = Number(formData.taxWithholding) || 0;
                          const inss = Number(formData.inssAmount) || 0;
                          const antecipacao = Number(formData.anticipationDiscount) || 0;
                          const das = Number(formData.simplesAmount) || 0;
                          const totalDeducoes = iss + csll + pis + irrf + icms + ret + inss + antecipacao;
                          const liquido = bruto - totalDeducoes;
                          const custoTributarioTotal = totalDeducoes + das;
                          const deductions = [
                            { label: 'Retenção Contratual', value: ret, show: ret > 0 },
                            { label: `ISS (${formData.taxISS}%)`, value: iss, show: iss > 0 },
                            { label: `CSLL (${formData.taxCSLL}%)`, value: csll, show: csll > 0 },
                            { label: `PIS/COFINS (${formData.taxPISCOFINS}%)`, value: pis, show: pis > 0 },
                            { label: `IRRF (${formData.taxIRRF}%)`, value: irrf, show: irrf > 0 },
                            { label: `ICMS (${formData.taxICMS}%)`, value: icms, show: icms > 0 },
                            { label: `INSS (${formData.inssBasePercentage}% × ${formData.inssRate}%)`, value: inss, show: inss > 0 },
                            { label: 'Juros Antecipação (Banco)', value: antecipacao, show: antecipacao > 0 },
                          ].filter(d => d.show);
                          return (
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl p-4 space-y-2">
                              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">📋 Resumo de Liquidação</h3>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Valor Bruto da NF</span>
                                <span className="font-mono font-bold text-slate-900">R$ {bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              {deductions.length > 0 && (
                                <div className="border-t border-slate-200 pt-1 space-y-1">
                                  {deductions.map((d, i) => (
                                    <div key={i} className="flex justify-between text-sm text-red-600">
                                      <span>(-) {d.label}</span>
                                      <span className="font-mono">- R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex justify-between border-t-2 border-slate-400 pt-2 mt-1">
                                <span className={`font-bold text-sm ${liquido >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>= Valor Líquido Recebido</span>
                                <span className={`font-mono font-bold text-lg ${liquido >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>R$ {liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              {inss > 0 && (
                                <div className="mt-1 text-xs bg-indigo-50 border border-indigo-200 rounded-lg p-2 text-indigo-700">
                                  💡 <strong>R$ {inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> retido de INSS gera crédito para compensação com GPS dos funcionários
                                  {formData.inssGpsNumber && <span> — GPS: <strong>{formData.inssGpsNumber}</strong></span>}
                                </div>
                              )}

                              {/* ══════ IMPACTO TRIBUTÁRIO TOTAL ══════ */}
                              {(custoTributarioTotal > 0) && (
                                <div className="mt-3 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-4 space-y-2">
                                  <h3 className="font-bold text-red-900 text-sm flex items-center gap-2">⚠️ Impacto Tributário Total desta NF</h3>
                                  <div className="space-y-1">
                                    {iss > 0 && <div className="flex justify-between text-xs"><span className="text-red-700">ISS Retido na Fonte</span><span className="font-mono text-red-700">R$ {iss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                                    {csll > 0 && <div className="flex justify-between text-xs"><span className="text-red-700">CSLL Retido</span><span className="font-mono text-red-700">R$ {csll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                                    {pis > 0 && <div className="flex justify-between text-xs"><span className="text-red-700">PIS/COFINS Retido</span><span className="font-mono text-red-700">R$ {pis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                                    {irrf > 0 && <div className="flex justify-between text-xs"><span className="text-red-700">IRRF Retido</span><span className="font-mono text-red-700">R$ {irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                                    {icms > 0 && <div className="flex justify-between text-xs"><span className="text-red-700">ICMS</span><span className="font-mono text-red-700">R$ {icms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                                    {inss > 0 && <div className="flex justify-between text-xs"><span className="text-red-700">INSS Retido (Art. 31)</span><span className="font-mono text-red-700">R$ {inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                                    {ret > 0 && <div className="flex justify-between text-xs"><span className="text-red-700">Retenção Contratual</span><span className="font-mono text-red-700">R$ {ret.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                                    {antecipacao > 0 && <div className="flex justify-between text-xs"><span className="text-orange-700">Juros Antecipação (Banco)</span><span className="font-mono text-orange-700">R$ {antecipacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                                    {das > 0 && <div className="flex justify-between text-xs border-t border-red-200 pt-1 mt-1"><span className="text-amber-800 font-medium">🏛️ DAS Simples Nacional ({formData.simplesRate}%)</span><span className="font-mono text-amber-800 font-medium">R$ {das.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                                  </div>
                                  <div className="flex justify-between border-t-2 border-red-400 pt-2 mt-1">
                                    <span className="font-bold text-sm text-red-900">= Custo Tributário Total</span>
                                    <span className="font-mono font-bold text-lg text-red-900">R$ {custoTributarioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>Percentual sobre o bruto</span>
                                    <span className="font-mono font-bold">{bruto > 0 ? (custoTributarioTotal / bruto * 100).toFixed(2) : '0.00'}%</span>
                                  </div>
                                  <div className="flex justify-between text-sm mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                                    <span className="font-bold text-emerald-800">💵 Receita Real (após todos tributos)</span>
                                    <span className="font-mono font-bold text-emerald-900 text-lg">R$ {(liquido - das).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
        <TabsList className="grid w-full grid-cols-6 lg:w-[720px]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
          <TabsTrigger value="payable">A Pagar</TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-1"><Receipt className="w-3 h-3" /> Recibos</TabsTrigger>
          <TabsTrigger value="purchase-orders" className="flex items-center gap-1"><Package className="w-3 h-3" /> Pedidos</TabsTrigger>
          <TabsTrigger value="das" className="flex items-center gap-1">🏛️ DAS</TabsTrigger>
          <TabsTrigger value="debts" className="flex items-center gap-1">📊 Dívidas</TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-1">🏦 Conciliação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* ── Period Selector ── */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-slate-500"><Calendar className="w-4 h-4" /> Período:</div>
            {PERIOD_OPTIONS.map(p => (
              <button key={p.value} onClick={() => setDrePeriod(p.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${drePeriod === p.value ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {p.label}
              </button>
            ))}
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: 'Receitas do Período', value: summaryExt?.period?.currentIncome ?? summary?.receivedThisMonth ?? 0, icon: ArrowUpRight, color: 'emerald', variation: summaryExt?.period?.incomeVariation },
              { title: 'Despesas do Período', value: summaryExt?.period?.currentExpense ?? summary?.paidThisMonth ?? 0, icon: ArrowDownRight, color: 'rose', variation: summaryExt?.period?.expenseVariation },
              { title: 'Resultado do Período', value: summaryExt?.period?.currentProfit ?? (summary?.receivedThisMonth || 0) - (summary?.paidThisMonth || 0), icon: TrendingUp, color: 'blue', variation: summaryExt?.period?.profitVariation },
              { title: 'A Receber (Pendente)', value: summary?.toReceive ?? 0, icon: Wallet, color: 'amber' },
            ].map((kpi, i) => (
              <Card key={i} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.title}</CardTitle>
                  <kpi.icon className={`w-4 h-4 text-${kpi.color}-500`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-xl font-bold text-${kpi.color}-600`}>R$ {fmtBRL(kpi.value)}</div>
                  {kpi.variation !== undefined && (
                    <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.variation >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {kpi.variation >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(kpi.variation).toFixed(1)}% vs período anterior
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Mini KPIs ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Margem Bruta', value: dre?.dre?.margemBruta != null ? `${dre.dre.margemBruta.toFixed(1)}%` : '—', icon: Target, color: 'emerald' },
              { label: 'Margem Líquida', value: dre?.dre?.margemLiquida != null ? `${dre.dre.margemLiquida.toFixed(1)}%` : '—', icon: TrendingUp, color: 'blue' },
              { label: 'EBITDA', value: dre?.dre?.ebitda != null ? `R$ ${fmtBRL(dre.dre.ebitda)}` : '—', icon: BarChart3, color: 'purple' },
              { label: 'Ticket Médio', value: dre?.metrics?.ticketMedio != null ? `R$ ${fmtBRL(dre.metrics.ticketMedio)}` : '—', icon: Receipt, color: 'cyan' },
              { label: 'Inadimplência', value: summaryExt?.inadimplencia != null ? `${summaryExt.inadimplencia.toFixed(1)}%` : '—', icon: AlertTriangle, color: (summaryExt?.inadimplencia || 0) > 20 ? 'rose' : 'slate' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow">
                <div className={`w-8 h-8 rounded-lg bg-${m.color}-50 flex items-center justify-center`}><m.icon className={`w-4 h-4 text-${m.color}-500`} /></div>
                <div><p className="text-[10px] text-slate-400 uppercase tracking-wider">{m.label}</p><p className="text-sm font-bold text-slate-800">{m.value}</p></div>
              </div>
            ))}
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Evolution Chart */}
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500" /> Evolução Mensal</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {monthlyEvolution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyEvolution}>
                        <defs>
                          <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                          <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2})}`} />
                        <Legend />
                        <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" fill="url(#gradReceita)" strokeWidth={2} />
                        <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#f43f5e" fill="url(#gradDespesa)" strokeWidth={2} />
                        <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados de evolução</div>}
                </div>
              </CardContent>
            </Card>

            {/* Expense Pie */}
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-purple-500" /> Despesas por Categoria</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value">
                        {expenseByCategory.map((_, idx) => <Cell key={idx} fill={CATEGORY_COLORS[expenseByCategory[idx].key] || '#94a3b8'} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `R$ ${v.toLocaleString('pt-BR')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {expenseByCategory.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[item.key] || '#94a3b8' }} />
                        <span className="text-[11px] text-slate-500 truncate">{item.name}: <span className="font-medium text-slate-700">R$ {fmtBRL(item.value)}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Professional DRE ── */}
          <Card className="border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center gap-2"><FileText className="w-5 h-5" /> Demonstrativo de Resultados (DRE)</CardTitle>
              <span className="text-xs text-slate-300">{PERIOD_OPTIONS.find(p => p.value === drePeriod)?.label}</span>
            </CardHeader>
            <CardContent className="p-0">
              {(() => {
                const d = dre?.dre;
                const rb = d?.receitaBruta || dre?.revenue || 0;
                const pct = (v: number) => pctOf(v, rb);
                type DRELine = { label: string; value: number; level: number; type: 'income'|'expense'|'subtotal'|'result'; bold?: boolean };
                const lines: DRELine[] = [
                  { label: 'RECEITA OPERACIONAL BRUTA', value: rb, level: 0, type: 'income', bold: true },
                  ...(d ? [
                    { label: '(-) ISS', value: d.deducoes.iss, level: 2, type: 'expense' as const },
                    { label: '(-) PIS/COFINS', value: d.deducoes.pisCofins, level: 2, type: 'expense' as const },
                    { label: '(-) IRRF', value: d.deducoes.irrf, level: 2, type: 'expense' as const },
                    { label: '(-) CSLL', value: d.deducoes.csll, level: 2, type: 'expense' as const },
                    { label: '(-) ICMS', value: d.deducoes.icms, level: 2, type: 'expense' as const },
                    { label: '(-) Retenção Contratual', value: d.deducoes.retencaoContratual, level: 2, type: 'expense' as const },
                    { label: '(=) RECEITA OPERACIONAL LÍQUIDA', value: d.receitaLiquida, level: 0, type: 'subtotal' as const, bold: true },
                    { label: '(-) Materiais', value: d.cpv.materiais, level: 2, type: 'expense' as const },
                    { label: '(-) Mão de Obra', value: d.cpv.maoDeObra, level: 2, type: 'expense' as const },
                    { label: '(-) Equipamentos', value: d.cpv.equipamentos, level: 2, type: 'expense' as const },
                    { label: '(=) LUCRO BRUTO', value: d.lucroBruto, level: 0, type: 'subtotal' as const, bold: true },
                    { label: '(-) Despesas Administrativas', value: d.despesasOperacionais.administrativas, level: 2, type: 'expense' as const },
                    { label: '(-) Utilidades', value: d.despesasOperacionais.utilidades, level: 2, type: 'expense' as const },
                    { label: '(-) Marketing', value: d.despesasOperacionais.marketing, level: 2, type: 'expense' as const },
                    { label: '(-) Projetos', value: d.despesasOperacionais.projetos, level: 2, type: 'expense' as const },
                    { label: '(-) Outras Despesas', value: d.despesasOperacionais.outras, level: 2, type: 'expense' as const },
                    { label: '(=) EBITDA', value: d.ebitda, level: 0, type: 'subtotal' as const, bold: true },
                    { label: '(-) Impostos sobre Lucro', value: d.impostosSobreLucro, level: 2, type: 'expense' as const },
                    { label: '(=) LUCRO LÍQUIDO DO EXERCÍCIO', value: d.lucroLiquido, level: 0, type: 'result' as const, bold: true },
                  ] : [
                    { label: '(-) Impostos e Deduções', value: dre?.taxes || 0, level: 1, type: 'expense' as const },
                    { label: '(=) Receita Líquida', value: dre?.netRevenue || 0, level: 0, type: 'subtotal' as const, bold: true },
                    ...expenseByCategory.map(item => ({ label: `(-) ${item.name}`, value: item.value, level: 2, type: 'expense' as const })),
                    { label: '(=) Lucro Líquido', value: dre?.netProfit || 0, level: 0, type: 'result' as const, bold: true },
                  ]),
                ];
                return (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-[380px] text-xs uppercase tracking-wider">Descrição</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wider">Valor (R$)</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wider w-[100px]">% Receita</TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.filter(l => l.value !== 0 || l.bold).map((line, idx) => {
                        const bgClass = line.type === 'result' ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-t-2 border-amber-200' : line.type === 'subtotal' ? 'bg-slate-50/80 border-t border-slate-200' : line.type === 'income' && line.bold ? 'bg-emerald-50/40' : '';
                        const textClass = line.type === 'result' ? 'text-amber-700' : line.type === 'subtotal' ? 'text-slate-800' : line.type === 'expense' ? 'text-rose-600' : 'text-emerald-700';
                        const barPct = rb > 0 ? Math.min((Math.abs(line.value) / rb) * 100, 100) : 0;
                        const barColor = line.type === 'expense' ? '#fecaca' : line.type === 'result' ? '#fde68a' : line.type === 'subtotal' ? '#e2e8f0' : '#bbf7d0';
                        return (
                          <TableRow key={idx} className={`${bgClass} ${line.bold ? 'font-semibold' : ''}`}>
                            <TableCell style={{ paddingLeft: `${16 + line.level * 20}px` }} className={`${line.bold ? 'text-sm' : 'text-[13px]'} ${line.type === 'expense' && !line.bold ? 'text-slate-500' : textClass}`}>{line.label}{line.type === 'subtotal' && line.label.includes('BRUTO') && d ? <span className="ml-2 text-xs font-normal text-slate-400">({d.margemBruta.toFixed(1)}%)</span> : ''}{line.label.includes('EBITDA') && d ? <span className="ml-2 text-xs font-normal text-slate-400">({d.margemEbitda.toFixed(1)}%)</span> : ''}</TableCell>
                            <TableCell className={`text-right tabular-nums ${line.bold ? 'text-sm' : 'text-[13px]'} ${textClass}`}>{line.type === 'expense' ? '-' : ''} R$ {fmtBRL(Math.abs(line.value))}</TableCell>
                            <TableCell className="text-right text-xs text-slate-400">{pct(Math.abs(line.value))}</TableCell>
                            <TableCell className="pr-4"><div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, backgroundColor: barColor }} /></div></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>

          {/* ═══ CFO EXECUTIVE DASHBOARD ═══ */}
          {cfoDashboard && (
            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"><Target className="w-4 h-4 text-white" /></div>
                <h2 className="text-lg font-bold text-slate-800">Painel CFO Executivo</h2>
              </div>

              {/* Cash Position */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                  <CardContent className="p-4">
                    <p className="text-xs text-emerald-600 font-semibold uppercase">💰 Caixa Total</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">R$ {fmtBRL(cfoDashboard.cashPosition?.totalCash || 0)}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Disponível: R$ {fmtBRL(cfoDashboard.cashPosition?.availableCash || 0)}</p>
                    {(cfoDashboard.cashPosition?.bankBalances || []).map((b: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs mt-1 text-slate-500"><span>{b.name}</span><span className="font-medium">R$ {fmtBRL(b.balance)}</span></div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-4">
                    <p className="text-xs text-blue-600 font-semibold uppercase">📥 Recebíveis</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">R$ {fmtBRL(cfoDashboard.receivables?.total || 0)}</p>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="text-emerald-600">A vencer: R$ {fmtBRL(cfoDashboard.receivables?.current || 0)}</span>
                      <span className="text-rose-600">Vencido: R$ {fmtBRL(cfoDashboard.receivables?.overdue || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
                  <CardContent className="p-4">
                    <p className="text-xs text-rose-600 font-semibold uppercase">📤 A Pagar</p>
                    <p className="text-2xl font-bold text-rose-700 mt-1">R$ {fmtBRL(cfoDashboard.payables?.total || 0)}</p>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="text-amber-600">7 dias: R$ {fmtBRL(cfoDashboard.payables?.nextWeek || 0)}</span>
                      <span className="text-slate-500">30 dias: R$ {fmtBRL(cfoDashboard.payables?.next30Days || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow Projections + Aging */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Fluxo de Caixa Projetado</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: '30 dias', value: cfoDashboard.cashFlow?.projected30 || 0 },
                        { label: '60 dias', value: cfoDashboard.cashFlow?.projected60 || 0 },
                        { label: '90 dias', value: cfoDashboard.cashFlow?.projected90 || 0 },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{p.label}</span>
                          <span className={`font-bold ${p.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {fmtBRL(p.value)}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm text-slate-500">🔥 Burn Rate (mensal)</span>
                        <span className="font-bold text-amber-600">R$ {fmtBRL(cfoDashboard.cashFlow?.burnRate || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-500" /> Aging de Recebíveis</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(cfoDashboard.receivables?.aging || []).map((a: any, i: number) => {
                        const maxAmt = Math.max(...(cfoDashboard.receivables?.aging || []).map((x: any) => x.amount), 1);
                        const pct = (a.amount / maxAmt) * 100;
                        const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500'];
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="text-slate-600">{a.range} dias ({a.count})</span>
                              <span className="font-medium">R$ {fmtBRL(a.amount)}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full"><div className={`h-2 ${colors[i]} rounded-full transition-all`} style={{ width: `${pct}%` }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Debt + Tax + KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardContent className="p-4">
                    <p className="text-xs text-purple-600 font-semibold uppercase">🏦 Endividamento</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">R$ {fmtBRL(cfoDashboard.debt?.totalBalance || 0)}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">Parcela mensal:</span><span className="font-medium">R$ {fmtBRL(cfoDashboard.debt?.monthlyPayment || 0)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Dívidas ativas:</span><span className="font-medium">{cfoDashboard.debt?.activeCount || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Dívida/Receita:</span><span className="font-medium">{((cfoDashboard.debt?.debtToRevenueRatio || 0) * 100).toFixed(1)}%</span></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                  <CardContent className="p-4">
                    <p className="text-xs text-amber-600 font-semibold uppercase">🏛️ Carga Tributária</p>
                    <p className="text-xl font-bold text-amber-700 mt-1">R$ {fmtBRL(cfoDashboard.taxBurden?.totalTax || 0)}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">DAS:</span><span>R$ {fmtBRL(cfoDashboard.taxBurden?.totalDAS || 0)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">ISS:</span><span>R$ {fmtBRL(cfoDashboard.taxBurden?.totalISS || 0)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">INSS:</span><span>R$ {fmtBRL(cfoDashboard.taxBurden?.totalINSS || 0)}</span></div>
                      <div className="flex justify-between border-t pt-1"><span className="text-slate-500">Alíquota efetiva:</span><span className="font-bold">{(cfoDashboard.taxBurden?.effectiveRate || 0).toFixed(1)}%</span></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-600 font-semibold uppercase">📊 KPIs Operacionais</p>
                    <div className="mt-2 space-y-2">
                      {[
                        { label: 'DSO (dias p/ receber)', value: `${cfoDashboard.kpis?.dso || 0}d`, good: (cfoDashboard.kpis?.dso || 0) < 30 },
                        { label: 'DPO (dias p/ pagar)', value: `${cfoDashboard.kpis?.dpo || 0}d`, good: true },
                        { label: 'Ciclo de Caixa', value: `${cfoDashboard.kpis?.cashConversionCycle || 0}d`, good: (cfoDashboard.kpis?.cashConversionCycle || 0) < 30 },
                        { label: 'Liquidez', value: `${(cfoDashboard.kpis?.liquidityRatio || 0).toFixed(2)}`, good: (cfoDashboard.kpis?.liquidityRatio || 0) > 1 },
                        { label: 'Margem Operacional', value: `${(cfoDashboard.kpis?.operatingMargin || 0).toFixed(1)}%`, good: (cfoDashboard.kpis?.operatingMargin || 0) > 15 },
                      ].map((kpi, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{kpi.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${kpi.good ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="font-bold text-slate-700">{kpi.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
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
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Obra/Projeto</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Deduções / Líquido</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right min-w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">Nenhum recebimento encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => {
                      const hasInst = payment.installments && payment.installments.length > 0;
                      const isExp = expandedPaymentId === payment.id;
                      const paidAmt = Number(payment.paidAmount || 0);
                      const grossAmt = Number(payment.amount);
                      // Calculate net target considering deductions
                      const dedTotal = (Number(payment.taxISSAmount) || 0) + (Number(payment.taxCSLLAmount) || 0) + (Number(payment.taxPISCOFINSAmount) || 0) + (Number(payment.taxIRRFAmount) || 0) + (Number(payment.taxICMSAmount) || 0) + (Number(payment.taxWithholding) || 0) + (Number(payment.inssAmount) || 0) + (Number(payment.anticipationDiscount) || 0);
                      const totalAmt = dedTotal > 0 ? (grossAmt - dedTotal) : grossAmt;
                      const paidPct = totalAmt > 0 ? Math.min((paidAmt / totalAmt) * 100, 100) : 0;
                      const instRows = isExp ? (installmentsMap[payment.id] || payment.installments || []) : [];
                      return (
                        <>{/* parent row */}
                          <TableRow key={payment.id} className={isExp ? 'bg-blue-50/40' : ''}>
                            <TableCell className="px-2">
                              {hasInst && <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleExpandPayment(payment.id)}>
                                {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </Button>}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>{payment.description}</div>
                              {hasInst && <div className="flex items-center gap-1 mt-0.5"><Layers className="w-3 h-3 text-blue-500" /><span className="text-[10px] text-blue-600 font-medium">{payment.installments.filter((i: any) => i.status === 'paid').length}/{payment.installments.length} parcelas</span></div>}
                            </TableCell>
                            <TableCell>{payment.work?.title || '-'}</TableCell>
                            <TableCell>{new Date(payment.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-emerald-600 font-semibold">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>
                              {(() => {
                                const bruto = Number(payment.amount) || 0;
                                const iss = Number(payment.taxISSAmount) || 0;
                                const csll = Number(payment.taxCSLLAmount) || 0;
                                const pis = Number(payment.taxPISCOFINSAmount) || 0;
                                const irrf = Number(payment.taxIRRFAmount) || 0;
                                const icms = Number(payment.taxICMSAmount) || 0;
                                const ret = Number(payment.taxWithholding) || 0;
                                const inss = Number(payment.inssAmount) || 0;
                                const ant = Number(payment.anticipationDiscount) || 0;
                                const totalDed = iss + csll + pis + irrf + icms + ret + inss + ant;
                                if (totalDed <= 0) return <span className="text-xs text-slate-300">—</span>;
                                const liquido = bruto - totalDed;
                                const tags: string[] = [];
                                if (iss > 0) tags.push(`ISS`);
                                if (csll > 0) tags.push(`CSLL`);
                                if (pis > 0) tags.push(`PIS`);
                                if (irrf > 0) tags.push(`IRRF`);
                                if (icms > 0) tags.push(`ICMS`);
                                if (inss > 0) tags.push(`INSS`);
                                if (ret > 0) tags.push(`Ret.`);
                                if (ant > 0) tags.push(`Antec.`);
                                return (
                                  <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-emerald-700">Líq: R$ {liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    <div className="text-[10px] text-red-500">- R$ {totalDed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    <div className="flex flex-wrap gap-0.5">{tags.map(t => <span key={t} className="px-1 py-0 bg-slate-100 text-slate-500 rounded text-[9px]">{t}</span>)}</div>
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              {(hasInst || paidAmt > 0) ? (
                                <div className="space-y-1 min-w-[100px]">
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="h-full rounded-full transition-all bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${paidPct}%` }} /></div>
                                  <p className="text-[10px] text-slate-500 tabular-nums">R$ {fmtBRL(paidAmt)} / R$ {fmtBRL(totalAmt)} ({paidPct.toFixed(0)}%)</p>
                                </div>
                              ) : <span className="text-xs text-slate-300">—</span>}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : payment.status === 'partial' ? 'bg-blue-100 text-blue-700' : payment.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                {payment.status === 'paid' ? 'Recebido' : payment.status === 'partial' ? 'Parcial' : payment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" title="Nota Fiscal" onClick={() => openPaymentOnTab(payment, 'invoice')}><FileText className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600" title="Impostos" onClick={() => openPaymentOnTab(payment, 'taxes')}><Banknote className="w-3.5 h-3.5" /></Button>
                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-[180px]">
                                    {payment.status !== 'paid' && (<><DropdownMenuItem onClick={() => handleOpenRegister(payment)}><CheckCircle className="w-4 h-4 mr-2" /> Baixar Tudo</DropdownMenuItem><DropdownMenuItem onClick={() => handleOpenInstallmentDialog(payment)}><Layers className="w-4 h-4 mr-2 text-blue-600" /> Gerar Parcelas</DropdownMenuItem><DropdownMenuSeparator /></>)}
                                    <DropdownMenuItem onClick={() => {
                                      const receipt = {
                                        receiptNumber: `REC-${payment.id?.substring(0,6).toUpperCase()}`,
                                        description: payment.description,
                                        amount: Number(payment.amount),
                                        paymentMethod: payment.paymentMethod || 'transferência',
                                        paidAt: payment.scheduledPaymentDate || payment.dueDate || new Date().toISOString(),
                                        notes: payment.notes || '',
                                        client: payment.work?.client || payment.client || {},
                                        work: payment.work,
                                        taxISSAmount: payment.taxISSAmount, taxCSLLAmount: payment.taxCSLLAmount,
                                        taxPISCOFINSAmount: payment.taxPISCOFINSAmount, taxIRRFAmount: payment.taxIRRFAmount,
                                        taxICMSAmount: payment.taxICMSAmount, inssAmount: payment.inssAmount,
                                        taxWithholding: payment.taxWithholding, anticipationDiscount: payment.anticipationDiscount,
                                      };
                                      handleDownloadReceiptPDF(receipt);
                                    }}><Receipt className="w-4 h-4 mr-2 text-emerald-600" /> Gerar Recibo</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEdit(payment)}><Edit2 className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                                    {payment.type === 'income' && <DropdownMenuItem onClick={() => handlePublishPaymentToPortal(payment)}><Share2 className="w-4 h-4 mr-2" /> Portal</DropdownMenuItem>}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(payment.id)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                          {instRows.map((inst: any) => (
                            <TableRow key={inst.id} className="bg-slate-50/60 border-l-4 border-l-blue-300">
                              <TableCell></TableCell>
                              <TableCell className="pl-8">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-sm">{inst.description || `Parcela ${inst.installmentNumber}`}</span>
                                  {inst.receiptFile && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">📎</span>}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-400">—</TableCell>
                              <TableCell className="text-sm">{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('pt-BR') : '—'}</TableCell>
                              <TableCell className="text-sm font-medium">R$ {Number(inst.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell>{Number(inst.paidAmount || 0) > 0 && <span className="text-xs text-emerald-600">Pago: R$ {fmtBRL(Number(inst.paidAmount))}</span>}</TableCell>
                              <TableCell><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${inst.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : inst.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>{inst.status === 'paid' ? '✅ Pago' : inst.status === 'cancelled' ? 'Cancelado' : '⏳ Pendente'}</span></TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Receipt attach/download */}
                                  {inst.receiptFile ? (
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-600" title={`📎 ${inst.receiptFileName}`} onClick={() => handleDownloadReceipt(inst)}>
                                      <Paperclip className="w-3 h-3" />
                                    </Button>
                                  ) : (
                                    <label className="cursor-pointer" title="Anexar comprovante">
                                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadReceipt(inst, f); e.target.value = ''; }} />
                                      <div className="h-6 w-6 p-0 flex items-center justify-center text-slate-400 hover:text-blue-600 rounded transition-colors">
                                        <Paperclip className="w-3 h-3" />
                                      </div>
                                    </label>
                                  )}
                                  {inst.status === 'pending' && (
                                    <>
                                      <Button variant="outline" size="sm" className="h-6 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => handleOpenPayInstallment(inst)}><CheckCircle className="w-3 h-3" /> Baixar</Button>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-400" onClick={() => handleCancelInstallment(inst)}><X className="w-3 h-3" /></Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      );
                    })
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

        {/* ═══ DAS TAB ═══ */}
        <TabsContent value="das" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Guias DAS — Simples Nacional</h2>
              <p className="text-sm text-slate-500">Provisione e consolide guias DAS por competência mensal</p>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setDasDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Consolidar DAS
            </Button>
          </div>

          {/* DAS Summary by Month */}
          {(() => {
            const incomePayments = payments.filter((p: any) => p.type === 'income');
            const months = new Map<string, { payments: any[]; totalGross: number; totalDAS: number; status: string }>();
            incomePayments.forEach((p: any) => {
              const comp = p.simplesCompetence || (p.dueDate ? p.dueDate.substring(0, 7) : 'sem-data');
              if (!months.has(comp)) months.set(comp, { payments: [], totalGross: 0, totalDAS: 0, status: 'none' });
              const m = months.get(comp)!;
              m.payments.push(p);
              m.totalGross += Number(p.amount || 0);
              m.totalDAS += Number(p.simplesAmount || 0);
              if (p.simplesStatus === 'realized') m.status = 'realized';
              else if (p.simplesStatus === 'provisioned' && m.status !== 'realized') m.status = 'provisioned';
            });
            const sortedMonths = Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]));
            return (
              <div className="space-y-3">
                {sortedMonths.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-slate-400">Nenhum lançamento de receita registrado.</CardContent></Card>
                ) : sortedMonths.map(([month, data]) => {
                  const rate = data.totalGross > 0 ? (data.totalDAS / data.totalGross * 100) : 0;
                  const statusBadge = data.status === 'realized' ? { label: 'Realizado', color: 'bg-emerald-100 text-emerald-700' } : data.status === 'provisioned' ? { label: 'Provisionado', color: 'bg-amber-100 text-amber-700' } : { label: 'Sem exercício', color: 'bg-slate-100 text-slate-500' };
                  return (
                    <Card key={month} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-amber-100 rounded-xl flex flex-col items-center justify-center">
                              <span className="text-[10px] text-amber-600 font-medium">{month.split('-')[0]}</span>
                              <span className="text-lg font-bold text-amber-800">{month.split('-')[1] || '??'}</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{data.payments.length} NF(s) — Competência {month}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                <span>Bruto: <strong className="text-slate-700">R$ {data.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                                <span>•</span>
                                <span>DAS: <strong className="text-amber-700">R$ {data.totalDAS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                                {rate > 0 && <><span>•</span><span>Alíquota: <strong>{rate.toFixed(2)}%</strong></span></>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusBadge.color + ' text-xs'}>{statusBadge.label}</Badge>
                            {data.status !== 'realized' && (
                              <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => { setDasCompetence(month !== 'sem-data' ? month : ''); setDasDialogOpen(true); }}>
                                Consolidar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            DÍVIDAS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="debts" className="space-y-6 mt-6">
          {/* Debt Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { label: 'Endividamento Total', value: debtSummary?.totalBalance || 0, color: 'rose', icon: '💰' },
              { label: 'Custo Mensal', value: debtSummary?.totalMonthly || 0, color: 'amber', icon: '📅' },
              { label: 'Total Pago', value: debtSummary?.totalPaid || 0, color: 'emerald', icon: '✅' },
              { label: 'Dívidas Ativas', value: debtSummary?.totalDebts || 0, color: 'blue', icon: '📊', isCurrency: false },
              { label: 'Dívida Boa vs Ruim', value: `${(debtSummary?.byNature?.good?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })} / ${(debtSummary?.byNature?.bad?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: 'purple', icon: '⚖️', isText: true },
            ].map((c, i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1">{c.icon} {c.label}</p>
                  <p className={`text-xl font-bold text-${c.color}-600 mt-1`}>
                    {(c as any).isText ? c.value : (c as any).isCurrency === false ? c.value : `R$ ${fmtBRL(Number(c.value))}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Registro de Dívidas</h3>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { setEditingDebtId(null); setDebtForm({ description: '', creditor: '', type: 'other', nature: 'neutral', originalAmount: '', currentBalance: '', interestRate: '', interestPeriod: 'monthly', interestType: 'fixed', totalInstallments: '', monthlyPayment: '', startDate: '', endDate: '', contractNumber: '', notes: '' }); setDebtDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Dívida
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Credor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead>Valor Original</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-400">Nenhuma dívida cadastrada</TableCell></TableRow>
                  ) : debts.map((d: any) => {
                    const typeLabels: Record<string, string> = { loan: 'Empréstimo', financing: 'Financiamento', credit_card: 'Cartão Corp.', credit_card_third: 'Cartão Terceiro', tax_installment: 'Parc. Tributário', leasing: 'Leasing', personal_capital: 'Capital Pessoal', third_party_capital: 'Capital Terceiros', corporate_capital: 'Capital Corp.', supplier_debt: 'Fornecedor', judicial: 'Judicial', other: 'Outro' };
                    const natureColors: Record<string, string> = { good: 'bg-emerald-100 text-emerald-700', bad: 'bg-rose-100 text-rose-700', neutral: 'bg-slate-100 text-slate-600' };
                    const natureLabels: Record<string, string> = { good: '✅ Boa', bad: '❌ Ruim', neutral: '➖ Neutra' };
                    const statusColors: Record<string, string> = { active: 'bg-blue-100 text-blue-700', paid_off: 'bg-emerald-100 text-emerald-700', renegotiated: 'bg-amber-100 text-amber-700', defaulted: 'bg-rose-100 text-rose-700', frozen: 'bg-slate-100 text-slate-600' };
                    const progress = Number(d.originalAmount) > 0 ? (Number(d.totalPaid || 0) / Number(d.originalAmount)) * 100 : 0;
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.description}</TableCell>
                        <TableCell className="text-sm text-slate-600">{d.creditor || '—'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{typeLabels[d.type] || d.type}</Badge></TableCell>
                        <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${natureColors[d.nature] || natureColors.neutral}`}>{natureLabels[d.nature] || d.nature}</span></TableCell>
                        <TableCell>R$ {fmtBRL(Number(d.originalAmount || 0))}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium text-rose-600">R$ {fmtBRL(Number(d.currentBalance || 0))}</span>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1"><div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                          </div>
                        </TableCell>
                        <TableCell>R$ {fmtBRL(Number(d.monthlyPayment || 0))}</TableCell>
                        <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[d.status] || statusColors.active}`}>{d.status}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500" title="Pagar parcela" onClick={() => { setSelectedDebtId(d.id); setDebtPayForm({ amount: String(d.monthlyPayment || ''), principalAmount: '', interestAmount: '', method: 'pix', reference: '', notes: '' }); setDebtPayDialogOpen(true); }}><Banknote className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-500" title="Editar" onClick={() => { setEditingDebtId(d.id); setDebtForm({ ...d, originalAmount: String(d.originalAmount || ''), currentBalance: String(d.currentBalance || ''), interestRate: String(d.interestRate || ''), totalInstallments: String(d.totalInstallments || ''), monthlyPayment: String(d.monthlyPayment || ''), startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '', endDate: d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : '' }); setDebtDialogOpen(true); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400" title="Excluir" onClick={async () => { if (!confirm('Excluir esta dívida?')) return; try { await api.deleteDebt(d.id); toast.success('Dívida excluída'); loadDebts(); } catch { toast.error('Erro'); } }}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            CONCILIAÇÃO BANCÁRIA TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="reconciliation" className="space-y-6 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-800">Conciliação Bancária</h3>
              <Select value={selectedBankAccount} onValueChange={(v) => { setSelectedBankAccount(v); loadStatements(v); }}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.name} — {a.bankName || 'Banco'}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" disabled={!selectedBankAccount} onClick={() => { setStmtRows([{ date: new Date().toISOString().split('T')[0], description: '', amount: '', entryType: 'credit' }]); setNewStatementDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Importar Extrato
            </Button>
          </div>

          {!selectedBankAccount ? (
            <Card><CardContent className="py-12 text-center text-slate-400"><Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>Selecione uma conta bancária para começar a conciliação</p></CardContent></Card>
          ) : (
            <>
              {/* Statements List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statements.length === 0 ? (
                  <Card className="col-span-3"><CardContent className="py-8 text-center text-slate-400">Nenhum extrato importado para esta conta</CardContent></Card>
                ) : statements.map((s: any) => {
                  const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', partial: 'bg-blue-100 text-blue-700', reconciled: 'bg-emerald-100 text-emerald-700' };
                  const statusLabels: Record<string, string> = { pending: 'Pendente', partial: 'Parcial', reconciled: 'Conciliado' };
                  const isSelected = selectedStatementId === s.id;
                  return (
                    <Card key={s.id} className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-amber-400 border-amber-300' : 'border-slate-200'}`}
                      onClick={async () => { setSelectedStatementId(s.id); try { setStatementEntries(await api.getStatementEntries(s.id)); } catch {} }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{s.referenceMonth}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[s.status] || statusColors.pending}`}>{statusLabels[s.status] || s.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-slate-400">Créditos:</span> <span className="text-emerald-600 font-medium">R$ {fmtBRL(Number(s.totalCredits || 0))}</span></div>
                          <div><span className="text-slate-400">Débitos:</span> <span className="text-rose-600 font-medium">R$ {fmtBRL(Number(s.totalDebits || 0))}</span></div>
                          <div><span className="text-slate-400">Lançamentos:</span> {s.totalEntries}</div>
                          <div><span className="text-slate-400">Conciliados:</span> <span className="font-medium">{s.matchedEntries}/{s.totalEntries}</span></div>
                        </div>
                        <div className="flex gap-1 mt-3">
                          <Button size="sm" variant="outline" className="text-xs flex-1" onClick={async (e) => { e.stopPropagation(); try { const r = await api.autoMatchStatement(s.id); toast.success(`${r.matched} de ${r.total} conciliados automaticamente`); loadStatements(selectedBankAccount); setStatementEntries(await api.getStatementEntries(s.id)); } catch { toast.error('Erro no auto-match'); } }}>⚡ Auto-Match</Button>
                          <Button size="sm" variant="ghost" className="text-xs text-rose-400" onClick={async (e) => { e.stopPropagation(); if (!confirm('Excluir este extrato?')) return; try { await api.deleteBankStatement(s.id); toast.success('Extrato excluído'); loadStatements(selectedBankAccount); if (selectedStatementId === s.id) { setSelectedStatementId(null); setStatementEntries([]); } } catch { toast.error('Erro'); } }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Entries Table */}
              {selectedStatementId && statementEntries.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><GitBranch className="w-4 h-4 text-amber-500" /> Lançamentos do Extrato</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Lançamento Vinculado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statementEntries.map((e: any) => {
                          const matchColors: Record<string, string> = { matched: 'bg-emerald-100 text-emerald-700', unmatched: 'bg-amber-100 text-amber-700', divergent: 'bg-rose-100 text-rose-700', ignored: 'bg-slate-100 text-slate-500' };
                          const matchLabels: Record<string, string> = { matched: '✅ Conciliado', unmatched: '⚠️ Pendente', divergent: '❌ Divergente', ignored: '➖ Ignorado' };
                          return (
                            <TableRow key={e.id} className={e.matchStatus === 'matched' ? 'bg-emerald-50/30' : ''}>
                              <TableCell className="text-sm">{new Date(e.date).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell className="text-sm max-w-[200px] truncate">{e.description}</TableCell>
                              <TableCell><Badge variant="outline" className={e.entryType === 'credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>{e.entryType === 'credit' ? '↑ Crédito' : '↓ Débito'}</Badge></TableCell>
                              <TableCell className={`font-medium ${e.entryType === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {fmtBRL(Math.abs(Number(e.amount)))}</TableCell>
                              <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${matchColors[e.matchStatus] || matchColors.unmatched}`}>{matchLabels[e.matchStatus] || e.matchStatus}</span></TableCell>
                              <TableCell>
                                {e.matchedPaymentId ? (
                                  <span className="text-xs text-emerald-600">Vinculado</span>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
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
                value={registerData.amount}
                onChange={(e) => setRegisterData({ ...registerData, amount: parseBRL(e.target.value) })}
                placeholder="Ex: 25.015,67"
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
            {/* Receipt Upload */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2"><Paperclip className="w-3.5 h-3.5" /> Comprovante de Pagamento</Label>
              <label className="cursor-pointer">
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setRegisterReceiptFile(e.target.files?.[0] || null)} />
                <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${registerReceiptFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                  {registerReceiptFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                      <Paperclip className="w-4 h-4" />
                      <span className="font-medium truncate max-w-[200px]">{registerReceiptFile.name}</span>
                      <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRegisterReceiptFile(null); }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">
                      <Paperclip className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      <p>Clique para anexar comprovante</p>
                      <p className="text-[10px]">PDF, imagem (JPG, PNG)</p>
                    </div>
                  )}
                </div>
              </label>
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

      {/* ═══ GENERATE INSTALLMENTS DIALOG ═══ */}
      <Dialog open={installmentDialogOpen} onOpenChange={setInstallmentDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> Gerar Parcelas — {installmentPayment?.description}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* ── Financial Summary ── */}
            {installmentPayment && (() => {
              const total = Number(installmentPayment.amount || 0);
              const paid = Number(installmentPayment.paidAmount || 0);
              const hasInst = installmentPayment.installments?.length > 0;
              const instPaid = hasInst ? installmentPayment.installments.filter((i: any) => i.status === 'paid').length : 0;
              const instTotal = hasInst ? installmentPayment.installments.length : 0;
              const remaining = total - paid;
              return (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-medium">Valor Total</p>
                      <p className="text-lg font-bold text-slate-800">R$ {fmtBRL(total)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-medium">Já Pago</p>
                      <p className="text-lg font-bold text-emerald-600">R$ {fmtBRL(paid)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-medium">Saldo Restante</p>
                      <p className="text-lg font-bold text-blue-700">R$ {fmtBRL(remaining)}</p>
                    </div>
                  </div>
                  {hasInst && (
                    <div className="flex items-center justify-center gap-2 pt-1 border-t border-blue-200">
                      <Layers className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-700">{instPaid}/{instTotal} parcelas pagas — novas parcelas substituirão as existentes</span>
                    </div>
                  )}
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all" style={{ width: `${total > 0 ? (paid / total * 100) : 0}%` }} />
                  </div>
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Modo</Label>
                <Select value={installmentConfig.mode} onValueChange={v => setInstallmentConfig({ ...installmentConfig, mode: v as 'equal' | 'custom' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Parcelas Iguais</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {installmentConfig.mode === 'equal' ? (
                <>
                  <div className="space-y-2">
                    <Label>Nº Parcelas</Label>
                    <Input type="number" min={2} max={24} value={installmentConfig.count} onChange={e => setInstallmentConfig({ ...installmentConfig, count: Number(e.target.value) || 2 })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Intervalo (dias)</Label>
                    <Input type="number" min={1} value={installmentConfig.intervalDays} onChange={e => setInstallmentConfig({ ...installmentConfig, intervalDays: Number(e.target.value) || 30 })} />
                  </div>
                </>
              ) : (
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Parcelas Personalizadas</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => setCustomInstallments([...customInstallments, { percentage: '0', dueDate: new Date().toISOString().split('T')[0], description: '' }])}>
                      <Plus className="w-3 h-3 mr-1" /> Parcela
                    </Button>
                  </div>
                  {customInstallments.map((ci, idx) => (
                    <div key={idx} className="grid grid-cols-[60px_1fr_1fr_32px] gap-2 items-end">
                      <div><Label className="text-[10px]">%</Label><Input className="h-8 text-sm" type="text" inputMode="decimal" value={ci.percentage} onChange={e => { const n = [...customInstallments]; n[idx].percentage = e.target.value; setCustomInstallments(n); }} /></div>
                      <div><Label className="text-[10px]">Vencimento</Label><Input className="h-8 text-sm" type="date" value={ci.dueDate} onChange={e => { const n = [...customInstallments]; n[idx].dueDate = e.target.value; setCustomInstallments(n); }} /></div>
                      <div><Label className="text-[10px]">Descrição</Label><Input className="h-8 text-sm" value={ci.description} onChange={e => { const n = [...customInstallments]; n[idx].description = e.target.value; setCustomInstallments(n); }} placeholder={`Parcela ${idx + 1}`} /></div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500" onClick={() => setCustomInstallments(customInstallments.filter((_, i) => i !== idx))}><X className="w-3 h-3" /></Button>
                    </div>
                  ))}
                  {customInstallments.length > 0 && (
                    <p className={`text-xs font-medium ${Math.abs(customInstallments.reduce((s, c) => s + Number(c.percentage || 0), 0) - 100) < 0.5 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      Total: {customInstallments.reduce((s, c) => s + Number(c.percentage || 0), 0).toFixed(1)}% (deve ser 100%)
                    </p>
                  )}
                </div>
              )}
            </div>
            {/* Preview */}
            {installmentConfig.mode === 'equal' && installmentPayment && (
              <div className="bg-slate-50 rounded-lg border p-3 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Prévia</p>
                {Array.from({ length: installmentConfig.count }, (_, i) => {
                  const pct = parseFloat((100 / installmentConfig.count).toFixed(2));
                  const finalPct = i === installmentConfig.count - 1 ? (100 - pct * (installmentConfig.count - 1)) : pct;
                  const val = (Number(installmentPayment.amount) * finalPct / 100);
                  const d = new Date(); d.setDate(d.getDate() + i * installmentConfig.intervalDays);
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Parcela {i + 1}/{installmentConfig.count}</span>
                      <span className="font-medium">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — {d.toLocaleDateString('pt-BR')}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallmentDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleGenerateInstallments}>Gerar Parcelas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ PAY INSTALLMENT DIALOG ═══ */}
      <Dialog open={payInstallmentDialogOpen} onOpenChange={setPayInstallmentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-600" /> Baixar Parcela</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
              <p>{selectedInstallment?.description}</p>
              <p className="font-bold mt-1">Valor: R$ {Number(selectedInstallment?.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-2">
              <Label>Valor Recebido (R$)</Label>
              <Input type="text" inputMode="decimal" value={payInstData.amount} onChange={e => setPayInstData({ ...payInstData, amount: parseBRL(e.target.value) })} placeholder="Ex: 1.250,50" />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={payInstData.method} onValueChange={v => setPayInstData({ ...payInstData, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Transação (opcional)</Label>
              <Input value={payInstData.transactionId} onChange={e => setPayInstData({ ...payInstData, transactionId: e.target.value })} placeholder="NSU, autenticação..." />
            </div>
            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Paperclip className="w-3.5 h-3.5" /> Comprovante de Pagamento</Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => { setPayInstReceiptFile(e.target.files?.[0] || null); }} />
                  <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${payInstReceiptFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                    {payInstReceiptFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                        <Paperclip className="w-4 h-4" />
                        <span className="font-medium truncate max-w-[200px]">{payInstReceiptFile.name}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayInstReceiptFile(null); }}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">
                        <Paperclip className="w-5 h-5 mx-auto mb-1 opacity-50" />
                        <p>Clique para anexar comprovante</p>
                        <p className="text-[10px]">PDF, imagem (JPG, PNG)</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayInstallmentDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePayInstallment}>Confirmar Baixa</Button>
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

      {/* ═══ DAS CONSOLIDATION DIALOG ═══ */}
      <Dialog open={dasDialogOpen} onOpenChange={o => { if (!o) { setDasDialogOpen(false); } }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">🏛️ Consolidar Guia DAS — Simples Nacional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Competência + Valor + Status */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Competência (Mês)</Label>
                <Input type="month" value={dasCompetence} onChange={e => setDasCompetence(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor DAS Pago (R$)</Label>
                <Input type="text" inputMode="decimal" placeholder="Ex: 3.200,00" value={dasAmount}
                  onChange={e => setDasAmount(e.target.value)} className="h-9 font-mono font-bold" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <select className="w-full h-9 border rounded-md px-2 text-sm" value={dasStatus} onChange={e => setDasStatus(e.target.value as any)}>
                  <option value="provisioned">📋 Provisionado (estimativa)</option>
                  <option value="realized">✅ Realizado (pago)</option>
                </select>
              </div>
            </div>

            {/* Payments selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold">Selecione as NFs incluídas nesta guia:</Label>
                {(() => {
                  const eligible = payments.filter((p: any) => p.type === 'income');
                  const allSelected = eligible.length > 0 && eligible.every((p: any) => dasSelectedIds.has(p.id));
                  return (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                      if (allSelected) setDasSelectedIds(new Set());
                      else setDasSelectedIds(new Set(eligible.map((p: any) => p.id)));
                    }}>{allSelected ? 'Desmarcar tudo' : 'Selecionar tudo'}</Button>
                  );
                })()}
              </div>
              <div className="border rounded-lg max-h-[300px] overflow-y-auto divide-y">
                {payments.filter((p: any) => p.type === 'income').map((p: any) => {
                  const isSelected = dasSelectedIds.has(p.id);
                  const currentStatus = p.simplesStatus || 'none';
                  return (
                    <label key={p.id} className={`flex items-center gap-3 p-3 cursor-pointer transition ${isSelected ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => {
                        const next = new Set(dasSelectedIds);
                        if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                        setDasSelectedIds(next);
                      }} className="w-4 h-4 accent-amber-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.description}</p>
                        <p className="text-xs text-slate-500">{p.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '—'} • {p.client?.name || 'Sem cliente'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono font-bold">R$ {Number(p.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        {currentStatus !== 'none' && <span className={`text-[9px] px-1.5 py-0.5 rounded ${currentStatus === 'realized' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{currentStatus === 'realized' ? 'Realizado' : 'Provisionado'}</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            {dasSelectedIds.size > 0 && (() => {
              const selected = payments.filter((p: any) => dasSelectedIds.has(p.id));
              const totalGross = selected.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
              const dasValue = Number(parseBRL(dasAmount)) || 0;
              const effectiveRate = totalGross > 0 && dasValue > 0 ? (dasValue / totalGross * 100) : 0;
              return (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-amber-900">📊 Preview da Consolidação</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-slate-500 text-xs">NFs selecionadas</span><p className="font-bold">{dasSelectedIds.size}</p></div>
                    <div><span className="text-slate-500 text-xs">Total Bruto</span><p className="font-mono font-bold">R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                    <div><span className="text-slate-500 text-xs">Alíquota Efetiva</span><p className="font-bold text-amber-700">{effectiveRate.toFixed(2)}%</p></div>
                  </div>
                  {dasValue > 0 && (
                    <div className="border-t border-amber-200 pt-2 mt-2">
                      <p className="text-xs text-amber-700 mb-1">Distribuição proporcional:</p>
                      {selected.map((p: any) => {
                        const gross = Number(p.amount || 0);
                        const proportion = totalGross > 0 ? (gross / totalGross) * dasValue : 0;
                        return (
                          <div key={p.id} className="flex justify-between text-xs py-0.5">
                            <span className="text-slate-600 truncate max-w-[300px]">{p.description}</span>
                            <span className="font-mono text-amber-800">R$ {proportion.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDasDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" disabled={dasLoading || dasSelectedIds.size === 0 || !dasAmount} onClick={async () => {
              setDasLoading(true);
              try {
                const result = await api.consolidateDAS(Array.from(dasSelectedIds), Number(parseBRL(dasAmount)), dasCompetence, dasStatus);
                toast.success(`DAS consolidado! ${result.data?.updated || dasSelectedIds.size} NFs atualizadas — Alíquota ${Number(result.data?.effectiveRate || 0).toFixed(2)}%`);
                setDasDialogOpen(false);
                setDasSelectedIds(new Set());
                setDasAmount('');
                loadData();
              } catch (err: any) {
                toast.error(err?.response?.data?.message || 'Erro ao consolidar DAS.');
              } finally { setDasLoading(false); }
            }}>
              {dasLoading ? 'Processando...' : `Consolidar ${dasSelectedIds.size} NF(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DEBT CRUD DIALOG ═══ */}
      <Dialog open={debtDialogOpen} onOpenChange={setDebtDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingDebtId ? 'Editar Dívida' : 'Nova Dívida'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Descrição</Label><Input value={debtForm.description} onChange={e => setDebtForm({...debtForm, description: e.target.value})} placeholder="Ex: Empréstimo Bradesco PJ" /></div>
            <div><Label>Credor</Label><Input value={debtForm.creditor} onChange={e => setDebtForm({...debtForm, creditor: e.target.value})} placeholder="Banco / Pessoa" /></div>
            <div><Label>Nº Contrato</Label><Input value={debtForm.contractNumber} onChange={e => setDebtForm({...debtForm, contractNumber: e.target.value})} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={debtForm.type} onValueChange={v => setDebtForm({...debtForm, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[['loan','Empréstimo'], ['financing','Financiamento'], ['credit_card','Cartão Corporativo'], ['credit_card_third','Cartão de Terceiros'], ['tax_installment','Parc. Tributário'], ['leasing','Leasing'], ['personal_capital','Capital Pessoal'], ['third_party_capital','Capital de Terceiros'], ['corporate_capital','Capital Corporativo'], ['supplier_debt','Fornecedor'], ['judicial','Judicial'], ['other','Outro']].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Natureza</Label>
              <Select value={debtForm.nature} onValueChange={v => setDebtForm({...debtForm, nature: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">✅ Boa (investimento)</SelectItem>
                  <SelectItem value="bad">❌ Ruim (emergência/juros altos)</SelectItem>
                  <SelectItem value="neutral">➖ Neutra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Original (R$)</Label><Input type="number" step="0.01" value={debtForm.originalAmount} onChange={e => setDebtForm({...debtForm, originalAmount: e.target.value})} /></div>
            <div><Label>Saldo Atual (R$)</Label><Input type="number" step="0.01" value={debtForm.currentBalance} onChange={e => setDebtForm({...debtForm, currentBalance: e.target.value})} /></div>
            <div><Label>Taxa de Juros (%)</Label><Input type="number" step="0.001" value={debtForm.interestRate} onChange={e => setDebtForm({...debtForm, interestRate: e.target.value})} /></div>
            <div>
              <Label>Período</Label>
              <Select value={debtForm.interestPeriod} onValueChange={v => setDebtForm({...debtForm, interestPeriod: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="monthly">% ao mês</SelectItem><SelectItem value="yearly">% ao ano</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Total Parcelas</Label><Input type="number" value={debtForm.totalInstallments} onChange={e => setDebtForm({...debtForm, totalInstallments: e.target.value})} /></div>
            <div><Label>Parcela Mensal (R$)</Label><Input type="number" step="0.01" value={debtForm.monthlyPayment} onChange={e => setDebtForm({...debtForm, monthlyPayment: e.target.value})} /></div>
            <div><Label>Data Início</Label><Input type="date" value={debtForm.startDate} onChange={e => setDebtForm({...debtForm, startDate: e.target.value})} /></div>
            <div><Label>Previsão Quitação</Label><Input type="date" value={debtForm.endDate} onChange={e => setDebtForm({...debtForm, endDate: e.target.value})} /></div>
            <div className="col-span-2"><Label>Observações</Label><Input value={debtForm.notes} onChange={e => setDebtForm({...debtForm, notes: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDebtDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={async () => {
              try {
                const payload = { ...debtForm, originalAmount: parseFloat(debtForm.originalAmount) || 0, currentBalance: parseFloat(debtForm.currentBalance) || parseFloat(debtForm.originalAmount) || 0, interestRate: parseFloat(debtForm.interestRate) || 0, totalInstallments: parseInt(debtForm.totalInstallments) || 0, monthlyPayment: parseFloat(debtForm.monthlyPayment) || 0 };
                if (editingDebtId) await api.updateDebt(editingDebtId, payload);
                else await api.createDebt(payload);
                toast.success(editingDebtId ? 'Dívida atualizada!' : 'Dívida cadastrada!');
                setDebtDialogOpen(false); loadDebts(); loadCFODashboard();
              } catch { toast.error('Erro ao salvar dívida'); }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DEBT PAYMENT DIALOG ═══ */}
      <Dialog open={debtPayDialogOpen} onOpenChange={setDebtPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Registrar Pagamento de Dívida</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={debtPayForm.amount} onChange={e => setDebtPayForm({...debtPayForm, amount: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Principal (R$)</Label><Input type="number" step="0.01" value={debtPayForm.principalAmount} onChange={e => setDebtPayForm({...debtPayForm, principalAmount: e.target.value})} /></div>
              <div><Label>Juros (R$)</Label><Input type="number" step="0.01" value={debtPayForm.interestAmount} onChange={e => setDebtPayForm({...debtPayForm, interestAmount: e.target.value})} /></div>
            </div>
            <div><Label>Método</Label>
              <Select value={debtPayForm.method} onValueChange={v => setDebtPayForm({...debtPayForm, method: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="debito_automatico">Débito Automático</SelectItem><SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nº Comprovante</Label><Input value={debtPayForm.reference} onChange={e => setDebtPayForm({...debtPayForm, reference: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDebtPayDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={async () => {
              if (!selectedDebtId) return;
              try {
                await api.addDebtPayment(selectedDebtId, { ...debtPayForm, amount: parseFloat(debtPayForm.amount) || 0, principalAmount: parseFloat(debtPayForm.principalAmount) || 0, interestAmount: parseFloat(debtPayForm.interestAmount) || 0, paidAt: new Date().toISOString() });
                toast.success('Pagamento registrado!'); setDebtPayDialogOpen(false); loadDebts(); loadCFODashboard();
              } catch { toast.error('Erro ao registrar pagamento'); }
            }}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ STATEMENT IMPORT DIALOG ═══ */}
      <Dialog open={newStatementDialog} onOpenChange={setNewStatementDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Importar Extrato Bancário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Mês de Referência</Label><Input type="month" value={stmtMonth} onChange={e => setStmtMonth(e.target.value)} /></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Lançamentos</Label>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setStmtRows([...stmtRows, { date: new Date().toISOString().split('T')[0], description: '', amount: '', entryType: 'credit' }])}>
                  <Plus className="w-3 h-3 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="px-2 py-1.5 text-left text-xs font-medium text-slate-500">Data</th><th className="px-2 py-1.5 text-left text-xs font-medium text-slate-500">Descrição</th><th className="px-2 py-1.5 text-left text-xs font-medium text-slate-500">Tipo</th><th className="px-2 py-1.5 text-left text-xs font-medium text-slate-500">Valor (R$)</th><th className="w-8"></th></tr></thead>
                  <tbody>
                    {stmtRows.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-1 py-1"><Input type="date" className="h-8 text-xs" value={row.date} onChange={e => { const n = [...stmtRows]; n[i].date = e.target.value; setStmtRows(n); }} /></td>
                        <td className="px-1 py-1"><Input className="h-8 text-xs" placeholder="Descrição" value={row.description} onChange={e => { const n = [...stmtRows]; n[i].description = e.target.value; setStmtRows(n); }} /></td>
                        <td className="px-1 py-1">
                          <Select value={row.entryType} onValueChange={v => { const n = [...stmtRows]; n[i].entryType = v; setStmtRows(n); }}>
                            <SelectTrigger className="h-8 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="credit">Crédito</SelectItem><SelectItem value="debit">Débito</SelectItem></SelectContent>
                          </Select>
                        </td>
                        <td className="px-1 py-1"><Input type="number" step="0.01" className="h-8 text-xs" value={row.amount} onChange={e => { const n = [...stmtRows]; n[i].amount = e.target.value; setStmtRows(n); }} /></td>
                        <td className="px-1 py-1"><Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400" onClick={() => setStmtRows(stmtRows.filter((_, j) => j !== i))}><X className="w-3 h-3" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewStatementDialog(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={async () => {
              try {
                const entries = stmtRows.filter(r => r.description && r.amount).map(r => ({ ...r, amount: parseFloat(r.amount) || 0 }));
                if (entries.length === 0) { toast.error('Adicione ao menos um lançamento'); return; }
                await api.createBankStatement({ bankAccountId: selectedBankAccount, referenceMonth: stmtMonth, entries });
                toast.success('Extrato importado com sucesso!'); setNewStatementDialog(false); loadStatements(selectedBankAccount);
              } catch { toast.error('Erro ao importar extrato'); }
            }}>Importar</Button>
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
