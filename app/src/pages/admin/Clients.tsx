import { useState, useEffect } from 'react';
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
  Mail,
  Phone,
  MoreHorizontal,
  UserCircle,
  CheckCircle2,
  Building2,
  Lock,
  Loader2,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Copy,
  KeyRound,
  Globe,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/api';
import { cn } from '@/lib/utils';
import type { Client } from '@/types';
import { ClientDialog } from '@/components/ClientDialog';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{ synced: { name: string; email: string; portalPassword: string }[]; skipped: string[]; errors: string[] } | null>(null);
  const [showSyncResults, setShowSyncResults] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Portal modules config
  const [portalConfigClient, setPortalConfigClient] = useState<Client | null>(null);
  const [portalModules, setPortalModules] = useState<string[]>([]);
  const [savingModules, setSavingModules] = useState(false);

  const AVAILABLE_PORTAL_MODULES = [
    { key: 'obras', label: 'Obras', desc: 'Acompanhamento de obras' },
    { key: 'propostas', label: 'Propostas', desc: 'Propostas comerciais' },
    { key: 'contratos', label: 'Contratos', desc: 'Contratos assinados' },
    { key: 'financeiro', label: 'Financeiro', desc: 'Recibos e medições' },
    { key: 'documentos', label: 'Documentos', desc: 'Documentos gerais' },
    { key: 'equipe', label: 'Equipe', desc: 'Docs de funcionários na obra' },
    { key: 'solicitacoes', label: 'Solicitações', desc: 'Abertura de chamados' },
  ];

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este cliente?')) return;
    try {
      await api.deleteClient(id);
      toast.success('Cliente removido');
      loadClients();
    } catch (error) {
      toast.error('Erro ao remover cliente');
    }
  }

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await api.syncClientsToUsers();
      setSyncResults(result);
      setShowSyncResults(true);
      if (result.synced.length > 0) {
        toast.success(`${result.synced.length} cliente(s) sincronizado(s)!`);
      } else {
        toast.info('Todos os clientes já estão sincronizados.');
      }
    } catch (error) {
      toast.error('Erro ao sincronizar clientes');
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyCredentials = async (email: string, password: string, index: number) => {
    try {
      await navigator.clipboard.writeText(`Login: ${email}\nSenha: ${password}`);
      setCopiedIndex(index);
      toast.success('Credenciais copiadas!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleOpenPortalConfig = async (client: Client) => {
    setPortalConfigClient(client);
    try {
      const data = await api.getClientPortalModules(client.id);
      setPortalModules(data?.modules || ['obras', 'propostas', 'documentos', 'solicitacoes']);
    } catch {
      setPortalModules(['obras', 'propostas', 'documentos', 'solicitacoes']);
    }
  };

  const handleSavePortalModules = async () => {
    if (!portalConfigClient) return;
    setSavingModules(true);
    try {
      await api.updateClientPortalModules(portalConfigClient.id, portalModules);
      toast.success(`Módulos do portal de ${portalConfigClient.name} atualizados!`);
      setPortalConfigClient(null);
    } catch {
      toast.error('Erro ao salvar módulos do portal.');
    } finally {
      setSavingModules(false);
    }
  };

  const toggleModule = (key: string) => {
    setPortalModules(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document?.includes(searchTerm)
  );

  const portalAccessCount = clients.filter(c => c.hasPortalAccess).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-slate-500 font-medium">Carregando carteira de clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-500" />
            Clientes
          </h1>
          <p className="text-slate-500">Gestão centralizada de informações e documentos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 font-bold"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar Usuários
          </Button>
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg"
            onClick={() => {
              setSelectedClient(undefined);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
              <p className="text-xs font-bold text-blue-600/60 uppercase">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-900">{portalAccessCount}</p>
              <p className="text-xs font-bold text-emerald-600/60 uppercase">Com Portal</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shadow-inner">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">{clients.filter(c => c.type === 'company').length}</p>
              <p className="text-xs font-bold text-purple-600/60 uppercase">Empresas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shadow-inner">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">{clients.length - portalAccessCount}</p>
              <p className="text-xs font-bold text-amber-600/60 uppercase">Sem Acesso</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, empresa ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 border-slate-200 focus:ring-amber-500 shadow-sm"
        />
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Cliente / ID</TableHead>
                <TableHead className="font-bold text-slate-700">Empresa</TableHead>
                <TableHead className="font-bold text-slate-700">Contato</TableHead>
                <TableHead className="font-bold text-slate-700">Localização</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Cadastrado por</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="group hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-11 h-11 border-2 border-white shadow-md ring-1 ring-slate-100">
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold">
                          {client.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-700">{client.name}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-slate-300 hover:text-amber-500"
                            onClick={() => {
                              setViewingClient(client);
                              setIsViewerOpen(true);
                            }}
                            title="Abrir Central do Cliente"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{client.document || 'PF'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-600 truncate max-w-[180px]">{client.companyName || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        {client.phone || client.whatsapp || '-'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-600 font-medium">{client.city}, {client.state}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-bold text-[10px] uppercase px-2 shadow-sm border-none",
                      client.hasPortalAccess ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    )}>
                      {client.hasPortalAccess ? 'Portal Ativo' : 'Sem Acesso'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(client as any).createdByUser ? (
                      <span className="text-sm text-slate-600 truncate max-w-[100px] block">{(client as any).createdByUser.name}</span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-amber-500 group-hover:bg-amber-50 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 border-none shadow-2xl p-2 rounded-xl">
                        <DropdownMenuItem
                          className="rounded-lg gap-2 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600"
                          onClick={() => {
                            setViewingClient(client);
                            setIsViewerOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" /> Ver Central
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg gap-2 font-bold text-slate-600 focus:bg-slate-100"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" /> Editar Cadastro
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg gap-2 font-bold text-red-600 focus:bg-red-50 focus:text-red-600"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="w-4 h-4" /> Excluir Cliente
                        </DropdownMenuItem>
                        {(client as any).hasPortalAccess && (
                          <DropdownMenuItem
                            className="rounded-lg gap-2 font-bold text-indigo-600 focus:bg-indigo-50 focus:text-indigo-600"
                            onClick={() => handleOpenPortalConfig(client)}
                          >
                            <Settings className="w-4 h-4" /> Configurar Portal
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                   <TableCell colSpan={7} className="text-center py-24 text-slate-400 italic">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={loadClients}
        client={selectedClient}
      />

      <ClientDetailViewer
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        client={viewingClient}
      />

      {/* Sync Results Dialog */}
      <Dialog open={showSyncResults} onOpenChange={setShowSyncResults}>
        <DialogContent className="max-w-lg p-0 border-none shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <KeyRound className="w-7 h-7" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Sincronização Concluída</DialogTitle>
                <DialogDescription className="text-emerald-200 text-sm">
                  {syncResults?.synced.length || 0} cliente(s) sincronizado(s)
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {syncResults?.synced && syncResults.synced.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Credenciais Geradas</p>
                <div className="space-y-3">
                  {syncResults.synced.map((item, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.email}</p>
                        <code className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                          {item.portalPassword}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={copiedIndex === i ? 'text-emerald-600' : ''}
                        onClick={() => handleCopyCredentials(item.email, item.portalPassword, i)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        {copiedIndex === i ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {syncResults?.skipped && syncResults.skipped.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ignorados (já sincronizados)</p>
                <div className="text-xs text-slate-500 space-y-1">
                  {syncResults.skipped.map((s, i) => (
                    <p key={i}>• {s}</p>
                  ))}
                </div>
              </div>
            )}

            {syncResults?.synced.length === 0 && (
              <div className="text-center py-4">
                <p className="text-slate-500">Todos os clientes já possuem contas de usuário.</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                ⚠️ <strong>Atenção:</strong> Estas senhas não serão exibidas novamente. Copie e envie para cada cliente agora.
              </p>
            </div>

            <Button
              className="w-full"
              variant="ghost"
              onClick={() => setShowSyncResults(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Portal Modules Config Dialog */}
      <Dialog open={!!portalConfigClient} onOpenChange={(open) => { if (!open) setPortalConfigClient(null); }}>
        <DialogContent className="max-w-md p-0 border-none shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Globe className="w-7 h-7" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Configurar Portal</DialogTitle>
                <DialogDescription className="text-indigo-200 text-sm">
                  {portalConfigClient?.name}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-500">Selecione quais módulos serão visíveis no portal deste cliente:</p>
            <div className="space-y-2">
              {AVAILABLE_PORTAL_MODULES.map((mod) => (
                <label
                  key={mod.key}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                    portalModules.includes(mod.key)
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={portalModules.includes(mod.key)}
                    onChange={() => toggleModule(mod.key)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">{mod.label}</p>
                    <p className="text-xs text-slate-400">{mod.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPortalConfigClient(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                onClick={handleSavePortalModules}
                disabled={savingModules}
              >
                {savingModules ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                Salvar Módulos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
