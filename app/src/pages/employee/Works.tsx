import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  Building2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { api } from '@/api';

export default function EmployeeWorks() {
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMyWorks();
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setWorks(list);
      } catch (error) {
        console.error('Erro ao carregar obras:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredWorks = works.filter((work) =>
    (work.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (work.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeWorks = works.filter(w => w.status === 'in_progress').length;
  const completedWorks = works.filter(w => w.status === 'completed').length;

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
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Minhas Obras</h1>
        <p className="text-slate-500">Obras atribuídas a você</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeWorks}</p>
              <p className="text-sm text-slate-500">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedWorks}</p>
              <p className="text-sm text-slate-500">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar obras..."
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
                <TableHead>Código</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    Nenhuma obra encontrada.
                  </TableCell>
                </TableRow>
              )}
              {filteredWorks.map((work) => (
                <TableRow key={work.id}>
                  <TableCell className="font-medium">{work.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{work.title}</p>
                      <p className="text-sm text-slate-500">{work.city}{work.state ? `, ${work.state}` : ''}</p>
                    </div>
                  </TableCell>
                  <TableCell>{work.client?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{work.progress || 0}%</span>
                      </div>
                      <Progress value={work.progress || 0} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/employee/works/${work.id}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
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
