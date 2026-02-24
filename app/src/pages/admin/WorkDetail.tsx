import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import EditWorkDialog from '@/components/EditWorkDialog';
import WorkProgressDialog from '@/components/WorkProgressDialog';
import DeleteWorkDialog from '@/components/DeleteWorkDialog';
import {
  ArrowLeft, Edit, Clock, CheckCircle2, CheckCircle, XCircle, User, Phone, Mail,
  MapPin, ExternalLink, Plus, CircleDot, Loader2, Trash2, Building2, ListTodo,
  TrendingUp, Calendar, FileText, Shield, DollarSign, Users, Package,
  Download, ClipboardList, AlertTriangle, Wallet, Receipt, CalendarClock,
} from 'lucide-react';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';
import { MeasurementDialog } from '@/components/MeasurementDialog';
import { toast } from 'sonner';
import { api } from '@/api';

// ─── Config Maps ──────────────────────────────────────────────────────────────
const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-slate-500' },
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  pending_approval: { label: 'Aguardando Aprovação', color: 'bg-amber-500' },
  approved: { label: 'Aprovada', color: 'bg-blue-500' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-600' },
  on_hold: { label: 'Pausada', color: 'bg-orange-500' },
  waiting_utility: { label: 'Aguardando Concessionária', color: 'bg-orange-400' },
  waiting_client: { label: 'Aguardando Cliente', color: 'bg-purple-500' },
  completed: { label: 'Concluída', color: 'bg-emerald-500' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500' },
};

const typeLabels: Record<string, string> = {
  residential: 'Residencial', commercial: 'Comercial', industrial: 'Industrial',
  pde_bt: 'PDE BT', pde_at: 'PDE AT', project_bt: 'Projeto BT',
  project_mt: 'Projeto MT', project_at: 'Projeto AT', solar: 'Solar',
  network_donation: 'Doação de Rede', network_work: 'Obra de Rede',
  report: 'Laudo', spda: 'SPDA', grounding: 'Aterramento', maintenance: 'Manutenção',
};

const taskStatusConfig: Record<string, { label: string; icon: any; color: string; badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pendente', icon: CircleDot, color: 'text-yellow-500', badgeVariant: 'outline' },
  in_progress: { label: 'Em Andamento', icon: Clock, color: 'text-blue-500', badgeVariant: 'secondary' },
  completed: { label: 'Concluída', icon: CheckCircle, color: 'text-emerald-500', badgeVariant: 'default' },
  cancelled: { label: 'Cancelada', icon: XCircle, color: 'text-red-500', badgeVariant: 'destructive' },
};

const taskPriorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-slate-500' },
  medium: { label: 'Média', color: 'text-amber-500' },
  high: { label: 'Alta', color: 'text-red-500' },
  urgent: { label: 'Urgente', color: 'text-red-700' },
};

const proposalStatusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600' },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Aceita', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-700' },
};

const protocolStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700' },
};

const STAGES = [
  { key: 'project', label: 'Projeto' },
  { key: 'approval', label: 'Aprovação' },
  { key: 'protocol', label: 'Protocolo' },
  { key: 'execution', label: 'Execução' },
  { key: 'inspection', label: 'Vistoria' },
  { key: 'delivery', label: 'Entrega' },
];

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

