import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Phone,
  MoreHorizontal,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Loader2,
  Edit2,
  Trash2,
  User,
  Heart,
  Shield,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/api';
import type { Employee } from '@/types';
import { toast } from 'sonner';
import { EmployeeDialog } from '@/components/EmployeeDialog';
import { EmployeeDocumentViewer } from '@/components/EmployeeDocumentViewer';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este funcionário?')) return;
    try {
      await api.deleteEmployee(id);
      toast.success('Funcionário removido');
      loadEmployees();
    } catch (error) {
      toast.error('Erro ao remover funcionário');
    }
  }

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = employees.filter(e => e.status === 'active').length;

  if (loading && employees.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Funcionários</h1>
          <p className="text-slate-500">Gerencie os colaboradores e documentações técnicas</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
          onClick={() => {
            setSelectedEmployee(undefined);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-blue-50/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{employees.length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total Geral</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{activeCount}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{employees.length - activeCount}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Inativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-900">12</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Alocações</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-slate-200"
        />
      </div>

      <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">Funcionário</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">Cargo / Função</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">Contato</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">Status</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">Doc. Pendentes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
                        <AvatarFallback className="bg-amber-500 text-slate-900 font-bold">
                          {employee.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-slate-700">{employee.name}</p>
                        <p className="text-xs text-slate-400">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Badge variant="outline" className="capitalize w-fit text-[10px] font-bold bg-white">
                        {employee.role}
                      </Badge>
                      {employee.specialty && <span className="text-[10px] text-slate-400 mt-1">{employee.specialty}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {employee.phone || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-bold text-[10px] uppercase",
                      employee.status === 'active' ? "bg-emerald-500" : "bg-slate-400"
                    )}>
                      {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100/80 p-1 rounded transition-colors w-fit"
                      onClick={() => {
                        setViewingEmployee(employee);
                        setIsViewerOpen(true);
                      }}
                    >
                      <div className="flex -space-x-2">
                        {/* Mini indicators for docs */}
                        <div className={cn("w-5 h-5 rounded-full border-2 border-white flex items-center justify-center bg-slate-100", employee.documents?.some(d => d.type === 'identification') && "bg-blue-100")} title="ID">
                          <User className={cn("w-2.5 h-2.5 text-slate-300", employee.documents?.some(d => d.type === 'identification') && "text-blue-500")} />
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 border-white flex items-center justify-center bg-slate-100",
                          employee.documents?.some(d => d.type === 'health') && "bg-red-100",
                          employee.documents?.some(d => d.type === 'health' && d.expiryDate && new Date(d.expiryDate) < new Date()) && "bg-red-500 animate-pulse"
                        )} title="Saúde">
                          <Heart className={cn(
                            "w-2.5 h-2.5 text-slate-300",
                            employee.documents?.some(d => d.type === 'health') && "text-red-500",
                            employee.documents?.some(d => d.type === 'health' && d.expiryDate && new Date(d.expiryDate) < new Date()) && "text-white"
                          )} />
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 border-white flex items-center justify-center bg-slate-100",
                          employee.documents?.some(d => d.type === 'safety') && "bg-emerald-100",
                          employee.documents?.some(d => d.type === 'safety' && d.expiryDate && new Date(d.expiryDate) < new Date()) && "bg-red-500 animate-pulse"
                        )} title="Segurança">
                          <Shield className={cn(
                            "w-2.5 h-2.5 text-slate-300",
                            employee.documents?.some(d => d.type === 'safety') && "text-emerald-500",
                            employee.documents?.some(d => d.type === 'safety' && d.expiryDate && new Date(d.expiryDate) < new Date()) && "text-white"
                          )} />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-amber-500">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => {
                          setViewingEmployee(employee);
                          setIsViewerOpen(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" /> Visualizar Documentos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/employees/${employee.id}/compliance`)}>
                          <ShieldCheck className="w-4 h-4 mr-2" /> Documentação NR/SST
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedEmployee(employee);
                          setIsDialogOpen(true);
                        }}>
                          <Edit2 className="w-4 h-4 mr-2" /> Editar Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(employee.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    Nenhum funcionário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EmployeeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={loadEmployees}
        employee={selectedEmployee}
      />

      <EmployeeDocumentViewer
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        employee={viewingEmployee}
      />
    </div>
  );
}
