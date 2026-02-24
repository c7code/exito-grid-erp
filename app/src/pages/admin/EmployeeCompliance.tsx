import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    ArrowLeft, ShieldCheck, ShieldAlert, Clock, AlertTriangle,
    CheckCircle2, XCircle, Upload, Download, History, Eye,
    FileText, Search, RefreshCw, ChevronDown, ChevronRight,
    ThumbsUp, ThumbsDown, HelpCircle, Loader2, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
interface DocumentType {
    id: string;
    name: string;
    code: string;
    category: string;
    nrsRelated: string[];
    defaultValidityMonths: number | null;
    requiresApproval: boolean;
    isMandatory: boolean;
    allowsNotApplicable: boolean;
    requiresJustification: boolean;
}

interface Requirement {
    id: string;
    employeeId: string;
    documentTypeId: string;
    applicability: 'applicable' | 'not_applicable' | 'pending_review';
    justification: string | null;
    documentType: DocumentType;
}

interface ComplianceDoc {
    id: string;
    requirementId: string;
    documentTypeId: string;
    ownerType: string;
    ownerId: string;
    status: string;
    issueDate: string | null;
    expiryDate: string | null;
    currentVersion: number;
    observations: string | null;
    documentType: DocumentType;
    versions: DocVersion[];
    approvals: DocApproval[];
}

interface DocVersion {
    id: string;
    versionNumber: number;
    fileUrl: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uploadedByName: string;
    uploadedAt: string;
}

interface DocApproval {
    id: string;
    action: 'approved' | 'rejected';
    reviewedByName: string;
    comments: string;
    reviewedAt: string;
}

interface Summary {
    conformityPercent: number;
    totalApplicable: number;
    approved: number;
    pending: number;
    rejected: number;
    expired: number;
    missing: number;
    expiringSoon: number;
    clearedForWork: boolean;
    clearanceReason: string;
}

// ═══════════════════════════════════════════════════════════════
// Status helpers
// ═══════════════════════════════════════════════════════════════
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
    under_review: { label: 'Em Análise', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Eye },
    approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
    rejected: { label: 'Reprovado', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
    expiring: { label: 'Vencendo', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertTriangle },
    expired: { label: 'Vencido', color: 'bg-red-200 text-red-900 border-red-400', icon: ShieldAlert },
    dispensed: { label: 'Dispensado', color: 'bg-gray-100 text-gray-600 border-gray-300', icon: HelpCircle },
};

const categoryLabels: Record<string, string> = {
    identification: 'Identificação / Admissional',
    health: 'Saúde Ocupacional',
    safety_nr: 'Segurança / NRs',
    epi_epc: 'EPI / EPC',
    qualification: 'Habilitações / Certificações',
    other: 'Outros',
};

