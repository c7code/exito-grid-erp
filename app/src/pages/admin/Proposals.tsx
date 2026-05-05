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
  EyeOff,
  History,
  Receipt,
  Package,
  Wrench,
  ClipboardList,
  RotateCcw,
  RefreshCw,
  HardHat,
  Upload,
  Globe,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import NewProposalDialog from '@/components/NewProposalDialog';
import { ProposalPDFTemplate } from '@/components/ProposalPDFTemplate';
import { SolarProposalPDFTemplate } from '@/components/SolarProposalPDFTemplate';
import { OeMProposalPDFTemplate } from '@/components/OeMProposalPDFTemplate';
import { RentalProposalPDFTemplate } from '@/components/RentalProposalPDFTemplate';
import { SignatureSelector } from '@/components/SignatureSelector';
import ProposalAttachments from '@/components/ProposalAttachments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import html2pdf from 'html2pdf.js';
import { Download, MessageCircle, Mail, ExternalLink, Copy, Link2 } from 'lucide-react';

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

  // Preview & visibility toggle
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewProposalData, setPreviewProposalData] = useState<any>(null);
  const [hideFinancialValues, setHideFinancialValues] = useState(false);
  const [resolvedSignatures, setResolvedSignatures] = useState<any>(null);

  // Signature link state
  const [signatureLinkDialogOpen, setSignatureLinkDialogOpen] = useState(false);
  const [signatureLink, setSignatureLink] = useState('');

  // Portal publication tracking
  const [publishedProposalIds, setPublishedProposalIds] = useState<Set<string>>(new Set());

  // Gerar Financeiro from Proposal
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);
  const [financeProposal, setFinanceProposal] = useState<any>(null);
  const [financeConfig, setFinanceConfig] = useState({ count: 2, intervalDays: 30, mode: 'equal' as 'equal' | 'custom', description: '' });
  const [financeCustomInst, setFinanceCustomInst] = useState<Array<{ percentage: string; dueDate: string; description: string }>>([]);
  const [financeLoading, setFinanceLoading] = useState(false);

  const handleCreateFinanceFromProposal = async () => {
    if (!financeProposal) return;
    setFinanceLoading(true);
    try {
      let installments: Array<{ percentage: number; dueDate: string; description?: string }> = [];
      if (financeConfig.mode === 'equal') {
        const pct = parseFloat((100 / financeConfig.count).toFixed(2));
        for (let i = 0; i < financeConfig.count; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i * financeConfig.intervalDays);
          installments.push({ percentage: i === financeConfig.count - 1 ? (100 - pct * (financeConfig.count - 1)) : pct, dueDate: d.toISOString().split('T')[0], description: `Parcela ${i + 1}/${financeConfig.count}` });
        }
      } else {
        installments = financeCustomInst.map((c, i) => ({ percentage: Number(c.percentage), dueDate: c.dueDate, description: c.description || `Parcela ${i + 1}/${financeCustomInst.length}` }));
      }
      await api.createPaymentFromProposal({
        proposalId: financeProposal.id,
        proposalNumber: financeProposal.proposalNumber,
        clientId: financeProposal.clientId || financeProposal.client?.id || '',
        description: financeConfig.description || financeProposal.title || `Proposta ${financeProposal.proposalNumber}`,
        totalAmount: Number(financeProposal.total || 0),
        installments,
      });
      toast.success(`Lançamento financeiro criado com ${installments.length} parcela(s)!`);
      setFinanceDialogOpen(false);
    } catch { toast.error('Erro ao gerar lançamento financeiro'); }
    setFinanceLoading(false);
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const data = await api.getProposals();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setProposals(list);

      // Load published IDs
      try {
        const pubIds = await api.getPortalPublishedIds('proposal');
        setPublishedProposalIds(new Set(Array.isArray(pubIds) ? pubIds : []));
      } catch { /* non-critical */ }
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
      toast.success('Proposta aprovada! Uma obra foi criada automaticamente.');
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

  const handleRevertAcceptance = async (proposal: any) => {
    if (!confirm('Reverter aprovação desta proposta? O status voltará para "Enviada".')) return;
    try {
      await api.revertProposalAcceptance(proposal.id);
      toast.success('Aprovação revertida! Proposta voltou para status "Enviada".');
      loadProposals();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao reverter aprovação.');
    }
  };

  const handleGoToWork = async (proposal: any) => {
    try {
      // Buscar obras do cliente ou por oportunidade vinculada
      const works = await api.getWorks();
      const worksList = Array.isArray(works) ? works : [];
      // Procurar obra vinculada por clientId + título parecido
      const linkedWork = worksList.find((w: any) =>
        (w.clientId && w.clientId === (proposal.clientId || proposal.client?.id)) &&
        (w.title?.includes(proposal.proposalNumber) || w.title?.includes(proposal.title) || w.description?.includes(proposal.proposalNumber))
      ) || worksList.find((w: any) =>
        w.clientId && w.clientId === (proposal.clientId || proposal.client?.id)
        && new Date(w.createdAt).getTime() >= new Date(proposal.acceptedAt || proposal.updatedAt).getTime() - 60000
      );

      if (linkedWork) {
        navigate(`/admin/works/${linkedWork.id}`);
      } else {
        toast.info('Obra não encontrada. Redirecionando para a lista de obras...');
        navigate('/admin/works');
      }
    } catch {
      navigate('/admin/works');
    }
  };

  // ═══ PORTAL PUBLICATION ═══
  const handlePublishToPortal = async (proposal: any) => {
    const clientName = proposal.client?.name || 'cliente';
    const clientId = proposal.clientId || proposal.client?.id;
    if (!clientId) {
      toast.error('Esta proposta não tem cliente vinculado. Vincule um cliente primeiro.');
      return;
    }
    const isPublished = publishedProposalIds.has(proposal.id);
    if (isPublished) {
      // Unpublish
      if (!confirm(`Remover proposta "${proposal.proposalNumber}" do portal de ${clientName}?`)) return;
      try {
        const pubs = await api.getPortalPublications(clientId);
        const pub = (Array.isArray(pubs) ? pubs : []).find((p: any) => p.contentType === 'proposal' && p.contentId === proposal.id);
        if (pub) {
          await api.removePortalPublication(pub.id);
        }
        setPublishedProposalIds(prev => { const n = new Set(prev); n.delete(proposal.id); return n; });
        toast.success('Proposta removida do portal do cliente.');
      } catch {
        toast.error('Erro ao remover do portal.');
      }
    } else {
      // Publish
      if (!confirm(`Publicar proposta "${proposal.proposalNumber}" no portal de ${clientName}?`)) return;
      try {
        await api.publishToPortal({
          clientId,
          contentType: 'proposal',
          contentId: proposal.id,
          title: proposal.title || proposal.proposalNumber,
          description: `Proposta ${proposal.proposalNumber} - R$ ${Number(proposal.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        });
        setPublishedProposalIds(prev => new Set(prev).add(proposal.id));
        toast.success(`Proposta publicada no portal de ${clientName}!`);
      } catch {
        toast.error('Erro ao publicar no portal.');
      }
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

  // ═══ UTILITY: Clean scanned signature images via Canvas ═══
  // html2canvas does NOT support mix-blend-mode, so we process at pixel level
  const cleanSignatureImage = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!imageUrl || !imageUrl.startsWith('data:')) {
        resolve(imageUrl);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(imageUrl); return; }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Threshold: pixels lighter than this become transparent (removes gray/white bg)
        const bgThreshold = 180;
        // Ink darkening: darken remaining pixels for crisp signature
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const brightness = (r + g + b) / 3;

          if (brightness > bgThreshold) {
            // Light pixel → make transparent
            data[i + 3] = 0;
          } else {
            // Dark pixel (actual ink) → darken for crisp look
            const factor = Math.max(0, brightness / bgThreshold);
            // Fade near-threshold pixels
            data[i + 3] = Math.round(255 * (1 - factor * factor));
            // Push toward pure black for crispness
            const darken = 0.6;
            data[i] = Math.round(r * darken);
            data[i + 1] = Math.round(g * darken);
            data[i + 2] = Math.round(b * darken);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };

  // Helper: process all signature imageUrls through canvas cleanup
  const cleanSignatures = async (sigs: Record<string, any>): Promise<Record<string, any>> => {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(sigs)) {
      if (val?.imageUrl) {
        cleaned[key] = { ...val, imageUrl: await cleanSignatureImage(val.imageUrl) };
      } else {
        cleaned[key] = val;
      }
    }
    return cleaned;
  };

  const handlePreviewProposal = async (proposal: any) => {
    try {
      let freshProposal = await api.getProposal(proposal.id);

      // ═══ BUSCAR DOCUMENTOS EXTERNOS vinculados à proposta ═══
      try {
        const allDocs = await api.getDocuments({ proposalId: freshProposal.id });
        const externalDocs = (Array.isArray(allDocs) ? allDocs : [])
          .filter((d: any) => d.purpose === 'proposal_external');
        if (!freshProposal.documents || freshProposal.documents.length === 0) {
          freshProposal = { ...freshProposal, documents: externalDocs };
        } else {
          freshProposal = {
            ...freshProposal,
            documents: [
              ...freshProposal.documents.filter((d: any) => d.purpose === 'proposal_external'),
              ...externalDocs.filter((d: any) => !freshProposal.documents.find((x: any) => x.id === d.id)),
            ],
          };
        }
      } catch { /* silencioso */ }

      let coData = null;
      try { coData = await api.getPrimaryCompany(); } catch {}

      // If solar proposal, load solar project data for preview
      if (freshProposal.activityType === 'energia_solar') {
        try {
          const sData = await api.getSolarProjectByProposal(freshProposal.id);
          setSolarProjectData(sData);
          // Use solar project's company if available
          if (sData?.companyId) {
            try { coData = await api.getCompany(sData.companyId); } catch {}
          }
        } catch (err) {
          console.warn('Could not load solar project for preview:', err);
        }
      }

      setPreviewProposalData(freshProposal);
      setCompanyData(coData);
      // Resolve signatures — try API first, fallback to client-side resolution
      try {
        const sigs = await api.resolveSignatures('proposal', proposal.id, ['contratada', 'contratante']);
        if (sigs && Object.keys(sigs).some(k => sigs[k]?.imageUrl)) {
          setResolvedSignatures(await cleanSignatures(sigs));
        } else {
          throw new Error('No resolved signatures with images');
        }
      } catch {
        // Fallback: load all slots and find defaults by scope
        try {
          const allSlots = await api.getSignatureSlots();
          const slots = Array.isArray(allSlots) ? allSlots : [];
          const scopeMap: Record<string, string> = { contratada: 'company', contratante: 'client', testemunha: 'witness' };
          const fallback: Record<string, any> = {};
          for (const [pos, scope] of Object.entries(scopeMap)) {
            const defaultSlot = slots.find((s: any) => s.scope === scope && s.isDefault);
            if (defaultSlot) {
              fallback[pos] = {
                imageUrl: defaultSlot.imageUrl,
                signerName: defaultSlot.signerName,
                signerRole: defaultSlot.signerRole,
                signerDocument: defaultSlot.signerDocument,
              };
            }
          }
          setResolvedSignatures(Object.keys(fallback).length > 0 ? await cleanSignatures(fallback) : null);
        } catch { setResolvedSignatures(null); }
      }
      setPreviewDialogOpen(true);
    } catch (err) {
      console.warn('Preview failed, using local data:', err);
      setPreviewProposalData(proposal);
      setPreviewDialogOpen(true);
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

    // ═══ BUSCAR DOCUMENTOS EXTERNOS vinculados à proposta ═══
    try {
      const allDocs = await api.getDocuments({ proposalId: freshProposal.id });
      const externalDocs = (Array.isArray(allDocs) ? allDocs : [])
        .filter((d: any) => d.purpose === 'proposal_external');
      // Injetar no objeto da proposta para o template PDF renderizar
      if (!freshProposal.documents || freshProposal.documents.length === 0) {
        freshProposal = { ...freshProposal, documents: externalDocs };
      } else {
        // Mesclar com qualquer doc já retornado pelo backend
        freshProposal = {
          ...freshProposal,
          documents: [
            ...freshProposal.documents.filter((d: any) => d.purpose === 'proposal_external'),
            ...externalDocs.filter((d: any) => !freshProposal.documents.find((x: any) => x.id === d.id)),
          ],
        };
      }
    } catch (err) {
      console.warn('Could not fetch proposal documents:', err);
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
    }

    // Load company data for all proposal types (not just solar)
    if (!coData) {
      try {
        coData = await api.getPrimaryCompany();
        setCompanyData(coData);
      } catch (err) {
        console.warn('Could not load primary company:', err);
      }
    }

    // ═══ RESOLVE SIGNATURES for PDF — with canvas cleanup ═══
    try {
      const sigs = await api.resolveSignatures('proposal', freshProposal.id, ['contratada', 'contratante']);
      if (sigs && Object.keys(sigs).some(k => sigs[k]?.imageUrl)) {
        setResolvedSignatures(await cleanSignatures(sigs));
      } else {
        throw new Error('No resolved signatures with images');
      }
    } catch {
      // Fallback: load all slots and find defaults by scope
      try {
        const allSlots = await api.getSignatureSlots();
        const slots = Array.isArray(allSlots) ? allSlots : [];
        const scopeMap: Record<string, string> = { contratada: 'company', contratante: 'client', testemunha: 'witness' };
        const fallback: Record<string, any> = {};
        for (const [pos, scope] of Object.entries(scopeMap)) {
          const defaultSlot = slots.find((s: any) => s.scope === scope && s.isDefault);
          if (defaultSlot) {
            fallback[pos] = {
              imageUrl: defaultSlot.imageUrl,
              signerName: defaultSlot.signerName,
              signerRole: defaultSlot.signerRole,
              signerDocument: defaultSlot.signerDocument,
            };
          }
        }
        setResolvedSignatures(Object.keys(fallback).length > 0 ? await cleanSignatures(fallback) : null);
      } catch { setResolvedSignatures(null); }
    }

    setProposalToPrint(freshProposal);

    // Delay to ensure the template renders
    const isSolar = freshProposal.activityType === 'energia_solar' && solarData;
    const isRental = freshProposal.activityType === 'locacao_equipamento';
    const pdfElementId = isSolar ? 'solar-proposal-pdf-content' : isRental ? 'rental-proposal-pdf-content' : 'proposal-pdf-content';

    const tryCapturePDF = (attempt = 0) => {
      const element = document.getElementById(pdfElementId);
      if (!element) {
        if (attempt < 3) {
          setTimeout(() => tryCapturePDF(attempt + 1), 500);
          return;
        }
        toast.error('Erro ao gerar PDF: Elemento não encontrado.');
        setProposalToPrint(null);
        return;
      }

      const opt = {
        margin: isSolar ? 0 : [0, 0, 38, 0] as [number, number, number, number],
        filename: isSolar
          ? `proposta_solar_${proposal.proposalNumber}.pdf`
          : `proposta_${proposal.proposalNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 3, dpi: 192, useCORS: true, letterRendering: true, width: 794, windowWidth: 794 },
        jsPDF: { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] },
        ...(isSolar ? {} : {
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.next-page', avoid: ['tr', '.sig-block', '.pdf-keep-together', '.pdf-section-title', '.avoid-page-break'] },
        }),
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
    };

    setTimeout(() => tryCapturePDF(), 1200);
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

  const handleGenerateSignatureLink = async (proposal: any) => {
    try {
      const result = await api.generateSignatureLink(proposal.id);
      const fullUrl = `${window.location.origin}${result.url}`;
      setSignatureLink(fullUrl);
      setSignatureLinkDialogOpen(true);
      toast.success('Link de assinatura gerado com sucesso!');
    } catch {
      toast.error('Erro ao gerar link de assinatura');
    }
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
            <div className="overflow-x-auto">
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
                  <TableHead className="w-[160px] sticky right-0 bg-white z-10" style={{ boxShadow: '-4px 0 8px -2px rgba(0,0,0,0.06)' }}></TableHead>
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
                        {publishedProposalIds.has(proposal.id) && (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 text-[10px] font-medium mt-1 flex items-center gap-1 w-fit">
                            <Globe className="w-2.5 h-2.5" />
                            Portal
                          </Badge>
                        )}
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
                      <TableCell className="sticky right-0 bg-white z-10" style={{ boxShadow: '-4px 0 8px -2px rgba(0,0,0,0.06)' }}>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-400 hover:text-amber-600 hover:bg-amber-50"
                            title="Editar"
                            onClick={async () => {
                              if (proposal.activityType === 'plano_oem' || proposal.activityType?.startsWith('manutencao_')) {
                                try {
                                  const servico = await api.findOemServicoByProposal(proposal.id);
                                  if (servico?.id) {
                                    navigate(`/admin/oem?tab=servicos&editServiceId=${servico.id}`);
                                    return;
                                  }
                                } catch { /* fallback */ }
                              }
                              setEditingProposal(proposal);
                              setShowNewDialog(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Pré-visualizar"
                            onClick={() => handlePreviewProposal(proposal)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Baixar PDF"
                            onClick={() => handleDownloadPDF(proposal)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Editar movido para botão direto na coluna */}
                              <DropdownMenuItem onClick={() => handleViewRevisions(proposal)}>
                                <History className="w-4 h-4 mr-2" />
                                Ver Revisões
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                try {
                                  toast.info('Recalculando totais...');
                                  await api.recalculateProposal(proposal.id);
                                  toast.success('Totais recalculados com sucesso!');
                                  loadProposals();
                                } catch {
                                  toast.error('Erro ao recalcular totais.');
                                }
                              }}>
                                <RefreshCw className="w-4 h-4 mr-2 text-cyan-600" />
                                Recalcular Totais
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handlePreviewProposal(proposal)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Pré-visualizar
                              </DropdownMenuItem>
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
                              <DropdownMenuItem onClick={() => handleGenerateSignatureLink(proposal)}>
                                <Link2 className="w-4 h-4 mr-2 text-emerald-600" />
                                Enviar para Assinatura
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
                              {proposal.status === 'accepted' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleGoToWork(proposal)}>
                                    <HardHat className="w-4 h-4 mr-2 text-emerald-600" />
                                    Ver Obra
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRevertAcceptance(proposal)}>
                                    <RotateCcw className="w-4 h-4 mr-2 text-amber-600" />
                                    Reverter Aprovação
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              {/* ═══ PORTAL ═══ */}
                              {(proposal.clientId || proposal.client?.id) && (
                                <DropdownMenuItem onClick={() => handlePublishToPortal(proposal)}>
                                  {publishedProposalIds.has(proposal.id) ? (
                                    <><Globe className="w-4 h-4 mr-2 text-emerald-600" /> Remover do Portal</>
                                  ) : (
                                    <><Upload className="w-4 h-4 mr-2 text-indigo-600" /> Publicar no Portal</>
                                  )}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {/* ═══ ATALHOS FINANCEIROS ═══ */}
                              <DropdownMenuItem onClick={() => {
                                setFinanceProposal(proposal);
                                setFinanceConfig({ count: 2, intervalDays: 30, mode: 'equal' as 'equal' | 'custom', description: proposal.title || `Proposta ${proposal.proposalNumber}` });
                                setFinanceCustomInst([]);
                                setFinanceDialogOpen(true);
                              }}>
                                <Banknote className="w-4 h-4 mr-2 text-emerald-600" />
                                Gerar Financeiro
                              </DropdownMenuItem>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
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

      {/* ═══ PREVIEW DIALOG ═══ */}
      <Dialog open={previewDialogOpen} onOpenChange={(open) => {
        setPreviewDialogOpen(open);
        if (!open) setPreviewProposalData(null);
      }}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b bg-slate-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Pré-visualização da Proposta</DialogTitle>
                  <DialogDescription>
                    {previewProposalData?.proposalNumber} — {previewProposalData?.title}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle de visibilidade de valores */}
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs gap-1.5 transition-all ${
                    hideFinancialValues
                      ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  onClick={() => setHideFinancialValues(!hideFinancialValues)}
                >
                  {hideFinancialValues ? (
                    <><EyeOff className="w-3.5 h-3.5" /> Valores Ocultos</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5" /> Valores Visíveis</>
                  )}
                </Button>
                <Button
                  size="sm"
                  className="text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => {
                    if (previewProposalData) {
                      handleDownloadPDF(previewProposalData);
                    }
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-200/60 p-6">
            {/* Signature Selector */}
            {previewProposalData && (
              <>
              <div className="mx-auto mb-4" style={{ maxWidth: 794 }}>
                <SignatureSelector
                  documentType="proposal"
                  documentId={previewProposalData.id}
                  slots={[
                    { position: 'contratada', label: 'CONTRATADA (Empresa)' },
                    { position: 'contratante', label: 'CONTRATANTE (Cliente)' },
                  ]}
                  onSignaturesLoaded={setResolvedSignatures}
                  compact
                />
              </div>
              {/* ═══ ANEXOS DA PROPOSTA ═══ */}
              {previewProposalData.id && (
                <div className="mx-auto mb-4" style={{ maxWidth: 794 }}>
                  <ProposalAttachments proposalId={previewProposalData.id} />
                </div>
              )}
              </>
            )}
            <div className="mx-auto shadow-xl rounded-lg overflow-hidden" style={{ maxWidth: 794 }}>
              {previewProposalData && (
                previewProposalData.activityType === 'energia_solar'
                  ? <SolarProposalPDFTemplate proposal={previewProposalData} solarProject={solarProjectData || {}} company={companyData} />
                  : previewProposalData.activityType === 'plano_oem'
                    ? <OeMProposalPDFTemplate proposal={previewProposalData} company={companyData} signatures={resolvedSignatures} />
                    : previewProposalData.activityType === 'locacao_equipamento'
                      ? <RentalProposalPDFTemplate proposal={previewProposalData} company={companyData} signatures={resolvedSignatures} />
                      : <ProposalPDFTemplate
                          proposal={previewProposalData}
                          client={previewProposalData.client || previewProposalData.opportunity?.client}
                          company={companyData}
                          hideFinancialValues={hideFinancialValues}
                          signatures={resolvedSignatures}
                        />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden container for PDF generation */}
      <div className="fixed -left-[9999px] top-0">
        {proposalToPrint && (
          proposalToPrint.activityType === 'energia_solar'
            ? <SolarProposalPDFTemplate proposal={proposalToPrint} solarProject={solarProjectData || {}} company={companyData} />
            : proposalToPrint.activityType === 'plano_oem'
              ? <OeMProposalPDFTemplate proposal={proposalToPrint} company={companyData} signatures={resolvedSignatures} />
              : proposalToPrint.activityType === 'locacao_equipamento'
                ? <RentalProposalPDFTemplate proposal={proposalToPrint} company={companyData} signatures={resolvedSignatures} />
                : <ProposalPDFTemplate proposal={proposalToPrint} client={proposalToPrint.client || proposalToPrint.opportunity?.client} company={companyData} hideFinancialValues={hideFinancialValues} signatures={resolvedSignatures} />
        )}
      </div>

      {/* ═══ Signature Link Dialog ═══ */}
      <Dialog open={signatureLinkDialogOpen} onOpenChange={setSignatureLinkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-600" />
              Link de Assinatura Digital
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie o link abaixo para o cliente assinar a proposta digitalmente.
              O cliente poderá <strong>desenhar</strong>, <strong>digitar</strong> ou <strong>fazer upload</strong> da assinatura.
            </p>
            <div className="flex gap-2">
              <Input readOnly value={signatureLink} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(signatureLink); toast.success('Link copiado!'); }}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => window.open(signatureLink, '_blank')}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                const msg = `Olá! Segue o link para assinatura digital da proposta:\n\n${signatureLink}\n\nBasta clicar, revisar o documento e assinar digitalmente.`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
              }}>
                <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                window.open(`mailto:?subject=Assinatura Digital - Proposta&body=${encodeURIComponent(`Segue o link para assinatura digital:\n\n${signatureLink}`)}`, '_blank');
              }}>
                <Mail className="w-4 h-4 mr-1" /> Email
              </Button>
            </div>
            <div className="text-[10px] text-muted-foreground text-center">
              🔒 O link expira em 30 dias. IP, data/hora e navegador serão registrados para validade jurídica.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ GERAR FINANCEIRO DIALOG ═══ */}
      <Dialog open={financeDialogOpen} onOpenChange={setFinanceDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" /> Gerar Financeiro — {financeProposal?.proposalNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-800">Valor total: <strong>R$ {financeProposal ? Number(financeProposal.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</strong></p>
              <p className="text-xs text-emerald-600 mt-1">{financeProposal?.title}</p>
            </div>
            <div className="space-y-2">
              <Label>Descrição do Lançamento</Label>
              <Input value={financeConfig.description} onChange={e => setFinanceConfig({ ...financeConfig, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Modo</Label>
                <Select value={financeConfig.mode} onValueChange={v => setFinanceConfig({ ...financeConfig, mode: v as 'equal' | 'custom' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Parcelas Iguais</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {financeConfig.mode === 'equal' && (
                <>
                  <div className="space-y-2">
                    <Label>Nº Parcelas</Label>
                    <Input type="number" min={1} max={24} value={financeConfig.count} onChange={e => setFinanceConfig({ ...financeConfig, count: Number(e.target.value) || 1 })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Intervalo entre parcelas (dias)</Label>
                    <Input type="number" min={1} value={financeConfig.intervalDays} onChange={e => setFinanceConfig({ ...financeConfig, intervalDays: Number(e.target.value) || 30 })} />
                  </div>
                </>
              )}
              {financeConfig.mode === 'custom' && (
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Parcelas</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => setFinanceCustomInst([...financeCustomInst, { percentage: '0', dueDate: new Date().toISOString().split('T')[0], description: '' }])}>+ Parcela</Button>
                  </div>
                  {financeCustomInst.map((ci, idx) => (
                    <div key={idx} className="grid grid-cols-[60px_1fr_1fr_32px] gap-2 items-end">
                      <div><Label className="text-[10px]">%</Label><Input className="h-8 text-sm" type="text" inputMode="decimal" value={ci.percentage} onChange={e => { const n = [...financeCustomInst]; n[idx].percentage = e.target.value; setFinanceCustomInst(n); }} /></div>
                      <div><Label className="text-[10px]">Vencimento</Label><Input className="h-8 text-sm" type="date" value={ci.dueDate} onChange={e => { const n = [...financeCustomInst]; n[idx].dueDate = e.target.value; setFinanceCustomInst(n); }} /></div>
                      <div><Label className="text-[10px]">Descrição</Label><Input className="h-8 text-sm" value={ci.description} onChange={e => { const n = [...financeCustomInst]; n[idx].description = e.target.value; setFinanceCustomInst(n); }} placeholder={`Parcela ${idx + 1}`} /></div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500" onClick={() => setFinanceCustomInst(financeCustomInst.filter((_, i) => i !== idx))}>✕</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Preview */}
            {financeConfig.mode === 'equal' && financeProposal && (
              <div className="bg-slate-50 rounded-lg border p-3 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Prévia</p>
                {Array.from({ length: financeConfig.count }, (_, i) => {
                  const pct = parseFloat((100 / financeConfig.count).toFixed(2));
                  const finalPct = i === financeConfig.count - 1 ? (100 - pct * (financeConfig.count - 1)) : pct;
                  const val = (Number(financeProposal.total || 0) * finalPct / 100);
                  const d = new Date(); d.setDate(d.getDate() + i * financeConfig.intervalDays);
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Parcela {i + 1}/{financeConfig.count}</span>
                      <span className="font-medium">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — {d.toLocaleDateString('pt-BR')}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinanceDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateFinanceFromProposal} disabled={financeLoading}>
              {financeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Banknote className="w-4 h-4 mr-2" />}
              Gerar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
