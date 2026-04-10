import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { SolarProposalPDFTemplate } from '@/components/SolarProposalPDFTemplate';
import { ClientDialog } from '@/components/ClientDialog';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sun, Plus, Search, Loader2, Eye, Trash2, Zap, ArrowLeft, ArrowRight,
  CheckCircle2, Building2, BarChart3, FileText, Package, Calculator,
  TrendingUp, DollarSign, Calendar, MapPin, Star, Copy, XCircle, Crown, Download, RefreshCw,
} from 'lucide-react';

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtN = (v: number, d = 1) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

// Helper: show empty string when value is 0 so user types directly without leading zero
const numVal = (v: any): string => {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(v);
  return n === 0 ? '' : String(v);
};

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600' },
  dimensioned: { label: 'Dimensionado', color: 'bg-blue-100 text-blue-700' },
  proposal_generated: { label: 'Proposta Gerada', color: 'bg-amber-100 text-amber-700' },
  sent: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  accepted: { label: 'Aceito', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
};

const STEPS = [
  { key: 'client', label: 'Cliente', icon: Building2 },
  { key: 'diagnosis', label: 'Diagnóstico', icon: Zap },
  { key: 'property', label: 'Imóvel', icon: MapPin },
  { key: 'dimensioning', label: 'Dimensionamento', icon: Calculator },
  { key: 'equipment', label: 'Equipamentos', icon: Package },
  { key: 'kits', label: 'Kits Comerciais', icon: Crown },
  { key: 'financial', label: 'Simulação', icon: BarChart3 },
  { key: 'proposal', label: 'Proposta', icon: FileText },
];

const DEFAULT_GUARANTEES: { text: string; value: number }[] = [
  { text: 'Suporte técnico especializado', value: 200 },
  { text: 'Garantia de 6 meses na instalação', value: 500 },
  { text: 'Gerenciamento de geração', value: 300 },
  { text: 'Resumos mensais', value: 150 },
  { text: '3 Consultorias de geração', value: 450 },
  { text: 'Custeio de itens de proteção durante garantia', value: 800 },
  { text: 'Sem custo adicional de cabeamento', value: 600 },
  { text: '1 Manutenção preventiva (limpeza), após 1 ano', value: 350 },
];

const createEmptyKit = (name: string, isRecommended: boolean, equipment: any[] = []) => ({
  name, isRecommended, showGuaranteeValues: true,
  equipment: equipment.map(eq => ({ ...eq })),
  guarantees: DEFAULT_GUARANTEES.map(g => ({ text: g.text, included: isRecommended, value: g.value })),
  laborCost: 0, installationCost: 0, otherCosts: 0, margin: 15, totalPrice: 0,
});

const DEFAULT_EQUIPMENT_TYPES = [
  { value: 'module', label: 'Módulo Solar' },
  { value: 'inverter', label: 'Inversor' },
  { value: 'structure', label: 'Estrutura de Fixação' },
  { value: 'stringbox', label: 'String Box' },
  { value: 'cable', label: 'Cabos' },
  { value: 'protection', label: 'Proteções Elétricas' },
  { value: 'other', label: 'Outro' },
];

