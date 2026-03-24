import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Loader2, Plus, X, FileText, CheckCircle, Trash2, Download,
    Calculator, ClipboardList, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { parsePrice } from '@/lib/parsePrice';

const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface DirectBillingItem {
    supplier: string;
    cnpj: string;
    material: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface MeasurementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    workId: string;
    work?: any;
    onSuccess: () => void;
}

export function MeasurementDialog({ isOpen, onClose, workId, work, onSuccess }: MeasurementDialogProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
    const [balance, setBalance] = useState<any>(null);
    const [mode, setMode] = useState<'list' | 'create' | 'view'>('list');
    const [proposals, setProposals] = useState<any[]>([]);

    // Form state for new/edit measurement
    const [description, setDescription] = useState('');
    const [contractValue, setContractValue] = useState('');
    const [executedPercentage, setExecutedPercentage] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');
    const [directBillingItems, setDirectBillingItems] = useState<DirectBillingItem[]>([]);
    const [selectedProposalId, setSelectedProposalId] = useState('');

    const directBillingTotal = directBillingItems.reduce((s, i) => s + (i.total || 0), 0);
    const contractVal = parsePrice(contractValue);
    const baseValue = contractVal - directBillingTotal;
    const execPercent = parsePrice(executedPercentage);
    const measurementValue = baseValue * (execPercent / 100);

    // Accumulated from previous approved measurements
    const accumulatedTotal = balance?.totalExecuted || 0;
    const accumulatedPercentage = balance?.totalExecutedPercentage || 0;
    const remainingBalance = baseValue - accumulatedTotal - measurementValue;
    const remainingPercentage = 100 - accumulatedPercentage - execPercent;

    useEffect(() => {
        if (isOpen && workId) {
            loadData();
        }
    }, [isOpen, workId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [meas, bal, props] = await Promise.all([
                api.getMeasurements(workId),
                api.getMeasurementBalance(workId).catch(() => null),
                api.getProposals().catch(() => []),
            ]);
            setMeasurements(Array.isArray(meas) ? meas : (meas?.data ?? []));
            setBalance(bal);
            const workProposals = (Array.isArray(props) ? props : (props?.data ?? []))
                .filter((p: any) => p.workId === workId || p.work?.id === workId);
            setProposals(workProposals);
        } catch { }
        setLoading(false);
    };

    const resetForm = () => {
        setDescription('');
        setContractValue(work?.totalValue?.toString() || '');
        setExecutedPercentage('');
        setStartDate('');
        setEndDate('');
        setNotes('');
        setDirectBillingItems([]);
        setSelectedProposalId('');
    };

    const handleNewMeasurement = () => {
        resetForm();
        setContractValue(work?.totalValue?.toString() || '');
        setMode('create');
    };

    const importFromProposal = async (proposalId: string) => {
        if (!proposalId) return;
        try {
            const proposal = await api.getProposal(proposalId);
            if (proposal.materialFaturamento) {
                const items = JSON.parse(proposal.materialFaturamento);
                if (Array.isArray(items) && items.length > 0) {
                    setDirectBillingItems(items.map((it: any) => ({
                        supplier: it.supplier || it.fornecedor || '',
                        cnpj: it.cnpj || '',
                        material: it.material || it.item || '',
                        quantity: Number(it.quantity || it.quantidade || 1),
                        unitPrice: Number(it.unitPrice || it.precoUnit || 0),
                        total: Number(it.total || 0),
                    })));
                    toast.success(`${items.length} item(ns) importado(s) da proposta`);
                } else {
                    toast.info('Proposta não possui itens de faturamento direto');
                }
            } else {
                toast.info('Proposta não possui itens de faturamento direto');
            }
        } catch {
            toast.error('Erro ao importar da proposta');
        }
    };

    const addDirectBillingItem = () => {
        setDirectBillingItems(prev => [...prev, {
            supplier: '', cnpj: '', material: '', quantity: 1, unitPrice: 0, total: 0,
        }]);
    };

    const updateDirectBillingItem = (idx: number, field: keyof DirectBillingItem, value: any) => {
        setDirectBillingItems(prev => {
            const items = [...prev];
            (items[idx] as any)[field] = value;
            if (field === 'quantity' || field === 'unitPrice') {
                items[idx].total = Number(items[idx].quantity) * Number(items[idx].unitPrice);
            }
            return items;
        });
    };

    const removeDirectBillingItem = (idx: number) => {
        setDirectBillingItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!contractVal || contractVal <= 0) {
            toast.error('Informe o valor do contrato');
            return;
        }
        if (!execPercent || execPercent <= 0) {
            toast.error('Informe o percentual executado');
            return;
        }
        if (execPercent + accumulatedPercentage > 100) {
            toast.error('Percentual acumulado não pode ultrapassar 100%');
            return;
        }

        setSaving(true);
        try {
            const data = {
                workId,
                description: description || `Medição ${(measurements.length || 0) + 1}`,
                contractValue: contractVal,
                directBillingTotal,
                directBillingItems: directBillingItems.length > 0 ? JSON.stringify(directBillingItems) : null,
                executedPercentage: execPercent,
                startDate: startDate || null,
                endDate: endDate || null,
                notes: notes || null,
                proposalId: selectedProposalId || null,
            };

            if (selectedMeasurement?.id) {
                await api.updateMeasurement(selectedMeasurement.id, data);
                toast.success('Medição atualizada!');
            } else {
                await api.createMeasurement(data);
                toast.success('Medição criada com sucesso!');
            }

            await loadData();
            onSuccess();
            setMode('list');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Erro ao salvar medição');
        }
        setSaving(false);
    };

    const handleApprove = async (id: string) => {
        try {
            await api.approveMeasurement(id);
            toast.success('Medição aprovada! Conta a receber gerada.');
            await loadData();
            setMode('list');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao aprovar medição');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta medição?')) return;
        try {
            await api.deleteMeasurement(id);
            toast.success('Medição excluída');
            await loadData();
            setMode('list');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao excluir medição');
        }
    };

    const handleViewMeasurement = (m: any) => {
        setSelectedMeasurement(m);
        setDescription(m.description || '');
        setContractValue(m.contractValue?.toString() || '');
        setExecutedPercentage(m.executedPercentage?.toString() || '');
        setStartDate(m.startDate ? m.startDate.split('T')[0] : '');
        setEndDate(m.endDate ? m.endDate.split('T')[0] : '');
        setNotes(m.notes || '');
        setSelectedProposalId(m.proposalId || '');
        if (m.directBillingItems) {
            try {
                setDirectBillingItems(JSON.parse(m.directBillingItems));
            } catch { setDirectBillingItems([]); }
        } else {
            setDirectBillingItems([]);
        }
        setMode(m.status === 'draft' ? 'create' : 'view');
    };

    const generatePDF = (m: any) => {
        const items = m.directBillingItems ? JSON.parse(m.directBillingItems) : [];
        const contractVal = Number(m.contractValue || 0);
        const directTotal = Number(m.directBillingTotal || 0);
        const base = contractVal - directTotal;
        const execPct = Number(m.executedPercentage || 0);
        const accPct = Number(m.accumulatedPercentage || 0);
        const totalAmt = Number(m.totalAmount || 0);
        const net = Number(m.netAmount || 0);
        const retention = Number(m.retentionAmount || 0);
        const tax = Number(m.taxAmount || 0);

        const workTitle = m.work?.title || work?.title || 'Obra';
        const clientName = m.work?.client?.name || work?.client?.name || '—';
        const workCode = m.work?.code || work?.code || '';

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Boletim de Medição #${m.number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; padding: 30px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #e67e22; padding-bottom: 15px; margin-bottom: 20px; }
  .header h1 { font-size: 20px; color: #e67e22; }
  .header .info { text-align: right; font-size: 10px; color: #666; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 13px; font-weight: 700; color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 10px; }
  th { background: #2c3e50; color: #fff; font-weight: 600; }
  tr:nth-child(even) { background: #f9f9f9; }
  .text-right { text-align: right; }
  .summary-box { background: #f8f9fa; border: 2px solid #e67e22; border-radius: 8px; padding: 15px; margin: 20px 0; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
  .summary-row.total { font-weight: 700; font-size: 13px; border-top: 2px solid #e67e22; margin-top: 8px; padding-top: 8px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
  .sig-block { text-align: center; width: 40%; }
  .sig-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 600; }
  .badge-draft { background: #ffeaa7; color: #d35400; }
  .badge-approved { background: #d5f4e6; color: #27ae60; }
  @media print { body { padding: 15px; } }
</style>
</head><body>
<div class="header">
  <div>
    <h1>BOLETIM DE MEDIÇÃO Nº ${String(m.number).padStart(3, '0')}</h1>
    <p style="font-size: 10px; color: #7f8c8d;">Documento de controle financeiro da obra</p>
  </div>
  <div class="info">
    <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
    <p><strong>Código:</strong> ${workCode}</p>
    <p><span class="badge ${m.status === 'approved' ? 'badge-approved' : 'badge-draft'}">${m.status === 'approved' ? 'APROVADO' : 'RASCUNHO'}</span></p>
  </div>
</div>

<div class="section">
  <div class="section-title">Dados da Obra</div>
  <table>
    <tr><td style="width:20%;font-weight:600;">Obra:</td><td>${workTitle}</td><td style="width:20%;font-weight:600;">Cliente:</td><td>${clientName}</td></tr>
    ${m.description ? `<tr><td style="font-weight:600;">Descrição:</td><td colspan="3">${m.description}</td></tr>` : ''}
    ${m.startDate || m.endDate ? `<tr><td style="font-weight:600;">Período:</td><td colspan="3">${m.startDate ? new Date(m.startDate).toLocaleDateString('pt-BR') : '—'} a ${m.endDate ? new Date(m.endDate).toLocaleDateString('pt-BR') : '—'}</td></tr>` : ''}
  </table>
</div>

${items.length > 0 ? `
<div class="section">
  <div class="section-title">Faturamento Direto (Materiais Debitados)</div>
  <table>
    <thead><tr><th>Fornecedor</th><th>CNPJ</th><th>Material</th><th class="text-right">Qtd</th><th class="text-right">Preço Unit.</th><th class="text-right">Total</th></tr></thead>
    <tbody>
      ${items.map((it: any) => `<tr><td>${it.supplier || it.fornecedor || ''}</td><td>${it.cnpj || ''}</td><td>${it.material || it.item || ''}</td><td class="text-right">${it.quantity || it.quantidade || 1}</td><td class="text-right">R$ ${fmt(Number(it.unitPrice || it.precoUnit || 0))}</td><td class="text-right">R$ ${fmt(Number(it.total || 0))}</td></tr>`).join('')}
      <tr style="font-weight:700;background:#ecf0f1;"><td colspan="5">Total Faturamento Direto</td><td class="text-right">R$ ${fmt(directTotal)}</td></tr>
    </tbody>
  </table>
</div>` : ''}

<div class="section">
  <div class="section-title">Resumo da Medição</div>
  <div class="summary-box">
    <div class="summary-row"><span>Valor do Contrato:</span><span>R$ ${fmt(contractVal)}</span></div>
    ${directTotal > 0 ? `<div class="summary-row" style="color:#e74c3c;"><span>(-) Faturamento Direto:</span><span>- R$ ${fmt(directTotal)}</span></div>` : ''}
    <div class="summary-row" style="font-weight:600;"><span>Saldo Base:</span><span>R$ ${fmt(base)}</span></div>
    <div class="summary-row"><span>% Executado (esta medição):</span><span>${execPct.toFixed(2)}%</span></div>
    <div class="summary-row"><span>% Acumulado:</span><span>${accPct.toFixed(2)}%</span></div>
    <div class="summary-row total"><span>Valor da Medição:</span><span>R$ ${fmt(totalAmt)}</span></div>
    ${retention > 0 ? `<div class="summary-row" style="color:#e74c3c;"><span>(-) Retenção:</span><span>- R$ ${fmt(retention)}</span></div>` : ''}
    ${tax > 0 ? `<div class="summary-row" style="color:#e74c3c;"><span>(-) Impostos:</span><span>- R$ ${fmt(tax)}</span></div>` : ''}
    <div class="summary-row total" style="color:#27ae60;"><span>Valor Líquido:</span><span>R$ ${fmt(net)}</span></div>
    <div class="summary-row" style="margin-top:8px;"><span>Saldo Restante:</span><span>R$ ${fmt(base - (accPct / 100 * base))}</span></div>
    <div class="summary-row"><span>% Restante:</span><span>${(100 - accPct).toFixed(2)}%</span></div>
  </div>
</div>

${m.notes ? `<div class="section"><div class="section-title">Observações</div><p style="font-size:10px;line-height:1.5;">${m.notes}</p></div>` : ''}

<div class="signatures">
  <div class="sig-block"><div class="sig-line">Contratante</div></div>
  <div class="sig-block"><div class="sig-line">Contratada</div></div>
</div>
</body></html>`;

        const w = window.open('', '_blank');
        if (w) {
            w.document.write(html);
            w.document.close();
            setTimeout(() => w.print(), 500);
        }
    };

    const statusLabel: Record<string, string> = {
        draft: 'Rascunho', pending: 'Pendente', approved: 'Aprovado',
        billed: 'Faturado', paid: 'Pago',
    };
    const statusColor: Record<string, string> = {
        draft: 'bg-amber-100 text-amber-700', pending: 'bg-blue-100 text-blue-700',
        approved: 'bg-green-100 text-green-700', billed: 'bg-purple-100 text-purple-700',
        paid: 'bg-emerald-100 text-emerald-700',
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setMode('list'); onClose(); } }}>
            <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">
                                {mode === 'list' ? 'Boletim de Medição' : mode === 'create' ? (selectedMeasurement ? 'Editar Medição' : 'Nova Medição') : `Medição #${selectedMeasurement?.number}`}
                            </DialogTitle>
                            <DialogDescription>
                                {mode === 'list' ? 'Controle financeiro por medição da obra' : 'Preencha os dados da medição'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                ) : mode === 'list' ? (
                    <div className="space-y-4">
                        {/* Resumo do saldo */}
                        {balance && (balance.contractValue > 0 || measurements.length > 0) && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-blue-500 uppercase font-semibold">Contrato</p>
                                    <p className="text-sm font-bold text-blue-800">R$ {fmt(balance.contractValue)}</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-red-500 uppercase font-semibold">Fat. Direto</p>
                                    <p className="text-sm font-bold text-red-700">R$ {fmt(balance.directBillingTotal)}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-green-500 uppercase font-semibold">Executado</p>
                                    <p className="text-sm font-bold text-green-800">R$ {fmt(balance.totalExecuted)} ({balance.totalExecutedPercentage?.toFixed(1)}%)</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-amber-500 uppercase font-semibold">Saldo</p>
                                    <p className="text-sm font-bold text-amber-800">R$ {fmt(balance.remainingBalance)}</p>
                                </div>
                            </div>
                        )}

                        {/* Lista de medições */}
                        {measurements.length === 0 ? (
                            <div className="text-center py-8">
                                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Nenhuma medição registrada</p>
                                <p className="text-xs text-slate-400 mt-1">Clique em "Nova Medição" para começar</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {measurements.map((m: any) => (
                                    <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-orange-300 transition cursor-pointer"
                                        onClick={() => handleViewMeasurement(m)}>
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                            <span className="text-sm font-bold text-orange-600">#{m.number}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800">{m.description || `Medição #${m.number}`}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>{Number(m.executedPercentage || 0).toFixed(1)}% executado</span>
                                                <span>•</span>
                                                <span>R$ {fmt(Number(m.totalAmount || 0))}</span>
                                                {m.startDate && <><span>•</span><span>{new Date(m.startDate).toLocaleDateString('pt-BR')}</span></>}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[m.status] || 'bg-slate-100'}`}>
                                            {statusLabel[m.status] || m.status}
                                        </span>
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); generatePDF(m); }}>
                                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                            </Button>
                                            {m.status === 'draft' && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}>
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setMode('list'); onClose(); }}>Fechar</Button>
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleNewMeasurement}>
                                <Plus className="w-4 h-4 mr-1" /> Nova Medição
                            </Button>
                        </DialogFooter>
                    </div>
                ) : mode === 'view' ? (
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-slate-500">Contrato:</span> <strong>R$ {fmt(Number(selectedMeasurement?.contractValue || 0))}</strong></div>
                                <div><span className="text-slate-500">Fat. Direto:</span> <strong className="text-red-600">R$ {fmt(Number(selectedMeasurement?.directBillingTotal || 0))}</strong></div>
                                <div><span className="text-slate-500">Saldo Base:</span> <strong>R$ {fmt(Number(selectedMeasurement?.baseValue || 0))}</strong></div>
                                <div><span className="text-slate-500">% Executado:</span> <strong>{Number(selectedMeasurement?.executedPercentage || 0).toFixed(2)}%</strong></div>
                                <div><span className="text-slate-500">Valor Medição:</span> <strong className="text-green-700">R$ {fmt(Number(selectedMeasurement?.totalAmount || 0))}</strong></div>
                                <div><span className="text-slate-500">Valor Líquido:</span> <strong className="text-emerald-700">R$ {fmt(Number(selectedMeasurement?.netAmount || 0))}</strong></div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setMode('list')}>Voltar</Button>
                            <Button variant="outline" onClick={() => generatePDF(selectedMeasurement)}>
                                <Download className="w-4 h-4 mr-1" /> PDF
                            </Button>
                            {selectedMeasurement?.status === 'draft' && (
                                <>
                                    <Button variant="outline" className="text-red-600" onClick={() => handleDelete(selectedMeasurement.id)}>
                                        <Trash2 className="w-4 h-4 mr-1" /> Excluir
                                    </Button>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(selectedMeasurement.id)}>
                                        <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </div>
                ) : (
                    /* CREATE/EDIT MODE */
                    <div className="space-y-5">
                        {/* Descrição e Período */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-3">
                                <Label>Descrição</Label>
                                <Input placeholder="Ex: Medição referente ao mês de março" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div>
                                <Label>Data Início</Label>
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <Label>Data Fim</Label>
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            <div>
                                <Label>Valor do Contrato (R$) *</Label>
                                <Input type="text" inputMode="decimal" placeholder="100000.00"
                                    value={contractValue} onChange={e => setContractValue(e.target.value)} />
                            </div>
                        </div>

                        {/* Importar de proposta */}
                        {proposals.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-semibold text-blue-700">Importar Faturamento Direto de Proposta</span>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={selectedProposalId} onValueChange={setSelectedProposalId}>
                                        <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Selecione a proposta" /></SelectTrigger>
                                        <SelectContent>
                                            {proposals.map((p: any) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.proposalNumber || p.id.slice(0, 8)} — {p.title || p.description || 'Proposta'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" variant="outline" className="h-8 text-xs"
                                        disabled={!selectedProposalId} onClick={() => importFromProposal(selectedProposalId)}>
                                        Importar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Faturamento Direto */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" /> Faturamento Direto
                                </h3>
                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addDirectBillingItem}>
                                    <Plus className="w-3 h-3" /> Adicionar
                                </Button>
                            </div>

                            {directBillingItems.length > 0 && (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Fornecedor</th>
                                                <th className="px-2 py-1.5 text-left font-semibold text-slate-600">CNPJ</th>
                                                <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Material</th>
                                                <th className="px-2 py-1.5 text-right font-semibold text-slate-600">Qtd</th>
                                                <th className="px-2 py-1.5 text-right font-semibold text-slate-600">Preço Unit.</th>
                                                <th className="px-2 py-1.5 text-right font-semibold text-slate-600">Total</th>
                                                <th className="w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {directBillingItems.map((item, idx) => (
                                                <tr key={idx} className="border-t border-slate-100">
                                                    <td className="px-1 py-1"><Input className="h-7 text-xs" value={item.supplier} onChange={e => updateDirectBillingItem(idx, 'supplier', e.target.value)} placeholder="Fornecedor" /></td>
                                                    <td className="px-1 py-1"><Input className="h-7 text-xs" value={item.cnpj} onChange={e => updateDirectBillingItem(idx, 'cnpj', e.target.value)} placeholder="CNPJ" /></td>
                                                    <td className="px-1 py-1"><Input className="h-7 text-xs" value={item.material} onChange={e => updateDirectBillingItem(idx, 'material', e.target.value)} placeholder="Material" /></td>
                                                    <td className="px-1 py-1 w-16"><Input type="number" className="h-7 text-xs text-right" value={item.quantity} onChange={e => updateDirectBillingItem(idx, 'quantity', Number(e.target.value))} /></td>
                                                    <td className="px-1 py-1 w-24"><Input type="number" step="0.01" className="h-7 text-xs text-right" value={item.unitPrice} onChange={e => updateDirectBillingItem(idx, 'unitPrice', Number(e.target.value))} /></td>
                                                    <td className="px-1 py-1 w-24 text-right font-medium text-slate-700">R$ {fmt(item.total)}</td>
                                                    <td className="px-1 py-1"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDirectBillingItem(idx)}><X className="w-3 h-3 text-red-400" /></Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-red-50 font-semibold text-red-700">
                                                <td colSpan={5} className="px-2 py-1.5 text-right">Total Faturamento Direto:</td>
                                                <td className="px-2 py-1.5 text-right">R$ {fmt(directBillingTotal)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Percentual e Cálculos */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Calculator className="w-4 h-4 text-orange-600" />
                                <span className="text-sm font-semibold text-orange-700">Cálculo da Medição</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="bg-white rounded p-2 text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">Saldo Base</p>
                                    <p className="text-sm font-bold text-slate-800">R$ {fmt(baseValue)}</p>
                                </div>
                                <div className="bg-white rounded p-2 text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">Acumulado Anterior</p>
                                    <p className="text-sm font-bold text-blue-700">{accumulatedPercentage.toFixed(1)}% (R$ {fmt(accumulatedTotal)})</p>
                                </div>
                                <div className="bg-white rounded p-2">
                                    <Label className="text-[10px] uppercase">% Executado (esta medição) *</Label>
                                    <Input type="number" step="0.01" min="0" max={100 - accumulatedPercentage}
                                        className="h-8 text-sm font-bold text-center mt-1"
                                        value={executedPercentage} onChange={e => setExecutedPercentage(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-orange-200">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">Valor da Medição</p>
                                    <p className="text-lg font-bold text-green-700">R$ {fmt(measurementValue)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">Saldo Restante</p>
                                    <p className="text-lg font-bold text-amber-700">R$ {fmt(Math.max(0, remainingBalance))}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">% Restante</p>
                                    <p className="text-lg font-bold text-slate-700">{Math.max(0, remainingPercentage).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Observações */}
                        <div>
                            <Label>Observações</Label>
                            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações adicionais..." />
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => { setSelectedMeasurement(null); setMode('list'); }}>Cancelar</Button>
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white" disabled={saving} onClick={handleSave}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {saving ? 'Salvando...' : selectedMeasurement ? 'Atualizar Medição' : 'Criar Medição'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
