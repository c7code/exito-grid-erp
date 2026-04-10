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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Download,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { api } from '@/api';
import type { Employee } from '@/types';
import { toast } from 'sonner';
import { EmployeeDialog } from '@/components/EmployeeDialog';
import { EmployeeDocumentViewer } from '@/components/EmployeeDocumentViewer';
import { EmployeePortalPublishDialog } from '@/components/EmployeePortalPublishDialog';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CATEGORY_LABELS: Record<string, string> = {
  identification: 'Identificação',
  health: 'Saúde Ocupacional',
  safety_nr: 'Segurança / NRs',
  epi_epc: 'EPI / EPC',
  qualification: 'Qualificação',
  other: 'Outros',
};

export default function AdminEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Download dialog
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedDocTypeIds, setSelectedDocTypeIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  // Expiry notifications
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [showExpiringDialog, setShowExpiringDialog] = useState(false);
  const [showPortalDialog, setShowPortalDialog] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadExpiringDocs();
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

  async function loadExpiringDocs() {
    try {
      const data = await api.getExpiringDocuments(15);
      setExpiringDocs(data);
    } catch { /* ignore */ }
  }

  async function loadDocTypes() {
    try {
      const data = await api.getDocumentTypes();
      setDocTypes(data);
    } catch { /* ignore */ }
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

  // Multi-select handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selectedIds.size === filteredEmployees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map(e => e.id)));
    }
  };

  // Download ZIP
  const handleOpenDownload = async () => {
    if (selectedIds.size === 0) { toast.error('Selecione funcionários'); return; }
    await loadDocTypes();
    setSelectedCategories(new Set());
    setSelectedDocTypeIds(new Set());
    setShowDownloadDialog(true);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const blob = await api.downloadComplianceZip(
        Array.from(selectedIds),
        selectedCategories.size > 0 ? Array.from(selectedCategories) : undefined,
        selectedDocTypeIds.size > 0 ? Array.from(selectedDocTypeIds) : undefined,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documentos_funcionarios.zip';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ZIP baixado com sucesso!');
      setShowDownloadDialog(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao baixar ZIP');
    }
    setDownloading(false);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const toggleDocType = (id: string) => {
    setSelectedDocTypeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredDocTypes = docTypes.filter(dt =>
    selectedCategories.size === 0 || selectedCategories.has(dt.category)
  );

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
        <div className="flex items-center gap-2">
          {expiringDocs.length > 0 && (
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 gap-2"
              onClick={() => setShowExpiringDialog(true)}
            >
              <AlertTriangle className="w-4 h-4" />
              {expiringDocs.length} vencendo
            </Button>
          )}
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
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                </TableHead>
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
                <TableRow key={employee.id} className={cn('hover:bg-slate-50/50', selectedIds.has(employee.id) && 'bg-amber-50/50')}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(employee.id)}
                      onChange={() => toggleSelect(employee.id)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                  </TableCell>
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
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhum funcionário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">{selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}</span>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold gap-2"
            onClick={handleOpenDownload}
          >
            <Download className="w-4 h-4" />
            Baixar Documentos
          </Button>
          <Button
            size="sm"
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold gap-2"
            onClick={() => setShowPortalDialog(true)}
          >
            <Upload className="w-4 h-4" />
            Enviar ao Portal
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white text-sm"
          >
            Limpar
          </button>
        </div>
      )}

      {/* Download Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-500" />
              Baixar Documentos ({selectedIds.size} funcionários)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Categories */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Filtrar por categoria (opcional):</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <label
                    key={key}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm',
                      selectedCategories.has(key)
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(key)}
                      onChange={() => toggleCategory(key)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Document types */}
            {filteredDocTypes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Filtrar por tipo (opcional):</p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {filteredDocTypes.map((dt: any) => (
                    <label
                      key={dt.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs',
                        selectedDocTypeIds.has(dt.id)
                          ? 'border-blue-400 bg-blue-50 text-blue-800'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocTypeIds.has(dt.id)}
                        onChange={() => toggleDocType(dt.id)}
                        className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                      />
                      {dt.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
              📁 O ZIP será organizado: <code>Nome_Funcionario/Categoria/Tipo_v1.pdf</code>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>Cancelar</Button>
              <Button
                onClick={handleDownloadZip}
                disabled={downloading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold gap-2"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? 'Gerando ZIP...' : 'Baixar ZIP'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expiring Documents Dialog */}
      <Dialog open={showExpiringDialog} onOpenChange={setShowExpiringDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Documentos Vencendo ({expiringDocs.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {expiringDocs.map((doc: any) => (
              <div key={doc.id} className={cn(
                'flex items-center justify-between p-3 rounded-lg border text-sm',
                doc.isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              )}>
                <div>
                  <p className="font-medium text-slate-800">{doc.ownerName}</p>
                  <p className="text-xs text-slate-500">{doc.documentType} ({doc.documentTypeCode})</p>
                </div>
                <Badge className={cn(
                  'text-xs',
                  doc.isExpired ? 'bg-red-500 text-white' : doc.daysLeft <= 5 ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'
                )}>
                  {doc.isExpired ? 'VENCIDO' : `${doc.daysLeft} dias`}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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

      <EmployeePortalPublishDialog
        open={showPortalDialog}
        onOpenChange={setShowPortalDialog}
        selectedEmployees={employees.filter(e => selectedIds.has(e.id))}
      />
    </div>
  );
}