export default function SolarProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false); // Guard against concurrent saves
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showPdfRender, setShowPdfRender] = useState(false);
  const [pdfCompanyData, setPdfCompanyData] = useState<any>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [searchingCatalog, setSearchingCatalog] = useState(false);
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);
  const [customEquipmentTypes, setCustomEquipmentTypes] = useState<{value: string; label: string}[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Form state
  const [form, setForm] = useState<any>({
    title: '', clientId: '', companyId: '',
    billingCategory: 'BT', detailedAnalysis: false,
    monthlyConsumptions: null,
    consumptionKwh: '', avgBillValue: '', tariff: '', connectionType: 'biphasic',
    contractedDemand: '', meterType: '', concessionaria: '',
    consumptionPeakKwh: '', consumptionOffPeakKwh: '',
    tariffPeak: '', tariffOffPeak: '',
    demandPeakKw: '', demandOffPeakKw: '', tariffModality: '',
    installationType: 'roof', availableArea: '', roofOrientation: 'norte',
    roofInclination: '', hasShadows: false,
    propertyCep: '', propertyAddress: '', propertyNeighborhood: '', propertyCity: '', propertyState: '',
    equipment: [],
    commercialStrategyEnabled: false,
    commercialKits: [],
    laborCost: '', installationCost: '', logisticsCost: '', insuranceCost: '',
    engineeringCost: '', documentationCost: '', otherCosts: '', margin: '15',
    annualEnergyIncrease: '6', annualDegradation: '0.5',
    notes: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, cData, coData] = await Promise.allSettled([
        api.getSolarProjects(),
        api.getClients(),
        api.getCompanies(),
      ]);
      setProjects(pData.status === 'fulfilled' ? (Array.isArray(pData.value) ? pData.value : []) : []);
      setClients(cData.status === 'fulfilled' ? (Array.isArray(cData.value) ? cData.value : (cData.value?.data ?? [])) : []);
      setCompanies(coData.status === 'fulfilled' ? (Array.isArray(coData.value) ? coData.value : []) : []);
    } catch { /* */ } finally { setLoading(false); }
  };

  // Callback after creating a new client
  const handleNewClientCreated = async () => {
    try {
      const cData = await api.getClients();
      const list = Array.isArray(cData) ? cData : (cData?.data ?? []);
      setClients(list);
      // Auto-select the latest client (last in the list)
      if (list.length > 0) {
        const newest = list[list.length - 1];
        handleClientChange(newest.id);
        toast.success(`Cliente "${newest.name}" selecionado automaticamente`);
      }
    } catch { /* */ }
  };

  // ═══ CLIENT AUTO-FILL ═══
  const handleClientChange = (clientId: string) => {
    if (!clientId || clientId === '__none__') {
      setForm((f: any) => ({ ...f, clientId: '' }));
      return;
    }
    const client = clients.find((c: any) => c.id === clientId);
    if (client) {
      setForm((f: any) => ({
        ...f, clientId,
        concessionaria: client.concessionaria || f.concessionaria,
        propertyAddress: client.address || f.propertyAddress,
        propertyCity: client.city || f.propertyCity,
        propertyState: client.state || f.propertyState,
        consumptionKwh: client.consumptionKwh || f.consumptionKwh,
      }));
    }
  };

  // ═══ NEW PROJECT ═══
  const handleStartNew = () => {
    setForm({
      title: '', clientId: '',
      billingCategory: 'BT', detailedAnalysis: false,
      monthlyConsumptions: null,
      consumptionKwh: '', avgBillValue: '', tariff: '', connectionType: 'biphasic',
      contractedDemand: '', meterType: '', concessionaria: '',
      consumptionPeakKwh: '', consumptionOffPeakKwh: '',
      tariffPeak: '', tariffOffPeak: '',
      demandPeakKw: '', demandOffPeakKw: '', tariffModality: '',
      installationType: 'roof', availableArea: '', roofOrientation: 'norte',
      roofInclination: '', hasShadows: false,
      propertyCep: '', propertyAddress: '', propertyNeighborhood: '', propertyCity: '', propertyState: '',
      equipment: [],
      commercialStrategyEnabled: false,
      commercialKits: [],
      laborCost: '', installationCost: '', logisticsCost: '', insuranceCost: '',
      engineeringCost: '', documentationCost: '', otherCosts: '', margin: '15',
      annualEnergyIncrease: '6', annualDegradation: '0.5',
      notes: '',
    });
    setCurrentProject(null);
    setStep(0);
    setView('wizard');
  };

  // ═══ OPEN EXISTING ═══
  const handleOpenProject = async (project: any) => {
    try {
      const full = await api.getSolarProject(project.id);
      setCurrentProject(full);
      setForm({
        title: full.title || '', clientId: full.clientId || '',
        billingCategory: full.billingCategory || 'BT', detailedAnalysis: full.detailedAnalysis || false,
        monthlyConsumptions: full.monthlyConsumptions || null,
        consumptionKwh: full.consumptionKwh || '', avgBillValue: full.avgBillValue || '',
        tariff: full.tariff || '', connectionType: full.connectionType || 'biphasic',
        contractedDemand: full.contractedDemand || '', meterType: full.meterType || '',
        concessionaria: full.concessionaria || '',
        consumptionPeakKwh: full.consumptionPeakKwh || '', consumptionOffPeakKwh: full.consumptionOffPeakKwh || '',
        tariffPeak: full.tariffPeak || '', tariffOffPeak: full.tariffOffPeak || '',
        demandPeakKw: full.demandPeakKw || '', demandOffPeakKw: full.demandOffPeakKw || '',
        tariffModality: full.tariffModality || '',
        installationType: full.installationType || 'roof', availableArea: full.availableArea || '',
        roofOrientation: full.roofOrientation || 'norte', roofInclination: full.roofInclination || '',
        hasShadows: full.hasShadows || false,
        propertyCep: full.propertyCep || '', propertyAddress: full.propertyAddress || '',
        propertyNeighborhood: full.propertyNeighborhood || '',
        propertyCity: full.propertyCity || '', propertyState: full.propertyState || '',
        equipment: full.equipment || [],
        commercialStrategyEnabled: full.commercialStrategyEnabled || false,
        commercialKits: full.commercialKits || [],
        laborCost: full.laborCost || '', installationCost: full.installationCost || '',
        logisticsCost: full.logisticsCost || '', insuranceCost: full.insuranceCost || '',
        engineeringCost: full.engineeringCost || '', documentationCost: full.documentationCost || '',
        otherCosts: full.otherCosts || '', margin: full.margin || '15',
        annualEnergyIncrease: full.annualEnergyIncrease || '6',
        annualDegradation: full.annualDegradation || '0.5',
        notes: full.notes || '',
      });
      setStep(0);
      setView('wizard');
    } catch { toast.error('Erro ao carregar projeto'); }
  };

  // ═══ SAVE / UPDATE ═══
  const handleSave = async (silent = false): Promise<boolean> => {
    // Guard against concurrent saves (race condition when clicking 'Next' rapidly)
    if (savingRef.current) {
      // Wait for the current save to finish instead of starting a new one
      while (savingRef.current) {
        await new Promise(r => setTimeout(r, 100));
      }
      return true; // Previous save succeeded
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.clientId === '__none__') payload.clientId = '';
      // Convert numeric fields
      ['consumptionKwh', 'avgBillValue', 'tariff', 'contractedDemand', 'availableArea',
        'roofInclination', 'laborCost', 'installationCost', 'otherCosts', 'margin',
        'annualEnergyIncrease', 'annualDegradation'
      ].forEach(k => { if (payload[k]) payload[k] = Number(payload[k]); });

      if (currentProject?.id) {
        const updated = await api.updateSolarProject(currentProject.id, payload);
        setCurrentProject(updated);
        if (!silent) toast.success('Projeto salvo!');
      } else {
        if (!payload.title) payload.title = `Sistema Solar — ${clients.find((c: any) => c.id === payload.clientId)?.name || 'Novo'}`;
        const created = await api.createSolarProject(payload);
        setCurrentProject(created);
        if (!silent) toast.success('Projeto criado!');
      }
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao salvar');
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // ═══ DIMENSIONING ═══
  const handleDimension = async () => {
    await handleSave(true);
    if (!currentProject?.id) { toast.error('Salve o projeto primeiro'); return; }
    setSaving(true);
    try {
      const result = await api.dimensionSolarProject(currentProject.id);
      setCurrentProject(result);
      toast.success('Dimensionamento concluído!');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro no dimensionamento'); }
    finally { setSaving(false); }
  };

  // ═══ CALCULATE FINANCIALS ═══
  const handleCalcFinancials = async () => {
    await handleSave(true);
    if (!currentProject?.id) { toast.error('Salve o projeto primeiro'); return; }
    setSaving(true);
    try {
      const result = await api.calculateSolarFinancials(currentProject.id);
      setCurrentProject(result);
      toast.success('Cálculo financeiro concluído!');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro no cálculo'); }
    finally { setSaving(false); }
  };

  // ═══ GENERATE PROPOSAL ═══
  const handleGenerateProposal = async () => {
    await handleSave(true);
    if (!currentProject?.id) { toast.error('Salve o projeto primeiro'); return; }
    setSaving(true);
    try {
      const result = await api.generateSolarProposal(currentProject.id);
      setCurrentProject(result);
      toast.success('Proposta gerada no módulo Propostas!');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao gerar proposta'); }
    finally { setSaving(false); }
  };

  // ═══ UPDATE PROPOSAL (re-generate with latest data) ═══
  const handleUpdateProposal = async () => {
    await handleSave(true);
    if (!currentProject?.id) return;
    setSaving(true);
    try {
      const result = await api.generateSolarProposal(currentProject.id);
      setCurrentProject(result);
      toast.success('Proposta atualizada com sucesso!');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao atualizar proposta'); }
    finally { setSaving(false); }
  };

  // ═══ DOWNLOAD SOLAR PDF ═══
  const handleDownloadSolarPDF = async () => {
    if (!currentProject?.id) { toast.error('Salve o projeto primeiro'); return; }
    setPdfGenerating(true);
    toast.info('Gerando PDF da proposta solar...');

    // Find company from already-loaded state array
    let coData = null;
    if (form.companyId) {
      coData = companies.find((c: any) => c.id === form.companyId) || null;
    }
    if (!coData) {
      coData = companies.find((c: any) => c.isPrimary) || companies[0] || null;
    }
    setPdfCompanyData(coData);
    setShowPdfRender(true);

    // Wait for render then generate PDF
    setTimeout(() => {
      const element = document.getElementById('proposal-pdf-content');
      if (!element) {
        toast.error('Erro ao gerar PDF: elemento não encontrado.');
        setShowPdfRender(false);
        setPdfGenerating(false);
        return;
      }

      const opt = {
        margin: 0,
        filename: `proposta_solar_${currentProject.code || 'projeto'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 3, dpi: 192, useCORS: true, letterRendering: true, width: 794, windowWidth: 794 },
        jsPDF: { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.next-page', avoid: ['img', 'tr', '.sig-block', '.pdf-keep-together', '.pdf-section-title', '.avoid-page-break'] },
      };

      html2pdf().from(element).set(opt).save().then(() => {
        setShowPdfRender(false);
        setPdfGenerating(false);
        setPdfCompanyData(null);
        toast.success('PDF gerado com sucesso!');
      }).catch((err: any) => {
        console.error('PDF Error:', err);
        setShowPdfRender(false);
        setPdfGenerating(false);
        toast.error('Erro ao gerar PDF.');
      });
    }, 1000);
  };

  // ═══ DELETE ═══
  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este projeto solar?')) return;
    try {
      await api.deleteSolarProject(id);
      toast.success('Projeto excluído');
      setView('list');
      loadData();
    } catch { toast.error('Erro ao excluir'); }
  };

  // ═══ CATALOG SEARCH ═══
  const handleSearchCatalog = async () => {
    setSearchingCatalog(true);
    try {
      const results = await api.searchSolarEquipment(catalogSearch);
      setCatalogResults(Array.isArray(results) ? results : []);
    } catch { setCatalogResults([]); }
    finally { setSearchingCatalog(false); }
  };

  const addEquipmentFromCatalog = (item: any) => {
    const eq = {
      catalogItemId: item.id,
      type: 'other',
      description: item.name,
      brand: item.brand || '',
      model: item.model || '',
      warranty: '',
      quantity: 1,
      unitPrice: Number(item.unitPrice || item.costPrice || 0),
      total: Number(item.unitPrice || item.costPrice || 0),
    };
    setForm((f: any) => ({ ...f, equipment: [...f.equipment, eq] }));
    toast.success(`${item.name} adicionado`);
  };

  const addManualEquipment = () => {
    setForm((f: any) => ({
      ...f, equipment: [...f.equipment, {
        type: 'other', description: '', brand: '', model: '', warranty: '',
        quantity: 1, unitPrice: 0, total: 0,
      }]
    }));
  };

  const updateEquipment = (index: number, field: string, value: any) => {
    setForm((f: any) => {
      const updated = [...f.equipment];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated[index].total = Number(updated[index].quantity || 0) * Number(updated[index].unitPrice || 0);
      }
      return { ...f, equipment: updated };
    });
  };

  const removeEquipment = (index: number) => {
    setForm((f: any) => ({ ...f, equipment: f.equipment.filter((_: any, i: number) => i !== index) }));
  };

  const equipmentTotal = useMemo(() =>
    (form.equipment || []).reduce((sum: number, eq: any) => sum + Number(eq.total || 0), 0),
    [form.equipment]
  );

  // ═══ COMMERCIAL KITS ═══
  const handleToggleStrategy = (enabled: boolean) => {
    if (enabled && (!form.commercialKits || form.commercialKits.length === 0)) {
      // Initialize with 1 default kit, cloning equipment from main
      const baseEquip = form.equipment || [];
      setForm((f: any) => ({
        ...f,
        commercialStrategyEnabled: true,
        commercialKits: [
          createEmptyKit('Kit Padrão', true, baseEquip),
        ],
      }));
    } else {
      setForm((f: any) => ({ ...f, commercialStrategyEnabled: enabled }));
    }
  };

  const handleAddKit = () => {
    const baseEquip = form.equipment || [];
    const idx = (form.commercialKits || []).length;
    const names = ['Kit Premium', 'Kit Básico', 'Kit Econômico', 'Kit Especial', 'Kit Ouro', 'Kit Prata'];
    const name = names[idx - 1] || `Kit ${idx + 1}`;
    setForm((f: any) => ({
      ...f,
      commercialKits: [...(f.commercialKits || []), createEmptyKit(name, false, baseEquip)],
    }));
    setActiveKitTab((form.commercialKits || []).length);
  };

  const handleRemoveKit = (idx: number) => {
    if ((form.commercialKits || []).length <= 1) return;
    setForm((f: any) => ({
      ...f,
      commercialKits: f.commercialKits.filter((_: any, i: number) => i !== idx),
    }));
    setActiveKitTab(0);
  };

  const updateKit = (kitIndex: number, field: string, value: any) => {
    setForm((f: any) => {
      const kits = [...(f.commercialKits || [])];
      kits[kitIndex] = { ...kits[kitIndex], [field]: value };
      // Recalculate totalPrice
      if (['laborCost', 'installationCost', 'otherCosts', 'margin'].includes(field) || field === 'equipment') {
        const kit = kits[kitIndex];
        const eqTotal = (kit.equipment || []).reduce((s: number, e: any) => s + Number(e.total || 0), 0);
        const costs = eqTotal + Number(kit.laborCost || 0) + Number(kit.installationCost || 0) + Number(kit.otherCosts || 0);
        kits[kitIndex].totalPrice = Number((costs * (1 + Number(kit.margin || 0) / 100)).toFixed(2));
      }
      return { ...f, commercialKits: kits };
    });
  };

  const setKitRecommended = (kitIndex: number) => {
    setForm((f: any) => ({
      ...f,
      commercialKits: (f.commercialKits || []).map((k: any, i: number) => ({ ...k, isRecommended: i === kitIndex })),
    }));
  };

  const updateKitGuarantee = (kitIndex: number, gIdx: number, field: string, value: any) => {
    setForm((f: any) => {
      const kits = [...(f.commercialKits || [])];
      const guarantees = [...(kits[kitIndex].guarantees || [])];
      guarantees[gIdx] = { ...guarantees[gIdx], [field]: value };
      kits[kitIndex] = { ...kits[kitIndex], guarantees };
      return { ...f, commercialKits: kits };
    });
  };

  const addKitGuarantee = (kitIndex: number) => {
    setForm((f: any) => {
      const kits = [...(f.commercialKits || [])];
      kits[kitIndex] = { ...kits[kitIndex], guarantees: [...(kits[kitIndex].guarantees || []), { text: '', included: true, value: 0 }] };
      return { ...f, commercialKits: kits };
    });
  };

  const removeKitGuarantee = (kitIndex: number, gIdx: number) => {
    setForm((f: any) => {
      const kits = [...(f.commercialKits || [])];
      kits[kitIndex] = { ...kits[kitIndex], guarantees: kits[kitIndex].guarantees.filter((_: any, i: number) => i !== gIdx) };
      return { ...f, commercialKits: kits };
    });
  };


  const cloneEquipmentToKit = (kitIndex: number) => {
    setForm((f: any) => {
      const kits = [...(f.commercialKits || [])];
      kits[kitIndex] = { ...kits[kitIndex], equipment: (f.equipment || []).map((eq: any) => ({ ...eq })) };
      // Recalculate total
      const eqTotal = kits[kitIndex].equipment.reduce((s: number, e: any) => s + Number(e.total || 0), 0);
      const costs = eqTotal + Number(kits[kitIndex].laborCost || 0) + Number(kits[kitIndex].installationCost || 0) + Number(kits[kitIndex].otherCosts || 0);
      kits[kitIndex].totalPrice = Number((costs * (1 + Number(kits[kitIndex].margin || 0) / 100)).toFixed(2));
      return { ...f, commercialKits: kits };
    });
    toast.success('Equipamentos clonados!');
  };

  const updateKitEquipment = (kitIndex: number, eqIndex: number, field: string, value: any) => {
    setForm((f: any) => {
      const kits = [...(f.commercialKits || [])];
      const equipment = [...(kits[kitIndex].equipment || [])];
      equipment[eqIndex] = { ...equipment[eqIndex], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        equipment[eqIndex].total = Number(equipment[eqIndex].quantity || 0) * Number(equipment[eqIndex].unitPrice || 0);
      }
      kits[kitIndex] = { ...kits[kitIndex], equipment };
      // Recalculate totalPrice
      const eqTotal = equipment.reduce((s: number, e: any) => s + Number(e.total || 0), 0);
      const costs = eqTotal + Number(kits[kitIndex].laborCost || 0) + Number(kits[kitIndex].installationCost || 0) + Number(kits[kitIndex].otherCosts || 0);
      kits[kitIndex].totalPrice = Number((costs * (1 + Number(kits[kitIndex].margin || 0) / 100)).toFixed(2));
      return { ...f, commercialKits: kits };
    });
  };

  const removeKitEquipment = (kitIndex: number, eqIndex: number) => {
    setForm((f: any) => {
      const kits = [...(f.commercialKits || [])];
      kits[kitIndex] = { ...kits[kitIndex], equipment: kits[kitIndex].equipment.filter((_: any, i: number) => i !== eqIndex) };
      const eqTotal = kits[kitIndex].equipment.reduce((s: number, e: any) => s + Number(e.total || 0), 0);
      const costs = eqTotal + Number(kits[kitIndex].laborCost || 0) + Number(kits[kitIndex].installationCost || 0) + Number(kits[kitIndex].otherCosts || 0);
      kits[kitIndex].totalPrice = Number((costs * (1 + Number(kits[kitIndex].margin || 0) / 100)).toFixed(2));
      return { ...f, commercialKits: kits };
    });
  };

  const [activeKitTab, setActiveKitTab] = useState(0);

  // ═══ NAVIGATION ═══
  const goNext = async () => {
    if (saving) return; // Prevent double-click
    if (step === 0 && !form.clientId) { toast.error('Selecione um cliente'); return; }
    if (step === 1 && !Number(form.consumptionKwh)) { toast.error('Informe o consumo mensal'); return; }
    const ok = await handleSave(true);
    if (ok) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => setStep(s => Math.max(s - 1, 0));

  // ═══ FILTERED LIST ═══
  const filtered = projects.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.code?.toLowerCase().includes(s) || p.title?.toLowerCase().includes(s) || p.client?.name?.toLowerCase().includes(s);
  });

  const stats = {
    total: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    dimensioned: projects.filter(p => p.status === 'dimensioned').length,
    proposalGen: projects.filter(p => ['proposal_generated', 'sent', 'accepted'].includes(p.status)).length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  // ═══════════════════════════════════════════════════════════════
  // WIZARD VIEW
  // ═══════════════════════════════════════════════════════════════
  if (view === 'wizard') {
    const p = currentProject;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { setView('list'); loadData(); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            {p && <span className="font-mono text-sm text-slate-400">{p.code}</span>}
            {p && <Badge className={statusMap[p.status]?.color || 'bg-slate-100'}>{statusMap[p.status]?.label || p.status}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {p?.id && (
              <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDelete(p.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
              </Button>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <button key={s.key} onClick={() => setStep(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive ? 'bg-amber-500 text-slate-900 font-semibold shadow-md' :
                    isDone ? 'bg-green-50 text-green-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  <span className="hidden md:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl border p-6 min-h-[400px]">

          {/* STEP 0: Cliente */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-amber-500" /> Selecionar Cliente</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente *</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={form.clientId || '__none__'} onValueChange={handleClientChange}>
                        <SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Selecione...</SelectItem>
                          {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-10 w-10 border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      title="Cadastrar novo cliente"
                      onClick={() => setNewClientDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Título do Projeto</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Sistema Solar 10kWp - Residência" />
                </div>
                <div>
                  <Label>Empresa (para proposta)</Label>
                  <Select value={form.companyId || '__none__'} onValueChange={v => setForm({ ...form, companyId: v === '__none__' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a empresa..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Selecione...</SelectItem>
                      {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.tradeName || c.name}{c.isPrimary ? ' ★' : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.clientId && form.clientId !== '__none__' && (() => {
                const c = clients.find((cl: any) => cl.id === form.clientId);
                if (!c) return null;
                return (
                  <div className="border rounded-lg p-4 bg-blue-50/50 space-y-2">
                    <p className="text-sm font-semibold text-blue-800">Dados do cliente (auto-preenchidos)</p>
                    <div className="grid grid-cols-3 gap-3 text-sm text-slate-700">
                      <div><span className="text-slate-400">Nome:</span> {c.name}</div>
                      <div><span className="text-slate-400">Doc:</span> {c.document || '—'}</div>
                      <div><span className="text-slate-400">Telefone:</span> {c.phone || c.whatsapp || '—'}</div>
                      <div><span className="text-slate-400">Email:</span> {c.email || '—'}</div>
                      <div><span className="text-slate-400">Endereço:</span> {c.address || '—'}</div>
                      <div><span className="text-slate-400">Cidade/UF:</span> {c.city || '—'}/{c.state || '—'}</div>
                      <div><span className="text-slate-400">Concessionária:</span> {c.concessionaria || '—'}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 1: Diagnóstico Energético */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Diagnóstico Energético</h2>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={form.detailedAnalysis || false} onChange={e => setForm({ ...form, detailedAnalysis: e.target.checked })} className="rounded" />
                    <span className="text-slate-500">Análise Detalhada</span>
                  </label>
                </div>
              </div>

              {/* Categoria de Faturamento */}
              <div className="flex gap-2">
                {['BT', 'MT'].map(cat => (
                  <button key={cat} onClick={() => setForm({ ...form, billingCategory: cat })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${form.billingCategory === cat
                      ? cat === 'BT' ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-orange-400 bg-orange-50 text-orange-900'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white'
                      }`}>
                    <p className="font-bold">{cat === 'BT' ? '⚡ Baixa Tensão (BT)' : '🏭 Média Tensão (MT)'}</p>
                    <p className="text-[10px] mt-0.5 font-normal">{cat === 'BT' ? 'Residencial / Comercial pequeno' : 'Industrial / Comercial — Ponta e Fora Ponta'}</p>
                  </button>
                ))}
              </div>

              {/* BT — Analysis Simples */}
              {form.billingCategory === 'BT' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Consumo Médio Mensal (kWh) *</Label>
                    <Input type="number" value={numVal(form.consumptionKwh)} onChange={e => {
                      const kwh = Number(e.target.value || 0);
                      const bill = Number(form.avgBillValue || 0);
                      const autoTariff = kwh > 0 && bill > 0 ? (bill / kwh).toFixed(4) : form.tariff;
                      setForm({ ...form, consumptionKwh: e.target.value, tariff: autoTariff });
                    }} placeholder="Ex: 800" />
                  </div>
                  <div>
                    <Label>Valor Médio da Conta (R$)</Label>
                    <Input type="number" step="0.01" value={numVal(form.avgBillValue)} onChange={e => {
                      const bill = Number(e.target.value || 0);
                      const kwh = Number(form.consumptionKwh || 0);
                      const autoTariff = kwh > 0 && bill > 0 ? (bill / kwh).toFixed(4) : form.tariff;
                      setForm({ ...form, avgBillValue: e.target.value, tariff: autoTariff });
                    }} placeholder="Ex: 450.00" />
                  </div>
                  <div>
                    <Label>Tarifa (R$/kWh) <span className="text-[10px] text-amber-600">← auto</span></Label>
                    <Input type="number" step="0.0001" value={numVal(form.tariff)} onChange={e => setForm({ ...form, tariff: e.target.value })} placeholder="Ex: 0.85" className="bg-amber-50 border-amber-200" />
                  </div>
                </div>
              )}

              {/* Consumo Mês a Mês (BT e MT) */}
              {(() => {
                const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const hasMonthly = form.monthlyConsumptions && form.monthlyConsumptions.length === 12;
                const initMonthly = () => setForm({ ...form, monthlyConsumptions: MONTHS.map(m => ({ month: m, kwh: 0, peakKwh: 0, offPeakKwh: 0, billValue: 0 })) });
                const clearMonthly = () => setForm({ ...form, monthlyConsumptions: null });
                const updateMonth = (idx: number, field: string, val: number) => {
                  const mc = [...(form.monthlyConsumptions || [])];
                  mc[idx] = { ...mc[idx], [field]: val };
                  // If MT and updating peak/offPeak, auto-sum kwh
                  if (form.billingCategory === 'MT' && (field === 'peakKwh' || field === 'offPeakKwh')) {
                    mc[idx].kwh = Number(mc[idx].peakKwh || 0) + Number(mc[idx].offPeakKwh || 0);
                  }
                  // Auto-calc average
                  const avg = mc.reduce((s: number, m: any) => s + Number(m.kwh || 0), 0) / 12;
                  const avgBill = mc.reduce((s: number, m: any) => s + Number(m.billValue || 0), 0) / 12;
                  const updates: any = { monthlyConsumptions: mc, consumptionKwh: String(Math.round(avg)) };
                  if (mc.some((m: any) => Number(m.billValue || 0) > 0)) updates.avgBillValue = String(Number(avgBill.toFixed(2)));
                  if (form.billingCategory === 'MT') {
                    const avgPeak = mc.reduce((s: number, m: any) => s + Number(m.peakKwh || 0), 0) / 12;
                    const avgOffPeak = mc.reduce((s: number, m: any) => s + Number(m.offPeakKwh || 0), 0) / 12;
                    updates.consumptionPeakKwh = String(Math.round(avgPeak));
                    updates.consumptionOffPeakKwh = String(Math.round(avgOffPeak));
                  }
                  setForm({ ...form, ...updates });
                };

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase">Consumo Mês a Mês (12 meses)</p>
                      {!hasMonthly ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={initMonthly}><Plus className="w-3 h-3 mr-1" /> Preencher Meses</Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={clearMonthly}>Limpar / Usar Média</Button>
                      )}
                    </div>
                    {hasMonthly && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-2 py-1.5 text-left">Mês</th>
                              {form.billingCategory === 'MT' && <th className="px-2 py-1.5 text-right">Ponta (kWh)</th>}
                              {form.billingCategory === 'MT' && <th className="px-2 py-1.5 text-right">F. Ponta (kWh)</th>}
                              <th className="px-2 py-1.5 text-right">Total (kWh)</th>
                              <th className="px-2 py-1.5 text-right">Valor (R$)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.monthlyConsumptions.map((m: any, i: number) => (
                              <tr key={i} className="border-t">
                                <td className="px-2 py-1 font-bold text-slate-700">{m.month}</td>
                                {form.billingCategory === 'MT' && (
                                  <td className="px-1 py-1"><Input className="h-6 text-xs text-right w-20" type="number" value={m.peakKwh || 0} onChange={e => updateMonth(i, 'peakKwh', Number(e.target.value))} /></td>
                                )}
                                {form.billingCategory === 'MT' && (
                                  <td className="px-1 py-1"><Input className="h-6 text-xs text-right w-20" type="number" value={m.offPeakKwh || 0} onChange={e => updateMonth(i, 'offPeakKwh', Number(e.target.value))} /></td>
                                )}
                                <td className="px-1 py-1">
                                  {form.billingCategory === 'MT'
                                    ? <span className="px-2 font-mono font-bold text-slate-600">{fmtN(m.kwh || 0, 0)}</span>
                                    : <Input className="h-6 text-xs text-right w-20" type="number" value={m.kwh || 0} onChange={e => updateMonth(i, 'kwh', Number(e.target.value))} />
                                  }
                                </td>
                                <td className="px-1 py-1"><Input className="h-6 text-xs text-right w-24" type="number" step="0.01" value={m.billValue || 0} onChange={e => updateMonth(i, 'billValue', Number(e.target.value))} /></td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-amber-50 border-t-2 border-amber-200 font-bold">
                              <td className="px-2 py-1.5 text-amber-800">Média</td>
                              {form.billingCategory === 'MT' && (
                                <td className="px-2 py-1.5 text-right text-orange-700">{fmtN(form.monthlyConsumptions.reduce((s: number, m: any) => s + Number(m.peakKwh || 0), 0) / 12, 0)}</td>
                              )}
                              {form.billingCategory === 'MT' && (
                                <td className="px-2 py-1.5 text-right text-blue-700">{fmtN(form.monthlyConsumptions.reduce((s: number, m: any) => s + Number(m.offPeakKwh || 0), 0) / 12, 0)}</td>
                              )}
                              <td className="px-2 py-1.5 text-right text-amber-900">{fmtN(form.monthlyConsumptions.reduce((s: number, m: any) => s + Number(m.kwh || 0), 0) / 12, 0)} kWh</td>
                              <td className="px-2 py-1.5 text-right text-amber-900">{fmt(form.monthlyConsumptions.reduce((s: number, m: any) => s + Number(m.billValue || 0), 0) / 12)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* MT — Ponta / Fora Ponta */}
              {form.billingCategory === 'MT' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs font-bold text-orange-700 uppercase mb-2">Horário Ponta</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Consumo Ponta (kWh)</Label>
                          <Input type="number" value={form.consumptionPeakKwh} onChange={e => {
                            const peak = Number(e.target.value || 0);
                            const offPeak = Number(form.consumptionOffPeakKwh || 0);
                            setForm({ ...form, consumptionPeakKwh: e.target.value, consumptionKwh: String(peak + offPeak) });
                          }} placeholder="Ex: 200" />
                        </div>
                        <div>
                          <Label className="text-xs">Tarifa Ponta (R$/kWh)</Label>
                          <Input type="number" step="0.0001" value={form.tariffPeak} onChange={e => {
                            const tP = Number(e.target.value || 0);
                            const tFP = Number(form.tariffOffPeak || 0);
                            const cP = Number(form.consumptionPeakKwh || 0);
                            const cFP = Number(form.consumptionOffPeakKwh || 0);
                            const total = cP + cFP;
                            const avgTariff = total > 0 ? ((tP * cP) + (tFP * cFP)) / total : 0;
                            setForm({ ...form, tariffPeak: e.target.value, tariff: String(Number(avgTariff.toFixed(4))) });
                          }} placeholder="Ex: 1.45" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="text-xs">Demanda Ponta (kW)</Label>
                        <Input type="number" value={form.demandPeakKw} onChange={e => setForm({ ...form, demandPeakKw: e.target.value })} placeholder="Ex: 50" />
                      </div>
                    </div>

                    <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-bold text-blue-700 uppercase mb-2">Horário Fora Ponta</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Consumo F. Ponta (kWh)</Label>
                          <Input type="number" value={form.consumptionOffPeakKwh} onChange={e => {
                            const offPeak = Number(e.target.value || 0);
                            const peak = Number(form.consumptionPeakKwh || 0);
                            setForm({ ...form, consumptionOffPeakKwh: e.target.value, consumptionKwh: String(peak + offPeak) });
                          }} placeholder="Ex: 600" />
                        </div>
                        <div>
                          <Label className="text-xs">Tarifa F. Ponta (R$/kWh)</Label>
                          <Input type="number" step="0.0001" value={form.tariffOffPeak} onChange={e => {
                            const tFP = Number(e.target.value || 0);
                            const tP = Number(form.tariffPeak || 0);
                            const cP = Number(form.consumptionPeakKwh || 0);
                            const cFP = Number(form.consumptionOffPeakKwh || 0);
                            const total = cP + cFP;
                            const avgTariff = total > 0 ? ((tP * cP) + (tFP * cFP)) / total : 0;
                            setForm({ ...form, tariffOffPeak: e.target.value, tariff: String(Number(avgTariff.toFixed(4))) });
                          }} placeholder="Ex: 0.65" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="text-xs">Demanda F. Ponta (kW)</Label>
                        <Input type="number" value={form.demandOffPeakKw} onChange={e => setForm({ ...form, demandOffPeakKw: e.target.value })} placeholder="Ex: 80" />
                      </div>
                    </div>
                  </div>

                  {/* MT Auto-calculated summary */}
                  <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Consumo Total</p>
                        <p className="text-lg font-bold text-slate-900">{fmtN(Number(form.consumptionPeakKwh || 0) + Number(form.consumptionOffPeakKwh || 0), 0)} <span className="text-xs">kWh</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Tarifa Média Ponderada</p>
                        <p className="text-lg font-bold text-amber-800">R$ {fmtN(Number(form.tariff || 0), 4)}/kWh</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Valor Estimado</p>
                        <p className="text-lg font-bold text-slate-900">{fmt(Number(form.consumptionKwh || 0) * Number(form.tariff || 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">% Ponta</p>
                        <p className="text-lg font-bold text-orange-700">{fmtN(Number(form.consumptionKwh || 0) > 0 ? (Number(form.consumptionPeakKwh || 0) / Number(form.consumptionKwh || 1)) * 100 : 0, 1)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Médio da Conta (R$)</Label>
                      <Input type="number" step="0.01" value={form.avgBillValue} onChange={e => setForm({ ...form, avgBillValue: e.target.value })} placeholder="Ex: 5000.00" />
                    </div>
                    <div>
                      <Label>Modalidade Tarifária</Label>
                      <Select value={form.tariffModality || ''} onValueChange={v => setForm({ ...form, tariffModality: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verde">Verde</SelectItem>
                          <SelectItem value="azul">Azul</SelectItem>
                          <SelectItem value="convencional">Convencional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos comuns BT e MT */}
              <div className="grid grid-cols-3 gap-4">
                {form.billingCategory === 'BT' && (
                  <div>
                    <Label>Tipo de Ligação</Label>
                    <Select value={form.connectionType} onValueChange={v => setForm({ ...form, connectionType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monophasic">Monofásico</SelectItem>
                        <SelectItem value="biphasic">Bifásico</SelectItem>
                        <SelectItem value="triphasic">Trifásico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Demanda Contratada (kW)</Label>
                  <Input type="number" value={form.contractedDemand} onChange={e => setForm({ ...form, contractedDemand: e.target.value })} />
                </div>
                <div>
                  <Label>Tipo de Medidor</Label>
                  <Input value={form.meterType} onChange={e => setForm({ ...form, meterType: e.target.value })} placeholder="Convencional, Bidirecional..." />
                </div>
                <div>
                  <Label>Concessionária</Label>
                  <Input value={form.concessionaria} onChange={e => setForm({ ...form, concessionaria: e.target.value })} placeholder="CELPE, CEMIG, Enel..." />
                </div>
              </div>

              {/* Detailed Analysis extras */}
              {form.detailedAnalysis && (
                <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">Análise Detalhada da Conta</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Custo por kWh Real</p>
                      <p className="text-xl font-bold text-slate-900">
                        R$ {fmtN(Number(form.consumptionKwh || 0) > 0 ? Number(form.avgBillValue || 0) / Number(form.consumptionKwh || 1) : 0, 4)}/kWh
                      </p>
                      <p className="text-[10px] text-slate-400">Valor da conta ÷ consumo</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Gasto Anual Estimado</p>
                      <p className="text-xl font-bold text-red-600">{fmt(Number(form.avgBillValue || 0) * 12)}</p>
                      <p className="text-[10px] text-slate-400">Valor médio × 12 meses</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Gasto em 25 Anos</p>
                      <p className="text-xl font-bold text-red-700">{fmt(Number(form.avgBillValue || 0) * 12 * 25)}</p>
                      <p className="text-[10px] text-slate-400">Sem solar, pagando à concessionária</p>
                    </div>
                  </div>
                  {form.billingCategory === 'MT' && Number(form.consumptionPeakKwh) > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                        <p className="text-[10px] text-orange-600 uppercase font-bold">Custo Ponta (× mês)</p>
                        <p className="text-lg font-bold text-orange-800">{fmt(Number(form.consumptionPeakKwh || 0) * Number(form.tariffPeak || 0))}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                        <p className="text-[10px] text-blue-600 uppercase font-bold">Custo Fora Ponta (× mês)</p>
                        <p className="text-lg font-bold text-blue-800">{fmt(Number(form.consumptionOffPeakKwh || 0) * Number(form.tariffOffPeak || 0))}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Dados do Imóvel */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-amber-500" /> Dados do Imóvel</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tipo de Instalação</Label>
                  <Select value={form.installationType} onValueChange={v => setForm({ ...form, installationType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roof">Telhado</SelectItem>
                      <SelectItem value="ground">Solo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Área Disponível (m²)</Label>
                  <Input type="number" value={form.availableArea} onChange={e => setForm({ ...form, availableArea: e.target.value })} />
                </div>
                <div>
                  <Label>Orientação do Telhado</Label>
                  <Select value={form.roofOrientation} onValueChange={v => setForm({ ...form, roofOrientation: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="norte">Norte</SelectItem>
                      <SelectItem value="nordeste">Nordeste</SelectItem>
                      <SelectItem value="noroeste">Noroeste</SelectItem>
                      <SelectItem value="leste">Leste</SelectItem>
                      <SelectItem value="oeste">Oeste</SelectItem>
                      <SelectItem value="sul">Sul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Inclinação (graus)</Label>
                  <Input type="number" value={form.roofInclination} onChange={e => setForm({ ...form, roofInclination: e.target.value })} placeholder="Ex: 15" />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.hasShadows} onChange={e => setForm({ ...form, hasShadows: e.target.checked })} className="rounded" />
                    Possui sombreamento
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input value={form.propertyCep} onChange={e => {
                    const cep = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, propertyCep: cep });
                    if (cep.length === 8) {
                      fetch(`https://viacep.com.br/ws/${cep}/json/`)
                        .then(r => r.json())
                        .then(data => {
                          if (!data.erro) {
                            setForm((f: any) => ({
                              ...f, propertyCep: cep,
                              propertyAddress: data.logradouro || f.propertyAddress,
                              propertyNeighborhood: data.bairro || f.propertyNeighborhood,
                              propertyCity: data.localidade || f.propertyCity,
                              propertyState: data.uf || f.propertyState,
                            }));
                            toast.success('Endereço preenchido via CEP!');
                          }
                        }).catch(() => { });
                    }
                  }} placeholder="00000-000" maxLength={9} />
                </div>
                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input value={form.propertyAddress} onChange={e => setForm({ ...form, propertyAddress: e.target.value })} />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input value={form.propertyNeighborhood} onChange={e => setForm({ ...form, propertyNeighborhood: e.target.value })} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={form.propertyCity} onChange={e => setForm({ ...form, propertyCity: e.target.value })} />
                </div>
                <div>
                  <Label>Estado (UF)</Label>
                  <Input value={form.propertyState} onChange={e => setForm({ ...form, propertyState: e.target.value })} placeholder="PE" maxLength={2} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Dimensionamento */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Calculator className="w-5 h-5 text-amber-500" /> Dimensionamento Automático</h2>
                <Button onClick={handleDimension} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                  Calcular Dimensionamento
                </Button>
              </div>
              {p?.systemPowerKwp ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 text-center">
                    <p className="text-xs text-amber-700 font-bold uppercase">Potência do Sistema</p>
                    <p className="text-3xl font-bold text-amber-800 mt-1">{fmtN(p.systemPowerKwp)} <span className="text-lg">kWp</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 text-center">
                    <p className="text-xs text-blue-700 font-bold uppercase">Quantidade de Módulos</p>
                    <p className="text-3xl font-bold text-blue-800 mt-1">{p.moduleCount} <span className="text-lg">un</span></p>
                    <p className="text-xs text-blue-500 mt-1">{p.modulePowerWp}Wp cada</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 text-center">
                    <p className="text-xs text-purple-700 font-bold uppercase">Inversor</p>
                    <p className="text-3xl font-bold text-purple-800 mt-1">{fmtN(p.inverterPowerKw, 0)} <span className="text-lg">kW</span></p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase">Geração Mensal</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{fmtN(p.monthlyGenerationKwh, 0)} <span className="text-sm">kWh</span></p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase">Geração Anual</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{fmtN(p.annualGenerationKwh, 0)} <span className="text-sm">kWh</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 text-center">
                    <p className="text-xs text-green-700 font-bold uppercase">Compensação</p>
                    <p className="text-3xl font-bold text-green-800 mt-1">{fmtN(p.compensationPercent)}%</p>
                  </div>
                  <div className="col-span-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                    HSP utilizado: <strong>{p.hspValue}h/dia</strong> ({form.propertyState || 'BR'}) | Eficiência: 80% | Consumo informado: {fmtN(Number(form.consumptionKwh), 0)} kWh/mês
                    {p.pricePerWp > 0 && <> | <strong className="text-amber-700">R$/Wp: {fmtN(p.pricePerWp, 2)}</strong></>}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <Calculator className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Clique em "Calcular Dimensionamento" para gerar os resultados</p>
                  <p className="text-xs mt-1">Certifique-se de ter preenchido o consumo mensal (kWh) no Step 2</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Equipamentos */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Package className="w-5 h-5 text-amber-500" /> Seleção de Equipamentos</h2>
                <Button variant="outline" size="sm" onClick={addManualEquipment}><Plus className="w-4 h-4 mr-1" /> Adicionar Manual</Button>
              </div>

              {/* Catalog Search */}
              <div className="border rounded-lg p-4 bg-blue-50/50 space-y-3">
                <p className="text-sm font-semibold text-blue-800 flex items-center gap-2"><Search className="w-4 h-4" /> Buscar no Catálogo (Produtos & Estoque)</p>
                <div className="flex gap-2">
                  <Input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                    placeholder="Pesquise módulos, inversores, cabos..." className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleSearchCatalog()} />
                  <Button onClick={handleSearchCatalog} disabled={searchingCatalog} variant="outline">
                    {searchingCatalog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {catalogResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto divide-y">
                    {catalogResults.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between py-2 px-2 hover:bg-white rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.brand} {item.model} — {fmt(item.unitPrice || item.costPrice || 0)}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => addEquipmentFromCatalog(item)}><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Equipment Table */}
              {form.equipment.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Descrição</th>
                        <th className="px-3 py-2 text-left">Marca</th>
                        <th className="px-3 py-2 text-center">Qtd</th>
                        <th className="px-3 py-2 text-right">Preço Un.</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.equipment.map((eq: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1.5">
                            <Select value={eq.type} onValueChange={v => updateEquipment(i, 'type', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {[...DEFAULT_EQUIPMENT_TYPES, ...customEquipmentTypes].map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                <div className="border-t mt-1 pt-1 px-2 pb-1">
                                  <div className="flex gap-1">
                                    <Input
                                      className="h-7 text-xs flex-1"
                                      placeholder="Nova categoria..."
                                      value={newCategoryInput}
                                      onChange={e => setNewCategoryInput(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' && newCategoryInput.trim()) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const val = newCategoryInput.trim().toLowerCase().replace(/\s+/g, '_');
                                          if (![...DEFAULT_EQUIPMENT_TYPES, ...customEquipmentTypes].find(t => t.value === val)) {
                                            setCustomEquipmentTypes(prev => [...prev, { value: val, label: newCategoryInput.trim() }]);
                                            updateEquipment(i, 'type', val);
                                          }
                                          setNewCategoryInput('');
                                        }
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 shrink-0 text-amber-600 hover:bg-amber-50"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (newCategoryInput.trim()) {
                                          const val = newCategoryInput.trim().toLowerCase().replace(/\s+/g, '_');
                                          if (![...DEFAULT_EQUIPMENT_TYPES, ...customEquipmentTypes].find(t => t.value === val)) {
                                            setCustomEquipmentTypes(prev => [...prev, { value: val, label: newCategoryInput.trim() }]);
                                            updateEquipment(i, 'type', val);
                                          }
                                          setNewCategoryInput('');
                                        }
                                      }}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5"><Input className="h-8 text-xs" value={eq.description} onChange={e => updateEquipment(i, 'description', e.target.value)} /></td>
                          <td className="px-2 py-1.5"><Input className="h-8 text-xs" value={eq.brand} onChange={e => updateEquipment(i, 'brand', e.target.value)} /></td>
                          <td className="px-2 py-1.5 w-20"><Input className="h-8 text-xs text-center" type="number" value={eq.quantity} onChange={e => updateEquipment(i, 'quantity', Number(e.target.value))} /></td>
                          <td className="px-2 py-1.5 w-28"><Input className="h-8 text-xs text-right" type="number" step="0.01" value={eq.unitPrice} onChange={e => updateEquipment(i, 'unitPrice', Number(e.target.value))} /></td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs font-bold">{fmt(eq.total)}</td>
                          <td className="px-2 py-1.5"><Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeEquipment(i)}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-50 border-t-2 border-amber-200">
                        <td colSpan={5} className="px-3 py-2 text-right font-bold text-amber-800">Total Equipamentos:</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-900 font-mono">{fmt(equipmentTotal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Nenhum equipamento adicionado. Busque no catálogo acima ou adicione manualmente.</p>
                </div>
              )}

              {/* Additional Costs */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase">Custos Detalhados</p>
                  {p?.systemPowerKwp > 0 && (() => {
                    const allCosts = Number(form.laborCost || 0) + Number(form.installationCost || 0) + Number(form.logisticsCost || 0) + Number(form.insuranceCost || 0) + Number(form.engineeringCost || 0) + Number(form.documentationCost || 0) + Number(form.otherCosts || 0) + equipmentTotal;
                    const withMargin = allCosts * (1 + Number(form.margin || 0) / 100);
                    const wpCalc = p.systemPowerKwp * 1000;
                    const rWp = wpCalc > 0 ? withMargin / wpCalc : 0;
                    return (
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-gradient-to-r from-amber-100 to-amber-200 rounded-lg border border-amber-300">
                          <span className="text-[10px] text-amber-600 font-bold uppercase block">R$/Wp</span>
                          <span className="text-lg font-bold text-amber-900">{fmtN(rWp, 2)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          <p>Referência mercado: R$ 3,50 ~ 5,50/Wp</p>
                          <p className={rWp < 5.5 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{rWp < 3.5 ? '🔥 Muito competitivo!' : rWp < 5.5 ? '✅ Dentro do mercado' : '⚠️ Acima do mercado'}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div><Label className="text-xs">Mão de Obra (R$)</Label><Input type="number" step="0.01" value={numVal(form.laborCost)} onChange={e => setForm({ ...form, laborCost: e.target.value })} /></div>
                  <div><Label className="text-xs">Instalação (R$)</Label><Input type="number" step="0.01" value={numVal(form.installationCost)} onChange={e => setForm({ ...form, installationCost: e.target.value })} /></div>
                  <div><Label className="text-xs">Logística / Frete (R$)</Label><Input type="number" step="0.01" value={numVal(form.logisticsCost)} onChange={e => setForm({ ...form, logisticsCost: e.target.value })} /></div>
                  <div><Label className="text-xs">Seguro (R$)</Label><Input type="number" step="0.01" value={numVal(form.insuranceCost)} onChange={e => setForm({ ...form, insuranceCost: e.target.value })} /></div>
                  <div><Label className="text-xs">Engenharia / Projeto (R$)</Label><Input type="number" step="0.01" value={numVal(form.engineeringCost)} onChange={e => setForm({ ...form, engineeringCost: e.target.value })} /></div>
                  <div><Label className="text-xs">Homologação / ART (R$)</Label><Input type="number" step="0.01" value={numVal(form.documentationCost)} onChange={e => setForm({ ...form, documentationCost: e.target.value })} /></div>
                  <div><Label className="text-xs">Outros Custos (R$)</Label><Input type="number" step="0.01" value={numVal(form.otherCosts)} onChange={e => setForm({ ...form, otherCosts: e.target.value })} /></div>
                  <div><Label className="text-xs">Margem (%)</Label><Input type="number" step="0.1" value={numVal(form.margin)} onChange={e => setForm({ ...form, margin: e.target.value })} /></div>
                </div>

                {/* R$/Wp Quick Calculator (referência interna) */}
                {p?.systemPowerKwp > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Calculadora R$/Wp — Referência Interna</p>
                    <p className="text-[10px] text-slate-400">Sistema: <strong className="text-slate-700">{fmtN(p.systemPowerKwp)} kWp ({fmtN(p.systemPowerKwp * 1000, 0)} Wp)</strong>. Digite o R$/Wp e clique para aplicar ao campo.</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Mão de Obra', field: 'laborCost' },
                        { label: 'Instalação', field: 'installationCost' },
                        { label: 'Logística', field: 'logisticsCost' },
                        { label: 'Seguro', field: 'insuranceCost' },
                        { label: 'Engenharia', field: 'engineeringCost' },
                        { label: 'Homologação', field: 'documentationCost' },
                        { label: 'Outros', field: 'otherCosts' },
                      ].map(item => {
                        const wpTotal = p.systemPowerKwp * 1000;
                        const currentVal = Number(form[item.field] || 0);
                        const currentRatePerWp = wpTotal > 0 ? currentVal / wpTotal : 0;
                        return (
                          <div key={item.field} className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-500 w-20 truncate" title={item.label}>{item.label}:</span>
                            <Input className="h-6 text-[10px] text-right w-16" type="number" step="0.01" placeholder="R$/Wp"
                              defaultValue={currentRatePerWp > 0 ? currentRatePerWp.toFixed(2) : ''}
                              onBlur={e => {
                                const rate = Number(e.target.value || 0);
                                if (rate > 0) setForm((f: any) => ({ ...f, [item.field]: String(Number((rate * wpTotal).toFixed(2))) }));
                              }} />
                            <span className="text-slate-400">= {fmt(currentVal)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Kits Comerciais (Estratégia Isca) */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> Estratégia Comercial — Kits</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.commercialStrategyEnabled} onChange={e => handleToggleStrategy(e.target.checked)} className="rounded border-amber-300 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700">Ativar Estratégia de Kits</span>
                </label>
              </div>

              {!form.commercialStrategyEnabled ? (
                <div className="text-center py-16 text-slate-400">
                  <Crown className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Estratégia Comercial Desativada</p>
                  <p className="text-xs mt-1 max-w-lg mx-auto">Ative a estratégia para criar kits com precificação estratégica (efeito isca). Adicione quantos kits quiser — o cliente será naturalmente induzido a escolher o kit recomendado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Kit Tabs */}
                  <div className="flex gap-2 flex-wrap">
                    {(form.commercialKits || []).map((kit: any, ki: number) => (
                      <div key={ki} role="button" tabIndex={0} onClick={() => setActiveKitTab(ki)}
                        className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all relative group cursor-pointer ${activeKitTab === ki
                          ? kit.isRecommended ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-md' : 'border-slate-300 bg-white text-slate-900 shadow-md'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white'
                          }`}>
                        {(form.commercialKits || []).length > 1 && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center" onClick={e => { e.stopPropagation(); handleRemoveKit(ki); }}>×</span>
                        )}
                        <div className="flex items-center justify-center gap-2">
                          {kit.isRecommended && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                          <input className="bg-transparent text-center font-bold border-none outline-none w-32" value={kit.name}
                            onChange={e => updateKit(ki, 'name', e.target.value)} onClick={e => e.stopPropagation()} />
                        </div>
                        <p className="text-lg font-bold mt-1">{fmt(kit.totalPrice || 0)}</p>
                      </div>
                    ))}
                    <button onClick={handleAddKit}
                      className="min-w-[60px] px-3 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-all flex flex-col items-center justify-center">
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">Novo Kit</span>
                    </button>
                  </div>

                  {/* Active Kit Editor */}
                  {(form.commercialKits || []).length > 0 && (() => {
                    const ki = activeKitTab;
                    const kit = form.commercialKits[ki];
                    if (!kit) return null;
                    return (
                      <div className="border rounded-xl p-5 space-y-5">
                        {/* Kit header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-900">{kit.name}</h3>
                            {kit.isRecommended ? (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Star className="w-3 h-3 mr-1 fill-amber-500" /> Kit Recomendado (Alvo)</Badge>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => setKitRecommended(ki)}><Star className="w-3 h-3 mr-1" /> Marcar como Recomendado</Button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <input type="checkbox" checked={kit.showGuaranteeValues || false} onChange={e => updateKit(ki, 'showGuaranteeValues', e.target.checked)} className="rounded" />
                              <span className="text-slate-500">Mostrar valores (Value Stack)</span>
                            </label>
                            <Button variant="outline" size="sm" onClick={() => cloneEquipmentToKit(ki)}><Copy className="w-3 h-3 mr-1" /> Clonar Equipamentos Base</Button>
                          </div>
                        </div>

                        {/* Kit Equipment */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase">Equipamentos do Kit</p>
                            <Button variant="outline" size="sm" onClick={() => {
                              setForm((f: any) => {
                                const kits = [...(f.commercialKits || [])];
                                kits[ki] = { ...kits[ki], equipment: [...(kits[ki].equipment || []), { type: 'module', description: '', brand: '', model: '', quantity: 1, unitPrice: 0, total: 0 }] };
                                return { ...f, commercialKits: kits };
                              });
                            }}><Plus className="w-3 h-3 mr-1" /> Adicionar Equipamento</Button>
                          </div>
                          {(kit.equipment || []).length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50">
                                  <tr><th className="px-2 py-1.5 text-left">Descrição</th><th className="px-2 py-1.5 text-left">Marca</th><th className="px-2 py-1.5 text-left">Modelo</th><th className="px-2 py-1.5 text-center">Qtd</th><th className="px-2 py-1.5 text-right">Preço</th><th className="px-2 py-1.5 text-right">Total</th><th></th></tr>
                                </thead>
                                <tbody>
                                  {kit.equipment.map((eq: any, ei: number) => (
                                    <tr key={ei} className="border-t">
                                      <td className="px-1 py-1"><Input className="h-7 text-xs" value={eq.description} onChange={e => updateKitEquipment(ki, ei, 'description', e.target.value)} /></td>
                                      <td className="px-1 py-1"><Input className="h-7 text-xs" value={eq.brand} onChange={e => updateKitEquipment(ki, ei, 'brand', e.target.value)} /></td>
                                      <td className="px-1 py-1"><Input className="h-7 text-xs" value={eq.model} onChange={e => updateKitEquipment(ki, ei, 'model', e.target.value)} /></td>
                                      <td className="px-1 py-1 w-16"><Input className="h-7 text-xs text-center" type="number" value={eq.quantity} onChange={e => updateKitEquipment(ki, ei, 'quantity', Number(e.target.value))} /></td>
                                      <td className="px-1 py-1 w-24"><Input className="h-7 text-xs text-right" type="number" step="0.01" value={eq.unitPrice} onChange={e => updateKitEquipment(ki, ei, 'unitPrice', Number(e.target.value))} /></td>
                                      <td className="px-2 py-1 text-right font-mono font-bold">{fmt(eq.total)}</td>
                                      <td className="px-1 py-1"><Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => removeKitEquipment(ki, ei)}><Trash2 className="w-3 h-3" /></Button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 text-center py-4">Sem equipamentos. Clique em "Adicionar Equipamento" ou "Clonar Equipamentos Base".</p>
                          )}
                        </div>

                        {/* Kit Costs */}
                        <div className="grid grid-cols-5 gap-3">
                          <div><Label className="text-xs">Mão de Obra</Label><Input type="number" step="0.01" className="h-8 text-xs" value={numVal(kit.laborCost)} onChange={e => updateKit(ki, 'laborCost', Number(e.target.value))} /></div>
                          <div><Label className="text-xs">Instalação</Label><Input type="number" step="0.01" className="h-8 text-xs" value={numVal(kit.installationCost)} onChange={e => updateKit(ki, 'installationCost', Number(e.target.value))} /></div>
                          <div><Label className="text-xs">Outros</Label><Input type="number" step="0.01" className="h-8 text-xs" value={numVal(kit.otherCosts)} onChange={e => updateKit(ki, 'otherCosts', Number(e.target.value))} /></div>
                          <div><Label className="text-xs">Margem %</Label><Input type="number" step="0.1" className="h-8 text-xs" value={numVal(kit.margin)} onChange={e => updateKit(ki, 'margin', Number(e.target.value))} /></div>
                          <div><Label className="text-xs">Preço Final</Label><div className="px-3 py-1.5 bg-amber-50 rounded border border-amber-200 font-bold text-amber-900 text-sm">{fmt(kit.totalPrice)}</div></div>
                        </div>

                        {/* Kit Guarantees */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase">Garantias & Benefícios {kit.showGuaranteeValues && <span className="text-amber-600">(com valores — Hormozi Value Stack)</span>}</p>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addKitGuarantee(ki)}><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
                          </div>
                          <div className="space-y-1.5">
                            {(kit.guarantees || []).map((g: any, gi: number) => (
                              <div key={gi} className="flex items-center gap-2">
                                <button onClick={() => updateKitGuarantee(ki, gi, 'included', !g.included)}
                                  className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${g.included ? 'bg-green-100 border-green-300 text-green-600' : 'bg-red-50 border-red-200 text-red-400'
                                    }`}>
                                  {g.included ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                </button>
                                <Input className="h-7 text-xs flex-1" value={g.text} onChange={e => updateKitGuarantee(ki, gi, 'text', e.target.value)} placeholder="Descrição da garantia..." />
                                {kit.showGuaranteeValues && (
                                  <div className="flex items-center gap-1 w-28">
                                    <span className="text-[10px] text-slate-400">R$</span>
                                    <Input className="h-7 text-xs text-right w-24" type="number" step="0.01" value={g.value || 0} onChange={e => updateKitGuarantee(ki, gi, 'value', Number(e.target.value))} placeholder="0" />
                                  </div>
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => removeKitGuarantee(ki, gi)}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            ))}
                          </div>
                          {kit.showGuaranteeValues && (() => {
                            const guaranteeTotal = (kit.guarantees || []).filter((g: any) => g.included).reduce((s: number, g: any) => s + Number(g.value || 0), 0);
                            return guaranteeTotal > 0 ? (
                              <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-200 text-xs">
                                <span className="text-emerald-700 font-bold">Valor total dos benefícios inclusos: {fmt(guaranteeTotal)}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Preview — Kit Cards Side by Side (Value Stack + Anchoring) */}
                  {(form.commercialKits || []).length >= 1 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">Preview — Visão do Cliente (Ariely + Hormozi)</p>
                      <div className={`grid gap-3 ${(form.commercialKits || []).length === 1 ? 'grid-cols-1 max-w-md mx-auto' : (form.commercialKits || []).length === 2 ? 'grid-cols-2' : (form.commercialKits || []).length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
                        {form.commercialKits.map((kit: any, ki: number) => {
                          const guaranteeValueIncluded = (kit.guarantees || []).filter((g: any) => g.included).reduce((s: number, g: any) => s + Number(g.value || 0), 0);

                          const realValue = (kit.totalPrice || 0) + guaranteeValueIncluded;
                          const savings = realValue - (kit.totalPrice || 0);
                          const savingsPercent = realValue > 0 ? ((savings / realValue) * 100) : 0;
                          return (
                            <div key={ki} className={`rounded-xl border-2 p-4 space-y-3 relative ${kit.isRecommended ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200' : 'border-slate-200 bg-white'
                              }`}>
                              {kit.isRecommended && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">RECOMENDADO</div>
                              )}
                              <div className="text-center pt-1">
                                <h4 className={`font-bold text-lg ${kit.isRecommended ? 'text-amber-800' : 'text-slate-700'}`}>
                                  {kit.name}
                                </h4>
                              </div>
                              {/* Equipment summary */}
                              <div className="space-y-1 text-xs">
                                {(kit.equipment || []).slice(0, 3).map((eq: any, ei: number) => (
                                  <div key={ei} className="p-1.5 bg-white rounded border text-center">
                                    <p className="font-bold text-slate-700">{eq.description || eq.type}</p>
                                    <p className="text-slate-400">{eq.brand} {eq.model} × {eq.quantity}</p>
                                  </div>
                                ))}
                              </div>
                              {/* Guarantees with optional values */}
                              <div className="space-y-1">
                                {(kit.guarantees || []).map((g: any, gi: number) => (
                                  <div key={gi} className="flex items-start gap-1.5 text-[11px]">
                                    {g.included
                                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                      : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />}
                                    <span className={`flex-1 ${g.included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{g.text}</span>
                                    {kit.showGuaranteeValues && Number(g.value) > 0 && (
                                      <span className={`text-[10px] font-mono ${g.included ? 'text-green-600' : 'text-slate-300'}`}>{g.included ? fmt(g.value) : ''}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {/* Value Stack (Hormozi) */}
                              {kit.showGuaranteeValues && guaranteeValueIncluded > 0 && (
                                <div className="p-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-green-200 text-center space-y-0.5">
                                  <p className="text-[10px] text-green-600 font-bold uppercase">Valor Real de Tudo</p>
                                  <p className="text-sm font-bold text-green-800 line-through decoration-red-400 decoration-2">{fmt(realValue)}</p>
                                  <p className="text-[10px] text-green-600">Economia de {fmt(savings)} ({fmtN(savingsPercent, 0)}%)</p>
                                </div>
                              )}
                              {/* Price — Anchoring */}
                              <div className={`text-center pt-2 border-t ${kit.isRecommended ? 'border-amber-300' : 'border-slate-200'}`}>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Você Paga Apenas</p>
                                <p className={`text-2xl font-bold ${kit.isRecommended ? 'text-amber-800' : 'text-slate-900'}`}>{fmt(kit.totalPrice)}</p>
                                <p className="text-[10px] text-slate-400">à vista</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Simulação Financeira */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-500" /> Simulação Financeira</h2>
                <Button onClick={handleCalcFinancials} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                  Calcular Financeiro
                </Button>
              </div>

              {/* Params */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border">
                <div><Label className="text-xs">Aumento Anual da Energia (%)</Label><Input type="number" step="0.1" value={form.annualEnergyIncrease} onChange={e => setForm({ ...form, annualEnergyIncrease: e.target.value })} /></div>
                <div><Label className="text-xs">Degradação Anual dos Painéis (%)</Label><Input type="number" step="0.1" value={form.annualDegradation} onChange={e => setForm({ ...form, annualDegradation: e.target.value })} /></div>
              </div>

              {p?.totalInvestment ? (
                <div className="space-y-4">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 text-center">
                      <p className="text-xs text-amber-700 font-bold uppercase">Investimento Total</p>
                      <p className="text-2xl font-bold text-amber-900 mt-1">{fmt(p.totalInvestment)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 text-center">
                      <p className="text-xs text-green-700 font-bold uppercase">Economia Mensal</p>
                      <p className="text-2xl font-bold text-green-800 mt-1">{fmt(p.monthlySavings)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 text-center">
                      <p className="text-xs text-blue-700 font-bold uppercase">Economia Anual</p>
                      <p className="text-2xl font-bold text-blue-800 mt-1">{fmt(p.annualSavings)}</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase">Payback</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{fmtN(p.paybackMonths)} <span className="text-sm">meses</span></p>
                      <p className="text-xs text-slate-400">{fmtN(Number(p.paybackMonths) / 12)} anos</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase">ROI (25 anos)</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">{fmtN(p.roiPercent)}%</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 text-center">
                      <p className="text-xs text-emerald-700 font-bold uppercase">Economia 25 Anos</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-1">{fmt(p.savings25Years)}</p>
                    </div>
                  </div>

                  {/* Cash Flow Chart (simple bar chart) */}
                  {p.cashFlow && (
                    <div className="border rounded-xl p-4">
                      <p className="text-sm font-bold text-slate-700 mb-4">Fluxo de Caixa — Economia Acumulada vs Investimento</p>
                      <div className="flex items-end gap-1 h-48">
                        {p.cashFlow.map((cf: any) => {
                          const maxVal = Math.max(...p.cashFlow.map((c: any) => c.accumulated));
                          const h = maxVal > 0 ? (cf.accumulated / maxVal) * 100 : 0;
                          const isPayback = cf.balance >= 0 && (cf.year === 1 || p.cashFlow[cf.year - 2]?.balance < 0);
                          return (
                            <div key={cf.year} className="flex-1 flex flex-col items-center gap-1" title={`Ano ${cf.year}: ${fmt(cf.accumulated)}`}>
                              <div
                                className={`w-full rounded-t transition-all ${cf.balance >= 0 ? 'bg-green-400' : 'bg-amber-400'} ${isPayback ? 'ring-2 ring-green-600' : ''}`}
                                style={{ height: `${Math.max(h, 4)}%` }}
                              />
                              {cf.year % 5 === 0 && <span className="text-[9px] text-slate-400">{cf.year}</span>}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded" /> Antes do payback</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded" /> Após o payback</div>
                        <div className="ml-auto">Investimento: <span className="font-bold text-slate-700">{fmt(p.totalInvestment)}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Comparison: Current Bill vs Solar */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-xl p-4 text-center">
                      <p className="text-xs text-red-600 font-bold uppercase mb-2">Conta Atual (sem solar)</p>
                      <p className="text-3xl font-bold text-red-700">{fmt(Number(form.avgBillValue || 0))}</p>
                      <p className="text-xs text-red-500 mt-1">por mês</p>
                      <p className="text-sm text-red-600 mt-2 font-medium">Em 25 anos: {fmt(Number(form.avgBillValue || 0) * 12 * 25)}</p>
                    </div>
                    <div className="border rounded-xl p-4 text-center bg-green-50">
                      <p className="text-xs text-green-700 font-bold uppercase mb-2">Com Solar</p>
                      <p className="text-3xl font-bold text-green-800">{fmt(Math.max(Number(form.avgBillValue || 0) - Number(p.monthlySavings), 0))}</p>
                      <p className="text-xs text-green-600 mt-1">por mês (estimado)</p>
                      <p className="text-sm text-green-700 mt-2 font-medium">Economia: {fmt(p.monthlySavings)}/mês</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Clique em "Calcular Financeiro" para gerar a simulação</p>
                  <p className="text-xs mt-1">Certifique-se de ter adicionado equipamentos e custos no Step anterior</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Proposta */}
          {step === 7 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" /> Proposta Comercial</h2>
                <div className="flex items-center gap-2">
                  {!p?.proposalId ? (
                    <Button onClick={handleGenerateProposal} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      Gerar Proposta
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleUpdateProposal} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Atualizar Proposta
                      </Button>
                      <Button onClick={handleDownloadSolarPDF} disabled={pdfGenerating} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                        {pdfGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        Baixar PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Resumo do Projeto */}
              <div className="border rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase">Resumo do Projeto</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-400">Cliente:</span> <strong>{clients.find((c: any) => c.id === form.clientId)?.name || '—'}</strong></div>
                  <div><span className="text-slate-400">Potência:</span> <strong>{fmtN(p?.systemPowerKwp || 0)} kWp</strong></div>
                  <div><span className="text-slate-400">Módulos:</span> <strong>{p?.moduleCount || 0} un</strong></div>
                  <div><span className="text-slate-400">Geração:</span> <strong>{fmtN(p?.monthlyGenerationKwh || 0, 0)} kWh/mês</strong></div>
                  <div><span className="text-slate-400">Investimento:</span> <strong>{fmt(p?.totalInvestment || 0)}</strong></div>
                  <div><span className="text-slate-400">Payback:</span> <strong>{fmtN(p?.paybackMonths || 0)} meses</strong></div>
                  <div><span className="text-slate-400">ROI:</span> <strong>{fmtN(p?.roiPercent || 0)}%</strong></div>
                  <div><span className="text-slate-400">Economia 25 anos:</span> <strong>{fmt(p?.savings25Years || 0)}</strong></div>
                </div>
              </div>

              {p?.proposalId && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-sm font-bold text-green-800">Proposta registrada no ERP</p>
                      <p className="text-xs text-green-600">Se fez edições, clique em "Atualizar Proposta" antes de baixar o PDF.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open(`/admin/proposals`, '_blank')}>
                    <Eye className="w-4 h-4 mr-1" /> Ver Propostas
                  </Button>
                </div>
              )}

              <div className="text-sm text-slate-500">
                <Label>Observações</Label>
                <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionais para a proposta..." />
              </div>
            </div>
          )}
        </div>

        {/* Hidden container for Solar PDF generation */}
        <div className="fixed -left-[9999px] top-0">
          {showPdfRender && currentProject && (
            <SolarProposalPDFTemplate
              proposal={currentProject.proposal || { proposalNumber: currentProject.code, client: clients.find((c: any) => c.id === form.clientId) }}
              solarProject={currentProject}
              company={pdfCompanyData}
            />
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goPrev} disabled={step === 0}><ArrowLeft className="w-4 h-4 mr-1" /> Anterior</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Salvar
            </Button>
            {step < STEPS.length - 1 && (
              <Button onClick={goNext} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                Próximo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Client Dialog also available in wizard */}
        <ClientDialog
          open={newClientDialogOpen}
          onOpenChange={setNewClientDialogOpen}
          onSuccess={handleNewClientCreated}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Sun className="w-7 h-7 text-amber-500" /> Energia Solar Fotovoltaica</h1>
          <p className="text-sm text-slate-500 mt-1">Dimensionamento e propostas de sistemas solares</p>
        </div>
        <Button onClick={handleStartNew} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Novo Projeto Solar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Total</p><p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500 uppercase font-bold">Rascunho</p><p className="text-2xl font-bold text-slate-600 mt-1">{stats.draft}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-blue-500 uppercase font-bold">Dimensionados</p><p className="text-2xl font-bold text-blue-600 mt-1">{stats.dimensioned}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-green-500 uppercase font-bold">Com Proposta</p><p className="text-2xl font-bold text-green-600 mt-1">{stats.proposalGen}</p></div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Buscar projetos solares..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Project List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Sun className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum projeto solar encontrado</p>
          <p className="text-sm mt-1">Clique em "Novo Projeto Solar" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const st = statusMap[p.status] || statusMap.draft;
            return (
              <div key={p.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenProject(p)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-slate-400">{p.code}</span>
                      <Badge className={st.color}>{st.label}</Badge>
                      {p.systemPowerKwp && <Badge variant="outline" className="text-xs">{fmtN(p.systemPowerKwp)} kWp</Badge>}
                    </div>
                    <h3 className="font-semibold text-slate-900">{p.title || 'Projeto Solar'}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                      {p.client && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{p.client.name}</span>}
                      {p.totalInvestment > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{fmt(p.totalInvestment)}</span>}
                      {p.monthlyGenerationKwh > 0 && <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{fmtN(p.monthlyGenerationKwh, 0)} kWh/mês</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ NEW CLIENT DIALOG ═══ */}
      <ClientDialog
        open={newClientDialogOpen}
        onOpenChange={setNewClientDialogOpen}
        onSuccess={handleNewClientCreated}
      />
    </div>
  );
}
