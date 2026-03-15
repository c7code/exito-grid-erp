import { useState, useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Plus, Search, FileSignature, TrendingUp,
    DollarSign, Eye, Trash2, Building2, Printer,
    ArrowLeft, Save, FileText, Link2, Users, Shield, Gavel,
    Send, CheckCircle2, Copy, ExternalLink,
    Paperclip, Upload, FileType, Download, X,
} from 'lucide-react';
import { ContractPDFTemplate } from '@/components/ContractPDFTemplate';

const statusLabels: Record<string, string> = {
    draft: 'Rascunho', active: 'Ativo', suspended: 'Suspenso',
    completed: 'Concluído', cancelled: 'Cancelado', expired: 'Expirado',
};
const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700', active: 'bg-emerald-100 text-emerald-700',
    suspended: 'bg-amber-100 text-amber-700', completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700', expired: 'bg-gray-100 text-gray-500',
};
const typeLabels: Record<string, string> = {
    service: 'Serviço', supply: 'Fornecimento', subcontract: 'Subcontratação',
    maintenance: 'Manutenção', consulting: 'Consultoria', other: 'Outro',
};
const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Contracts() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [works, setWorks] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [proposals, setProposals] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'detail' | 'pdf'>('list');
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [addendumDialogOpen, setAddendumDialogOpen] = useState(false);
    const [addendumForm, setAddendumForm] = useState<any>({});
    const [signatureLinkDialogOpen, setSignatureLinkDialogOpen] = useState(false);
    const [signatureLink, setSignatureLink] = useState('');
    const [signatureStatus, setSignatureStatus] = useState<any>(null);
    const [contractDocs, setContractDocs] = useState<any[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const fetchAll = async () => {
        try {
            const [c, w, cl, p] = await Promise.allSettled([
                api.getContracts(), api.getWorks(), api.getClients(), api.getProposals(),
            ]);
            setContracts(c.status === 'fulfilled' ? (Array.isArray(c.value) ? c.value : []) : []);
            setWorks(w.status === 'fulfilled' ? (Array.isArray(w.value) ? w.value : w.value?.data ?? []) : []);
            setClients(cl.status === 'fulfilled' ? (Array.isArray(cl.value) ? cl.value : cl.value?.data ?? []) : []);
            setProposals(p.status === 'fulfilled' ? (Array.isArray(p.value) ? p.value : p.value?.data ?? []) : []);
        } catch { toast.error('Erro ao carregar contratos'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const filtered = contracts.filter((c: any) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            return (c.title?.toLowerCase().includes(s) || c.contractNumber?.toLowerCase().includes(s) || c.client?.name?.toLowerCase().includes(s));
        }
        return true;
    });

    const stats = {
        total: contracts.length,
        active: contracts.filter((c: any) => c.status === 'active').length,
        totalValue: contracts.reduce((s: number, c: any) => s + Number(c.finalValue || 0), 0),
        totalAddendums: contracts.reduce((s: number, c: any) => s + (c.addendums?.length || 0), 0),
    };

    const handleSave = async () => {
        try {
            if (selectedContract?.id) {
                await api.updateContract(selectedContract.id, form);
                toast.success('Contrato atualizado');
            } else {
                const created = await api.createContract(form);
                setSelectedContract(created);
                toast.success('Contrato criado');
            }
            fetchAll();
        } catch { toast.error('Erro ao salvar contrato'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este contrato?')) return;
        try {
            await api.deleteContract(id);
            toast.success('Contrato excluído');
            setView('list');
            fetchAll();
        } catch { toast.error('Erro ao excluir'); }
    };

    const handleAddendum = async () => {
        if (!selectedContract) return;
        try {
            await api.createContractAddendum(selectedContract.id, addendumForm);
            toast.success('Aditivo registrado');
            setAddendumDialogOpen(false);
            setAddendumForm({});
            // Reload the contract
            const updated = await api.getContract(selectedContract.id);
            setSelectedContract(updated);
            setForm(contractToForm(updated));
            fetchAll();
        } catch { toast.error('Erro ao registrar aditivo'); }
    };

    const contractToForm = (c: any) => ({
        title: c.title || '', description: c.description || '', type: c.type || 'service', status: c.status || 'draft',
        workId: c.workId || '', clientId: c.clientId || '', proposalId: c.proposalId || '',
        originalValue: c.originalValue || '', startDate: c.startDate?.slice?.(0, 10) || '',
        endDate: c.endDate?.slice?.(0, 10) || '', scope: c.scope || '', paymentTerms: c.paymentTerms || '',
        paymentBank: c.paymentBank || '', penalties: c.penalties || '', warranty: c.warranty || '',
        confidentiality: c.confidentiality || '', termination: c.termination || '', forceMajeure: c.forceMajeure || '',
        jurisdiction: c.jurisdiction || '', contractorObligations: c.contractorObligations || '',
        clientObligations: c.clientObligations || '', generalProvisions: c.generalProvisions || '', notes: c.notes || '',
        witness1Name: c.witness1Name || '', witness1Document: c.witness1Document || '',
        witness2Name: c.witness2Name || '', witness2Document: c.witness2Document || '',
    });

    const loadContractDocs = async (contractId: string) => {
        setDocsLoading(true);
        try {
            const docs = await api.getContractDocuments(contractId);
            setContractDocs(Array.isArray(docs) ? docs : []);
        } catch { setContractDocs([]); }
        finally { setDocsLoading(false); }
    };

    const openDetail = async (c: any) => {
        setSelectedContract(c);
        setForm(contractToForm(c));
        setView('detail');
        setContractDocs([]);
        // Load signature status and docs
        if (c.id) {
            try {
                const status = await api.getContractSignatureStatus(c.id);
                setSignatureStatus(status);
            } catch { setSignatureStatus(null); }
            loadContractDocs(c.id);
        }
    };

    const openNew = () => {
        setSelectedContract({});
        setForm({ type: 'service', status: 'draft' });
        setView('detail');
        setSignatureStatus(null);
        setContractDocs([]);
    };

    const handleUploadDocs = async (files: FileList | File[]) => {
        if (!selectedContract?.id || !files.length) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                await api.uploadContractDocument(selectedContract.id, file, file.name);
            }
            toast.success(`${Array.from(files).length > 1 ? 'Arquivos enviados' : 'Arquivo enviado'} com sucesso!`);
            await loadContractDocs(selectedContract.id);
        } catch { toast.error('Erro ao fazer upload do arquivo'); }
        finally { setUploading(false); }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm('Remover este arquivo?')) return;
        try {
            await api.deleteDocument(docId);
            setContractDocs(prev => prev.filter((d: any) => d.id !== docId));
            toast.success('Arquivo removido');
        } catch { toast.error('Erro ao remover arquivo'); }
    };

    const handleGenerateSignatureLink = async () => {
        if (!selectedContract?.id) return;
        try {
            const result = await api.generateContractSignatureLink(selectedContract.id);
            const fullUrl = `${window.location.origin}${result.url}`;
            setSignatureLink(fullUrl);
            setSignatureLinkDialogOpen(true);
            toast.success('Link de assinatura gerado!');
            // Reload signature status
            const status = await api.getContractSignatureStatus(selectedContract.id);
            setSignatureStatus(status);
            fetchAll();
        } catch { toast.error('Erro ao gerar link de assinatura'); }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(signatureLink);
        toast.success('Link copiado!');
    };

    const handlePrint = () => {
        setView('pdf');
        setTimeout(() => {
            const content = document.getElementById('contract-pdf-content');
            if (!content) return;
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;
            printWindow.document.write(`<!DOCTYPE html><html><head><title>Contrato ${selectedContract?.contractNumber || ''}</title></head><body>`);
            printWindow.document.write(content.outerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.onload = () => { printWindow.print(); };
        }, 300);
    };

    const handleSelectChange = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value === '__none__' ? '' : value }));
    const handleInputChange = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }));

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;

    // ═══════════ PDF VIEW ═══════════
    if (view === 'pdf' && selectedContract) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setView('detail')}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Imprimir / PDF</Button>
                </div>
                <div className="bg-white rounded-xl border shadow-lg overflow-auto">
                    <ContractPDFTemplate contract={selectedContract} />
                </div>
            </div>
        );
    }

    // ═══════════ DETAIL VIEW ═══════════
    if (view === 'detail') {
        return (
            <div className="space-y-4">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => { setView('list'); setSelectedContract(null); }}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Contratos
                        </Button>
                        {selectedContract?.contractNumber && (
                            <span className="font-mono text-sm text-slate-500">{selectedContract.contractNumber} | v{selectedContract.version || 1}</span>
                        )}
                        {selectedContract?.status && (
                            <Badge className={`${statusColors[selectedContract.status] || ''}`}>{statusLabels[selectedContract.status] || selectedContract.status}</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedContract?.id && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => { setAddendumForm({}); setAddendumDialogOpen(true); }}>
                                    <TrendingUp className="w-4 h-4 mr-1 text-amber-600" /> Aditivo
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setView('pdf')}>
                                    <FileText className="w-4 h-4 mr-1" /> Visualizar PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={handlePrint}>
                                    <Printer className="w-4 h-4 mr-1" /> Imprimir
                                </Button>
                                {signatureStatus?.isSigned ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 gap-1 px-3 py-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Assinado
                                    </Badge>
                                ) : (
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleGenerateSignatureLink}>
                                        <Send className="w-4 h-4 mr-1" /> Enviar para Assinatura
                                    </Button>
                                )}
                            </>
                        )}
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900" size="sm" onClick={handleSave}>
                            <Save className="w-4 h-4 mr-1" /> Salvar
                        </Button>
                    </div>
                </div>

                {/* Tabbed Editor */}
                <Tabs defaultValue="geral" className="bg-white rounded-xl border">
                    <TabsList className="w-full justify-start border-b rounded-none bg-slate-50 px-4 pt-2">
                        <TabsTrigger value="geral" className="gap-1.5"><FileSignature className="w-3.5 h-3.5" /> Dados Gerais</TabsTrigger>
                        <TabsTrigger value="vinculos" className="gap-1.5"><Link2 className="w-3.5 h-3.5" /> Vínculos</TabsTrigger>
                        <TabsTrigger value="clausulas" className="gap-1.5"><Gavel className="w-3.5 h-3.5" /> Cláusulas Jurídicas</TabsTrigger>
                        <TabsTrigger value="obrigacoes" className="gap-1.5"><Shield className="w-3.5 h-3.5" /> Obrigações</TabsTrigger>
                        <TabsTrigger value="testemunhas" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Testemunhas</TabsTrigger>
                        <TabsTrigger value="documentos" className="gap-1.5">
                            <Paperclip className="w-3.5 h-3.5" /> Documentos
                            {contractDocs.length > 0 && (
                                <span className="ml-1 bg-amber-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">{contractDocs.length}</span>
                            )}
                        </TabsTrigger>
                        {selectedContract?.addendums?.length > 0 && (
                            <TabsTrigger value="aditivos" className="gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Aditivos ({selectedContract.addendums.length})</TabsTrigger>
                        )}
                    </TabsList>

                    {/* TAB: Dados Gerais */}
                    <TabsContent value="geral" className="p-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-medium text-slate-600">Título do Contrato</label>
                                <Input value={form.title} onChange={e => handleInputChange('title', e.target.value)} placeholder="Ex: Contrato de Extensão de Rede - Cliente X" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Tipo</label>
                                <Select value={form.type} onValueChange={v => handleSelectChange('type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Status</label>
                                <Select value={form.status} onValueChange={v => handleSelectChange('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Valor Original (R$)</label>
                                <Input type="number" step="0.01" value={form.originalValue} onChange={e => handleInputChange('originalValue', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Data Início</label>
                                <Input type="date" value={form.startDate} onChange={e => handleInputChange('startDate', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Data Fim</label>
                                <Input type="date" value={form.endDate} onChange={e => handleInputChange('endDate', e.target.value)} />
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs font-medium text-slate-600">Descrição / Escopo</label>
                                <Textarea rows={4} value={form.scope} onChange={e => handleInputChange('scope', e.target.value)} placeholder="Descreva o escopo completo do contrato..." />
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs font-medium text-slate-600">Observações Internas</label>
                                <Textarea rows={2} value={form.notes} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Notas internas (não aparecem no PDF)" />
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB: Vínculos */}
                    <TabsContent value="vinculos" className="p-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Cliente</label>
                                <Select value={form.clientId || '__none__'} onValueChange={v => handleSelectChange('clientId', v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Nenhum</SelectItem>
                                        {clients.map((cl: any) => <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Obra</label>
                                <Select value={form.workId || '__none__'} onValueChange={v => handleSelectChange('workId', v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Nenhuma</SelectItem>
                                        {works.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.code} - {w.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Proposta Vinculada</label>
                                <Select value={form.proposalId || '__none__'} onValueChange={v => handleSelectChange('proposalId', v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Nenhuma</SelectItem>
                                        {proposals.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.proposalNumber} - {p.title || fmt(p.total)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {selectedContract?.proposal && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm font-semibold text-blue-800">📋 Proposta Vinculada: {selectedContract.proposal.proposalNumber}</p>
                                <p className="text-xs text-blue-600 mt-1">Valor: {fmt(selectedContract.proposal.total)} | Status: {selectedContract.proposal.status}</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* TAB: Cláusulas Jurídicas */}
                    <TabsContent value="clausulas" className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600">Condições de Pagamento</label>
                            <Textarea rows={3} value={form.paymentTerms} onChange={e => handleInputChange('paymentTerms', e.target.value)} placeholder="Descreva as condições de pagamento..." />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Dados Bancários</label>
                            <Textarea rows={2} value={form.paymentBank} onChange={e => handleInputChange('paymentBank', e.target.value)} placeholder="Banco, Agência, Conta, PIX..." />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Penalidades</label>
                            <Textarea rows={3} value={form.penalties} onChange={e => handleInputChange('penalties', e.target.value)} placeholder="Cláusula de multas e penalidades por descumprimento..." />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Garantia</label>
                            <Textarea rows={3} value={form.warranty} onChange={e => handleInputChange('warranty', e.target.value)} placeholder="Prazo e condições de garantia dos serviços..." />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Rescisão</label>
                            <Textarea rows={3} value={form.termination} onChange={e => handleInputChange('termination', e.target.value)} placeholder="Condições de rescisão contratual..." />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Confidencialidade</label>
                            <Textarea rows={2} value={form.confidentiality} onChange={e => handleInputChange('confidentiality', e.target.value)} placeholder="Cláusula de sigilo e confidencialidade (opcional)..." />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Força Maior</label>
                            <Textarea rows={2} value={form.forceMajeure} onChange={e => handleInputChange('forceMajeure', e.target.value)} placeholder="Cláusula de caso fortuito (opcional)..." />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Foro</label>
                            <Input value={form.jurisdiction} onChange={e => handleInputChange('jurisdiction', e.target.value)} placeholder="Ex: Fica eleito o foro da Comarca de Recife/PE..." />
                        </div>
                    </TabsContent>

                    {/* TAB: Obrigações */}
                    <TabsContent value="obrigacoes" className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600">Obrigações da CONTRATADA (uma por linha)</label>
                            <Textarea rows={6} value={form.contractorObligations} onChange={e => handleInputChange('contractorObligations', e.target.value)} placeholder={'Executar os serviços conforme especificações técnicas.\nFornecer todos os materiais necessários.\nManter equipe habilitada com EPIs.\n...'} />
                            <p className="text-[10px] text-slate-400 mt-1">Deixe em branco para usar as obrigações padrão no PDF</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Obrigações do CONTRATANTE (uma por linha)</label>
                            <Textarea rows={5} value={form.clientObligations} onChange={e => handleInputChange('clientObligations', e.target.value)} placeholder={'Fornecer acesso ao local.\nDisponibilizar ponto de energia e água.\nEfetuar os pagamentos pontualmente.\n...'} />
                            <p className="text-[10px] text-slate-400 mt-1">Deixe em branco para usar as obrigações padrão no PDF</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Disposições Gerais (uma por linha)</label>
                            <Textarea rows={4} value={form.generalProvisions} onChange={e => handleInputChange('generalProvisions', e.target.value)} placeholder="Cláusulas adicionais..." />
                        </div>
                    </TabsContent>

                    {/* TAB: Testemunhas */}
                    <TabsContent value="testemunhas" className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                                <h3 className="text-sm font-semibold text-slate-700">Testemunha 1</h3>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Nome</label>
                                    <Input value={form.witness1Name} onChange={e => handleInputChange('witness1Name', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">CPF</label>
                                    <Input value={form.witness1Document} onChange={e => handleInputChange('witness1Document', e.target.value)} placeholder="000.000.000-00" />
                                </div>
                            </div>
                            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                                <h3 className="text-sm font-semibold text-slate-700">Testemunha 2</h3>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Nome</label>
                                    <Input value={form.witness2Name} onChange={e => handleInputChange('witness2Name', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">CPF</label>
                                    <Input value={form.witness2Document} onChange={e => handleInputChange('witness2Document', e.target.value)} placeholder="000.000.000-00" />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB: Documentos */}
                    <TabsContent value="documentos" className="p-6">
                        {/* Upload Zone */}
                        {selectedContract?.id && (
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-6 mb-5 text-center transition-all cursor-pointer ${
                                    isDragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/50'
                                }`}
                                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={e => { e.preventDefault(); setIsDragOver(false); handleUploadDocs(e.dataTransfer.files); }}
                                onClick={() => document.getElementById('contract-file-input')?.click()}
                            >
                                <input
                                    id="contract-file-input"
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.zip"
                                    className="hidden"
                                    onChange={e => e.target.files && handleUploadDocs(e.target.files)}
                                />
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                                        <p className="text-sm text-slate-500">Enviando arquivo(s)...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                            <Upload className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">Clique ou arraste arquivos aqui</p>
                                        <p className="text-xs text-slate-400">PDF, fotos, documentos Word/Excel • Máx 50 MB por arquivo</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* File Grid */}
                        {docsLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
                            </div>
                        ) : contractDocs.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Paperclip className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Nenhum documento anexado</p>
                                <p className="text-xs mt-1">Use a área acima para adicionar contrato assinado, fotos, etc.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {contractDocs.map((doc: any) => {
                                    const isImage = doc.mimeType?.startsWith('image/');
                                    const isPdf = doc.mimeType === 'application/pdf';
                                    const fileUrl = doc.url?.startsWith('http') ? doc.url : `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}${doc.url}`;
                                    return (
                                        <div key={doc.id} className="group relative bg-slate-50 border rounded-xl overflow-hidden hover:border-amber-300 hover:shadow-sm transition-all">
                                            {/* Preview / Icon Area */}
                                            <div
                                                className="h-28 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 cursor-pointer"
                                                onClick={() => window.open(fileUrl, '_blank')}
                                            >
                                                {isImage ? (
                                                    <img src={fileUrl} alt={doc.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                ) : isPdf ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <FileType className="w-10 h-10 text-red-400" />
                                                        <span className="text-[10px] font-bold text-red-400">PDF</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <FileText className="w-10 h-10 text-slate-400" />
                                                        <span className="text-[10px] text-slate-400 uppercase">{doc.mimeType?.split('/').pop() || 'DOC'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="p-2">
                                                <p className="text-xs font-medium text-slate-700 truncate" title={doc.name}>{doc.name || doc.originalName}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : ''} · {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            {/* Actions overlay */}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="w-6 h-6 bg-white rounded-full shadow flex items-center justify-center hover:bg-blue-50"
                                                    title="Abrir/Download"
                                                    onClick={e => { e.stopPropagation(); window.open(fileUrl, '_blank'); }}
                                                >
                                                    <Download className="w-3 h-3 text-blue-500" />
                                                </button>
                                                <button
                                                    className="w-6 h-6 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
                                                    title="Remover"
                                                    onClick={e => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                                                >
                                                    <X className="w-3 h-3 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* TAB: Aditivos */}
                    {selectedContract?.addendums?.length > 0 && (
                        <TabsContent value="aditivos" className="p-6">
                            <div className="space-y-3">
                                {selectedContract.addendums.map((a: any, i: number) => (
                                    <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border">
                                        <div>
                                            <p className="text-sm font-semibold">Aditivo #{i + 1} — {a.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{a.justification || 'Sem justificativa'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${Number(a.valueChange) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {Number(a.valueChange) >= 0 ? '+' : ''}{fmt(a.valueChange)}
                                            </p>
                                            <p className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        );
    }

    // ═══════════ LIST VIEW ═══════════
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Contratos</h1>
                    <p className="text-sm text-slate-500">Gestão de contratos, aditivos e documentação jurídica</p>
                </div>
                <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                    <Plus className="w-4 h-4 mr-2" /> Novo Contrato
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><FileSignature className="w-4 h-4" /> TOTAL</div>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-emerald-500 text-xs mb-1"><Building2 className="w-4 h-4" /> ATIVOS</div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-blue-500 text-xs mb-1"><DollarSign className="w-4 h-4" /> VALOR TOTAL</div>
                    <p className="text-2xl font-bold text-blue-600">{fmt(stats.totalValue)}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-amber-500 text-xs mb-1"><TrendingUp className="w-4 h-4" /> ADITIVOS</div>
                    <p className="text-2xl font-bold text-amber-600">{stats.totalAddendums}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input placeholder="Buscar contrato..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nº</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Proposta</TableHead>
                            <TableHead className="text-right">Valor Final</TableHead>
                            <TableHead>Vigência</TableHead>
                            <TableHead>V.</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cadastrado por</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={11} className="text-center py-8 text-slate-400">Nenhum contrato encontrado</TableCell></TableRow>
                        ) : filtered.map((c: any) => (
                            <TableRow key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail(c)}>
                                <TableCell className="font-mono text-xs">{c.contractNumber}</TableCell>
                                <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{typeLabels[c.type] || c.type}</Badge></TableCell>
                                <TableCell className="text-sm">{c.client?.name || '—'}</TableCell>
                                <TableCell className="text-xs text-blue-600">{c.proposal?.proposalNumber || '—'}</TableCell>
                                <TableCell className="text-right font-semibold text-sm">{fmt(c.finalValue)}</TableCell>
                                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                    {c.startDate ? new Date(c.startDate).toLocaleDateString('pt-BR') : '—'} → {c.endDate ? new Date(c.endDate).toLocaleDateString('pt-BR') : '—'}
                                </TableCell>
                                <TableCell><Badge variant="secondary" className="text-[10px]">v{c.version || 1}</Badge></TableCell>
                                <TableCell><Badge className={`text-[10px] ${statusColors[c.status] || ''}`}>{statusLabels[c.status] || c.status}</Badge></TableCell>
                                <TableCell>
                                    {c.createdByUser ? (
                                        <span className="text-sm text-slate-600 truncate max-w-[100px] block">{c.createdByUser.name}</span>
                                    ) : (
                                        <span className="text-sm text-slate-400">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(c)}><Eye className="w-3.5 h-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Addendum Dialog */}
            <Dialog open={addendumDialogOpen} onOpenChange={setAddendumDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Novo Aditivo — {selectedContract?.contractNumber}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600">Título do Aditivo</label>
                            <Input value={addendumForm.title || ''} onChange={e => setAddendumForm({ ...addendumForm, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Valor do Aditivo (R$)</label>
                            <Input type="number" step="0.01" value={addendumForm.valueChange || ''} onChange={e => setAddendumForm({ ...addendumForm, valueChange: e.target.value })} placeholder="Positivo para acréscimo, negativo para redução" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Nova Data Fim (opcional)</label>
                            <Input type="date" value={addendumForm.newEndDate || ''} onChange={e => setAddendumForm({ ...addendumForm, newEndDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Justificativa</label>
                            <Textarea rows={3} value={addendumForm.justification || ''} onChange={e => setAddendumForm({ ...addendumForm, justification: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddendumDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddendum} className="bg-amber-500 hover:bg-amber-600 text-slate-900">Registrar Aditivo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Signature Link Dialog */}
            <Dialog open={signatureLinkDialogOpen} onOpenChange={setSignatureLinkDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-emerald-600" /> Link de Assinatura Digital
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Envie o link abaixo para o cliente assinar o contrato digitalmente.
                            O link tem validade de <strong>30 dias</strong>.
                        </p>
                        <div className="flex items-center gap-2">
                            <Input readOnly value={signatureLink} className="font-mono text-xs" />
                            <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => window.open(signatureLink, '_blank')}>
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-800">
                            <strong>📋 Validade Jurídica:</strong> A assinatura eletrônica captura o nome, CPF/CNPJ, IP,
                            data/hora e navegador do signatário, conferindo validade jurídica conforme
                            MP 2.200-2/2001 e Lei 14.063/2020. O código de verificação gerado pode ser
                            utilizado para comprovação junto a órgãos de proteção ao crédito (SPC/Serasa).
                        </div>
                        {signatureStatus?.isSigned && (
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                                <p className="font-semibold text-emerald-800 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Contrato já assinado
                                </p>
                                <p><strong>Assinado por:</strong> {signatureStatus.signedByName}</p>
                                <p><strong>CPF/CNPJ:</strong> {signatureStatus.signedByDocument}</p>
                                <p><strong>Data/Hora:</strong> {new Date(signatureStatus.signedAt).toLocaleString('pt-BR')}</p>
                                <p><strong>IP:</strong> {signatureStatus.signedByIP}</p>
                                <p className="mt-1 font-mono text-base font-bold tracking-widest text-emerald-700">
                                    Código: {signatureStatus.verificationCode}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSignatureLinkDialogOpen(false)}>Fechar</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCopyLink}>
                            <Copy className="w-4 h-4 mr-1" /> Copiar Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
