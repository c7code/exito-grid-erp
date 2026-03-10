import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  Phone,
  DollarSign,
  User,
  MoreHorizontal,
  Loader2,
  Trash2,
  Zap,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  FileText,
  MessageSquare,
  ExternalLink,
  Settings2,
  GripVertical,
  Pencil,
  Eye,
  EyeOff,
  RotateCcw,
  AlertTriangle,
  MapPin,
  Building2,
  Search,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';
import type { Opportunity, OpportunityStage, Client } from '@/types';
import { toast } from 'sonner';
import { api } from '@/api';
import NewProposalDialog from '@/components/NewProposalDialog';

// ═══════════════════════════════════════════════
// ALL AVAILABLE STAGES (matches backend enum)
// ═══════════════════════════════════════════════

interface PipelineColumn {
  id: string;
  title: string;
  color: string;
  visible: boolean;
}

const DEFAULT_COLUMNS: PipelineColumn[] = [
  { id: 'lead_new', title: 'Novos', color: 'bg-blue-500', visible: true },
  { id: 'qualification', title: 'Qualificação', color: 'bg-cyan-500', visible: true },
  { id: 'visit', title: 'Visita', color: 'bg-teal-500', visible: true },
  { id: 'proposal', title: 'Proposta', color: 'bg-purple-500', visible: true },
  { id: 'negotiation', title: 'Negociação', color: 'bg-orange-500', visible: true },
  { id: 'closed_won', title: 'Ganhos', color: 'bg-emerald-500', visible: true },
  { id: 'closed_lost', title: 'Perdidos', color: 'bg-red-500', visible: true },
  { id: 'execution', title: 'Execução', color: 'bg-indigo-500', visible: false },
  { id: 'completed', title: 'Concluído', color: 'bg-gray-500', visible: false },
];

const STORAGE_KEY = 'pipeline_columns_config';

function loadColumnsFromStorage(): PipelineColumn[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: PipelineColumn[] = JSON.parse(saved);
      // Merge with defaults to handle new stages added later
      const savedIds = new Set(parsed.map(c => c.id));
      const merged = [...parsed];
      for (const def of DEFAULT_COLUMNS) {
        if (!savedIds.has(def.id)) merged.push(def);
      }
      return merged;
    }
  } catch { /* ignore */ }
  return DEFAULT_COLUMNS.map(c => ({ ...c }));
}

