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
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';
import type { Opportunity, OpportunityStage, Client } from '@/types';
import { toast } from 'sonner';
import { api } from '@/api';
import NewProposalDialog from '@/components/NewProposalDialog';

const columns: { id: OpportunityStage; title: string; color: string }[] = [
  { id: 'lead_new', title: 'Novos', color: 'bg-blue-500' },
  { id: 'qualification', title: 'Qualificação', color: 'bg-cyan-500' },
  { id: 'visit', title: 'Visita', color: 'bg-teal-500' },
  { id: 'proposal', title: 'Proposta', color: 'bg-purple-500' },
  { id: 'negotiation', title: 'Negociação', color: 'bg-orange-500' },
  { id: 'closed_won', title: 'Ganhos', color: 'bg-emerald-500' },
  { id: 'closed_lost', title: 'Perdidos', color: 'bg-red-500' },
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
  estimatedValue: '',
  source: 'website' as string,
  description: '',
  stage: 'lead_new' as string,
};

export default function AdminPipeline() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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

  // Proposal dialog from card menu
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [selectedOppForProposal, setSelectedOppForProposal] = useState<Opportunity | null>(null);
  const [isClientViewerOpen, setIsClientViewerOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

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

  // ===== Drag and Drop =====
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

    // Stages that create entities → show confirmation
    if (targetStage === 'proposal' || targetStage === 'closed_won') {
      setConfirmStage({ oppId, oppTitle: opp.title, targetStage });
    } else {
      performMoveStage(oppId, targetStage);
    }
  };

  const performMoveStage = async (id: string, stage: OpportunityStage) => {
    setMovingStage(true);
    try {
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
    } catch (error) {
      toast.error('Erro ao mover oportunidade.');
    } finally {
      setMovingStage(false);
      setConfirmStage(null);
    }
  };

  // ===== CRUD =====
  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Pipeline de Vendas</h1>
          <p className="text-slate-500">Gerencie suas oportunidades</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-slate-900"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Oportunidade
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
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
                              <DropdownMenuItem onClick={() => {
                                setSelectedOppForProposal(opp);
                                setShowProposalDialog(true);
                              }}>
                                <FileText className="w-4 h-4 mr-2" />
                                Nova Proposta
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {columns
                                .filter((c) => c.id !== opp.stage)
                                .map((c) => (
                                  <DropdownMenuItem
                                    key={c.id}
                                    onClick={() => {
                                      if (c.id === 'proposal' || c.id === 'closed_won') {
                                        setConfirmStage({
                                          oppId: opp.id,
                                          oppTitle: opp.title,
                                          targetStage: c.id,
                                        });
                                      } else {
                                        performMoveStage(opp.id, c.id);
                                      }
                                    }}
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
                            {opp.source && (
                              <Badge variant="outline" className="text-xs">
                                {getSourceIcon(opp.source)}
                                <span className="ml-1">{sourceLabels[opp.source] || opp.source}</span>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
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

          <div className="space-y-4 pt-2">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Cliente</Label>
                <Input
                  placeholder="Nome completo"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Estimado</Label>
                <Input
                  type="number"
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

      {/* Confirm Stage Move Dialog */}
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