const categoryOrder = ['identification', 'health', 'safety_nr', 'epi_epc', 'qualification', 'other'];

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export default function EmployeeCompliance() {
    const { id: employeeId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState<any>(null);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [documents, setDocuments] = useState<ComplianceDoc[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categoryOrder));

    // Dialog states
    const [uploadDialog, setUploadDialog] = useState<{ open: boolean; requirement?: Requirement; document?: ComplianceDoc }>({ open: false });
    const [historyDialog, setHistoryDialog] = useState<{ open: boolean; document?: ComplianceDoc }>({ open: false });
    const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; action: 'approve' | 'reject'; document?: ComplianceDoc }>({ open: false, action: 'approve' });
    const [naDialog, setNaDialog] = useState<{ open: boolean; requirement?: Requirement }>({ open: false });
    const [addDocDialog, setAddDocDialog] = useState(false);
    const [allDocTypes, setAllDocTypes] = useState<DocumentType[]>([]);
    const [addDocMode, setAddDocMode] = useState<'existing' | 'custom'>('existing');
    const [addDocForm, setAddDocForm] = useState({
        documentTypeId: '',
        customName: '',
        customCategory: 'other',
        customNrs: '',
        customValidityMonths: '',
        customRequiresApproval: true,
    });

    // Upload form
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [uploadDates, setUploadDates] = useState({ issueDate: '', expiryDate: '' });
    const [uploading, setUploading] = useState(false);
    const [approvalComments, setApprovalComments] = useState('');
    const [naJustification, setNaJustification] = useState('');

    useEffect(() => {
        if (employeeId) loadAll();
    }, [employeeId]);

    async function loadAll() {
        try {
            setLoading(true);
            const [emp, reqs, docs, sum] = await Promise.all([
                api.getEmployee(employeeId!),
                api.getEmployeeRequirements(employeeId!),
                api.getComplianceDocuments(employeeId!),
                api.getComplianceSummary(employeeId!),
            ]);
            setEmployee(emp);
            setRequirements(reqs);
            setDocuments(docs);
            setSummary(sum);
        } catch (e) {
            console.error(e);
            toast.error('Erro ao carregar dados de conformidade');
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateChecklist() {
        try {
            await api.generateEmployeeChecklist(employeeId!);
            toast.success('Checklist gerado com sucesso');
            loadAll();
            // Carregar lista de tipos para o dialog de adição
            loadDocTypes();
        } catch {
            toast.error('Erro ao gerar checklist');
        }
    }

    async function handleSeedTypes() {
        try {
            const result = await api.seedDocumentTypes();
            toast.success(`Tipos criados: ${result.created}, já existiam: ${result.skipped}`);
            loadDocTypes();
        } catch {
            toast.error('Erro ao popular tipos');
        }
    }

    async function loadDocTypes() {
        try {
            const types = await api.getDocumentTypes();
            setAllDocTypes(types);
        } catch { /* silent */ }
    }

    // Tipos disponíveis para adição (que não estão no checklist)
    const availableDocTypes = allDocTypes.filter(
        dt => !requirements.some(r => r.documentTypeId === dt.id)
    );

    async function handleAddDocument() {
        try {
            if (addDocMode === 'existing') {
                if (!addDocForm.documentTypeId) {
                    toast.error('Selecione um tipo de documento');
                    return;
                }
                await api.addManualRequirement(employeeId!, {
                    documentTypeId: addDocForm.documentTypeId,
                });
            } else {
                if (!addDocForm.customName.trim()) {
                    toast.error('Informe o nome do documento');
                    return;
                }
                await api.addManualRequirement(employeeId!, {
                    customName: addDocForm.customName,
                    customCategory: addDocForm.customCategory,
                    customNrs: addDocForm.customNrs ? addDocForm.customNrs.split(',').map(s => s.trim()).filter(Boolean) : [],
                    customValidityMonths: addDocForm.customValidityMonths ? parseInt(addDocForm.customValidityMonths) : null,
                    customRequiresApproval: addDocForm.customRequiresApproval,
                });
            }
            toast.success('Documento adicionado ao checklist');
            setAddDocDialog(false);
            setAddDocForm({ documentTypeId: '', customName: '', customCategory: 'other', customNrs: '', customValidityMonths: '', customRequiresApproval: true });
            loadAll();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Erro ao adicionar documento');
        }
    }

    // ═══ Applicability toggle ═══
    async function handleToggleApplicability(req: Requirement) {
        if (req.applicability === 'not_applicable') {
            // Switch back to applicable
            try {
                await api.setRequirementApplicability(req.id, { applicability: 'applicable' });
                toast.success('Marcado como aplicável');
                loadAll();
            } catch { toast.error('Erro'); }
        } else {
            // Open NA dialog
            setNaDialog({ open: true, requirement: req });
            setNaJustification('');
        }
    }

    async function confirmNotApplicable() {
        if (!naDialog.requirement) return;
        if (!naJustification.trim()) {
            toast.error('Justificativa obrigatória');
            return;
        }
        try {
            await api.setRequirementApplicability(naDialog.requirement.id, {
                applicability: 'not_applicable',
                justification: naJustification,
            });
            toast.success('Marcado como "Não Aplica"');
            setNaDialog({ open: false });
            loadAll();
        } catch { toast.error('Erro'); }
    }

    // ═══ Upload (real file from machine) ═══
    async function handleUpload() {
        if (uploadFiles.length === 0) {
            toast.error('Selecione pelo menos um arquivo');
            return;
        }

        setUploading(true);
        try {
            const compDoc = uploadDialog.document;

            if (compDoc) {
                // Documento já existe — adicionar versão(ões)
                if (uploadFiles.length === 1) {
                    await api.uploadComplianceFile(compDoc.id, uploadFiles[0], {
                        issueDate: uploadDates.issueDate || undefined,
                        expiryDate: uploadDates.expiryDate || undefined,
                    });
                } else {
                    await api.uploadComplianceFiles(compDoc.id, uploadFiles, {
                        issueDate: uploadDates.issueDate || undefined,
                        expiryDate: uploadDates.expiryDate || undefined,
                    });
                }
            } else if (uploadDialog.requirement) {
                // Quick upload: cria documento + envia arquivo(s) em uma chamada
                await api.quickUploadCompliance(uploadFiles, {
                    requirementId: uploadDialog.requirement.id,
                    documentTypeId: uploadDialog.requirement.documentTypeId,
                    ownerType: 'employee',
                    ownerId: employeeId!,
                    issueDate: uploadDates.issueDate || undefined,
                    expiryDate: uploadDates.expiryDate || undefined,
                });
            }

            toast.success(`${uploadFiles.length} arquivo(s) enviado(s) com sucesso`);
            setUploadDialog({ open: false });
            setUploadFiles([]);
            setUploadDates({ issueDate: '', expiryDate: '' });
            loadAll();
        } catch {
            toast.error('Erro ao enviar documento(s)');
        } finally {
            setUploading(false);
        }
    }

    function handleDownloadFile(fileUrl: string) {
        // fileUrl is like "/api/compliance/files/uuid.pdf"
        const filename = fileUrl.split('/').pop() || '';
        api.downloadComplianceFile(filename);
    }

    // ═══ Approval ═══
    async function handleApproval() {
        if (!approvalDialog.document) return;

        try {
            if (approvalDialog.action === 'approve') {
                await api.approveComplianceDocument(approvalDialog.document.id, approvalComments);
                toast.success('Documento aprovado');
            } else {
                if (!approvalComments.trim()) {
                    toast.error('Motivo de reprovação obrigatório');
                    return;
                }
                await api.rejectComplianceDocument(approvalDialog.document.id, approvalComments);
                toast.success('Documento reprovado');
            }
            setApprovalDialog({ open: false, action: 'approve' });
            setApprovalComments('');
            loadAll();
        } catch { toast.error('Erro'); }
    }

    // ═══ Grouped & filtered data ═══
    const grouped = useMemo(() => {
        const groups: Record<string, { requirement: Requirement; document?: ComplianceDoc }[]> = {};

        for (const cat of categoryOrder) groups[cat] = [];

        for (const req of requirements) {
            const cat = req.documentType?.category || 'other';
            if (!groups[cat]) groups[cat] = [];

            const doc = documents.find(d => d.requirementId === req.id || d.documentTypeId === req.documentTypeId);

            // Filters
            const matchesSearch = !searchTerm ||
                req.documentType?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.documentType?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.documentType?.nrsRelated?.some(nr => nr.toLowerCase().includes(searchTerm.toLowerCase()));

            const docStatus = doc?.status || (req.applicability === 'not_applicable' ? 'dispensed' : 'pending');
            const matchesStatus = statusFilter === 'all' || docStatus === statusFilter;
            const matchesCategory = categoryFilter === 'all' || cat === categoryFilter;

            if (matchesSearch && matchesStatus && matchesCategory) {
                groups[cat].push({ requirement: req, document: doc });
            }
        }

        return groups;
    }, [requirements, documents, searchTerm, statusFilter, categoryFilter]);

    function toggleCategory(cat: string) {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    }

    function getDocStatus(req: Requirement, doc?: ComplianceDoc): string {
        if (req.applicability === 'not_applicable') return 'dispensed';
        if (!doc) return 'pending';
        return doc.status;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ═══ Header ═══ */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/employees')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{employee?.name || 'Funcionário'}</h1>
                        <p className="text-sm text-muted-foreground">Documentação NR / SST / Ocupacional</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSeedTypes}>
                        <FileText className="h-4 w-4 mr-1" /> Seed Tipos
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerateChecklist}>
                        <RefreshCw className="h-4 w-4 mr-1" /> Gerar Checklist
                    </Button>
                    <Button size="sm" onClick={() => { loadDocTypes(); setAddDocDialog(true); setAddDocMode('existing'); }}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Documento
                    </Button>
                </div>
            </div>

            {/* ═══ Summary Cards ═══ */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Conformidade</p>
                                    <p className="text-3xl font-bold text-blue-600">{summary.conformityPercent}%</p>
                                </div>
                                <ShieldCheck className="h-10 w-10 text-blue-200" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.approved} de {summary.totalApplicable} aprovados
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pendências Críticas</p>
                                    <p className="text-3xl font-bold text-red-600">{summary.expired + summary.missing}</p>
                                </div>
                                <ShieldAlert className="h-10 w-10 text-red-200" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.expired} vencidos, {summary.missing} faltantes
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Próximos Vencimentos</p>
                                    <p className="text-3xl font-bold text-orange-600">{summary.expiringSoon}</p>
                                </div>
                                <Clock className="h-10 w-10 text-orange-200" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                nos próximos 60 dias
                            </p>
                        </CardContent>
                    </Card>

                    <Card className={`border-l-4 ${summary.clearedForWork ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Liberado para Obra?</p>
                                    <p className={`text-xl font-bold ${summary.clearedForWork ? 'text-green-600' : 'text-red-600'}`}>
                                        {summary.clearedForWork ? '✅ SIM' : '❌ NÃO'}
                                    </p>
                                </div>
                                {summary.clearedForWork
                                    ? <CheckCircle2 className="h-10 w-10 text-green-200" />
                                    : <XCircle className="h-10 w-10 text-red-200" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{summary.clearanceReason}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ═══ Filters ═══ */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar documento, NR..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Categorias</SelectItem>
                        {categoryOrder.map(cat => (
                            <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* ═══ Checklist Table by Category ═══ */}
            {categoryOrder.map(cat => {
                const items = grouped[cat];
                if (!items || items.length === 0) return null;

                const isExpanded = expandedCategories.has(cat);

                return (
                    <Card key={cat} className="overflow-hidden">
                        <div
                            className="flex items-center justify-between px-4 py-3 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => toggleCategory(cat)}
                        >
                            <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                <h3 className="font-semibold text-sm uppercase tracking-wide">
                                    {categoryLabels[cat] || cat}
                                </h3>
                                <Badge variant="secondary" className="ml-2">{items.length}</Badge>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="divide-y">
                                {items.map(({ requirement: req, document: doc }) => {
                                    const status = getDocStatus(req, doc);
                                    const sCfg = statusConfig[status] || statusConfig.pending;
                                    const StatusIcon = sCfg.icon;
                                    const lastVersion = doc?.versions?.sort((a, b) => b.versionNumber - a.versionNumber)[0];

                                    return (
                                        <div key={req.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                                            {/* Semaphore */}
                                            <div className="shrink-0">
                                                <StatusIcon className={`h-5 w-5 ${status === 'approved' ? 'text-green-500' :
                                                    status === 'rejected' || status === 'expired' ? 'text-red-500' :
                                                        status === 'expiring' ? 'text-orange-500' :
                                                            status === 'dispensed' ? 'text-gray-400' :
                                                                status === 'under_review' ? 'text-blue-500' :
                                                                    'text-yellow-500'
                                                    }`} />
                                            </div>

                                            {/* Name + NR */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium text-sm ${status === 'dispensed' ? 'line-through text-muted-foreground' : ''}`}>
                                                        {req.documentType?.name || 'Sem nome'}
                                                    </span>
                                                    {req.documentType?.nrsRelated?.map(nr => (
                                                        <Badge key={nr} variant="outline" className="text-xs">{nr}</Badge>
                                                    ))}
                                                </div>
                                                {req.applicability === 'not_applicable' && req.justification && (
                                                    <p className="text-xs text-muted-foreground italic mt-0.5">Dispensa: {req.justification}</p>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <Badge className={`text-xs border ${sCfg.color}`}>{sCfg.label}</Badge>

                                            {/* Toggle Aplica / Não Aplica */}
                                            {req.documentType?.allowsNotApplicable && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <span className="text-xs text-muted-foreground">Aplica</span>
                                                    <Switch
                                                        checked={req.applicability !== 'not_applicable'}
                                                        onCheckedChange={() => handleToggleApplicability(req)}
                                                    />
                                                </div>
                                            )}

                                            {/* Dates */}
                                            <div className="text-xs text-muted-foreground shrink-0 w-24 text-center">
                                                {doc?.expiryDate
                                                    ? new Date(doc.expiryDate).toLocaleDateString('pt-BR')
                                                    : '—'}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8"
                                                    title="Enviar documento"
                                                    onClick={() => {
                                                        setUploadDialog({ open: true, requirement: req, document: doc });
                                                        setUploadFiles([]);
                                                        setUploadDates({
                                                            issueDate: doc?.issueDate?.split('T')[0] || '',
                                                            expiryDate: doc?.expiryDate?.split('T')[0] || '',
                                                        });
                                                    }}
                                                    disabled={req.applicability === 'not_applicable'}
                                                >
                                                    <Upload className="h-4 w-4" />
                                                </Button>

                                                {lastVersion && (
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8"
                                                        title="Download última versão"
                                                        onClick={() => handleDownloadFile(lastVersion.fileUrl)}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {doc && (
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8"
                                                        title="Histórico"
                                                        onClick={() => setHistoryDialog({ open: true, document: doc })}
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {doc && req.documentType?.requiresApproval && doc.status === 'under_review' && (
                                                    <>
                                                        <Button
                                                            variant="ghost" size="icon" className="h-8 w-8 text-green-600"
                                                            title="Aprovar"
                                                            onClick={() => {
                                                                setApprovalDialog({ open: true, action: 'approve', document: doc });
                                                                setApprovalComments('');
                                                            }}
                                                        >
                                                            <ThumbsUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="icon" className="h-8 w-8 text-red-600"
                                                            title="Reprovar"
                                                            onClick={() => {
                                                                setApprovalDialog({ open: true, action: 'reject', document: doc });
                                                                setApprovalComments('');
                                                            }}
                                                        >
                                                            <ThumbsDown className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                );
            })}

            {requirements.length === 0 && !loading && (
                <Card className="p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Nenhum checklist gerado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Primeiro popule os tipos de documento, depois gere o checklist.
                    </p>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={handleSeedTypes}>Seed Tipos</Button>
                        <Button onClick={handleGenerateChecklist}>Gerar Checklist</Button>
                    </div>
                </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* DIALOGS                                                     */}
            {/* ═══════════════════════════════════════════════════════════ */}

            {/* Upload Dialog */}
            <Dialog open={uploadDialog.open} onOpenChange={o => setUploadDialog({ ...uploadDialog, open: o })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Enviar Documento
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            <strong>{uploadDialog.requirement?.documentType?.name}</strong>
                            {uploadDialog.document ? ` — Versão ${(uploadDialog.document.currentVersion || 0) + 1}` : ' — Primeiro envio'}
                        </p>

                        {/* File picker — selecionar da máquina */}
                        <div>
                            <Label>Selecionar Arquivo(s)</Label>
                            <div className="mt-1">
                                <label
                                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/25"
                                >
                                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-semibold">Clique para selecionar</span> ou arraste
                                        </p>
                                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC — até 50 MB cada</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                        onChange={e => {
                                            const files = Array.from(e.target.files || []);
                                            setUploadFiles(prev => [...prev, ...files]);
                                        }}
                                    />
                                </label>
                            </div>

                            {/* Lista de arquivos selecionados */}
                            {uploadFiles.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {uploadFiles.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between bg-muted/40 rounded px-3 py-1.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className="text-sm truncate">{f.name}</span>
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    ({(f.size / 1024).toFixed(0)} KB)
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                                                onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))}
                                            >
                                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                    <p className="text-xs text-muted-foreground">
                                        {uploadFiles.length} arquivo(s) selecionado(s)
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Data de Emissão</Label>
                                <Input
                                    type="date"
                                    value={uploadDates.issueDate}
                                    onChange={e => setUploadDates({ ...uploadDates, issueDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Data de Vencimento</Label>
                                <Input
                                    type="date"
                                    value={uploadDates.expiryDate}
                                    onChange={e => setUploadDates({ ...uploadDates, expiryDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialog({ open: false })} disabled={uploading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpload} disabled={uploading || uploadFiles.length === 0}>
                            {uploading ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Enviando...</>
                            ) : (
                                `Enviar ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={historyDialog.open} onOpenChange={o => setHistoryDialog({ ...historyDialog, open: o })}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Histórico — {historyDialog.document?.documentType?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Versões</h4>
                        {historyDialog.document?.versions
                            ?.sort((a, b) => b.versionNumber - a.versionNumber)
                            .map(v => (
                                <div key={v.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium">v{v.versionNumber} — {v.fileName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {v.uploadedByName} • {new Date(v.uploadedAt).toLocaleDateString('pt-BR')}
                                            {v.fileSize ? ` • ${(v.fileSize / 1024).toFixed(0)} KB` : ''}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadFile(v.fileUrl)}>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                        {historyDialog.document?.approvals && historyDialog.document.approvals.length > 0 && (
                            <>
                                <h4 className="font-semibold text-sm mt-4">Aprovações</h4>
                                {historyDialog.document.approvals
                                    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
                                    .map(a => (
                                        <div key={a.id} className={`p-3 rounded-lg border ${a.action === 'approved' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                            <div className="flex items-center gap-2">
                                                {a.action === 'approved'
                                                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    : <XCircle className="h-4 w-4 text-red-600" />}
                                                <span className="text-sm font-medium">
                                                    {a.action === 'approved' ? 'Aprovado' : 'Reprovado'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {a.reviewedByName} • {new Date(a.reviewedAt).toLocaleDateString('pt-BR')}
                                            </p>
                                            {a.comments && <p className="text-sm mt-1">{a.comments}</p>}
                                        </div>
                                    ))}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Approval Dialog */}
            <Dialog open={approvalDialog.open} onOpenChange={o => setApprovalDialog({ ...approvalDialog, open: o })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {approvalDialog.action === 'approve'
                                ? <><ThumbsUp className="h-5 w-5 text-green-600" /> Aprovar Documento</>
                                : <><ThumbsDown className="h-5 w-5 text-red-600" /> Reprovar Documento</>}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {approvalDialog.document?.documentType?.name}
                        </p>
                        <div>
                            <Label>{approvalDialog.action === 'approve' ? 'Comentários (opcional)' : 'Motivo da reprovação *'}</Label>
                            <Textarea
                                value={approvalComments}
                                onChange={e => setApprovalComments(e.target.value)}
                                placeholder={approvalDialog.action === 'approve' ? 'Observações...' : 'Informe o motivo da reprovação...'}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApprovalDialog({ open: false, action: 'approve' })}>
                            Cancelar
                        </Button>
                        <Button
                            variant={approvalDialog.action === 'approve' ? 'default' : 'destructive'}
                            onClick={handleApproval}
                        >
                            {approvalDialog.action === 'approve' ? 'Aprovar' : 'Reprovar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Not Applicable Dialog */}
            <Dialog open={naDialog.open} onOpenChange={o => setNaDialog({ ...naDialog, open: o })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Marcar como "Não Aplica"</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            <strong>{naDialog.requirement?.documentType?.name}</strong>
                        </p>
                        <div>
                            <Label>Justificativa *</Label>
                            <Textarea
                                value={naJustification}
                                onChange={e => setNaJustification(e.target.value)}
                                placeholder="Informe o motivo pelo qual este documento não se aplica..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNaDialog({ open: false })}>Cancelar</Button>
                        <Button onClick={confirmNotApplicable}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Document Dialog */}
            <Dialog open={addDocDialog} onOpenChange={setAddDocDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Adicionar Documento ao Checklist
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Adicione documentos extras que a obra ou situação exige, além do checklist automático.
                        </p>

                        {/* Mode tabs */}
                        <div className="flex gap-1 bg-muted rounded-lg p-1">
                            <button
                                className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${addDocMode === 'existing' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'
                                    }`}
                                onClick={() => setAddDocMode('existing')}
                            >
                                Tipo Existente
                            </button>
                            <button
                                className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${addDocMode === 'custom' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'
                                    }`}
                                onClick={() => setAddDocMode('custom')}
                            >
                                Criar Novo Tipo
                            </button>
                        </div>

                        {addDocMode === 'existing' ? (
                            <div>
                                <Label>Tipo de Documento</Label>
                                <Select
                                    value={addDocForm.documentTypeId}
                                    onValueChange={v => setAddDocForm({ ...addDocForm, documentTypeId: v })}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione um tipo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableDocTypes.length === 0 && (
                                            <div className="text-sm text-muted-foreground p-3 text-center">
                                                Todos os tipos já estão no checklist
                                            </div>
                                        )}
                                        {availableDocTypes.map(dt => (
                                            <SelectItem key={dt.id} value={dt.id}>
                                                {dt.name}
                                                {dt.nrsRelated?.length > 0 && ` (${dt.nrsRelated.join(', ')})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <Label>Nome do Documento *</Label>
                                    <Input
                                        value={addDocForm.customName}
                                        onChange={e => setAddDocForm({ ...addDocForm, customName: e.target.value })}
                                        placeholder="Ex: Laudo Técnico, PET, APR..."
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Categoria</Label>
                                    <Select
                                        value={addDocForm.customCategory}
                                        onValueChange={v => setAddDocForm({ ...addDocForm, customCategory: v })}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoryOrder.map(cat => (
                                                <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>NRs Relacionadas</Label>
                                        <Input
                                            value={addDocForm.customNrs}
                                            onChange={e => setAddDocForm({ ...addDocForm, customNrs: e.target.value })}
                                            placeholder="NR-10, NR-35"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Validade (meses)</Label>
                                        <Input
                                            type="number"
                                            value={addDocForm.customValidityMonths}
                                            onChange={e => setAddDocForm({ ...addDocForm, customValidityMonths: e.target.value })}
                                            placeholder="Ex: 12"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={addDocForm.customRequiresApproval}
                                        onCheckedChange={v => setAddDocForm({ ...addDocForm, customRequiresApproval: v })}
                                    />
                                    <span className="text-sm">Requer aprovação</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDocDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddDocument}>
                            Adicionar ao Checklist
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
