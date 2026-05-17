import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { api } from '@/api';
import { toast } from 'sonner';
import {
  Users, PlusCircle, Phone, MapPin, Search,
  FolderOpen, FileUp, Download, Globe, Lock,
  FileText, Eye, MoreVertical, Paperclip, X, Loader2,
} from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  new: 'Novo', contacted: 'Contactado', qualified: 'Qualificado',
  account_analysis: 'Em Análise', proposal_sent: 'Proposta Enviada',
  negotiating: 'Negociando', negotiation: 'Negociação',
  converted: 'Convertido ✓', closed_won: 'Convertido ✓',
  lost: 'Perdido', closed_lost: 'Perdido', no_profile: 'Sem Perfil',
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  new: { bg: '#eef2ff', text: '#4338ca' }, contacted: { bg: '#fefce8', text: '#a16207' },
  qualified: { bg: '#eff6ff', text: '#1d4ed8' }, account_analysis: { bg: '#faf5ff', text: '#7c3aed' },
  proposal_sent: { bg: '#f0f9ff', text: '#0369a1' }, negotiating: { bg: '#fff7ed', text: '#c2410c' },
  negotiation: { bg: '#fff7ed', text: '#c2410c' }, converted: { bg: '#f0fdf4', text: '#15803d' },
  closed_won: { bg: '#f0fdf4', text: '#15803d' }, lost: { bg: '#fef2f2', text: '#b91c1c' },
  closed_lost: { bg: '#fef2f2', text: '#b91c1c' }, no_profile: { bg: '#f8fafc', text: '#64748b' },
};
const FILE_TYPES = ['Conta de Luz','CPF / RG','CNPJ','Comprovante de Endereço','Foto do Local','Projeto Elétrico','Contrato','Orçamento','Outro (personalizado)'];

interface LeadDoc {
  id: string; originalName: string; mimeType?: string; url: string;
  description?: string; visibility: 'public'|'private'; uploadedByRole?: string; createdAt: string;
}
interface NewLeadForm {
  name: string; phone: string; email: string; city: string; state: string; potentialValue: string; notes: string;
}
const emptyForm: NewLeadForm = { name:'', phone:'', email:'', city:'', state:'', potentialValue:'', notes:'' };

const resolveUrl = (url: string) =>
  url?.startsWith('http') ? url : `${(import.meta.env.VITE_API_URL||'http://localhost:3001/api').replace(/\/api$/,'')}${url}`;

