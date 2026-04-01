import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Loader2, Plus, Trash2, Search, ChevronDown, Box, Layers, Eye, EyeOff, Building2, DollarSign, Shield, UserPlus, Upload, X, Pencil, Calculator, Database, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { ClientDialog } from '@/components/ClientDialog';
import NewGroupingDialog from '@/components/NewGroupingDialog';

interface NewProposalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProposalCreated: () => void;
    initialData?: any; // For editing
    prefillData?: { // For pre-filling from Pipeline
        title?: string;
        clientId?: string;
        opportunityId?: string;
    };
}

interface ClientOption {
    id: string;
    name: string;
}

interface ActivityItem {
    id?: string;
    description: string;
    serviceType: string;
    unitPrice: string;
    quantity: string;
    unit: string;
    isBundleParent?: boolean;
    parentId?: string;
    showDetailedPrices?: boolean;
    catalogItemId?: string;
    overridePrice?: string;
    internalNote?: string;
}

const serviceTypes: Record<string, string> = {
    service: 'Serviço',
    material: 'Material',
};

const unitOptions = ['UN', 'M', 'M²', 'KG', 'CX', 'PCT', 'JG', 'RL', 'PÇ', 'CDA', 'KIT', 'VB'];

const emptyItem: ActivityItem = {
    description: '',
    serviceType: 'service',
    unitPrice: '',
    quantity: '1',
    unit: 'UN',
};

