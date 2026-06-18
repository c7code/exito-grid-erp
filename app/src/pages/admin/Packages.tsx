import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { api } from '@/api';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, Loader2, Edit2, Trash2, Package, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

interface PackageData {
  id?: string;
  code: string;
  name: string;
  description: string;
  basePrice: number;
  includedServices: string[];
  rules: Record<string, any>;
  isActive: boolean;
  estimatedDays: number | null;
  createdAt?: string;
  updatedAt?: string;
}

const emptyForm: Omit<PackageData, 'id' | 'createdAt' | 'updatedAt'> = {
  code: '',
  name: '',
  description: '',
  basePrice: 0,
  includedServices: [],
  rules: {},
  isActive: true,
  estimatedDays: null,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function truncate(str: string, max: number): string {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function Packages() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PackageData | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [servicesText, setServicesText] = useState('');

  // ── Load ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getPackages();
      setPackages(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      toast.error('Erro ao carregar pacotes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Stats ───────────────────────────────────────────────────────────
  const total = packages.length;
  const active = packages.filter(p => p.isActive).length;
  const inactive = total - active;
  const avgPrice = total > 0
    ? packages.reduce((sum, p) => sum + Number(p.basePrice || 0), 0) / total
    : 0;

  // ── Filtered list ───────────────────────────────────────────────────
  const filtered = packages.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.code?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  // ── Dialog open ─────────────────────────────────────────────────────
  const handleOpen = (pkg?: PackageData) => {
    if (pkg) {
      setEditing(pkg);
      setForm({
        code: pkg.code || '',
        name: pkg.name || '',
        description: pkg.description || '',
        basePrice: Number(pkg.basePrice) || 0,
        includedServices: pkg.includedServices || [],
        rules: pkg.rules || {},
        isActive: pkg.isActive ?? true,
        estimatedDays: pkg.estimatedDays ?? null,
      });
      setServicesText((pkg.includedServices || []).join(', '));
    } else {
      setEditing(null);
      setForm({ ...emptyForm });
      setServicesText('');
    }
    setDialogOpen(true);
  };

  // ── Save ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Código e Nome são obrigatórios');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        basePrice: Number(form.basePrice) || 0,
        estimatedDays: form.estimatedDays ? Number(form.estimatedDays) : null,
        includedServices: servicesText
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      };
      if (editing?.id) {
        await api.updatePackage(editing.id, payload);
        toast.success('Pacote atualizado com sucesso!');
      } else {
        await api.createPackage(payload);
        toast.success('Pacote criado com sucesso!');
      }
      setDialogOpen(false);
      load();
    } catch {
      toast.error('Erro ao salvar pacote');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────
  const handleToggleActive = async (pkg: PackageData) => {
    try {
      await api.updatePackage(pkg.id!, { isActive: !pkg.isActive });
      toast.success(pkg.isActive ? 'Pacote desativado' : 'Pacote ativado');
      load();
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) return;
    try {
      await api.deletePackage(id);
      toast.success('Pacote excluído');
      load();
    } catch {
      toast.error('Erro ao excluir pacote');
    }
  };

  // ── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-muted-foreground">Carregando pacotes...</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Package className="h-7 w-7 text-blue-500" />
            Pacotes de Serviço
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie pacotes de serviço, preços e prazos estimados
          </p>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Pacote
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-blue-50 p-3">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Pacotes</p>
              <p className="text-2xl font-bold text-slate-800">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-50 p-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ativos</p>
              <p className="text-2xl font-bold text-emerald-700">{active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-red-50 p-3">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Inativos</p>
              <p className="text-2xl font-bold text-red-600">{inactive}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-amber-50 p-3">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Preço Médio</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(avgPrice)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por código, nome ou descrição..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead className="text-right">Preço Base</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Prazo (dias)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    {search ? 'Nenhum pacote encontrado para a busca' : 'Nenhum pacote cadastrado'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(pkg => (
                  <TableRow key={pkg.id} className="group">
                    <TableCell className="font-mono text-xs font-semibold text-slate-600">
                      {pkg.code}
                    </TableCell>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">
                      {truncate(pkg.description, 60)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(Number(pkg.basePrice))}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      {pkg.estimatedDays ? (
                        <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                          <Clock className="h-3.5 w-3.5" />
                          {pkg.estimatedDays}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {pkg.isActive ? (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpen(pkg)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(pkg)}>
                            {pkg.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(pkg.id!)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle>{editing ? 'Editar Pacote' : 'Novo Pacote'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Atualize os dados do pacote de serviço.' : 'Preencha os dados para criar um novo pacote.'}
          </DialogDescription>

          <div className="grid gap-4 pt-2">
            {/* Code + Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-code">
                  Código <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pkg-code"
                  placeholder="Ex: PKG-001"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pkg-name"
                  placeholder="Nome do pacote"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="pkg-desc">Descrição</Label>
              <Textarea
                id="pkg-desc"
                placeholder="Descrição detalhada do pacote..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Base Price + Estimated Days */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-price">Preço Base (R$)</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.basePrice || ''}
                  onChange={e => setForm(f => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-days">Prazo Estimado (dias)</Label>
                <Input
                  id="pkg-days"
                  type="number"
                  min="0"
                  placeholder="Ex: 30"
                  value={form.estimatedDays ?? ''}
                  onChange={e => setForm(f => ({
                    ...f,
                    estimatedDays: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                />
              </div>
            </div>

            {/* Included Services */}
            <div className="space-y-2">
              <Label htmlFor="pkg-services">Serviços Incluídos</Label>
              <Textarea
                id="pkg-services"
                placeholder="Separe por vírgula: Projeto Elétrico, Instalação, Comissionamento"
                value={servicesText}
                onChange={e => setServicesText(e.target.value)}
                rows={2}
              />
              {servicesText && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {servicesText.split(',').map(s => s.trim()).filter(Boolean).map((svc, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {svc}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="pkg-active" className="font-medium">Pacote Ativo</Label>
                <p className="text-xs text-slate-500">
                  Pacotes inativos não aparecem para seleção
                </p>
              </div>
              <Switch
                id="pkg-active"
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? 'Salvar Alterações' : 'Criar Pacote'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
