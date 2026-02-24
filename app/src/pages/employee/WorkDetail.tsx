import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  FileText,
  Loader2,
} from 'lucide-react';
import { api } from '@/api';

const taskStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
};

export default function EmployeeWorkDetail() {
  const { id } = useParams();
  const [work, setWork] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [w, t, d] = await Promise.allSettled([
          api.getWork(id),
          api.getTasksByWork(id),
          api.getDocumentsByWork(id),
        ]);
        if (w.status === 'fulfilled') setWork(w.value);
        if (t.status === 'fulfilled') setTasks(Array.isArray(t.value) ? t.value : (t.value?.data ?? []));
        if (d.status === 'fulfilled') setDocuments(Array.isArray(d.value) ? d.value : (d.value?.data ?? []));
      } catch (error) {
        console.error('Erro ao carregar obra:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Obra não encontrada.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/employee/works">Voltar</Link>
        </Button>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/employee/works">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">{work.title}</h1>
              <Badge>
                {work.status === 'in_progress' ? 'Em Andamento' : work.status === 'completed' ? 'Concluída' : work.status}
              </Badge>
            </div>
            <p className="text-slate-500">{work.code}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Progresso da Obra</p>
              <p className="text-3xl font-bold">{work.progress || 0}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Tarefas Concluídas</p>
              <p className="text-xl font-semibold">{completedTasks} de {tasks.length}</p>
            </div>
          </div>
          <Progress value={work.progress || 0} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas ({tasks.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados da Obra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {work.description && (
                  <div>
                    <p className="text-sm text-slate-500">Descrição</p>
                    <p className="text-slate-700">{work.description}</p>
                  </div>
                )}
                {(work.address || work.city) && (
                  <div>
                    <p className="text-sm text-slate-500">Endereço</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {work.address}{work.city ? `, ${work.city}` : ''}{work.state ? ` - ${work.state}` : ''}
                    </div>
                  </div>
                )}
                {work.estimatedValue && (
                  <div>
                    <p className="text-sm text-slate-500">Valor Estimado</p>
                    <p className="font-medium">R$ {Number(work.estimatedValue).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {work.client && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {(work.client.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{work.client.name}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {work.client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{work.client.phone}</span>
                      </div>
                    )}
                    {work.client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{work.client.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <h3 className="text-lg font-semibold">Tarefas</h3>
          {tasks.length === 0 && <p className="text-sm text-slate-400">Nenhuma tarefa nesta obra.</p>}
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <Card key={task.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={taskStatusLabels[task.status]?.variant || 'outline'}>
                          {taskStatusLabels[task.status]?.label || task.status}
                        </Badge>
                        {task.resolvers?.length > 0 && (
                          <span className="text-xs text-slate-400">
                            👷 {task.resolvers.map((r: any) => r.employee?.name || 'N/A').join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <h3 className="text-lg font-semibold mb-4">Documentos</h3>
          {documents.length === 0 && <p className="text-sm text-slate-400">Nenhum documento nesta obra.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name || doc.fileName}</p>
                      <p className="text-xs text-slate-400">
                        {doc.size ? ((doc.size / 1024 / 1024) < 1 ? (doc.size / 1024).toFixed(0) + ' KB' : (doc.size / 1024 / 1024).toFixed(2) + ' MB') : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
