import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Upload,
  Search,
  FileText,
  Image,
  FileSpreadsheet,
  Download,
  Trash2,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Loader2,
  File,
  Menu,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import UploadDocumentDialog from '@/components/UploadDocumentDialog';

const categoryLabels: Record<string, { label: string; color: string; icon: any }> = {
  project: { label: 'Projeto', color: 'bg-blue-100 text-blue-700', icon: FileText },
  contract: { label: 'Contrato', color: 'bg-emerald-100 text-emerald-700', icon: FileText },
  report: { label: 'Relatório', color: 'bg-indigo-100 text-indigo-700', icon: FileText },
  art: { label: 'ART', color: 'bg-orange-100 text-orange-700', icon: FileText },
  memorial: { label: 'Memorial', color: 'bg-cyan-100 text-cyan-700', icon: FileText },
  photo: { label: 'Foto', color: 'bg-purple-100 text-purple-700', icon: Image },
  invoice: { label: 'Nota Fiscal', color: 'bg-green-100 text-green-700', icon: FileSpreadsheet },
  certificate: { label: 'Certificado', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
  other: { label: 'Outro', color: 'bg-slate-100 text-slate-700', icon: File },
};

interface FolderNode {
  id: string;
  name: string;
  parentId?: string;
  children?: FolderNode[];
  documents?: any[];
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string>('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, foldersRes] = await Promise.all([
        api.getDocuments(),
        api.getRootFolders(),
      ]);
      setDocuments(Array.isArray(docsRes) ? docsRes : (docsRes?.data ?? []));
      setFolders(Array.isArray(foldersRes) ? foldersRes : (foldersRes?.data ?? []));
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchSearch = (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || doc.type === typeFilter;
    const matchFolder = selectedFolderId === null || doc.folderId === selectedFolderId;
    return matchSearch && matchType && matchFolder;
  });

  // Group documents by date for timeline
  const groupedByDate = filteredDocuments.reduce<Record<string, any[]>>((acc, doc) => {
    const date = new Date(doc.createdAt).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(doc);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const da = a.split('/').reverse().join('-');
    const db = b.split('/').reverse().join('-');
    return db.localeCompare(da);
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const toggleFolder = (folderId: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folderId)) next.delete(folderId);
    else next.add(folderId);
    setExpandedFolders(next);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const data: any = { name: newFolderName };
      if (newFolderParentId) data.parentId = newFolderParentId;
      await api.createDocumentFolder(data);
      toast.success('Pasta criada!');
      setNewFolderName('');
      setNewFolderParentId('');
      setShowNewFolder(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao criar pasta.');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Excluir esta pasta e seus documentos?')) return;
    try {
      await api.deleteDocumentFolder(folderId);
      toast.success('Pasta excluída.');
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir pasta.');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Excluir este documento?')) return;
    try {
      await api.deleteDocument(docId);
      toast.success('Documento excluído.');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir documento.');
    }
  };

  const handleDownload = async (doc: any) => {
    if (!doc.url) {
      toast.error('URL do documento não disponível.');
      return;
    }

    try {
      toast.info('Iniciando download...');
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download concluído!');
    } catch (err) {
      console.error('Download error:', err);
      // Fallback to simple link if fetch fails (e.g. CORS)
      window.open(doc.url, '_blank');
    }
  };

  const categoryCounts = Object.keys(categoryLabels).reduce<Record<string, number>>((acc, key) => {
    acc[key] = documents.filter(d => d.type === key).length;
    return acc;
  }, {});

  const renderFolderTree = (folderList: FolderNode[], depth = 0) => {
    return folderList.map((folder) => {
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;
      const hasChildren = folder.children && folder.children.length > 0;

      return (
        <div key={folder.id}>
          <div
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors group ${isSelected
              ? 'bg-amber-100 text-amber-800 font-medium'
              : 'hover:bg-slate-100 text-slate-600'
              }`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => {
              setSelectedFolderId(isSelected ? null : folder.id);
              setMobileSidebarOpen(false);
            }}
          >
            <button
              className="p-0.5 hover:bg-slate-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleFolder(folder.id);
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )
              ) : (
                <span className="w-3.5 h-3.5 inline-block" />
              )}
            </button>
            <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate flex-1">{folder.name}</span>
            <button
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(folder.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {isExpanded && hasChildren && renderFolderTree(folder.children!, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-sm text-slate-500">Gerencie todos os documentos do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            onClick={() => setShowUploadDialog(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
        {Object.entries(categoryLabels).filter(([key]) => categoryCounts[key] > 0).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Card
              key={key}
              className={`cursor-pointer hover:shadow-md transition-shadow ${typeFilter === key ? 'ring-2 ring-amber-400' : ''
                }`}
              onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{config.label}</p>
                  <p className="text-xs text-slate-500">{categoryCounts[key]} arquivos</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <FolderOpen className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content: Sidebar + Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-3" />
          <span className="text-slate-500">Carregando documentos...</span>
        </div>
      ) : (
        <div className="flex gap-6 relative">
          {/* Mobile Sidebar Overlay */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Folder Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
            md:relative md:inset-auto md:z-auto md:w-64 md:shadow-none md:transform-none md:transition-none md:bg-transparent
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            shrink-0 overflow-y-auto
          `}>
            {/* Mobile close button */}
            <div className="flex items-center justify-between p-3 md:hidden border-b">
              <h3 className="font-semibold text-slate-700">Pastas</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Card className="border-0 shadow-none md:border md:shadow-sm">
              <CardContent className="p-3">
                <div className="hidden md:flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-slate-700">Pastas</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowNewFolder(!showNewFolder)}
                  >
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Mobile new folder button */}
                <div className="flex md:hidden items-center justify-end mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setShowNewFolder(!showNewFolder)}
                  >
                    <FolderPlus className="w-4 h-4 mr-1" />
                    Nova pasta
                  </Button>
                </div>

                {showNewFolder && (
                  <div className="mb-3 space-y-2">
                    <Input
                      placeholder="Nome da pasta"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                    {folders.length > 0 && (
                      <Select
                        value={newFolderParentId}
                        onValueChange={(v) => setNewFolderParentId(v === 'none' ? '' : v)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Pasta pai (raiz)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Raiz</SelectItem>
                          {folders.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 text-xs flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={handleCreateFolder}>
                        Criar
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowNewFolder(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* All documents */}
                <div
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${selectedFolderId === null
                    ? 'bg-amber-100 text-amber-800 font-medium'
                    : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  onClick={() => {
                    setSelectedFolderId(null);
                    setMobileSidebarOpen(false);
                  }}
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Todos os documentos</span>
                  <span className="ml-auto text-xs text-slate-400">{documents.length}</span>
                </div>

                <div className="mt-1 border-t pt-1">
                  {folders.length > 0 ? (
                    renderFolderTree(folders)
                  ) : (
                    <p className="text-xs text-slate-400 px-2 py-2">Nenhuma pasta criada</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents Timeline */}
          <div className="flex-1 min-w-0">
            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mb-3# " />
                <p className="text-lg font-medium">Nenhum documento encontrado</p>
                <p className="text-sm">Clique em "Upload" para adicionar o primeiro.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date}>
                    {/* Timeline Date Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 bg-amber-400 rounded-full border-2 border-amber-200" />
                      <h3 className="text-sm font-semibold text-slate-500">{date}</h3>
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-xs text-slate-400">
                        {groupedByDate[date].length} arquivo(s)
                      </span>
                    </div>

                    {/* Document Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-3 md:ml-6 border-l-2 border-slate-100 pl-3 md:pl-5">
                      {groupedByDate[date].map((doc: any) => {
                        const cat = categoryLabels[doc.type] || categoryLabels.other;
                        const CatIcon = cat.icon;
                        return (
                          <Card key={doc.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                                  <CatIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate" title={doc.name}>
                                    {doc.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {cat.label}
                                    </Badge>
                                    <span className="text-xs text-slate-400">
                                      {formatSize(doc.size)}
                                    </span>
                                  </div>
                                  {doc.folder && (
                                    <p className="text-xs text-amber-500 mt-1">
                                      📁 {doc.folder.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => handleDownload(doc)}
                                >
                                  <Download className="w-3.5 h-3.5 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-400 hover:text-red-600"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <UploadDocumentDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onDocumentCreated={loadData}
        preselectedFolderId={selectedFolderId || undefined}
      />
    </div>
  );
}
