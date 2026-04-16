import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/api';
import { OeMProposalPDFTemplate } from './OeMProposalPDFTemplate';
import html2pdf from 'html2pdf.js';
import { FileText, Settings, Wrench, Package, ClipboardList,
    Plus, Trash2, Download, Eye, Loader2, ChevronRight,
    Sun, Zap, BarChart3, Shield, CreditCard, Scale, BookOpen,
    Building2, Hash, Clock,
} from 'lucide-react';
import OeMServiceItemsPanel, { type OemServiceItem } from './OeMServiceItemsPanel';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface OemMaterialItem {
    id: string;
    description: string;
    fornecedor: string;
    cnpjFornecedor: string;
    quantity: number;
    unitPrice: number;
    total: number;
    tipoLancamento: 'avulso' | 'faturamento_direto';
    ocultarValorPdf: boolean;
}

export interface OemSectionToggles {
    importancia: boolean;
    analise: boolean;
    diagnostico: boolean;
    beneficios: boolean;
    escopo: boolean;
    servicos: boolean;
    sla: boolean;
    garantias: boolean;
    investimento: boolean;
    pagamento: boolean;
    obrigacoes: boolean;
    disposicoes: boolean;
}

const DEFAULT_TOGGLES: OemSectionToggles = {
    importancia: true,
    analise: false,
    diagnostico: false,
    beneficios: false,
    escopo: true,
    servicos: true,
    sla: true,
    garantias: true,
    investimento: true,
    pagamento: true,
    obrigacoes: false,
    disposicoes: false,
};

const SECTION_META: { key: keyof OemSectionToggles; label: string; icon: any; desc: string; required?: boolean }[] = [
    { key: 'importancia', label: 'Importância da Manutenção', icon: Sun, desc: 'Texto padrão sobre perda de eficiência sem manutenção', required: true },
    { key: 'analise', label: 'Análise de Impacto & Retorno', icon: BarChart3, desc: 'Gráfico de geração esperada vs atual + perda financeira' },
    { key: 'diagnostico', label: 'Diagnóstico Técnico', icon: Zap, desc: 'Laudo técnico descritivo da situação atual do sistema' },
    { key: 'beneficios', label: 'Benefícios do Plano', icon: Shield, desc: 'Lista de vantagens e diferenciais do serviço' },
    { key: 'escopo', label: 'Escopo Técnico & Dados do Sistema', icon: Wrench, desc: 'Dados técnicos da usina e localização' },
    { key: 'servicos', label: 'Serviços Incluídos', icon: ClipboardList, desc: 'Tabela de serviços/itens a executar', required: true },
    { key: 'sla', label: 'Acordo de Nível de Serviço (SLA)', icon: Settings, desc: 'Tempos de resposta e monitoramento' },
    { key: 'garantias', label: 'Garantias & Conformidade', icon: Shield, desc: 'Normas técnicas (NBR 16690, NR-10, NR-35...)' },
    { key: 'investimento', label: 'Investimento', icon: CreditCard, desc: 'Tabela de preços dos serviços e total', required: true },
    { key: 'pagamento', label: 'Condições de Pagamento', icon: CreditCard, desc: 'Formas e prazos de pagamento', required: true },
    { key: 'obrigacoes', label: 'Obrigações das Partes', icon: Scale, desc: 'Responsabilidades da contratada e contratante' },
    { key: 'disposicoes', label: 'Disposições Gerais', icon: BookOpen, desc: 'Vigência, cancelamento, garantia de mão de obra, foro' },
];

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    servico: any; // OemServico completo
    onSaved?: () => void;
}

const genId = () => Math.random().toString(36).slice(2, 9);

