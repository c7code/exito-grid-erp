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
    Calculator, ClipboardList, Building2, Percent, DollarSign, ArrowLeftRight,
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
    const [manualValue, setManualValue] = useState('');
    const [inputMode, setInputMode] = useState<'percentage' | 'value'>('percentage');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');
    const [directBillingItems, setDirectBillingItems] = useState<DirectBillingItem[]>([]);
    const [selectedProposalId, setSelectedProposalId] = useState('');

    const directBillingTotal = directBillingItems.reduce((s, i) => s + (i.total || 0), 0);
    const contractVal = parsePrice(contractValue);
    const baseValue = contractVal - directBillingTotal;

    // Bi-directional: percentage ↔ value
    const execPercent = inputMode === 'percentage'
        ? parsePrice(executedPercentage)
        : (baseValue > 0 ? (parsePrice(manualValue) / baseValue) * 100 : 0);
    const measurementValue = inputMode === 'value'
        ? parsePrice(manualValue)
        : baseValue * (execPercent / 100);

    // Accumulated from previous approved measurements
    const accumulatedTotal = balance?.totalExecuted || 0;
    const accumulatedPercentage = balance?.totalExecutedPercentage || 0;
    const remainingBalance = baseValue - accumulatedTotal - measurementValue;
    const remainingPercentage = 100 - accumulatedPercentage - execPercent;

    // Sync handlers: when user types %, auto-fill R$ and vice-versa
    const handlePercentChange = (val: string) => {
        setExecutedPercentage(val);
        const pct = parsePrice(val);
        if (baseValue > 0 && pct >= 0) {
            setManualValue((baseValue * (pct / 100)).toFixed(2));
        }
    };
    const handleValueChange = (val: string) => {
        setManualValue(val);
        const v = parsePrice(val);
        if (baseValue > 0 && v >= 0) {
            setExecutedPercentage(((v / baseValue) * 100).toFixed(2));
        }
    };

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
        setManualValue('');
        setInputMode('percentage');
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
        const remainPct = 100 - accPct;
        const remainVal = base - (accPct / 100 * base);

        const workTitle = m.work?.title || work?.title || 'Obra';
        const clientName = m.work?.client?.name || work?.client?.name || '—';
        const clientDoc = m.work?.client?.cpfCnpj || work?.client?.cpfCnpj || '';
        const clientPhone = m.work?.client?.phone || work?.client?.phone || '';
        const clientEmail = m.work?.client?.email || work?.client?.email || '';
        const clientAddress = [
          m.work?.client?.address || work?.client?.address || '',
          m.work?.client?.city || work?.client?.city || '',
          m.work?.client?.state || work?.client?.state || '',
        ].filter(Boolean).join(', ') || '—';
        const workCode = m.work?.code || work?.code || '';
        const workAddress = [work?.address, work?.city, work?.state].filter(Boolean).join(', ') || '—';
        const workType = work?.type || '';
        const measDate = new Date().toLocaleDateString('pt-BR');
        const measNum = String(m.number).padStart(3, '0');
        const periodStart = m.startDate ? new Date(m.startDate).toLocaleDateString('pt-BR') : '—';
        const periodEnd = m.endDate ? new Date(m.endDate).toLocaleDateString('pt-BR') : '—';

        const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Boletim de Medição Nº ${measNum}</title>
