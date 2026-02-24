import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/api';

export default function EmployeeDashboard() {
  const [works, setWorks] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [w, t] = await Promise.allSettled([
          api.getMyWorks(),
          api.getMyTasks(),
        ]);
        setWorks(w.status === 'fulfilled' ? (Array.isArray(w.value) ? w.value : w.value?.data ?? []) : []);
        setTasks(t.status === 'fulfilled' ? (Array.isArray(t.value) ? t.value : t.value?.data ?? []) : []);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Meu Dashboard</h1>
        <p className="text-slate-500">Visão geral das suas atividades</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{works.length}</p>
              <p className="text-sm text-slate-500">Minhas Obras</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTasks}</p>
              <p className="text-sm text-slate-500">Tarefas Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingTasks}</p>
              <p className="text-sm text-slate-500">Tarefas Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressTasks}</p>
              <p className="text-sm text-slate-500">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Minhas Obras</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/employee/works">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {works.length === 0 && <p className="text-sm text-slate-400">Nenhuma obra atribuída.</p>}
              {works.slice(0, 5).map((work) => (
                <div key={work.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-medium text-slate-500">{work.code}</span>
                      <p className="font-medium">{work.title}</p>
                    </div>
                    <Badge variant={work.status === 'completed' ? 'default' : 'secondary'}>
                      {work.status === 'in_progress' ? 'Em Andamento' : work.status === 'completed' ? 'Concluída' : work.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Progresso</span>
                      <span>{work.progress || 0}%</span>
                    </div>
                    <Progress value={work.progress || 0} className="h-2" />
                    {work.deadline && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        Prazo: {new Date(work.deadline).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Minhas Tarefas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/employee/tasks">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.length === 0 && <p className="text-sm text-slate-400">Nenhuma tarefa atribuída.</p>}
              {tasks.filter(t => t.status !== 'completed').slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    {task.work && <p className="text-xs text-slate-400">{task.work.code} — {task.work.title}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      {task.dueDate && (
                        <span className="text-sm text-slate-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