export default function NewProposalDialog({
    open,
    onOpenChange,
    onProposalCreated,
    initialData,
    prefillData,
}: NewProposalDialogProps) {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [showClientDialog, setShowClientDialog] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);


    // Editar agrupamento de dentro da proposta
    const [editingKitInProposal, setEditingKitInProposal] = useState<{
        catalogItem: any;
        parentTempId: string;
    } | null>(null);
    // Structure import
    const [showStructureSearch, setShowStructureSearch] = useState(false);
    const [consolidatedView, setConsolidatedView] = useState(false);
    const [structureSearchQuery, setStructureSearchQuery] = useState('');
    const [structureResults, setStructureResults] = useState<any[]>([]);
    const [loadingStructures, setLoadingStructures] = useState(false);

    // SINAPI search
    const [showSinapiSearch, setShowSinapiSearch] = useState(false);
    const [sinapiQuery, setSinapiQuery] = useState('');
    const [sinapiResults, setSinapiResults] = useState<any[]>([]);
    const [loadingSinapi, setLoadingSinapi] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        clientId: '',
        opportunityId: '',
        validUntil: '',
        discount: '',
        scope: '',
        deadline: '',
        paymentConditions: '',
        obligations: '',
        notes: '',
        // Campos de contrato profissional
        workDescription: '',
        workAddress: '',
        workDeadlineDays: '',
        workDeadlineType: 'calendar_days',
        workDeadlineText: '',
        objectiveType: '',
        objectiveText: '',
        thirdPartyDeadlines: '[]',
        paymentBank: '',
        activityType: '',
        contractorObligations: '',
        clientObligations: '',
        generalProvisions: '',
        serviceDescription: '',
        materialFornecimento: '',
        materialFaturamento: '[]',
        paymentDueCondition: '',
        // Custos adicionais
        logisticsCostValue: '',
        logisticsCostMode: 'visible',
        logisticsCostPercent: '',
        logisticsCostApplyTo: 'material',
        logisticsCostEmbedMaterialPct: '100',
        logisticsCostEmbedServicePct: '0',
        logisticsCostDescription: 'Custo referente à mobilização e desmobilização de equipes, transporte de equipamentos especializados, veículos operacionais, combustível, pedágios e logística de campo necessários para a execução dos serviços no local da obra.',
        adminCostValue: '',
        adminCostMode: 'visible',
        adminCostPercent: '',
        adminCostApplyTo: 'material',
        adminCostEmbedMaterialPct: '100',
        adminCostEmbedServicePct: '0',
        adminCostDescription: 'Custo referente à gestão administrativa do contrato, incluindo coordenação técnica do projeto, acompanhamento e fiscalização de fornecedores, controle de qualidade, gestão documental, elaboração de relatórios técnicos e suporte operacional durante toda a vigência contratual.',
        brokerageCostValue: '',
        brokerageCostMode: 'visible',
        brokerageCostPercent: '',
        brokerageCostApplyTo: 'material',
        brokerageCostEmbedMaterialPct: '100',
        brokerageCostEmbedServicePct: '0',
        brokerageCostDescription: 'Custo referente a honorários de intermediação comercial, prospecção de oportunidades, negociação contratual e assessoria técnico-comercial para viabilização do projeto junto ao contratante.',
        insuranceCostValue: '',
        insuranceCostMode: 'visible',
        insuranceCostPercent: '',
        insuranceCostApplyTo: 'material',
        insuranceCostEmbedMaterialPct: '100',
        insuranceCostEmbedServicePct: '0',
        insuranceCostDescription: 'Custo referente à contratação de seguro de responsabilidade civil, cobertura de riscos operacionais, garantia sobre materiais e equipamentos, e proteção patrimonial durante a execução dos serviços conforme exigências normativas aplicáveis.',
        complianceText: '',
        // Visibilidade dos itens
        itemVisibilityMode: 'detailed',
        materialSummaryText: '',
        serviceSummaryText: '',
        summaryTotalLabel: 'Valor Global',
    });

    const [items, setItems] = useState<ActivityItem[]>([{ ...emptyItem }]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchResults, setSearchResults] = useState<Record<number, any[]>>({});
    const searchTimerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

    const debouncedSearch = useCallback((index: number, query: string) => {
        // Clear previous timer for this index
        if (searchTimerRef.current[index]) {
            clearTimeout(searchTimerRef.current[index]);
        }

        if (query.length < 2) {
            setSearchResults(prev => ({ ...prev, [index]: [] }));
            return;
        }

        searchTimerRef.current[index] = setTimeout(async () => {
            try {
                const suggestions = await api.searchCatalogItems(query);
                // Mostrar agrupamentos + itens normais, sem categorias
                const filtered = suggestions.filter((s: any) => s.dataType !== 'category');
                setSearchResults(prev => ({ ...prev, [index]: filtered }));
            } catch (err) {
                console.error('Erro ao buscar catalogo:', err);
            }
        }, 300);
    }, []);

    const itemsRef = useRef<ActivityItem[]>([]);
    useEffect(() => { itemsRef.current = items; }, [items]);

    const catalogSyncTimerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

    const syncCatalogItem = useCallback((item: ActivityItem) => {
        if (!item.catalogItemId) return;
        const catalogId = item.catalogItemId;

        // Use a stable key for the timer
        const timerKey = catalogId.charCodeAt(0);
        if (catalogSyncTimerRef.current[timerKey]) {
            clearTimeout(catalogSyncTimerRef.current[timerKey]);
        }

        catalogSyncTimerRef.current[timerKey] = setTimeout(async () => {
            try {
                await api.updateCatalogItem(catalogId, {
                    name: item.description,
                    unitPrice: Number(item.unitPrice || 0),
                    type: item.serviceType === 'service' ? 'service' : 'material',
                });
                toast.success('Catálogo atualizado', { duration: 2000, id: `catalog-sync-${catalogId}` });

                // Se o item pertence a um bundle, recalcular o kit pai no catálogo
                // Isso garante que o unitPrice do kit seja a soma dos filhos atuais
                if (item.parentId) {
                    try {
                        const result = await api.recalcKitPrices(catalogId);
                        if (result.updatedKits > 0) {
                            toast.success(
                                `Kit "${result.kits[0]?.name}" atualizado: R$ ${result.kits[0]?.newPrice.toFixed(2)}`,
                                { duration: 3000, id: `kit-sync-${result.kits[0]?.id}` }
                            );
                        }
                    } catch {
                        // Silently ignore — a atualização do filho já foi feita
                    }
                }
            } catch (err) {
                console.error('Erro ao sincronizar com catálogo:', err);
                toast.error('Erro ao atualizar o catálogo');
            }
        }, 1500);
    }, []);



    // Recarregar filhos do kit na proposta apos editar no NewGroupingDialog
    const reloadKitChildren = useCallback(async (catalogId: string, parentTempId: string) => {
        try {
            const groupingData = await api.getGroupingItems(catalogId);
            const kitItem = await api.getCatalogItem(catalogId).catch(() => null);
            setItems(prev => {
                const withoutChildren = prev.filter(it => it.parentId !== parentTempId);
                const updatedParent = withoutChildren.map(it =>
                    it.id === parentTempId
                        ? { ...it, unitPrice: String(kitItem?.unitPrice || '0'), description: kitItem?.name || it.description }
                        : it
                );
                const parentIdx = updatedParent.findIndex(it => it.id === parentTempId);
                if (parentIdx === -1) return prev;
                const newChildren = groupingData.map((gi: any) => ({
                    description: gi.childItem?.name || '',
                    unitPrice: String(gi.childItem?.unitPrice || 0),
                    quantity: String(gi.quantity || 1),
                    unit: gi.unit || gi.childItem?.unit || 'UN',
                    serviceType: gi.childItem?.type === 'service' ? 'service' : 'material',
                    parentId: parentTempId,
                    catalogItemId: gi.childItemId,
                    showDetailedPrices: true,
                }));
                updatedParent.splice(parentIdx + 1, 0, ...newChildren);
                return updatedParent;
            });
            toast.success(`Agrupamento recarregado com ${groupingData.length} item(s)`);
        } catch {
            toast.error('Erro ao recarregar o agrupamento na proposta');
        }
    }, []);

    useEffect(() => {
        if (open) {
            if (clients.length === 0) loadClients();

            if (initialData) {
                // Edit Mode
                setFormData({
                    title: initialData.title || '',
                    clientId: initialData.clientId || initialData.client?.id || '',
                    opportunityId: initialData.opportunityId || '',
                    validUntil: initialData.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
                    discount: String(initialData.discount || ''),
                    scope: initialData.scope || '',
                    deadline: initialData.deadline || '',
                    paymentConditions: initialData.paymentConditions || '',
                    obligations: initialData.obligations || '',
                    notes: initialData.notes || '',
                    workDescription: initialData.workDescription || '',
                    workAddress: initialData.workAddress || '',
                    workDeadlineDays: String(initialData.workDeadlineDays || ''),
                    workDeadlineType: initialData.workDeadlineType || 'calendar_days',
                    workDeadlineText: initialData.workDeadlineText || '',
                    objectiveType: initialData.objectiveType || '',
                    objectiveText: initialData.objectiveText || '',
                    thirdPartyDeadlines: initialData.thirdPartyDeadlines || '[]',
                    paymentBank: initialData.paymentBank || '',
                    activityType: initialData.activityType || '',
                    contractorObligations: initialData.contractorObligations || '',
                    clientObligations: initialData.clientObligations || '',
                    generalProvisions: initialData.generalProvisions || '',
                    serviceDescription: initialData.serviceDescription || '',
                    materialFornecimento: initialData.materialFornecimento || '',
                    materialFaturamento: initialData.materialFaturamento || '[]',
                    paymentDueCondition: initialData.paymentDueCondition || '',
                    logisticsCostValue: String(initialData.logisticsCostValue || ''),
                    logisticsCostMode: initialData.logisticsCostMode || 'visible',
                    logisticsCostPercent: String(initialData.logisticsCostPercent || ''),
                    logisticsCostApplyTo: initialData.logisticsCostApplyTo || 'material',
                    logisticsCostEmbedMaterialPct: String(initialData.logisticsCostEmbedMaterialPct ?? '100'),
                    logisticsCostEmbedServicePct: String(initialData.logisticsCostEmbedServicePct ?? '0'),
                    logisticsCostDescription: initialData.logisticsCostDescription || 'Custo referente à mobilização e desmobilização de equipes, transporte de equipamentos especializados, veículos operacionais, combustível, pedágios e logística de campo necessários para a execução dos serviços no local da obra.',
                    adminCostValue: String(initialData.adminCostValue || ''),
                    adminCostMode: initialData.adminCostMode || 'visible',
                    adminCostPercent: String(initialData.adminCostPercent || ''),
                    adminCostApplyTo: initialData.adminCostApplyTo || 'material',
                    adminCostEmbedMaterialPct: String(initialData.adminCostEmbedMaterialPct ?? '100'),
                    adminCostEmbedServicePct: String(initialData.adminCostEmbedServicePct ?? '0'),
                    adminCostDescription: initialData.adminCostDescription || 'Custo referente à gestão administrativa do contrato, incluindo coordenação técnica do projeto, acompanhamento e fiscalização de fornecedores, controle de qualidade, gestão documental, elaboração de relatórios técnicos e suporte operacional durante toda a vigência contratual.',
                    brokerageCostValue: String(initialData.brokerageCostValue || ''),
                    brokerageCostMode: initialData.brokerageCostMode || 'visible',
                    brokerageCostPercent: String(initialData.brokerageCostPercent || ''),
                    brokerageCostApplyTo: initialData.brokerageCostApplyTo || 'material',
                    brokerageCostEmbedMaterialPct: String(initialData.brokerageCostEmbedMaterialPct ?? '100'),
                    brokerageCostEmbedServicePct: String(initialData.brokerageCostEmbedServicePct ?? '0'),
                    brokerageCostDescription: initialData.brokerageCostDescription || 'Custo referente a honorários de intermediação comercial, prospecção de oportunidades, negociação contratual e assessoria técnico-comercial para viabilização do projeto junto ao contratante.',
                    insuranceCostValue: String(initialData.insuranceCostValue || ''),
                    insuranceCostMode: initialData.insuranceCostMode || 'visible',
                    insuranceCostPercent: String(initialData.insuranceCostPercent || ''),
                    insuranceCostApplyTo: initialData.insuranceCostApplyTo || 'material',
                    insuranceCostEmbedMaterialPct: String(initialData.insuranceCostEmbedMaterialPct ?? '100'),
                    insuranceCostEmbedServicePct: String(initialData.insuranceCostEmbedServicePct ?? '0'),
                    insuranceCostDescription: initialData.insuranceCostDescription || 'Custo referente à contratação de seguro de responsabilidade civil, cobertura de riscos operacionais, garantia sobre materiais e equipamentos, e proteção patrimonial durante a execução dos serviços conforme exigências normativas aplicáveis.',
                    complianceText: initialData.complianceText || '',
                    itemVisibilityMode: initialData.itemVisibilityMode || 'detailed',
                    materialSummaryText: initialData.materialSummaryText || '',
                    serviceSummaryText: initialData.serviceSummaryText || '',
                    summaryTotalLabel: initialData.summaryTotalLabel || 'Valor Global',
                });
                if (initialData.items && initialData.items.length > 0) {
                    setItems(initialData.items.map((it: any) => ({
                        id: it.id,
                        description: it.description,
                        serviceType: it.serviceType === 'material' ? 'material' : 'service',
                        unitPrice: String(it.unitPrice),
                        quantity: String(it.quantity),
                        unit: it.unit || 'UN',
                        isBundleParent: it.isBundleParent || false,
                        parentId: it.parentId || undefined,
                        showDetailedPrices: it.showDetailedPrices !== undefined ? it.showDetailedPrices : true,
                        overridePrice: it.overridePrice != null ? String(it.overridePrice) : '',
                        internalNote: it.notes || '',
                    })));
                }
            } else if (prefillData) {
                // Pre-fill Mode (from Pipeline)
                setFormData(prev => ({
                    ...prev,
                    title: prefillData.title || prev.title,
                    clientId: prefillData.clientId || prev.clientId,
                    opportunityId: prefillData.opportunityId || prev.opportunityId,
                }));
            }
        }
    }, [open, initialData, prefillData]);

    const loadClients = async () => {
        setLoadingClients(true);
        try {
            const data = await api.getClients();
            const clientList = Array.isArray(data) ? data : (data?.data ?? []);
            setClients(clientList.map((c: any) => ({ id: c.id, name: c.name })));
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const addItem = () => {
        setItems([...items, { ...emptyItem }]);
    };

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        const itemToRemove = items[index];
        let newItems = [...items];

        if (itemToRemove.isBundleParent) {
            // Remover pai e todos os filhos
            const parentId = itemToRemove.id;
            newItems = newItems.filter((it, i) => i !== index && it.parentId !== parentId);
        } else {
            newItems = newItems.filter((_, i) => i !== index);
        }

        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof ActivityItem, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value === 'true' ? true : value === 'false' ? false : value };
        setItems(updated);

        // Sync back to catalog if this item came from catalog
        if (updated[index].catalogItemId && ['description', 'unitPrice', 'serviceType'].includes(field)) {
            syncCatalogItem(updated[index]);
        }
    };

    // Normaliza qualquer formato numérico BR (ex: "3.900,00" ou "3900,00" ou "3900.00") para número
    const parsePrice = (value: string | number): number => {
        if (typeof value === 'number') return isNaN(value) ? 0 : value;
        const s = String(value).trim();
        if (!s) return 0;
        let normalized: string;
        if (s.includes(',')) {
            // Formato BR: pontos são milhares, vírgula é decimal
            // Ex: "3.900,50" → "3900.50" | "1,7" → "1.7" | "1.000,00" → "1000.00"
            normalized = s.replace(/\./g, '').replace(',', '.');
        } else {
            // Sem vírgula: o ponto é decimal (padrão JS/API)
            // Ex: "1.000" → 1.0 | "3900.50" → 3900.5 | "50" → 50
            normalized = s;
        }
        const n = parseFloat(normalized);
        return isNaN(n) ? 0 : n;
    };

    const getChildrenTotal = (item: ActivityItem): number => {
        return items
            .filter(i => i.parentId === item.id)
            .reduce((sum, i) => sum + parsePrice(i.unitPrice) * Math.max(parsePrice(i.quantity) || 1, 0), 0);
    };

    const getItemTotal = (item: ActivityItem): number => {
        if (item.isBundleParent) {
            const parentQty = Math.max(parsePrice(item.quantity) || 1, 1);
            // Se tem overridePrice, usar ele × qty; senão, soma dos filhos × qty
            if (item.overridePrice && item.overridePrice.trim() !== '') {
                return parsePrice(item.overridePrice) * parentQty;
            }
            return getChildrenTotal(item) * parentQty;
        }
        // Para filhos de kit, multiplicar pelo qty do pai
        if (item.parentId) {
            const parent = items.find(i => i.id === item.parentId || (i.isBundleParent && 'temp-' + items.indexOf(i) === item.parentId));
            const parentQty = parent ? Math.max(parsePrice(parent.quantity) || 1, 1) : 1;
            return parsePrice(item.unitPrice) * Math.max(parsePrice(item.quantity) || 1, 0) * parentQty;
        }
        return parsePrice(item.unitPrice) * Math.max(parsePrice(item.quantity) || 1, 0);
    };

    // Helper: retorna qty efetiva do filho (qty do filho × qty do pai)
    const getEffectiveQty = (item: ActivityItem): number => {
        const qty = Math.max(parsePrice(item.quantity) || 1, 0);
        if (!item.parentId) return qty;
        const parent = items.find(i => i.id === item.parentId || (i.isBundleParent && 'temp-' + items.indexOf(i) === item.parentId));
        const parentQty = parent ? Math.max(parsePrice(parent.quantity) || 1, 1) : 1;
        return qty * parentQty;
    };

    // Aplicar qty do pai nos filhos permanentemente (multiplicar e resetar pai para 1)
    const applyParentQtyToChildren = (parentIndex: number) => {
        const parent = items[parentIndex];
        if (!parent?.isBundleParent) return;
        const parentQty = Math.max(parsePrice(parent.quantity) || 1, 1);
        if (parentQty <= 1) { toast.info('Quantidade do kit já é 1'); return; }

        const newItems = [...items];
        for (let i = 0; i < newItems.length; i++) {
            if (newItems[i].parentId === parent.id) {
                const childQty = parsePrice(newItems[i].quantity) || 1;
                newItems[i] = { ...newItems[i], quantity: String(parseFloat((childQty * parentQty).toFixed(3))) };
            }
        }
        newItems[parentIndex] = { ...newItems[parentIndex], quantity: '1' };
        setItems(newItems);
        toast.success(`Quantidades dos ${newItems.filter(i => i.parentId === parent.id).length} itens multiplicadas por ${parentQty}`);
    };

    // Formatar valor em R$ com max 2 casas decimais
    const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const subtotal = items.filter(i => !i.parentId).reduce((sum, item) => sum + getItemTotal(item), 0);
    const discount = parsePrice(formData.discount);

    // Faturamento direto total
    const fatDiretoTotal = (() => {
        try {
            const fatItems = JSON.parse(formData.materialFaturamento);
            if (!Array.isArray(fatItems)) return 0;
            return fatItems.reduce((s: number, fi: any) => {
                const q = parseFloat(fi.quantity) || 0;
                const p = parseFloat(String(fi.unitPrice).replace(/\./g, '').replace(',', '.')) || 0;
                return s + q * p;
            }, 0);
        } catch { return 0; }
    })();

    const total = subtotal + fatDiretoTotal - discount;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (!formData.clientId) newErrors.clientId = 'Selecione um cliente';

        const hasValidItem = items.some(
            (item) => item.description.trim() && getItemTotal(item) > 0
        );
        if (!hasValidItem) newErrors.items = 'Adicione ao menos uma atividade com descrição e valor';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetForm = () => {
        setFormData({
            title: '',
            clientId: '',
            opportunityId: '',
            validUntil: '',
            discount: '',
            scope: '',
            deadline: '',
            paymentConditions: '',
            obligations: '',
            notes: '',
            workDescription: '',
            workAddress: '',
            workDeadlineDays: '',
            workDeadlineType: 'calendar_days',
            workDeadlineText: '',
            objectiveType: '',
            objectiveText: '',
            thirdPartyDeadlines: '[]',
            paymentBank: '',
            activityType: '',
            contractorObligations: '',
            clientObligations: '',
            generalProvisions: '',
            serviceDescription: '',
            materialFornecimento: '',
            materialFaturamento: '[]',
            paymentDueCondition: '',
            logisticsCostValue: '',
            logisticsCostMode: 'visible',
            logisticsCostPercent: '',
            logisticsCostApplyTo: 'material',
            logisticsCostEmbedMaterialPct: '100',
            logisticsCostEmbedServicePct: '0',
            logisticsCostDescription: 'Custo referente à mobilização e desmobilização de equipes, transporte de equipamentos especializados, veículos operacionais, combustível, pedágios e logística de campo necessários para a execução dos serviços no local da obra.',
            adminCostValue: '',
            adminCostMode: 'visible',
            adminCostPercent: '',
            adminCostApplyTo: 'material',
            adminCostEmbedMaterialPct: '100',
            adminCostEmbedServicePct: '0',
            adminCostDescription: 'Custo referente à gestão administrativa do contrato, incluindo coordenação técnica do projeto, acompanhamento e fiscalização de fornecedores, controle de qualidade, gestão documental, elaboração de relatórios técnicos e suporte operacional durante toda a vigência contratual.',
            brokerageCostValue: '',
            brokerageCostMode: 'visible',
            brokerageCostPercent: '',
            brokerageCostApplyTo: 'material',
            brokerageCostEmbedMaterialPct: '100',
            brokerageCostEmbedServicePct: '0',
            brokerageCostDescription: 'Custo referente a honorários de intermediação comercial, prospecção de oportunidades, negociação contratual e assessoria técnico-comercial para viabilização do projeto junto ao contratante.',
            insuranceCostValue: '',
            insuranceCostMode: 'visible',
            insuranceCostPercent: '',
            insuranceCostApplyTo: 'material',
            insuranceCostEmbedMaterialPct: '100',
            insuranceCostEmbedServicePct: '0',
            insuranceCostDescription: 'Custo referente à contratação de seguro de responsabilidade civil, cobertura de riscos operacionais, garantia sobre materiais e equipamentos, e proteção patrimonial durante a execução dos serviços conforme exigências normativas aplicáveis.',
            complianceText: '',
            itemVisibilityMode: 'detailed',
            materialSummaryText: '',
            serviceSummaryText: '',
            summaryTotalLabel: 'Valor Global',
        });
        setItems([{ ...emptyItem }]);
        setErrors({});
        setAttachedFiles([]);
    };

    const handleClientCreated = async () => {
        try {
            const data = await api.getClients();
            const clientList = Array.isArray(data) ? data : (data?.data ?? []);
            const mapped = clientList.map((c: any) => ({ id: c.id, name: c.name }));
            setClients(mapped);
            if (clientList.length > 0) {
                const newest = clientList.reduce((a: any, b: any) =>
                    new Date(a.createdAt) > new Date(b.createdAt) ? a : b
                );
                setFormData(prev => ({ ...prev, clientId: newest.id }));
                toast.success(`Cliente "${newest.name}" selecionado automaticamente!`);
            }
        } catch { /* ignore */ }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const validItems = items
                .filter((item) => item.description.trim() && (getItemTotal(item) > 0 || item.isBundleParent || item.parentId))
                .map((item) => ({
                    id: item.id,
                    description: item.description,
                    serviceType: item.serviceType,
                    parentId: item.parentId,
                    isBundleParent: item.isBundleParent,
                    showDetailedPrices: item.showDetailedPrices,
                    overridePrice: item.isBundleParent && item.overridePrice && item.overridePrice.trim() !== '' ? parsePrice(item.overridePrice) : null,
                    unitPrice: parsePrice(item.unitPrice),
                    quantity: parsePrice(item.quantity) || 1,
                    unit: item.unit || 'UN',
                    total: getItemTotal(item),
                    notes: item.internalNote?.trim() || null,
                }));

            const payload = {
                proposal: {
                    title: formData.title,
                    clientId: formData.clientId,
                    opportunityId: formData.opportunityId || null,
                    subtotal: subtotal,
                    total: total,
                    validUntil: formData.validUntil || null,
                    discount: discount,
                    scope: formData.scope || null,
                    deadline: formData.deadline || null,
                    paymentConditions: formData.paymentConditions || null,
                    obligations: formData.obligations || null,
                    notes: formData.notes || null,
                    workDescription: formData.workDescription || null,
                    workAddress: formData.workAddress || null,
                    workDeadlineDays: formData.workDeadlineDays ? Number(formData.workDeadlineDays) : null,
                    workDeadlineType: formData.workDeadlineType || 'calendar_days',
                    workDeadlineText: formData.workDeadlineText || null,
                    objectiveType: formData.objectiveType || null,
                    objectiveText: formData.objectiveText || null,
                    thirdPartyDeadlines: formData.thirdPartyDeadlines && formData.thirdPartyDeadlines !== '[]' ? formData.thirdPartyDeadlines : null,
                    paymentBank: formData.paymentBank || null,
                    activityType: formData.activityType || null,
                    contractorObligations: formData.contractorObligations || null,
                    clientObligations: formData.clientObligations || null,
                    generalProvisions: formData.generalProvisions || null,
                    serviceDescription: formData.serviceDescription || null,
                    materialFornecimento: formData.materialFornecimento || null,
                    materialFaturamento: formData.materialFaturamento && formData.materialFaturamento !== '[]' ? formData.materialFaturamento : null,
                    paymentDueCondition: formData.paymentDueCondition || null,
                    logisticsCostValue: formData.logisticsCostValue ? Number(formData.logisticsCostValue) : null,
                    logisticsCostMode: formData.logisticsCostMode || 'visible',
                    logisticsCostPercent: formData.logisticsCostPercent ? Number(formData.logisticsCostPercent) : null,
                    logisticsCostApplyTo: formData.logisticsCostApplyTo || 'material',
                    logisticsCostEmbedMaterialPct: formData.logisticsCostEmbedMaterialPct ? Number(formData.logisticsCostEmbedMaterialPct) : 100,
                    logisticsCostEmbedServicePct: formData.logisticsCostEmbedServicePct ? Number(formData.logisticsCostEmbedServicePct) : 0,
                    logisticsCostDescription: formData.logisticsCostDescription || null,
                    adminCostValue: formData.adminCostValue ? Number(formData.adminCostValue) : null,
                    adminCostMode: formData.adminCostMode || 'visible',
                    adminCostPercent: formData.adminCostPercent ? Number(formData.adminCostPercent) : null,
                    adminCostApplyTo: formData.adminCostApplyTo || 'material',
                    adminCostEmbedMaterialPct: formData.adminCostEmbedMaterialPct ? Number(formData.adminCostEmbedMaterialPct) : 100,
                    adminCostEmbedServicePct: formData.adminCostEmbedServicePct ? Number(formData.adminCostEmbedServicePct) : 0,
                    adminCostDescription: formData.adminCostDescription || null,
                    brokerageCostValue: formData.brokerageCostValue ? Number(formData.brokerageCostValue) : null,
                    brokerageCostMode: formData.brokerageCostMode || 'visible',
                    brokerageCostPercent: formData.brokerageCostPercent ? Number(formData.brokerageCostPercent) : null,
                    brokerageCostApplyTo: formData.brokerageCostApplyTo || 'material',
                    brokerageCostEmbedMaterialPct: formData.brokerageCostEmbedMaterialPct ? Number(formData.brokerageCostEmbedMaterialPct) : 100,
                    brokerageCostEmbedServicePct: formData.brokerageCostEmbedServicePct ? Number(formData.brokerageCostEmbedServicePct) : 0,
                    brokerageCostDescription: formData.brokerageCostDescription || null,
                    insuranceCostValue: formData.insuranceCostValue ? Number(formData.insuranceCostValue) : null,
                    insuranceCostMode: formData.insuranceCostMode || 'visible',
                    insuranceCostPercent: formData.insuranceCostPercent ? Number(formData.insuranceCostPercent) : null,
                    insuranceCostApplyTo: formData.insuranceCostApplyTo || 'material',
                    insuranceCostEmbedMaterialPct: formData.insuranceCostEmbedMaterialPct ? Number(formData.insuranceCostEmbedMaterialPct) : 100,
                    insuranceCostEmbedServicePct: formData.insuranceCostEmbedServicePct ? Number(formData.insuranceCostEmbedServicePct) : 0,
                    insuranceCostDescription: formData.insuranceCostDescription || null,
                    complianceText: formData.complianceText || null,
                    itemVisibilityMode: formData.itemVisibilityMode || 'detailed',
                    materialSummaryText: formData.materialSummaryText || null,
                    serviceSummaryText: formData.serviceSummaryText || null,
                    summaryTotalLabel: formData.summaryTotalLabel || 'Valor Global',
                },
                items: validItems,
            };

            if (initialData?.id) {
                // Atualizar proposta: enviar dados e itens separadamente
                await api.updateProposal(initialData.id, payload.proposal);
                if (validItems.length > 0) {
                    await api.updateProposalItems(initialData.id, validItems);
                }
                toast.success('Proposta atualizada com sucesso!');
            } else {
                await api.createProposal(payload);
                toast.success('Proposta criada com sucesso!');
            }

            // Upload attached files to Documents module
            if (attachedFiles.length > 0) {
                for (const file of attachedFiles) {
                    try {
                        await api.uploadDocument(file, {
                            name: file.name,
                            type: 'other',
                        });
                    } catch (err) {
                        console.error('Erro ao enviar anexo:', err);
                    }
                }
                toast.success(`${attachedFiles.length} anexo(s) enviado(s) ao módulo Documentos`);
            }

            resetForm();
            onOpenChange(false);
            onProposalCreated();
        } catch (error: any) {
            console.error('Erro ao salvar proposta:', error);
            console.error('Response status:', error?.response?.status);
            console.error('Response data:', JSON.stringify(error?.response?.data));
            console.error('Payload items count:', items.length, '(parents:', items.filter(i => i.isBundleParent).length, ', children:', items.filter(i => i.parentId).length, ')');
            const serverMsg = error?.response?.data?.message || error?.response?.data?.detail || '';
            toast.error(
                serverMsg ? `Erro: ${serverMsg}` : 'Erro ao salvar proposta. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">
                                    {initialData ? 'Editar Proposta' : 'Nova Proposta'}
                                    {initialData?.revisionNumber && (
                                        <span className="ml-2 text-sm font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                            Rev. {initialData.revisionNumber}
                                        </span>
                                    )}
                                </DialogTitle>
                                <DialogDescription>
                                    {initialData
                                        ? 'Atualize os dados e itens desta proposta comercial.'
                                        : 'Crie uma proposta comercial com atividades e valores.'
                                    }
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                        {/* Informações da Proposta */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                Informações da Proposta
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Label htmlFor="prop-title">Título *</Label>
                                    <Input
                                        id="prop-title"
                                        placeholder="Ex: Instalação Residencial Completa"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        className={errors.title ? 'border-red-500' : ''}
                                    />
                                    {errors.title && (
                                        <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <Label>Cliente *</Label>
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-xs text-amber-600 gap-1"
                                            onClick={() => setShowClientDialog(true)}
                                        >
                                            <UserPlus className="w-3 h-3" />
                                            Novo Cliente
                                        </Button>
                                    </div>
                                    {loadingClients ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Carregando clientes...
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.clientId}
                                            onValueChange={(v) =>
                                                setFormData({ ...formData, clientId: v })
                                            }
                                        >
                                            <SelectTrigger
                                                className={errors.clientId ? 'border-red-500' : ''}
                                            >
                                                <SelectValue placeholder="Selecione um cliente" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clients.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                                {clients.length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-slate-400">
                                                        Nenhum cliente cadastrado
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {errors.clientId && (
                                        <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="prop-validUntil">Validade</Label>
                                    <Input
                                        id="prop-validUntil"
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) =>
                                            setFormData({ ...formData, validUntil: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Atividades / Itens */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    Atividades / Serviços
                                </h3>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="outline" size="sm">
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Adicionar
                                            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => addItem()}>
                                            <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                            Item Avulso
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            addItem();
                                            // A pequena demora garante que o novo campo exista no DOM
                                            setTimeout(() => {
                                                const inputs = document.querySelectorAll('input[placeholder="Descrição ou pesquisar catálogo..."]');
                                                const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
                                                if (lastInput) lastInput.focus();
                                            }, 100);
                                        }}>
                                            <Search className="w-4 h-4 mr-2 text-slate-400" />
                                            Item do Catálogo
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                            setShowStructureSearch(true);
                                            setStructureSearchQuery('');
                                            setStructureResults([]);
                                            setLoadingStructures(true);
                                            try {
                                                const data = await api.getStructureTemplates();
                                                setStructureResults(Array.isArray(data) ? data : []);
                                            } catch { toast.error('Erro ao carregar estruturas'); }
                                            setLoadingStructures(false);
                                        }}>
                                            <Layers className="w-4 h-4 mr-2 text-amber-500" />
                                            Importar de Estrutura
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            setShowSinapiSearch(true);
                                            setSinapiQuery('');
                                            setSinapiResults([]);
                                        }}>
                                            <Database className="w-4 h-4 mr-2 text-blue-500" />
                                            Buscar SINAPI
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* SINAPI Search Panel — Unified with prices */}
                            {showSinapiSearch && (
                                <div className="border rounded-lg p-4 bg-blue-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                                            <Database className="w-4 h-4" /> Buscar Composição / Insumo SINAPI
                                        </p>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSinapiSearch(false)}>
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Buscar por código ou palavra-chave (ex: tomada, disjuntor)..."
                                            value={sinapiQuery}
                                            className="bg-white flex-1"
                                            onChange={e => setSinapiQuery(e.target.value)}
                                            onKeyDown={async e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (!sinapiQuery.trim()) return;
                                                    setLoadingSinapi(true);
                                                    try {
                                                        // Try unified search with prices first
                                                        const r = await api.client.get('/budgets/search', { params: { q: sinapiQuery, state: 'PE' } });
                                                        setSinapiResults(r.data || []);
                                                    } catch {
                                                        // Fallback to old endpoints if budgets/search not available
                                                        try {
                                                            const [compRes, inputRes] = await Promise.all([
                                                                api.client.get('/sinapi/compositions', { params: { search: sinapiQuery, limit: 15 } }),
                                                                api.client.get('/sinapi/inputs', { params: { search: sinapiQuery, limit: 15 } }),
                                                            ]);
                                                            const comps = (compRes.data?.items || compRes.data || []).map((c: any) => ({ ...c, type: 'composition' }));
                                                            const inputs = (inputRes.data?.items || inputRes.data || []).map((i: any) => ({ ...i, type: 'input' }));
                                                            setSinapiResults([...comps, ...inputs]);
                                                        } catch { toast.error('Erro na busca SINAPI'); }
                                                    }
                                                    setLoadingSinapi(false);
                                                }
                                            }}
                                        />
                                        <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={async () => {
                                            if (!sinapiQuery.trim()) return;
                                            setLoadingSinapi(true);
                                            try {
                                                const r = await api.client.get('/budgets/search', { params: { q: sinapiQuery, state: 'PE' } });
                                                setSinapiResults(r.data || []);
                                            } catch {
                                                try {
                                                    const [compRes, inputRes] = await Promise.all([
                                                        api.client.get('/sinapi/compositions', { params: { search: sinapiQuery, limit: 15 } }),
                                                        api.client.get('/sinapi/inputs', { params: { search: sinapiQuery, limit: 15 } }),
                                                    ]);
                                                    const comps = (compRes.data?.items || compRes.data || []).map((c: any) => ({ ...c, type: 'composition' }));
                                                    const inputs = (inputRes.data?.items || inputRes.data || []).map((i: any) => ({ ...i, type: 'input' }));
                                                    setSinapiResults([...comps, ...inputs]);
                                                } catch { toast.error('Erro na busca SINAPI'); }
                                            }
                                            setLoadingSinapi(false);
                                        }}>
                                            <Search className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {loadingSinapi ? (
                                        <div className="flex items-center gap-2 py-3 justify-center text-sm text-slate-400">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
                                        </div>
                                    ) : (
                                        <div className="max-h-56 overflow-y-auto space-y-1">
                                            {sinapiResults.length === 0 && sinapiQuery && (
                                                <p className="text-xs text-slate-400 text-center py-4">Nenhum resultado. Pressione Enter para buscar.</p>
                                            )}
                                            {sinapiResults.map((item: any) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm border border-transparent hover:border-blue-200"
                                                    onClick={async () => {
                                                        const price = Number(item.price || item.unitCost || item.priceNotTaxed || item.totalNotTaxed || 0);
                                                        const isComp = item.type === 'composition';

                                                        if (isComp) {
                                                            // ═══ COMPOSIÇÃO → Expandir como Bundle com sub-itens ═══
                                                            try {
                                                                setLoadingSinapi(true);
                                                                const treeRes = await api.client.get(`/sinapi/compositions/${item.code}/tree`, { params: { state: 'PE' } });
                                                                const tree = treeRes.data?.tree || [];
                                                                const parentTempId = `sinapi-${item.code}-${Date.now()}`;

                                                                // Parent bundle
                                                                const parentItem: ActivityItem = {
                                                                    id: parentTempId,
                                                                    description: `[SINAPI ${item.code}] ${item.description || ''}`.trim(),
                                                                    serviceType: 'service',
                                                                    unitPrice: '0',
                                                                    quantity: '1',
                                                                    unit: item.unit || 'UN',
                                                                    isBundleParent: true,
                                                                    showDetailedPrices: true,
                                                                };

                                                                // Flatten tree into children
                                                                const childItems: ActivityItem[] = [];
                                                                const flattenTree = (nodes: any[]) => {
                                                                    for (const node of nodes) {
                                                                        const coeff = Number(node.coefficient) || 1;
                                                                        let nodePrice = 0;
                                                                        let nodeUnit = node.unit || 'UN';
                                                                        let nodeType: string = 'material';

                                                                        if (node.price) {
                                                                            // Insumo leaf — use price with monthly→hourly conversion
                                                                            let rawPrice = Number(node.price?.priceNotTaxed || 0);
                                                                            if (nodeUnit === 'MES' || nodeUnit === 'MÊS') {
                                                                                rawPrice = rawPrice / 220;
                                                                                nodeUnit = 'H';
                                                                            }
                                                                            nodePrice = rawPrice * coeff;
                                                                        } else if (node.compositionCost) {
                                                                            // Sub-composition
                                                                            nodePrice = Number(node.compositionCost.totalNotTaxed || 0) * coeff;
                                                                        } else if (node.subtotal) {
                                                                            nodePrice = Number(node.subtotal.notTaxed || 0);
                                                                        }

                                                                        // Determine type from SINAPI input type
                                                                        if (node.inputType === 'mao_de_obra' || node.inputType === 'labor') {
                                                                            nodeType = 'service';
                                                                        } else {
                                                                            nodeType = 'material';
                                                                        }

                                                                        if (nodePrice > 0 || node.description) {
                                                                            childItems.push({
                                                                                description: `${node.code ? `[${node.code}] ` : ''}${node.description || ''}`.trim(),
                                                                                serviceType: nodeType,
                                                                                unitPrice: nodePrice.toFixed(2),
                                                                                quantity: '1',
                                                                                unit: nodeUnit,
                                                                                parentId: parentTempId,
                                                                            });
                                                                        }
                                                                    }
                                                                };

                                                                flattenTree(tree);

                                                                if (childItems.length > 0) {
                                                                    setItems(prev => [...prev, parentItem, ...childItems]);
                                                                    const totalComp = childItems.reduce((s, c) => s + Number(c.unitPrice), 0);
                                                                    toast.success(`Composição SINAPI ${item.code} expandida com ${childItems.length} sub-itens — Total R$ ${totalComp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                                                                } else {
                                                                    // Fallback: add as single item if tree is empty
                                                                    setItems(prev => [...prev, { ...parentItem, isBundleParent: false, unitPrice: String(price) }]);
                                                                    toast.success(`Composição SINAPI ${item.code} adicionada — R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                                                                }
                                                            } catch (err) {
                                                                console.error('Erro ao expandir composição:', err);
                                                                // Fallback: add as simple item
                                                                setItems(prev => [...prev, {
                                                                    description: `[SINAPI ${item.code}] ${item.description || ''}`.trim(),
                                                                    serviceType: 'service',
                                                                    unitPrice: String(price),
                                                                    quantity: '1',
                                                                    unit: item.unit || 'UN',
                                                                }]);
                                                                toast.success(`Composição SINAPI ${item.code} adicionada — R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                                                            } finally {
                                                                setLoadingSinapi(false);
                                                            }
                                                        } else {
                                                            // ═══ INSUMO → Adicionar como item simples ═══
                                                            const newItem: ActivityItem = {
                                                                description: `[SINAPI ${item.code}] ${item.description || ''}`.trim(),
                                                                serviceType: 'material',
                                                                unitPrice: String(price),
                                                                quantity: '1',
                                                                unit: item.unit || 'UN',
                                                            };
                                                            setItems(prev => [...prev, newItem]);
                                                            toast.success(`Insumo SINAPI ${item.code} adicionado — R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                                                        }
                                                        setShowSinapiSearch(false);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${item.type === 'composition' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {item.code}
                                                        </span>
                                                        <span className={`text-[10px] rounded px-1 ${item.type === 'composition' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {item.type === 'composition' ? 'Composição' : 'Insumo'}
                                                        </span>
                                                        <span className="flex-1 truncate">{item.description}</span>
                                                        {Number(item.price || item.unitCost || item.priceNotTaxed || item.totalNotTaxed || 0) > 0 && (
                                                            <span className={`text-xs font-bold whitespace-nowrap ${
                                                                item.priceSource?.startsWith('estimado') ? 'text-yellow-600' :
                                                                item.priceSource === 'sugerido_familia' ? 'text-orange-600' :
                                                                'text-emerald-600'
                                                            }`}>
                                                                R$ {Number(item.price || item.unitCost || item.priceNotTaxed || item.totalNotTaxed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                        {item.priceSource?.startsWith('estimado') && (
                                                            <span className="text-[8px] text-yellow-600 bg-yellow-50 border border-dashed border-yellow-300 rounded px-1">📊</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-0.5">{item.unit || ''}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Structure search popup */}
                            {showStructureSearch && (
                                <div className="border rounded-lg p-4 bg-amber-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                                            <Layers className="w-4 h-4" /> Selecione uma Estrutura
                                        </p>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowStructureSearch(false)}>
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    <Input
                                        placeholder="Filtrar por código ou nome..."
                                        value={structureSearchQuery}
                                        onChange={e => setStructureSearchQuery(e.target.value)}
                                        className="bg-white"
                                    />
                                    {loadingStructures ? (
                                        <div className="flex items-center gap-2 py-3 justify-center text-sm text-slate-400">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                                        </div>
                                    ) : (
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                            {structureResults
                                                .filter(s => {
                                                    if (!structureSearchQuery) return true;
                                                    const q = structureSearchQuery.toLowerCase();
                                                    return s.code?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q);
                                                })
                                                .map(st => (
                                                    <button
                                                        key={st.id}
                                                        type="button"
                                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-amber-100 text-sm flex justify-between items-center transition-colors"
                                                        onClick={async () => {
                                                            try {
                                                                const result = await api.getStructureTemplateForProposal(st.id);
                                                                if (result.items && result.items.length > 0) {
                                                                    const newItems = result.items.map((ri: any) => ({
                                                                        id: undefined,
                                                                        description: ri.description,
                                                                        serviceType: ri.serviceType || 'material',
                                                                        unitPrice: String(ri.unitPrice || 0),
                                                                        quantity: String(ri.quantity || 1),
                                                                        unit: ri.unit || 'UN',
                                                                        isBundleParent: false,
                                                                        parentId: undefined,
                                                                        showDetailedPrices: true,
                                                                    }));
                                                                    setItems(prev => [...prev.filter(i => i.description.trim()), ...newItems]);
                                                                    toast.success(`${result.items.length} itens importados da estrutura ${result.templateCode}`);
                                                                } else {
                                                                    toast.warning('Estrutura sem itens para importar');
                                                                }
                                                            } catch { toast.error('Erro ao importar estrutura'); }
                                                            setShowStructureSearch(false);
                                                        }}
                                                    >
                                                        <div>
                                                            <span className="font-semibold text-amber-800">{st.code}</span>
                                                            <span className="text-slate-600 ml-2">{st.name}</span>
                                                        </div>
                                                        <span className="text-xs text-slate-400">
                                                            {(st.items || []).length} itens
                                                        </span>
                                                    </button>
                                                ))}
                                            {structureResults.filter(s => {
                                                if (!structureSearchQuery) return true;
                                                const q = structureSearchQuery.toLowerCase();
                                                return s.code?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q);
                                            }).length === 0 && (
                                                <p className="text-center text-sm text-slate-400 py-3">Nenhuma estrutura encontrada</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {errors.items && (
                                <p className="text-red-500 text-xs">{errors.items}</p>
                            )}

                            <div className="border rounded-lg overflow-x-auto">
                                {/* Toggle Consolidated View */}
                                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Atividades / Serviços</span>
                                    <Button
                                        type="button"
                                        variant={consolidatedView ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => setConsolidatedView(!consolidatedView)}
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        {consolidatedView ? 'Voltar p/ Kits' : 'Ver Consolidado'}
                                    </Button>
                                </div>
                                {!consolidatedView && (
                                <Table className="min-w-[900px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[220px]">Descrição</TableHead>
                                            <TableHead className="w-[110px]">Tipo</TableHead>
                                            <TableHead className="w-[120px]">Preço Unit.</TableHead>
                                            <TableHead className="w-[90px]">Qtd</TableHead>
                                            <TableHead className="w-[80px]">UN</TableHead>
                                            <TableHead className="w-[130px]">Total</TableHead>
                                            <TableHead className="w-[40px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => {
                                            // Se for um filho, verificar se o pai está configurado para mostrar detalhes
                                            if (item.parentId) {
                                                const parent = items.find(it => it.id === item.parentId || (it.isBundleParent && 'temp-' + items.indexOf(it) === item.parentId));
                                                if (parent && !parent.showDetailedPrices) {
                                                    return null;
                                                }
                                            }

                                            return (
                                                <TableRow key={index} className={item.isBundleParent ? 'bg-slate-50/50' : item.parentId ? 'bg-white' : ''}>
                                                    <TableCell className="relative">
                                                        <div className={`space-y-1 ${item.parentId ? 'pl-6 border-l-2 border-slate-100 ml-2' : ''}`}>
                                                            <div className="flex items-center gap-2">
                                                                {item.isBundleParent && <Layers className="w-4 h-4 text-amber-500 shrink-0" />}
                                                                <Input
                                                                    placeholder={item.isBundleParent ? "Nome do Kit..." : "Descrição ou pesquisar catálogo..."}
                                                                    value={item.description}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        updateItem(index, 'description', val);
                                                                        debouncedSearch(index, val);
                                                                    }}
                                                                    onBlur={() => {
                                                                        // Delay to allow click on suggestion
                                                                        setTimeout(() => {
                                                                            setSearchResults(prev => ({ ...prev, [index]: [] }));
                                                                        }, 200);
                                                                    }}
                                                                    className="h-8 text-sm min-w-[180px]"
                                                                />
                                                                {(searchResults[index]?.length ?? 0) > 0 && (
                                                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                                        {searchResults[index].map((suggestion: any) => (
                                                                            <div
                                                                                key={suggestion.id}
                                                                                className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                                                                                onMouseDown={(e) => e.preventDefault()}
                                                                                onClick={async () => {
                                                                                    setSearchResults(prev => ({ ...prev, [index]: [] }));
                                                                                    const newItems = [...items];
                                                                                    if (suggestion.dataType === 'category') {
                                                                                        // Inserir Bundle
                                                                                        const parentTempId = 'temp-' + Date.now();
                                                                                        newItems[index] = {
                                                                                            ...newItems[index],
                                                                                            description: suggestion.name,
                                                                                            isBundleParent: true,
                                                                                            id: parentTempId,
                                                                                            showDetailedPrices: true,
                                                                                            unitPrice: '0',
                                                                                            quantity: '1',
                                                                                            serviceType: 'material'
                                                                                        };

                                                                                        try {
                                                                                            const catItems = await api.getCatalogCategoryItems(suggestion.id);
                                                                                            const childItems = catItems.map((ci: any) => ({
                                                                                                description: ci.name,
                                                                                                unitPrice: String(ci.unitPrice),
                                                                                                quantity: '1',
                                                                                                unit: ci.unit || 'UN',
                                                                                                serviceType: ci.type === 'service' ? 'service' : 'material',
                                                                                                parentId: parentTempId,
                                                                                                catalogItemId: ci.id,
                                                                                            }));
                                                                                            newItems.splice(index + 1, 0, ...childItems);
                                                                                        } catch (err) {
                                                                                            console.error('Erro ao buscar itens da categoria:', err);
                                                                                            toast.error('Erro ao carregar itens do kit.');
                                                                                        }
                                                                                    } else if (suggestion.isGrouping) {
                                                                                        // Kit/Agrupamento — expandir filhos com quantidades corretas
                                                                                        const parentTempId = 'temp-kit-' + Date.now();
                                                                                        newItems[index] = {
                                                                                            ...newItems[index],
                                                                                            description: suggestion.name,
                                                                                            isBundleParent: true,
                                                                                            id: parentTempId,
                                                                                            showDetailedPrices: true,
                                                                                            unitPrice: '0',
                                                                                            quantity: '1',
                                                                                            serviceType: suggestion.type === 'service' ? 'service' : 'material',
                                                                                            catalogItemId: suggestion.id,
                                                                                        };
                                                                                        try {
                                                                                            const groupingData = await api.getGroupingItems(suggestion.id);
                                                                                            if (groupingData && groupingData.length > 0) {
                                                                                                const childItems = groupingData.map((gi: any) => ({
                                                                                                    description: gi.childItem?.name || gi.description || '',
                                                                                                    unitPrice: String(gi.childItem?.unitPrice || gi.unitPrice || 0),
                                                                                                    quantity: String(gi.quantity || 1),
                                                                                                    unit: gi.unit || gi.childItem?.unit || 'UN',
                                                                                                    serviceType: gi.childItem?.type === 'service' ? 'service' : 'material',
                                                                                                    parentId: parentTempId,
                                                                                                    catalogItemId: gi.childItemId,
                                                                                                    showDetailedPrices: true,
                                                                                                }));
                                                                                                newItems.splice(index + 1, 0, ...childItems);
                                                                                                toast.success(`Kit "${suggestion.name}" expandido com ${childItems.length} item(s)`);
                                                                                            } else {
                                                                                                toast.warning('Agrupamento sem itens cadastrados');
                                                                                            }
                                                                                        } catch (err) {
                                                                                            console.error('Erro ao buscar itens do agrupamento:', err);
                                                                                            toast.error('Erro ao carregar itens do agrupamento.');
                                                                                        }
                                                                                    } else {
                                                                                        // Item normal — track catalogItemId for sync
                                                                                        const mappedType = suggestion.type === 'service' ? 'service' : 'material';
                                                                                        newItems[index] = {
                                                                                            ...newItems[index],
                                                                                            description: suggestion.name,
                                                                                            unitPrice: String(suggestion.unitPrice),
                                                                                            serviceType: mappedType,
                                                                                            unit: suggestion.unit || 'UN',
                                                                                            catalogItemId: suggestion.id,
                                                                                        };
                                                                                    }
                                                                                    setItems(newItems);
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center justify-between w-full">
                                                                                    {suggestion.isGrouping ? (
                                                                                        <div className="flex items-center gap-3 w-full">
                                                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 shrink-0">
                                                                                                <Layers className="w-4 h-4 text-blue-600" />
                                                                                            </div>
                                                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                                                <span className="font-semibold text-blue-900 text-sm truncate">{suggestion.name}</span>
                                                                                                <span className="text-xs text-blue-500">R$ {Number(suggestion.unitPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} &bull; Agrupamento</span>
                                                                                            </div>
                                                                                            <span className="text-[11px] bg-blue-600 text-white px-2 py-1 rounded-md font-bold shrink-0">KIT</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex items-center gap-2 w-full">
                                                                                            <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                                                <span className="font-medium text-sm truncate">{suggestion.name}</span>
                                                                                                <span className="text-xs text-slate-500">R$ {Number(suggestion.unitPrice).toLocaleString('pt-BR')} &bull; {suggestion.type === 'material' ? 'Material' : 'Servico'}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={item.serviceType}
                                                            onValueChange={(v) =>
                                                                updateItem(index, 'serviceType', v)
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8 text-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(serviceTypes).map(
                                                                    ([k, l]) => (
                                                                        <SelectItem key={k} value={k}>
                                                                            {l}
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="text" inputMode="decimal"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="0,00"
                                                            value={item.unitPrice}
                                                            onChange={(e) =>
                                                                updateItem(index, 'unitPrice', e.target.value)
                                                            }
                                                            className="h-8 text-sm w-28"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <Input
                                                                type="text" inputMode="decimal"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) =>
                                                                    updateItem(index, 'quantity', e.target.value)
                                                                }
                                                                className="h-8 text-sm w-20"
                                                            />
                                                            {item.parentId && (() => {
                                                                const effQty = getEffectiveQty(item);
                                                                const rawQty = parsePrice(item.quantity) || 1;
                                                                return effQty !== rawQty ? (
                                                                    <span className="text-[10px] text-blue-500 mt-0.5 whitespace-nowrap">
                                                                        Total: {effQty.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}
                                                                    </span>
                                                                ) : null;
                                                            })()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={item.unit || 'UN'}
                                                            onValueChange={(v) =>
                                                                updateItem(index, 'unit', v)
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8 text-sm w-20">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {unitOptions.map((u) => (
                                                                    <SelectItem key={u} value={u}>
                                                                        {u}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-sm font-medium ${item.isBundleParent ? 'text-amber-700 font-bold' : ''}`}>
                                                                R$ {fmtBRL(getItemTotal(item))}
                                                            </span>
                                                            {item.isBundleParent && (
                                                                <>
                                                                    {/* Preço calculado dos filhos como referência */}
                                                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                                                        Calculado: R$ {fmtBRL(getChildrenTotal(item))}
                                                                    </span>
                                                                    {/* Input de override */}
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <span className="text-[10px] text-amber-600 font-semibold whitespace-nowrap">Cobrar:</span>
                                                                        <Input
                                                                            type="text" inputMode="decimal"
                                                                            placeholder="auto"
                                                                            value={item.overridePrice || ''}
                                                                            onChange={(e) => updateItem(index, 'overridePrice', e.target.value)}
                                                                            className="h-6 text-xs w-20 text-right"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                                                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Exibir Detalhes:</span>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-8 p-0 hover:bg-amber-100"
                                                                            onClick={() => updateItem(index, 'showDetailedPrices', !item.showDetailedPrices)}
                                                                        >
                                                                            {item.showDetailedPrices ? (
                                                                                <Eye className="w-4 h-4 text-amber-600" />
                                                                            ) : (
                                                                                <EyeOff className="w-4 h-4 text-slate-400" />
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            title="Aplicar quantidade do kit nos itens filhos (multiplicar permanentemente)"
                                                                            className="h-6 px-1.5 p-0 hover:bg-green-100 text-[10px] gap-0.5"
                                                                            onClick={() => applyParentQtyToChildren(index)}
                                                                        >
                                                                            <Calculator className="w-3.5 h-3.5 text-green-600" />
                                                                            <span className="text-green-700 font-semibold">Aplicar Qtd</span>
                                                                        </Button>
                                     {item.catalogItemId && (
                                         <Button
                                             type="button"
                                             variant="ghost"
                                             size="sm"
                                             title="Editar Agrupamento"
                                             className="h-6 w-8 p-0 hover:bg-blue-100"
                                             onClick={async () => {
                                                 try {
                                                     const catalogItem = await api.getCatalogItem(item.catalogItemId!);
                                                     setEditingKitInProposal({ catalogItem, parentTempId: item.id || '' });
                                                 } catch {
                                                     toast.error('Erro ao carregar agrupamento');
                                                 }
                                             }}
                                         >
                                             <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                         </Button>
                                     )}

                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-0.5">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                title={item.internalNote ? `Nota: ${item.internalNote}` : 'Adicionar nota interna (oculta no PDF)'}
                                                                className={`h-7 w-7 ${item.internalNote ? 'text-blue-500 hover:text-blue-700' : 'text-slate-300 hover:text-blue-500'}`}
                                                                onClick={() => {
                                                                    const note = prompt(
                                                                        'Nota interna (visível apenas para a equipe, NÃO aparece na proposta/PDF):',
                                                                        item.internalNote || ''
                                                                    );
                                                                    if (note !== null) updateItem(index, 'internalNote', note);
                                                                }}
                                                            >
                                                                <MessageSquareText className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-400 hover:text-red-600"
                                                                onClick={() => removeItem(index)}
                                                                disabled={items.length <= 1}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                        {item.internalNote && (
                                                            <div className="mt-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 max-w-[150px] truncate" title={item.internalNote}>
                                                                📝 {item.internalNote}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                )}

                                {/* ═══ Consolidated View ═══ */}
                                {consolidatedView && (() => {
                                    // Agrupar filhos duplicados por catalogItemId ou description
                                    const childItems = items.filter(i => i.parentId && !i.isBundleParent);
                                    const parentItems = items.filter(i => !i.parentId && !i.isBundleParent);

                                    interface MergedChild {
                                        key: string;
                                        description: string;
                                        unitPrice: number;
                                        totalQty: number;
                                        unit: string;
                                        serviceType: string;
                                        kits: string[];
                                        sourceIndices: number[];
                                    }

                                    const mergedMap = new Map<string, MergedChild>();
                                    for (const child of childItems) {
                                        const key = child.catalogItemId || child.description;
                                        const itemIndex = items.indexOf(child);
                                        const parent = items.find(i => i.id === child.parentId);
                                        const parentQty = parent ? Math.max(parsePrice(parent.quantity) || 1, 1) : 1;
                                        const effectiveQty = (parsePrice(child.quantity) || 1) * parentQty;

                                        if (mergedMap.has(key)) {
                                            const existing = mergedMap.get(key)!;
                                            existing.totalQty += effectiveQty;
                                            existing.sourceIndices.push(itemIndex);
                                            if (parent && !existing.kits.includes(parent.description)) {
                                                existing.kits.push(parent.description);
                                            }
                                        } else {
                                            mergedMap.set(key, {
                                                key,
                                                description: child.description,
                                                unitPrice: parsePrice(child.unitPrice),
                                                totalQty: effectiveQty,
                                                unit: child.unit || 'UN',
                                                serviceType: child.serviceType || 'material',
                                                kits: parent ? [parent.description] : [],
                                                sourceIndices: [itemIndex],
                                            });
                                        }
                                    }
                                    const mergedItems = Array.from(mergedMap.values()).sort((a, b) => a.description.localeCompare(b.description));

                                    return (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[35%]">Material</TableHead>
                                                    <TableHead>Preço Unit.</TableHead>
                                                    <TableHead>Qtd Total</TableHead>
                                                    <TableHead>UN</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead>Kits</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {/* Itens avulsos (sem parentId, sem isBundleParent) */}
                                                {parentItems.map((item, idx) => (
                                                    <TableRow key={'standalone-' + idx}>
                                                        <TableCell>
                                                            <span className="text-sm font-medium">{item.description || '—'}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm">R$ {fmtBRL(parsePrice(item.unitPrice))}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm font-semibold">{parsePrice(item.quantity) || 1}</span>
                                                        </TableCell>
                                                        <TableCell><span className="text-sm">{item.unit || 'UN'}</span></TableCell>
                                                        <TableCell>
                                                            <span className="text-sm font-medium">R$ {fmtBRL(getItemTotal(item))}</span>
                                                        </TableCell>
                                                        <TableCell><span className="text-xs text-slate-400">—</span></TableCell>
                                                    </TableRow>
                                                ))}
                                                {/* Materiais consolidados dos kits */}
                                                {mergedItems.map((merged) => {
                                                    const total = merged.unitPrice * merged.totalQty;
                                                    return (
                                                        <TableRow key={merged.key} className={merged.sourceIndices.length > 1 ? 'bg-blue-50/40' : ''}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {merged.sourceIndices.length > 1 && (
                                                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">×{merged.sourceIndices.length}</span>
                                                                    )}
                                                                    <span className="text-sm font-medium">{merged.description}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-sm">R$ {fmtBRL(merged.unitPrice)}</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-sm font-semibold text-blue-700">{parseFloat(merged.totalQty.toFixed(3))}</span>
                                                            </TableCell>
                                                            <TableCell><span className="text-sm">{merged.unit}</span></TableCell>
                                                            <TableCell>
                                                                <span className="text-sm font-medium">R$ {fmtBRL(total)}</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {merged.kits.map((k, i) => (
                                                                        <span key={i} className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{k}</span>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                {mergedItems.length === 0 && parentItems.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-sm text-slate-400 py-4">
                                                            Nenhum item para consolidar
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    );
                                })()}
                            </div>
                            {/* Totais */}
                            <div className="flex flex-col items-end gap-1 text-sm">
                                <div className="flex gap-4">
                                    <span className="text-slate-500">Subtotal:</span>
                                    <span className="font-medium w-28 text-right">
                                        R$ {fmtBRL(subtotal)}
                                    </span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="text-slate-500">Desconto:</span>
                                    <Input
                                        type="text" inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={formData.discount}
                                        onChange={(e) =>
                                            setFormData({ ...formData, discount: e.target.value })
                                        }
                                        className="h-7 text-sm w-28 text-right"
                                    />
                                </div>
                                <div className="flex gap-4 pt-1 border-t">
                                    <span className="text-slate-700 font-semibold">Total:</span>
                                    <span className="font-bold text-amber-600 w-28 text-right">
                                        R$ {fmtBRL(total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Visibilidade para o Cliente */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Visibilidade para o Cliente
                            </h3>
                            <p className="text-xs text-slate-400">
                                Controle o que o cliente vê na proposta: itens detalhados com preços unitários, ou um texto comercial profissional com valor global.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Modo de Exibição</Label>
                                    <Select
                                        value={formData.itemVisibilityMode}
                                        onValueChange={(v) => setFormData({ ...formData, itemVisibilityMode: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="grouping">
                                                📦 Agrupamento — Apenas kits/agrupamentos com valor total
                                            </SelectItem>
                                            <SelectItem value="detailed">
                                                📋 Estrutura Detalhada — Agrupamentos + relação de materiais
                                            </SelectItem>
                                            <SelectItem value="consolidated">
                                                📊 Material Consolidado — Lista única de todos os materiais
                                            </SelectItem>
                                            <SelectItem value="commercial">
                                                📝 Descrição Comercial — Texto comercial inteligente
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.itemVisibilityMode === 'commercial' && (
                                    <div className="space-y-2">
                                        <Label>Label do Valor Total</Label>
                                        <Input
                                            placeholder="Ex: Valor Global"
                                            value={formData.summaryTotalLabel}
                                            onChange={(e) => setFormData({ ...formData, summaryTotalLabel: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            {formData.itemVisibilityMode === 'commercial' && (
                                <div className="space-y-4 mt-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500 font-medium">
                                            Textos comerciais que serão exibidos ao cliente no lugar das tabelas detalhadas:
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => {
                                                const matItems = items.filter(i => i.serviceType === 'material' && i.description.trim());
                                                const svcItems = items.filter(i => i.serviceType !== 'material' && i.description.trim());

                                                let matText = '';
                                                if (matItems.length > 0) {
                                                    const descriptions = matItems.map(i => i.description.trim().toLowerCase());
                                                    if (descriptions.length === 1) {
                                                        matText = `Fornecimento de ${descriptions[0]}, incluindo todo o material necessário para garantir a qualidade e durabilidade da instalação, conforme especificações técnicas e normas vigentes.`;
                                                    } else {
                                                        const last = descriptions.pop();
                                                        matText = `Fornecimento completo de toda estrutura composta por ${descriptions.join(', ')} e ${last}, incluindo todos os insumos, acessórios e componentes necessários para a execução conforme especificações técnicas aplicáveis.`;
                                                    }
                                                }

                                                let svcText = '';
                                                if (svcItems.length > 0) {
                                                    const descriptions = svcItems.map(i => i.description.trim().toLowerCase());
                                                    if (descriptions.length === 1) {
                                                        svcText = `Prestação de serviço de ${descriptions[0]}, executado por equipe técnica qualificada e habilitada conforme as normas regulamentadoras aplicáveis, com garantia de execução profissional.`;
                                                    } else {
                                                        const last = descriptions.pop();
                                                        svcText = `Prestação de serviços especializados incluindo ${descriptions.join(', ')} e ${last}, executados por equipe técnica devidamente qualificada, habilitada e em conformidade com as normas regulamentadoras vigentes.`;
                                                    }
                                                }

                                                setFormData({
                                                    ...formData,
                                                    materialSummaryText: matText,
                                                    serviceSummaryText: svcText,
                                                });
                                            }}
                                        >
                                            ✨ Gerar Texto Automático
                                        </Button>
                                    </div>

                                    {items.some(i => i.serviceType === 'material') && (
                                        <div className="space-y-2">
                                            <Label className="text-xs text-amber-700 font-semibold">
                                                Texto Comercial — Materiais
                                            </Label>
                                            <Textarea
                                                rows={4}
                                                placeholder="Ex: Fornecimento de toda estrutura de suporte, derivação e conexão..."
                                                value={formData.materialSummaryText}
                                                onChange={(e) => setFormData({ ...formData, materialSummaryText: e.target.value })}
                                                className="text-sm"
                                            />
                                        </div>
                                    )}

                                    {items.some(i => i.serviceType !== 'material') && (
                                        <div className="space-y-2">
                                            <Label className="text-xs text-amber-700 font-semibold">
                                                Texto Comercial — Serviços
                                            </Label>
                                            <Textarea
                                                rows={4}
                                                placeholder="Ex: Execução completa dos serviços de instalação, montagem e comissionamento..."
                                                value={formData.serviceSummaryText}
                                                onChange={(e) => setFormData({ ...formData, serviceSummaryText: e.target.value })}
                                                className="text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Dados da Obra */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Dados da Obra
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Descrição da Obra</Label>
                                    <Input
                                        placeholder="Ex: Condomínio Real Prime"
                                        value={formData.workDescription}
                                        onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Endereço da Obra</Label>
                                    <Input
                                        placeholder="Ex: Rua Principal, 100 — Recife/PE"
                                        value={formData.workAddress}
                                        onChange={(e) => setFormData({ ...formData, workAddress: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de Atividade</Label>
                                    <Select
                                        value={formData.activityType}
                                        onValueChange={(v) => setFormData({ ...formData, activityType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="extensao_rede">Extensão de Rede</SelectItem>
                                            <SelectItem value="energia_solar">Energia Solar</SelectItem>
                                            <SelectItem value="manutencao_eletrica">Manutenção Elétrica</SelectItem>
                                            <SelectItem value="manutencao_preventiva">🔧 O&M Preventiva</SelectItem>
                                            <SelectItem value="manutencao_preditiva">📊 O&M Preditiva</SelectItem>
                                            <SelectItem value="manutencao_corretiva">⚡ O&M Corretiva</SelectItem>
                                            <SelectItem value="plano_oem">📋 Plano O&M Recorrente</SelectItem>
                                            <SelectItem value="construcao_civil">Construção Civil</SelectItem>
                                            <SelectItem value="telecomunicacoes">Telecomunicações</SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Objetivo da Proposta</Label>
                                    <Select
                                        value={formData.objectiveType}
                                        onValueChange={(v) => setFormData({ ...formData, objectiveType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o objetivo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="service_only">Apenas Serviço</SelectItem>
                                            <SelectItem value="supply_only">Apenas Fornecimento</SelectItem>
                                            <SelectItem value="supply_and_service">Fornecimento e Serviço</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Texto do Objetivo (opcional — editável ou gerado por IA)</Label>
                                    <Textarea
                                        rows={3}
                                        placeholder="Descreva o objetivo detalhado da proposta ou deixe em branco para usar texto padrão..."
                                        value={formData.objectiveText}
                                        onChange={(e) => setFormData({ ...formData, objectiveText: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Prazos */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                <div className="space-y-2">
                                    <Label>Prazo (dias)</Label>
                                    <Input
                                        type="text" inputMode="decimal"
                                        placeholder="Ex: 45"
                                        value={formData.workDeadlineDays}
                                        onChange={(e) => setFormData({ ...formData, workDeadlineDays: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de Prazo</Label>
                                    <Select
                                        value={formData.workDeadlineType}
                                        onValueChange={(v) => setFormData({ ...formData, workDeadlineType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tipo de prazo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="calendar_days">Dias Corridos</SelectItem>
                                            <SelectItem value="business_days">Dias Úteis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-3">
                                    <Label>Texto do Prazo (editável — deixe em branco para usar o padrão)</Label>
                                    <Textarea
                                        rows={2}
                                        placeholder="Ex: contados a partir da data de aprovação desta proposta e efetiva liberação do local."
                                        value={formData.workDeadlineText}
                                        onChange={(e) => setFormData({ ...formData, workDeadlineText: e.target.value })}
                                        className="text-sm"
                                    />
                                </div>
                            </div>

                            {/* Prazos de Terceiros */}
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs text-slate-600 font-semibold uppercase">Prazos de Terceiros</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => {
                                            const current = (() => { try { return JSON.parse(formData.thirdPartyDeadlines); } catch { return []; } })();
                                            current.push({ name: '', days: '', type: 'calendar_days', description: '' });
                                            setFormData({ ...formData, thirdPartyDeadlines: JSON.stringify(current) });
                                        }}
                                    >
                                        <Plus className="w-3 h-3" /> Adicionar
                                    </Button>
                                </div>
                                {(() => {
                                    let tpDeadlines: any[] = [];
                                    try { tpDeadlines = JSON.parse(formData.thirdPartyDeadlines); } catch {}
                                    if (tpDeadlines.length === 0) {
                                        return <p className="text-xs text-slate-400 italic">Nenhum prazo de terceiro cadastrado.</p>;
                                    }
                                    return tpDeadlines.map((tp: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                                            <div className="col-span-3">
                                                {idx === 0 && <Label className="text-[10px] text-slate-500">Responsável</Label>}
                                                <Input
                                                    placeholder="Nome"
                                                    className="h-8 text-xs"
                                                    value={tp.name}
                                                    onChange={(e) => {
                                                        const arr = [...tpDeadlines];
                                                        arr[idx] = { ...arr[idx], name: e.target.value };
                                                        setFormData({ ...formData, thirdPartyDeadlines: JSON.stringify(arr) });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                {idx === 0 && <Label className="text-[10px] text-slate-500">Dias</Label>}
                                                <Input
                                                    placeholder="Dias"
                                                    className="h-8 text-xs"
                                                    type="text" inputMode="decimal"
                                                    value={tp.days}
                                                    onChange={(e) => {
                                                        const arr = [...tpDeadlines];
                                                        arr[idx] = { ...arr[idx], days: e.target.value };
                                                        setFormData({ ...formData, thirdPartyDeadlines: JSON.stringify(arr) });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                {idx === 0 && <Label className="text-[10px] text-slate-500">Tipo</Label>}
                                                <Select
                                                    value={tp.type || 'calendar_days'}
                                                    onValueChange={(v) => {
                                                        const arr = [...tpDeadlines];
                                                        arr[idx] = { ...arr[idx], type: v };
                                                        setFormData({ ...formData, thirdPartyDeadlines: JSON.stringify(arr) });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="calendar_days">Corridos</SelectItem>
                                                        <SelectItem value="business_days">Úteis</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-3">
                                                {idx === 0 && <Label className="text-[10px] text-slate-500">Descrição</Label>}
                                                <Input
                                                    placeholder="Descrição"
                                                    className="h-8 text-xs"
                                                    value={tp.description}
                                                    onChange={(e) => {
                                                        const arr = [...tpDeadlines];
                                                        arr[idx] = { ...arr[idx], description: e.target.value };
                                                        setFormData({ ...formData, thirdPartyDeadlines: JSON.stringify(arr) });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                                                    onClick={() => {
                                                        const arr = [...tpDeadlines];
                                                        arr.splice(idx, 1);
                                                        setFormData({ ...formData, thirdPartyDeadlines: JSON.stringify(arr) });
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Cláusulas do Contrato */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                Cláusulas do Contrato
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cláusula de Fornecimento de Materiais</Label>
                                    <Textarea
                                        rows={3}
                                        placeholder="Texto sobre fornecimento de materiais..."
                                        value={formData.materialFornecimento}
                                        onChange={(e) => setFormData({ ...formData, materialFornecimento: e.target.value })}
                                    />
                                </div>

                                {/* ── Faturamento Direto ── */}
                                <div className="space-y-3 md:col-span-2 p-4 bg-blue-50/60 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm font-semibold text-blue-700">Materiais para Faturamento Direto</Label>
                                            <p className="text-[10px] text-blue-500 mt-0.5">Materiais que o fornecedor fatura diretamente ao contratante</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs gap-1 border-blue-300 text-blue-600 hover:bg-blue-100"
                                            onClick={() => {
                                                const current = (() => { try { return JSON.parse(formData.materialFaturamento); } catch { return []; } })();
                                                current.push({ supplierName: '', supplierCnpj: '', material: '', quantity: '1', unitPrice: '', total: '' });
                                                setFormData({ ...formData, materialFaturamento: JSON.stringify(current) });
                                            }}
                                        >
                                            <Plus className="w-3 h-3" /> Adicionar Item
                                        </Button>
                                    </div>
                                    {(() => {
                                        let fatItems: any[] = [];
                                        try { fatItems = JSON.parse(formData.materialFaturamento); } catch {}
                                        if (fatItems.length === 0) {
                                            return <p className="text-xs text-blue-400 italic">Nenhum item de faturamento direto cadastrado.</p>;
                                        }
                                        const fatTotal = fatItems.reduce((s: number, fi: any) => {
                                            const q = parseFloat(fi.quantity) || 0;
                                            const p = parseFloat(String(fi.unitPrice).replace(/\./g, '').replace(',', '.')) || 0;
                                            return s + q * p;
                                        }, 0);
                                        return (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b border-blue-200">
                                                                <th className="text-left py-1.5 px-1 text-blue-600 font-semibold">Fornecedor</th>
                                                                <th className="text-left py-1.5 px-1 text-blue-600 font-semibold">CNPJ</th>
                                                                <th className="text-left py-1.5 px-1 text-blue-600 font-semibold">Material</th>
                                                                <th className="text-right py-1.5 px-1 text-blue-600 font-semibold">Qtd</th>
                                                                <th className="text-right py-1.5 px-1 text-blue-600 font-semibold">Preço Unit.</th>
                                                                <th className="text-right py-1.5 px-1 text-blue-600 font-semibold">Total</th>
                                                                <th className="w-8"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {fatItems.map((fi: any, idx: number) => {
                                                                const q = parseFloat(fi.quantity) || 0;
                                                                const p = parseFloat(String(fi.unitPrice).replace(/\./g, '').replace(',', '.')) || 0;
                                                                const lineTotal = q * p;
                                                                return (
                                                                    <tr key={idx} className="border-b border-blue-100">
                                                                        <td className="py-1 px-1">
                                                                            <Input
                                                                                placeholder="Nome do fornecedor"
                                                                                className="h-7 text-xs"
                                                                                value={fi.supplierName}
                                                                                onChange={(e) => {
                                                                                    const arr = [...fatItems];
                                                                                    arr[idx] = { ...arr[idx], supplierName: e.target.value };
                                                                                    setFormData({ ...formData, materialFaturamento: JSON.stringify(arr) });
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td className="py-1 px-1">
                                                                            <Input
                                                                                placeholder="00.000.000/0001-00"
                                                                                className="h-7 text-xs w-[150px]"
                                                                                value={fi.supplierCnpj}
                                                                                onChange={(e) => {
                                                                                    const arr = [...fatItems];
                                                                                    arr[idx] = { ...arr[idx], supplierCnpj: e.target.value };
                                                                                    setFormData({ ...formData, materialFaturamento: JSON.stringify(arr) });
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td className="py-1 px-1">
                                                                            <Input
                                                                                placeholder="Descrição do material"
                                                                                className="h-7 text-xs"
                                                                                value={fi.material}
                                                                                onChange={(e) => {
                                                                                    const arr = [...fatItems];
                                                                                    arr[idx] = { ...arr[idx], material: e.target.value };
                                                                                    setFormData({ ...formData, materialFaturamento: JSON.stringify(arr) });
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td className="py-1 px-1">
                                                                            <Input
                                                                                type="text" inputMode="decimal"
                                                                                placeholder="1"
                                                                                className="h-7 text-xs w-[60px] text-right"
                                                                                value={fi.quantity}
                                                                                onChange={(e) => {
                                                                                    const arr = [...fatItems];
                                                                                    arr[idx] = { ...arr[idx], quantity: e.target.value };
                                                                                    setFormData({ ...formData, materialFaturamento: JSON.stringify(arr) });
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td className="py-1 px-1">
                                                                            <Input
                                                                                type="text" inputMode="decimal"
                                                                                placeholder="0,00"
                                                                                className="h-7 text-xs w-[100px] text-right"
                                                                                value={fi.unitPrice}
                                                                                onChange={(e) => {
                                                                                    const arr = [...fatItems];
                                                                                    arr[idx] = { ...arr[idx], unitPrice: e.target.value };
                                                                                    setFormData({ ...formData, materialFaturamento: JSON.stringify(arr) });
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td className="py-1 px-1 text-right font-medium text-blue-700 whitespace-nowrap">
                                                                            R$ {lineTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className="py-1 px-1">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                                                                                onClick={() => {
                                                                                    const arr = [...fatItems];
                                                                                    arr.splice(idx, 1);
                                                                                    setFormData({ ...formData, materialFaturamento: JSON.stringify(arr) });
                                                                                }}
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="border-t-2 border-blue-300">
                                                                <td colSpan={5} className="py-2 px-1 text-right font-bold text-blue-800 text-xs">Total Faturamento Direto</td>
                                                                <td className="py-2 px-1 text-right font-bold text-blue-800 text-sm whitespace-nowrap">
                                                                    R$ {fatTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                                <td></td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="space-y-2">
                                    <Label>Cláusula de Execução do Serviço</Label>
                                    <Textarea
                                        rows={3}
                                        placeholder="Texto sobre execução do serviço..."
                                        value={formData.serviceDescription}
                                        onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Condição de Pagamento / Vencimento</Label>
                                    <Textarea
                                        rows={3}
                                        placeholder="Ex: Após execução do serviço, mediante emissão de NF com prazo de 30 dias"
                                        value={formData.paymentDueCondition}
                                        onChange={(e) => setFormData({ ...formData, paymentDueCondition: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Dados Bancários</Label>
                                        <div className="flex items-center gap-1">
                                            {formData.paymentBank.trim() && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 px-2"
                                                    onClick={() => {
                                                        const label = prompt('Nome para esta conta (Ex: Banco do Brasil PJ, Caixa PF):');
                                                        if (!label?.trim()) return;
                                                        const saved = JSON.parse(localStorage.getItem('electraflow_bank_accounts') || '[]');
                                                        saved.push({ label: label.trim(), value: formData.paymentBank.trim() });
                                                        localStorage.setItem('electraflow_bank_accounts', JSON.stringify(saved));
                                                        toast.success(`Conta "${label.trim()}" salva!`);
                                                    }}
                                                >
                                                    💾 Salvar atual
                                                </Button>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-[10px] gap-1 px-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                                                    >
                                                        ⚡ Contas Salvas
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-72 max-h-64 overflow-y-auto">
                                                    {(() => {
                                                        const saved = JSON.parse(localStorage.getItem('electraflow_bank_accounts') || '[]') as { label: string; value: string }[];
                                                        if (saved.length === 0) {
                                                            return (
                                                                <DropdownMenuItem disabled className="text-xs text-slate-400">
                                                                    Nenhuma conta salva. Preencha e clique em "💾 Salvar atual"
                                                                </DropdownMenuItem>
                                                            );
                                                        }
                                                        return saved.map((acc: { label: string; value: string }, i: number) => (
                                                            <DropdownMenuItem
                                                                key={i}
                                                                className="flex items-center justify-between text-xs"
                                                                onClick={() => setFormData({ ...formData, paymentBank: acc.value })}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">🏦 {acc.label}</p>
                                                                    <p className="text-[10px] text-slate-400 truncate">{acc.value.substring(0, 50)}...</p>
                                                                </div>
                                                                <button
                                                                    className="ml-2 p-0.5 text-red-300 hover:text-red-600 shrink-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!confirm(`Remover "${acc.label}" das contas salvas?`)) return;
                                                                        const updated = saved.filter((_: any, idx: number) => idx !== i);
                                                                        localStorage.setItem('electraflow_bank_accounts', JSON.stringify(updated));
                                                                        toast.success(`Conta "${acc.label}" removida.`);
                                                                    }}
                                                                    title="Remover"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </DropdownMenuItem>
                                                        ));
                                                    })()}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <Textarea
                                        rows={3}
                                        placeholder="Banco, Agência, Conta, PIX..."
                                        value={formData.paymentBank}
                                        onChange={(e) => setFormData({ ...formData, paymentBank: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Obrigações da CONTRATADA</Label>
                                    <Textarea
                                        rows={4}
                                        placeholder="Cada obrigação em uma nova linha..."
                                        value={formData.contractorObligations}
                                        onChange={(e) => setFormData({ ...formData, contractorObligations: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Obrigações do CONTRATANTE</Label>
                                    <Textarea
                                        rows={4}
                                        placeholder="Cada obrigação em uma nova linha..."
                                        value={formData.clientObligations}
                                        onChange={(e) => setFormData({ ...formData, clientObligations: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Disposições Gerais</Label>
                                    <Textarea
                                        rows={4}
                                        placeholder="Deixe em branco para usar as cláusulas padrão..."
                                        value={formData.generalProvisions}
                                        onChange={(e) => setFormData({ ...formData, generalProvisions: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Composição de Custos */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Composição de Custos Adicionais
                            </h3>
                            <p className="text-xs text-slate-400">
                                Configure os custos extras. Escolha se cada custo aparece visível na proposta, é embutido no preço ou é evidenciado com descrição técnica.
                            </p>

                            {/* ── Logístico ── */}
                            <div className="border rounded-lg p-4 space-y-3">
                                <p className="text-sm font-semibold text-slate-700">Custo Logístico</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Valor (R$)</Label>
                                        <Input type="text" inputMode="decimal" step="0.01" placeholder="0,00" value={formData.logisticsCostValue}
                                            onChange={(e) => setFormData({ ...formData, logisticsCostValue: e.target.value })} className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Ou % sobre base</Label>
                                        <Input type="text" inputMode="decimal" step="0.01" placeholder="Ex: 10" value={formData.logisticsCostPercent}
                                            onChange={(e) => setFormData({ ...formData, logisticsCostPercent: e.target.value })} className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Exibição</Label>
                                        <Select value={formData.logisticsCostMode} onValueChange={(v) => setFormData({ ...formData, logisticsCostMode: v })}>
                                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="visible">Visível ao cliente</SelectItem>
                                                <SelectItem value="embedded">Embutir no preço</SelectItem>
                                                <SelectItem value="evidenciado">Evidenciado (com descrição)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {formData.logisticsCostMode === 'embedded' && (
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-md border border-amber-200">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-amber-700">% em Material</Label>
                                            <Input type="text" inputMode="decimal" step="1" min="0" max="100" value={formData.logisticsCostEmbedMaterialPct}
                                                onChange={(e) => {
                                                    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                    setFormData({ ...formData, logisticsCostEmbedMaterialPct: String(v), logisticsCostEmbedServicePct: String(100 - v) });
                                                }} className="h-8 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-amber-700">% em Serviço</Label>
                                            <Input type="text" inputMode="decimal" step="1" min="0" max="100" value={formData.logisticsCostEmbedServicePct}
                                                onChange={(e) => {
                                                    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                    setFormData({ ...formData, logisticsCostEmbedServicePct: String(v), logisticsCostEmbedMaterialPct: String(100 - v) });
                                                }} className="h-8 text-sm" />
                                        </div>
                                    </div>
                                )}
                                {formData.logisticsCostMode === 'evidenciado' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-blue-600">Descrição técnico-comercial</Label>
                                        <Textarea rows={3} value={formData.logisticsCostDescription}
                                            onChange={(e) => setFormData({ ...formData, logisticsCostDescription: e.target.value })}
                                            className="text-sm" placeholder="Descreva a justificativa operacional e comercial deste custo..." />
                                    </div>
                                )}
                            </div>

                            {/* ── Administrativo ── */}
                            <div className="border rounded-lg p-4 space-y-3">
                                <p className="text-sm font-semibold text-slate-700">Custo Administrativo</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Valor (R$)</Label>
                                        <Input type="text" inputMode="decimal" step="0.01" placeholder="0,00" value={formData.adminCostValue}
                                            onChange={(e) => setFormData({ ...formData, adminCostValue: e.target.value })} className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Ou % sobre base</Label>
                                        <Input type="text" inputMode="decimal" step="0.01" placeholder="Ex: 5" value={formData.adminCostPercent}
                                            onChange={(e) => setFormData({ ...formData, adminCostPercent: e.target.value })} className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Exibição</Label>
                                        <Select value={formData.adminCostMode} onValueChange={(v) => setFormData({ ...formData, adminCostMode: v })}>
                                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="visible">Visível ao cliente</SelectItem>
                                                <SelectItem value="embedded">Embutir no preço</SelectItem>
                                                <SelectItem value="evidenciado">Evidenciado (com descrição)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {formData.adminCostMode === 'embedded' && (
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-md border border-amber-200">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-amber-700">% em Material</Label>
                                            <Input type="text" inputMode="decimal" step="1" min="0" max="100" value={formData.adminCostEmbedMaterialPct}
                                                onChange={(e) => {
                                                    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                    setFormData({ ...formData, adminCostEmbedMaterialPct: String(v), adminCostEmbedServicePct: String(100 - v) });
                                                }} className="h-8 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-amber-700">% em Serviço</Label>
                                            <Input type="text" inputMode="decimal" step="1" min="0" max="100" value={formData.adminCostEmbedServicePct}
                                                onChange={(e) => {
                                                    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                    setFormData({ ...formData, adminCostEmbedServicePct: String(v), adminCostEmbedMaterialPct: String(100 - v) });
                                                }} className="h-8 text-sm" />
                                        </div>
                                    </div>
                                )}
                                {formData.adminCostMode === 'evidenciado' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-blue-600">Descrição técnico-comercial</Label>
                                        <Textarea rows={3} value={formData.adminCostDescription}
                                            onChange={(e) => setFormData({ ...formData, adminCostDescription: e.target.value })}
                                            className="text-sm" placeholder="Descreva a justificativa operacional e comercial deste custo..." />
                                    </div>
                                )}
                            </div>

                            {/* ── Corretagem ── */}
                            <div className="border rounded-lg p-4 space-y-3">
                                <p className="text-sm font-semibold text-slate-700">Corretagem</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Valor (R$)</Label>
                                        <Input type="text" inputMode="decimal" step="0.01" placeholder="0,00" value={formData.brokerageCostValue}
                                            onChange={(e) => setFormData({ ...formData, brokerageCostValue: e.target.value })} className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Ou % sobre base</Label>
                                        <Input type="text" inputMode="decimal" step="0.01" placeholder="Ex: 3" value={formData.brokerageCostPercent}
                                            onChange={(e) => setFormData({ ...formData, brokerageCostPercent: e.target.value })} className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Exibição</Label>
                                        <Select value={formData.brokerageCostMode} onValueChange={(v) => setFormData({ ...formData, brokerageCostMode: v })}>
                                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="visible">Visível ao cliente</SelectItem>
                                                <SelectItem value="embedded">Embutir no preço</SelectItem>
                                                <SelectItem value="evidenciado">Evidenciado (com descrição)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {formData.brokerageCostMode === 'embedded' && (
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-md border border-amber-200">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-amber-700">% em Material</Label>
                                            <Input type="text" inputMode="decimal" step="1" min="0" max="100" value={formData.brokerageCostEmbedMaterialPct}
                                                onChange={(e) => {
                                                    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                    setFormData({ ...formData, brokerageCostEmbedMaterialPct: String(v), brokerageCostEmbedServicePct: String(100 - v) });
                                                }} className="h-8 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-amber-700">% em Serviço</Label>
                                            <Input type="text" inputMode="decimal" step="1" min="0" max="100" value={formData.brokerageCostEmbedServicePct}
                                                onChange={(e) => {
                                                    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                    setFormData({ ...formData, brokerageCostEmbedServicePct: String(v), brokerageCostEmbedMaterialPct: String(100 - v) });
                                                }} className="h-8 text-sm" />
                                        </div>
                                    </div>
                                )}
                                {formData.brokerageCostMode === 'evidenciado' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-blue-600">Descrição técnico-comercial</Label>
                                        <Textarea rows={3} value={formData.brokerageCostDescription}
                                            onChange={(e) => setFormData({ ...formData, brokerageCostDescription: e.target.value })}
                                            className="text-sm" placeholder="Descreva a justificativa operacional e comercial deste custo..." />
                                    </div>
                                )}
                            </div>

                            {/* ── Seguro ── */}
                            <div className="border rounded-lg p-4 space-y-3">
                                <p className="text-sm font-semibold text-slate-700">Seguro</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Valor (R$)</Label>
                                        <Input type="text" inputMode="decimal" step="0.01" placeholder="0,00" value={formData.insuranceCostValue}
                                            onChange={(e) => setFormData({ ...formData, insuranceCostValue: e.target.value })} className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Ou % sobre base</Label>
                                        <Input type="text" inputMode="decimal" step="0.01" placeholder="Ex: 2" value={formData.insuranceCostPercent}
                                            onChange={(e) => setFormData({ ...formData, insuranceCostPercent: e.target.value })} className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Exibição</Label>
                                        <Select value={formData.insuranceCostMode} onValueChange={(v) => setFormData({ ...formData, insuranceCostMode: v })}>
                                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="visible">Visível ao cliente</SelectItem>
                                                <SelectItem value="embedded">Embutir no preço</SelectItem>
                                                <SelectItem value="evidenciado">Evidenciado (com descrição)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {formData.insuranceCostMode === 'embedded' && (
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-md border border-amber-200">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-amber-700">% em Material</Label>
                                            <Input type="text" inputMode="decimal" step="1" min="0" max="100" value={formData.insuranceCostEmbedMaterialPct}
                                                onChange={(e) => {
                                                    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                    setFormData({ ...formData, insuranceCostEmbedMaterialPct: String(v), insuranceCostEmbedServicePct: String(100 - v) });
                                                }} className="h-8 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-amber-700">% em Serviço</Label>
                                            <Input type="text" inputMode="decimal" step="1" min="0" max="100" value={formData.insuranceCostEmbedServicePct}
                                                onChange={(e) => {
                                                    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                    setFormData({ ...formData, insuranceCostEmbedServicePct: String(v), insuranceCostEmbedMaterialPct: String(100 - v) });
                                                }} className="h-8 text-sm" />
                                        </div>
                                    </div>
                                )}
                                {formData.insuranceCostMode === 'evidenciado' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-blue-600">Descrição técnico-comercial</Label>
                                        <Textarea rows={3} value={formData.insuranceCostDescription}
                                            onChange={(e) => setFormData({ ...formData, insuranceCostDescription: e.target.value })}
                                            className="text-sm" placeholder="Descreva a justificativa operacional e comercial deste custo..." />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Conformidade Normativa */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Conformidade Normativa
                            </h3>
                            <div className="space-y-2">
                                <Label>Texto de Conformidade (NRs)</Label>
                                <Textarea
                                    rows={3}
                                    placeholder="Deixe em branco para texto padrão: 'Todos os colaboradores da CONTRATADA atendem aos requisitos das NRs aplicáveis...'"
                                    value={formData.complianceText}
                                    onChange={(e) => setFormData({ ...formData, complianceText: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="space-y-2">
                            <Label htmlFor="prop-notes">Observações</Label>
                            <Textarea
                                id="prop-notes"
                                placeholder="Condições, prazos de execução, garantias..."
                                rows={3}
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                            />
                        </div>

                        {/* Anexos */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Upload className="w-4 h-4" /> Anexos
                            </h3>
                            <div className="relative group h-20 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:border-amber-400 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center cursor-pointer">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                        e.target.value = '';
                                    }}
                                />
                                <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                                <span className="text-xs text-slate-500 mt-1">Clique para anexar arquivos</span>
                                <span className="text-[10px] text-slate-400">Salvos automaticamente no módulo Documentos</span>
                            </div>

                            {attachedFiles.length > 0 && (
                                <div className="space-y-1.5">
                                    {attachedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                                            <div className="w-7 h-7 rounded bg-amber-100 flex items-center justify-center shrink-0">
                                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                                                <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-red-500 shrink-0"
                                                onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {loading
                                    ? (initialData ? 'Salvando...' : 'Criando...')
                                    : (initialData ? 'Salvar Alterações' : 'Criar Proposta')
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Client Dialog for advanced creation */}
            <ClientDialog
                open={showClientDialog}
                onOpenChange={setShowClientDialog}
                onSuccess={handleClientCreated}
            />

            {/* Editar Agrupamento de dentro da Proposta */}
            {editingKitInProposal && (
                <NewGroupingDialog
                    open={!!editingKitInProposal}
                    onOpenChange={(o) => { if (!o) setEditingKitInProposal(null); }}
                    activeTab={editingKitInProposal.catalogItem?.type === 'service' ? 'service' : 'material'}
                    initialItem={editingKitInProposal.catalogItem}
                    onSuccess={() => {
                        const { catalogItem, parentTempId } = editingKitInProposal;
                        reloadKitChildren(catalogItem.id, parentTempId);
                        setEditingKitInProposal(null);
                    }}
                />
            )}
        </>
    );
}
