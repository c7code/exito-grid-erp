import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Receipt,
    Upload,
    Shield,
    FileText,
    Package,
    Wrench,
    Plus,
    MoreVertical,
    Eye,
    XCircle,
    Download,
    CheckCircle,
    AlertTriangle,
    Clock,
    Ban,
    Search,
    Building2,
    KeyRound,
    Trash2,
    Loader2,
    Wifi,
    RefreshCw,
    FileCode,
    Edit3,
    History,
    User,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700', icon: Clock },
    processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
    authorized: { label: 'Autorizada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: Ban },
    error: { label: 'Erro', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
};

const fmt = (v: number) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminFiscal() {
    const [activeTab, setActiveTab] = useState('invoices');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Emissão
    const [selectedProposal, setSelectedProposal] = useState<string>('');
    const [preview, setPreview] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [emitting, setEmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{ campo: string; local: string }[]>([]);
    const [validationDialogOpen, setValidationDialogOpen] = useState(false);
    const [naturezaOperacao, setNaturezaOperacao] = useState('Venda de mercadoria');
    const [finalidadeNfe, setFinalidadeNfe] = useState(1);
    const [cfopCode, setCfopCode] = useState('');
    const [naturezas, setNaturezas] = useState<Record<string, string>>({});

    // Config
    const [certFile, setCertFile] = useState<File | null>(null);
    const [certPassword, setCertPassword] = useState('');
    const [uploadingCert, setUploadingCert] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [configForm, setConfigForm] = useState({
        companyName: '',
        cnpj: '',
        stateRegistration: '',
        municipalRegistration: '',
        companyAddress: '',
        companyCity: '',
        companyState: '',
        companyCep: '',
        canInvoiceMaterial: false,
        canInvoiceService: false,
        // Configuração Tributária
        regimeTributario: '1',
        simplesAnexo: '',
        crt: 1,
        aliquotaIss: 5,
        codigoServico: '',
        codigoTribNacional: '01.01.01',
        cnae: '',
        codigoMunicipio: '',
        nomeMunicipio: '',
        retIss: false,
        retIrpj: false,
        aliquotaIrpj: 1.5,
        retCsll: false,
        aliquotaCsll: 1.0,
        retPis: false,
        aliquotaPis: 0.65,
        retCofins: false,
        aliquotaCofins: 3.0,
        retInss: false,
        aliquotaInss: 11.0,
        cno: '',
        regEspTrib: '',
        // API
        fiscalApiProvider: 'nuvem_fiscal',
        fiscalApiClientId: '',
        fiscalApiClientSecret: '',
        fiscalApiEnvironment: 'sandbox',
    });
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionResult, setConnectionResult] = useState<any>(null);
    const [syncing, setSyncing] = useState(false);

    // Cancel dialog
    const [cancelDialog, setCancelDialog] = useState(false);
    const [cancelId, setCancelId] = useState('');
    const [cancelReason, setCancelReason] = useState('');

    // Detail dialog
    const [detailDialog, setDetailDialog] = useState(false);
    const [detailInvoice, setDetailInvoice] = useState<any>(null);

    // Emissão parcial
    const [customValueNfe, setCustomValueNfe] = useState('');
    const [customValueNfse, setCustomValueNfse] = useState('');
    const [installmentNumberNfe, setInstallmentNumberNfe] = useState('');
    const [installmentTotalNfe, setInstallmentTotalNfe] = useState('');
    const [installmentNumberNfse, setInstallmentNumberNfse] = useState('');
    const [installmentTotalNfse, setInstallmentTotalNfse] = useState('');

    // Edit value dialog
    const [editValueDialog, setEditValueDialog] = useState(false);
    const [editInvoice, setEditInvoice] = useState<any>(null);
    const [editNewValue, setEditNewValue] = useState('');
    const [editReason, setEditReason] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    // History dialog
    const [historyDialog, setHistoryDialog] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyInvoice, setHistoryInvoice] = useState<any>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Client data dialog
    const [clientDialog, setClientDialog] = useState(false);
    const [emitType, setEmitType] = useState<'nfe' | 'nfse'>('nfse');
    const [clientForm, setClientForm] = useState({
        tipoPessoa: 'PJ' as 'PF' | 'PJ',
        name: '',
        document: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        ibgeCode: '',
        email: '',
    });

    // ═══ NOTA AVULSA (standalone) ═══
    const [emitMode, setEmitMode] = useState<'proposal' | 'standalone'>('proposal');
    const [avulsaType, setAvulsaType] = useState<'nfe' | 'nfse'>('nfse');
    const [clientSearch, setClientSearch] = useState('');
    const [clientResults, setClientResults] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [searchingClients, setSearchingClients] = useState(false);
    const [showNewClient, setShowNewClient] = useState(false);
    const [savingNewClient, setSavingNewClient] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '', companyName: '', document: '', email: '', phone: '',
        address: '', number: '', complement: '', neighborhood: '',
        city: '', state: '', zipCode: '', ibgeCode: '',
        type: 'company' as 'individual' | 'company',
    });
    const [avulsaItems, setAvulsaItems] = useState<{
        description: string; unit: string; quantity: number; unitPrice: number;
        ncm?: string; cfopInterno?: string;
    }[]>([{ description: '', unit: 'UN', quantity: 1, unitPrice: 0 }]);
    const [avulsaNatureza, setAvulsaNatureza] = useState('Prestação de serviço');
    const [avulsaCfop, setAvulsaCfop] = useState('');
    const [avulsaFinalidade, setAvulsaFinalidade] = useState(1);
    const [emittingAvulsa, setEmittingAvulsa] = useState(false);
    // NFS-e specific fields
    const [avulsaDCompet, setAvulsaDCompet] = useState(new Date().toISOString().split('T')[0]);
    const [avulsaMunicipioIbge, setAvulsaMunicipioIbge] = useState('');
    const [avulsaDescricaoServico, setAvulsaDescricaoServico] = useState('');
    const [avulsaInfoComplementares, setAvulsaInfoComplementares] = useState('');
    const [avulsaNumPedido, setAvulsaNumPedido] = useState('');
    const [avulsaDocReferencia, setAvulsaDocReferencia] = useState('');
    const [avulsaErrors, setAvulsaErrors] = useState<{ message: string; fields: { campo: string; local: string }[] } | null>(null);


    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [inv, cfg, props, nats] = await Promise.all([
                api.getFiscalInvoices().catch(() => []),
                api.getFiscalConfig().catch(() => null),
                api.getProposals('accepted').catch(() => []),
                api.getNaturezasOperacao().catch(() => ({})),
            ]);
            setInvoices(inv);
            setNaturezas(nats);
            if (cfg) {
                setConfig(cfg);
                setConfigForm({
                    companyName: cfg.companyName || '',
                    cnpj: cfg.cnpj || '',
                    stateRegistration: cfg.stateRegistration || '',
                    municipalRegistration: cfg.municipalRegistration || '',
                    companyAddress: cfg.companyAddress || '',
                    companyCity: cfg.companyCity || '',
                    companyState: cfg.companyState || '',
                    companyCep: cfg.companyCep || '',
                    canInvoiceMaterial: cfg.canInvoiceMaterial || false,
                    canInvoiceService: cfg.canInvoiceService || false,
                    // Tributária
                    regimeTributario: cfg.regimeTributario || '1',
                    simplesAnexo: cfg.simplesAnexo || '',
                    crt: cfg.crt || 1,
                    aliquotaIss: cfg.aliquotaIss ?? 5,
                    codigoServico: cfg.codigoServico || '',
                    codigoTribNacional: cfg.codigoTribNacional || '01.01.01',
                    cnae: cfg.cnae || '',
                    codigoMunicipio: cfg.codigoMunicipio || '',
                    nomeMunicipio: cfg.nomeMunicipio || '',
                    retIss: cfg.retIss || false,
                    retIrpj: cfg.retIrpj || false,
                    aliquotaIrpj: cfg.aliquotaIrpj ?? 1.5,
                    retCsll: cfg.retCsll || false,
                    aliquotaCsll: cfg.aliquotaCsll ?? 1.0,
                    retPis: cfg.retPis || false,
                    aliquotaPis: cfg.aliquotaPis ?? 0.65,
                    retCofins: cfg.retCofins || false,
                    aliquotaCofins: cfg.aliquotaCofins ?? 3.0,
                    retInss: cfg.retInss || false,
                    aliquotaInss: cfg.aliquotaInss ?? 11.0,
                    cno: cfg.cno || '',
                    regEspTrib: cfg.regEspTrib != null ? String(cfg.regEspTrib) : '',
                    // API
                    fiscalApiProvider: cfg.fiscalApiProvider || 'nuvem_fiscal',
                    fiscalApiClientId: cfg.fiscalApiClientId || '',
                    fiscalApiClientSecret: cfg.fiscalApiClientSecret || '',
                    fiscalApiEnvironment: cfg.fiscalApiEnvironment || 'sandbox',
                });
            }
            setProposals(Array.isArray(props) ? props : []);
        } catch {
            toast.error('Erro ao carregar dados fiscais');
        }
        setLoading(false);
    };

    // ═══ CONFIGURAÇÃO ═══
    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            const updated = await api.updateFiscalConfig(configForm);
            setConfig(updated);
            toast.success('Configuração fiscal salva!');
        } catch {
            toast.error('Erro ao salvar configuração');
        }
        setSavingConfig(false);
    };

    // ═══ AUTO-PREENCHIMENTO CNPJ ═══
    const handleCnpjLookup = async () => {
        const clean = configForm.cnpj?.replace(/\D/g, '') || '';
        if (clean.length !== 14) return;
        try {
            const data = await api.lookupCnpj(clean);
            const endereco = [data.logradouro, data.numero, data.complemento, data.bairro]
                .filter(Boolean).join(', ');
            setConfigForm((prev: any) => ({
                ...prev,
                companyName: data.razaoSocial || prev.companyName,
                companyAddress: endereco || prev.companyAddress,
                companyCity: data.municipio || prev.companyCity,
                companyState: data.uf || prev.companyState,
                companyCep: data.cep?.replace(/\D/g, '') || prev.companyCep,
            }));
            toast.success('Dados da empresa preenchidos automaticamente!');
        } catch {
            // Silently fail — user can fill manually
        }
    };

    // ═══ AUTO-PREENCHIMENTO CEP ═══
    const handleCepLookup = async () => {
        const clean = configForm.companyCep?.replace(/\D/g, '') || '';
        if (clean.length !== 8) return;
        try {
            const data = await api.lookupCep(clean);
            const endereco = [data.logradouro, data.bairro].filter(Boolean).join(', ');
            setConfigForm((prev: any) => ({
                ...prev,
                companyAddress: endereco || prev.companyAddress,
                companyCity: data.cidade || prev.companyCity,
                companyState: data.uf || prev.companyState,
                codigoMunicipio: data.ibge || prev.codigoMunicipio,
                nomeMunicipio: data.cidade || prev.nomeMunicipio,
            }));
            toast.success('Endereço preenchido automaticamente!');
        } catch {
            // Silently fail
        }
    };

    const handleUploadCert = async () => {
        if (!certFile || !certPassword) {
            toast.error('Selecione o arquivo e informe a senha');
            return;
        }
        setUploadingCert(true);
        try {
            const updated = await api.uploadFiscalCertificate(certFile, certPassword);
            setConfig(updated);
            setCertFile(null);
            setCertPassword('');
            toast.success('Certificado digital enviado com sucesso!');
        } catch {
            toast.error('Erro ao enviar certificado');
        }
        setUploadingCert(false);
    };

    const handleRemoveCert = async () => {
        try {
            const updated = await api.removeFiscalCertificate();
            setConfig(updated);
            toast.success('Certificado removido');
        } catch {
            toast.error('Erro ao remover certificado');
        }
    };

    // ═══ EMISSÃO ═══
    const handleSelectProposal = async (proposalId: string) => {
        setSelectedProposal(proposalId);
        if (!proposalId) { setPreview(null); return; }
        setLoadingPreview(true);
        try {
            const data = await api.getFiscalProposalPreview(proposalId);
            setPreview(data);
        } catch {
            toast.error('Erro ao carregar preview da proposta');
        }
        setLoadingPreview(false);
    };

    const handleEmitInvoice = async (type: 'nfe' | 'nfse') => {
        if (!selectedProposal) return;
        if (!naturezaOperacao) {
            toast.error('Selecione a Natureza de Operação');
            return;
        }
        setEmitType(type);

        // Pré-preencher com dados do cliente da proposta (se disponível no preview)
        if (preview?.client) {
            const c = preview.client;
            const doc = c.document?.replace(/\D/g, '') || '';
            setClientForm({
                tipoPessoa: doc.length === 14 ? 'PJ' : 'PF',
                name: c.name || '',
                document: c.document || '',
                address: c.address || '',
                city: c.city || '',
                state: c.state || '',
                zipCode: c.zipCode || '',
                ibgeCode: c.ibgeCode || '',
                email: c.email || '',
            });
        } else {
            setClientForm({
                tipoPessoa: 'PJ',
                name: '',
                document: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                ibgeCode: '',
                email: '',
            });
        }
        setClientDialog(true);
    };

    const handleConfirmEmit = async () => {
        // Validação frontend
        if (!clientForm.name.trim()) {
            toast.error('Nome do cliente é obrigatório');
            return;
        }
        const docClean = clientForm.document.replace(/\D/g, '');
        if (clientForm.tipoPessoa === 'PF' && docClean.length !== 11) {
            toast.error('CPF inválido (deve ter 11 dígitos)');
            return;
        }
        if (clientForm.tipoPessoa === 'PJ' && docClean.length !== 14) {
            toast.error('CNPJ inválido (deve ter 14 dígitos)');
            return;
        }

        setClientDialog(false);
        setEmitting(true);
        try {
            const isNfe = emitType === 'nfe';
            const cv = isNfe ? customValueNfe : customValueNfse;
            const iNum = isNfe ? installmentNumberNfe : installmentNumberNfse;
            const iTotal = isNfe ? installmentTotalNfe : installmentTotalNfse;

            const result = await api.createFiscalInvoice({
                proposalId: selectedProposal || undefined,
                type: emitType,
                naturezaOperacao,
                finalidadeNfe,
                cfopCode,
                customValue: cv ? Number(cv) : undefined,
                installmentNumber: iNum ? Number(iNum) : undefined,
                installmentTotal: iTotal ? Number(iTotal) : undefined,
                clientData: {
                    name: clientForm.name,
                    document: clientForm.document,
                    address: clientForm.address || undefined,
                    city: clientForm.city || undefined,
                    state: clientForm.state || undefined,
                    zipCode: clientForm.zipCode || undefined,
                    ibgeCode: clientForm.ibgeCode || undefined,
                    email: clientForm.email || undefined,
                },
            });
            if (result.status === 'error') {
                toast.error(`Erro: ${result.errorMessage || 'Falha ao emitir'}`);
            } else if (result.status === 'processing') {
                toast.success(`${isNfe ? 'NF-e' : 'NFS-e'} enviada para processamento! Verifique o status em breve.`);
            } else {
                toast.success(`${isNfe ? 'NF-e' : 'NFS-e'} emitida com sucesso!`);
            }
            setSelectedProposal('');
            setPreview(null);
            setCustomValueNfe(''); setCustomValueNfse('');
            setInstallmentNumberNfe(''); setInstallmentTotalNfe('');
            setInstallmentNumberNfse(''); setInstallmentTotalNfse('');
            loadData();
            setActiveTab('invoices');
        } catch (err: any) {
            const data = err?.response?.data;
            if (data?.message?.missingFields && Array.isArray(data.message.missingFields)) {
                setValidationErrors(data.message.missingFields);
                setValidationDialogOpen(true);
            } else {
                const msg = typeof data?.message === 'string'
                    ? data.message
                    : data?.message?.message || 'Erro ao emitir nota fiscal';
                toast.error(msg);
            }
        }
        setEmitting(false);
    };

    // ═══ EDIÇÃO DE VALOR ═══
    const handleEditValueSubmit = async () => {
        if (!editInvoice || !editNewValue) return;
        if (!editReason.trim()) { toast.error('Informe o motivo da alteração'); return; }
        setSavingEdit(true);
        try {
            await api.updateFiscalInvoiceValue(editInvoice.id, Number(editNewValue), editReason);
            toast.success('Valor alterado com sucesso');
            setEditValueDialog(false);
            setEditNewValue(''); setEditReason('');
            loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao alterar valor');
        }
        setSavingEdit(false);
    };

    const handleShowHistory = async (inv: any) => {
        setHistoryInvoice(inv);
        setHistoryDialog(true);
        setLoadingHistory(true);
        try {
            const data = await api.getFiscalInvoiceHistory(inv.id);
            setHistoryData(data);
        } catch {
            toast.error('Erro ao carregar histórico');
            setHistoryData([]);
        }
        setLoadingHistory(false);
    };

    // ═══ NUVEM FISCAL ═══
    const handleTestConnection = async () => {
        setTestingConnection(true);
        setConnectionResult(null);
        try {
            const result = await api.testFiscalConnection();
            setConnectionResult(result);
            if (result.success) {
                toast.success('Conexão com Nuvem Fiscal OK!');
            } else {
                toast.error(result.message || 'Falha na conexão com Nuvem Fiscal');
            }
        } catch (err: any) {
            setConnectionResult({ success: false, message: err?.response?.data?.message || err?.message || 'Falha na conexão' });
            toast.error('Erro ao testar conexão');
        }
        setTestingConnection(false);
    };

    const handleSyncCompany = async () => {
        setSyncing(true);
        try {
            await api.syncFiscalCompany();
            await api.syncFiscalServices();
            toast.success('Empresa e serviços sincronizados com Nuvem Fiscal!');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao sincronizar');
        }
        setSyncing(false);
    };

    const handleCheckStatus = async (id: string) => {
        try {
            const updated = await api.checkFiscalInvoiceStatus(id);
            toast.success(`Status atualizado: ${STATUS_CONFIG[updated.status]?.label || updated.status}`);
            loadData();
        } catch {
            toast.error('Erro ao consultar status');
        }
    };

    const handleDownloadPdf = async (id: string) => {
        try {
            const blob = await api.downloadFiscalInvoicePdf(id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `nf-${id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Erro ao baixar PDF. A nota pode ainda estar sendo processada.');
        }
    };

    const handleDownloadXml = async (id: string) => {
        try {
            const blob = await api.downloadFiscalInvoiceXml(id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `nf-${id}.xml`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Erro ao baixar XML. A nota pode ainda estar sendo processada.');
        }
    };

    // ═══ CANCELAMENTO ═══
    const handleCancel = async () => {
        if (!cancelReason.trim()) { toast.error('Informe o motivo do cancelamento'); return; }
        try {
            await api.cancelFiscalInvoice(cancelId, cancelReason);
            toast.success('Nota fiscal cancelada');
            setCancelDialog(false);
            setCancelReason('');
            loadData();
        } catch {
            toast.error('Erro ao cancelar nota fiscal');
        }
    };

    // ═══ REENVIAR NOTA FISCAL ═══
    const handleRetryInvoice = async (id: string) => {
        try {
            toast.info('Reenviando nota fiscal...');
            const result = await api.retryFiscalInvoice(id);
            if (result.status === 'error') {
                toast.error(`Erro no reenvio: ${result.errorMessage || 'Falha ao emitir'}`);
            } else if (result.status === 'processing') {
                toast.success('Nota fiscal reenviada para processamento! Verifique o status em breve.');
            } else {
                toast.success('Nota fiscal reenviada com sucesso!');
            }
            loadData();
        } catch (err: any) {
            const data = err?.response?.data;
            if (data?.message?.missingFields && Array.isArray(data.message.missingFields)) {
                setValidationErrors(data.message.missingFields);
                setValidationDialogOpen(true);
            } else {
                const msg = typeof data?.message === 'string'
                    ? data.message
                    : data?.message?.message || 'Erro ao reenviar nota fiscal';
                toast.error(msg);
            }
        }
    };

    // ═══ NOTA AVULSA — busca de clientes ═══
    const handleSearchClients = async (term: string) => {
        setClientSearch(term);
        if (term.length < 2) { setClientResults([]); return; }
        setSearchingClients(true);
        try {
            const all = await api.getClients();
            const lower = term.toLowerCase();
            const filtered = all.filter((c: any) =>
                c.name?.toLowerCase().includes(lower) ||
                c.companyName?.toLowerCase().includes(lower) ||
                c.document?.replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
                c.email?.toLowerCase().includes(lower)
            );
            setClientResults(filtered.slice(0, 10));
        } catch { setClientResults([]); }
        setSearchingClients(false);
    };

    const handleSelectClient = (client: any) => {
        setSelectedClient(client);
        setClientSearch(client.name || client.companyName || '');
        setClientResults([]);
    };

    const handleSaveNewClient = async () => {
        if (!newClient.name && !newClient.companyName) { toast.error('Nome é obrigatório'); return; }
        if (!newClient.document) { toast.error('CPF/CNPJ é obrigatório'); return; }
        setSavingNewClient(true);
        try {
            const saved = await api.createClient(newClient);
            toast.success('Cliente cadastrado com sucesso!');
            setSelectedClient(saved);
            setClientSearch(saved.name || saved.companyName || '');
            setShowNewClient(false);
            setNewClient({
                name: '', companyName: '', document: '', email: '', phone: '',
                address: '', number: '', complement: '', neighborhood: '',
                city: '', state: '', zipCode: '', ibgeCode: '',
                type: 'company',
            });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao cadastrar cliente');
        }
        setSavingNewClient(false);
    };

    const handleEmitAvulsa = async () => {
        if (!selectedClient) { toast.error('Selecione ou cadastre um cliente'); return; }
        if (!avulsaNatureza) { toast.error('Selecione a Natureza de Operação'); return; }
        const validItems = avulsaItems.filter(i => i.description.trim() && i.quantity > 0 && i.unitPrice > 0);
        if (validItems.length === 0) { toast.error('Adicione pelo menos um item válido'); return; }

        setEmittingAvulsa(true);
        setAvulsaErrors(null);
        try {
            const items = validItems.map(i => ({
                description: i.description,
                unit: i.unit || 'UN',
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                total: i.quantity * i.unitPrice,
                ...(avulsaType === 'nfe' && i.ncm ? { ncm: i.ncm } : {}),
                ...(avulsaType === 'nfe' && i.cfopInterno ? { cfopInterno: i.cfopInterno } : {}),
            }));

            const result = await api.createFiscalInvoice({
                type: avulsaType,
                naturezaOperacao: avulsaNatureza,
                finalidadeNfe: avulsaFinalidade,
                cfopCode: avulsaCfop || undefined,
                // NFS-e specific
                ...(avulsaType === 'nfse' ? {
                    dCompet: avulsaDCompet || undefined,
                    municipioPrestacao: avulsaMunicipioIbge || undefined,
                    descricaoServico: avulsaDescricaoServico || undefined,
                    infoComplementares: avulsaInfoComplementares || undefined,
                } : {}),
                numPedido: avulsaNumPedido || undefined,
                docReferencia: avulsaDocReferencia || undefined,
                clientData: {
                    name: selectedClient.companyName || selectedClient.name,
                    document: selectedClient.document,
                    address: selectedClient.address || undefined,
                    number: selectedClient.number || undefined,
                    complement: selectedClient.complement || undefined,
                    neighborhood: selectedClient.neighborhood || undefined,
                    city: selectedClient.city || undefined,
                    state: selectedClient.state || undefined,
                    zipCode: selectedClient.zipCode || undefined,
                    ibgeCode: selectedClient.ibgeCode || undefined,
                    email: selectedClient.email || undefined,
                },
                items,
            });

            if (result.status === 'error') {
                toast.error(`Erro: ${result.errorMessage || 'Falha ao emitir'}`);
            } else if (result.status === 'processing') {
                toast.success(`${avulsaType === 'nfe' ? 'NF-e' : 'NFS-e'} avulsa enviada para processamento!`);
            } else {
                toast.success(`${avulsaType === 'nfe' ? 'NF-e' : 'NFS-e'} avulsa emitida com sucesso!`);
            }
            // Reset
            setSelectedClient(null);
            setClientSearch('');
            setAvulsaItems([{ description: '', unit: 'UN', quantity: 1, unitPrice: 0 }]);
            loadData();
            setActiveTab('invoices');
        } catch (err: any) {
            const data = err?.response?.data;
            // Parse structured missingFields from backend
            const nested = typeof data?.message === 'object' ? data.message : data;
            if (nested?.missingFields && Array.isArray(nested.missingFields)) {
                setAvulsaErrors({
                    message: nested.message || `${nested.missingFields.length} campo(s) obrigatório(s) faltando`,
                    fields: nested.missingFields,
                });
                toast.error('Há campos obrigatórios não preenchidos. Veja os detalhes abaixo.');
            } else {
                const msg = typeof data?.message === 'string'
                    ? data.message
                    : nested?.message || 'Erro ao emitir nota fiscal avulsa';
                setAvulsaErrors({ message: msg, fields: [] });
                toast.error(msg);
            }
        }
        setEmittingAvulsa(false);
    };

    // Filter invoices
    const filteredInvoices = invoices.filter((inv) => {
        if (filterType !== 'all' && inv.type !== filterType) return false;
        if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchNum = inv.invoiceNumber?.toLowerCase().includes(term);
            const matchRecipient = inv.recipientName?.toLowerCase().includes(term);
            const matchProposal = inv.proposal?.proposalNumber?.toLowerCase().includes(term);
            if (!matchNum && !matchRecipient && !matchProposal) return false;
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Receipt className="h-7 w-7 text-amber-600" />
                        Módulo Fiscal
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Faturamento NF-e (Material) e NFS-e (Serviço)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('emit')} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Emitir NF
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-slate-500">Autorizadas</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            {invoices.filter((i) => i.status === 'authorized').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-slate-400">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-slate-500">Rascunhos</p>
                        <p className="text-2xl font-bold text-slate-600">
                            {invoices.filter((i) => i.status === 'draft').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-slate-500">NF-e (Material)</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {invoices.filter((i) => i.type === 'nfe').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-slate-500">NFS-e (Serviço)</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {invoices.filter((i) => i.type === 'nfse').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="invoices" className="gap-1.5">
                        <FileText className="h-4 w-4" /> Notas Fiscais
                    </TabsTrigger>
                    <TabsTrigger value="emit" className="gap-1.5">
                        <Plus className="h-4 w-4" /> Emitir NF
                    </TabsTrigger>
                    <TabsTrigger value="config" className="gap-1.5">
                        <Shield className="h-4 w-4" /> Configuração
                    </TabsTrigger>
                </TabsList>

                {/* ═══ ABA: NOTAS FISCAIS ═══ */}
                <TabsContent value="invoices" className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por número, cliente ou proposta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                <SelectItem value="nfe">NF-e (Material)</SelectItem>
                                <SelectItem value="nfse">NFS-e (Serviço)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="draft">Rascunho</SelectItem>
                                <SelectItem value="authorized">Autorizada</SelectItem>
                                <SelectItem value="cancelled">Cancelada</SelectItem>
                                <SelectItem value="error">Erro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {filteredInvoices.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">Nenhuma nota fiscal encontrada</p>
                                <p className="text-sm mt-1">Emita sua primeira nota fiscal na aba "Emitir NF"</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredInvoices.map((inv) => {
                                const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                                const StatusIcon = sc.icon;
                                return (
                                    <Card key={inv.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="py-4">
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-2 rounded-lg ${inv.type === 'nfe' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                                                        {inv.type === 'nfe' ? (
                                                            <Package className={`h-5 w-5 text-blue-600`} />
                                                        ) : (
                                                            <Wrench className={`h-5 w-5 text-purple-600`} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-slate-800">
                                                                {inv.type === 'nfe' ? 'NF-e' : 'NFS-e'}
                                                                {inv.invoiceNumber && ` #${inv.invoiceNumber}`}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${sc.color}`}>
                                                                <StatusIcon className="h-3 w-3" /> {sc.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 truncate">
                                                            {inv.recipientName || 'Sem destinatário'}
                                                            {inv.proposal?.proposalNumber && ` • Proposta ${inv.proposal.proposalNumber}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-800">R$ {fmt(inv.totalValue)}</p>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <p className="text-xs text-slate-400">
                                                                {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('pt-BR') : '—'}
                                                            </p>
                                                            {inv.installmentNumber && inv.installmentTotal && (
                                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">
                                                                    {inv.installmentNumber}/{inv.installmentTotal}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => { setDetailInvoice(inv); setDetailDialog(true); }}>
                                                                <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                                                            </DropdownMenuItem>
                                                            {inv.externalId && inv.status === 'processing' && (
                                                                <DropdownMenuItem onClick={() => handleCheckStatus(inv.id)}>
                                                                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Status
                                                                </DropdownMenuItem>
                                                            )}
                                                            {inv.externalId && (inv.status === 'authorized' || inv.status === 'processing') && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleDownloadPdf(inv.id)}>
                                                                        <Download className="h-4 w-4 mr-2" /> Baixar PDF (DANFE)
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleDownloadXml(inv.id)}>
                                                                        <FileCode className="h-4 w-4 mr-2" /> Baixar XML
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {inv.status !== 'cancelled' && (
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => { setCancelId(inv.id); setCancelDialog(true); }}
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-2" /> Cancelar NF
                                                                </DropdownMenuItem>
                                                            )}
                                                            {(inv.status === 'error' || inv.status === 'draft') && (
                                                                <DropdownMenuItem
                                                                    className="text-green-600"
                                                                    onClick={() => handleRetryInvoice(inv.id)}
                                                                >
                                                                    <RefreshCw className="h-4 w-4 mr-2" /> Reenviar NF
                                                                </DropdownMenuItem>
                                                            )}
                                                            {inv.status === 'draft' && (
                                                                <DropdownMenuItem onClick={() => {
                                                                    setEditInvoice(inv);
                                                                    setEditNewValue(String(inv.totalValue || ''));
                                                                    setEditReason('');
                                                                    setEditValueDialog(true);
                                                                }}>
                                                                    <Edit3 className="h-4 w-4 mr-2" /> Editar Valor
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => handleShowHistory(inv)}>
                                                                <History className="h-4 w-4 mr-2" /> Histórico de Edições
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ═══ ABA: EMITIR NF ═══ */}
                <TabsContent value="emit" className="space-y-4">
                    {/* ── Mode Toggle ── */}
                    <div className="flex gap-2 border-b pb-3">
                        <Button
                            variant={emitMode === 'proposal' ? 'default' : 'outline'}
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setEmitMode('proposal')}
                        >
                            <FileText className="h-4 w-4" />
                            A partir de Proposta
                        </Button>
                        <Button
                            variant={emitMode === 'standalone' ? 'default' : 'outline'}
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setEmitMode('standalone')}
                        >
                            <Plus className="h-4 w-4" />
                            Nota Avulsa (sem proposta)
                        </Button>
                    </div>

                    {/* ═══ MODO PROPOSTA ═══ */}
                    {emitMode === 'proposal' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-amber-600" />
                                    Emitir Nota Fiscal a partir de Proposta
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Aviso de permissões */}
                                {config && !config.canInvoiceMaterial && !config.canInvoiceService && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800">Permissões não configuradas</p>
                                            <p className="text-xs text-amber-600 mt-0.5">
                                                Vá para a aba "Configuração" e habilite o faturamento de Material e/ou Serviço.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {config && !config.certificateFile && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <Shield className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-red-800">Certificado digital não configurado</p>
                                            <p className="text-xs text-red-600 mt-0.5">
                                                Faça o upload do certificado A1 (.pfx) na aba "Configuração".
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Seleção da proposta */}
                                <div>
                                    <Label className="text-sm font-medium">Selecionar Proposta Aceita</Label>
                                    <Select value={selectedProposal} onValueChange={handleSelectProposal}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Escolha uma proposta..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {proposals.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.proposalNumber} — {p.title} {p.client?.name && `(${p.client.name})`}
                                                </SelectItem>
                                            ))}
                                            {proposals.length === 0 && (
                                                <SelectItem value="_none" disabled>Nenhuma proposta aceita</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Natureza de Operação + Finalidade + CFOP */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Natureza de Operação *</Label>
                                        <Select value={naturezaOperacao} onValueChange={setNaturezaOperacao}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(naturezas).length > 0 ? (
                                                    Object.entries(naturezas).map(([key, label]) => (
                                                        <SelectItem key={key} value={label as string}>
                                                            {label as string}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <>
                                                        <SelectItem value="Venda de mercadoria">Venda de mercadoria</SelectItem>
                                                        <SelectItem value="Venda para entrega futura">Venda para entrega futura</SelectItem>
                                                        <SelectItem value="Troca / Devolução em garantia">Troca / Devolução em garantia</SelectItem>
                                                        <SelectItem value="Devolução de mercadoria">Devolução de mercadoria</SelectItem>
                                                        <SelectItem value="Remessa para demonstração">Remessa para demonstração</SelectItem>
                                                        <SelectItem value="Remessa em consignação mercantil">Remessa em consignação mercantil</SelectItem>
                                                        <SelectItem value="Remessa em bonificação, doação ou brinde">Remessa em bonificação</SelectItem>
                                                        <SelectItem value="Transferência de mercadoria">Transferência de mercadoria</SelectItem>
                                                        <SelectItem value="Prestação de serviço">Prestação de serviço</SelectItem>
                                                        <SelectItem value="NF complementar">NF complementar</SelectItem>
                                                        <SelectItem value="Simples faturamento">Simples faturamento</SelectItem>
                                                        <SelectItem value="Outras saídas">Outras saídas</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Finalidade NF-e</Label>
                                        <Select value={String(finalidadeNfe)} onValueChange={(v) => setFinalidadeNfe(Number(v))}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1 — NF-e Normal</SelectItem>
                                                <SelectItem value="2">2 — NF-e Complementar</SelectItem>
                                                <SelectItem value="3">3 — NF-e de Ajuste</SelectItem>
                                                <SelectItem value="4">4 — Devolução de Mercadoria</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">CFOP Principal</Label>
                                        <Input
                                            className="mt-1"
                                            placeholder="Ex: 5102"
                                            value={cfopCode}
                                            onChange={(e) => setCfopCode(e.target.value)}
                                            maxLength={4}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Código fiscal da operação (opcional)</p>
                                    </div>
                                </div>

                                {loadingPreview && (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                                    </div>
                                )}

                                {/* Preview */}
                                {preview && !loadingPreview && (
                                    <div className="space-y-4">
                                        {/* Info da proposta */}
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <p className="text-sm font-semibold text-slate-700">
                                                Proposta {preview.proposal.proposalNumber} — {preview.proposal.title}
                                            </p>
                                            {preview.proposal.client && (
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Cliente: {preview.proposal.client.name} • {preview.proposal.client.document}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Materiais */}
                                            <Card className={`border-2 ${preview.material.canInvoice ? 'border-blue-200' : 'border-slate-200 opacity-60'}`}>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Package className="h-5 w-5 text-blue-600" />
                                                        NF-e — Materiais
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                        {preview.material.items.length === 0 ? (
                                                            <p className="text-sm text-slate-400 italic">Sem itens de material</p>
                                                        ) : preview.material.items.map((item: any, i: number) => (
                                                            <div key={i} className="flex justify-between text-sm">
                                                                <span className="text-slate-600 truncate mr-2">{item.description}</span>
                                                                <span className="font-medium text-slate-800 whitespace-nowrap">R$ {fmt(item.total)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="border-t pt-2 flex justify-between font-semibold">
                                                        <span>Total Material</span>
                                                        <span className="text-blue-700">R$ {fmt(preview.material.total)}</span>
                                                    </div>

                                                    {/* Barra de progresso do faturamento */}
                                                    {preview.material.totalInvoiced > 0 && (
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs text-slate-500">
                                                                <span>Já faturado: R$ {fmt(preview.material.totalInvoiced)}</span>
                                                                <span>Restante: R$ {fmt(Math.max(0, preview.material.remaining))}</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                                                    style={{ width: `${Math.min(100, (preview.material.totalInvoiced / preview.material.total) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {preview.material.alreadyInvoiced && preview.material.remaining > 0 && (
                                                        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 font-medium">
                                                            ℹ️ Já existe NF-e parcial — saldo restante: R$ {fmt(preview.material.remaining)}
                                                        </div>
                                                    )}
                                                    {preview.material.remaining <= 0 && preview.material.alreadyInvoiced && (
                                                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 font-medium">
                                                            ✅ Totalmente faturado
                                                        </div>
                                                    )}

                                                    {/* Valor customizado para emissão parcial */}
                                                    {preview.material.canInvoice && preview.material.items.length > 0 && preview.material.remaining > 0 && (
                                                        <div className="space-y-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                                            <div>
                                                                <Label className="text-xs font-medium text-blue-800">Valor desta NF-e (R$)</Label>
                                                                <Input
                                                                    className="mt-1"
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder={`Máx: ${fmt(preview.material.remaining)}`}
                                                                    value={customValueNfe}
                                                                    onChange={(e) => setCustomValueNfe(e.target.value)}
                                                                />
                                                                <p className="text-[10px] text-blue-500 mt-0.5">Deixe vazio para usar o total (R$ {fmt(preview.material.remaining)})</p>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <Label className="text-[10px] font-medium text-blue-800">Parcela nº</Label>
                                                                    <Input
                                                                        className="mt-0.5"
                                                                        type="number"
                                                                        min="1"
                                                                        placeholder="1"
                                                                        value={installmentNumberNfe}
                                                                        onChange={(e) => setInstallmentNumberNfe(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-[10px] font-medium text-blue-800">de (total)</Label>
                                                                    <Input
                                                                        className="mt-0.5"
                                                                        type="number"
                                                                        min="1"
                                                                        placeholder="3"
                                                                        value={installmentTotalNfe}
                                                                        onChange={(e) => setInstallmentTotalNfe(e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <Button
                                                        className="w-full gap-1.5"
                                                        disabled={
                                                            !preview.material.canInvoice ||
                                                            preview.material.items.length === 0 ||
                                                            preview.material.remaining <= 0 ||
                                                            emitting
                                                        }
                                                        onClick={() => handleEmitInvoice('nfe')}
                                                    >
                                                        {emitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                                                        {preview.material.alreadyInvoiced ? 'Emitir NF-e Parcial' : 'Emitir NF-e'}
                                                    </Button>
                                                    {!preview.material.canInvoice && (
                                                        <p className="text-xs text-slate-400 text-center">Faturamento de material desabilitado</p>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            {/* Serviços */}
                                            <Card className={`border-2 ${preview.service.canInvoice ? 'border-purple-200' : 'border-slate-200 opacity-60'}`}>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Wrench className="h-5 w-5 text-purple-600" />
                                                        NFS-e — Serviços
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                        {preview.service.items.length === 0 ? (
                                                            <p className="text-sm text-slate-400 italic">Sem itens de serviço</p>
                                                        ) : preview.service.items.map((item: any, i: number) => (
                                                            <div key={i} className="flex justify-between text-sm">
                                                                <span className="text-slate-600 truncate mr-2">{item.description}</span>
                                                                <span className="font-medium text-slate-800 whitespace-nowrap">R$ {fmt(item.total)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="border-t pt-2 flex justify-between font-semibold">
                                                        <span>Total Serviço</span>
                                                        <span className="text-purple-700">R$ {fmt(preview.service.total)}</span>
                                                    </div>

                                                    {/* Barra de progresso do faturamento */}
                                                    {preview.service.totalInvoiced > 0 && (
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs text-slate-500">
                                                                <span>Já faturado: R$ {fmt(preview.service.totalInvoiced)}</span>
                                                                <span>Restante: R$ {fmt(Math.max(0, preview.service.remaining))}</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                                <div
                                                                    className="bg-purple-500 h-2 rounded-full transition-all"
                                                                    style={{ width: `${Math.min(100, (preview.service.totalInvoiced / preview.service.total) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {preview.service.alreadyInvoiced && preview.service.remaining > 0 && (
                                                        <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700 font-medium">
                                                            ℹ️ Já existe NFS-e parcial — saldo restante: R$ {fmt(preview.service.remaining)}
                                                        </div>
                                                    )}
                                                    {preview.service.remaining <= 0 && preview.service.alreadyInvoiced && (
                                                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 font-medium">
                                                            ✅ Totalmente faturado
                                                        </div>
                                                    )}

                                                    {/* Valor customizado para emissão parcial */}
                                                    {preview.service.canInvoice && preview.service.items.length > 0 && preview.service.remaining > 0 && (
                                                        <div className="space-y-2 p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                                                            <div>
                                                                <Label className="text-xs font-medium text-purple-800">Valor desta NFS-e (R$)</Label>
                                                                <Input
                                                                    className="mt-1"
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder={`Máx: ${fmt(preview.service.remaining)}`}
                                                                    value={customValueNfse}
                                                                    onChange={(e) => setCustomValueNfse(e.target.value)}
                                                                />
                                                                <p className="text-[10px] text-purple-500 mt-0.5">Deixe vazio para usar o total (R$ {fmt(preview.service.remaining)})</p>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <Label className="text-[10px] font-medium text-purple-800">Parcela nº</Label>
                                                                    <Input
                                                                        className="mt-0.5"
                                                                        type="number"
                                                                        min="1"
                                                                        placeholder="1"
                                                                        value={installmentNumberNfse}
                                                                        onChange={(e) => setInstallmentNumberNfse(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-[10px] font-medium text-purple-800">de (total)</Label>
                                                                    <Input
                                                                        className="mt-0.5"
                                                                        type="number"
                                                                        min="1"
                                                                        placeholder="3"
                                                                        value={installmentTotalNfse}
                                                                        onChange={(e) => setInstallmentTotalNfse(e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <Button
                                                        className="w-full gap-1.5"
                                                        variant="outline"
                                                        disabled={
                                                            !preview.service.canInvoice ||
                                                            preview.service.items.length === 0 ||
                                                            preview.service.remaining <= 0 ||
                                                            emitting
                                                        }
                                                        onClick={() => handleEmitInvoice('nfse')}
                                                    >
                                                        {emitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                                                        {preview.service.alreadyInvoiced ? 'Emitir NFS-e Parcial' : 'Emitir NFS-e'}
                                                    </Button>
                                                    {!preview.service.canInvoice && (
                                                        <p className="text-xs text-slate-400 text-center">Faturamento de serviço desabilitado</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ═══ MODO NOTA AVULSA ═══ */}
                    {emitMode === 'standalone' && (
                        <div className="space-y-4">
                            {/* Tipo de Nota */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-emerald-600" />
                                        Emissão Avulsa — Nota Fiscal sem Proposta
                                    </CardTitle>
                                    <p className="text-sm text-slate-500 mt-1">Preencha os dados do cliente e itens manualmente</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Tipo NF-e ou NFS-e */}
                                    <div>
                                        <Label className="text-sm font-medium">Tipo de Nota *</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Button
                                                variant={avulsaType === 'nfe' ? 'default' : 'outline'}
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => setAvulsaType('nfe')}
                                            >
                                                <Package className="h-4 w-4" />
                                                NF-e (Material)
                                            </Button>
                                            <Button
                                                variant={avulsaType === 'nfse' ? 'default' : 'outline'}
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => setAvulsaType('nfse')}
                                            >
                                                <Wrench className="h-4 w-4" />
                                                NFS-e (Serviço)
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Cliente */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        Dados do Cliente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Search */}
                                    <div className="relative">
                                        <Label className="text-sm font-medium">Buscar Cliente Cadastrado</Label>
                                        <div className="relative mt-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Digite nome, CPF/CNPJ ou e-mail..."
                                                value={clientSearch}
                                                onChange={(e) => handleSearchClients(e.target.value)}
                                                className="pl-10"
                                            />
                                            {searchingClients && (
                                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                                            )}
                                        </div>
                                        {/* Results dropdown */}
                                        {clientResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {clientResults.map((c: any) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b last:border-b-0 transition-colors"
                                                        onClick={() => handleSelectClient(c)}
                                                    >
                                                        <p className="font-medium text-sm text-slate-800">{c.companyName || c.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {c.document && `${c.type === 'company' ? 'CNPJ' : 'CPF'}: ${c.document}`}
                                                            {c.email && ` • ${c.email}`}
                                                            {c.city && ` • ${c.city}/${c.state}`}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected client badge */}
                                    {selectedClient && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm text-emerald-800">
                                                    ✅ {selectedClient.companyName || selectedClient.name}
                                                </p>
                                                <p className="text-xs text-emerald-600">
                                                    {selectedClient.document}{selectedClient.email && ` • ${selectedClient.email}`}
                                                    {selectedClient.city && ` • ${selectedClient.city}/${selectedClient.state}`}
                                                </p>
                                                {(selectedClient.address || selectedClient.neighborhood) && (
                                                    <p className="text-xs text-emerald-600 mt-0.5">
                                                        {selectedClient.address}{selectedClient.number && `, ${selectedClient.number}`}
                                                        {selectedClient.complement && ` - ${selectedClient.complement}`}
                                                        {selectedClient.neighborhood && ` • ${selectedClient.neighborhood}`}
                                                        {selectedClient.zipCode && ` • CEP: ${selectedClient.zipCode}`}
                                                    </p>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setClientSearch(''); }}>
                                                <Ban className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* New client toggle */}
                                    {!selectedClient && (
                                        <div className="flex items-center justify-between border-t pt-3">
                                            <p className="text-sm text-slate-500">Cliente não cadastrado?</p>
                                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowNewClient(!showNewClient)}>
                                                <Plus className="h-4 w-4" />
                                                {showNewClient ? 'Fechar Cadastro' : 'Cadastrar Novo'}
                                            </Button>
                                        </div>
                                    )}

                                    {/* New client form */}
                                    {showNewClient && !selectedClient && (
                                        <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3">
                                            <p className="font-medium text-sm text-blue-800">Cadastro Rápido de Cliente</p>
                                            <div className="flex gap-2 mb-2">
                                                <Button
                                                    variant={newClient.type === 'company' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setNewClient({ ...newClient, type: 'company' })}
                                                >
                                                    PJ — Empresa
                                                </Button>
                                                <Button
                                                    variant={newClient.type === 'individual' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setNewClient({ ...newClient, type: 'individual' })}
                                                >
                                                    PF — Pessoa Física
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {newClient.type === 'company' && (
                                                    <div>
                                                        <Label className="text-xs">Razão Social *</Label>
                                                        <Input className="mt-0.5" placeholder="Empresa LTDA" value={newClient.companyName}
                                                            onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })} />
                                                    </div>
                                                )}
                                                <div>
                                                    <Label className="text-xs">{newClient.type === 'company' ? 'Nome Fantasia' : 'Nome Completo *'}</Label>
                                                    <Input className="mt-0.5" placeholder="Nome" value={newClient.name}
                                                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">{newClient.type === 'company' ? 'CNPJ *' : 'CPF *'}</Label>
                                                    <Input className="mt-0.5" placeholder={newClient.type === 'company' ? '00.000.000/0000-00' : '000.000.000-00'}
                                                        value={newClient.document}
                                                        onChange={(e) => setNewClient({ ...newClient, document: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">E-mail</Label>
                                                    <Input className="mt-0.5" type="email" placeholder="email@exemplo.com" value={newClient.email}
                                                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Telefone</Label>
                                                    <Input className="mt-0.5" placeholder="(00) 0000-0000" value={newClient.phone}
                                                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label className="text-xs">Endereço</Label>
                                                    <Input className="mt-0.5" placeholder="Rua, Av..." value={newClient.address}
                                                        onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Número</Label>
                                                    <Input className="mt-0.5" placeholder="123" value={newClient.number}
                                                        onChange={(e) => setNewClient({ ...newClient, number: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Complemento</Label>
                                                    <Input className="mt-0.5" placeholder="Sala, Andar..." value={newClient.complement}
                                                        onChange={(e) => setNewClient({ ...newClient, complement: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Bairro</Label>
                                                    <Input className="mt-0.5" placeholder="Bairro" value={newClient.neighborhood}
                                                        onChange={(e) => setNewClient({ ...newClient, neighborhood: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Cidade</Label>
                                                    <Input className="mt-0.5" placeholder="Cidade" value={newClient.city}
                                                        onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">UF</Label>
                                                    <Input className="mt-0.5" placeholder="SP" maxLength={2} value={newClient.state}
                                                        onChange={(e) => setNewClient({ ...newClient, state: e.target.value.toUpperCase() })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">CEP</Label>
                                                    <Input className="mt-0.5" placeholder="00000-000" value={newClient.zipCode}
                                                        onChange={(e) => setNewClient({ ...newClient, zipCode: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Código IBGE</Label>
                                                    <Input className="mt-0.5" placeholder="3550308" maxLength={7} value={newClient.ibgeCode}
                                                        onChange={(e) => setNewClient({ ...newClient, ibgeCode: e.target.value })} />
                                                    <p className="text-[10px] text-slate-400 mt-0.5">7 dígitos — código do município</p>
                                                </div>
                                            </div>
                                            <Button className="w-full gap-1.5" onClick={handleSaveNewClient} disabled={savingNewClient}>
                                                {savingNewClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                Salvar e Selecionar Cliente
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Itens */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {avulsaType === 'nfe'
                                                ? <><Package className="h-5 w-5 text-blue-600" /> Itens — Materiais</>
                                                : <><Wrench className="h-5 w-5 text-purple-600" /> Itens — Serviços</>}
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => setAvulsaItems([...avulsaItems, { description: '', unit: 'UN', quantity: 1, unitPrice: 0 }])}
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Adicionar Item
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {avulsaItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-lg border">
                                            <div className="col-span-12 md:col-span-5">
                                                <Label className="text-xs">Descrição *</Label>
                                                <Input
                                                    className="mt-0.5"
                                                    placeholder={avulsaType === 'nfe' ? 'Nome do produto...' : 'Descrição do serviço...'}
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const arr = [...avulsaItems];
                                                        arr[idx].description = e.target.value;
                                                        setAvulsaItems(arr);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-2">
                                                <Label className="text-xs">Unidade</Label>
                                                <Input
                                                    className="mt-0.5"
                                                    placeholder="UN"
                                                    value={item.unit}
                                                    onChange={(e) => {
                                                        const arr = [...avulsaItems];
                                                        arr[idx].unit = e.target.value;
                                                        setAvulsaItems(arr);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-1">
                                                <Label className="text-xs">Qtd *</Label>
                                                <Input
                                                    className="mt-0.5"
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const arr = [...avulsaItems];
                                                        arr[idx].quantity = Number(e.target.value);
                                                        setAvulsaItems(arr);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-2">
                                                <Label className="text-xs">Preço Unit. (R$) *</Label>
                                                <Input
                                                    className="mt-0.5"
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unitPrice || ''}
                                                    onChange={(e) => {
                                                        const arr = [...avulsaItems];
                                                        arr[idx].unitPrice = Number(e.target.value);
                                                        setAvulsaItems(arr);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-1 flex items-end gap-1">
                                                <p className="text-sm font-medium text-slate-700 mb-2 whitespace-nowrap">
                                                    R$ {fmt(item.quantity * item.unitPrice)}
                                                </p>
                                            </div>
                                            <div className="col-span-6 md:col-span-1 flex justify-end">
                                                {avulsaItems.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => setAvulsaItems(avulsaItems.filter((_, i) => i !== idx))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            {/* NF-e: NCM + CFOP por item */}
                                            {avulsaType === 'nfe' && (
                                                <div className="col-span-12 grid grid-cols-2 gap-2 mt-1">
                                                    <div>
                                                        <Label className="text-xs text-blue-700">NCM (8 dígitos)</Label>
                                                        <Input
                                                            className="mt-0.5"
                                                            placeholder="00000000"
                                                            maxLength={8}
                                                            value={item.ncm || ''}
                                                            onChange={(e) => {
                                                                const arr = [...avulsaItems];
                                                                arr[idx].ncm = e.target.value.replace(/\D/g, '');
                                                                setAvulsaItems(arr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-blue-700">CFOP (4 dígitos)</Label>
                                                        <Input
                                                            className="mt-0.5"
                                                            placeholder="5102"
                                                            maxLength={4}
                                                            value={item.cfopInterno || ''}
                                                            onChange={(e) => {
                                                                const arr = [...avulsaItems];
                                                                arr[idx].cfopInterno = e.target.value.replace(/\D/g, '');
                                                                setAvulsaItems(arr);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="border-t pt-3 flex justify-between items-center">
                                        <span className="font-semibold text-slate-700">Total</span>
                                        <span className={`text-xl font-bold ${avulsaType === 'nfe' ? 'text-blue-700' : 'text-purple-700'}`}>
                                            R$ {fmt(avulsaItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0))}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Detalhes NFS-e */}
                            {avulsaType === 'nfse' && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Wrench className="h-5 w-5 text-purple-600" />
                                            Detalhes do Serviço (NFS-e)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium">Data de Competência *</Label>
                                                <Input
                                                    className="mt-1"
                                                    type="date"
                                                    value={avulsaDCompet}
                                                    onChange={(e) => setAvulsaDCompet(e.target.value)}
                                                />
                                                <p className="text-[10px] text-slate-400 mt-0.5">Data de competência da prestação do serviço</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Município de Prestação (IBGE)</Label>
                                                <Input
                                                    className="mt-1"
                                                    placeholder="2611606"
                                                    maxLength={7}
                                                    value={avulsaMunicipioIbge}
                                                    onChange={(e) => setAvulsaMunicipioIbge(e.target.value.replace(/\D/g, ''))}
                                                />
                                                <p className="text-[10px] text-slate-400 mt-0.5">Código IBGE do local da prestação (deixe vazio para usar o do emitente)</p>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Descrição Detalhada do Serviço</Label>
                                            <textarea
                                                className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                placeholder="Descrição completa dos serviços prestados (até 2000 caracteres)..."
                                                maxLength={2000}
                                                value={avulsaDescricaoServico}
                                                onChange={(e) => setAvulsaDescricaoServico(e.target.value)}
                                            />
                                            <div className="flex justify-between mt-0.5">
                                                <p className="text-[10px] text-slate-400">Se vazio, será gerado automaticamente a partir dos itens</p>
                                                <p className="text-[10px] text-slate-400">{avulsaDescricaoServico.length}/2000</p>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Informações Complementares</Label>
                                            <textarea
                                                className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                placeholder="Informações adicionais (observações, referências, etc.)..."
                                                value={avulsaInfoComplementares}
                                                onChange={(e) => setAvulsaInfoComplementares(e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Opções Fiscais */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-amber-600" />
                                        Opções Fiscais
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium">Natureza de Operação *</Label>
                                            <Select value={avulsaNatureza} onValueChange={setAvulsaNatureza}>
                                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(naturezas).length > 0 ? (
                                                        Object.entries(naturezas).map(([key, label]) => (
                                                            <SelectItem key={key} value={label as string}>{label as string}</SelectItem>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <SelectItem value="Venda de mercadoria">Venda de mercadoria</SelectItem>
                                                            <SelectItem value="Prestação de serviço">Prestação de serviço</SelectItem>
                                                            <SelectItem value="Venda para entrega futura">Venda para entrega futura</SelectItem>
                                                            <SelectItem value="Simples faturamento">Simples faturamento</SelectItem>
                                                            <SelectItem value="Outras saídas">Outras saídas</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {avulsaType === 'nfe' && (
                                            <>
                                                <div>
                                                    <Label className="text-sm font-medium">Finalidade NF-e</Label>
                                                    <Select value={String(avulsaFinalidade)} onValueChange={(v) => setAvulsaFinalidade(Number(v))}>
                                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1">1 — NF-e Normal</SelectItem>
                                                            <SelectItem value="2">2 — NF-e Complementar</SelectItem>
                                                            <SelectItem value="3">3 — NF-e de Ajuste</SelectItem>
                                                            <SelectItem value="4">4 — Devolução de Mercadoria</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium">CFOP Principal</Label>
                                                    <Input
                                                        className="mt-1" placeholder="Ex: 5102" maxLength={4}
                                                        value={avulsaCfop} onChange={(e) => setAvulsaCfop(e.target.value)}
                                                    />
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Código fiscal da operação (opcional)</p>
                                                </div>
                                            </>
                                        )}
                                        {/* Campos opcionais para ambos os tipos */}
                                        <div>
                                            <Label className="text-sm font-medium">Nº Pedido / Ordem</Label>
                                            <Input
                                                className="mt-1" placeholder="Ex: PED-2024-001"
                                                value={avulsaNumPedido} onChange={(e) => setAvulsaNumPedido(e.target.value)}
                                            />
                                            <p className="text-[10px] text-slate-400 mt-0.5">Número do pedido ou ordem de compra (opcional)</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Doc. Referência</Label>
                                            <Input
                                                className="mt-1" placeholder="Ex: Contrato nº 123"
                                                value={avulsaDocReferencia} onChange={(e) => setAvulsaDocReferencia(e.target.value)}
                                            />
                                            <p className="text-[10px] text-slate-400 mt-0.5">Documento de referência (opcional)</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Error Display */}
                            {avulsaErrors && (
                                <Card className="border-red-300 bg-red-50">
                                    <CardContent className="pt-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-red-800">
                                                    {avulsaErrors.message}
                                                </p>
                                                {avulsaErrors.fields.length > 0 && (
                                                    <ul className="mt-2 space-y-1">
                                                        {avulsaErrors.fields.map((f, idx) => (
                                                            <li key={idx} className="text-sm text-red-700">
                                                                <span className="font-medium">{idx + 1}. {f.campo}</span>
                                                                <span className="text-red-500"> — {f.local}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
                                            onClick={() => setAvulsaErrors(null)}
                                        >
                                            Corrigir e tentar novamente
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Emitir Button */}
                            <Button
                                className="w-full gap-2 h-12 text-base"
                                disabled={emittingAvulsa || !selectedClient || avulsaItems.filter(i => i.description.trim()).length === 0}
                                onClick={handleEmitAvulsa}
                            >
                                {emittingAvulsa
                                    ? <Loader2 className="h-5 w-5 animate-spin" />
                                    : <Receipt className="h-5 w-5" />}
                                {emittingAvulsa
                                    ? 'Emitindo...'
                                    : `Emitir ${avulsaType === 'nfe' ? 'NF-e' : 'NFS-e'} Avulsa — R$ ${fmt(avulsaItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}`}
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* ═══ ABA: CONFIGURAÇÃO ═══ */}
                <TabsContent value="config" className="space-y-4">
                    {/* Certificado Digital */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-amber-600" />
                                Certificado Digital A1
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {config?.certificateFile ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-6 w-6 text-emerald-500" />
                                            <div>
                                                <p className="font-medium text-emerald-800">Certificado ativo</p>
                                                <p className="text-sm text-emerald-600">
                                                    {config.certificateOriginalName}
                                                    {config.certificateExpiresAt && (
                                                        <> • Valido até {new Date(config.certificateExpiresAt).toLocaleDateString('pt-BR')}</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleRemoveCert}>
                                            <Trash2 className="h-4 w-4 mr-1" /> Remover
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
                                    <div className="text-center space-y-3">
                                        <Shield className="h-10 w-10 text-slate-300 mx-auto" />
                                        <p className="text-sm text-slate-500">Envie seu certificado digital A1 (.pfx ou .p12)</p>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm">Arquivo do Certificado</Label>
                                            <div className="mt-1 flex items-center gap-2">
                                                <input
                                                    id="cert-file-input"
                                                    type="file"
                                                    accept=".pfx,.p12"
                                                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => document.getElementById('cert-file-input')?.click()}
                                                    className="gap-1.5 whitespace-nowrap"
                                                >
                                                    <FileCode className="h-4 w-4" />
                                                    Escolher Arquivo
                                                </Button>
                                                <span className="text-sm text-slate-500 truncate">
                                                    {certFile ? certFile.name : 'Nenhum arquivo selecionado'}
                                                </span>
                                                {certFile && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            setCertFile(null);
                                                            const input = document.getElementById('cert-file-input') as HTMLInputElement;
                                                            if (input) input.value = '';
                                                        }}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm">Senha do Certificado</Label>
                                            <Input
                                                type="password"
                                                placeholder="Informe a senha"
                                                value={certPassword}
                                                onChange={(e) => setCertPassword(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="mt-3 gap-1.5"
                                        onClick={handleUploadCert}
                                        disabled={!certFile || !certPassword || uploadingCert}
                                    >
                                        {uploadingCert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        Enviar Certificado
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dados da Empresa */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-amber-600" />
                                Dados Fiscais da Empresa
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm">Razão Social</Label>
                                    <Input value={configForm.companyName} onChange={(e) => setConfigForm({ ...configForm, companyName: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm">CNPJ</Label>
                                    <Input value={configForm.cnpj} onChange={(e) => setConfigForm({ ...configForm, cnpj: e.target.value })} onBlur={handleCnpjLookup} className="mt-1" placeholder="00.000.000/0000-00" />
                                    <p className="text-[10px] text-blue-500 mt-0.5">Ao sair do campo, busca automática dos dados da empresa</p>
                                </div>
                                <div>
                                    <Label className="text-sm">Inscrição Estadual</Label>
                                    <Input value={configForm.stateRegistration} onChange={(e) => setConfigForm({ ...configForm, stateRegistration: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm">Inscrição Municipal</Label>
                                    <Input value={configForm.municipalRegistration} onChange={(e) => setConfigForm({ ...configForm, municipalRegistration: e.target.value })} className="mt-1" />
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="text-sm">Endereço</Label>
                                    <Input value={configForm.companyAddress} onChange={(e) => setConfigForm({ ...configForm, companyAddress: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm">Cidade</Label>
                                    <Input value={configForm.companyCity} onChange={(e) => setConfigForm({ ...configForm, companyCity: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm">UF</Label>
                                    <Input value={configForm.companyState} onChange={(e) => setConfigForm({ ...configForm, companyState: e.target.value })} className="mt-1" maxLength={2} placeholder="SP" />
                                </div>
                                <div>
                                    <Label className="text-sm">CEP</Label>
                                    <Input value={configForm.companyCep} onChange={(e) => setConfigForm({ ...configForm, companyCep: e.target.value })} onBlur={handleCepLookup} className="mt-1" placeholder="00000-000" />
                                    <p className="text-[10px] text-blue-500 mt-0.5">Ao sair do campo, busca automática do endereço</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configuração Tributária */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-green-600" />
                                Configuração Tributária
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Regime Tributário */}
                            <div>
                                <h4 className="font-medium text-sm text-slate-700 mb-3">Regime Tributário</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm">Regime</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                                            value={configForm.regimeTributario || '1'}
                                            onChange={(e) => setConfigForm({ ...configForm, regimeTributario: e.target.value })}
                                        >
                                            <option value="1">Simples Nacional</option>
                                            <option value="2">Simples Nacional - Exc. Sublimite</option>
                                            <option value="3">Lucro Presumido</option>
                                            <option value="4">Lucro Real</option>
                                        </select>
                                    </div>
                                    {(configForm.regimeTributario === '1' || configForm.regimeTributario === '2') && (
                                        <div>
                                            <Label className="text-sm">Anexo do Simples</Label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                                                value={configForm.simplesAnexo || ''}
                                                onChange={(e) => setConfigForm({ ...configForm, simplesAnexo: e.target.value })}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="I">Anexo I — Comércio</option>
                                                <option value="II">Anexo II — Indústria</option>
                                                <option value="III">Anexo III — Serviços (ISS)</option>
                                                <option value="IV">Anexo IV — Construção / Vigilância</option>
                                                <option value="V">Anexo V — Serviços (intelectuais)</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <Label className="text-sm">CRT (Código Regime Trib.)</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                                            value={configForm.crt || 1}
                                            onChange={(e) => setConfigForm({ ...configForm, crt: Number(e.target.value) })}
                                        >
                                            <option value={1}>1 — Simples Nacional</option>
                                            <option value={2}>2 — Simples Excesso Sublimite</option>
                                            <option value={3}>3 — Regime Normal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Impostos NFS-e */}
                            <div>
                                <h4 className="font-medium text-sm text-slate-700 mb-3">Impostos sobre Serviço (NFS-e)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm">Alíquota ISS (%)</Label>
                                        <Input
                                            type="number" step="0.01" min="0" max="10"
                                            value={configForm.aliquotaIss ?? 5}
                                            onChange={(e) => setConfigForm({ ...configForm, aliquotaIss: Number(e.target.value) })}
                                            className="mt-1"
                                            placeholder="5.00"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">Código Serviço (LC 116)</Label>
                                        <Input
                                            value={configForm.codigoServico || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, codigoServico: e.target.value })}
                                            className="mt-1"
                                            placeholder="14.01"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">Código Trib. Nacional</Label>
                                        <Input
                                            value={configForm.codigoTribNacional || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, codigoTribNacional: e.target.value })}
                                            className="mt-1"
                                            placeholder="01.01.01"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">CNAE Principal</Label>
                                        <Input
                                            value={configForm.cnae || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, cnae: e.target.value })}
                                            className="mt-1"
                                            placeholder="4321500"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">Cód. Município (IBGE)</Label>
                                        <Input
                                            value={configForm.codigoMunicipio || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, codigoMunicipio: e.target.value })}
                                            className="mt-1"
                                            placeholder="2611606"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Preenchido ao buscar CEP</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm">CNO (Cód. Nacional de Obra)</Label>
                                        <Input
                                            value={configForm.cno || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, cno: e.target.value })}
                                            className="mt-1"
                                            placeholder="CNO da obra (construção civil)"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Obrigatório para serviços de construção civil</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm">Regime Especial de Tributação</Label>
                                        <select
                                            value={configForm.regEspTrib || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, regEspTrib: e.target.value })}
                                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="">Nenhum</option>
                                            <option value="1">1 - ME/EPP Simples Nacional</option>
                                            <option value="2">2 - Estimativa</option>
                                            <option value="3">3 - Sociedade de Profissionais</option>
                                            <option value="4">4 - Cooperativa</option>
                                            <option value="5">5 - MEI</option>
                                            <option value="6">6 - ME/EPP ISSQN fixo</option>
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Aplicável para NFS-e</p>
                                    </div>
                                </div>
                            </div>

                            {/* Retenções */}
                            <div>
                                <h4 className="font-medium text-sm text-slate-700 mb-3">Retenções de Impostos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { key: 'retIss', label: 'ISS', aliqKey: 'aliquotaIss', aliq: configForm.aliquotaIss ?? 5 },
                                        { key: 'retIrpj', label: 'IRPJ', aliqKey: 'aliquotaIrpj', aliq: configForm.aliquotaIrpj ?? 1.5 },
                                        { key: 'retCsll', label: 'CSLL', aliqKey: 'aliquotaCsll', aliq: configForm.aliquotaCsll ?? 1.0 },
                                        { key: 'retPis', label: 'PIS', aliqKey: 'aliquotaPis', aliq: configForm.aliquotaPis ?? 0.65 },
                                        { key: 'retCofins', label: 'COFINS', aliqKey: 'aliquotaCofins', aliq: configForm.aliquotaCofins ?? 3.0 },
                                        { key: 'retInss', label: 'INSS', aliqKey: 'aliquotaInss', aliq: configForm.aliquotaInss ?? 11.0 },
                                    ].map(({ key, label, aliqKey, aliq }) => (
                                        <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                                            <Switch
                                                checked={!!configForm[key as keyof typeof configForm]}
                                                onCheckedChange={(v) => setConfigForm({ ...configForm, [key]: v })}
                                            />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium">{label}</span>
                                                {key !== 'retIss' && (
                                                    <Input
                                                        type="number" step="0.01" min="0" max="100"
                                                        value={aliq}
                                                        onChange={(e) => setConfigForm({ ...configForm, [aliqKey]: e.target.value })}
                                                        className="mt-1 h-7 text-xs"
                                                        placeholder="%"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissões de Faturamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-amber-600" />
                                Permissões de Faturamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-slate-800">NF-e — Materiais</p>
                                        <p className="text-xs text-slate-500">Habilita emissão de nota fiscal para itens de material</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={configForm.canInvoiceMaterial}
                                    onCheckedChange={(v) => setConfigForm({ ...configForm, canInvoiceMaterial: v })}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Wrench className="h-5 w-5 text-purple-600" />
                                    <div>
                                        <p className="font-medium text-slate-800">NFS-e — Serviços</p>
                                        <p className="text-xs text-slate-500">Habilita emissão de nota fiscal para itens de serviço</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={configForm.canInvoiceService}
                                    onCheckedChange={(v) => setConfigForm({ ...configForm, canInvoiceService: v })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Nuvem Fiscal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="h-5 w-5 text-amber-600" />
                                Integração Nuvem Fiscal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                                <p className="font-medium">A Nuvem Fiscal emite NF-e e NFS-e automaticamente junto ao SEFAZ/Prefeitura.</p>
                                <p className="mt-1 text-xs text-blue-500">Crie sua conta gratuita em console.nuvemfiscal.com.br e coloque as credenciais abaixo.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm">Client ID</Label>
                                    <Input
                                        value={configForm.fiscalApiClientId}
                                        onChange={(e) => setConfigForm({ ...configForm, fiscalApiClientId: e.target.value })}
                                        className="mt-1"
                                        placeholder="Ex: Pjp7R82z0BoY8IPKLdV8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm">Client Secret</Label>
                                    <Input
                                        type="password"
                                        value={configForm.fiscalApiClientSecret}
                                        onChange={(e) => setConfigForm({ ...configForm, fiscalApiClientSecret: e.target.value })}
                                        className="mt-1"
                                        placeholder="Sua chave secreta"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm">Ambiente</Label>
                                    <Select
                                        value={configForm.fiscalApiEnvironment}
                                        onValueChange={(v) => setConfigForm({ ...configForm, fiscalApiEnvironment: v })}
                                    >
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                                            <SelectItem value="production">Produção</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTestConnection}
                                    disabled={testingConnection || !configForm.fiscalApiClientId}
                                    className="gap-1.5"
                                >
                                    {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                                    Testar Conexão
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSyncCompany}
                                    disabled={syncing || !configForm.fiscalApiClientId || !configForm.cnpj}
                                    className="gap-1.5"
                                >
                                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    Sincronizar Empresa
                                </Button>
                            </div>
                            {connectionResult && (
                                <div className={`p-3 rounded-lg border text-sm ${connectionResult.success
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-red-50 border-red-200 text-red-700'
                                    }`}>
                                    <p className="font-medium">{connectionResult.message}</p>
                                    {connectionResult.cotas && (
                                        <div className="mt-2 text-xs space-y-1">
                                            {(Array.isArray(connectionResult.cotas) ? connectionResult.cotas : []).map((c: any, i: number) => (
                                                <p key={i}>{c.nome}: {c.consumo}/{c.limite} usado</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSaveConfig} disabled={savingConfig} className="gap-1.5 px-6">
                            {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Salvar Configuração
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ═══ DIALOG: CANCELAR NF ═══ */}
            <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" /> Cancelar Nota Fiscal
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Label className="text-sm">Motivo do Cancelamento</Label>
                        <Input
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Informe o motivo..."
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCancelDialog(false)}>Voltar</Button>
                            <Button variant="destructive" onClick={handleCancel} className="gap-1.5">
                                <XCircle className="h-4 w-4" /> Confirmar Cancelamento
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ DIALOG: DETALHES DA NF ═══ */}
            <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-amber-600" />
                            Detalhes da Nota Fiscal
                        </DialogTitle>
                    </DialogHeader>
                    {detailInvoice && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-slate-400">Tipo</p>
                                    <p className="font-medium">{detailInvoice.type === 'nfe' ? 'NF-e (Material)' : 'NFS-e (Serviço)'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Status</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_CONFIG[detailInvoice.status]?.color}`}>
                                        {STATUS_CONFIG[detailInvoice.status]?.label}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-slate-400">Número</p>
                                    <p className="font-medium">{detailInvoice.invoiceNumber || 'Pendente'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Valor Total</p>
                                    <p className="font-bold text-lg">R$ {fmt(detailInvoice.totalValue)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Destinatário</p>
                                    <p className="font-medium">{detailInvoice.recipientName}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Documento</p>
                                    <p className="font-medium">{detailInvoice.recipientDocument || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-400">Data de Emissão</p>
                                    <p className="font-medium">
                                        {detailInvoice.issueDate ? new Date(detailInvoice.issueDate).toLocaleString('pt-BR') : '—'}
                                    </p>
                                </div>
                            </div>

                            {detailInvoice.items && detailInvoice.items.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Itens Faturados</p>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="text-left px-3 py-2 font-medium text-slate-600">Descrição</th>
                                                    <th className="text-right px-3 py-2 font-medium text-slate-600">Qtd</th>
                                                    <th className="text-right px-3 py-2 font-medium text-slate-600">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailInvoice.items.map((item: any, i: number) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="px-3 py-2 text-slate-700">{item.description}</td>
                                                        <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                                                        <td className="px-3 py-2 text-right font-medium">R$ {fmt(item.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {detailInvoice.errorMessage && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-medium text-red-700">Erro:</p>
                                    <p className="text-sm text-red-600">{detailInvoice.errorMessage}</p>
                                </div>
                            )}

                            {detailInvoice.cancellationReason && (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <p className="text-sm font-medium text-slate-700">Motivo do Cancelamento:</p>
                                    <p className="text-sm text-slate-600">{detailInvoice.cancellationReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ DIALOG: EDITAR VALOR ═══ */}
            {/* Relatório de Validação - Campos Faltantes */}
            <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-700">
                            <AlertTriangle className="h-5 w-5" />
                            Campos Obrigatórios Não Preenchidos
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        <p className="text-sm text-slate-600">
                            Para emitir a nota fiscal, preencha os seguintes campos:
                        </p>
                        {(() => {
                            // Agrupar por local
                            const grouped: Record<string, string[]> = {};
                            validationErrors.forEach(e => {
                                if (!grouped[e.local]) grouped[e.local] = [];
                                grouped[e.local].push(e.campo);
                            });
                            return Object.entries(grouped).map(([local, campos]) => (
                                <div key={local} className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                                        📍 {local}
                                    </p>
                                    <ul className="space-y-1">
                                        {campos.map((campo, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-amber-900">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                                {campo}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ));
                        })()}
                        <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-500">
                                Total de {validationErrors.length} campo(s) pendente(s). Preencha todos os campos acima e tente novamente.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setValidationDialogOpen(false)}>
                            Entendi
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={editValueDialog} onOpenChange={setEditValueDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit3 className="h-5 w-5 text-amber-600" />
                            Editar Valor da Nota Fiscal
                        </DialogTitle>
                    </DialogHeader>
                    {editInvoice && (
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600">
                                    {editInvoice.type === 'nfe' ? 'NF-e' : 'NFS-e'}
                                    {editInvoice.invoiceNumber && ` #${editInvoice.invoiceNumber}`}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Valor atual: <span className="font-semibold text-slate-700">R$ {fmt(editInvoice.totalValue)}</span>
                                </p>
                                {editInvoice.originalValue && editInvoice.originalValue !== editInvoice.totalValue && (
                                    <p className="text-xs text-slate-400">
                                        Valor original: R$ {fmt(editInvoice.originalValue)}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Novo Valor (R$)</Label>
                                <Input
                                    className="mt-1"
                                    type="number"
                                    step="0.01"
                                    value={editNewValue}
                                    onChange={(e) => setEditNewValue(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Motivo da Alteração *</Label>
                                <Input
                                    className="mt-1"
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    placeholder="Ex: Desconto negociado, erro de cálculo..."
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">Obrigatório — ficará registrado no histórico</p>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setEditValueDialog(false)}>Cancelar</Button>
                                <Button
                                    onClick={handleEditValueSubmit}
                                    disabled={savingEdit || !editNewValue || !editReason.trim()}
                                >
                                    {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                    Salvar Alteração
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ DIALOG: HISTÓRICO DE EDIÇÕES ═══ */}
            <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-blue-600" />
                            Histórico de Edições
                            {historyInvoice && (
                                <span className="text-sm font-normal text-slate-500 ml-1">
                                    — {historyInvoice.type === 'nfe' ? 'NF-e' : 'NFS-e'}
                                    {historyInvoice.invoiceNumber && ` #${historyInvoice.invoiceNumber}`}
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {loadingHistory ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : historyData.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <History className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm">Nenhuma edição registrada para esta nota</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {historyData.map((edit: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">
                                                R$ {fmt(edit.previousValue)} → R$ {fmt(edit.newValue)}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {edit.reason || edit.userName || '—'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">
                                                {edit.createdAt ? new Date(edit.createdAt).toLocaleDateString('pt-BR') : ''}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {edit.createdAt ? new Date(edit.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {edit.userName && edit.reason && (
                                        <p className="text-[10px] text-slate-400 mt-1">por {edit.userName}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ DIALOG: DADOS DO CLIENTE PARA EMISSÃO ═══ */}
            <Dialog open={clientDialog} onOpenChange={setClientDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-700">
                            <User className="h-5 w-5" />
                            Dados do Cliente / Tomador
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        <p className="text-sm text-slate-500">
                            Confirme ou preencha os dados do destinatário da nota fiscal.
                        </p>

                        {/* Tipo Pessoa */}
                        <div className="flex gap-2">
                            <Button
                                variant={clientForm.tipoPessoa === 'PJ' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setClientForm(f => ({ ...f, tipoPessoa: 'PJ' }))}
                                className="flex-1"
                            >
                                <Building2 className="h-4 w-4 mr-1" /> Pessoa Jurídica
                            </Button>
                            <Button
                                variant={clientForm.tipoPessoa === 'PF' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setClientForm(f => ({ ...f, tipoPessoa: 'PF' }))}
                                className="flex-1"
                            >
                                <User className="h-4 w-4 mr-1" /> Pessoa Física
                            </Button>
                        </div>

                        {/* Nome */}
                        <div>
                            <Label className="text-xs text-slate-600">
                                {clientForm.tipoPessoa === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}
                            </Label>
                            <Input
                                value={clientForm.name}
                                onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))}
                                placeholder={clientForm.tipoPessoa === 'PJ' ? 'Empresa Exemplo LTDA' : 'João da Silva'}
                            />
                        </div>

                        {/* Documento */}
                        <div>
                            <Label className="text-xs text-slate-600">
                                {clientForm.tipoPessoa === 'PJ' ? 'CNPJ *' : 'CPF *'}
                            </Label>
                            <Input
                                value={clientForm.document}
                                onChange={e => setClientForm(f => ({ ...f, document: e.target.value }))}
                                placeholder={clientForm.tipoPessoa === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                            />
                        </div>

                        {/* Endereço */}
                        <div>
                            <Label className="text-xs text-slate-600">Endereço</Label>
                            <Input
                                value={clientForm.address}
                                onChange={e => setClientForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="Rua, número, complemento"
                            />
                        </div>

                        {/* Cidade + UF */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <Label className="text-xs text-slate-600">Cidade</Label>
                                <Input
                                    value={clientForm.city}
                                    onChange={e => setClientForm(f => ({ ...f, city: e.target.value }))}
                                    placeholder="São Paulo"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600">UF</Label>
                                <Input
                                    value={clientForm.state}
                                    onChange={e => setClientForm(f => ({ ...f, state: e.target.value }))}
                                    placeholder="SP"
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        {/* CEP + Código IBGE */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-slate-600">CEP</Label>
                                <Input
                                    value={clientForm.zipCode}
                                    onChange={e => setClientForm(f => ({ ...f, zipCode: e.target.value }))}
                                    placeholder="00000-000"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600">Cód. IBGE Município</Label>
                                <Input
                                    value={clientForm.ibgeCode}
                                    onChange={e => setClientForm(f => ({ ...f, ibgeCode: e.target.value }))}
                                    placeholder="3550308"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <Label className="text-xs text-slate-600">Email</Label>
                            <Input
                                value={clientForm.email}
                                onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="cliente@email.com"
                                type="email"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-2">
                        <Button variant="outline" onClick={() => setClientDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmEmit} disabled={emitting}>
                            {emitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                            Confirmar e Emitir {emitType === 'nfe' ? 'NF-e' : 'NFS-e'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

    );
}
