import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  Image,
  Download,
  Loader2,
} from 'lucide-react';
import { api } from '@/api';

const categoryLabels: Record<string, { label: string; color: string; icon: any }> = {
  project: { label: 'Projeto', color: 'bg-blue-100 text-blue-700', icon: FileText },
  contract: { label: 'Contrato', color: 'bg-emerald-100 text-emerald-700', icon: FileText },
  other: { label: 'Documento', color: 'bg-slate-100 text-slate-700', icon: FileText },
  photo: { label: 'Foto', color: 'bg-purple-100 text-purple-700', icon: Image },
};

export default function ClientDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        // Fetch all works to get their documents
        const works = await api.getClientMyWorks();
        const allDocs: any[] = [];
        for (const work of (works || [])) {
          try {
            const workDetail = await api.getClientMyWork(work.id);
            const docs = workDetail?.documents || [];
            docs.forEach((doc: any) => {
              allDocs.push({ ...doc, workTitle: work.title, workCode: work.code });
            });
          } catch {
            // skip
          }
        }
        setDocuments(allDocs);
      } catch (err) {
        console.error('Erro ao carregar documentos:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDocs();
  }, []);

  const filteredDocuments = documents.filter((doc) =>
    (doc.name || doc.fileName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Meus Documentos</h1>
        <p className="text-sm text-slate-500">Acesse todos os documentos das suas obras</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
        {Object.entries(categoryLabels).map(([key, config]) => {
          const Icon = config.icon;
          const count = documents.filter(d => (d.type || 'other') === key).length;
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-sm text-slate-500">{count} arquivos</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum documento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const category = categoryLabels[(doc.type as string) || 'other'] || categoryLabels.other;
            const Icon = category?.icon || FileText;
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category?.color || 'bg-slate-100'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" title={doc.name || doc.fileName}>{doc.name || doc.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{category?.label || 'Documento'}</Badge>
                        <span className="text-xs text-slate-500">{formatSize(doc.size || 0)}</span>
                      </div>
                      {doc.workTitle && (
                        <p className="text-xs text-slate-400 mt-1">📋 {doc.workCode} — {doc.workTitle}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                  </div>
                  {doc.url && (
                    <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
