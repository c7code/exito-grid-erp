import { useState, useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ClipboardList, Calendar, UserCircle, Filter, Loader2,
  Building2, FileSignature, Package, FileText, Sun,
  Wrench, Target, Users, ClipboardCheck,
} from 'lucide-react';

const moduleIcons: Record<string, any> = {
  'Obra': Building2,
  'Proposta': FileSignature,
  'Contrato': FileSignature,
  'Material/Serviço': Package,
  'Cliente': Users,
  'Protocolo': FileText,
  'Documento': FileText,
  'Projeto Solar': Sun,
  'Oportunidade': Target,
  'Ordem de Serviço': Wrench,
  'Tarefa': ClipboardCheck,
};

const moduleColors: Record<string, string> = {
  'Obra': 'bg-blue-100 text-blue-700',
  'Proposta': 'bg-amber-100 text-amber-700',
  'Contrato': 'bg-purple-100 text-purple-700',
  'Material/Serviço': 'bg-emerald-100 text-emerald-700',
  'Cliente': 'bg-orange-100 text-orange-700',
  'Protocolo': 'bg-sky-100 text-sky-700',
  'Documento': 'bg-slate-100 text-slate-700',
  'Projeto Solar': 'bg-yellow-100 text-yellow-700',
  'Oportunidade': 'bg-rose-100 text-rose-700',
  'Ordem de Serviço': 'bg-indigo-100 text-indigo-700',
  'Tarefa': 'bg-teal-100 text-teal-700',
};

interface Activity {
  module: string;
  recordName: string;
  userId: string;
  userName: string;
  actionDate: string;
  actionType: string;
}

export default function ActivityReport() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [acts, usrs] = await Promise.allSettled([
        api.getActivityReport({
          userId: filterUser !== 'all' ? filterUser : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        api.getUsers(),
      ]);
      setActivities(acts.status === 'fulfilled' ? acts.value : []);
      setUsers(usrs.status === 'fulfilled' ? (Array.isArray(usrs.value) ? usrs.value : []) : []);
    } catch {
      toast.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleFilter = () => loadData();

  // Group by date
  const grouped = activities.reduce((acc: Record<string, Activity[]>, act) => {
    const date = new Date(act.actionDate).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(act);
    return acc;
  }, {});

  // Stats
  const uniqueUsers = [...new Set(activities.map(a => a.userId))].length;
  const moduleCounts = activities.reduce((acc: Record<string, number>, a) => {
    acc[a.module] = (acc[a.module] || 0) + 1;
    return acc;
  }, {});
  const topModule = Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            Relatório de Atividades
          </h1>
          <p className="text-sm text-slate-500">Acompanhe todas as ações realizadas por cada usuário no sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{activities.length}</p>
              <p className="text-xs font-bold text-blue-600/60 uppercase">Total Ações</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">{uniqueUsers}</p>
              <p className="text-xs font-bold text-amber-600/60 uppercase">Usuários Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-900">{Object.keys(grouped).length}</p>
              <p className="text-xs font-bold text-emerald-600/60 uppercase">Dias</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900 truncate max-w-[100px]">{topModule ? topModule[0] : '—'}</p>
              <p className="text-xs font-bold text-purple-600/60 uppercase">Mais Ativo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border shadow-sm">
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todos os usuários" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Usuários</SelectItem>
            {users.map((u: any) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="w-44"
          placeholder="Data início"
        />
        <Input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="w-44"
          placeholder="Data fim"
        />
        <Button onClick={handleFilter} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
          <Filter className="w-4 h-4 mr-2" /> Filtrar
        </Button>
      </div>

      {/* Activities Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-12 text-center text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhuma atividade encontrada</p>
            <p className="text-sm mt-1">Ajuste os filtros ou aguarde novos cadastros</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, acts]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{date}</h3>
                <Badge variant="secondary" className="text-[10px]">{acts.length} ações</Badge>
              </div>
              <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold w-[100px]">Hora</TableHead>
                        <TableHead className="font-bold">Módulo</TableHead>
                        <TableHead className="font-bold">Ação</TableHead>
                        <TableHead className="font-bold">Registro</TableHead>
                        <TableHead className="font-bold">Usuário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {acts.map((act, i) => {
                        const ModIcon = moduleIcons[act.module] || ClipboardList;
                        const colorClass = moduleColors[act.module] || 'bg-slate-100 text-slate-700';
                        return (
                          <TableRow key={i} className="hover:bg-slate-50/50">
                            <TableCell className="font-mono text-xs text-slate-500">
                              {new Date(act.actionDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${colorClass} gap-1.5 font-medium text-[11px]`}>
                                <ModIcon className="w-3 h-3" />
                                {act.module}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">
                                {act.actionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-sm text-slate-700 max-w-[250px] truncate">
                              {act.recordName || '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <UserCircle className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">{act.userName}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
