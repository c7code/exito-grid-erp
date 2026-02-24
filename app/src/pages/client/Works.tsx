import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  ArrowRight,
  MapPin,
  Calendar,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { api } from '@/api';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  planning: { label: 'Planejamento', variant: 'outline' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
  on_hold: { label: 'Pausada', variant: 'outline' },
};

export default function ClientWorks() {
  const [works, setWorks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWorks = async () => {
      try {
        const data = await api.getClientMyWorks();
        setWorks(data || []);
      } catch (err) {
        console.error('Erro ao carregar obras:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadWorks();
  }, []);

  const activeCount = works.filter(w => w.status === 'in_progress').length;
  const completedCount = works.filter(w => w.status === 'completed').length;

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
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Minhas Obras</h1>
        <p className="text-slate-500">Acompanhe o progresso das suas obras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{works.length}</p>
              <p className="text-sm text-slate-500">Total de Obras</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-slate-500">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-slate-500">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {works.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma obra encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {works.map((work: any) => (
            <Card key={work.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-500">{work.code}</span>
                      <Badge variant={statusLabels[work.status]?.variant || 'outline'}>
                        {statusLabels[work.status]?.label || work.status}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold">{work.title}</h3>
                    {work.address && (
                      <div className="flex items-center gap-2 text-slate-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        {work.address}{work.city ? `, ${work.city}` : ''}{work.state ? ` - ${work.state}` : ''}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/client/works/${work.id}`}>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Progresso da Obra</span>
                    <span className="font-medium">{work.progress || 0}%</span>
                  </div>
                  <Progress value={work.progress || 0} className="h-3" />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Data de Início</p>
                    <p className="font-medium">{work.startDate ? new Date(work.startDate).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Prazo Estimado</p>
                    <p className="font-medium">{work.estimatedDeadline ? new Date(work.estimatedDeadline).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Valor</p>
                    <p className="font-medium">R$ {(work.estimatedValue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
