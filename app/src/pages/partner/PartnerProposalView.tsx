import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { api } from '@/api';
import { toast } from 'sonner';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { ProposalPDFTemplate } from '@/components/ProposalPDFTemplate';
import { SolarProposalPDFTemplate } from '@/components/SolarProposalPDFTemplate';
import { OeMProposalPDFTemplate } from '@/components/OeMProposalPDFTemplate';
import { RentalProposalPDFTemplate } from '@/components/RentalProposalPDFTemplate';

export default function PartnerProposalView() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const { partnerToken } = usePartnerAuth();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proposalId || !partnerToken) return;
    (async () => {
      try {
        const data = await api.getPartnerProposal(proposalId, partnerToken);
        console.debug('[PartnerProposalView]', {
          proposalNumber: data?.proposalNumber,
          activityType: data?.activityType,
          templateType: data?.templateType,
          hasSolarProject: !!(data?.solarProject?.systemPowerKwp),
          hasCompany: !!(data?.company?.id),
          total: data?.total,
        });
        setProposal(data);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Proposta não encontrada ou sem permissão');
        navigate('/partner/leads');
      } finally {
        setLoading(false);
      }
    })();
  }, [proposalId, partnerToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  const solarProject = proposal.solarProject || {};
  const company = proposal.company || null;

  // templateType vem explícito do backend — sem ambiguidade
  const templateType: string = proposal.templateType || 'default';

  const renderTemplate = () => {
    if (templateType === 'solar') {
      return (
        <SolarProposalPDFTemplate
          proposal={proposal}
          solarProject={solarProject}
          company={company}
        />
      );
    }
    if (templateType === 'oem') {
      return (
        <OeMProposalPDFTemplate
          proposal={proposal}
          company={company}
          signatures={{}}
        />
      );
    }
    if (templateType === 'rental') {
      return (
        <RentalProposalPDFTemplate
          proposal={proposal}
          company={company}
          signatures={{}}
        />
      );
    }
    // Padrão: elétrica, consultoria, etc.
    return (
      <ProposalPDFTemplate
        proposal={proposal}
        client={proposal.client}
        company={company}
        hideFinancialValues={false}
        signatures={{}}
      />
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 print:max-w-none print:pb-0">

      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          onClick={() => navigate('/partner/leads')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar aos Leads
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-mono">
            {proposal.proposalNumber}
          </span>
          {proposal.allowDownload && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> Salvar / Imprimir PDF
            </button>
          )}
        </div>
      </div>

      {/* Dica mobile */}
      {proposal.allowDownload && (
        <div className="no-print sm:hidden flex items-center gap-2 px-4 py-2 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
          <Printer className="w-3.5 h-3.5 shrink-0" />
          <span>Para salvar o PDF, use o botão acima ou gire o celular.</span>
        </div>
      )}

      {/* Proposta */}
      <div className="overflow-x-auto pb-4">
        <div
          className="shadow-xl rounded-lg overflow-hidden"
          style={{ minWidth: 794, maxWidth: 794, margin: '0 auto' }}
        >
          {renderTemplate()}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}
