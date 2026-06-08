import { useState, useEffect } from 'react';
import CategorySelect from '@/components/ui/CategorySelect';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Zap, Plus, Search, FileText, Calendar, User, Building2, Filter, Eye, Link2, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import LaudoForm from './laudos/LaudoForm';
import LaudoViewer from './laudos/LaudoViewer';

// ─── Constantes ───────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  aberto: { label: 'Aberto', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  pendente_cliente: { label: 'Aguardando Cliente', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  enviado_orcamento: { label: 'Orçamento Enviado', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  perdido: { label: 'Perdido', className: 'bg-red-50 text-red-700 border-red-200' },
};

const ITEMS_PER_PAGE = 30;

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

function parseJSON(str: string | null | undefined): any {
  if (!str) return {};
  try { return typeof str === 'object' ? str : JSON.parse(str); } catch { return {}; }
}

// ═══════════════════════════════════════════════════════════════
// VIEWS: 'list' | 'new' | 'edit' | 'view'
// ═══════════════════════════════════════════════════════════════
export default function LaudosEletricos() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'new' | 'edit' | 'view'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [viewLaudo, setViewLaudo] = useState<any>(null);
  const [laudos, setLaudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkData, setLinkData] = useState({ clientName: '', clientPhone: '', clientEmail: '', tipoImovel: '', endereco: '', finalidade: '', notas: '' });
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const isEngineerOrAdmin = ['admin', 'engineer', 'finance'].includes(user?.role || '');

  async function loadLaudos() {
    setLoading(true);
    try {
      const data = await api.getLaudos();
      setLaudos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar laudos:', err);
      toast.error('Erro ao carregar atendimentos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLaudos(); }, []);

  function openNew() { setView('new'); setEditId(null); }

  // Decidir se abre form (edição) ou viewer (leitura)
  async function openLaudo(id: string) {
    try {
      const laudo = await api.getLaudo(id);
      if (isEngineerOrAdmin && laudo.status === 'enviado_orcamento') {
        setViewLaudo(laudo);
        setView('view');
      } else if (laudo.status === 'aberto') {
        setEditId(id);
        setView('edit');
      } else {
        setViewLaudo(laudo);
        setView('view');
      }
    } catch {
      toast.error('Erro ao abrir atendimento');
    }
  }

  function backToList() { setView('list'); setEditId(null); setViewLaudo(null); loadLaudos(); }

  // ─── Gerar Link Público (com dados preliminares) ───
  async function handleGenerateLink() {
    setGeneratingLink(true);
    try {
      const result = await api.generateLaudoLink(undefined, linkData);
      const baseUrl = window.location.origin;
      setGeneratedLink(`${baseUrl}/formulario/${result.token}`);
      loadLaudos();
    } catch {
      toast.error('Erro ao gerar link');
    } finally {
      setGeneratingLink(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Form view ───
  if (view === 'new' || view === 'edit') {
    return <LaudoForm laudoId={editId} onSaved={backToList} onCancel={backToList} />;
  }

  // ─── Viewer (modo leitura + ações do engenheiro) ───
  if (view === 'view' && viewLaudo) {
    return <LaudoViewer laudo={viewLaudo} onBack={backToList} onUpdated={backToList} />;
  }

  // ─── Filtros ───
  const filtered = (() => {
    let items = [...laudos];
    if (statusFilter !== 'all') items = items.filter(l => l.status === statusFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(l => {
        const clientName = l.client?.name?.toLowerCase() || '';
        const dados = parseJSON(l.dados);
        const tipoImovel = (dados?.tipo_imovel || dados?.tipoImovel || '').toLowerCase();
        return clientName.includes(q) || tipoImovel.includes(q);
      });
    }
    return items;
  })();

  // ─── Paginação ───
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ─── Contadores ───
  const counts = {
    total: laudos.length,
    aberto: laudos.filter(l => l.status === 'aberto').length,
    pendente_cliente: laudos.filter(l => l.status === 'pendente_cliente').length,
    enviado_orcamento: laudos.filter(l => l.status === 'enviado_orcamento').length,
    perdido: laudos.filter(l => l.status === 'perdido').length,
  };

  return (
    <>
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Laudos Elétricos</h1>
            <p className="text-sm text-slate-500">{counts.total} atendimento{counts.total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setShowLinkDialog(true); setGeneratedLink(''); setCopied(false); setLinkData({ clientName: '', clientPhone: '', clientEmail: '', tipoImovel: '', endereco: '', finalidade: '', notas: '' }); }}
            className="border-amber-300 text-amber-700 hover:bg-amber-50 h-11"
          >
            <Link2 className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Gerar Link</span>
          </Button>
          <Button
            onClick={openNew}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md shadow-amber-200/50 h-11 px-6"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Atendimento
          </Button>
        </div>
      </div>

      {/* ── Cards de Status ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'all', label: 'Todos', count: counts.total, color: 'bg-slate-100 text-slate-700 border-slate-200' },
          { key: 'pendente_cliente', label: 'Aguardando', count: counts.pendente_cliente, color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { key: 'aberto', label: 'Abertos', count: counts.aberto, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { key: 'enviado_orcamento', label: 'Orç. Enviado', count: counts.enviado_orcamento, color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { key: 'perdido', label: 'Perdidos', count: counts.perdido, color: 'bg-red-50 text-red-700 border-red-200' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => { setStatusFilter(s.key); setCurrentPage(1); }}
            className={`rounded-xl border p-3 text-left transition-all ${
              statusFilter === s.key
                ? s.color + ' ring-2 ring-offset-1 ring-current shadow-sm'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* ── Barra de Busca ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente ou tipo de imóvel..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-10"
          />
        </div>
        {(statusFilter !== 'all' || searchTerm) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter('all'); setSearchTerm(''); setCurrentPage(1); }}
            className="text-slate-500 text-xs"
          >
            <Filter className="h-3 w-3 mr-1" /> Limpar filtros
          </Button>
        )}
      </div>

      {/* ── Listagem ── */}
      {loading ? (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Carregando atendimentos...</p>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-amber-400" />
            </div>
            {laudos.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-slate-700">Nenhum atendimento ainda</h3>
                <p className="text-sm text-slate-400 max-w-md">
                  Você ainda não tem nenhum atendimento registrado. Clique em
                  <span className="font-medium text-amber-600"> "Novo Atendimento" </span>
                  para começar a registrar seus laudos elétricos.
                </p>
                <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-white mt-2">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Criar Primeiro Atendimento
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-700">Nenhum resultado encontrado</h3>
                <p className="text-sm text-slate-400">
                  Nenhum atendimento corresponde aos filtros selecionados.
                </p>
              </>
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* ── Desktop Table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50/80">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Cliente</div>
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Tipo de Imóvel</div>
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Data</div>
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(laudo => {
                  const dados = parseJSON(laudo.dados);
                  const tipoImovel = dados?.tipo_imovel || dados?.tipoImovel || '—';
                  const sc = STATUS_CONFIG[laudo.status] || STATUS_CONFIG.aberto;
                  return (
                    <tr key={laudo.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => openLaudo(laudo.id)}>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-800">{laudo.client?.name || 'Cliente não identificado'}</p>
                        {laudo.client?.tradeName && <p className="text-xs text-slate-400">{laudo.client.tradeName}</p>}
                      </td>
                      <td className="px-5 py-3.5"><span className="text-sm text-slate-600">{tipoImovel}</span></td>
                      <td className="px-5 py-3.5"><span className="text-sm text-slate-600">{formatDate(laudo.createdAt)}</span></td>
                      <td className="px-5 py-3.5"><Badge variant="outline" className={sc.className + ' text-xs'}>{sc.label}</Badge></td>
                      <td className="px-5 py-3.5 text-right">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-amber-600 text-xs" onClick={e => { e.stopPropagation(); openLaudo(laudo.id); }}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="sm:hidden divide-y">
            {paginated.map(laudo => {
              const dados = parseJSON(laudo.dados);
              const tipoImovel = dados?.tipo_imovel || dados?.tipoImovel || '';
              const sc = STATUS_CONFIG[laudo.status] || STATUS_CONFIG.aberto;
              return (
                <button key={laudo.id} className="w-full text-left p-4 hover:bg-slate-50 transition-colors" onClick={() => openLaudo(laudo.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{laudo.client?.name || 'Cliente não identificado'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tipoImovel ? `${tipoImovel} • ` : ''}{formatDate(laudo.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className={sc.className + ' text-[10px] shrink-0'}>{sc.label}</Badge>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Paginação ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t bg-slate-50/50">
              <p className="text-xs text-slate-500">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="text-xs h-8">
                  Anterior
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)}
                      className={`text-xs h-8 w-8 p-0 ${currentPage === page ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}>
                      {page}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="text-xs h-8">
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>

      {/* ── Dialog Gerar Link ── */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-amber-600" />
              Gerar Link para Cliente
            </DialogTitle>
            <DialogDescription>
              Preencha as informações que já possui. O cliente completará o restante pelo link.
            </DialogDescription>
          </DialogHeader>

          {!generatedLink ? (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Informações preliminares</p>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nome do cliente</label>
                <Input placeholder="Ex: João Silva / Empresa XYZ" value={linkData.clientName}
                  onChange={e => setLinkData(p => ({ ...p, clientName: e.target.value }))} className="h-9" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Telefone</label>
                  <Input placeholder="(00) 00000-0000" value={linkData.clientPhone}
                    onChange={e => setLinkData(p => ({ ...p, clientPhone: e.target.value }))} className="h-9" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">E-mail</label>
                  <Input placeholder="email@cliente.com" value={linkData.clientEmail}
                    onChange={e => setLinkData(p => ({ ...p, clientEmail: e.target.value }))} className="h-9" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tipo de imóvel</label>
                  <CategorySelect group="property_type" value={linkData.tipoImovel} onChange={v => setLinkData(p => ({ ...p, tipoImovel: v }))} useLabelAsValue placeholder="Selecione..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tipo de serviço</label>
                  <CategorySelect group="laudo_purpose" value={linkData.finalidade} onChange={v => setLinkData(p => ({ ...p, finalidade: v }))} useLabelAsValue placeholder="Selecione..." />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Endereço</label>
                <Input placeholder="Rua, número, bairro, cidade" value={linkData.endereco}
                  onChange={e => setLinkData(p => ({ ...p, endereco: e.target.value }))} className="h-9" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Observações internas</label>
                <Input placeholder="Notas para a equipe (o cliente não verá)" value={linkData.notas}
                  onChange={e => setLinkData(p => ({ ...p, notas: e.target.value }))} className="h-9" />
              </div>

              <div className="pt-1">
                <Button onClick={handleGenerateLink} disabled={generatingLink}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white h-11 font-semibold">
                  {generatingLink ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Link2 className="w-4 h-4 mr-1.5" />}
                  {generatingLink ? 'Gerando...' : 'Gerar Link'}
                </Button>
                <p className="text-[11px] text-slate-400 mt-1.5 text-center">Todos os campos são opcionais. O cliente completará o que faltar.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-xs font-medium text-emerald-700 mb-2">✅ Link gerado com sucesso!</p>
                <div className="flex gap-2">
                  <Input readOnly value={generatedLink} className="h-9 text-xs bg-white font-mono"
                    onClick={e => (e.target as HTMLInputElement).select()} />
                  <Button size="sm" onClick={copyLink}
                    className={`shrink-0 h-9 px-3 ${copied ? 'bg-emerald-500' : 'bg-amber-500 hover:bg-amber-600'} text-white`}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-500">
                <p>📱 Envie este link por <strong>WhatsApp</strong>, <strong>e-mail</strong> ou <strong>SMS</strong>.</p>
                <p>👤 O cliente vai ver as informações que você preencheu e completar o restante.</p>
                <p>⚡ Quando ele enviar, o atendimento aparece automaticamente na sua lista.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1"
                  onClick={() => { setGeneratedLink(''); setLinkData({ clientName: '', clientPhone: '', clientEmail: '', tipoImovel: '', endereco: '', finalidade: '', notas: '' }); }}>
                  Gerar Outro
                </Button>
                <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setShowLinkDialog(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
