import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import { api } from '@/api';

const taskStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  planning: { label: 'Planejamento', variant: 'outline' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
  on_hold: { label: 'Pausada', variant: 'outline' },
};

export default function ClientWorkDetail() {
  const { id } = useParams();
  const [work, setWork] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWork = async () => {
      try {
        const data = await api.getClientMyWork(id!);
        setWork(data);
      } catch (err) {
        console.error('Erro ao carregar obra:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadWork();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Obra não encontrada</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/client/works">Voltar</Link>
        </Button>
      </div>
    );
  }

  const tasks = work.tasks || [];
  const documents = work.documents || [];
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/client/works">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">{work.title}</h1>
              <Badge variant={statusLabels[work.status]?.variant || 'outline'}>
                {statusLabels[work.status]?.label || work.status}
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
            {tasks.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-slate-500">Tarefas Concluídas</p>
                <p className="text-xl font-semibold">{completedTasks} de {tasks.length}</p>
              </div>
            )}
          </div>
          <Progress value={work.progress || 0} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="tasks">Etapas ({tasks.length})</TabsTrigger>
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
                {work.address && (
                  <div>
                    <p className="text-sm text-slate-500">Endereço</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {work.address}{work.city ? `, ${work.city}` : ''}{work.state ? ` - ${work.state}` : ''}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Data de Início</p>
                    <p className="font-medium">{work.startDate ? new Date(work.startDate).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Prazo Estimado</p>
                    <p className="font-medium">{work.estimatedDeadline ? new Date(work.estimatedDeadline).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Valor do Projeto</p>
                  <p className="font-medium text-lg">R$ {(work.estimatedValue || 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">Para dúvidas sobre esta obra, entre em contato:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>(11) 99999-9999</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>contato@electraflow.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <h3 className="text-lg font-semibold">Etapas da Obra</h3>
          {tasks.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhuma etapa cadastrada</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any, index: number) => (
                <Card key={task.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${task.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
                        {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <Badge variant={taskStatusLabels[task.status]?.variant || 'outline'}>
                          {taskStatusLabels[task.status]?.label || task.status}
                        </Badge>
                        {task.resolvers && task.resolvers.length > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            👷 {task.resolvers.map((r: any) => r.employee?.name).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <h3 className="text-lg font-semibold mb-4">Documentos da Obra</h3>
          {documents.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhum documento disponível</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc: any) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
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
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