const fmtCNPJ = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 14);
    return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
        .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, '$1.$2.$3/$4')
        .replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
        .replace(/^(\d{2})(\d{3})$/, '$1.$2')
        .replace(/^(\d{2})$/, '$1');
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function OeMProposalDialog({ open, onOpenChange, servico, onSaved }: Props) {
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);

    // ── Aba 1: Identificação
    const [title, setTitle] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [proposalMode, setProposalMode] = useState<'servico' | 'material' | 'misto'>('servico');
    const [displayMode, setDisplayMode] = useState<'com_valor' | 'sem_valor' | 'texto'>('com_valor');
    const [paymentConditions, setPaymentConditions] = useState('O pagamento será realizado mediante apresentação de Nota Fiscal, por meio de boleto bancário, PIX ou transferência, com vencimento em até 10 (dez) dias úteis após a conclusão dos serviços.');
    const [workDescription, setWorkDescription] = useState('');

    // ── Aba 2: Seções
    const [toggles, setToggles] = useState<OemSectionToggles>(DEFAULT_TOGGLES);

    // ── Aba 3: Serviços (lista unificada: checklist + extras)
    const [_originalChecklist, setOriginalChecklist] = useState<any[]>([]); // preserva o template original
    const [unifiedItems, setUnifiedItems] = useState<OemServiceItem[]>([]);
    const [oemDisplayMode, setOemDisplayMode] = useState<'com_valor' | 'sem_valor' | 'texto'>('com_valor');

    // ── Aba 4: Materiais
    const [materiais, setMateriais] = useState<OemMaterialItem[]>([]);
    const [incluirMateriaisNoTotal, setIncluirMateriaisNoTotal] = useState(false);
    const [exibirSubtotalMateriais, setExibirSubtotalMateriais] = useState(true);

    // ── Aba 5: Prazos
    const [workDeadlineDays, setWorkDeadlineDays] = useState('');
    const [workDeadlineType, setWorkDeadlineType] = useState<'calendar_days' | 'business_days'>('calendar_days');
    const [workDeadlineText, setWorkDeadlineText] = useState('');
    const [thirdPartyDeadlines, setThirdPartyDeadlines] = useState<{ name: string; days: string; type: string; description: string }[]>([]);

    // ── Aba 6: Textos
    const [diagnostico, setDiagnostico] = useState('');
    const [contractorObligations, setContractorObligations] = useState('');
    const [clientObligations, setClientObligations] = useState('');
    const [generalProvisions, setGeneralProvisions] = useState('');
    const [complianceText, setComplianceText] = useState('');
    const [beneficios, setBeneficios] = useState('');

    // ──────────────────────────── hydrate ──────────────────────────────────────
    useEffect(() => {
        if (!open || !servico) return;

        const tipoLabel: Record<string, string> = {
            preventiva: 'Manutenção Preventiva',
            preditiva: 'Manutenção Preditiva',
            corretiva: 'Manutenção Corretiva',
            limpeza: 'Limpeza de Módulos',
            inspecao: 'Inspeção Técnica',
            termografia: 'Termografia Infravermelha',
        };

        const defaultTitle = `${tipoLabel[servico.tipo] || 'Serviço O&M'} — ${servico.usina?.nome || 'Usina'}`;

        // Validade: 30 dias a partir de hoje
        const vDate = new Date();
        vDate.setDate(vDate.getDate() + 30);
        const defaultValidUntil = vDate.toISOString().split('T')[0];

        setTitle(servico.proposalTitle || defaultTitle);
        setValidUntil(servico.proposalValidUntil || defaultValidUntil);
        setProposalMode(servico.proposalMode || 'servico');
        setIncluirMateriaisNoTotal(servico.incluirMateriaisNoTotal ?? false);

        // Toggles
        try {
            const savedToggles = servico.sectionToggles ? JSON.parse(servico.sectionToggles) : null;
            setToggles(savedToggles ?? DEFAULT_TOGGLES);
            // Carregar toggle de subtotal de materiais (default: true)
            if (savedToggles?.subtotalMateriais !== undefined) {
                setExibirSubtotalMateriais(savedToggles.subtotalMateriais);
            } else {
                setExibirSubtotalMateriais(true);
            }
        } catch { setToggles(DEFAULT_TOGGLES); setExibirSubtotalMateriais(true); }

        // Materiais
        try {
            const savedMateriais = servico.oemMateriais ? JSON.parse(servico.oemMateriais) : [];
            setMateriais(savedMateriais);
        } catch { setMateriais([]); }

        // Checklist original (preservado para compatibilidade do plano)
        let cl: any[] = [];
        try {
            cl = servico.checklist ? JSON.parse(servico.checklist) : [];
        } catch { cl = []; }
        setOriginalChecklist(cl);

        // Extra items livres (salvos em oemExtraItems)
        let savedExtras: OemServiceItem[] = [];
        try {
            const parsed = servico.oemExtraItems ? JSON.parse(servico.oemExtraItems) : [];
            savedExtras = Array.isArray(parsed) ? parsed : [];
        } catch { savedExtras = []; }

        // Se os extras já contêm itens com _source=checklist (já foram unificados antes), usar direto
        const alreadyUnified = savedExtras.some((i: any) => i._source === 'checklist');
        if (alreadyUnified || savedExtras.length > 0) {
            // Merge: itens salvos + checklist items que ainda não foram adicionados
            const savedCheckDescriptions = new Set(savedExtras.filter((i: any) => i._source === 'checklist').map((i: any) => i.description));
            const missingCheckItems = cl
                .filter((c: any) => c.checked !== false && !savedCheckDescriptions.has(c.item))
                .map((c: any) => ({
                    id: genId(),
                    description: c.item,
                    unit: 'SV',
                    serviceType: 'service' as const,
                    unitPrice: String(c.valorDireto || 0),
                    quantity: '1',
                    showDetailedPrices: true,
                    showGroupTitle: true,
                    _source: 'checklist' as const,
                } as OemServiceItem));
            if (alreadyUnified) {
                // Já foi salvo unificado — apenas injetar novos itens do template que possam ter sido adicionados depois
                setUnifiedItems([...savedExtras, ...missingCheckItems]);
            } else {
                // Primeira unificação: checklist convertido + extras existentes
                const checkConverted = cl.filter((c: any) => c.checked !== false).map((c: any) => ({
                    id: genId(),
                    description: c.item,
                    unit: 'SV',
                    serviceType: 'service' as const,
                    unitPrice: String(c.valorDireto || 0),
                    quantity: '1',
                    showDetailedPrices: true,
                    showGroupTitle: true,
                    _source: 'checklist' as const,
                } as OemServiceItem));
                setUnifiedItems([...checkConverted, ...savedExtras.map((i: any) => ({ ...i, _source: i._source || 'extra' }))]);
            }
        } else {
            // Primeira vez (nenhum extra salvo): converter checklist para unified format
            const checkItems = cl
                .filter((c: any) => c.checked !== false)
                .map((c: any) => ({
                    id: genId(),
                    description: c.item,
                    unit: 'SV',
                    serviceType: 'service' as const,
                    unitPrice: String(c.valorDireto || 0),
                    quantity: '1',
                    showDetailedPrices: true,
                    showGroupTitle: true,
                    _source: 'checklist' as const,
                } as OemServiceItem));
            setUnifiedItems(checkItems);
        }

        // Display mode dos itens
        setOemDisplayMode(servico.oemItemDisplayMode || 'com_valor');

        // Prazos
        setWorkDeadlineDays(servico.workDeadlineDays || '');
        setWorkDeadlineType(servico.workDeadlineType || 'calendar_days');
        setWorkDeadlineText(servico.workDeadlineText || '');
        try {
            const tp = servico.thirdPartyDeadlines ? JSON.parse(servico.thirdPartyDeadlines) : [];
            setThirdPartyDeadlines(Array.isArray(tp) ? tp : []);
        } catch { setThirdPartyDeadlines([]); }

        // Textos defaults (podem ter sido salvos no servico)
        setDiagnostico(servico.diagnostico || '');
        setWorkDescription(servico.descricao || defaultTitle);
        setBeneficios(servico.recomendacoes || '• Maximização da eficiência de geração\n• Preservação da vida útil dos equipamentos\n• Conformidade com normas técnicas vigentes\n• Relatório técnico detalhado pós-serviço');
        setContractorObligations(servico.contractorObligations || '1. Executar os serviços com pessoal técnico qualificado conforme NR-10 e NR-35.\n2. Fornecer todos os EPIs e EPCs necessários.\n3. Emitir relatório técnico ao final de cada intervenção.\n4. Comunicar imediatamente irregularidades identificadas.');
        setClientObligations(servico.clientObligations || '1. Garantir acesso seguro ao local na data agendada.\n2. Disponibilizar ponto de energia quando necessário.\n3. Efetuar o pagamento nos termos estabelecidos.');
        setGeneralProvisions(servico.generalProvisions || '• Vigência: Esta proposta tem validade de 30 dias.\n• Materiais de reposição: orçados separadamente.\n• Garantia de mão de obra: 90 dias após conclusão.\n• Foro: Comarca de Recife/PE.');
        setComplianceText(servico.complianceText || 'Serviços executados conforme:\n▸ NBR 16690 — Instalações de arranjos fotovoltaicos\n▸ NR-10 — Segurança em Instalações Elétricas\n▸ NR-35 — Trabalho em Altura\n▸ IEC 62446 — Comissionamento e inspeção de sistemas FV');
        setPaymentConditions(servico.paymentConditions || 'O pagamento será realizado mediante apresentação de Nota Fiscal, por meio de boleto bancário, PIX ou transferência, com vencimento em até 10 (dez) dias úteis após a conclusão dos serviços e emissão do relatório técnico.');

        // Load company
        api.getPrimaryCompany().then(setCompany).catch(() => { });
    }, [open, servico]);

    // ─── Cálculos ─────────────────────────────────────────────────────────────
    const totalMateriais = materiais.reduce((s, m) => s + (Number(m.total) || 0), 0);

    // Helper para cálculo de totais dos itens
    const parseNum = (v: string | number): number => {
        if (typeof v === 'number') return isNaN(v) ? 0 : v;
        const s = String(v || '').trim();
        if (!s) return 0;
        const n = s.includes(',') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s);
        return isNaN(n) ? 0 : n;
    };
    const getItemTotal = (item: OemServiceItem): number => {
        if (item.isBundleParent) {
            const pQty = Math.max(parseNum(item.quantity) || 1, 1);
            if (item.overridePrice && item.overridePrice.trim() !== '') return parseNum(item.overridePrice) * pQty;
            return unifiedItems.filter(i => i.parentId === item.id)
                .reduce((s, i) => s + parseNum(i.unitPrice) * Math.max(parseNum(i.quantity) || 1, 0), 0) * pQty;
        }
        if (item.parentId) {
            const parent = unifiedItems.find(i => i.id === item.parentId);
            const pQty = parent ? Math.max(parseNum(parent.quantity) || 1, 1) : 1;
            return parseNum(item.unitPrice) * Math.max(parseNum(item.quantity) || 1, 0) * pQty;
        }
        return parseNum(item.unitPrice) * Math.max(parseNum(item.quantity) || 1, 0);
    };

    // Total combinado (itens unificados)
    const totalServicos = unifiedItems.filter(i => !i.parentId).reduce((s, i) => s + getItemTotal(i), 0);
    const grandTotal = incluirMateriaisNoTotal ? totalServicos + totalMateriais : totalServicos;

    // ─── Materiais helpers ────────────────────────────────────────────────────
    const addMaterial = (tipo: 'avulso' | 'faturamento_direto' = 'faturamento_direto') => setMateriais(prev => [...prev, {
        id: genId(), description: '', fornecedor: '', cnpjFornecedor: '', quantity: 1, unitPrice: 0, total: 0,
        tipoLancamento: tipo, ocultarValorPdf: false,
    }]);

    const removeMaterial = (id: string) => setMateriais(prev => prev.filter(m => m.id !== id));

    const updateMaterial = (id: string, field: keyof OemMaterialItem, value: any) => {
        setMateriais(prev => prev.map(m => {
            if (m.id !== id) return m;
            const updated = { ...m, [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                updated.total = +(Number(updated.quantity) * Number(updated.unitPrice)).toFixed(2);
            }
            return updated;
        }));
    };

    // ─── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!servico?.id) return;
        setLoading(true);
        try {
            const payload: any = {
                proposalTitle: title,
                proposalValidUntil: validUntil,
                proposalMode,
                sectionToggles: JSON.stringify({ ...toggles, subtotalMateriais: exibirSubtotalMateriais }),
                oemMateriais: JSON.stringify(materiais),
                incluirMateriaisNoTotal,
                totalServicos,
                totalMateriais,
                diagnostico,
                descricao: workDescription,
                // Prazos
                workDeadlineDays,
                workDeadlineType,
                workDeadlineText,
                thirdPartyDeadlines: JSON.stringify(thirdPartyDeadlines),
                // Textos editáveis da proposta
                paymentConditions,
                contractorObligations,
                clientObligations,
                generalProvisions,
                complianceText,
                recomendacoes: beneficios,
                // Itens unificados (checklist + extras em lista única)
                oemExtraItems: JSON.stringify(unifiedItems),
                oemItemDisplayMode: oemDisplayMode,
            };
            await api.updateOemServico(servico.id, payload);
            toast.success('Proposta O&M salva com sucesso!');
            onSaved?.();
        } catch (err: any) {
            toast.error('Erro ao salvar proposta: ' + (err?.response?.data?.message || err?.message || 'Tente novamente'));
        } finally {
            setLoading(false);
        }
    };

    // ─── Preview ───────────────────────────────────────────────────────────────
    const buildPreviewData = useCallback(() => {
        // Itens unificados (checklist + extras) → formato PDF
        const allItems = unifiedItems
            .filter(i => i.description?.trim())
            .map((i: OemServiceItem) => ({
                id: i.id,
                description: i.description,
                unit: i.unit || 'SV',
                serviceType: i.serviceType || 'service',
                unitPrice: parseNum(i.unitPrice),
                quantity: parseNum(i.quantity) || 1,
                isBundleParent: i.isBundleParent,
                parentId: i.parentId,
                showDetailedPrices: (i as any)._source === 'checklist'
                    ? oemDisplayMode === 'com_valor'
                    : i.showDetailedPrices !== false && oemDisplayMode === 'com_valor',
                showGroupTitle: i.showGroupTitle !== false,
                overridePrice: i.overridePrice ? parseNum(i.overridePrice) : null,
                total: getItemTotal(i),
            }));

        const visMap: Record<string, string> = { com_valor: 'grouping', sem_valor: 'summary', texto: 'text_only' };

        return {
            ...servico,
            title,
            proposalTitle: title,
            proposalValidUntil: validUntil,
            validUntil,
            proposalMode,
            sectionToggles: JSON.stringify(toggles),
            oemMateriais: JSON.stringify(materiais),
            incluirMateriaisNoTotal,
            exibirSubtotalMateriais,
            totalServicos,
            totalMateriais,
            total: grandTotal,
            items: allItems,
            itemVisibilityMode: visMap[oemDisplayMode] || 'grouping',
            client: servico?.cliente,
            clientName: servico?.cliente?.name,
            diagnostico,
            workDescription,
            notes: beneficios,
            paymentConditions,
            contractorObligations,
            clientObligations,
            generalProvisions,
            complianceText,
            // Prazos
            workDeadlineDays,
            workDeadlineType,
            workDeadlineText,
            thirdPartyDeadlines: JSON.stringify(thirdPartyDeadlines),
            proposalNumber: servico?.oemProposalId || servico?.proposalId || `OEM-${Date.now()}`,
        };
    }, [title, validUntil, proposalMode, toggles, materiais, incluirMateriaisNoTotal, exibirSubtotalMateriais, totalMateriais, totalServicos, grandTotal, unifiedItems, oemDisplayMode, diagnostico, workDescription, beneficios, paymentConditions, contractorObligations, clientObligations, generalProvisions, complianceText, workDeadlineDays, workDeadlineType, workDeadlineText, thirdPartyDeadlines, servico]);

    const handlePreview = () => {
        setPreviewData(buildPreviewData());
        setPreviewing(true);
    };

    const handleDownloadPDF = async () => {
        const data = buildPreviewData();
        setPreviewData(data);
        await new Promise(r => setTimeout(r, 150));

        const element = document.getElementById('oem-proposal-pdf-content');
        if (!element) { toast.error('Erro ao localizar o conteúdo do PDF.'); return; }

        toast.info('Gerando PDF...');
        const opt = {
            margin: [0, 0, 38, 0] as [number, number, number, number],
            filename: `proposta_oem_${servico?.usina?.nome?.replace(/\s/g, '_') || 'servico'}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 3, dpi: 192, useCORS: true, letterRendering: true, width: 794, windowWidth: 794 },
            jsPDF: { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.next-page', avoid: ['tr', '.sig-block', '.pdf-keep-together', '.pdf-section-title', '.avoid-page-break'] },
        };

        try {
            await html2pdf().from(element).set(opt).save();
            toast.success('PDF gerado com sucesso!');
        } catch { toast.error('Erro ao gerar PDF.'); }
    };

    // ─── Styles ───────────────────────────────────────────────────────────────
    const TABS = [
        { icon: FileText, label: 'Identificação' },
        { icon: Settings, label: 'Seções PDF' },
        { icon: Wrench, label: 'Serviços' },
        { icon: Package, label: 'Materiais' },
        { icon: Clock, label: 'Prazos' },
        { icon: ClipboardList, label: 'Textos' },
    ];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
                    {/* ── HEADER ── */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex-shrink-0">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                    <Sun className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-white text-lg font-bold">Proposta O&M Solar</DialogTitle>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        {servico?.usina?.nome || '—'} · {servico?.cliente?.name || '—'}
                                    </p>
                                </div>
                                <div className="ml-auto flex gap-2">
                                    <Button size="sm" variant="outline" onClick={handlePreview}
                                        className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 gap-2 text-xs">
                                        <Eye className="w-3.5 h-3.5" /> Pré-visualizar
                                    </Button>
                                    <Button size="sm" onClick={handleDownloadPDF}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs">
                                        <Download className="w-3.5 h-3.5" /> Baixar PDF
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Tab Bar */}
                        <div className="flex gap-1 mt-4">
                            {TABS.map((t, i) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setTab(i)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === i
                                            ? 'bg-amber-500 text-slate-900'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {t.label}
                                        {i === 2 && unifiedItems.filter(it => it.description?.trim()).length > 0 && (
                                            <Badge className="bg-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0 h-4">
                                                +{unifiedItems.filter(it => it.description?.trim()).length}
                                            </Badge>
                                        )}
                                        {i === 3 && materiais.length > 0 && (
                                            <Badge className="bg-amber-500/30 text-amber-300 text-[10px] px-1.5 py-0 h-4">
                                                {materiais.length}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── BODY ── */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">

                        {/* ══ ABA 1: IDENTIFICAÇÃO ══ */}
                        {tab === 0 && (
                            <div className="space-y-5 max-w-2xl">
                                <div>
                                    <Label className="text-sm font-semibold text-slate-700">Título da Proposta</Label>
                                    <Input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="mt-1.5 bg-white font-medium"
                                        placeholder="Ex: Manutenção Preventiva Semestral — Usina Caruaru"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Aparece no cabeçalho do PDF como título principal</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-semibold text-slate-700">Validade da Proposta</Label>
                                        <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="mt-1.5 bg-white" />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-semibold text-slate-700">Modo da Proposta</Label>
                                        <select
                                            value={proposalMode}
                                            onChange={e => setProposalMode(e.target.value as any)}
                                            className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="servico">Apenas Serviços</option>
                                            <option value="material">Apenas Materiais</option>
                                            <option value="misto">Misto (Serviços + Materiais)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-slate-700">Modo de Exibição de Preços</Label>
                                    <div className="flex gap-2 mt-1.5">
                                        {(['com_valor', 'sem_valor', 'texto'] as const).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setDisplayMode(m)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${displayMode === m
                                                    ? 'bg-amber-500 text-slate-900 border-amber-500'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'}`}
                                            >
                                                {m === 'com_valor' ? '💰 Com Valores' : m === 'sem_valor' ? '📋 Sem Valores' : '📝 Texto Comercial'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-slate-700">Descrição do Serviço (intro do PDF)</Label>
                                    <Textarea
                                        value={workDescription}
                                        onChange={e => setWorkDescription(e.target.value)}
                                        rows={3}
                                        className="mt-1.5 bg-white resize-none text-sm"
                                        placeholder="Descreva brevemente o escopo e objetivo deste serviço..."
                                    />
                                </div>

                                {/* Info card */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                                    <Sun className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">Usina vinculada</p>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            {servico?.usina?.nome} · {servico?.usina?.potenciaKwp} kWp · {servico?.usina?.qtdModulos} módulos
                                        </p>
                                        <p className="text-xs text-amber-600 mt-0.5">{servico?.usina?.endereco}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ══ ABA 2: SEÇÕES PDF ══ */}
                        {tab === 1 && (
                            <div className="space-y-3">
                                <div className="text-sm text-slate-500 mb-4">
                                    Ative ou desative cada seção. As seções desmarcadas <strong>não aparecem no PDF</strong> gerado.
                                    Seções obrigatórias não podem ser removidas.
                                </div>
                                {SECTION_META.map(({ key, label, icon: Icon, desc, required }) => (
                                    <div
                                        key={key}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${toggles[key]
                                            ? 'bg-white border-slate-200 shadow-sm'
                                            : 'bg-slate-100/60 border-slate-200 opacity-60'}`}
                                    >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${toggles[key] ? 'bg-amber-500/15 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-800">{label}</span>
                                                {required && (
                                                    <Badge className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] px-1.5 py-0 h-4">
                                                        Obrigatório
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 truncate">{desc}</p>
                                        </div>
                                        <Switch
                                            checked={toggles[key]}
                                            onCheckedChange={v => {
                                                if (required) return;
                                                setToggles(prev => ({ ...prev, [key]: v }));
                                            }}
                                            disabled={required}
                                            className={required ? 'opacity-50' : ''}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ══ ABA 3: SERVIÇOS (Lista Unificada) ══ */}
                        {tab === 2 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <ClipboardList className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-sm font-bold text-slate-800">Checklist de Serviços</h3>
                                    <Badge variant="outline" className="text-xs text-slate-500 ml-auto">
                                        {unifiedItems.filter(i => (i as any)._source === 'checklist').length} padrão
                                        {' + '}
                                        {unifiedItems.filter(i => (i as any)._source !== 'checklist').length} extras
                                    </Badge>
                                </div>
                                <OeMServiceItemsPanel
                                    items={unifiedItems}
                                    onChange={setUnifiedItems}
                                    displayMode={oemDisplayMode}
                                    onDisplayModeChange={setOemDisplayMode}
                                    checklistTotal={0}
                                />
                            </div>
                        )}

                        {/* ══ ABA 4: MATERIAIS / INSUMOS ══ */}
                        {tab === 3 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">Materiais & Insumos</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Material avulso (fornecimento próprio) ou faturamento direto por fornecedor
                                        </p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Button size="sm" onClick={() => addMaterial('avulso')}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 text-xs">
                                            <Plus className="w-3.5 h-3.5" /> Avulso
                                        </Button>
                                        <Button size="sm" onClick={() => addMaterial('faturamento_direto')}
                                            className="bg-blue-500 hover:bg-blue-600 text-white gap-1.5 text-xs">
                                            <Plus className="w-3.5 h-3.5" /> Fat. Direto
                                        </Button>
                                    </div>
                                </div>

                                {materiais.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                        <p className="text-sm">Nenhum material adicionado</p>
                                        <p className="text-xs mt-1">Use os botões acima para incluir materiais</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {materiais.map((m, idx) => {
                                            const isAvulso = m.tipoLancamento === 'avulso';
                                            return (
                                            <div key={m.id} className={`bg-white rounded-xl p-4 space-y-3 border-2 ${isAvulso ? 'border-emerald-200' : 'border-blue-200'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={`text-[10px] px-2 py-0.5 ${isAvulso ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                            {isAvulso ? '🏢 Fornecimento Próprio' : '📦 Faturamento Direto'}
                                                        </Badge>
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                            #{idx + 1}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeMaterial(m.id)}
                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-slate-600">Descrição do Material *</Label>
                                                    <Input
                                                        value={m.description}
                                                        onChange={e => updateMaterial(m.id, 'description', e.target.value)}
                                                        className="mt-1 text-sm"
                                                        placeholder="Ex: Módulo FV 550W Monocristalino"
                                                    />
                                                </div>
                                                {/* Campos de fornecedor — apenas para faturamento direto */}
                                                {!isAvulso && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-xs text-slate-600 flex items-center gap-1">
                                                                <Building2 className="w-3 h-3" /> Nome do Fornecedor
                                                            </Label>
                                                            <Input
                                                                value={m.fornecedor}
                                                                onChange={e => updateMaterial(m.id, 'fornecedor', e.target.value)}
                                                                className="mt-1 text-sm"
                                                                placeholder="Ex: Enova Distribuição Solar"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs text-slate-600 flex items-center gap-1">
                                                                <Hash className="w-3 h-3" /> CNPJ do Fornecedor
                                                            </Label>
                                                            <Input
                                                                value={m.cnpjFornecedor}
                                                                onChange={e => updateMaterial(m.id, 'cnpjFornecedor', fmtCNPJ(e.target.value))}
                                                                className="mt-1 text-sm font-mono"
                                                                placeholder="00.000.000/0001-00"
                                                                maxLength={18}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <Label className="text-xs text-slate-600">Quantidade</Label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={m.quantity}
                                                            onChange={e => updateMaterial(m.id, 'quantity', Number(e.target.value))}
                                                            className="mt-1 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-slate-600">Valor Unitário (R$)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min={0}
                                                            value={m.unitPrice}
                                                            onChange={e => updateMaterial(m.id, 'unitPrice', Number(e.target.value))}
                                                            className="mt-1 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-slate-600">Total</Label>
                                                        <div className={`mt-1 px-3 py-2 rounded-md text-sm font-bold ${isAvulso ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
                                                            R$ {Number(m.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Toggle ocultar valor — apenas para avulso */}
                                                {isAvulso && (
                                                    <div className="flex items-center gap-2 pt-1 border-t border-emerald-100">
                                                        <Switch
                                                            checked={m.ocultarValorPdf || false}
                                                            onCheckedChange={v => updateMaterial(m.id, 'ocultarValorPdf' as any, v)}
                                                            className="scale-75"
                                                        />
                                                        <span className="text-xs text-slate-500">Ocultar valor unitário no PDF (exibe apenas descrição e qtd)</span>
                                                    </div>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Configurações de total */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Incluir materiais no valor total da proposta</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {incluirMateriaisNoTotal
                                                    ? 'Os custos de materiais serão somados ao total'
                                                    : 'Materiais listados separadamente (faturamento direto)'}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={incluirMateriaisNoTotal}
                                            onCheckedChange={setIncluirMateriaisNoTotal}
                                        />
                                    </div>
                                    {/* Toggle subtotal de fornecimento no PDF */}
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Exibir Subtotal de Fornecimento no PDF</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {exibirSubtotalMateriais
                                                    ? 'A linha de subtotal dos materiais será visível no PDF'
                                                    : 'Subtotal oculto — materiais embutidos no valor global (serviço fechado)'}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={exibirSubtotalMateriais}
                                            onCheckedChange={setExibirSubtotalMateriais}
                                        />
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal serviços</span>
                                            <span className="font-medium text-slate-700">R$ {totalServicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal materiais</span>
                                            <span className="font-medium text-slate-700">R$ {totalMateriais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2 mt-2">
                                            <span className="text-slate-900">Total da Proposta</span>
                                            <span className="text-amber-600">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ══ ABA 5: PRAZOS ══ */}
                        {tab === 4 && (
                            <div className="space-y-5 max-w-2xl">
                                {/* Prazo principal */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-sky-500" />
                                        <h3 className="text-sm font-bold text-slate-800">Prazo de Execução</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-600">Prazo (dias)</Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Ex: 5"
                                                value={workDeadlineDays}
                                                onChange={e => setWorkDeadlineDays(e.target.value)}
                                                className="mt-1.5 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-600">Tipo de Prazo</Label>
                                            <select
                                                value={workDeadlineType}
                                                onChange={e => setWorkDeadlineType(e.target.value as any)}
                                                className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            >
                                                <option value="calendar_days">Dias Corridos</option>
                                                <option value="business_days">Dias Úteis</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600">Texto do Prazo (deixe em branco para usar o padrão)</Label>
                                        <Textarea
                                            value={workDeadlineText}
                                            onChange={e => setWorkDeadlineText(e.target.value)}
                                            rows={2}
                                            className="mt-1.5 bg-white resize-none text-sm"
                                            placeholder="Ex: contados a partir da data de aprovação desta proposta e mobilização da equipe."
                                        />
                                    </div>

                                    {/* Preview do prazo */}
                                    {workDeadlineDays && (
                                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                                            <p className="text-[10px] font-semibold text-sky-700 mb-1">Prévia do texto no PDF:</p>
                                            <p className="text-xs text-sky-800">
                                                O prazo estimado para execução completa dos serviços é de <strong>{workDeadlineDays}</strong> {workDeadlineType === 'business_days' ? 'dias úteis' : 'dias corridos'}, {workDeadlineText || 'contados a partir da data de aprovação desta proposta e mobilização da equipe técnica.'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Prazos de Terceiros */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-500" />
                                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Prazos de Terceiros</Label>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs gap-1 border-slate-300"
                                            onClick={() => setThirdPartyDeadlines(prev => [...prev, { name: '', days: '', type: 'calendar_days', description: '' }])}
                                        >
                                            <Plus className="w-3 h-3" /> Adicionar
                                        </Button>
                                    </div>

                                    {thirdPartyDeadlines.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">Nenhum prazo de terceiro cadastrado. Use o botão acima para incluir dependências de fornecedores ou fabricantes.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {thirdPartyDeadlines.map((tp, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                                    <div className="col-span-3">
                                                        {idx === 0 && <Label className="text-[10px] text-slate-500">Responsável</Label>}
                                                        <Input
                                                            placeholder="Ex: Fabricante"
                                                            className="h-8 text-xs mt-1"
                                                            value={tp.name}
                                                            onChange={e => {
                                                                const arr = [...thirdPartyDeadlines];
                                                                arr[idx] = { ...arr[idx], name: e.target.value };
                                                                setThirdPartyDeadlines(arr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        {idx === 0 && <Label className="text-[10px] text-slate-500">Dias</Label>}
                                                        <Input
                                                            placeholder="Dias"
                                                            className="h-8 text-xs mt-1"
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={tp.days}
                                                            onChange={e => {
                                                                const arr = [...thirdPartyDeadlines];
                                                                arr[idx] = { ...arr[idx], days: e.target.value };
                                                                setThirdPartyDeadlines(arr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        {idx === 0 && <Label className="text-[10px] text-slate-500">Tipo</Label>}
                                                        <select
                                                            value={tp.type || 'calendar_days'}
                                                            onChange={e => {
                                                                const arr = [...thirdPartyDeadlines];
                                                                arr[idx] = { ...arr[idx], type: e.target.value };
                                                                setThirdPartyDeadlines(arr);
                                                            }}
                                                            className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                        >
                                                            <option value="calendar_days">Corridos</option>
                                                            <option value="business_days">Úteis</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-3">
                                                        {idx === 0 && <Label className="text-[10px] text-slate-500">Descrição</Label>}
                                                        <Input
                                                            placeholder="Ex: Entrega do inversor"
                                                            className="h-8 text-xs mt-1"
                                                            value={tp.description}
                                                            onChange={e => {
                                                                const arr = [...thirdPartyDeadlines];
                                                                arr[idx] = { ...arr[idx], description: e.target.value };
                                                                setThirdPartyDeadlines(arr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-1 flex justify-center">
                                                        <button
                                                            onClick={() => setThirdPartyDeadlines(prev => prev.filter((_, i) => i !== idx))}
                                                            className="mt-1 text-red-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Cláusula de isenção — informativa */}
                                    <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                                        <p className="text-[10px] text-sky-700 italic leading-relaxed">
                                            <strong>Nota automática no PDF:</strong> Os prazos aqui estipulados referentes a fornecedores, fabricantes, logística de terceiros ou órgãos públicos são de responsabilidade exclusiva dos respectivos entes, não cabendo à empresa a responsabilidade por eventuais atrasos destes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ══ ABA 6: TEXTOS ══ */}
                        {tab === 5 && (
                            <div className="space-y-4 max-w-2xl">
                                {toggles.diagnostico && (
                                    <div>
                                        <Label className="text-sm font-semibold text-slate-700">Diagnóstico Técnico</Label>
                                        <Textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)}
                                            rows={4} className="mt-1.5 bg-white resize-none text-sm"
                                            placeholder="Descreva o estado atual do sistema, falhas identificadas, irregularidades..." />
                                    </div>
                                )}
                                {toggles.beneficios && (
                                    <div>
                                        <Label className="text-sm font-semibold text-slate-700">Benefícios do Plano</Label>
                                        <Textarea value={beneficios} onChange={e => setBeneficios(e.target.value)}
                                            rows={4} className="mt-1.5 bg-white resize-none text-sm"
                                            placeholder="• Um benefício por linha" />
                                        <p className="text-xs text-slate-400 mt-1">Uma linha por benefício. Use • para bullet points.</p>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-sm font-semibold text-slate-700">Condições de Pagamento</Label>
                                    <Textarea value={paymentConditions} onChange={e => setPaymentConditions(e.target.value)}
                                        rows={3} className="mt-1.5 bg-white resize-none text-sm" />
                                </div>
                                {toggles.obrigacoes && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-slate-700">Obrigações da Contratada</Label>
                                            <Textarea value={contractorObligations} onChange={e => setContractorObligations(e.target.value)}
                                                rows={5} className="mt-1.5 bg-white resize-none text-sm"
                                                placeholder="1. Executar os serviços..." />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-slate-700">Obrigações do Contratante</Label>
                                            <Textarea value={clientObligations} onChange={e => setClientObligations(e.target.value)}
                                                rows={5} className="mt-1.5 bg-white resize-none text-sm"
                                                placeholder="1. Garantir acesso..." />
                                        </div>
                                    </div>
                                )}
                                {toggles.disposicoes && (
                                    <div>
                                        <Label className="text-sm font-semibold text-slate-700">Disposições Gerais</Label>
                                        <Textarea value={generalProvisions} onChange={e => setGeneralProvisions(e.target.value)}
                                            rows={4} className="mt-1.5 bg-white resize-none text-sm"
                                            placeholder="• Vigência..." />
                                    </div>
                                )}
                                {toggles.garantias && (
                                    <div>
                                        <Label className="text-sm font-semibold text-slate-700">Conformidade Normativa</Label>
                                        <Textarea value={complianceText} onChange={e => setComplianceText(e.target.value)}
                                            rows={5} className="mt-1.5 bg-white resize-none text-sm"
                                            placeholder="▸ NBR 16690..." />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-xs text-slate-500">
                                Total: <span className="font-bold text-slate-800 text-sm">
                                    R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            {materiais.length > 0 && (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                    {materiais.length} material(is)
                                </Badge>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {tab > 0 && (
                                <Button variant="outline" size="sm" onClick={() => setTab(t => t - 1)} className="gap-1 text-xs">
                                    ← Anterior
                                </Button>
                            )}
                            {tab < TABS.length - 1 && (
                                <Button size="sm" onClick={() => setTab(t => t + 1)}
                                    className="bg-slate-800 hover:bg-slate-700 text-white gap-1 text-xs">
                                    Próximo <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            )}

                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold gap-1.5 text-xs"
                            >
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                Salvar Proposta
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── PREVIEW MODAL ── */}
            {previewing && previewData && (
                <Dialog open={previewing} onOpenChange={setPreviewing}>
                    <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
                        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Pré-visualização do PDF</span>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleDownloadPDF}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs">
                                    <Download className="w-3.5 h-3.5" /> Baixar PDF
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setPreviewing(false)} className="text-xs">
                                    Fechar
                                </Button>
                            </div>
                        </div>
                        <OeMProposalPDFTemplate
                            proposal={previewData}
                            company={company}
                            idOverride="oem-proposal-pdf-content"
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Hidden PDF render target */}
            {previewData && !previewing && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0, width: 794, zIndex: -1 }}>
                    <OeMProposalPDFTemplate
                        proposal={previewData}
                        company={company}
                        idOverride="oem-proposal-pdf-content"
                    />
                </div>
            )}
        </>
    );
}