<style>
  @page { size: A4; margin: 20mm 15mm 25mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', 'Georgia', serif; font-size: 11pt; color: #111; line-height: 1.5; }
  .page { max-width: 210mm; margin: 0 auto; padding: 15mm; }

  /* Header */
  .doc-header { border: 2px solid #1a1a2e; padding: 15px; margin-bottom: 20px; }
  .doc-header-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px; }
  .doc-header h1 { font-size: 16pt; font-weight: 700; color: #1a1a2e; letter-spacing: 1px; }
  .doc-header .doc-number { font-size: 22pt; font-weight: 700; color: #b45309; }
  .doc-header .doc-meta { display: flex; justify-content: space-between; font-size: 9pt; color: #555; }

  /* Sections */
  .section { margin-bottom: 16px; }
  .section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1a1a2e; background: #f0f0f0; padding: 5px 10px; border-left: 4px solid #b45309; margin-bottom: 8px; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9pt; }
  th { background: #1a1a2e; color: #fff; font-weight: 600; padding: 6px 8px; text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; }
  td { border: 1px solid #ccc; padding: 5px 8px; }
  .info-table td { border: none; padding: 3px 8px; }
  .info-table td.label { font-weight: 600; color: #555; width: 25%; background: #fafafa; }
  tr:nth-child(even) td { background: #fafafa; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  /* Financial summary */
  .financial-table { border: 2px solid #1a1a2e; }
  .financial-table td { font-size: 10pt; padding: 7px 12px; }
  .financial-table tr.highlight { background: #f0f7ff !important; }
  .financial-table tr.highlight td { font-weight: 700; font-size: 11pt; }
  .financial-table tr.deduction td { color: #c0392b; }
  .financial-table tr.total-row { background: #1a1a2e !important; }
  .financial-table tr.total-row td { color: #fff; font-weight: 700; font-size: 12pt; }
  .financial-table tr.net-row { background: #27ae60 !important; }
  .financial-table tr.net-row td { color: #fff; font-weight: 700; font-size: 12pt; }

  /* Progress bar */
  .progress-container { margin: 15px 0; }
  .progress-bar-bg { width: 100%; height: 16px; background: #e9ecef; border-radius: 8px; overflow: hidden; border: 1px solid #ccc; }
  .progress-bar-fill { height: 100%; border-radius: 8px; transition: width 0.3s; display: flex; align-items: center; justify-content: center; font-size: 8pt; color: #fff; font-weight: 700; }
  .progress-labels { display: flex; justify-content: space-between; margin-top: 4px; font-size: 8pt; color: #666; }

  /* Signatures */
  .signatures { display: flex; justify-content: space-between; margin-top: 50px; gap: 30px; }
  .sig-block { flex: 1; text-align: center; }
  .sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; font-size: 9pt; font-weight: 600; }
  .sig-detail { font-size: 8pt; color: #666; margin-top: 2px; }

  /* Footer */
  .doc-footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 8pt; color: #888; text-align: center; }

  .clause { font-size: 9pt; color: #555; font-style: italic; margin-top: 10px; padding: 8px 12px; background: #f9f9f9; border-left: 3px solid #ddd; }

  @media print {
    body { padding: 0; }
    .page { padding: 0; max-width: 100%; }
    .no-print { display: none; }
  }
</style>
</head><body>
<div class="page">

  <!-- HEADER -->
  <div class="doc-header">
    <div class="doc-header-top">
      <div>
        <h1>BOLETIM DE MEDIÇÃO</h1>
        <p style="font-size: 9pt; color: #666; margin-top: 2px;">Documento de Controle e Acompanhamento Financeiro de Obra</p>
      </div>
      <div style="text-align: right;">
        <div class="doc-number">Nº ${measNum}</div>
      </div>
    </div>
    <div class="doc-meta">
      <span><strong>Código da Obra:</strong> ${workCode}</span>
      <span><strong>Data de Emissão:</strong> ${measDate}</span>
      <span><strong>Período:</strong> ${periodStart} a ${periodEnd}</span>
    </div>
  </div>

  <!-- DADOS DA OBRA -->
  <div class="section">
    <div class="section-title">1. Identificação da Obra</div>
    <table class="info-table">
      <tr><td class="label">Obra / Projeto:</td><td colspan="3"><strong>${workTitle}</strong></td></tr>
      <tr><td class="label">Endereço:</td><td colspan="3">${workAddress}</td></tr>
      ${workType ? `<tr><td class="label">Tipo de Obra:</td><td colspan="3">${workType}</td></tr>` : ''}
      ${m.description ? `<tr><td class="label">Descrição:</td><td colspan="3">${m.description}</td></tr>` : ''}
    </table>
  </div>

  <!-- DADOS DO CONTRATANTE -->
  <div class="section">
    <div class="section-title">2. Identificação do Contratante</div>
    <table class="info-table">
      <tr><td class="label">Contratante:</td><td><strong>${clientName}</strong></td><td class="label">CPF/CNPJ:</td><td>${clientDoc || '—'}</td></tr>
      <tr><td class="label">Endereço:</td><td>${clientAddress}</td><td class="label">Contato:</td><td>${clientPhone || clientEmail || '—'}</td></tr>
    </table>
  </div>

  ${items.length > 0 ? `
  <!-- FATURAMENTO DIRETO -->
  <div class="section">
    <div class="section-title">3. Materiais de Faturamento Direto</div>
    <p style="font-size: 9pt; color: #555; margin-bottom: 6px;">Materiais adquiridos diretamente pelo contratante, debitados do valor do contrato:</p>
    <table>
      <thead>
        <tr><th>Item</th><th>Fornecedor</th><th>CNPJ</th><th>Material / Descrição</th><th class="text-right">Qtd</th><th class="text-right">Preço Unit. (R$)</th><th class="text-right">Total (R$)</th></tr>
      </thead>
      <tbody>
        ${items.map((it: any, i: number) => `<tr><td class="text-center">${i + 1}</td><td>${it.supplier || it.fornecedor || ''}</td><td>${it.cnpj || ''}</td><td>${it.material || it.item || ''}</td><td class="text-right">${it.quantity || it.quantidade || 1}</td><td class="text-right">${fmt(Number(it.unitPrice || it.precoUnit || 0))}</td><td class="text-right">${fmt(Number(it.total || 0))}</td></tr>`).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight:700; background:#f5f5f5;"><td colspan="6" class="text-right"><strong>Total Faturamento Direto:</strong></td><td class="text-right"><strong>R$ ${fmt(directTotal)}</strong></td></tr>
      </tfoot>
    </table>
  </div>` : ''}

  <!-- DEMONSTRATIVO FINANCEIRO -->
  <div class="section">
    <div class="section-title">${items.length > 0 ? '4' : '3'}. Demonstrativo Financeiro da Medição</div>
    <table class="financial-table">
      <tr class="highlight"><td style="width:65%;">Valor Total do Contrato</td><td class="text-right">R$ ${fmt(contractVal)}</td></tr>
      ${directTotal > 0 ? `<tr class="deduction"><td>(-) Faturamento Direto (Materiais)</td><td class="text-right">- R$ ${fmt(directTotal)}</td></tr>` : ''}
      <tr style="font-weight:600; background: #e8f4fd;"><td><strong>Saldo Base para Medição</strong></td><td class="text-right"><strong>R$ ${fmt(base)}</strong></td></tr>
      <tr><td colspan="2" style="height: 5px; border: none; background: none;"></td></tr>
      <tr><td>Percentual Executado — Esta Medição</td><td class="text-right"><strong>${execPct.toFixed(2)}%</strong></td></tr>
      <tr><td>Percentual Acumulado — Medições Anteriores</td><td class="text-right">${(accPct - execPct >= 0 ? (accPct - execPct) : 0).toFixed(2)}%</td></tr>
      <tr style="font-weight:600;"><td>Percentual Acumulado Total</td><td class="text-right">${accPct.toFixed(2)}%</td></tr>
      <tr><td colspan="2" style="height: 5px; border: none; background: none;"></td></tr>
      <tr class="total-row"><td>VALOR DESTA MEDIÇÃO</td><td class="text-right">R$ ${fmt(totalAmt)}</td></tr>
      ${retention > 0 ? `<tr class="deduction"><td>(-) Retenção Contratual</td><td class="text-right">- R$ ${fmt(retention)}</td></tr>` : ''}
      ${tax > 0 ? `<tr class="deduction"><td>(-) Impostos Retidos</td><td class="text-right">- R$ ${fmt(tax)}</td></tr>` : ''}
      <tr class="net-row"><td>VALOR LÍQUIDO A RECEBER</td><td class="text-right">R$ ${fmt(net)}</td></tr>
    </table>
  </div>

  <!-- PROGRESSO -->
  <div class="section">
    <div class="section-title">${items.length > 0 ? '5' : '4'}. Progresso Acumulado da Obra</div>
    <div class="progress-container">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${Math.min(accPct, 100)}%; background: linear-gradient(90deg, #27ae60, #2ecc71);">${accPct.toFixed(1)}%</div>
      </div>
      <div class="progress-labels">
        <span>0%</span>
        <span>Executado: ${accPct.toFixed(1)}% (R$ ${fmt(base * accPct / 100)})</span>
        <span>Saldo: ${remainPct.toFixed(1)}% (R$ ${fmt(Math.max(0, remainVal))})</span>
        <span>100%</span>
      </div>
    </div>
    <table style="margin-top: 10px;">
      <thead><tr><th>Descrição</th><th class="text-right">Percentual</th><th class="text-right">Valor (R$)</th></tr></thead>
      <tbody>
        <tr><td>Executado até esta medição</td><td class="text-right">${accPct.toFixed(2)}%</td><td class="text-right">R$ ${fmt(base * accPct / 100)}</td></tr>
        <tr><td>Saldo a executar</td><td class="text-right">${remainPct.toFixed(2)}%</td><td class="text-right">R$ ${fmt(Math.max(0, remainVal))}</td></tr>
        <tr style="font-weight:700; background:#f0f0f0;"><td><strong>Total</strong></td><td class="text-right"><strong>100,00%</strong></td><td class="text-right"><strong>R$ ${fmt(base)}</strong></td></tr>
      </tbody>
    </table>
  </div>

  ${m.notes ? `
  <div class="section">
    <div class="section-title">${items.length > 0 ? '6' : '5'}. Observações</div>
    <p style="font-size: 9.5pt; line-height: 1.6; padding: 5px 0;">${m.notes}</p>
  </div>` : ''}

  <!-- CLÁUSULA -->
  <div class="clause">
    Declaramos que os serviços descritos neste boletim de medição foram executados conforme as especificações técnicas
    do contrato e que os valores apresentados correspondem ao trabalho efetivamente realizado no período indicado.
    Este documento é parte integrante do contrato firmado entre as partes.
  </div>

  <!-- ASSINATURAS -->
  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">CONTRATANTE</div>
      <div class="sig-detail">${clientName}</div>
      <div class="sig-detail">${clientDoc || ''}</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">CONTRATADA</div>
      <div class="sig-detail">Exito System</div>
      <div class="sig-detail"></div>
    </div>
    <div class="sig-block">
      <div class="sig-line">TESTEMUNHA</div>
      <div class="sig-detail">Nome / CPF</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="doc-footer">
    Documento gerado eletronicamente em ${measDate} pelo sistema Electraflow — Exito System<br/>
    Este documento não possui validade sem as devidas assinaturas das partes envolvidas.
  </div>
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
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm font-semibold text-orange-700">Cálculo da Medição</span>
                                </div>
                                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] gap-1 border-orange-300 text-orange-700 hover:bg-orange-100"
                                    onClick={() => setInputMode(prev => prev === 'percentage' ? 'value' : 'percentage')}>
                                    <ArrowLeftRight className="w-3 h-3" />
                                    {inputMode === 'percentage' ? 'Digitar Valor R$' : 'Digitar Percentual %'}
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white rounded p-2 text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">Saldo Base</p>
                                    <p className="text-sm font-bold text-slate-800">R$ {fmt(baseValue)}</p>
                                </div>
                                <div className="bg-white rounded p-2 text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">Acumulado Anterior</p>
                                    <p className="text-sm font-bold text-blue-700">{accumulatedPercentage.toFixed(1)}% (R$ {fmt(accumulatedTotal)})</p>
                                </div>

                                {/* INPUT: Percentual */}
                                <div className={`bg-white rounded p-2 ${inputMode === 'percentage' ? 'ring-2 ring-orange-400' : 'opacity-70'}`}>
                                    <Label className="text-[10px] uppercase flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> % Executado *
                                    </Label>
                                    <Input type="number" step="0.01" min="0" max={100 - accumulatedPercentage}
                                        className="h-8 text-sm font-bold text-center mt-1"
                                        value={executedPercentage}
                                        onChange={e => handlePercentChange(e.target.value)}
                                        readOnly={inputMode === 'value'}
                                        tabIndex={inputMode === 'value' ? -1 : 0} />
                                </div>

                                {/* INPUT: Valor Manual */}
                                <div className={`bg-white rounded p-2 ${inputMode === 'value' ? 'ring-2 ring-orange-400' : 'opacity-70'}`}>
                                    <Label className="text-[10px] uppercase flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> Valor R$ *
                                    </Label>
                                    <Input type="number" step="0.01" min="0"
                                        className="h-8 text-sm font-bold text-center mt-1"
                                        value={manualValue}
                                        onChange={e => handleValueChange(e.target.value)}
                                        readOnly={inputMode === 'percentage'}
                                        tabIndex={inputMode === 'percentage' ? -1 : 0}
                                        placeholder="0.00" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-orange-200">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">Valor da Medição</p>
                                    <p className="text-lg font-bold text-green-700">R$ {fmt(measurementValue)}</p>
                                    <p className="text-[10px] text-slate-400">{execPercent.toFixed(2)}% do saldo base</p>
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
