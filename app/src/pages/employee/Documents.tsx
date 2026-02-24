import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import { api } from '@/api';

export default function EmployeeDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // First get employee's works, then fetch documents for each
        const worksData = await api.getMyWorks();
        const works = Array.isArray(worksData) ? worksData : (worksData?.data ?? []);

        const allDocs: any[] = [];
        for (const work of works) {
          try {
            const docs = await api.getDocumentsByWork(work.id);
            const docList = Array.isArray(docs) ? docs : (docs?.data ?? []);
            // Tag each doc with its work info
            docList.forEach((d: any) => {
              allDocs.push({ ...d, workCode: work.code, workTitle: work.title });
            });
          } catch {
            // Skip works without documents endpoint
          }
        }
        setDocuments(allDocs);
      } catch (error) {
        console.error('Erro ao carregar documentos:', error);
      } finally {
        setLoading(false);
      }
    })();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Meus Documentos</h1>
        <p className="text-sm text-slate-500">Documentos das suas obras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Total</p>
              <p className="text-sm text-slate-500">{documents.length} arquivos</p>
            </div>
          </CardContent>
        </Card>
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

      {filteredDocuments.length === 0 && (
        <p className="text-sm text-slate-400 py-8 text-center">Nenhum documento encontrado.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-100">
                  <FileText className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" title={doc.name || doc.fileName}>{doc.name || doc.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{doc.type || 'Documento'}</Badge>
                    <span className="text-xs text-slate-500">{formatSize(doc.size || 0)}</span>
                  </div>
                  {doc.workCode && (
                    <p className="text-xs text-slate-400 mt-1">📋 {doc.workCode}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
              </div>
              {doc.url && doc.url !== '#' && (
                <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
