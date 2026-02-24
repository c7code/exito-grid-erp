import { useState, useEffect } from 'react';
import NewWorkDialog from '@/components/NewWorkDialog';
import EditWorkDialog from '@/components/EditWorkDialog';
import DeleteWorkDialog from '@/components/DeleteWorkDialog';
import WorkProgressDialog from '@/components/WorkProgressDialog';
import { Link } from 'react-router-dom';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';
import type { Client } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  MapPin,
  ArrowRight,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  pending: { label: 'Pendente', variant: 'secondary' },
  pending_approval: { label: 'Aguardando Aprovação', variant: 'secondary' },
  approved: { label: 'Aprovada', variant: 'default' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  on_hold: { label: 'Pausada', variant: 'secondary' },
  waiting_utility: { label: 'Aguardando Concessionária', variant: 'secondary' },
  waiting_client: { label: 'Aguardando Cliente', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const typeLabels: Record<string, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  pde_bt: 'PDE BT',
  pde_at: 'PDE AT',
  project_bt: 'Projeto BT',
  project_mt: 'Projeto MT',
  project_at: 'Projeto AT',
  solar: 'Solar',
  network_donation: 'Doação de Rede',
  network_work: 'Obra de Rede',
  report: 'Laudo',
  spda: 'SPDA',
  grounding: 'Aterramento',
  maintenance: 'Manutenção',
};

export default function AdminWorks() {
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClientViewerOpen, setIsClientViewerOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Edit / Delete / Progress dialog states
  const [editWork, setEditWork] = useState<any>(null);
  const [deleteWork, setDeleteWork] = useState<any>(null);
  const [progressWork, setProgressWork] = useState<any>(null);

  const fetchWorks = async () => {
    try {
      const data = await api.getWorks();
      setWorks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
      toast.error('Erro ao carregar obras.');
      setWorks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  const handleWorkCreated = () => {
    fetchWorks();
  };

  const filteredWorks = works.filter((work) => {
    const matchesSearch =
      (work.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (work.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (work.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || work.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeWorksCount = works.filter(w => w.status === 'in_progress').length;
  const completedWorksCount = works.filter(w => w.status === 'completed').length;
  const pendingWorksCount = works.filter(w => w.status === 'pending' || w.status === 'pending_approval').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Obras</h1>
          <p className="text-slate-500">Gerencie todas as obras do sistema</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-slate-900"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Obra
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{works.length}</p>
              <p className="text-sm text-slate-500">Total de Obras</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeWorksCount}</p>
              <p className="text-sm text-slate-500">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedWorksCount}</p>
              <p className="text-sm text-slate-500">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingWorksCount}</p>
              <p className="text-sm text-slate-500">Pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por código, título ou cliente..."
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
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
            <SelectItem value="approved">Aprovada</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Works Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="ml-2 text-slate-500">Carregando obras...</span>
            </div>
          ) : filteredWorks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {works.length === 0
                ? 'Nenhuma obra cadastrada. Clique em "+ Nova Obra" para começar.'
                : 'Nenhuma obra encontrada com os filtros aplicados.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell className="font-medium">{work.code || '—'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{work.title}</p>
                        <p className="text-sm text-slate-500">
                          {[work.city, work.state].filter(Boolean).join(', ') || '—'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 group/client">
                        <Avatar className="w-6 h-6 shrink-0 border border-white shadow-sm">
                          <AvatarFallback className="bg-amber-100 text-amber-600 text-[8px] font-bold">
                            {work.client?.name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-600 truncate max-w-[120px]">{work.client?.name || '—'}</span>
                        {work.client && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-5 h-5 opacity-0 group-hover/client:opacity-100 text-slate-300 hover:text-amber-500 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingClient(work.client);
                              setIsClientViewerOpen(true);
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[work.type] || work.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[work.status]?.variant || 'outline'}>
                        {statusLabels[work.status]?.label || work.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{work.progress || 0}%</span>
                        </div>
                        <Progress value={work.progress || 0} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      R$ {Number(work.totalValue || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/works/${work.id}`}>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditWork(work)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setProgressWork(work)}>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Atualizar Progresso
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteWork(work)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NewWorkDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onWorkCreated={handleWorkCreated}
      />

      {editWork && (
        <EditWorkDialog
          open={!!editWork}
          onOpenChange={(open) => !open && setEditWork(null)}
          work={editWork}
          onWorkUpdated={fetchWorks}
        />
      )}

      {deleteWork && (
        <DeleteWorkDialog
          open={!!deleteWork}
          onOpenChange={(open) => !open && setDeleteWork(null)}
          work={deleteWork}
          onWorkDeleted={fetchWorks}
        />
      )}

      {progressWork && (
        <WorkProgressDialog
          open={!!progressWork}
          onOpenChange={(open) => !open && setProgressWork(null)}
          work={progressWork}
          onProgressUpdated={fetchWorks}
        />
      )}

      <ClientDetailViewer
        open={isClientViewerOpen}
        onOpenChange={setIsClientViewerOpen}
        client={viewingClient}
      />
    </div>
  );
}
