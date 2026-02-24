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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Link2Off,
  Loader2,
  Pencil,
  Check,
  Trash2,
  Percent,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import type { Task, Client } from '@/types';
import NewTaskDialog from '@/components/NewTaskDialog';
import TaskActionDialog from '@/components/TaskActionDialog';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-blue-500' },
  medium: { label: 'Média', color: 'bg-amber-500' },
  high: { label: 'Alta', color: 'bg-red-500' },
  urgent: { label: 'Urgente', color: 'bg-purple-500' },
};

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isClientViewerOpen, setIsClientViewerOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasks();
      const taskList = Array.isArray(data) ? data : (data?.data ?? []);
      setTasks(taskList);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Erro ao carregar tarefas. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  const handleTaskCreated = () => {
    loadTasks();
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditDialog(true);
  };

  const handleCompleteTask = async (task: Task) => {
    try {
      await api.updateTask(task.id, { status: 'completed' });
      if (task.workId && task.weightPercentage) {
        toast.success(`Tarefa concluída! Progresso da obra atualizado (+${task.weightPercentage}%).`);
      } else {
        toast.success('Tarefa concluída!');
      }
      loadTasks();
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      toast.error('Erro ao concluir tarefa.');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) return;
    try {
      await api.deleteTask(task.id);
      toast.success('Tarefa excluída com sucesso.');
      loadTasks();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Tarefas</h1>
          <p className="text-slate-500">Gerencie todas as tarefas do sistema</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-slate-900"
          onClick={() => setShowNewTaskDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
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

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-3" />
              <span className="text-slate-500">Carregando tarefas...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ClipboardList className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
              <p className="text-sm">Clique em "Nova Tarefa" para criar a primeira.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>% Obra</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <p className="font-medium">{task.title}</p>
                    </TableCell>
                    <TableCell>
                      {task.work ? (
                        <div className="flex items-center gap-2 group/client">
                          <Avatar className="w-5 h-5 shrink-0 border border-white shadow-sm">
                            <AvatarFallback className="bg-amber-100 text-amber-600 text-[8px] font-bold">
                              {task.work?.client?.name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-slate-700 truncate max-w-[100px]">
                            {task.work?.code || task.work?.title}
                          </span>
                          {task.work?.client && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-4 h-4 opacity-0 group-hover/client:opacity-100 text-slate-300 hover:text-amber-500 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingClient(task.work?.client as any);
                                setIsClientViewerOpen(true);
                              }}
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Link2Off className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-400">Independente</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.workId && task.weightPercentage ? (
                        <div className="flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {Number(task.weightPercentage)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[task.status]?.variant ?? 'outline'}>
                        {statusLabels[task.status]?.label ?? task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${priorityLabels[task.priority]?.color ?? 'bg-slate-400'}`} />
                        {priorityLabels[task.priority]?.label ?? task.priority}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.actualHours || 0} / {task.estimatedHours || '-'} h
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTask(task)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {task.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => handleCompleteTask(task)}>
                              <Check className="w-4 h-4 mr-2" />
                              Concluir
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDeleteTask(task)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewTaskDialog
        open={showNewTaskDialog}
        onOpenChange={setShowNewTaskDialog}
        onTaskCreated={handleTaskCreated}
      />

      <TaskActionDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={editingTask}
        onTaskUpdated={handleTaskUpdated}
      />

      <ClientDetailViewer
        open={isClientViewerOpen}
        onOpenChange={setIsClientViewerOpen}
        client={viewingClient}
      />
    </div>
  );
}
