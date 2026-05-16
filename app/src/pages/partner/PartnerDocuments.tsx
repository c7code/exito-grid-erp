import { useEffect, useState, useCallback } from 'react';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { api } from '@/api';
import {
  FileText, Download, Radio, Users,
  Loader2, RefreshCw, Search, FolderOpen,
  Globe, Star, Eye, X as XIcon,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDocIcon(mimeType?: string): string {
  if (!mimeType) return '📁';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗄️';
  if (mimeType.includes('video/')) return '🎥';
  if (mimeType.includes('audio/')) return '🔊';
  return '📁';
}

function resolveUrl(url?: string) {
  if (!url) return '#';
  return url.startsWith('http')
    ? url
    : `${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '')}${url}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Preview Modal ───────────────────────────────────────────────────────────
function PreviewModal({ doc, onClose }: { doc: any; onClose: () => void }) {
  const url = resolveUrl(doc.url);
  const isImg = doc.mimeType?.startsWith('image/');
  const isPdf = doc.mimeType === 'application/pdf';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxWidth: '90vw', maxHeight: '90vh', width: isImg ? 'auto' : '800px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{doc.description || doc.originalName}</p>
            <p className="text-xs text-gray-400">{doc.originalName}</p>
          </div>
          <a href={url} target="_blank" rel="noreferrer" download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
            <Download className="w-3.5 h-3.5" /> Baixar
          </a>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isImg && (
            <img src={url} alt={doc.originalName}
              className="max-w-full max-h-[70vh] object-contain mx-auto block p-4" />
          )}
          {isPdf && (
            <iframe src={url} title={doc.originalName}
              className="w-full" style={{ height: '70vh', border: 'none' }} />
          )}
          {!isImg && !isPdf && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-400">
              <span className="text-5xl">{getDocIcon(doc.mimeType)}</span>
              <p className="text-sm font-medium text-gray-600">Pré-visualização não disponível para este formato</p>
              <a href={url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
                <Download className="w-4 h-4" /> Abrir arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Doc Card ────────────────────────────────────────────────────────────────
function DocCard({
  doc,
  badge,
  badgeColor,
  onPreview,
}: {
  doc: any;
  badge?: string;
  badgeColor?: string;
  onPreview: (doc: any) => void;
}) {
  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl border border-white/60 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-200 bg-white/70 backdrop-blur-sm">
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden transition-transform group-hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #d1fae5, #dbeafe)' }}>
        {doc.mimeType?.startsWith('image/') ? (
          <img
            src={resolveUrl(doc.url)}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span>{getDocIcon(doc.mimeType)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{doc.description || doc.originalName}</p>
          {badge && (
            <span className={`hidden sm:inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{doc.originalName}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {doc.leadClientName && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />{doc.leadClientName}
            </span>
          )}
          <span className="text-[10px] text-gray-400">{formatDate(doc.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onPreview(doc)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-500 bg-indigo-50 hover:bg-indigo-500 hover:text-white transition-all"
          title="Pré-visualizar"
        >
          <Eye className="w-4 h-4" />
        </button>
        <a
          href={resolveUrl(doc.url)}
          target="_blank"
          rel="noreferrer"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 bg-emerald-50 hover:bg-emerald-500 hover:text-white transition-all"
          title="Baixar"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg, #d1fae5, #dbeafe)' }}>
        <Icon className="w-8 h-8 text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'all' | 'broadcast' | 'lead' | 'exclusive';

interface DocData {
  broadcast: any[];
  publicLeadDocs: any[];
  privateLeadDocs: any[];
  stats: { total: number; broadcast: number; public: number; exclusive: number };
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PartnerDocuments() {
  const { partnerToken } = usePartnerAuth();
  const [data, setData] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!partnerToken) return;
    setLoading(true);
    try {
      const res = await api.getPartnerAllDocuments(partnerToken);
      setData(res);
    } catch {
      setData({ broadcast: [], publicLeadDocs: [], privateLeadDocs: [], stats: { total: 0, broadcast: 0, public: 0, exclusive: 0 } });
    } finally {
      setLoading(false);
    }
  }, [partnerToken]);

  useEffect(() => { load(); }, [load]);

  // Computed lists
  const filter = (docs: any[]) =>
    !search.trim()
      ? docs
      : docs.filter(d =>
          (d.description || d.originalName || '').toLowerCase().includes(search.toLowerCase()) ||
          (d.leadClientName || '').toLowerCase().includes(search.toLowerCase())
        );

  const allDocs = data
    ? [...data.broadcast, ...data.publicLeadDocs, ...data.privateLeadDocs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];

  const tabs: { id: Tab; label: string; icon: any; count: number; desc: string; color: string; badgeStyle: string }[] = [
    {
      id: 'all', label: 'Todos', icon: FolderOpen,
      count: data?.stats.total ?? 0,
      desc: 'Todos os documentos disponíveis para você',
      color: '#10b981',
      badgeStyle: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'broadcast', label: 'Para Todos', icon: Radio,
      count: data?.stats.broadcast ?? 0,
      desc: 'Materiais enviados pela equipe para todos os indicadores do seu canal',
      color: '#6366f1',
      badgeStyle: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'lead', label: 'Por Lead', icon: Globe,
      count: data?.stats.public ?? 0,
      desc: 'Documentos vinculados aos seus leads e visíveis para você',
      color: '#0284c7',
      badgeStyle: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'exclusive', label: 'Exclusivos', icon: Star,
      count: data?.stats.exclusive ?? 0,
      desc: 'Documentos enviados exclusivamente para você pela equipe',
      color: '#f59e0b',
      badgeStyle: 'bg-amber-50 text-amber-700',
    },
  ];

  const activeTab = tabs.find(t => t.id === tab)!;

  const visibleDocs: any[] = filter(
    tab === 'all' ? allDocs :
    tab === 'broadcast' ? (data?.broadcast ?? []) :
    tab === 'lead' ? (data?.publicLeadDocs ?? []) :
    (data?.privateLeadDocs ?? [])
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Preview Modal */}
      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            Meus Documentos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Acesse todos os materiais disponibilizados para você</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Stats Row */}
      {data && (
        <div className="grid grid-cols-4 gap-3">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative rounded-2xl p-4 text-left transition-all duration-200 border-2 ${
                tab === t.id
                  ? 'shadow-lg scale-[1.02]'
                  : 'border-transparent bg-white/70 hover:bg-white hover:shadow-md'
              }`}
              style={tab === t.id ? { borderColor: t.color, background: `${t.color}10` } : {}}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${t.color}20` }}>
                  <t.icon className="w-4 h-4" style={{ color: t.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{t.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
              {tab === t.id && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: t.color }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab Description + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <activeTab.icon className="w-4 h-4 flex-shrink-0" style={{ color: activeTab.color }} />
          <p className="text-sm text-gray-500">{activeTab.desc}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar documento..."
            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-400">Carregando seus documentos...</p>
          </div>
        ) : visibleDocs.length === 0 ? (
          tab === 'exclusive' ? (
            <EmptyState
              icon={Star}
              title="Nenhum documento exclusivo ainda"
              sub="A equipe ainda não enviou documentos especificamente para você"
            />
          ) : tab === 'broadcast' ? (
            <EmptyState
              icon={Radio}
              title="Nenhum material da equipe"
              sub="A equipe ainda não enviou materiais para o seu canal"
            />
          ) : tab === 'lead' ? (
            <EmptyState
              icon={Globe}
              title="Nenhum documento de lead"
              sub="Os documentos dos seus leads aparecerão aqui quando forem compartilhados"
            />
          ) : (
            <EmptyState
              icon={FolderOpen}
              title={search ? 'Nenhum resultado encontrado' : 'Nenhum documento disponível'}
              sub={search ? `Tente outro termo de busca` : 'Seus documentos aparecerão aqui quando forem enviados'}
            />
          )
        ) : (
          <div>
            {/* Section headers for "all" tab */}
            {tab === 'all' ? (
              <div className="divide-y divide-gray-100">
                {/* Broadcast Section */}
                {filter(data?.broadcast ?? []).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-5 py-3 bg-indigo-50/50 border-b border-indigo-100">
                      <Radio className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Para Todos</span>
                      <span className="ml-auto text-xs text-indigo-400">{filter(data?.broadcast ?? []).length} documento(s)</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {filter(data?.broadcast ?? []).map(doc => (
                        <DocCard key={doc.id} doc={doc} badge="Para Todos" badgeColor="bg-indigo-50 text-indigo-700" onPreview={setPreviewDoc} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Lead Docs Section */}
                {filter(data?.publicLeadDocs ?? []).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-5 py-3 bg-blue-50/50 border-b border-blue-100">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Por Lead</span>
                      <span className="ml-auto text-xs text-blue-400">{filter(data?.publicLeadDocs ?? []).length} documento(s)</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {filter(data?.publicLeadDocs ?? []).map(doc => (
                        <DocCard key={doc.id} doc={doc} badge="Lead" badgeColor="bg-blue-50 text-blue-700" onPreview={setPreviewDoc} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Exclusive Section */}
                {filter(data?.privateLeadDocs ?? []).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-5 py-3 bg-amber-50/50 border-b border-amber-100">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Exclusivos para Você</span>
                      <span className="ml-auto text-xs text-amber-400">{filter(data?.privateLeadDocs ?? []).length} documento(s)</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {filter(data?.privateLeadDocs ?? []).map(doc => (
                        <DocCard key={doc.id} doc={doc} badge="Exclusivo" badgeColor="bg-amber-50 text-amber-700" onPreview={setPreviewDoc} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {visibleDocs.map(doc => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    badge={activeTab.label}
                    badgeColor={activeTab.badgeStyle}
                    onPreview={setPreviewDoc}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: Radio,
            color: '#6366f1',
            title: 'Para Todos',
            desc: 'Materiais gerais enviados pela equipe para indicadores do seu canal (apresentações, manuais, campanhas)',
          },
          {
            icon: Globe,
            color: '#0284c7',
            title: 'Por Lead',
            desc: 'Documentos vinculados às negociações dos seus clientes indicados (propostas, contratos, laudos)',
          },
          {
            icon: Star,
            color: '#f59e0b',
            title: 'Exclusivos',
            desc: 'Documentos enviados especificamente para você pela equipe Exito',
          },
        ].map(item => (
          <div key={item.title} className="flex items-start gap-3 p-4 rounded-2xl bg-white/60 border border-white/80">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${item.color}15` }}>
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">{item.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
