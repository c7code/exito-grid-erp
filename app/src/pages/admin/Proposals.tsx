import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';
import type { Client } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  History,
  Receipt,
  Package,
  Wrench,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import NewProposalDialog from '@/components/NewProposalDialog';
import { ProposalPDFTemplate } from '@/components/ProposalPDFTemplate';
import { SolarProposalPDFTemplate } from '@/components/SolarProposalPDFTemplate';
import html2pdf from 'html2pdf.js';
import { Download, MessageCircle, Mail, ExternalLink } from 'lucide-react';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: any }> = {
  draft: { label: 'Rascunho', variant: 'outline', icon: FileText },
  sent: { label: 'Enviada', variant: 'secondary', icon: Send },
  viewed: { label: 'Visualizada', variant: 'secondary', icon: Eye },
  accepted: { label: 'Aprovada', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Rejeitada', variant: 'destructive', icon: XCircle },
  expired: { label: 'Expirada', variant: 'outline', icon: Clock },
};

export default function AdminProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any>(null);
  const [isClientViewerOpen, setIsClientViewerOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [proposalToPrint, setProposalToPrint] = useState<any>(null);
  const [solarProjectData, setSolarProjectData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionProposal, setRevisionProposal] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [previewRevision, setPreviewRevision] = useState<any>(null);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const data = await api.getProposals();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setProposals(list);
    } catch (error) {
      console.error('Erro ao carregar propostas:', error);
      toast.error('Erro ao carregar propostas. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter((p) =>
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.proposalNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedValue = proposals
    .filter(p => p.status === 'accepted')
    .reduce((acc, p) => acc + Number(p.total || 0), 0);
  const pendingValue = proposals
    .filter(p => p.status === 'sent' || p.status === 'viewed')
    .reduce((acc, p) => acc + Number(p.total || 0), 0);

  const handleSend = async (proposal: any) => {
    try {
      await api.sendProposal(proposal.id);
      toast.success('Proposta enviada!');
      loadProposals();
    } catch (error) {
      toast.error('Erro ao enviar proposta.');
    }
  };

  const handleAccept = async (proposal: any) => {
    try {
      await api.acceptProposal(proposal.id);
      toast.success('Proposta aprovada!');
      loadProposals();
    } catch (error) {
      toast.error('Erro ao aprovar proposta.');
    }
  };

  const handleReject = async (proposal: any) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    try {
      await api.rejectProposal(proposal.id, reason || undefined);
      toast.success('Proposta rejeitada.');
      loadProposals();
    } catch (error) {
      toast.error('Erro ao rejeitar proposta.');
    }
  };

  const handleDelete = async (proposal: any) => {
    if (!confirm(`Excluir proposta "${proposal.title || proposal.proposalNumber}"?`)) return;
    try {
      await api.deleteProposal(proposal.id);
      toast.success('Proposta excluída.');
      loadProposals();
    } catch (error) {
      toast.error('Erro ao excluir proposta.');
    }
  };

  const getClientName = (proposal: any): string => {
    if (proposal.client?.name) return proposal.client.name;
    if (proposal.opportunity?.client?.name) return proposal.opportunity.client.name;
    return '—';
  };

  const handleViewRevisions = async (proposal: any) => {
    setRevisionProposal(proposal);
    setRevisionDialogOpen(true);
    setLoadingRevisions(true);
    try {
      const data = await api.getProposalRevisions(proposal.id);
      setRevisions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar revisões:', error);
      toast.error('Erro ao carregar revisões.');
      setRevisions([]);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleRestoreRevision = async (revisionId: string) => {
    if (!revisionProposal?.id) return;
    setRestoringId(revisionId);
    try {
      await api.restoreProposalRevision(revisionProposal.id, revisionId);
      toast.success('Proposta restaurada com sucesso! A versão anterior foi salva no histórico.');
      setRevisionDialogOpen(false);
      setConfirmRestoreId(null);
      setPreviewRevision(null);
      loadProposals();
    } catch (error) {
      console.error('Erro ao restaurar revisão:', error);
      toast.error('Erro ao restaurar revisão.');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteRevision = async (revisionId: string) => {
    if (!revisionProposal?.id) return;
    try {
      await api.deleteProposalRevision(revisionProposal.id, revisionId);
      toast.success('Revisão excluída do histórico.');
      // Recarregar revisões
      const data = await api.getProposalRevisions(revisionProposal.id);
      setRevisions(Array.isArray(data) ? data : []);
      setPreviewRevision(null);
      setConfirmRestoreId(null);
    } catch (error) {
      console.error('Erro ao excluir revisão:', error);
      toast.error('Erro ao excluir revisão.');
    }
  };

  const handleDownloadPDF = async (proposal: any) => {
    toast.info('Gerando PDF profissional...');

    // ═══ FETCH FRESH DATA from API to ensure PDF uses latest saved values ═══
    let freshProposal = proposal;
    try {
      freshProposal = await api.getProposal(proposal.id);
    } catch (err) {
      console.warn('Could not fetch fresh proposal data, using local data:', err);
    }

    // If solar proposal, load solar project data first
    let solarData = null;
    let coData = null;
    if (freshProposal.activityType === 'energia_solar') {
      try {
        solarData = await api.getSolarProjectByProposal(freshProposal.id);
        setSolarProjectData(solarData);
      } catch (err) {
        console.warn('Could not load solar project data:', err);
      }
      // Try to load company data
      if (solarData?.companyId) {
        try {
          coData = await api.getCompany(solarData.companyId);
          setCompanyData(coData);
        } catch (err) {
          console.warn('Could not load company data:', err);
        }
      }
      if (!coData) {
        try {
          coData = await api.getPrimaryCompany();
          setCompanyData(coData);
        } catch (err) {
          console.warn('Could not load primary company:', err);
        }
      }
    }

    setProposalToPrint(freshProposal);

    // Delay to ensure the template renders
    setTimeout(() => {
      const element = document.getElementById('proposal-pdf-content');
      if (!element) {
        toast.error('Erro ao gerar PDF: Elemento não encontrado.');
        setProposalToPrint(null);
        return;
      }

      const opt = {
        margin: 0,
        filename: `proposta_${proposal.proposalNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, width: 794, windowWidth: 794 },
        jsPDF: { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] },
        pagebreak: { avoid: 'img' }
      };

      html2pdf().from(element).set(opt).save().then(() => {
        setProposalToPrint(null);
        setSolarProjectData(null);
        setCompanyData(null);
        toast.success('PDF gerado com sucesso!');
      }).catch((err: any) => {
        console.error('PDF Error:', err);
        toast.error('Erro ao gerar PDF.');
      });
    }, 800);
  };

  const handleShareWhatsApp = (proposal: any) => {
    const clientName = getClientName(proposal);
    const totalStr = Number(proposal.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const text = `Olá ${clientName}! Segue a proposta comercial *${proposal.proposalNumber}* - *${proposal.title}* no valor de *${totalStr}*.`;
    const url = `https://wa.me/${proposal.client?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = (proposal: any) => {
    const clientName = getClientName(proposal);
    const subject = encodeURIComponent(`Proposta Comercial ${proposal.proposalNumber} - ${proposal.title}`);
    const body = encodeURIComponent(`Olá ${clientName},\n\nSegue em anexo a proposta comercial ${proposal.proposalNumber} referente a "${proposal.title}".\n\nFicamos à disposição para dúvidas.\n\nAtenciosamente,\nEquipe EPR ÊXITO`);
    window.location.href = `mailto:${proposal.client?.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Propostas</h1>
          <p className="text-slate-500">Gerencie todas as propostas comerciais</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-slate-900"
          onClick={() => setShowNewDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Propostas</p>
            <p className="text-2xl font-bold">{proposals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Aprovadas</p>
            <p className="text-2xl font-bold text-emerald-600">
              {proposals.filter(p => p.status === 'accepted').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Valor Aprovado</p>
            <p className="text-2xl font-bold">
              R$ {approvedValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pendente</p>
            <p className="text-2xl font-bold text-amber-600">
              R$ {pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar propostas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-3" />
              <span className="text-slate-500">Carregando propostas...</span>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">Nenhuma proposta encontrada</p>
              <p className="text-sm">Clique em "Nova Proposta" para criar a primeira.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Proposta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Rev.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Simulação</TableHead>
                  <TableHead>Cadastrado por</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => {
                  const statusInfo = statusLabels[proposal.status] || statusLabels.draft;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <TableRow key={proposal.id}>
                      <TableCell className="font-medium">
                        {proposal.proposalNumber}
                      </TableCell>
                      <TableCell>{proposal.title || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 group/client">
                          <Avatar className="w-5 h-5 shrink-0 border border-white shadow-sm">
                            <AvatarFallback className="bg-amber-100 text-amber-600 text-[8px] font-bold">
                              {getClientName(proposal).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-slate-700">
                            {getClientName(proposal)}
                          </span>
                          {(proposal.client || proposal.opportunity?.client) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-4 h-4 opacity-0 group-hover/client:opacity-100 text-slate-300 hover:text-amber-500 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingClient((proposal.client || proposal.opportunity?.client) as any);
                                setIsClientViewerOpen(true);
                              }}
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs font-medium">
                          Rev. {proposal.revisionNumber || 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {proposal.validUntil
                          ? new Date(proposal.validUntil).toLocaleDateString('pt-BR')
                          : '—'}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {Number(proposal.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell>
                        {proposal.simulationData ? (
                          <Badge className="bg-cyan-500/20 text-cyan-600 border-cyan-500/30 hover:bg-cyan-500/30">
                            📊 Sim
                          </Badge>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {proposal.createdByUser ? (
                          <span className="text-sm text-slate-600">{proposal.createdByUser.name}</span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingProposal(proposal);
                              setShowNewDialog(true);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewRevisions(proposal)}>
                              <History className="w-4 h-4 mr-2" />
                              Ver Revisões
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDownloadPDF(proposal)}>
                              <Download className="w-4 h-4 mr-2" />
                              Baixar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareWhatsApp(proposal)}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareEmail(proposal)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {proposal.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleSend(proposal)}>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar
                              </DropdownMenuItem>
                            )}
                            {(proposal.status === 'sent' || proposal.status === 'viewed') && (
                              <>
                                <DropdownMenuItem onClick={() => handleAccept(proposal)}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(proposal)}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            {/* ═══ ATALHOS FINANCEIROS ═══ */}
                            <DropdownMenuItem onClick={() => navigate(`/admin/finance?tab=receipts&proposalId=${proposal.id}&proposalNumber=${proposal.proposalNumber}&clientId=${proposal.clientId || proposal.client?.id || ''}&total=${proposal.total || 0}&title=${encodeURIComponent(proposal.title || '')}`)}>
                              <Receipt className="w-4 h-4 mr-2 text-emerald-600" />
                              Gerar Recibo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/finance?tab=purchase-orders&proposalId=${proposal.id}&proposalNumber=${proposal.proposalNumber}&clientId=${proposal.clientId || proposal.client?.id || ''}&total=${proposal.total || 0}&title=${encodeURIComponent(proposal.title || '')}`)}>
                              <Package className="w-4 h-4 mr-2 text-blue-600" />
                              Pedido de Compra
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/service-orders?proposalId=${proposal.id}&proposalNumber=${proposal.proposalNumber}&clientId=${proposal.clientId || proposal.client?.id || ''}`)}>
                              <Wrench className="w-4 h-4 mr-2 text-orange-600" />
                              Ordem de Serviço
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/tasks?proposalId=${proposal.id}&proposalNumber=${proposal.proposalNumber}&title=${encodeURIComponent(proposal.title || '')}`)}>
                              <ClipboardList className="w-4 h-4 mr-2 text-purple-600" />
                              Criar Tarefa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(proposal)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewProposalDialog
        open={showNewDialog}
        onOpenChange={(open) => {
          setShowNewDialog(open);
          if (!open) setEditingProposal(null);
        }}
        onProposalCreated={loadProposals}
        initialData={editingProposal}
      />

      <ClientDetailViewer
        open={isClientViewerOpen}
        onOpenChange={setIsClientViewerOpen}
        client={viewingClient}
      />

      {/* Dialog de Revisões — Redesenhado */}
      <Dialog open={revisionDialogOpen} onOpenChange={(open) => {
        setRevisionDialogOpen(open);
        if (!open) {
          setConfirmRestoreId(null);
          setPreviewRevision(null);
        }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">Histórico de Revisões</DialogTitle>
                <DialogDescription>
                  {revisionProposal?.proposalNumber} — {revisionProposal?.title}
                  <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-300 text-xs">
                    Versão atual: Rev. {revisionProposal?.revisionNumber || 1}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-2">
            {loadingRevisions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-3" />
                <span className="text-slate-500">Carregando histórico...</span>
              </div>
            ) : revisions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-500">Nenhuma revisão anterior</p>
                <p className="text-sm mt-1">Ao editar esta proposta, a versão atual será salva automaticamente como revisão.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Versão atual (topo) */}
                <div className="border-2 border-amber-200 bg-amber-50/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                      <Badge className="bg-amber-500 text-white border-0 text-xs font-semibold">
                        VERSÃO ATUAL — Rev. {revisionProposal?.revisionNumber || 1}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={() => {
                          handleDownloadPDF(revisionProposal);
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          setRevisionDialogOpen(false);
                          setEditingProposal(revisionProposal);
                          setShowNewDialog(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{revisionProposal?.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Valor: R$ {Number(revisionProposal?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {' · '}
                    {revisionProposal?.items?.length || 0} item(ns)
                  </p>
                </div>

                {/* Timeline de revisões */}
                <div className="relative pl-6">
                  {/* Linha vertical da timeline */}
                  <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-slate-200" />

                  {revisions.map((rev: any) => {
                    let snapshot: any = null;
                    try { snapshot = JSON.parse(rev.snapshotData); } catch { }
                    const isExpanded = previewRevision?.id === rev.id;
                    const isConfirming = confirmRestoreId === rev.id;
                    const isRestoring = restoringId === rev.id;

                    return (
                      <div key={rev.id} className="relative mb-4">
                        {/* Bolinha da timeline */}
                        <div className={`absolute -left-6 top-4 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                          ${isExpanded
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-white border-slate-300 text-slate-400'
                          }`}
                        >
                          {rev.revisionNumber}
                        </div>

                        <div className={`border rounded-xl p-4 transition-all duration-200 ${isExpanded ? 'border-amber-300 bg-amber-50/30 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                          {/* Header da revisão */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-700">Rev. {rev.revisionNumber}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(rev.createdAt).toLocaleString('pt-BR')}
                              </span>
                              {rev.changeDescription && (
                                <span className="text-xs text-blue-500 italic">{rev.changeDescription}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`text-xs gap-1 ${isExpanded ? 'text-amber-600' : 'text-slate-500 hover:text-amber-600'}`}
                                onClick={() => setPreviewRevision(isExpanded ? null : { ...rev, snapshot })}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {isExpanded ? 'Ocultar' : 'Visualizar'}
                              </Button>
                              {snapshot && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs gap-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                  title="Baixar PDF desta revisão"
                                  onClick={() => {
                                    const fakeProposal = {
                                      ...revisionProposal,
                                      ...snapshot,
                                      proposalNumber: `${revisionProposal?.proposalNumber}_rev${rev.revisionNumber}`,
                                    };
                                    handleDownloadPDF(fakeProposal);
                                  }}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  PDF
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs gap-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteRevision(rev.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Resumo sempre visível */}
                          {snapshot && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span>{snapshot.title}</span>
                              <span>·</span>
                              <span className="font-medium">R$ {Number(snapshot.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span>·</span>
                              <span>{snapshot.items?.length || 0} item(ns)</span>
                            </div>
                          )}

                          {/* Preview expandido */}
                          {isExpanded && snapshot && (
                            <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                              {/* Dados da proposta */}
                              <div className="bg-white rounded-lg border border-slate-100 p-4 space-y-2">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Dados da Proposta</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><span className="font-medium text-slate-600">Título:</span> <span className="text-slate-800">{snapshot.title || '—'}</span></div>
                                  <div><span className="font-medium text-slate-600">Status:</span> <span className="text-slate-800">{snapshot.status || '—'}</span></div>
                                  <div><span className="font-medium text-slate-600">Subtotal:</span> <span className="text-slate-800">R$ {Number(snapshot.subtotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                                  <div><span className="font-medium text-slate-600">Desconto:</span> <span className="text-slate-800">R$ {Number(snapshot.discount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                                  <div className="col-span-2"><span className="font-medium text-slate-600">Total:</span> <span className="text-lg font-bold text-green-600">R$ {Number(snapshot.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                                  {snapshot.scope && <div className="col-span-2"><span className="font-medium text-slate-600">Escopo:</span> <span className="text-slate-800">{snapshot.scope}</span></div>}
                                  {snapshot.paymentConditions && <div className="col-span-2"><span className="font-medium text-slate-600">Condições:</span> <span className="text-slate-800">{snapshot.paymentConditions}</span></div>}
                                </div>
                              </div>

                              {/* Itens */}
                              {snapshot.items && snapshot.items.length > 0 && (
                                <div className="bg-white rounded-lg border border-slate-100 p-4">
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Itens ({snapshot.items.length})</h4>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-medium text-slate-400 pb-2">Descrição</th>
                                        <th className="text-right text-xs font-medium text-slate-400 pb-2">Qtd</th>
                                        <th className="text-right text-xs font-medium text-slate-400 pb-2">Unit.</th>
                                        <th className="text-right text-xs font-medium text-slate-400 pb-2">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {snapshot.items.map((item: any, i: number) => (
                                        <tr key={i} className="border-b border-slate-50 last:border-0">
                                          <td className="py-2 text-slate-700">{item.description}</td>
                                          <td className="py-2 text-right text-slate-600">{item.quantity || 1}</td>
                                          <td className="py-2 text-right text-slate-600">R$ {Number(item.unitPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                          <td className="py-2 text-right font-medium text-slate-800">R$ {Number(item.total || (item.unitPrice * item.quantity) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Botão restaurar */}
                              <div className="bg-white rounded-lg border border-slate-100 p-4">
                                {!isConfirming ? (
                                  <Button
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium gap-2"
                                    onClick={() => setConfirmRestoreId(rev.id)}
                                    disabled={!!restoringId}
                                  >
                                    <History className="w-4 h-4" />
                                    Restaurar esta versão
                                  </Button>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                                      <p className="font-medium">⚠️ Confirmar restauração</p>
                                      <p className="mt-1 text-xs">A versão atual (Rev. {revisionProposal?.revisionNumber}) será salva no histórico e esta proposta voltará ao estado da Rev. {rev.revisionNumber}.</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setConfirmRestoreId(null)}
                                        disabled={isRestoring}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-2"
                                        onClick={() => handleRestoreRevision(rev.id)}
                                        disabled={isRestoring}
                                      >
                                        {isRestoring ? (
                                          <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Restaurando...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Sim, restaurar
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden container for PDF generation */}
      <div className="fixed -left-[9999px] top-0">
        {proposalToPrint && (
          proposalToPrint.activityType === 'energia_solar' && solarProjectData
            ? <SolarProposalPDFTemplate proposal={proposalToPrint} solarProject={solarProjectData} company={companyData} />
            : <ProposalPDFTemplate proposal={proposalToPrint} client={proposalToPrint.client || proposalToPrint.opportunity?.client} company={companyData} />
        )}
      </div>
    </div>
  );
}
