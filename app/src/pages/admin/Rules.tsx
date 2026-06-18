import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { api } from '@/api';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, Loader2, Edit2, Trash2, Zap, Shield, PlayCircle, PauseCircle, Settings2, X } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

interface RuleActionItem {
  type: string;
  params: string; // JSON string for editing
}

interface RuleForm {
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  messageTemplate: string;
  conditions: RuleCondition[];
  actions: RuleActionItem[];
}

const EMPTY_FORM: RuleForm = {
  name: '',
  description: '',
  priority: 1,
  isActive: true,
  messageTemplate: '',
  conditions: [],
  actions: [],
};

// ─── Opções do backend ────────────────────────────────────────────────────────
const CONDITION_FIELDS = [
  { value: 'service_type', label: 'Tipo de Serviço' },
  { value: 'voltage', label: 'Tensão' },
  { value: 'power', label: 'Potência' },
  { value: 'consumption', label: 'Consumo' },
  { value: 'client_segment', label: 'Segmento do Cliente' },
  { value: 'has_donation', label: 'Possui Doação' },
  { value: 'has_utility', label: 'Possui Utilidade' },
  { value: 'has_spda', label: 'Possui SPDA' },
  { value: 'has_report', label: 'Possui Laudo' },
  { value: 'days_since_last_report', label: 'Dias Desde Último Laudo' },
  { value: 'units_count', label: 'Quantidade de Unidades' },
  { value: 'concessionaria', label: 'Concessionária' },
];

const OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'in', label: 'Está em' },
  { value: 'not_in', label: 'Não está em' },
];