function isAdmin(): boolean {
  try {
    const u = JSON.parse(localStorage.getItem('electraflow_user') || '{}');
    return u.role === 'admin';
  } catch { return false; }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminWorkDetail() {
  const { id } = useParams<{ id: string }>();
  const [work, setWork] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [workCosts, setWorkCosts] = useState<any[]>([]);
  const [paymentSchedules, setPaymentSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [isClientViewerOpen, setIsClientViewerOpen] = useState(false);
  const [isMeasurementDialogOpen, setIsMeasurementDialogOpen] = useState(false);
  const [newCostOpen, setNewCostOpen] = useState(false);
  const [newScheduleOpen, setNewScheduleOpen] = useState(false);

  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', estimatedHours: '' });
  const [selectedResolvers, setSelectedResolvers] = useState<string[]>([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [newCost, setNewCost] = useState({ description: '', category: 'material', quantity: '1', unit: 'un', unitPrice: '', supplierId: '', employeeId: '', date: '', invoiceNumber: '', notes: '' });
  const [newSchedule, setNewSchedule] = useState({ description: '', amount: '', dueDate: '', installmentNumber: '1', totalInstallments: '1', supplierId: '', employeeId: '', notes: '' });
  const [costLoading, setCostLoading] = useState(false);
  const admin = isAdmin();

  // ── Fetch functions ──────────────────────────────────────────────────────
  const fetchWork = async () => {
    if (!id) return;
    try { setWork(await api.getWork(id)); }
    catch { toast.error('Erro ao carregar obra.'); }
    finally { setLoading(false); }
  };

  const fetchUpdates = async () => {
    if (!id) return;
    try { const d = await api.getWorkUpdates(id); setUpdates(Array.isArray(d) ? d : []); }
    catch { setUpdates([]); }
  };

  const fetchTasks = async () => {
    if (!id) return;
    try { const d = await api.getTasksByWork(id); setTasks(Array.isArray(d) ? d : []); }
    catch { setTasks([]); }
  };

  const fetchDocuments = async () => {
    if (!id) return;
    try { const d = await api.getDocumentsByWork(id); setDocuments(Array.isArray(d) ? d : []); }
    catch { setDocuments([]); }
  };

  const fetchProtocols = async () => {
    try {
      const all = await api.getProtocols();
      const list = Array.isArray(all) ? all : (all?.data ?? []);
      setProtocols(list.filter((p: any) => p.workId === id));
    } catch { setProtocols([]); }
  };

  const fetchProposals = async () => {
    try {
      const all = await api.getProposals();
      const list = Array.isArray(all) ? all : (all?.data ?? []);
      // proposals are linked via opportunityId — match with work.opportunityId
      setProposals(list);
    } catch { setProposals([]); }
  };

  const fetchPayments = async () => {
    if (!id) return;
    try { const d = await api.getPayments(undefined, id); setPayments(Array.isArray(d) ? d : (d?.data ?? [])); }
    catch { setPayments([]); }
  };

  const fetchMeasurements = async () => {
    if (!id) return;
    try { const d = await api.getMeasurements(id); setMeasurements(Array.isArray(d) ? d : (d?.data ?? [])); }
    catch { setMeasurements([]); }
  };

  const fetchEmployees = async () => {
    try { const d = await api.getEmployees(); setEmployees(Array.isArray(d) ? d : (d?.data ?? [])); }
    catch { setEmployees([]); }
  };

  const fetchSuppliers = async () => {
    try { const d = await api.getSuppliers(); setSuppliers(Array.isArray(d) ? d : (d?.data ?? [])); }
    catch { setSuppliers([]); }
  };

  const fetchWorkCosts = async () => {
    if (!id) return;
    try { const d = await api.getWorkCosts(id); setWorkCosts(Array.isArray(d) ? d : (d?.data ?? [])); }
    catch { setWorkCosts([]); }
  };

  const fetchPaymentSchedules = async () => {
    if (!id) return;
    try { const d = await api.getPaymentSchedules(id); setPaymentSchedules(Array.isArray(d) ? d : (d?.data ?? [])); }
    catch { setPaymentSchedules([]); }
  };

  useEffect(() => {
    fetchWork(); fetchUpdates(); fetchTasks(); fetchDocuments();
    fetchProtocols(); fetchProposals(); fetchPayments();
    fetchMeasurements(); fetchEmployees(); fetchSuppliers();
    fetchWorkCosts(); fetchPaymentSchedules();
  }, [id]);

  const handleRefresh = () => {
    fetchWork(); fetchUpdates(); fetchTasks(); fetchDocuments();
    fetchProtocols(); fetchProposals(); fetchPayments(); fetchMeasurements();
    fetchWorkCosts(); fetchPaymentSchedules();
  };

  // ── Task handlers ────────────────────────────────────────────────────────
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) { toast.error('Título é obrigatório.'); return; }
    setTaskLoading(true);
    try {
      await api.createTask({ title: newTask.title, description: newTask.description || undefined, priority: newTask.priority, estimatedHours: newTask.estimatedHours ? Number(newTask.estimatedHours) : undefined, workId: id, resolverIds: selectedResolvers.length > 0 ? selectedResolvers : undefined });
      toast.success('Tarefa criada com sucesso!');
      setNewTaskOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', estimatedHours: '' });
      setSelectedResolvers([]);
      handleRefresh();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao criar tarefa.'); }
    finally { setTaskLoading(false); }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tasks/${taskId}/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('electraflow_token')}` }, body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Erro');
      toast.success('Tarefa concluída!'); handleRefresh();
    } catch { toast.error('Erro ao concluir tarefa.'); }
  };

  const handleDeleteTask = async (taskId: string) => {
    try { await api.deleteTask(taskId); toast.success('Tarefa removida.'); handleRefresh(); }
    catch { toast.error('Erro ao remover tarefa.'); }
  };

  const handleDownloadDoc = async (doc: any) => {
    try {
      const blob = await api.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = doc.originalName || doc.name || 'documento'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Erro ao baixar documento.'); }
  };

  // ── Loading / notFound ────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      <span className="ml-3 text-slate-500">Carregando obra...</span>
    </div>
  );

  if (!work) return (
    <div className="text-center py-24 text-slate-500">
      <p className="text-lg">Obra não encontrada.</p>
      <Button variant="outline" className="mt-4" asChild><Link to="/admin/works">Voltar</Link></Button>
    </div>
  );

  // ── Computed ──────────────────────────────────────────────────────────────
  const status = statusLabels[work.status] || { label: work.status, color: 'bg-slate-500' };
  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const currentStageIndex = STAGES.findIndex(s => s.key === work.currentStage);

  // Filter proposals linked to this work's opportunity
  const workProposals = proposals.filter((p: any) =>
    (work.opportunityId && p.opportunityId === work.opportunityId) || p.workId === id
  );

  // Extract team from tasks (unique assignees)
  const taskAssignees = new Set(tasks.map((t: any) => t.assignedToId || t.assignedTo?.id).filter(Boolean));
  const teamMembers = employees.filter((e: any) => taskAssignees.has(e.id) || e.id === work.assignedEngineerId || e.id === work.assignedDesignerId);

  // Finance totals
  const totalReceived = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalPending = payments.filter((p: any) => p.status !== 'paid' && p.status !== 'cancelled').reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild><Link to="/admin/works"><ArrowLeft className="w-4 h-4" /></Link></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">{work.title}</h1>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
            <p className="text-slate-500">{work.code || '—'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />Excluir
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}><Edit className="w-4 h-4 mr-2" />Editar</Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={() => setProgressOpen(true)}>
            <CheckCircle2 className="w-4 h-4 mr-2" />Atualizar Progresso
          </Button>
        </div>
      </div>

      {/* ── Progress + Stages ──────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-sm text-slate-500">Progresso da Obra</p><p className="text-3xl font-bold">{work.progress || 0}%</p></div>
            <div className="text-right"><p className="text-sm text-slate-500">Tarefas Concluídas</p><p className="text-xl font-semibold">{completedTasks} de {tasks.length}</p></div>
          </div>
          <Progress value={work.progress || 0} className="h-3 mb-4" />
          {/* Stage Progress */}
          <div className="flex items-center justify-between mt-2">
            {STAGES.map((stage, i) => (
              <div key={stage.key} className="flex-1 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i < currentStageIndex ? 'bg-emerald-500 border-emerald-500 text-white'
                  : i === currentStageIndex ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                    : 'bg-slate-100 border-slate-300 text-slate-400'
                  }`}>{i + 1}</div>
                <span className={`text-[10px] mt-1 font-medium ${i <= currentStageIndex ? 'text-slate-700' : 'text-slate-400'}`}>{stage.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas ({tasks.length})</TabsTrigger>
          <TabsTrigger value="proposals">Propostas ({workProposals.length})</TabsTrigger>
          <TabsTrigger value="protocols">Protocolos ({protocols.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
          <TabsTrigger value="team">Equipe ({teamMembers.length})</TabsTrigger>
          <TabsTrigger value="updates">Evolução ({updates.length})</TabsTrigger>
          {admin && <TabsTrigger value="finance" className="text-amber-600">💰 Financeiro</TabsTrigger>}
          {admin && <TabsTrigger value="custos" className="text-emerald-600">📊 Custos & Pagamentos</TabsTrigger>}
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* ═══ INFO TAB ═══════════════════════════════════════════════════ */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5" />Dados da Obra</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-500">Tipo</p><p className="font-medium">{typeLabels[work.type] || work.type}</p></div>
                  <div><p className="text-sm text-slate-500">Valor Total</p><p className="font-medium">R$ {fmt(work.totalValue)}</p></div>
                  <div><p className="text-sm text-slate-500">Endereço</p><p className="font-medium">{work.address || '—'}</p></div>
                  <div><p className="text-sm text-slate-500">Cidade / UF</p><p className="font-medium">{[work.city, work.state].filter(Boolean).join(' - ') || '—'}</p></div>
                  <div><p className="text-sm text-slate-500">Concessionária</p><p className="font-medium">{work.concessionaria || '—'}</p></div>
                  <div><p className="text-sm text-slate-500">Nº Protocolo</p><p className="font-medium">{work.protocolNumber || '—'}</p></div>
                  <div><p className="text-sm text-slate-500">Data Início</p><p className="font-medium">{fmtDate(work.startDate)}</p></div>
                  <div><p className="text-sm text-slate-500">Previsão Término</p><p className="font-medium">{fmtDate(work.expectedEndDate || work.deadline)}</p></div>
                </div>
                {work.description && <div><p className="text-sm text-slate-500">Descrição</p><p className="text-slate-700">{work.description}</p></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between w-full">
                  <div className="flex items-center gap-2"><User className="w-5 h-5" />Dados do Cliente</div>
                  {work.client && (
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold border-amber-200 text-amber-600 hover:bg-amber-50" onClick={() => setIsClientViewerOpen(true)}>
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Detalhes Completos
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {work.client ? (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12"><AvatarFallback className="bg-amber-500 text-slate-900">{work.client.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-semibold text-lg">{work.client.name}</p>
                        {work.client.company && <p className="text-sm text-slate-500">{work.client.company}</p>}
                        {work.client.cpfCnpj && <p className="text-xs text-slate-400 font-mono">{work.client.cpfCnpj}</p>}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {work.client.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><span>{work.client.phone}</span></div>}
                      {work.client.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /><span>{work.client.email}</span></div>}
                      {(work.client.address || work.client.city) && (
                        <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-slate-400" /><span>{[work.client.address, work.client.city, work.client.state].filter(Boolean).join(', ')}</span></div>
                      )}
                    </div>
                  </>
                ) : <p className="text-slate-400">Nenhum cliente vinculado.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TASKS TAB ══════════════════════════════════════════════════ */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Etapas / Tarefas da Obra</h3>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={() => setNewTaskOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova Tarefa</Button>
          </div>
          {tasks.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-slate-400"><ListTodo className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>Nenhuma tarefa cadastrada.</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any, index: number) => {
                const ts = taskStatusConfig[task.status] || taskStatusConfig.pending;
                const TaskIcon = ts.icon;
                const pr = taskPriorityLabels[task.priority] || taskPriorityLabels.medium;
                return (
                  <Card key={task.id} className={task.status === 'completed' ? 'opacity-70' : ''}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">{index + 1}</div>
                        <TaskIcon className={`w-5 h-5 ${ts.color}`} />
                        <div>
                          <p className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant={ts.badgeVariant} className="text-xs">{ts.label}</Badge>
                            <span className={`text-xs font-medium ${pr.color}`}>• {pr.label}</span>
                            {task.resolvers && task.resolvers.length > 0 && (
                              <span className="text-xs text-slate-400">• {task.resolvers.map((r: any) => r.employee?.name).filter(Boolean).join(', ')}</span>
                            )}
                            {!task.resolvers?.length && task.assignedTo && <span className="text-xs text-slate-400">• {task.assignedTo.name || task.assignedTo.email}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                          <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleCompleteTask(task.id)}><CheckCircle className="w-4 h-4 mr-1" />Concluir</Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteTask(task.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ PROPOSALS TAB ══════════════════════════════════════════════ */}
        <TabsContent value="proposals" className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><ClipboardList className="w-5 h-5" />Propostas Vinculadas</h3>
          {workProposals.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-slate-400"><ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>Nenhuma proposta vinculada a esta obra.</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workProposals.map((p: any) => {
                const ps = proposalStatusLabels[p.status] || { label: p.status, color: 'bg-slate-100 text-slate-600' };
                return (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">{p.title || `Proposta #${p.proposalNumber || p.id?.slice(0, 8)}`}</p>
                          <p className="text-sm text-slate-500">{p.client?.name || p.clientName || '—'}</p>
                        </div>
                        <Badge className={ps.color}>{ps.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-400">Valor:</span> <span className="font-mono font-medium">R$ {fmt(p.totalValue || p.value)}</span></div>
                        <div><span className="text-slate-400">Data:</span> {fmtDate(p.createdAt)}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ PROTOCOLS TAB ══════════════════════════════════════════════ */}
        <TabsContent value="protocols" className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5" />Protocolos da Concessionária</h3>
          {protocols.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-slate-400"><Shield className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>Nenhum protocolo registrado.</p></CardContent></Card>
          ) : (
            <div className="space-y-4">
              {protocols.map((p: any) => {
                const ps = protocolStatusLabels[p.status] || { label: p.status, color: 'bg-slate-100 text-slate-600' };
                return (
                  <Card key={p.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">Protocolo {p.protocolNumber || p.number || '#'}</p>
                          <p className="text-sm text-slate-500">{p.concessionaria || p.utility || work.concessionaria || '—'}</p>
                        </div>
                        <Badge className={ps.color}>{ps.label}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><span className="text-slate-400">Entrada:</span> {fmtDate(p.submissionDate || p.createdAt)}</div>
                        <div><span className="text-slate-400">Resposta:</span> {fmtDate(p.responseDate)}</div>
                        <div><span className="text-slate-400">Tipo:</span> {p.type || '—'}</div>
                      </div>
                      {p.events && p.events.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase">Eventos</p>
                          {p.events.slice(0, 3).map((ev: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>{fmtDate(ev.date || ev.createdAt)}</span>
                              <span>—</span>
                              <span>{ev.description || ev.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ DOCUMENTS TAB ══════════════════════════════════════════════ */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5" />Documentos da Obra</h3>
          </div>
          {documents.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-slate-400"><FileText className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>Nenhum documento vinculado.</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((doc: any) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.name || doc.originalName || 'Documento'}</p>
                        <p className="text-xs text-slate-400">{doc.type || '—'} • {fmtDate(doc.createdAt)}</p>
                        {doc.size && <p className="text-xs text-slate-400">{(Number(doc.size) / 1024).toFixed(0)} KB</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadDoc(doc)} title="Download">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ TEAM TAB ═══════════════════════════════════════════════════ */}
        <TabsContent value="team" className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5" />Equipe da Obra</h3>
          {teamMembers.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-slate-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>Nenhum funcionário vinculado.</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((emp: any) => {
                const empTasks = tasks.filter((t: any) => (t.resolvers && t.resolvers.some((r: any) => r.employeeId === emp.id)) || (t.assignedToId || t.assignedTo?.id) === emp.id);
                const isEngineer = emp.id === work.assignedEngineerId;
                const isDesigner = emp.id === work.assignedDesignerId;
                return (
                  <Card key={emp.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10"><AvatarFallback className="bg-blue-500 text-white text-sm">{emp.name?.charAt(0) || '?'}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-medium text-sm">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.role || emp.position || '—'}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {isEngineer && <Badge className="bg-blue-100 text-blue-700 text-xs">Engenheiro Responsável</Badge>}
                        {isDesigner && <Badge className="bg-purple-100 text-purple-700 text-xs">Projetista</Badge>}
                        {empTasks.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-slate-500 mb-1">{empTasks.length} tarefa(s):</p>
                            {empTasks.slice(0, 3).map((t: any) => (
                              <div key={t.id} className="flex items-center gap-1 text-xs text-slate-600">
                                <CheckCircle className={`w-3 h-3 ${t.status === 'completed' ? 'text-emerald-500' : 'text-slate-300'}`} />
                                <span className={t.status === 'completed' ? 'line-through' : ''}>{t.title}</span>
                              </div>
                            ))}
                            {empTasks.length > 3 && <p className="text-xs text-slate-400 mt-1">+{empTasks.length - 3} mais...</p>}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ UPDATES TAB ════════════════════════════════════════════════ */}
        <TabsContent value="updates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Evolução e Atualizações</h3>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={() => setProgressOpen(true)}><TrendingUp className="w-4 h-4 mr-2" />Nova Atualização</Button>
          </div>
          {updates.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-slate-400"><TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>Nenhuma atualização registrada.</p></CardContent></Card>
          ) : (
            <div className="space-y-4">
              {updates.map((update: any) => (
                <Card key={update.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{update.progress}%</Badge>
                          <span className="text-sm text-slate-400">{new Date(update.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-700">{update.description}</p>
                        {update.imageUrl && <img src={`${API_BASE}${update.imageUrl}`} alt="Atualização" className="mt-3 rounded-lg border max-h-64 object-cover" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ FINANCE TAB (ADMIN ONLY) ═══════════════════════════════════ */}
        {admin && (
          <TabsContent value="finance" className="space-y-6">
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">INFORMAÇÕES CONFIDENCIAIS — Visível apenas para Administradores</span>
            </div>

            {/* Finance Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4"><p className="text-xs text-slate-500">Valor da Obra</p><p className="text-xl font-bold font-mono">R$ {fmt(work.totalValue)}</p></CardContent>
              </Card>
              <Card className="border-l-4 border-l-rose-500">
                <CardContent className="p-4"><p className="text-xs text-slate-500">Custo</p><p className="text-xl font-bold font-mono text-rose-600">R$ {fmt(work.cost)}</p></CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4"><p className="text-xs text-slate-500">Recebido</p><p className="text-xl font-bold font-mono text-emerald-600">R$ {fmt(totalReceived)}</p></CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4"><p className="text-xs text-slate-500">A Receber</p><p className="text-xl font-bold font-mono text-amber-600">R$ {fmt(totalPending)}</p></CardContent>
              </Card>
            </div>

            {/* Payments */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5" />Pagamentos</CardTitle></CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">Nenhum pagamento registrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-slate-500">
                        <th className="pb-2">Descrição</th><th className="pb-2">Valor</th><th className="pb-2">Vencimento</th><th className="pb-2">Status</th>
                      </tr></thead>
                      <tbody>
                        {payments.map((p: any) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="py-2">{p.description || p.type || '—'}</td>
                            <td className="py-2 font-mono">R$ {fmt(p.amount)}</td>
                            <td className="py-2">{fmtDate(p.dueDate)}</td>
                            <td className="py-2">
                              <Badge className={p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : p.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                {p.status === 'paid' ? 'Pago' : p.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Measurements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between w-full">
                  <div className="flex items-center gap-2"><Package className="w-5 h-5" />Medições</div>
                  <Button variant="outline" size="sm" onClick={() => setIsMeasurementDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />Nova Medição</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {measurements.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">Nenhuma medição registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {measurements.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{m.description || `Medição #${m.number || m.id?.slice(0, 6)}`}</p>
                          <p className="text-xs text-slate-500">{fmtDate(m.date || m.createdAt)}</p>
                        </div>
                        <p className="font-mono font-bold">R$ {fmt(m.value || m.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ═══ CUSTOS & PAGAMENTOS TAB ════════════════════════════════════ */}
        {admin && <TabsContent value="custos" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-700 mb-1"><Wallet className="w-4 h-4" /><span className="text-xs font-medium">Custo Total</span></div>
                <p className="text-xl font-bold text-emerald-900">R$ {fmt(workCosts.reduce((s: number, c: any) => s + Number(c.totalPrice || 0), 0))}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-1"><Receipt className="w-4 h-4" /><span className="text-xs font-medium">Valor da Obra</span></div>
                <p className="text-xl font-bold text-blue-900">R$ {fmt(Number(work.totalValue || 0))}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-700 mb-1"><TrendingUp className="w-4 h-4" /><span className="text-xs font-medium">Margem</span></div>
                <p className="text-xl font-bold text-amber-900">R$ {fmt(Number(work.totalValue || 0) - workCosts.reduce((s: number, c: any) => s + Number(c.totalPrice || 0), 0))}</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-purple-700 mb-1"><CalendarClock className="w-4 h-4" /><span className="text-xs font-medium">Pagamentos Programados</span></div>
                <p className="text-xl font-bold text-purple-900">{paymentSchedules.filter((s: any) => s.status === 'scheduled').length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Custos da Obra */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600" />Custos da Obra ({workCosts.length})</CardTitle>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setNewCostOpen(true)}><Plus className="w-4 h-4 mr-1" />Novo Custo</Button>
            </CardHeader>
            <CardContent>
              {workCosts.length === 0 ? (
                <div className="text-center py-8 text-slate-500"><DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum custo registrado</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left">
                      <th className="pb-2 font-medium">Data</th>
                      <th className="pb-2 font-medium">Categoria</th>
                      <th className="pb-2 font-medium">Descrição</th>
                      <th className="pb-2 font-medium">Fornecedor/Colaborador</th>
                      <th className="pb-2 font-medium text-right">Qtd</th>
                      <th className="pb-2 font-medium text-right">Unitário</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Ações</th>
                    </tr></thead>
                    <tbody>
                      {workCosts.map((cost: any) => (
                        <tr key={cost.id} className="border-b hover:bg-slate-50">
                          <td className="py-2">{fmtDate(cost.date)}</td>
                          <td className="py-2"><Badge variant="outline" className="text-xs">{cost.category}</Badge></td>
                          <td className="py-2 max-w-[200px] truncate">{cost.description}</td>
                          <td className="py-2 text-xs">{cost.supplier?.tradeName || cost.supplier?.name || cost.employee?.name || '—'}</td>
                          <td className="py-2 text-right">{cost.quantity} {cost.unit}</td>
                          <td className="py-2 text-right">R$ {fmt(cost.unitPrice)}</td>
                          <td className="py-2 text-right font-medium">R$ {fmt(cost.totalPrice)}</td>
                          <td className="py-2"><Badge className={cost.status === 'paid' ? 'bg-emerald-500' : cost.status === 'approved' ? 'bg-blue-500' : cost.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'}>{cost.status}</Badge></td>
                          <td className="py-2"><Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={async () => { await api.deleteWorkCost(cost.id); fetchWorkCosts(); toast.success('Custo removido'); }}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Programação de Pagamentos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><CalendarClock className="w-5 h-5 text-purple-600" />Programação de Pagamentos ({paymentSchedules.length})</CardTitle>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setNewScheduleOpen(true)}><Plus className="w-4 h-4 mr-1" />Novo Agendamento</Button>
            </CardHeader>
            <CardContent>
              {paymentSchedules.length === 0 ? (
                <div className="text-center py-8 text-slate-500"><CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum pagamento agendado</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left">
                      <th className="pb-2 font-medium">Vencimento</th>
                      <th className="pb-2 font-medium">Descrição</th>
                      <th className="pb-2 font-medium">Fornecedor/Colaborador</th>
                      <th className="pb-2 font-medium text-right">Valor</th>
                      <th className="pb-2 font-medium">Parcela</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Ações</th>
                    </tr></thead>
                    <tbody>
                      {paymentSchedules.map((sched: any) => (
                        <tr key={sched.id} className={`border-b hover:bg-slate-50 ${sched.status === 'overdue' ? 'bg-red-50' : ''}`}>
                          <td className="py-2">{fmtDate(sched.dueDate)}</td>
                          <td className="py-2 max-w-[200px] truncate">{sched.description}</td>
                          <td className="py-2 text-xs">{sched.supplier?.tradeName || sched.supplier?.name || sched.employee?.name || '—'}</td>
                          <td className="py-2 text-right font-medium">R$ {fmt(sched.amount)}</td>
                          <td className="py-2">{sched.installmentNumber}/{sched.totalInstallments}</td>
                          <td className="py-2"><Badge className={sched.status === 'paid' ? 'bg-emerald-500' : sched.status === 'overdue' ? 'bg-red-500' : sched.status === 'cancelled' ? 'bg-slate-500' : 'bg-blue-500'}>{sched.status === 'scheduled' ? 'Agendado' : sched.status === 'paid' ? 'Pago' : sched.status === 'overdue' ? 'Vencido' : 'Cancelado'}</Badge></td>
                          <td className="py-2"><Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={async () => { await api.deletePaymentSchedule(sched.id); fetchPaymentSchedules(); toast.success('Agendamento removido'); }}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>}

        {/* ═══ TIMELINE TAB ═══════════════════════════════════════════════ */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader><CardTitle>Histórico da Obra</CardTitle></CardHeader>
            <CardContent>
              <div className="relative pl-8 space-y-6">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200" />
                <div className="flex gap-4 relative">
                  <div className="absolute -left-5 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center z-10"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                  <div><p className="font-medium">Obra criada</p><p className="text-sm text-slate-500">{fmtDate(work.createdAt)}</p></div>
                </div>
                {work.startDate && (
                  <div className="flex gap-4 relative">
                    <div className="absolute -left-5 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center z-10"><Calendar className="w-4 h-4 text-white" /></div>
                    <div><p className="font-medium">Início definido</p><p className="text-sm text-slate-500">{fmtDate(work.startDate)}</p></div>
                  </div>
                )}
                {tasks.filter((t: any) => t.status === 'completed').map((task: any) => (
                  <div className="flex gap-4 relative" key={`task-${task.id}`}>
                    <div className="absolute -left-5 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center z-10"><CheckCircle className="w-4 h-4 text-white" /></div>
                    <div><p className="font-medium">Tarefa: {task.title}</p><p className="text-sm text-slate-500">{fmtDate(task.completedAt)}</p></div>
                  </div>
                ))}
                {updates.map((update: any) => (
                  <div className="flex gap-4 relative" key={`update-${update.id}`}>
                    <div className="absolute -left-5 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center z-10"><TrendingUp className="w-4 h-4 text-white" /></div>
                    <div><p className="font-medium">Progresso: {update.progress}%</p><p className="text-sm text-slate-500">{fmtDate(update.createdAt)} — {update.description}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ────────────────────────────────────────────────────── */}
      {editOpen && <EditWorkDialog open={editOpen} onOpenChange={setEditOpen} work={work} onWorkUpdated={handleRefresh} />}
      {progressOpen && <WorkProgressDialog open={progressOpen} onOpenChange={setProgressOpen} work={work} onProgressUpdated={handleRefresh} />}
      {deleteOpen && <DeleteWorkDialog open={deleteOpen} onOpenChange={setDeleteOpen} work={work} onWorkDeleted={() => window.location.href = '/admin/works'} />}

      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div><Label htmlFor="task-title">Título da Tarefa *</Label><Input id="task-title" placeholder="Ex: Instalação do quadro de distribuição" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required /></div>
            <div><Label htmlFor="task-desc">Descrição</Label><Textarea id="task-desc" placeholder="Descreva os detalhes..." value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prioridade</Label><Select value={newTask.priority} onValueChange={v => setNewTask({ ...newTask, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div>
              <div><Label htmlFor="task-hours">Horas Estimadas</Label><Input id="task-hours" type="number" step="0.5" min="0" placeholder="Ex: 4" value={newTask.estimatedHours} onChange={e => setNewTask({ ...newTask, estimatedHours: e.target.value })} /></div>
            </div>
            {employees.length > 0 && (
              <div>
                <Label>Resolvedores</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {employees.map((emp: any) => (
                    <label key={emp.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" checked={selectedResolvers.includes(emp.id)} onChange={(e) => { if (e.target.checked) { setSelectedResolvers([...selectedResolvers, emp.id]); } else { setSelectedResolvers(selectedResolvers.filter(id => id !== emp.id)); } }} />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{emp.name}</span>
                        <span className="text-xs text-slate-400 ml-2">{emp.role === 'operational' ? 'Operacional' : emp.role === 'engineering' ? 'Engenharia' : emp.role === 'administrative' ? 'Administrativo' : emp.role}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedResolvers.length > 0 && <p className="text-xs text-slate-500 mt-1">{selectedResolvers.length} selecionado(s)</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewTaskOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900" disabled={taskLoading}>
                {taskLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}Criar Tarefa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Novo Custo Dialog ────────────────────────────────────────── */}
      <Dialog open={newCostOpen} onOpenChange={setNewCostOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Custo na Obra</DialogTitle></DialogHeader>
          <form onSubmit={async (e) => { e.preventDefault(); setCostLoading(true); try { const qty = Number(newCost.quantity) || 1; const up = Number(newCost.unitPrice) || 0; await api.createWorkCost({ workId: id, description: newCost.description, category: newCost.category, quantity: qty, unit: newCost.unit, unitPrice: up, totalPrice: qty * up, date: newCost.date || new Date().toISOString(), invoiceNumber: newCost.invoiceNumber || undefined, supplierId: newCost.supplierId || undefined, employeeId: newCost.employeeId || undefined, notes: newCost.notes || undefined }); toast.success('Custo registrado!'); setNewCostOpen(false); setNewCost({ description: '', category: 'material', quantity: '1', unit: 'un', unitPrice: '', supplierId: '', employeeId: '', date: '', invoiceNumber: '', notes: '' }); fetchWorkCosts(); } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao registrar custo.'); } finally { setCostLoading(false); } }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Descrição *</Label><Input placeholder="Ex: Cabo 10mm" value={newCost.description} onChange={e => setNewCost({ ...newCost, description: e.target.value })} required /></div>
              <div><Label>Categoria</Label><Select value={newCost.category} onValueChange={v => setNewCost({ ...newCost, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="material">Material</SelectItem><SelectItem value="labor">Mão de Obra</SelectItem><SelectItem value="subcontract">Subcontrato</SelectItem><SelectItem value="equipment">Equipamento</SelectItem><SelectItem value="transport">Transporte</SelectItem><SelectItem value="tax">Impostos</SelectItem><SelectItem value="rental">Aluguel</SelectItem><SelectItem value="ppe">EPI</SelectItem><SelectItem value="food">Alimentação</SelectItem><SelectItem value="lodging">Hospedagem</SelectItem><SelectItem value="other">Outro</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div><Label>Qtd</Label><Input type="number" step="0.01" min="0" value={newCost.quantity} onChange={e => setNewCost({ ...newCost, quantity: e.target.value })} /></div>
              <div><Label>Unidade</Label><Input placeholder="un" value={newCost.unit} onChange={e => setNewCost({ ...newCost, unit: e.target.value })} /></div>
              <div><Label>Preço Unitário *</Label><Input type="number" step="0.01" min="0" placeholder="0.00" value={newCost.unitPrice} onChange={e => setNewCost({ ...newCost, unitPrice: e.target.value })} required /></div>
              <div><Label>Total</Label><Input disabled value={`R$ ${fmt((Number(newCost.quantity) || 0) * (Number(newCost.unitPrice) || 0))}`} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fornecedor</Label><Select value={newCost.supplierId} onValueChange={v => setNewCost({ ...newCost, supplierId: v })}><SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger><SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.tradeName || s.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Colaborador</Label><Select value={newCost.employeeId} onValueChange={v => setNewCost({ ...newCost, employeeId: v })}><SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger><SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data</Label><Input type="date" value={newCost.date} onChange={e => setNewCost({ ...newCost, date: e.target.value })} /></div>
              <div><Label>Nº Nota Fiscal</Label><Input placeholder="NF-e" value={newCost.invoiceNumber} onChange={e => setNewCost({ ...newCost, invoiceNumber: e.target.value })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea placeholder="Observações..." value={newCost.notes} onChange={e => setNewCost({ ...newCost, notes: e.target.value })} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewCostOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={costLoading}>{costLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Novo Pagamento Programado Dialog ─────────────────────────── */}
      <Dialog open={newScheduleOpen} onOpenChange={setNewScheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Programar Pagamento</DialogTitle></DialogHeader>
          <form onSubmit={async (e) => { e.preventDefault(); setCostLoading(true); try { await api.createPaymentSchedule({ workId: id, description: newSchedule.description, amount: Number(newSchedule.amount) || 0, dueDate: newSchedule.dueDate, installmentNumber: Number(newSchedule.installmentNumber) || 1, totalInstallments: Number(newSchedule.totalInstallments) || 1, supplierId: newSchedule.supplierId || undefined, employeeId: newSchedule.employeeId || undefined, notes: newSchedule.notes || undefined }); toast.success('Pagamento agendado!'); setNewScheduleOpen(false); setNewSchedule({ description: '', amount: '', dueDate: '', installmentNumber: '1', totalInstallments: '1', supplierId: '', employeeId: '', notes: '' }); fetchPaymentSchedules(); } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao agendar.'); } finally { setCostLoading(false); } }} className="space-y-4">
            <div><Label>Descrição *</Label><Input placeholder="Ex: Parcela 1 - Serviço elétrico" value={newSchedule.description} onChange={e => setNewSchedule({ ...newSchedule, description: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" min="0" placeholder="0.00" value={newSchedule.amount} onChange={e => setNewSchedule({ ...newSchedule, amount: e.target.value })} required /></div>
              <div><Label>Vencimento *</Label><Input type="date" value={newSchedule.dueDate} onChange={e => setNewSchedule({ ...newSchedule, dueDate: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Parcela Nº</Label><Input type="number" min="1" value={newSchedule.installmentNumber} onChange={e => setNewSchedule({ ...newSchedule, installmentNumber: e.target.value })} /></div>
              <div><Label>Total de Parcelas</Label><Input type="number" min="1" value={newSchedule.totalInstallments} onChange={e => setNewSchedule({ ...newSchedule, totalInstallments: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fornecedor</Label><Select value={newSchedule.supplierId} onValueChange={v => setNewSchedule({ ...newSchedule, supplierId: v })}><SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger><SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.tradeName || s.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Colaborador</Label><Select value={newSchedule.employeeId} onValueChange={v => setNewSchedule({ ...newSchedule, employeeId: v })}><SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger><SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Observações</Label><Textarea placeholder="Observações..." value={newSchedule.notes} onChange={e => setNewSchedule({ ...newSchedule, notes: e.target.value })} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewScheduleOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={costLoading}>{costLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CalendarClock className="w-4 h-4 mr-2" />}Agendar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ClientDetailViewer open={isClientViewerOpen} onOpenChange={setIsClientViewerOpen} client={work.client} />
      <MeasurementDialog isOpen={isMeasurementDialogOpen} onClose={() => setIsMeasurementDialogOpen(false)} workId={id!} onSuccess={fetchWork} />
    </div>
  );
}
