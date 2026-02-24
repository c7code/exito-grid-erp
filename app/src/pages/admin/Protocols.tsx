import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  MoreHorizontal,
  History,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/api';
import { ProtocolTimeline } from '@/components/ProtocolTimeline';
import { NewProtocolDialog } from '@/components/NewProtocolDialog';
import { ProtocolEventDialog } from '@/components/ProtocolEventDialog';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';
import { cn } from '@/lib/utils';
import type { Protocol, ProtocolEvent, Client } from '@/types';
import { toast } from 'sonner';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: any; color: string }> = {
  open: { label: 'Aberto', variant: 'outline', icon: Clock, color: 'text-slate-500' },
  pending: { label: 'Pendente', variant: 'outline', icon: Clock, color: 'text-amber-500' },
  in_analysis: { label: 'Em Análise', variant: 'secondary', icon: FileCheck, color: 'text-blue-500' },
  requirement: { label: 'Exigência', variant: 'destructive', icon: AlertCircle, color: 'text-orange-500' },
  approved: { label: 'Aprovado', variant: 'default', icon: CheckCircle2, color: 'text-emerald-500' },
  rejected: { label: 'Rejeitado', variant: 'destructive', icon: AlertCircle, color: 'text-red-500' },
  expired: { label: 'Expirado', variant: 'destructive', icon: Clock, color: 'text-slate-400' },
  closed: { label: 'Fechado', variant: 'default', icon: CheckCircle2, color: 'text-slate-600' },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: AlertCircle, color: 'text-slate-400' },
};

export default function AdminProtocols() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ProtocolEvent | undefined>(undefined);
  const [isClientViewerOpen, setIsClientViewerOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  useEffect(() => {
    loadProtocols();
  }, []);

  const refreshProtocol = async () => {
    if (!selectedProtocol) return;
    try {
      const updated = await api.findOneProtocol(selectedProtocol.id);
      setSelectedProtocol(updated);
      loadProtocols(); // Update list too
    } catch (err) {
      console.error(err);
    }
  };

  const loadProtocols = async () => {
    try {
      setLoading(true);
      const data = await api.getProtocols();
      setProtocols(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar protocolos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProtocols = protocols.filter((p) =>
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.work?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.utilityCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.protocolNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Protocolos</h1>
          <p className="text-slate-500">Gerencie processos e aprovações em tempo real</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-200"
          onClick={() => setIsNewDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Protocolo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{protocols.length}</p>
              <p className="text-sm font-medium text-blue-600">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">{protocols.filter(p => p.status === 'in_analysis').length}</p>
              <p className="text-sm font-medium text-amber-600">Em Análise</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-900">{protocols.filter(p => p.status === 'approved').length}</p>
              <p className="text-sm font-medium text-emerald-600">Aprovados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-purple-900 truncate max-w-[120px]">Neoenergia</p>
              <p className="text-sm font-medium text-purple-600">Concessionária</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por código, obra ou protocolo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 border-none bg-white shadow-sm ring-1 ring-slate-200 focus:ring-amber-500"
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Código</TableHead>
                <TableHead className="font-bold">Obra</TableHead>
                <TableHead className="font-bold">Setor/Órgão</TableHead>
                <TableHead className="font-bold">Nº Registro</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Abertura</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filteredProtocols.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Nenhum protocolo encontrado.</TableCell></TableRow>
              ) : filteredProtocols.map((protocol) => {
                const status = statusLabels[protocol.status] || statusLabels.open;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={protocol.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedProtocol(protocol)}>
                    <TableCell className="font-bold text-slate-900">{protocol.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 group/client">
                        <Avatar className="w-6 h-6 shrink-0 border border-white shadow-sm">
                          <AvatarFallback className="bg-amber-500 text-white text-[8px] font-bold">
                            {protocol.client?.name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-600 font-medium truncate max-w-[120px]">{protocol.client?.name || protocol.work?.title}</span>
                        {protocol.client && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-5 h-5 opacity-0 group-hover/client:opacity-100 text-slate-300 hover:text-amber-500 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingClient(protocol.client as any);
                              setIsClientViewerOpen(true);
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{protocol.utilityCompany || protocol.type || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{protocol.protocolNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className={cn("flex items-center gap-1.5 w-fit px-2.5 py-1", status.color)}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{protocol.openedAt ? new Date(protocol.openedAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-slate-200">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setSelectedProtocol(protocol)}>
                            <History className="w-4 h-4 mr-2" /> Visualizar Linha do Tempo
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="w-4 h-4 mr-2" /> Acessar Portal Externo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedProtocol} onOpenChange={(open) => !open && setSelectedProtocol(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          {selectedProtocol && (
            <>
              <DialogHeader className="p-6 bg-slate-900 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-md">
                    {selectedProtocol.code}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs opacity-80">
                    <Clock className="w-3 h-3" />
                    Aberto em {new Date(selectedProtocol.openedAt!).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold">{selectedProtocol.work?.title}</DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-1">
                  Gerenciamento de protocolo junto à <span className="text-white font-medium">{selectedProtocol.utilityCompany}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Atual</p>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0",
                        selectedProtocol.status === 'approved' ? 'bg-emerald-500' :
                          selectedProtocol.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'
                      )} />
                      <span className="font-bold text-slate-900">
                        {statusLabels[selectedProtocol.status]?.label}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nº Protocolo</p>
                    <p className="font-mono text-sm text-slate-900">{selectedProtocol.protocolNumber || 'Não informado'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-500" />
                    Histórico do Processo
                  </h3>
                  <ProtocolTimeline
                    events={selectedProtocol.events || []}
                    onEditEvent={(event) => {
                      setEventToEdit(event);
                      setIsEventDialogOpen(true);
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-white border-t flex justify-end gap-3 px-6 py-4">
                <Button variant="outline" onClick={() => setSelectedProtocol(null)}>Fechar</Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                  onClick={() => {
                    setEventToEdit(undefined);
                    setIsEventDialogOpen(true);
                  }}
                >
                  Adicionar Evento
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <NewProtocolDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onSuccess={loadProtocols}
      />

      {selectedProtocol && (
        <ProtocolEventDialog
          open={isEventDialogOpen}
          onOpenChange={setIsEventDialogOpen}
          onSuccess={refreshProtocol}
          protocolId={selectedProtocol.id}
          initialEvent={eventToEdit}
          currentProgress={selectedProtocol.work?.progress}
        />
      )}

      <ClientDetailViewer
        open={isClientViewerOpen}
        onOpenChange={setIsClientViewerOpen}
        client={viewingClient}
      />
    </div>
  );
}
