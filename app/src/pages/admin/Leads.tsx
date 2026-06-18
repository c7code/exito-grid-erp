import { useState, useEffect } from 'react';
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
import { api } from '@/api';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, Loader2, Edit2, Trash2, UserCheck, Phone, Mail, Building2, Target, TrendingUp, Users, AlertCircle } from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-blue-100 text-blue-700' },
  qualifying: { label: 'Qualificando', color: 'bg-yellow-100 text-yellow-700' },
  qualified: { label: 'Qualificado', color: 'bg-green-100 text-green-700' },
  disqualified: { label: 'Desqualificado', color: 'bg-red-100 text-red-700' },
  converted: { label: 'Convertido', color: 'bg-purple-100 text-purple-700' },
};

const sourceConfig: Record<string, { label: string; color: string }> = {
  portal: { label: 'Portal', color: 'bg-blue-100 text-blue-700' },
  whatsapp: { label: 'WhatsApp', color: 'bg-green-100 text-green-700' },
  email: { label: 'E-mail', color: 'bg-orange-100 text-orange-700' },
  indication: { label: 'Indicação', color: 'bg-purple-100 text-purple-700' },
  prospection: { label: 'Prospecção', color: 'bg-cyan-100 text-cyan-700' },
  phone: { label: 'Telefone', color: 'bg-slate-100 text-slate-600' },
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  companyName: '',
  source: 'portal',
  status: 'new',
  serviceType: '',
  estimatedValue: '',
  description: '',
};

function formatBRL(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const data = await api.getLeads(params);
      setLeads(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const total = leads.length;
  const novos = leads.filter(l => l.status === 'new').length;
  const qualificados = leads.filter(l => l.status === 'qualified').length;
  const convertidos = leads.filter(l => l.status === 'converted').length;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (lead: any) => {
    setEditing(lead);
    setForm({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || '',
      companyName: lead.companyName || '',
      source: lead.source || 'portal',
      status: lead.status || 'new',
      serviceType: lead.serviceType || '',
      estimatedValue: lead.estimatedValue != null ? String(lead.estimatedValue) : '',
      description: lead.description || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.phone.trim()) { toast.error('Telefone é obrigatório'); return; }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null,
      };
      if (editing) {
        await api.updateLead(editing.id, payload);
        toast.success('Lead atualizado com sucesso');
      } else {
        await api.createLead(payload);
        toast.success('Lead criado com sucesso');
      }
      setShowDialog(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao salvar lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    try {
      await api.deleteLead(id);
      toast.success('Lead excluído com sucesso');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao excluir lead');
    }
  };

  const handleConvert = async (id: string) => {
    if (!confirm('Converter este lead em oportunidade?')) return;
    try {
      await api.convertLead(id);
      toast.success('Lead convertido em oportunidade com sucesso');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao converter lead');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Leads</h1>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Novo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-slate-100 p-2"><Users className="h-5 w-5 text-slate-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2"><AlertCircle className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Novos</p>
              <p className="text-2xl font-bold">{novos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2"><UserCheck className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Qualificados</p>
              <p className="text-2xl font-bold">{qualificados}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Convertidos</p>
              <p className="text-2xl font-bold">{convertidos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Target className="h-10 w-10" />
              <p>Nenhum lead encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Empresa</TableHead>
                  <TableHead className="hidden lg:table-cell">Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell text-right">Valor Est.</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.email ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {lead.email}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {lead.phone}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {lead.companyName ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {lead.companyName}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {lead.source && sourceConfig[lead.source] ? (
                        <Badge variant="secondary" className={sourceConfig[lead.source].color}>
                          {sourceConfig[lead.source].label}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {lead.status && statusConfig[lead.status] ? (
                        <Badge variant="secondary" className={statusConfig[lead.status].color}>
                          {statusConfig[lead.status].label}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-right">
                      {formatBRL(lead.estimatedValue)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(lead)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          {lead.status !== 'converted' && (
                            <DropdownMenuItem onClick={() => handleConvert(lead.id)}>
                              <TrendingUp className="h-4 w-4 mr-2" /> Converter em Oportunidade
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>{editing ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Atualize as informações do lead abaixo.' : 'Preencha as informações do novo lead.'}
          </DialogDescription>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">Nome *</Label>
              <Input
                id="lead-name"
                placeholder="Nome do lead"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="lead-email">E-mail</Label>
              <Input
                id="lead-email"
                type="email"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">Telefone *</Label>
              <Input
                id="lead-phone"
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <Label htmlFor="lead-whatsapp">WhatsApp</Label>
              <Input
                id="lead-whatsapp"
                placeholder="(00) 00000-0000"
                value={form.whatsapp}
                onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
              />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <Label htmlFor="lead-company">Empresa</Label>
              <Input
                id="lead-company"
                placeholder="Nome da empresa"
                value={form.companyName}
                onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
              />
            </div>

            {/* Service Type */}
            <div className="space-y-1.5">
              <Label htmlFor="lead-service">Tipo de Serviço</Label>
              <Input
                id="lead-service"
                placeholder="Ex: Instalação Solar"
                value={form.serviceType}
                onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))}
              />
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sourceConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Value */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="lead-value">Valor Estimado (R$)</Label>
              <Input
                id="lead-value"
                type="number"
                placeholder="0,00"
                value={form.estimatedValue}
                onChange={e => setForm(p => ({ ...p, estimatedValue: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="lead-desc">Descrição</Label>
              <Textarea
                id="lead-desc"
                placeholder="Informações adicionais sobre o lead..."
                rows={3}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Salvar' : 'Criar Lead'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