const ACTION_TYPES = [
  { value: 'suggest_package', label: 'Sugerir Pacote' },
  { value: 'add_proposal_item', label: 'Adicionar Item à Proposta' },
  { value: 'create_task', label: 'Criar Tarefa' },
  { value: 'send_message', label: 'Enviar Mensagem' },
  { value: 'open_checklist', label: 'Abrir Checklist' },
  { value: 'request_document', label: 'Solicitar Documento' },
  { value: 'apply_discount', label: 'Aplicar Desconto' },
  { value: 'set_price', label: 'Definir Preço' },
  { value: 'add_service', label: 'Adicionar Serviço' },
  { value: 'block_proposal', label: 'Bloquear Proposta' },
  { value: 'notify', label: 'Notificar' },
  { value: 'set_field', label: 'Definir Campo' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPriorityBadge(priority: number) {
  if (priority <= 3) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Baixa ({priority})</Badge>;
  if (priority <= 6) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Média ({priority})</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200">Alta ({priority})</Badge>;
}

function truncate(text: string | undefined | null, maxLen: number) {
  if (!text) return '—';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Rules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<RuleForm>({ ...EMPTY_FORM });

  // ─── Carregamento ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getRules();
      setRules(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      toast.error('Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Filtros ──────────────────────────────────────────────────────────────
  const filtered = rules.filter(r => {
    const matchSearch = !searchTerm || r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? r.isActive : !r.isActive);
    return matchSearch && matchActive;
  });

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalRules = rules.length;
  const activeRules = rules.filter(r => r.isActive).length;
  const inactiveRules = rules.filter(r => !r.isActive).length;
  const avgPriority = totalRules > 0 ? (rules.reduce((sum: number, r: any) => sum + (r.priority || 0), 0) / totalRules).toFixed(1) : '0';

  // ─── Dialog ───────────────────────────────────────────────────────────────
  const handleOpen = (rule?: any) => {
    if (rule) {
      setEditing(rule);
      const conditions = (rule.conditions || []).map((c: any) => ({
        field: c.field || '',
        operator: c.operator || 'equals',
        value: typeof c.value === 'object' ? JSON.stringify(c.value) : String(c.value ?? ''),
      }));
      const actions = (rule.actions || []).map((a: any) => ({
        type: a.type || '',
        params: typeof a.params === 'object' ? JSON.stringify(a.params) : String(a.params ?? '{}'),
      }));
      setForm({
        name: rule.name || '',
        description: rule.description || '',
        priority: rule.priority ?? 1,
        isActive: rule.isActive ?? true,
        messageTemplate: rule.messageTemplate || '',
        conditions,
        actions,
      });
    } else {
      setEditing(null);
      setForm({ ...EMPTY_FORM, conditions: [], actions: [] });
    }
    setDialogOpen(true);
  };

  // ─── Salvar ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome da regra é obrigatório');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        description: form.description,
        priority: Number(form.priority) || 1,
        isActive: form.isActive,
        messageTemplate: form.messageTemplate,
        conditions: form.conditions.map(c => ({
          field: c.field,
          operator: c.operator,
          value: tryParseJSON(c.value),
        })),
        actions: form.actions.map(a => ({
          type: a.type,
          params: tryParseJSON(a.params),
        })),
      };

      if (editing) {
        await api.updateRule(editing.id, payload);
        toast.success('Regra atualizada com sucesso!');
      } else {
        await api.createRule(payload);
        toast.success('Regra criada com sucesso!');
      }
      setDialogOpen(false);
      load();
    } catch {
      toast.error('Erro ao salvar regra');
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle Ativo ─────────────────────────────────────────────────────────
  const handleToggleActive = async (rule: any) => {
    try {
      await api.updateRule(rule.id, { isActive: !rule.isActive });
      toast.success(rule.isActive ? 'Regra desativada' : 'Regra ativada');
      load();
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  // ─── Excluir ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;
    try {
      await api.deleteRule(id);
      toast.success('Regra excluída');
      load();
    } catch {
      toast.error('Erro ao excluir regra');
    }
  };

  // ─── Conditions Builder ───────────────────────────────────────────────────
  const addCondition = () => {
    setForm(f => ({ ...f, conditions: [...f.conditions, { field: '', operator: 'equals', value: '' }] }));
  };

  const removeCondition = (index: number) => {
    setForm(f => ({ ...f, conditions: f.conditions.filter((_, i) => i !== index) }));
  };

  const updateCondition = (index: number, key: keyof RuleCondition, value: string) => {
    setForm(f => ({
      ...f,
      conditions: f.conditions.map((c, i) => i === index ? { ...c, [key]: value } : c),
    }));
  };

  // ─── Actions Builder ──────────────────────────────────────────────────────
  const addAction = () => {
    setForm(f => ({ ...f, actions: [...f.actions, { type: '', params: '{}' }] }));
  };

  const removeAction = (index: number) => {
    setForm(f => ({ ...f, actions: f.actions.filter((_, i) => i !== index) }));
  };

  const updateAction = (index: number, key: keyof RuleActionItem, value: string) => {
    setForm(f => ({
      ...f,
      actions: f.actions.map((a, i) => i === index ? { ...a, [key]: value } : a),
    }));
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" /> Regras de Negócio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure regras automáticas para propostas, tarefas e notificações
          </p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Nova Regra
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Regras</p>
                <p className="text-2xl font-bold text-slate-900">{totalRules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Ativas</p>
                <p className="text-2xl font-bold text-emerald-600">{activeRules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <PauseCircle className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Inativas</p>
                <p className="text-2xl font-bold text-slate-500">{inactiveRules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Prioridade Média</p>
                <p className="text-2xl font-bold text-amber-600">{avgPriority}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterActive} onValueChange={(v) => setFilterActive(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando regras...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhuma regra encontrada</p>
              <p className="text-sm mt-1">Crie sua primeira regra de negócio</p>
              <Button className="mt-4" onClick={() => handleOpen()}>
                <Plus className="w-4 h-4 mr-2" /> Criar Regra
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="text-center">Prioridade</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Condições</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Ações</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rule: any) => (
                  <TableRow key={rule.id} className={!rule.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-slate-500 text-sm max-w-[250px]">
                      {truncate(rule.description, 60)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getPriorityBadge(rule.priority || 1)}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant="outline" className="font-mono text-xs">
                        {(rule.conditions || []).length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant="outline" className="font-mono text-xs">
                        {(rule.actions || []).length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {rule.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Ativa</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpen(rule)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(rule)}>
                            {rule.isActive ? (
                              <><PauseCircle className="w-4 h-4 mr-2" /> Desativar</>
                            ) : (
                              <><PlayCircle className="w-4 h-4 mr-2" /> Ativar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(rule.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
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

      {/* ─── Dialog Create/Edit ───────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-500" />
            {editing ? 'Editar Regra' : 'Nova Regra'}
          </DialogTitle>
          <DialogDescription>
            Configure as condições e ações que serão executadas automaticamente.
          </DialogDescription>

          <div className="space-y-5 mt-2">
            {/* ── Dados Básicos ── */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informações Gerais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome da regra"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descreva o que esta regra faz..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Prioridade (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: Math.min(10, Math.max(1, Number(e.target.value) || 1)) }))}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">1-3 = Baixa, 4-6 = Média, 7-10 = Alta</p>
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                  />
                  <Label className="cursor-pointer">{form.isActive ? 'Regra Ativa' : 'Regra Inativa'}</Label>
                </div>
                <div className="sm:col-span-2">
                  <Label>Modelo de Mensagem</Label>
                  <Textarea
                    value={form.messageTemplate}
                    onChange={e => setForm(f => ({ ...f, messageTemplate: e.target.value }))}
                    placeholder="Mensagem que será exibida quando a regra disparar (suporta variáveis)"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* ── Condições ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Condições ({form.conditions.length})
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCondition}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Adicionar Condição
                </Button>
              </div>

              {form.conditions.length === 0 && (
                <div className="text-center py-4 border border-dashed rounded-lg text-slate-400 text-sm">
                  Nenhuma condição configurada. Clique em &quot;Adicionar Condição&quot; para começar.
                </div>
              )}

              <div className="space-y-2">
                {form.conditions.map((cond, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-400">Campo</Label>
                        <Select value={cond.field} onValueChange={v => updateCondition(i, 'field', v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_FIELDS.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-400">Operador</Label>
                        <Select value={cond.operator} onValueChange={v => updateCondition(i, 'operator', v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(op => (
                              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-400">Valor</Label>
                        <Input
                          className="h-8 text-xs"
                          value={cond.value}
                          onChange={e => updateCondition(i, 'value', e.target.value)}
                          placeholder="Valor..."
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-600 mt-4"
                      onClick={() => removeCondition(i)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Ações ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Ações ({form.actions.length})
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAction}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Adicionar Ação
                </Button>
              </div>

              {form.actions.length === 0 && (
                <div className="text-center py-4 border border-dashed rounded-lg text-slate-400 text-sm">
                  Nenhuma ação configurada. Clique em &quot;Adicionar Ação&quot; para começar.
                </div>
              )}

              <div className="space-y-2">
                {form.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-400">Tipo da Ação</Label>
                        <Select value={action.type} onValueChange={v => updateAction(i, 'type', v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTION_TYPES.map(at => (
                              <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-400">Parâmetros (JSON)</Label>
                        <Input
                          className="h-8 text-xs font-mono"
                          value={action.params}
                          onChange={e => updateAction(i, 'params', e.target.value)}
                          placeholder='{"key": "value"}'
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-600 mt-4"
                      onClick={() => removeAction(i)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Salvar Alterações' : 'Criar Regra'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function tryParseJSON(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
