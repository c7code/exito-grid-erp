import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import NewProposalDialog from '@/components/NewProposalDialog';
import { ProposalPDFTemplate } from '@/components/ProposalPDFTemplate';
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
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any>(null);
  const [isClientViewerOpen, setIsClientViewerOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [proposalToPrint, setProposalToPrint] = useState<any>(null);

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
  const handleDownloadPDF = async (proposal: any) => {
    setProposalToPrint(proposal);
    toast.info('Gerando PDF profissional...');

    // Pequeno delay para garantir que o template seja renderizado
    setTimeout(() => {
      const element = document.getElementById('proposal-pdf-content');
      if (!element) {
        toast.error('Erro ao gerar PDF: Elemento não encontrado.');
        return;
      }

      const opt = {
        margin: 0,
        filename: `proposta_${proposal.proposalNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().from(element).set(opt).save().then(() => {
        setProposalToPrint(null);
        toast.success('PDF gerado com sucesso!');
      }).catch((err: any) => {
        console.error('PDF Error:', err);
        toast.error('Erro ao gerar PDF.');
      });
    }, 500);
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
                  <TableHead>Status</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Valor</TableHead>
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

      {/* Hidden container for PDF generation */}
      <div className="fixed -left-[9999px] top-0">
        {proposalToPrint && (
          <ProposalPDFTemplate proposal={proposalToPrint} client={proposalToPrint.client || proposalToPrint.opportunity?.client} />
        )}
      </div>
    </div>
  );
}
