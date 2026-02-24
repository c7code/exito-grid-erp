import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/api';

export default function ClientDashboard() {
  const [works, setWorks] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [worksData, requestsData] = await Promise.all([
          api.getClientMyWorks(),
          api.getClientMyRequests(),
        ]);
        setWorks(worksData || []);
        setRequests(requestsData || []);
      } catch (err) {
        console.error('Erro ao carregar dados do portal:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const activeWorks = works.filter(w => w.status === 'in_progress');
  const completedWorks = works.filter(w => w.status === 'completed');
  const openRequests = requests.filter(r => r.status === 'open' || r.status === 'in_progress');

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    planning: { label: 'Planejamento', variant: 'outline' },
    in_progress: { label: 'Em Andamento', variant: 'secondary' },
    completed: { label: 'Concluída', variant: 'default' },
    on_hold: { label: 'Pausada', variant: 'outline' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Bem-vindo!</h1>
        <p className="text-slate-500">Acompanhe suas obras em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{works.length}</p>
              <p className="text-sm text-slate-500">Minhas Obras</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedWorks.length}</p>
              <p className="text-sm text-slate-500">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeWorks.length}</p>
              <p className="text-sm text-slate-500">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openRequests.length}</p>
              <p className="text-sm text-slate-500">Solicitações Abertas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Minhas Obras</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/client/works">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {works.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhuma obra encontrada</p>
            ) : (
              <div className="space-y-4">
                {works.slice(0, 3).map((work: any) => (
                  <div key={work.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-medium text-slate-500">{work.code}</span>
                        <p className="font-medium">{work.title}</p>
                        <p className="text-sm text-slate-500">{work.address}</p>
                      </div>
                      <Badge variant={statusLabels[work.status]?.variant || 'outline'}>
                        {statusLabels[work.status]?.label || work.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Progresso</span>
                        <span>{work.progress || 0}%</span>
                      </div>
                      <Progress value={work.progress || 0} className="h-2" />
                    </div>
                    <div className="mt-4">
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link to={`/client/works/${work.id}`}>Ver Detalhes</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Solicitações Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/client/requests">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhuma solicitação</p>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 5).map((req: any) => {
                  const statusColors: Record<string, string> = {
                    open: 'bg-blue-100 text-blue-700',
                    in_progress: 'bg-amber-100 text-amber-700',
                    resolved: 'bg-emerald-100 text-emerald-700',
                    closed: 'bg-slate-100 text-slate-700',
                  };
                  return (
                    <div key={req.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{req.subject}</p>
                        <Badge className={statusColors[req.status] || 'bg-slate-100'}>
                          {req.status === 'open' ? 'Aberta' : req.status === 'in_progress' ? 'Em Análise' : req.status === 'resolved' ? 'Resolvida' : 'Fechada'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{req.description?.substring(0, 100)}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
