import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  DollarSign,
  Calendar,
  Download,
  Printer,
  X,
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';
import { ProposalPDFTemplate } from '@/components/ProposalPDFTemplate';
import { OeMProposalPDFTemplate } from '@/components/OeMProposalPDFTemplate';
import html2pdf from 'html2pdf.js';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: any; color: string }> = {
  draft: { label: 'Rascunho', variant: 'outline', icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  sent: { label: 'Enviada', variant: 'secondary', icon: Send, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  viewed: { label: 'Visualizada', variant: 'secondary', icon: Eye, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  accepted: { label: 'Aprovada', variant: 'default', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

export default function ClientProposals() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ═══ VISUALIZAÇÃO COMPLETA ═══
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingProposal, setViewingProposal] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const loadProposals = async () => {
      try {
        // Try to load from portal publications first (admin-published)
        const pubData = await api.getClientMyPublications('proposal');
        if (Array.isArray(pubData) && pubData.length > 0) {
          // Use enriched data from publications
          const enriched = pubData
            .filter((p: any) => p.content)
            .map((p: any) => ({ ...p.content, publicationTitle: p.title, publishedAt: p.publishedAt }));
          setProposals(enriched);
        } else {
          // Fallback to direct proposals query
          const data = await api.getClientMyProposals();
          setProposals(data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar propostas:', err);
        // Fallback
        try {
          const data = await api.getClientMyProposals();
          setProposals(data || []);
        } catch { /* empty */ }
      } finally {
        setIsLoading(false);
      }
    };
    loadProposals();
  }, []);

  const pendingCount = proposals.filter(p => p.status === 'sent' || p.status === 'viewed').length;
  const totalValue = proposals
    .filter(p => p.status === 'accepted')
    .reduce((acc, p) => acc + Number(p.total || 0), 0);

  // ═══ VER PROPOSTA COMPLETA ═══
  const handleViewProposal = (proposal: any) => {
    setViewingProposal(proposal);
    setViewDialogOpen(true);
  };

  // ═══ DOWNLOAD PDF ═══
  const handleDownloadPDF = async () => {
    if (!viewingProposal) return;
    setIsGeneratingPDF(true);
    toast.info('Gerando PDF...');

    setTimeout(() => {
      const element = document.getElementById('client-proposal-pdf-content');
      if (!element) {
        toast.error('Erro ao gerar PDF: Elemento não encontrado.');
        setIsGeneratingPDF(false);
        return;
      }

      const opt = {
        margin: [0, 0, 38, 0] as [number, number, number, number],
        filename: `proposta_${viewingProposal.proposalNumber || 'documento'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 3, dpi: 192, useCORS: true, letterRendering: true, width: 794, windowWidth: 794 },
        jsPDF: { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.next-page', avoid: ['tr', '.sig-block', '.pdf-keep-together', '.pdf-section-title', '.avoid-page-break'] },
      };

      html2pdf().from(element).set(opt).save().then(() => {
        setIsGeneratingPDF(false);
        toast.success('PDF gerado com sucesso!');
      }).catch((err: any) => {
        console.error('PDF Error:', err);
        toast.error('Erro ao gerar PDF.');
        setIsGeneratingPDF(false);
      });
    }, 600);
  };

  // ═══ IMPRIMIR ═══
  const handlePrint = () => {
    if (!viewingProposal) return;

    const element = document.getElementById('client-proposal-pdf-content');
    if (!element) {
      toast.error('Elemento não encontrado para impressão.');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão habilitados.');
      return;
    }

    const htmlContent = element.outerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proposta ${viewingProposal.proposalNumber || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: #fff; }
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { margin: 0.5cm 0 1cm 0; size: A4; }
            .avoid-page-break, .pdf-keep-together, .sig-block { break-inside: avoid; page-break-inside: avoid; }
            tr { break-inside: avoid; }
            .next-page { break-before: page; page-break-before: always; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 400);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ═══ DETERMINE TEMPLATE TYPE ═══
  const isOeM = (proposal: any) => {
    return proposal.activityType === 'plano_oem' || proposal.activityType?.startsWith('manutencao_');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Minhas Propostas</h1>
        <p className="text-slate-500">Acompanhe suas propostas comerciais</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{proposals.length}</p>
              <p className="text-sm text-slate-500">Total de Propostas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-slate-500">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              <p className="text-sm text-slate-500">Valor Aprovado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma proposta disponível</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal: any) => {
            const statusInfo = statusLabels[proposal.status] || statusLabels.sent;
            const StatusIcon = statusInfo.icon;
            const hasItems = Array.isArray(proposal.items) && proposal.items.length > 0;
            return (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-slate-500">{proposal.proposalNumber}</span>
                        <Badge className={`flex items-center gap-1 ${statusInfo.color} border`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{proposal.title || proposal.publicationTitle || 'Proposta Comercial'}</h3>
                      {proposal.scope && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{proposal.scope}</p>
                      )}
                    </div>
                    <div className="text-right ml-4 flex flex-col items-end gap-2">
                      <p className="text-lg font-bold text-emerald-600">
                        R$ {Number(proposal.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {/* ═══ BOTÃO VER PROPOSTA ═══ */}
                      {hasItems && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
                          onClick={() => handleViewProposal(proposal)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Ver Proposta
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">Emitida em</span>
                      </div>
                      <p className="text-sm font-medium">{proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">Validade</span>
                      </div>
                      <p className="text-sm font-medium">{proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    {proposal.deadline && (
                      <div className="p-3 bg-slate-50 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">Prazo</span>
                        </div>
                        <p className="text-sm font-medium">{proposal.deadline}</p>
                      </div>
                    )}
                    {proposal.paymentConditions && (
                      <div className="p-3 bg-slate-50 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="text-xs">Pagamento</span>
                        </div>
                        <p className="text-sm font-medium truncate">{proposal.paymentConditions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ DIALOG DE VISUALIZAÇÃO COMPLETA ═══ */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[900px] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 shrink-0">
            <div>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {viewingProposal?.title || viewingProposal?.proposalNumber || 'Proposta'}
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-slate-500 mt-1">
                {viewingProposal?.proposalNumber} · Modo: {
                  viewingProposal?.itemVisibilityMode === 'detailed' ? 'Detalhado' :
                  viewingProposal?.itemVisibilityMode === 'grouping' ? 'Agrupamento' :
                  viewingProposal?.itemVisibilityMode === 'list_only' ? 'Lista (Sem Valores)' :
                  viewingProposal?.itemVisibilityMode === 'total_only' ? 'Valor Total' :
                  'Detalhado'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
                className="text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Imprimir
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                )}
                Baixar PDF
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setViewDialogOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* PDF Preview Area */}
          <div className="flex-1 overflow-auto bg-slate-100 p-4">
            <div className="mx-auto" style={{ maxWidth: 800 }}>
              {viewingProposal && (
                <div id="client-proposal-pdf-content">
                  {isOeM(viewingProposal) ? (
                    <OeMProposalPDFTemplate
                      proposal={viewingProposal}
                      company={viewingProposal.company}
                    />
                  ) : (
                    <ProposalPDFTemplate
                      proposal={viewingProposal}
                      company={viewingProposal.company}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
