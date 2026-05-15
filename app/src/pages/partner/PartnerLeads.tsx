import { useEffect, useState } from 'react';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { api } from '@/api';
import { toast } from 'sonner';
import {
  Users,
  PlusCircle,
  Phone,
  MapPin,
  X,
  Search,
} from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualified: 'Qualificado',
  account_analysis: 'Em Análise',
  proposal_sent: 'Proposta Enviada',
  negotiation: 'Negociação',
  closed_won: 'Convertido ✓',
  closed_lost: 'Perdido',
  no_profile: 'Sem Perfil',
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  new: { bg: '#eef2ff', text: '#4338ca' },
  contacted: { bg: '#fefce8', text: '#a16207' },
  qualified: { bg: '#eff6ff', text: '#1d4ed8' },
  account_analysis: { bg: '#faf5ff', text: '#7c3aed' },
  proposal_sent: { bg: '#f0f9ff', text: '#0369a1' },
  negotiation: { bg: '#fff7ed', text: '#c2410c' },
  closed_won: { bg: '#f0fdf4', text: '#15803d' },
  closed_lost: { bg: '#fef2f2', text: '#b91c1c' },
  no_profile: { bg: '#f8fafc', text: '#64748b' },
};

interface NewLeadForm {
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  potentialValue: string;
  notes: string;
}

const emptyForm: NewLeadForm = {
  name: '', phone: '', email: '', city: '', state: '', potentialValue: '', notes: '',
};

export default function PartnerLeads() {
  const { partnerToken } = usePartnerAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<NewLeadForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLeads = async () => {
    if (!partnerToken) return;
    try {
      const data = await api.getPartnerLeads(partnerToken);
      setLeads(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, [partnerToken]);

  const filtered = leads.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.city?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search)
  );

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.phone.trim()) { toast.error('Telefone é obrigatório'); return; }
    setIsSaving(true);
    try {
      await api.createPartnerLead(partnerToken!, {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        potentialValue: form.potentialValue ? Number(form.potentialValue) : undefined,
        notes: form.notes || undefined,
      });
      toast.success('Lead indicado com sucesso!');
      setShowDialog(false);
      setForm(emptyForm);
      fetchLeads();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao cadastrar lead');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Leads</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} indicação(ões) registrada(s)</p>
        </div>
        <button
          id="partner-new-lead-btn"
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
          style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}
        >
          <PlusCircle className="w-4 h-4" />
          Indicar Lead
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, cidade ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Nenhum lead encontrado</p>
          <p className="text-gray-300 text-sm mt-1">Comece indicando seu primeiro lead!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const sc = STATUS_COLOR[lead.status] || { bg: '#f8fafc', text: '#64748b' };
            return (
              <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {STATUS_LABEL[lead.status] || lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {lead.phone && (
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="w-3.5 h-3.5" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.city && (
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {lead.city}{lead.state ? `, ${lead.state}` : ''}
                        </span>
                      )}
                      {lead.potentialValue && (
                        <span className="text-sm text-emerald-600 font-medium">
                          ≈ {Number(lead.potentialValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      )}
                    </div>
                    {lead.notes && (
                      <p className="text-sm text-gray-400 mt-1.5 line-clamp-2">{lead.notes}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-300">
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog: Indicar Lead */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #064e3b, #0c4a6e)' }}>
              <h2 className="font-bold text-white">Indicar Novo Lead</h2>
              <button onClick={() => setShowDialog(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {[
                { label: 'Nome completo *', key: 'name', type: 'text', placeholder: 'João da Silva' },
                { label: 'Telefone / WhatsApp *', key: 'phone', type: 'tel', placeholder: '(11) 99999-9999' },
                { label: 'E-mail', key: 'email', type: 'email', placeholder: 'joao@email.com' },
                { label: 'Cidade', key: 'city', type: 'text', placeholder: 'São Paulo' },
                { label: 'Estado', key: 'state', type: 'text', placeholder: 'SP' },
                { label: 'Valor potencial estimado (R$)', key: 'potentialValue', type: 'number', placeholder: '35000' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Informações adicionais sobre o lead..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                id="partner-save-lead-btn"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 rounded-xl font-semibold text-white text-sm disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}
              >
                {isSaving ? 'Salvando...' : 'Indicar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