export default function PartnerLeads() {
  const { partnerToken } = usePartnerAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<NewLeadForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  // Canal de Documentos
  const [docLead, setDocLead] = useState<any|null>(null);
  const [docs, setDocs] = useState<LeadDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFileType, setUploadFileType] = useState('');
  const [customFileType, setCustomFileType] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Proposta vinculada — upload complementar
  const [proposalLead, setProposalLead] = useState<any|null>(null);
  const [proposalMenuOpen, setProposalMenuOpen] = useState<string|null>(null);
  const [attachingToProposal, setAttachingToProposal] = useState(false);
  const proposalFileRef = useRef<HTMLInputElement>(null);


  const fetchLeads = async () => {
    if (!partnerToken) return;
    try { const data = await api.getPartnerLeads(partnerToken); setLeads(data); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { fetchLeads(); }, [partnerToken]);

  const openDocs = async (lead: any) => {
    setDocLead(lead); setDocsLoading(true);
    try { const d = await api.getPartnerLeadDocuments(lead.id, partnerToken!); setDocs(Array.isArray(d) ? d : []); }
    catch { toast.error('Erro ao carregar documentos'); }
    finally { setDocsLoading(false); }
  };

  const uploadDoc = async () => {
    if (!fileRef.current?.files?.[0] || !docLead || !partnerToken) return;
    const file = fileRef.current.files[0];
    setUploading(true);
    try {
      const effectiveType = uploadFileType === 'Outro (personalizado)' ? (customFileType.trim() || 'Outro') : uploadFileType;
      const desc = [effectiveType, uploadDesc].filter(Boolean).join(' — ');
      await api.uploadPartnerLeadDocument(docLead.id, file, { visibility: 'public', description: desc || undefined }, partnerToken);
      toast.success('Documento enviado!');
      setUploadFileType(''); setCustomFileType(''); setUploadDesc('');
      if (fileRef.current) fileRef.current.value = '';
      const d = await api.getPartnerLeadDocuments(docLead.id, partnerToken!);
      setDocs(Array.isArray(d) ? d : []);
    } catch { toast.error('Erro ao enviar documento'); }
    finally { setUploading(false); }
  };

  const uploadProposalAttachment = async () => {
    if (!proposalFileRef.current?.files?.[0] || !proposalLead) return;
    const file = proposalFileRef.current.files[0];
    setAttachingToProposal(true);
    try {
      await api.uploadPartnerLeadDocument(
        proposalLead.id, file,
        { visibility: 'public', description: `Complemento de proposta — ${file.name}` },
        partnerToken!
      );
      toast.success('Documento complementar enviado à equipe!');
      if (proposalFileRef.current) proposalFileRef.current.value = '';
      setProposalMenuOpen(null);
    } catch { toast.error('Erro ao enviar arquivo'); }
    finally { setAttachingToProposal(false); }
  };


  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.phone.trim()) { toast.error('Telefone é obrigatório'); return; }
    setIsSaving(true);
    try {
      await api.createPartnerLead(partnerToken!, {
        name: form.name, phone: form.phone, email: form.email||undefined,
        city: form.city||undefined, state: form.state||undefined,
        potentialValue: form.potentialValue ? Number(form.potentialValue) : undefined,
        notes: form.notes||undefined,
      });
      toast.success('Lead indicado com sucesso!');
      setShowDialog(false); setForm(emptyForm); fetchLeads();
    } catch (err: any) { toast.error(err?.response?.data?.message||'Erro ao cadastrar lead'); }
    finally { setIsSaving(false); }
  };

  const filtered = leads.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.city?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Leads</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} indicação(ões) registrada(s)</p>
        </div>
        <button id="partner-new-lead-btn" onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
          style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}>
          <PlusCircle className="w-4 h-4" /> Indicar Lead
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar por nome, cidade ou telefone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
      </div>

      {/* Lead List */}
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
        <div className="space-y-4">
          {filtered.map(lead => {
            const sc = STATUS_COLOR[lead.status] || { bg: '#f8fafc', text: '#64748b' };
            const visibleProposals = (lead.linkedProposals || []).filter((p: any) => p.visible);
            return (
              <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Lead card header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{lead.name || lead.clientName}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.text }}>
                          {STATUS_LABEL[lead.status] || lead.status}
                        </span>
                        {visibleProposals.length > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            📄 {visibleProposals.length} proposta{visibleProposals.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {(lead.phone||lead.clientPhone) && (
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="w-3.5 h-3.5" />{lead.phone||lead.clientPhone}
                          </span>
                        )}
                        {(lead.city||lead.clientCity) && (
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />{lead.city||lead.clientCity}{(lead.state||lead.clientState) ? `, ${lead.state||lead.clientState}` : ''}
                          </span>
                        )}
                        {lead.potentialValue && (
                          <span className="text-sm text-emerald-600 font-medium">
                            ≈ {Number(lead.potentialValue).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                          </span>
                        )}
                      </div>
                      {lead.notes && <p className="text-sm text-gray-400 mt-1.5 line-clamp-2">{lead.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-300">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                      <button onClick={() => openDocs(lead)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors">
                        <FolderOpen className="w-3.5 h-3.5" /> Documentos
                      </button>
                    </div>
                  </div>
                </div>

                {/* Propostas vinculadas — inline */}
                {visibleProposals.length > 0 && (
                  <div className="border-t border-emerald-100 bg-emerald-50/50 px-5 py-3 space-y-2">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Proposta{visibleProposals.length > 1 ? 's' : ''} Vinculada{visibleProposals.length > 1 ? 's' : ''}
                    </p>
                    {visibleProposals.map((p: any) => (
                      <div key={p.proposalId || p.linkId}
                        className="bg-white border border-emerald-200 rounded-xl overflow-visible">
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-emerald-800 text-sm">{p.number}</span>
                              {p.title && <span className="text-xs text-gray-500 truncate max-w-[180px]">{p.title}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {p.clientName && <span className="text-xs text-gray-400">{p.clientName}</span>}
                              {p.totalValue && (
                                <span className="text-xs font-bold text-emerald-700">
                                  {Number(p.totalValue).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                                </span>
                              )}
                              {p.proposalDate && (
                                <span className="text-xs text-gray-400">
                                  {new Date(p.proposalDate).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Botões + menu 3 pontos */}
                          <div className="flex items-center gap-1.5 ml-3 shrink-0">
                            {/* Botão Ver — sempre disponível se proposta está visível */}
                            <button
                              onClick={() => navigate(`/partner/proposals/${p.proposalId}`)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors">
                              <Eye className="w-3.5 h-3.5" /> Ver
                            </button>
                            {p.allowDownload && (
                              <button
                                onClick={() => navigate(`/partner/proposals/${p.proposalId}`)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                                <Download className="w-3.5 h-3.5" /> PDF
                              </button>
                            )}
                            {/* Menu 3 pontos */}
                            <div className="relative">
                              <button
                                onClick={() => setProposalMenuOpen(v => v === (lead.id + p.proposalId) ? null : (lead.id + p.proposalId))}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {proposalMenuOpen === (lead.id + p.proposalId) && (
                                <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 min-w-[210px]">
                                  <>
                                      <button
                                        onClick={() => { navigate(`/partner/proposals/${p.proposalId}`); setProposalMenuOpen(null); }}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                                        <Eye className="w-4 h-4 text-blue-500" /> Visualizar Proposta
                                      </button>
                                      {p.allowDownload && (
                                        <button
                                          onClick={() => { navigate(`/partner/proposals/${p.proposalId}`); setProposalMenuOpen(null); }}
                                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                                          <Download className="w-4 h-4 text-emerald-500" /> Salvar PDF
                                        </button>
                                      )}
                                      <div className="border-t border-gray-100 my-1" />
                                  </>
                                  <label className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => { (proposalFileRef.current as any)._leadId = lead.id; }}>
                                    <Paperclip className="w-4 h-4 text-purple-500" />
                                    {attachingToProposal ? 'Enviando...' : 'Enviar Documento / Informação'}
                                    <input ref={proposalFileRef} type="file" className="hidden"
                                      onChange={() => {
                                        // Associa ao lead correto antes de fazer upload
                                        if (!proposalLead || proposalLead.id !== lead.id) setProposalLead(lead);
                                        uploadProposalAttachment();
                                      }}
                                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Se tem proposalId mas proposalVisible=false (ainda não liberado) */}
                {lead.proposalId && visibleProposals.length === 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-2.5 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-400">Proposta vinculada — aguardando liberação pela equipe</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal: Canal de Documentos ─── */}
      {docLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDocLead(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #4c1d95, #1e3a5f)' }}>
              <div>
                <h2 className="font-bold text-white flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Canal de Documentos</h2>
                <p className="text-purple-200 text-xs mt-0.5">Lead: {docLead.name || docLead.clientName}</p>
              </div>
              <button onClick={() => setDocLead(null)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Upload */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                  <FileUp className="w-4 h-4" /> Enviar Documento
                </p>
                <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx"
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200" />
                <div className="grid grid-cols-1 gap-2">
                  <select value={uploadFileType} onChange={e => { setUploadFileType(e.target.value); if (e.target.value !== 'Outro (personalizado)') setCustomFileType(''); }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="">Tipo do documento...</option>
                    {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {uploadFileType === 'Outro (personalizado)' && (
                    <input value={customFileType} onChange={e => setCustomFileType(e.target.value)}
                      placeholder="Digite o tipo do documento..."
                      className="px-3 py-2 rounded-lg border border-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50" />
                  )}
                  <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                    placeholder="Observação (opcional)"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>

                <button onClick={uploadDoc} disabled={uploading}
                  className="w-full py-2 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #1d4ed8)' }}>
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><FileUp className="w-4 h-4" /> Enviar Documento</>}
                </button>
              </div>

              {/* Doc list */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Documentos do Lead ({docs.length})</p>
                {docsLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
                ) : docs.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">Nenhum documento ainda. Seja o primeiro a enviar!</p>
                ) : (
                  <div className="space-y-2">
                    {docs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-lg flex-shrink-0">
                          {doc.mimeType?.startsWith('image/') ? '🖼️' : doc.mimeType === 'application/pdf' ? '📄' : '📁'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.description || doc.originalName}</p>
                          <p className="text-xs text-gray-400">{doc.originalName} · {new Date(doc.createdAt).toLocaleDateString('pt-BR')}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 ${doc.visibility === 'public' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {doc.visibility === 'public' ? <><Globe className="w-2.5 h-2.5" />Compartilhado</> : <><Lock className="w-2.5 h-2.5" />Interno</>}
                          </span>
                        </div>
                        <a href={resolveUrl(doc.url)} target="_blank" rel="noreferrer"
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Indicar Lead */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #064e3b, #0c4a6e)' }}>
              <h2 className="font-bold text-white">Indicar Novo Lead</h2>
              <button onClick={() => setShowDialog(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
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
                  <input type={type} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Informações adicionais sobre o lead..." rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
              <button id="partner-save-lead-btn" onClick={handleSave} disabled={isSaving}
                className="px-6 py-2 rounded-xl font-semibold text-white text-sm disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}>
                {isSaving ? 'Salvando...' : 'Indicar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
