import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/api';
import {
    UserPlus,
    Search,
    MoreVertical,
    Shield,
    Mail,
    Trash2,
    CheckCircle,
    Clock,
    XCircle,
    Key,
    KeyRound,
    Copy,
    Users as UsersIcon,
    Activity,
    CalendarDays,
    Wifi,
    WifiOff,
    Building2,
    Link2,
    UserCheck,
    Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const roleConfig: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrador', color: 'bg-red-500' },
    commercial: { label: 'Comercial', color: 'bg-blue-500' },
    engineer: { label: 'Engenheiro', color: 'bg-green-500' },
    finance: { label: 'Financeiro', color: 'bg-purple-500' },
    viewer: { label: 'Visualizador', color: 'bg-slate-500' },
    employee: { label: 'Funcionário', color: 'bg-amber-500' },
    client: { label: 'Cliente', color: 'bg-cyan-500' },
};

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    active: { label: 'Ativo', icon: CheckCircle, color: 'text-green-500' },
    inactive: { label: 'Inativo', icon: XCircle, color: 'text-red-500' },
    pending: { label: 'Pendente', icon: Clock, color: 'text-amber-500' },
};

const AVAILABLE_MODULES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'clients', label: 'Clientes' },
    { id: 'proposals', label: 'Propostas' },
    { id: 'contracts', label: 'Contratos' },
    { id: 'client-requests', label: 'Solicitações de Clientes' },
    { id: 'finance-simulator', label: 'Simulador Investimento' },
    { id: 'solar', label: 'Energia Solar' },
    { id: 'works', label: 'Obras' },
    { id: 'tasks', label: 'Tarefas' },
    { id: 'protocols', label: 'Protocolos' },
    { id: 'daily-logs', label: 'Diário de Obra' },
    { id: 'service-orders', label: 'Ordens de Serviço' },
    { id: 'structures', label: 'Estruturas' },
    { id: 'sinapi', label: 'SINAPI' },
    { id: 'budgets', label: 'Orçamentos' },
    { id: 'catalog', label: 'Produtos & Estoque' },
    { id: 'inventory', label: 'Almoxarifado' },
    { id: 'suppliers', label: 'Fornecedores' },
    { id: 'quotations', label: 'Cotações' },
    { id: 'price-history', label: 'Histórico de Preços' },
    { id: 'documents', label: 'Documentos' },
    { id: 'documents-restricted', label: 'Documentos Restritos (Gerencial)' },
    { id: 'finance', label: 'Financeiro' },
    { id: 'fiscal', label: 'Fiscal / NF-e' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'company-documents', label: 'Docs da Empresa' },
    { id: 'safety-programs', label: 'Programas / GHE' },
    { id: 'exam-referrals', label: 'Guias de Exames' },
    { id: 'employees', label: 'Funcionários' },
    { id: 'users', label: 'Usuários' },
    { id: 'companies', label: 'Empresas' },
    { id: 'activity-report', label: 'Relatório Atividades' },
    { id: 'settings', label: 'Configurações' },
];

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        role: 'employee' as string,
        department: '',
        position: '',
        supervisorId: '',
        permissions: [] as string[],
    });
    const [inviteResult, setInviteResult] = useState<{ emailSent: boolean; generatedPassword: string } | null>(null);
    const [permissionsForm, setPermissionsForm] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [resetPasswordResult, setResetPasswordResult] = useState<{ userName: string; userEmail: string; newPassword: string } | null>(null);
    const [, setResettingPassword] = useState(false);

    // === Criar Conta Cliente ===
    const [showClientDialog, setShowClientDialog] = useState(false);
    const [clientMode, setClientMode] = useState<'new' | 'link'>('new');
    const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '' });
    const [existingClients, setExistingClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [clientResult, setClientResult] = useState<{ name: string; email: string; portalPassword: string } | null>(null);
    const [savingClient, setSavingClient] = useState(false);

    // === Disponibilidade ===
    const [availability, setAvailability] = useState<any[]>([]);
    const [availDate, setAvailDate] = useState(() => {
        const d = new Date();
        return d.toISOString().slice(0, 10);
    });
    const [loadingAvail, setLoadingAvail] = useState(false);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Carrega disponibilidade quando muda a data
    const loadAvailability = async () => {
        try {
            setLoadingAvail(true);
            const data = await api.getUserAvailability(availDate);
            setAvailability(data);
        } catch (error) {
            console.error('Erro ao carregar disponibilidade:', error);
        } finally {
            setLoadingAvail(false);
        }
    };

    useEffect(() => {
        loadAvailability();
        const interval = setInterval(loadAvailability, 60 * 1000); // Atualiza a cada 1 min
        return () => clearInterval(interval);
    }, [availDate]);

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja desativar este usuário?')) return;
        try {
            await api.deleteUser(id);
            loadUsers();
        } catch (error) {
            console.error('Erro ao desativar usuário:', error);
        }
    };

    const handleInvite = async () => {
        if (!inviteForm.name || !inviteForm.email) return;
        setSaving(true);
        try {
            const result = await api.inviteUser(inviteForm);
            setInviteResult(result);
            loadUsers();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Erro ao convidar usuário');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenPermissions = (user: any) => {
        setSelectedUser(user);
        setPermissionsForm(user.permissions || []);
        setShowPermissionsDialog(true);
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await api.updateUserPermissions(selectedUser.id, permissionsForm);
            loadUsers();
            setShowPermissionsDialog(false);
        } catch (error) {
            console.error('Erro ao salvar permissões:', error);
        } finally {
            setSaving(false);
        }
    };

    const togglePermission = (moduleId: string, forInvite = false) => {
        if (forInvite) {
            setInviteForm(prev => ({
                ...prev,
                permissions: prev.permissions.includes(moduleId)
                    ? prev.permissions.filter(p => p !== moduleId)
                    : [...prev.permissions, moduleId],
            }));
        } else {
            setPermissionsForm(prev =>
                prev.includes(moduleId)
                    ? prev.filter(p => p !== moduleId)
                    : [...prev, moduleId]
            );
        }
    };

    const selectAllPermissions = (forInvite = false) => {
        const allIds = AVAILABLE_MODULES.map(m => m.id);
        if (forInvite) {
            setInviteForm(prev => ({ ...prev, permissions: allIds }));
        } else {
            setPermissionsForm(allIds);
        }
    };

    const clearAllPermissions = (forInvite = false) => {
        if (forInvite) {
            setInviteForm(prev => ({ ...prev, permissions: [] }));
        } else {
            setPermissionsForm([]);
        }
    };

    const resetInviteForm = () => {
        setInviteForm({
            name: '', email: '', role: 'employee', department: '', position: '', supervisorId: '', permissions: [],
        });
        setInviteResult(null);
    };

    // === Criar Conta Cliente ===
    const openClientDialog = async () => {
        setClientForm({ name: '', email: '', phone: '' });
        setClientResult(null);
        setClientMode('new');
        setSelectedClientId('');
        setShowClientDialog(true);
        // Carregar clientes existentes que ainda não têm User
        try {
            const allClients = await api.getClients();
            const userEmails = new Set(users.map((u: any) => u.email?.toLowerCase()));
            const withoutUser = allClients.filter((c: any) => c.email && !userEmails.has(c.email.toLowerCase()));
            setExistingClients(withoutUser);
        } catch { setExistingClients([]); }
    };

    const handleCreateClientAccount = async () => {
        setSavingClient(true);
        try {
            if (clientMode === 'new') {
                if (!clientForm.name || !clientForm.email) return;
                const result = await api.createClient({
                    name: clientForm.name,
                    email: clientForm.email,
                    phone: clientForm.phone || null,
                });
                setClientResult({
                    name: clientForm.name,
                    email: clientForm.email,
                    portalPassword: result.portalPassword,
                });
                loadUsers();
            } else {
                if (!selectedClientId) return;
                const selectedClient = existingClients.find((c: any) => c.id === selectedClientId);
                const result = await api.generateClientPortalAccess(selectedClientId);
                setClientResult({
                    name: selectedClient?.name || 'Cliente',
                    email: selectedClient?.email || '',
                    portalPassword: result.portalPassword,
                });
                loadUsers();
            }
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Erro ao criar conta do cliente');
        } finally {
            setSavingClient(false);
        }
    };

    const handleResetPassword = async (user: any) => {
        if (!confirm(`Resetar a senha de ${user.name}? Uma nova senha será gerada.`)) return;
        setResettingPassword(true);
        try {
            const result = await api.resetUserPassword(user.id);
            setResetPasswordResult({
                userName: user.name,
                userEmail: user.email,
                newPassword: result.newPassword,
            });
            setShowResetPasswordDialog(true);
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Erro ao resetar senha');
        } finally {
            setResettingPassword(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );

    const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'commercial' || u.role === 'engineer');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <UsersIcon className="w-7 h-7 text-amber-500" />
                        Gestão de Usuários
                    </h1>
                    <p className="text-slate-500 mt-1">Gerencie acesso, permissões e convites</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={openClientDialog}
                        variant="outline"
                        className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 font-medium"
                    >
                        <Building2 className="w-4 h-4 mr-2" />
                        Criar Conta Cliente
                    </Button>
                    <Button
                        onClick={() => { resetInviteForm(); setShowInviteDialog(true); }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Convidar Colaborador
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Buscar por nome ou e-mail..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xl md:text-2xl font-bold text-slate-900">{users.length}</p>
                        <p className="text-sm text-slate-500">Total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</p>
                        <p className="text-sm text-slate-500">Ativos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">{users.filter(u => u.status === 'pending').length}</p>
                        <p className="text-sm text-slate-500">Pendentes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{users.filter(u => u.status === 'inactive').length}</p>
                        <p className="text-sm text-slate-500">Inativos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Disponibilidade Diária */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            Disponibilidade na Plataforma
                        </h2>
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={availDate}
                                onChange={e => setAvailDate(e.target.value)}
                                className="text-sm border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                    </div>

                    {loadingAvail ? (
                        <p className="text-center py-6 text-slate-400">Carregando...</p>
                    ) : availability.length === 0 ? (
                        <p className="text-center py-6 text-slate-400">Nenhum dado para esta data</p>
                    ) : (
                        <div className="space-y-2">
                            {availability.map(u => {
                                const MAX_HOURS = 10;
                                const pct = Math.min((u.totalMinutes / (MAX_HOURS * 60)) * 100, 100);
                                const barColor = u.isOnline
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                    : u.totalMinutes > 0
                                        ? 'bg-gradient-to-r from-slate-300 to-slate-400'
                                        : 'bg-slate-200';
                                const roleInfo = roleConfig[u.role] || { label: u.role, color: 'bg-slate-500' };

                                return (
                                    <div key={u.userId} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        {/* Avatar + status */}
                                        <div className="relative">
                                            <div className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium',
                                                roleInfo.color
                                            )}>
                                                {u.userName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={cn(
                                                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                                                u.isOnline ? 'bg-emerald-400' : 'bg-slate-300'
                                            )} />
                                        </div>

                                        {/* Nome + status */}
                                        <div className="w-36 min-w-[9rem]">
                                            <p className="text-sm font-medium text-slate-800 truncate">{u.userName}</p>
                                            <div className="flex items-center gap-1">
                                                {u.isOnline ? (
                                                    <><Wifi className="w-3 h-3 text-emerald-500" /><span className="text-[11px] text-emerald-600">Online</span></>
                                                ) : (
                                                    <><WifiOff className="w-3 h-3 text-slate-400" /><span className="text-[11px] text-slate-400">Offline</span></>
                                                )}
                                            </div>
                                        </div>

                                        {/* Barra de progresso */}
                                        <div className="flex-1">
                                            <div className="h-5 bg-slate-100 rounded-full overflow-hidden relative">
                                                <div
                                                    className={cn('h-full rounded-full transition-all duration-500', barColor)}
                                                    style={{ width: `${pct}%` }}
                                                />
                                                {pct > 15 && (
                                                    <span className="absolute inset-0 flex items-center px-2.5 text-[11px] font-medium text-white drop-shadow">
                                                        {u.totalFormatted}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tempo total */}
                                        <div className="w-16 text-right">
                                            <span className="text-sm font-semibold text-slate-700">{u.totalFormatted}</span>
                                        </div>

                                        {/* Sessões */}
                                        <div className="w-20 text-right">
                                            <span className="text-xs text-slate-400">
                                                {u.sessions.length} {u.sessions.length === 1 ? 'sessão' : 'sessões'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Legenda */}
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            Online agora
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                            Offline (ativo hoje)
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                            Sem atividade
                        </div>
                        <span className="ml-auto text-[11px] text-slate-400">Barra = proporção de 10h</span>
                    </div>
                </CardContent>
            </Card>

            {/* User List */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Usuário</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Cargo</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Função</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Permissões</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-slate-500">Carregando...</td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-slate-500">Nenhum usuário encontrado</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => {
                                        const role = roleConfig[user.role] || { label: user.role, color: 'bg-slate-500' };
                                        const status = statusConfig[user.status] || statusConfig.active;
                                        const StatusIcon = status.icon;
                                        const permCount = (user.permissions || []).length;

                                        return (
                                            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium',
                                                            role.color
                                                        )}>
                                                            {user.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{user.name}</p>
                                                            <p className="text-xs text-slate-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="text-xs">
                                                        {role.label}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-600">
                                                        {user.position || user.department || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <StatusIcon className={cn('w-4 h-4', status.color)} />
                                                        <span className="text-sm text-slate-600">{status.label}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => handleOpenPermissions(user)}
                                                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        <Shield className="w-3.5 h-3.5" />
                                                        {user.role === 'admin' ? 'Total' : `${permCount} módulos`}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleOpenPermissions(user)}>
                                                                <Key className="w-4 h-4 mr-2" />
                                                                Permissões
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                                                <KeyRound className="w-4 h-4 mr-2" />
                                                                Resetar Senha
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600">
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Desativar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog: Convidar Colaborador */}
            <Dialog open={showInviteDialog} onOpenChange={(open) => { setShowInviteDialog(open); if (!open) resetInviteForm(); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-amber-500" />
                            Convidar Colaborador
                        </DialogTitle>
                    </DialogHeader>

                    {inviteResult ? (
                        /* Resultado do Convite */
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-green-800">Colaborador convidado com sucesso!</h3>
                                <p className="text-green-600 mt-1">
                                    {inviteResult.emailSent
                                        ? 'Um e-mail foi enviado com as credenciais de acesso.'
                                        : 'O e-mail não pôde ser enviado (SMTP não configurado). Compartilhe as credenciais manualmente:'
                                    }
                                </p>
                            </div>

                            {!inviteResult.emailSent && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-slate-700 mb-2">Credenciais geradas:</p>
                                    <p className="text-sm text-slate-600">
                                        <strong>E-mail:</strong> {inviteForm.email}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        <strong>Senha:</strong>{' '}
                                        <code className="bg-slate-900 text-amber-400 px-3 py-1 rounded text-base font-mono">
                                            {inviteResult.generatedPassword}
                                        </code>
                                    </p>
                                    <p className="text-xs text-red-500 mt-2">
                                        ⚠️ Copie esta senha agora! Ela não será exibida novamente.
                                    </p>
                                </div>
                            )}

                            <Button onClick={() => { setShowInviteDialog(false); resetInviteForm(); }} className="w-full">
                                Fechar
                            </Button>
                        </div>
                    ) : (
                        /* Formulário de Convite */
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Nome completo *</label>
                                    <Input
                                        placeholder="Nome do colaborador"
                                        value={inviteForm.name}
                                        onChange={e => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">E-mail *</label>
                                    <Input
                                        type="email"
                                        placeholder="email@empresa.com"
                                        value={inviteForm.email}
                                        onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Perfil</label>
                                    <Select value={inviteForm.role} onValueChange={v => setInviteForm(prev => ({ ...prev, role: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employee">Funcionário</SelectItem>
                                            <SelectItem value="commercial">Comercial</SelectItem>
                                            <SelectItem value="engineer">Engenheiro</SelectItem>
                                            <SelectItem value="finance">Financeiro</SelectItem>
                                            <SelectItem value="viewer">Visualizador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Departamento</label>
                                    <Input
                                        placeholder="Ex: Engenharia"
                                        value={inviteForm.department}
                                        onChange={e => setInviteForm(prev => ({ ...prev, department: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Cargo</label>
                                    <Input
                                        placeholder="Ex: Analista"
                                        value={inviteForm.position}
                                        onChange={e => setInviteForm(prev => ({ ...prev, position: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Supervisor */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">Supervisor direto</label>
                                <select
                                    value={inviteForm.supervisorId}
                                    onChange={e => setInviteForm(prev => ({ ...prev, supervisorId: e.target.value }))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">Nenhum (opcional)</option>
                                    {adminUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({roleConfig[u.role]?.label})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Permissões */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                        <Shield className="w-4 h-4 text-amber-500" />
                                        Permissões de Módulos
                                    </label>
                                    <div className="flex gap-2">
                                        <button onClick={() => selectAllPermissions(true)} className="text-xs text-blue-600 hover:underline">Marcar todos</button>
                                        <button onClick={() => clearAllPermissions(true)} className="text-xs text-red-600 hover:underline">Desmarcar todos</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {AVAILABLE_MODULES.map(mod => (
                                        <label
                                            key={mod.id}
                                            className={cn(
                                                'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                                                inviteForm.permissions.includes(mod.id)
                                                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={inviteForm.permissions.includes(mod.id)}
                                                onChange={() => togglePermission(mod.id, true)}
                                                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                            />
                                            {mod.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                                <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-700">
                                    Uma senha será gerada automaticamente e enviada para o e-mail do colaborador.
                                    Ele poderá acessar o sistema imediatamente após receber o e-mail.
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleInvite}
                                    disabled={!inviteForm.name || !inviteForm.email || saving}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                >
                                    {saving ? 'Enviando...' : 'Convidar e Enviar Senha'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog: Gerenciar Permissões */}
            <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-amber-500" />
                            Permissões — {selectedUser?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedUser?.role === 'admin' ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                            <Shield className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                            <p className="font-medium text-amber-800">Administrador</p>
                            <p className="text-sm text-amber-600">Acesso total a todos os módulos</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">{permissionsForm.length} módulos liberados</p>
                                <div className="flex gap-2">
                                    <button onClick={() => selectAllPermissions()} className="text-xs text-blue-600 hover:underline">Todos</button>
                                    <button onClick={() => clearAllPermissions()} className="text-xs text-red-600 hover:underline">Nenhum</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_MODULES.map(mod => (
                                    <label
                                        key={mod.id}
                                        className={cn(
                                            'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                                            permissionsForm.includes(mod.id)
                                                ? 'border-amber-400 bg-amber-50 text-amber-800'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={permissionsForm.includes(mod.id)}
                                            onChange={() => togglePermission(mod.id)}
                                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                        />
                                        {mod.label}
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>Cancelar</Button>
                                <Button
                                    onClick={handleSavePermissions}
                                    disabled={saving}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Permissões'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog: Senha Resetada */}
            <Dialog open={showResetPasswordDialog} onOpenChange={(open) => { setShowResetPasswordDialog(open); if (!open) setResetPasswordResult(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-amber-500" />
                            Senha Resetada
                        </DialogTitle>
                    </DialogHeader>

                    {resetPasswordResult && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                <h3 className="font-semibold text-green-800">Nova senha gerada com sucesso!</h3>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                                <p className="text-sm text-slate-600">
                                    <strong>Usuário:</strong> {resetPasswordResult.userName}
                                </p>
                                <p className="text-sm text-slate-600">
                                    <strong>E-mail:</strong> {resetPasswordResult.userEmail}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-sm text-slate-600"><strong>Nova Senha:</strong></p>
                                    <code className="bg-slate-900 text-amber-400 px-3 py-1 rounded text-base font-mono">
                                        {resetPasswordResult.newPassword}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(resetPasswordResult.newPassword);
                                            alert('Senha copiada!');
                                        }}
                                        className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
                                        title="Copiar senha"
                                    >
                                        <Copy className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>
                                <p className="text-xs text-red-500 mt-2">
                                    ⚠️ Copie esta senha agora! Ela não será exibida novamente.
                                </p>
                            </div>

                            <Button
                                onClick={() => { setShowResetPasswordDialog(false); setResetPasswordResult(null); }}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900"
                            >
                                Fechar
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog: Criar Conta Cliente */}
            <Dialog open={showClientDialog} onOpenChange={(open) => { setShowClientDialog(open); if (!open) setClientResult(null); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-cyan-500" />
                            Criar Conta de Cliente
                        </DialogTitle>
                    </DialogHeader>

                    {clientResult ? (
                        /* Resultado — exibe credenciais */
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <UserCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-green-800">Conta criada com sucesso!</h3>
                                <p className="text-green-600 mt-1 text-sm">
                                    O cliente pode acessar o portal com as credenciais abaixo.
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                                <p className="text-sm text-slate-600">
                                    <strong>Nome:</strong> {clientResult.name}
                                </p>
                                <p className="text-sm text-slate-600">
                                    <strong>E-mail:</strong> {clientResult.email}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-sm text-slate-600"><strong>Senha:</strong></p>
                                    <code className="bg-slate-900 text-cyan-400 px-3 py-1 rounded text-base font-mono">
                                        {clientResult.portalPassword}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(clientResult.portalPassword);
                                            alert('Senha copiada!');
                                        }}
                                        className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
                                        title="Copiar senha"
                                    >
                                        <Copy className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>
                                <p className="text-xs text-red-500 mt-2">
                                    ⚠️ Copie esta senha agora! Ela não será exibida novamente.
                                </p>
                            </div>

                            <Button
                                onClick={() => { setShowClientDialog(false); setClientResult(null); }}
                                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                            >
                                Fechar
                            </Button>
                        </div>
                    ) : (
                        /* Formulário */
                        <div className="space-y-4">
                            {/* Toggle: Novo vs Vincular */}
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                <button
                                    onClick={() => setClientMode('new')}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
                                        clientMode === 'new'
                                            ? 'bg-white text-cyan-700 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    )}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Novo Cliente
                                </button>
                                <button
                                    onClick={() => setClientMode('link')}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
                                        clientMode === 'link'
                                            ? 'bg-white text-cyan-700 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    )}
                                >
                                    <Link2 className="w-4 h-4" />
                                    Vincular Existente
                                </button>
                            </div>

                            {clientMode === 'new' ? (
                                /* Formulário simplificado para novo cliente */
                                <div className="space-y-3">
                                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                                        <p className="text-xs text-cyan-700">
                                            💡 Preencha apenas o básico. O cliente poderá completar os demais dados (CNPJ, endereço, etc.) pelo portal ou o admin pode editar na tela de Clientes.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Nome completo *</label>
                                        <Input
                                            placeholder="Nome do cliente ou razão social"
                                            value={clientForm.name}
                                            onChange={e => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">E-mail *</label>
                                        <Input
                                            type="email"
                                            placeholder="cliente@email.com"
                                            value={clientForm.email}
                                            onChange={e => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" /> Telefone
                                        </label>
                                        <Input
                                            placeholder="(00) 00000-0000"
                                            value={clientForm.phone}
                                            onChange={e => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* Seleção de cliente existente */
                                <div className="space-y-3">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-xs text-blue-700">
                                            🔗 Selecione um cliente já cadastrado que ainda não possui acesso ao portal. Uma nova senha será gerada.
                                        </p>
                                    </div>
                                    {existingClients.length === 0 ? (
                                        <div className="text-center py-6 text-slate-400">
                                            <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                            <p className="text-sm">Todos os clientes já possuem conta de acesso!</p>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedClientId}
                                            onChange={e => setSelectedClientId(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="">Selecione um cliente...</option>
                                            {existingClients.map((c: any) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} — {c.email}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="outline" onClick={() => setShowClientDialog(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateClientAccount}
                                    disabled={
                                        savingClient ||
                                        (clientMode === 'new' && (!clientForm.name || !clientForm.email)) ||
                                        (clientMode === 'link' && !selectedClientId)
                                    }
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                >
                                    {savingClient ? 'Criando...' : clientMode === 'new' ? 'Criar Conta' : 'Gerar Acesso'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
