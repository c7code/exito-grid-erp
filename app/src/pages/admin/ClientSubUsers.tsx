import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users, Plus, Search, MoreHorizontal, Shield, Eye, HardHat,
  Loader2, Trash2, Edit2, KeyRound, Copy, UserCircle, Building2,
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, { label: string; color: string; icon: any }> = {
  owner: { label: 'Proprietário', color: 'bg-amber-100 text-amber-700', icon: Shield },
  manager: { label: 'Gestor', color: 'bg-blue-100 text-blue-700', icon: Shield },
  safety: { label: 'Segurança', color: 'bg-purple-100 text-purple-700', icon: HardHat },
  viewer: { label: 'Visualização', color: 'bg-slate-100 text-slate-600', icon: Eye },
};

export default function AdminClientSubUsers() {
  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState<any>({ role: 'viewer' });
  const [saving, setSaving] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);

  const loadData = async () => {
    try {
      const [su, cl] = await Promise.all([
        api.getClientSubUsers(),
        api.getClients(),
      ]);
      setSubUsers(Array.isArray(su) ? su : []);
      setClients(Array.isArray(cl) ? cl : []);
    } catch { toast.error('Erro ao carregar sub-usuários'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.email || !form.clientId) {
      return toast.error('Preencha nome, email e cliente.');
    }
    setSaving(true);
    try {
      if (editingUser) {
        await api.updateClientSubUser(editingUser.id, form);
        toast.success('Sub-usuário atualizado!');
        setDialogOpen(false);
      } else {
        const result = await api.createClientSubUser({
          ...form,
          password: form.password || undefined,
        });
        if (result?.plainPassword) {
          setNewCredentials({ email: form.email, password: result.plainPassword });
        }
        toast.success('Sub-usuário criado!');
        setDialogOpen(false);
      }
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este sub-usuário?')) return;
    try {
      await api.deleteClientSubUser(id);
      toast.success('Sub-usuário removido');
      loadData();
    } catch { toast.error('Erro ao remover'); }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm('Gerar nova senha para este sub-usuário?')) return;
    try {
      const result = await api.resetClientSubUserPassword(id);
      if (result?.plainPassword) {
        const su = subUsers.find(s => s.id === id);
        setNewCredentials({ email: su?.email || '', password: result.plainPassword });
        toast.success('Senha redefinida!');
      }
    } catch { toast.error('Erro ao redefinir senha'); }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const openNew = () => {
    setEditingUser(null);
    setForm({ role: 'viewer', clientId: clientFilter !== 'all' ? clientFilter : '' });
    setDialogOpen(true);
  };

  const openEdit = (su: any) => {
    setEditingUser(su);
    setForm({
      name: su.name, email: su.email, role: su.role, phone: su.phone,
      position: su.position, clientId: su.clientId, isActive: su.isActive,
      allowedModules: su.allowedModules, allowedWorks: su.allowedWorks,
    });
    setDialogOpen(true);
  };

  const filtered = subUsers.filter(su => {
    if (clientFilter !== 'all' && su.clientId !== clientFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return su.name?.toLowerCase().includes(s) || su.email?.toLowerCase().includes(s) || su.clientName?.toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-10 h-10 text-amber-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            Sub-Usuários de Clientes
          </h1>
          <p className="text-slate-500">Gestão de acessos do portal do cliente</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Sub-Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{subUsers.length}</p>
              <p className="text-xs font-bold text-blue-600/60 uppercase">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-900">{subUsers.filter(s => s.isActive).length}</p>
              <p className="text-xs font-bold text-emerald-600/60 uppercase">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <HardHat className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">{subUsers.filter(s => s.role === 'safety').length}</p>
              <p className="text-xs font-bold text-purple-600/60 uppercase">Segurança</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">{new Set(subUsers.map(s => s.clientId)).size}</p>
              <p className="text-xs font-bold text-amber-600/60 uppercase">Clientes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-64 h-11">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.filter(c => c.hasPortalAccess).map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-slate-200 overflow-hidden shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Usuário</TableHead>
                <TableHead className="font-bold text-slate-700">Cliente</TableHead>
                <TableHead className="font-bold text-slate-700">Perfil</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Último Login</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((su) => {
                const roleInfo = roleLabels[su.role] || roleLabels.viewer;
                const RoleIcon = roleInfo.icon;
                return (
                  <TableRow key={su.id} className="group hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border-2 border-white shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-bold text-xs">
                            {su.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{su.name}</p>
                          <p className="text-[10px] text-slate-400">{su.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600 font-medium">{su.clientName || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('flex items-center gap-1 w-fit text-[10px] font-bold', roleInfo.color)}>
                        <RoleIcon className="w-3 h-3" />
                        {roleInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'font-bold text-[10px] uppercase px-2 shadow-sm border-none',
                        su.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      )}>
                        {su.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500">
                        {su.lastLoginAt ? new Date(su.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-amber-500">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 border-none shadow-2xl p-2 rounded-xl">
                          <DropdownMenuItem className="rounded-lg gap-2 font-bold" onClick={() => openEdit(su)}>
                            <Edit2 className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 font-bold text-amber-600" onClick={() => handleResetPassword(su.id)}>
                            <KeyRound className="w-4 h-4" /> Redefinir Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 font-bold text-red-600" onClick={() => handleDelete(su.id)}>
                            <Trash2 className="w-4 h-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400 italic">
                    Nenhum sub-usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg p-0 border-none shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {editingUser ? 'Editar Sub-Usuário' : 'Novo Sub-Usuário'}
                </DialogTitle>
                <DialogDescription className="text-indigo-200 text-sm">
                  {editingUser ? 'Atualize os dados e permissões' : 'Criar acesso ao portal do cliente'}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600">Cliente *</label>
                <Select value={form.clientId || ''} onValueChange={v => setForm((f: any) => ({ ...f, clientId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.filter(c => c.hasPortalAccess).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Nome *</label>
                <Input value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Email *</label>
                <Input type="email" value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
              </div>
              {!editingUser && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Senha (deixe vazio para gerar)</label>
                  <Input type="password" value={form.password || ''} onChange={e => setForm((f: any) => ({ ...f, password: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-600">Perfil *</label>
                <Select value={form.role || 'viewer'} onValueChange={v => setForm((f: any) => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="safety">Segurança do Trabalho</SelectItem>
                    <SelectItem value="viewer">Somente Visualização</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Telefone</label>
                <Input value={form.phone || ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Cargo</label>
                <Input value={form.position || ''} onChange={e => setForm((f: any) => ({ ...f, position: e.target.value }))} placeholder="Ex: Engenheiro de Segurança" />
              </div>
            </div>

            {/* Role description */}
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
              {form.role === 'manager' && '🔑 Gestor: Acesso total delegado pelo proprietário. Pode ver todas as áreas do portal.'}
              {form.role === 'safety' && '🔒 Segurança: Acesso restrito a documentos de funcionários e equipe. Não vê financeiro nem contratos.'}
              {form.role === 'viewer' && '👁️ Visualização: Acesso somente leitura. Vê apenas o que for liberado.'}
            </div>

            <DialogFooter className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                {editingUser ? 'Salvar' : 'Criar Sub-Usuário'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={!!newCredentials} onOpenChange={() => setNewCredentials(null)}>
        <DialogContent className="max-w-sm p-0 border-none shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <KeyRound className="w-7 h-7" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Credenciais</DialogTitle>
                <DialogDescription className="text-emerald-200 text-sm">Copie e envie ao usuário</DialogDescription>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Email</span>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(newCredentials?.email || '')}>
                  <Copy className="w-3 h-3 mr-1" /> Copiar
                </Button>
              </div>
              <code className="block text-sm font-mono font-bold text-slate-700">{newCredentials?.email}</code>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Senha</span>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(newCredentials?.password || '')}>
                  <Copy className="w-3 h-3 mr-1" /> Copiar
                </Button>
              </div>
              <code className="block text-sm font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{newCredentials?.password}</code>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                ⚠️ <strong>Atenção:</strong> Esta senha não será exibida novamente. Copie e envie ao usuário agora.
              </p>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setNewCredentials(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
