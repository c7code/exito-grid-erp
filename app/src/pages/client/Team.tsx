import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/api';

export default function ClientTeam() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getClientMyPublications('employee_doc');
        const items = (Array.isArray(data) ? data : []).map((p: any) => ({
          ...p,
          employeeName: p.metadata?.employeeName || p.title,
          documentType: p.metadata?.documentType || 'Documento',
          fileName: p.metadata?.fileName || p.title,
          url: p.metadata?.url || null,
        }));
        setEmployees(items);
      } catch { /* empty */ }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  // Group by employee name
  const grouped: Record<string, any[]> = {};
  employees.forEach(emp => {
    const name = emp.employeeName || 'Sem Nome';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(emp);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Equipe da Obra</h1>
        <p className="text-slate-500">Documentos dos funcionários vinculados às suas obras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{Object.keys(grouped).length}</p>
              <p className="text-sm text-slate-500">Funcionários</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold">{employees.length}</p>
              <p className="text-sm text-slate-500">Documentos Disponíveis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {employees.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><Users className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Nenhum documento de equipe disponível</p></CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([name, docs]) => (
            <Card key={name}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                    <p className="text-sm text-slate-500">{docs.length} documento(s)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {docs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{doc.documentType}</p>
                          <p className="text-xs text-slate-400">{doc.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString('pt-BR') : '-'}
                        </Badge>
                        {doc.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