function saveColumnsToStorage(cols: PipelineColumn[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
}

const DEFAULT_COLUMN_IDS = new Set(DEFAULT_COLUMNS.map(c => c.id));

const COLOR_OPTIONS = [
  'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-purple-500',
  'bg-orange-500', 'bg-emerald-500', 'bg-red-500', 'bg-indigo-500',
  'bg-gray-500', 'bg-pink-500', 'bg-yellow-500', 'bg-lime-500',
  'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500',
];

const sourceLabels: Record<string, string> = {
  website: 'Website',
  whatsapp: 'WhatsApp',
  referral: 'Indicação',
  social_media: 'Redes Sociais',
  other: 'Outro',
};

const stageLabels: Record<string, string> = {
  lead_new: 'Novo',
  qualification: 'Qualificação',
  visit: 'Visita',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  closed_won: 'Ganho',
  closed_lost: 'Perdido',
  execution: 'Execução',
  completed: 'Concluído',
};

const emptyForm = {
  title: '',
  serviceType: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientDocument: '',
  clientCep: '',
  clientAddress: '',
  clientCity: '',
  clientState: '',
  clientNeighborhood: '',
  estimatedValue: '',
  source: 'website' as string,
  description: '',
  stage: 'lead_new' as string,
  linkedClientId: '' as string,
};

// ═══════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════

export default function AdminPipeline() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Customizable columns
  const [columns, setColumns] = useState<PipelineColumn[]>(loadColumnsFromStorage);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsColumns, setSettingsColumns] = useState<PipelineColumn[]>([]);
  const [draggingSettingsIdx, setDraggingSettingsIdx] = useState<number | null>(null);
  const [editingColIdx, setEditingColIdx] = useState<number | null>(null);

  const visibleColumns = columns.filter(c => c.visible);

  // Create/Edit dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Confirm stage dialog
  const [confirmStage, setConfirmStage] = useState<{
    oppId: string;
    oppTitle: string;
    targetStage: OpportunityStage;
  } | null>(null);
  const [movingStage, setMovingStage] = useState(false);

  // Leave proposal confirmation
  const [leaveProposalConfirm, setLeaveProposalConfirm] = useState<{
    oppId: string;
    oppTitle: string;
    targetStage: OpportunityStage;
    proposals: { id: string; proposalNumber?: string; title?: string }[];
  } | null>(null);

  // Proposal dialog from card menu
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [selectedOppForProposal, setSelectedOppForProposal] = useState<Opportunity | null>(null);
  const [isClientViewerOpen, setIsClientViewerOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Auto-fill states
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);

  // Load clients for search when form opens
  useEffect(() => {
    if (isFormOpen) {
      api.getClients().then((data) => setClientsList(data)).catch(() => {});
    }
  }, [isFormOpen]);

  // CNPJ auto-lookup
  useEffect(() => {
    const clean = formData.clientDocument.replace(/\D/g, '');
    if (clean.length !== 14) return;
    const timer = setTimeout(async () => {
      setCnpjLoading(true);
      try {
        const data = await api.fetchCnpjData(clean);
        setFormData(prev => ({
          ...prev,
          clientName: data.razao_social || prev.clientName,
          clientEmail: data.email || prev.clientEmail,
          clientPhone: data.ddd_telefone_1 || prev.clientPhone,
          clientAddress: data.logradouro || prev.clientAddress,
          clientNeighborhood: data.bairro || prev.clientNeighborhood,
          clientCity: data.municipio || prev.clientCity,
          clientState: data.uf || prev.clientState,
          clientCep: data.cep?.replace(/\D/g, '') || prev.clientCep,
        }));
        toast.success('Dados da empresa carregados automaticamente');
      } catch {
        toast.error('CNPJ não encontrado');
      } finally {
        setCnpjLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.clientDocument]);

  // CEP auto-lookup
  useEffect(() => {
    const clean = formData.clientCep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    const timer = setTimeout(async () => {
      setCepLoading(true);
      try {
        const data = await api.fetchCepData(clean);
        setFormData(prev => ({
          ...prev,
          clientAddress: data.logradouro || prev.clientAddress,
          clientNeighborhood: data.bairro || prev.clientNeighborhood,
          clientCity: data.localidade || prev.clientCity,
          clientState: data.uf || prev.clientState,
        }));
        toast.success('Endereço preenchido pelo CEP');
      } catch {
        toast.error('CEP não encontrado');
      } finally {
        setCepLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.clientCep]);

  // Select existing client from search
  const handleSelectClient = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      linkedClientId: client.id,
      clientName: client.name || prev.clientName,
      clientEmail: client.email || prev.clientEmail,
      clientPhone: client.phone || client.whatsapp || prev.clientPhone,
      clientDocument: client.document || prev.clientDocument,
      clientCep: client.zipCode || prev.clientCep,
      clientAddress: client.address || prev.clientAddress,
      clientCity: client.city || prev.clientCity,
      clientState: client.state || prev.clientState,
      clientNeighborhood: client.neighborhood || prev.clientNeighborhood,
    }));
    setShowClientSearch(false);
    setClientSearch('');
    toast.success(`Cliente "${client.name}" selecionado`);
  };

  const filteredClientsList = clientSearch.trim()
    ? clientsList.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.document?.includes(clientSearch)
      )
    : clientsList.slice(0, 8);

  const loadOpportunities = useCallback(async () => {
    try {
      const data = await api.getOpportunities();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setOpportunities(list);
    } catch (error) {
      console.error('Erro ao carregar oportunidades:', error);
      toast.error('Erro ao carregar oportunidades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const getByStage = (stage: OpportunityStage) =>
    opportunities.filter((o) => o.stage === stage);

  // ═══════════ SETTINGS ═══════════

  const openSettings = () => {
    setSettingsColumns(columns.map(c => ({ ...c })));
    setEditingColIdx(null);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    setColumns(settingsColumns);
    saveColumnsToStorage(settingsColumns);
    setSettingsOpen(false);
    toast.success('Pipeline atualizado!');
  };

  const resetSettings = () => {
    const defaults = DEFAULT_COLUMNS.map(c => ({ ...c }));
    setSettingsColumns(defaults);
  };

  const handleSettingsDragStart = (idx: number) => {
    setDraggingSettingsIdx(idx);
  };

  const handleSettingsDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingSettingsIdx === null || draggingSettingsIdx === idx) return;
    const updated = [...settingsColumns];
    const [moved] = updated.splice(draggingSettingsIdx, 1);
    updated.splice(idx, 0, moved);
    setSettingsColumns(updated);
    setDraggingSettingsIdx(idx);
  };

  const handleSettingsDragEnd = () => {
    setDraggingSettingsIdx(null);
  };

  // ═══════════ Drag and Drop ═══════════

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('opportunityId', id);
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: OpportunityStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    const oppId = e.dataTransfer.getData('opportunityId');
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp || opp.stage === targetStage) return;

    initiateStageMove(opp, targetStage);
  };

  const initiateStageMove = (opp: Opportunity, targetStage: OpportunityStage) => {
    // Leaving proposal stage → check for linked proposals
    if (opp.stage === 'proposal' && targetStage !== 'proposal') {
      const linkedProposals = (opp as any).proposals || [];
      if (linkedProposals.length > 0) {
        setLeaveProposalConfirm({
          oppId: opp.id,
          oppTitle: opp.title,
          targetStage,
          proposals: linkedProposals.map((p: any) => ({
            id: p.id,
            proposalNumber: p.proposalNumber,
            title: p.title,
          })),
        });
        return;
      }
    }

    // Entering proposal or closed_won → show confirmation
    if (targetStage === 'proposal' || targetStage === 'closed_won') {
      setConfirmStage({ oppId: opp.id, oppTitle: opp.title, targetStage });
    } else {
      performMoveStage(opp.id, targetStage);
    }
  };

  const handleLeaveProposalConfirm = async (deleteProposals: boolean) => {
    if (!leaveProposalConfirm) return;
    setMovingStage(true);

    try {
      if (deleteProposals) {
        for (const p of leaveProposalConfirm.proposals) {
          try {
            await api.deleteProposal(p.id);
          } catch { /* continue */ }
        }
        toast.success('Propostas excluídas.');
      }

      // Now check if target stage needs its own confirmation (entering proposal or closed_won)
      const { oppId, targetStage } = leaveProposalConfirm;
      setLeaveProposalConfirm(null);

      if (targetStage === 'closed_won') {
        setMovingStage(false);
        const opp = opportunities.find(o => o.id === oppId);
        setConfirmStage({ oppId, oppTitle: opp?.title || '', targetStage });
        return;
      }

      await performMoveStageRaw(oppId, targetStage);
    } catch {
      toast.error('Erro ao mover oportunidade.');
    } finally {
      setMovingStage(false);
      setLeaveProposalConfirm(null);
    }
  };

  const performMoveStageRaw = async (id: string, stage: OpportunityStage) => {
    const result = await api.moveOpportunityStage(id, stage);
    if (result.createdProposal) {
      toast.success(`Proposta "${result.createdProposal.proposalNumber}" criada automaticamente!`);
    }
    if (result.createdWork) {
      toast.success(`Obra "${result.createdWork.code}" criada automaticamente!`);
    }
    if (result.createdPayment) {
      toast.success('Pagamento pendente criado no financeiro!');
    }
    loadOpportunities();
    toast.success(`Movido para "${stageLabels[stage]}"`);
  };

  const performMoveStage = async (id: string, stage: OpportunityStage) => {
    setMovingStage(true);
    try {
      await performMoveStageRaw(id, stage);
    } catch (error) {
      toast.error('Erro ao mover oportunidade.');
    } finally {
      setMovingStage(false);
      setConfirmStage(null);
    }
  };

  // ═══════════ CRUD ═══════════

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (opp: Opportunity) => {
    setEditingId(opp.id);
    setFormData({
      title: opp.title || '',
      serviceType: opp.serviceType || '',
      clientName: opp.clientName || (opp.client?.name) || '',
      clientEmail: opp.clientEmail || (opp.client?.email) || '',
      clientPhone: opp.clientPhone || (opp.client?.phone) || '',
      clientDocument: (opp.client as any)?.document || '',
      clientCep: (opp.client as any)?.zipCode || '',
      clientAddress: (opp.client as any)?.address || '',
      clientCity: (opp.client as any)?.city || '',
      clientState: (opp.client as any)?.state || '',
      clientNeighborhood: (opp.client as any)?.neighborhood || '',
      estimatedValue: opp.estimatedValue ? String(opp.estimatedValue) : '',
      source: (opp as any).source || 'other',
      description: opp.description || '',
      stage: opp.stage || 'lead_new',
      linkedClientId: opp.clientId || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: formData.title,
        serviceType: formData.serviceType || null,
        clientName: formData.clientName || null,
        clientEmail: formData.clientEmail || null,
        clientPhone: formData.clientPhone || null,
        estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : 0,
        source: formData.source,
        description: formData.description || null,
        stage: formData.stage,
        clientId: formData.linkedClientId || null,
      };

      if (editingId) {
        await api.updateOpportunity(editingId, payload);
        toast.success('Oportunidade atualizada!');
      } else {
        await api.createOpportunity(payload);
        toast.success('Oportunidade criada!');
      }

      setIsFormOpen(false);
      setFormData(emptyForm);
      loadOpportunities();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao salvar oportunidade.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta oportunidade?')) return;
    try {
      await api.deleteOpportunity(id);
      toast.success('Oportunidade excluída.');
      loadOpportunities();
    } catch (error) {
      toast.error('Erro ao excluir oportunidade.');
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'whatsapp': return <MessageSquare className="w-3 h-3" />;
      case 'website': return <Calendar className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  const getClientName = (opp: Opportunity) =>
    opp.client?.name || opp.clientName || '—';

  const getClientPhone = (opp: Opportunity) =>
    opp.client?.phone || opp.clientPhone;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-3" />
        <span className="text-slate-500">Carregando pipeline...</span>
      </div>
    );
  }

  // ═══════════ RENDER ═══════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Pipeline de Vendas</h1>
          <p className="text-slate-500">Gerencie suas oportunidades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={openSettings} title="Configurar Pipeline">
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            onClick={openCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {visibleColumns.map((column) => {
          const colOpps = getByStage(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className="min-w-[280px] flex-shrink-0"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <Card className={`border-0 transition-all ${isOver
                ? 'bg-amber-50 ring-2 ring-amber-300'
                : 'bg-slate-100'
                }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                    </div>
                    <Badge variant="secondary">{colOpps.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[60px]">
                  {colOpps.map((opp) => (
                    <Card
                      key={opp.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, opp.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggingId === opp.id ? 'opacity-50 rotate-1 scale-95' : ''
                        }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm leading-tight flex-1 mr-2">
                            {opp.title}
                          </h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(opp)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedOppForProposal(opp);
                                setShowProposalDialog(true);
                              }}>
                                <FileText className="w-4 h-4 mr-2" />
                                Nova Proposta
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {visibleColumns
                                .filter((c) => c.id !== opp.stage)
                                .map((c) => (
                                  <DropdownMenuItem
                                    key={c.id}
                                    onClick={() => initiateStageMove(opp, c.id)}
                                  >
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Mover → {c.title}
                                  </DropdownMenuItem>
                                ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(opp.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-1.5">
                          {/* Service Type */}
                          {opp.serviceType && (
                            <div className="flex items-center gap-2">
                              <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                                <Zap className="w-3 h-3 mr-1" />
                                {opp.serviceType}
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-slate-600 group/client">
                            <Avatar className="w-5 h-5 shrink-0 border border-white shadow-sm">
                              <AvatarFallback className="bg-amber-100 text-amber-600 text-[8px] font-bold">
                                {getClientName(opp).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate flex-1">{getClientName(opp)}</span>
                            {opp.client && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-4 h-4 opacity-0 group-hover/client:opacity-100 text-slate-300 hover:text-amber-500 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingClient(opp.client as any);
                                  setIsClientViewerOpen(true);
                                }}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>

                          {getClientPhone(opp) && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-3 h-3 shrink-0" />
                              {getClientPhone(opp)}
                            </div>
                          )}

                          {Number(opp.estimatedValue) > 0 && (
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                              <DollarSign className="w-3 h-3 shrink-0" />
                              R$ {Number(opp.estimatedValue).toLocaleString('pt-BR')}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1.5">
                            {(opp as any).source && (
                              <Badge variant="outline" className="text-xs">
                                {getSourceIcon((opp as any).source)}
                                <span className="ml-1">{sourceLabels[(opp as any).source] || (opp as any).source}</span>
                              </Badge>
                            )}
                            <span className="text-xs text-slate-400">
                              {new Date(opp.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {colOpps.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Arraste um card aqui
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* ═══════════ SETTINGS DIALOG ═══════════ */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Configurar Pipeline
            </DialogTitle>
            <DialogDescription>
              Arraste para reordenar, renomeie ou oculte colunas do pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {settingsColumns.map((col, idx) => (
              <div
                key={col.id}
                draggable
                onDragStart={() => handleSettingsDragStart(idx)}
                onDragOver={(e) => handleSettingsDragOver(e, idx)}
                onDragEnd={handleSettingsDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${draggingSettingsIdx === idx ? 'opacity-50 bg-amber-50 ring-2 ring-amber-300' : 'bg-white hover:bg-slate-50'
                  }`}
              >
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                <div className={`w-4 h-4 rounded-full shrink-0 ${col.color}`} />

                {editingColIdx === idx ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={col.title}
                      onChange={(e) => {
                        const updated = [...settingsColumns];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setSettingsColumns(updated);
                      }}
                      className="h-8 text-sm flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingColIdx(null);
                      }}
                    />
                    <Select
                      value={col.color}
                      onValueChange={(v) => {
                        const updated = [...settingsColumns];
                        updated[idx] = { ...updated[idx], color: v };
                        setSettingsColumns(updated);
                      }}
                    >
                      <SelectTrigger className="w-14 h-8 p-1">
                        <div className={`w-5 h-5 rounded-full ${col.color}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="grid grid-cols-4 gap-1 p-1">
                          {COLOR_OPTIONS.map(c => (
                            <button
                              key={c}
                              className={`w-7 h-7 rounded-full ${c} hover:ring-2 ring-offset-1 ring-slate-400 transition ${col.color === c ? 'ring-2 ring-offset-1 ring-amber-500' : ''
                                }`}
                              onClick={() => {
                                const updated = [...settingsColumns];
                                updated[idx] = { ...updated[idx], color: c };
                                setSettingsColumns(updated);
                              }}
                            />
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingColIdx(null)}>
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className={`flex-1 text-sm font-medium ${!col.visible ? 'text-slate-400' : ''}`}>
                      {col.title}
                    </span>
                    <span className="text-xs text-slate-400 mr-1">{col.id}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditingColIdx(idx)}
                      title="Renomear"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-7 w-7 ${col.visible ? 'text-emerald-500' : 'text-slate-300'}`}
                      onClick={() => {
                        const updated = [...settingsColumns];
                        updated[idx] = { ...updated[idx], visible: !updated[idx].visible };
                        setSettingsColumns(updated);
                      }}
                      title={col.visible ? 'Ocultar' : 'Mostrar'}
                    >
                      {col.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </Button>
                    {!DEFAULT_COLUMN_IDS.has(col.id) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
                        onClick={() => {
                          setSettingsColumns(settingsColumns.filter((_, i) => i !== idx));
                        }}
                        title="Excluir etapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new custom stage */}
          <Button
            variant="outline"
            className="w-full gap-2 border-dashed"
            onClick={() => {
              const newId = `custom_${Date.now()}`;
              const usedColors = new Set(settingsColumns.map(c => c.color));
              const availableColor = COLOR_OPTIONS.find(c => !usedColors.has(c)) || 'bg-slate-500';
              setSettingsColumns([
                ...settingsColumns,
                { id: newId, title: 'Nova Etapa', color: availableColor, visible: true },
              ]);
              setEditingColIdx(settingsColumns.length);
            }}
          >
            <Plus className="w-4 h-4" />
            Nova Etapa
          </Button>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" size="sm" onClick={resetSettings} className="gap-1">
              <RotateCcw className="w-4 h-4" />
              Restaurar padrão
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={saveSettings}>
              Salvar configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ CREATE/EDIT DIALOG ═══════════ */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) { setShowClientSearch(false); setClientSearch(''); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Oportunidade' : 'Nova Oportunidade'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Atualize os dados da oportunidade.'
                : 'Cadastre uma nova oportunidade no pipeline.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* ── Título e Serviço ── */}
            <div>
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Instalação Elétrica Residencial"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Serviço</Label>
                <Input
                  placeholder="Ex: Projeto Elétrico"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                />
              </div>
              <div>
                <Label>Etapa</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(v) => setFormData({ ...formData, stage: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Dados do Interesse / Cliente ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                <User className="w-3.5 h-3.5" />
                <span>Dados do Interesse</span>
              </div>

              {/* Client search */}
              <div className="relative">
                <Label className="text-xs text-slate-500 mb-1 block">Buscar Cliente Existente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Digite nome, email ou CNPJ para buscar..."
                    className="pl-10 h-10"
                    value={clientSearch}
                    onChange={(e) => { setClientSearch(e.target.value); setShowClientSearch(true); }}
                    onFocus={() => setShowClientSearch(true)}
                  />
                </div>
                {showClientSearch && filteredClientsList.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredClientsList.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50 transition-colors text-left border-b last:border-b-0"
                        onClick={() => handleSelectClient(c)}
                      >
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="bg-amber-100 text-amber-600 text-[10px] font-bold">{c.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{c.email} {c.document ? `• ${c.document}` : ''}</p>
                        </div>
                        {c.city && <span className="text-[10px] text-slate-400 shrink-0">{c.city}/{c.state}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {formData.linkedClientId && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-none">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Cliente vinculado
                    </Badge>
                    <button
                      type="button"
                      className="text-[10px] text-red-500 hover:text-red-700 underline"
                      onClick={() => setFormData({ ...formData, linkedClientId: '' })}
                    >
                      desvincular
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Cliente</Label>
                  <Input
                    placeholder="Nome completo / Razão Social"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>CPF / CNPJ</Label>
                  <div className="relative">
                    <Input
                      placeholder="00.000.000/0000-00"
                      value={formData.clientDocument}
                      onChange={(e) => setFormData({ ...formData, clientDocument: e.target.value })}
                      className="pr-10"
                    />
                    {cnpjLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-500" />
                    )}
                  </div>
                  {formData.clientDocument.replace(/\D/g, '').length === 14 && !cnpjLoading && (
                    <p className="text-[10px] text-amber-600 mt-0.5">✓ CNPJ detectado — dados carregados automaticamente</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* ── Endereço ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Localização</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input
                      placeholder="00000-000"
                      value={formData.clientCep}
                      onChange={(e) => setFormData({ ...formData, clientCep: e.target.value })}
                      maxLength={9}
                      className="pr-10"
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-500" />
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    placeholder="Rua, Avenida..."
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Bairro</Label>
                  <Input
                    placeholder="Bairro"
                    value={formData.clientNeighborhood}
                    onChange={(e) => setFormData({ ...formData, clientNeighborhood: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    placeholder="Cidade"
                    value={formData.clientCity}
                    onChange={(e) => setFormData({ ...formData, clientCity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input
                    placeholder="UF"
                    value={formData.clientState}
                    onChange={(e) => setFormData({ ...formData, clientState: e.target.value })}
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* ── Valor e Origem ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Estimado</Label>
                <Input
                  type="text" inputMode="decimal"
                  placeholder="0,00"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                />
              </div>
              <div>
                <Label>Origem</Label>
                <Select
                  value={formData.source}
                  onValueChange={(v) => setFormData({ ...formData, source: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="referral">Indicação</SelectItem>
                    <SelectItem value="social_media">Redes Sociais</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ CONFIRM STAGE MOVE DIALOG ═══════════ */}
      <Dialog open={!!confirmStage} onOpenChange={() => setConfirmStage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${confirmStage?.targetStage === 'closed_won'
                ? 'bg-emerald-100'
                : 'bg-purple-100'
                }`}>
                {confirmStage?.targetStage === 'closed_won' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Briefcase className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <DialogTitle>Confirmar avanço</DialogTitle>
                <DialogDescription>
                  {confirmStage?.targetStage === 'proposal'
                    ? 'Uma Proposta será criada automaticamente para esta oportunidade.'
                    : 'Uma Obra e um Pagamento pendente serão criados automaticamente.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-slate-50 rounded-lg p-4 my-2">
            <p className="text-sm font-medium">{confirmStage?.oppTitle}</p>
            <p className="text-xs text-slate-500 mt-1">
              Mover para → <strong>{confirmStage?.targetStage && stageLabels[confirmStage.targetStage]}</strong>
            </p>
            {confirmStage?.targetStage === 'proposal' && (
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>✅ Proposta criada com dados da oportunidade</p>
                <p>✅ Vinculada automaticamente ao cliente</p>
              </div>
            )}
            {confirmStage?.targetStage === 'closed_won' && (
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>✅ Obra criada com código automático</p>
                <p>✅ Pagamento pendente no financeiro</p>
                <p>✅ Vinculado ao cliente e oportunidade</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStage(null)}>
              Cancelar
            </Button>
            <Button
              className={
                confirmStage?.targetStage === 'closed_won'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }
              onClick={() => {
                if (confirmStage) {
                  performMoveStage(confirmStage.oppId, confirmStage.targetStage);
                }
              }}
              disabled={movingStage}
            >
              {movingStage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {movingStage ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ LEAVE PROPOSAL CONFIRMATION DIALOG ═══════════ */}
      <Dialog open={!!leaveProposalConfirm} onOpenChange={() => setLeaveProposalConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle>Mover de Proposta</DialogTitle>
                <DialogDescription>
                  Esta oportunidade tem propostas vinculadas. O que deseja fazer?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-slate-50 rounded-lg p-4 my-2">
            <p className="text-sm font-medium">{leaveProposalConfirm?.oppTitle}</p>
            <p className="text-xs text-slate-500 mt-1">
              Mover para → <strong>{leaveProposalConfirm?.targetStage && stageLabels[leaveProposalConfirm.targetStage]}</strong>
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-slate-600">Propostas vinculadas:</p>
              {leaveProposalConfirm?.proposals.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-xs text-slate-500">
                  <FileText className="w-3 h-3" />
                  {p.proposalNumber || p.title || p.id}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setLeaveProposalConfirm(null)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleLeaveProposalConfirm(false)}
              disabled={movingStage}
            >
              {movingStage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Manter propostas
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleLeaveProposalConfirm(true)}
              disabled={movingStage}
            >
              {movingStage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir propostas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewProposalDialog
        open={showProposalDialog}
        onOpenChange={setShowProposalDialog}
        onProposalCreated={loadOpportunities}
        prefillData={selectedOppForProposal ? {
          title: `Proposta - ${selectedOppForProposal.title}`,
          clientId: selectedOppForProposal.clientId || '',
          opportunityId: selectedOppForProposal.id,
        } : undefined}
      />

      <ClientDetailViewer
        open={isClientViewerOpen}
        onOpenChange={setIsClientViewerOpen}
        client={viewingClient}
      />
    </div>
  );
}
