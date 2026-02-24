import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Shield,
  Clock,
  Save,
  Mail,
  MessageSquare,
} from 'lucide-react';

const workflowStages = [
  { id: 'vistoria', name: 'Vistoria Técnica', defaultDays: 3 },
  { id: 'projeto', name: 'Elaboração de Projeto', defaultDays: 7 },
  { id: 'aprovacao', name: 'Aprovação do Cliente', defaultDays: 5 },
  { id: 'execucao', name: 'Execução da Obra', defaultDays: 30 },
  { id: 'entrega', name: 'Entrega Final', defaultDays: 2 },
];

export default function AdminSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    push: false,
    newLead: true,
    taskDeadline: true,
    protocolUpdate: true,
  });

  const [stages, setStages] = useState(workflowStages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500">Configure o sistema e fluxos de trabalho</p>
      </div>

      <Tabs defaultValue="workflow">
        <TabsList>
          <TabsTrigger value="workflow">Fluxo de Trabalho</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Prazos por Etapa
              </CardTitle>
              <CardDescription>
                Configure os prazos padrão para cada etapa do fluxo de trabalho
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{stage.name}</p>
                    <p className="text-sm text-slate-500">Prazo padrão para conclusão</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={stage.defaultDays}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[index].defaultDays = parseInt(e.target.value);
                        setStages(newStages);
                      }}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-slate-500">dias</span>
                  </div>
                </div>
              ))}
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aprovações</CardTitle>
              <CardDescription>
                Configure quem pode aprovar prazos e mudanças
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Aprovação de Prazos</p>
                  <p className="text-sm text-slate-500">Funcionários podem solicitar, administradores aprovam</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Aprovação do Cliente</p>
                  <p className="text-sm text-slate-500">Cliente deve aprovar etapas antes de prosseguir</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Canais de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-slate-500">Receber notificações por email</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(v) => setNotifications({ ...notifications, email: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-slate-500">Receber notificações por WhatsApp</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.whatsapp}
                  onCheckedChange={(v) => setNotifications({ ...notifications, whatsapp: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Novo Lead</p>
                  <p className="text-sm text-slate-500">Notificar quando um novo lead é capturado</p>
                </div>
                <Switch
                  checked={notifications.newLead}
                  onCheckedChange={(v) => setNotifications({ ...notifications, newLead: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Prazo de Tarefa</p>
                  <p className="text-sm text-slate-500">Notificar quando uma tarefa está próxima do prazo</p>
                </div>
                <Switch
                  checked={notifications.taskDeadline}
                  onCheckedChange={(v) => setNotifications({ ...notifications, taskDeadline: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Atualização de Protocolo</p>
                  <p className="text-sm text-slate-500">Notificar quando há atualização em protocolos</p>
                </div>
                <Switch
                  checked={notifications.protocolUpdate}
                  onCheckedChange={(v) => setNotifications({ ...notifications, protocolUpdate: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrações Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp Business</p>
                    <p className="text-sm text-slate-500">Integração para captura de leads</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500">Conectado</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Email SMTP</p>
                    <p className="text-sm text-slate-500">Envio de notificações por email</p>
                  </div>
                </div>
                <Badge variant="outline">Configurar</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticação de Dois Fatores</p>
                  <p className="text-sm text-slate-500">Exigir 2FA para todos os usuários</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sessão Única</p>
                  <p className="text-sm text-slate-500">Limitar a uma sessão ativa por usuário</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
