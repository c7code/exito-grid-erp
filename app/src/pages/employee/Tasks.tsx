import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Play,
  Loader2,
} from 'lucide-react';
import { api } from '@/api';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-blue-500' },
  medium: { label: 'Média', color: 'bg-amber-500' },
  high: { label: 'Alta', color: 'bg-red-500' },
};

// Live timer component for in-progress tasks
function LiveTimer({ startedAt, baseHours = 0 }: { startedAt: number; baseHours?: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const totalSeconds = elapsed + Math.floor(baseHours * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <span className="font-mono text-blue-600 font-semibold">
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const taskTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMyTasks();
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setTasks(list);
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Initialize timers for tasks already in_progress (using startedAt from backend or now)
  useEffect(() => {
    tasks.forEach((task) => {
      if (task.status === 'in_progress' && !taskTimers.current[task.id]) {
        // If the backend provides startedAt, use it; otherwise approximate from actualHours
        if (task.startedAt) {
          taskTimers.current[task.id] = new Date(task.startedAt).getTime();
        } else {
          // Approximate: started (actualHours) ago
          const hoursAgo = (task.actualHours || 0) * 3600 * 1000;
          taskTimers.current[task.id] = Date.now() - hoursAgo;
        }
      }
    });
  }, [tasks]);

  const handleStartTask = async (taskId: string) => {
    try {
      setUpdatingTaskId(taskId);
      const now = Date.now();
      await api.updateTask(taskId, { status: 'in_progress', startedAt: new Date(now).toISOString() });
      taskTimers.current[taskId] = now;
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'in_progress', startedAt: new Date(now).toISOString() } : t))
      );
    } catch (error) {
      console.error('Erro ao iniciar tarefa:', error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setUpdatingTaskId(taskId);
      // Calculate total hours worked
      const startTime = taskTimers.current[taskId];
      const task = tasks.find((t) => t.id === taskId);
      const baseHours = task?.actualHours || 0;
      let totalHours = baseHours;
      if (startTime) {
        const elapsedHours = (Date.now() - startTime) / (1000 * 3600);
        totalHours = baseHours + elapsedHours;
      }
      totalHours = Math.round(totalHours * 100) / 100; // round to 2 decimals
      await api.updateTask(taskId, { status: 'completed', actualHours: totalHours });
      delete taskTimers.current[taskId];
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed', actualHours: totalHours } : t))
      );
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter((task) =>
    (task.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

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
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Minhas Tarefas</h1>
        <p className="text-slate-500">Gerencie suas tarefas diárias</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressTasks}</p>
              <p className="text-sm text-slate-500">Em Andamento</p>
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
              <p className="text-sm text-slate-500">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingTasks}</p>
              <p className="text-sm text-slate-500">Pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                    Nenhuma tarefa encontrada.
                  </TableCell>
                </TableRow>
              )}
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <p className="font-medium">{task.title}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-500">{task.work?.code || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[task.status]?.variant || 'outline'}>
                      {statusLabels[task.status]?.label || task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${priorityLabels[task.priority]?.color || 'bg-slate-400'}`} />
                      {priorityLabels[task.priority]?.label || task.priority || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {task.status === 'in_progress' && taskTimers.current[task.id] ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                          <LiveTimer startedAt={taskTimers.current[task.id]} baseHours={task.actualHours || 0} />
                          <span className="text-slate-400">/ {task.estimatedHours || '-'} h</span>
                        </>
                      ) : (
                        <span>{task.actualHours ? `${Number(task.actualHours).toFixed(1)}h` : '0h'} / {task.estimatedHours || '-'} h</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingTaskId === task.id}
                        onClick={() => handleStartTask(task.id)}
                      >
                        {updatingTaskId === task.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-1" />
                        )}
                        Iniciar
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        disabled={updatingTaskId === task.id}
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        {updatingTaskId === task.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                        )}
                        Concluir
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Badge variant="outline" className="text-emerald-600">Concluída</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
