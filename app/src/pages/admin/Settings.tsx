import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/api';
import {
  Bell,
  Shield,
  Clock,
  Save,
  Mail,
  MessageSquare,
  DollarSign,
  Trash2,
  Plus,
  Edit,
  Loader2,
  Bot,
  Eye,
  EyeOff,
  Pen,
  Upload,
} from 'lucide-react';
import { SignatureCropDialog } from '@/components/SignatureCropDialog';
import { toast } from 'sonner';

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

  // Markup management
  const [markupConfigs, setMarkupConfigs] = useState<any[]>([]);
  const [loadingMarkup, setLoadingMarkup] = useState(false);
  const [showMarkupDialog, setShowMarkupDialog] = useState(false);
  const [editingMarkup, setEditingMarkup] = useState<any>(null);
  const [markupForm, setMarkupForm] = useState({
    name: '', scope: 'global', scopeValue: '',
    markupMultiplier: 1.0, markupPercentage: 0, minimumMargin: 0,
    priority: 0, isActive: true, description: '',
  });

  const loadMarkupConfigs = async () => {
    setLoadingMarkup(true);
    try { const data = await api.getMarkupConfigs(); setMarkupConfigs(data); }
    catch { toast.error('Erro ao carregar markups'); }
    setLoadingMarkup(false);
  };

  const handleSaveMarkup = async () => {
    if (!markupForm.name) { toast.error('Nome é obrigatório'); return; }
    try {
      if (editingMarkup) {
        await api.updateMarkupConfig(editingMarkup.id, markupForm);
        toast.success('Markup atualizado!');
      } else {
        await api.createMarkupConfig(markupForm);
        toast.success('Markup criado!');
      }
      setShowMarkupDialog(false);
      loadMarkupConfigs();
    } catch { toast.error('Erro ao salvar markup'); }
  };

  const handleDeleteMarkup = async (id: string) => {
    if (!confirm('Remover esta regra de markup?')) return;
    try { await api.deleteMarkupConfig(id); toast.success('Removido'); loadMarkupConfigs(); }
    catch { toast.error('Erro ao remover'); }
  };

  const openNewMarkup = () => {
    setEditingMarkup(null);
    setMarkupForm({
      name: '', scope: 'global', scopeValue: '',
      markupMultiplier: 1.0, markupPercentage: 0, minimumMargin: 0,
      priority: 0, isActive: true, description: '',
    });
    setShowMarkupDialog(true);
  };

  const openEditMarkup = (m: any) => {
    setEditingMarkup(m);
    setMarkupForm({
      name: m.name, scope: m.scope, scopeValue: m.scopeValue || '',
      markupMultiplier: m.markupMultiplier, markupPercentage: m.markupPercentage,
      minimumMargin: m.minimumMargin, priority: m.priority,
      isActive: m.isActive, description: m.description || '',
    });
    setShowMarkupDialog(true);
  };

  const scopeLabels: Record<string, string> = {
    global: 'Global', category: 'Categoria', activity_type: 'Tipo de Atividade',
    supplier_type: 'Tipo Fornecedor', client_type: 'Tipo Cliente',
  };

  // AI Config
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);

  const loadAiConfig = async () => {
    if (aiLoaded) return;
    try {
      const configs = await api.getAiConfigs();
      for (const c of configs) {
        if (c.key === 'ai_api_key') setAiApiKey(c.value);
        if (c.key === 'ai_model') setAiModel(c.value);
        if (c.key === 'ai_enabled') setAiEnabled(c.value !== 'false');
      }
      setAiLoaded(true);
    } catch { /* ignore */ }
  };

  const handleSaveAiConfig = async () => {
    setSavingAi(true);
    try {
      await api.setAiConfig('ai_api_key', aiApiKey, true);
      await api.setAiConfig('ai_model', aiModel);
      await api.setAiConfig('ai_enabled', String(aiEnabled));
      toast.success('Configurações de IA salvas!');
    } catch { toast.error('Erro ao salvar'); }
    setSavingAi(false);
  };

  // ═══ SIGNATURE CONFIG ═══
  const [company, setCompany] = useState<any>(null);
  const [sigLoaded, setSigLoaded] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  // Multi-signature state
  const [signatureSlots, setSignatureSlots] = useState<any[]>([]);
  const [loadingSigs, setLoadingSigs] = useState(false);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [slotForm, setSlotForm] = useState({ label: '', signerName: '', signerRole: '', signerDocument: '', scope: 'company', isDefault: false });
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null);

  const loadSignatureConfig = async () => {
    if (sigLoaded) return;
    setLoadingSigs(true);
    try {
      const c = await api.getPrimaryCompany();
      if (c) {
        setCompany(c);
      }
      const slots = await api.getSignatureSlots();
      setSignatureSlots(Array.isArray(slots) ? slots : []);
      setSigLoaded(true);
    } catch { /* ignore */ }
    setLoadingSigs(false);
  };



  const handleSaveSignatureImage = async (croppedDataUrl: string) => {
    if (!company) return;
    const blob = await (await fetch(croppedDataUrl)).blob();
    const file = new File([blob], 'signature.png', { type: 'image/png' });
    if (uploadingSlotId) {
      // Uploading for a specific slot
      await api.uploadSignatureImage(uploadingSlotId, file);
      const slots = await api.getSignatureSlots();
      setSignatureSlots(Array.isArray(slots) ? slots : []);
      setUploadingSlotId(null);
      toast.success('Imagem de assinatura atualizada!');
    } else {
      const updated = await api.uploadCompanySignature(company.id, file);
      setCompany(updated);
    }
  };

  const handleRemoveSignature = async () => {
    if (!company) return;
    const updated = await api.updateCompany(company.id, { signatureImageUrl: null });
    setCompany(updated);
  };

  const openNewSlot = () => {
    setEditingSlot(null);
    setSlotForm({ label: '', signerName: '', signerRole: '', signerDocument: '', scope: 'company', isDefault: false });
    setShowSlotDialog(true);
  };

  const openEditSlot = (s: any) => {
    setEditingSlot(s);
    setSlotForm({ label: s.label, signerName: s.signerName || '', signerRole: s.signerRole || '', signerDocument: s.signerDocument || '', scope: s.scope, isDefault: s.isDefault });
    setShowSlotDialog(true);
  };

  const handleSaveSlot = async () => {
    if (!slotForm.label) { toast.error('Nome é obrigatório'); return; }
    try {
      if (editingSlot) {
        await api.updateSignatureSlot(editingSlot.id, slotForm);
        toast.success('Assinatura atualizada!');
      } else {
        await api.createSignatureSlot(slotForm);
        toast.success('Assinatura criada!');
      }
      setShowSlotDialog(false);
      const slots = await api.getSignatureSlots();
      setSignatureSlots(Array.isArray(slots) ? slots : []);
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Remover esta assinatura?')) return;
    try {
      await api.deleteSignatureSlot(id);
      setSignatureSlots(prev => prev.filter(s => s.id !== id));
      toast.success('Assinatura removida');
    } catch { toast.error('Erro ao remover'); }
  };

  const scopeLabelsMap: Record<string, { label: string; color: string }> = {
    company: { label: 'Empresa', color: 'bg-blue-100 text-blue-700' },
    client: { label: 'Cliente', color: 'bg-green-100 text-green-700' },
    employee: { label: 'Funcionário', color: 'bg-purple-100 text-purple-700' },
    witness: { label: 'Testemunha', color: 'bg-amber-100 text-amber-700' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500">Configure o sistema e fluxos de trabalho</p>
      </div>

      <Tabs defaultValue="workflow">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="workflow">Fluxo de Trabalho</TabsTrigger>
          <TabsTrigger value="signatures" onClick={loadSignatureConfig}>
            <Pen className="w-3.5 h-3.5 mr-1" /> Assinaturas
          </TabsTrigger>
          <TabsTrigger value="markup" onClick={() => markupConfigs.length === 0 && loadMarkupConfigs()}>Markup</TabsTrigger>
          <TabsTrigger value="ai" onClick={loadAiConfig}>IA</TabsTrigger>
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
                      type="text" inputMode="decimal"
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

        {/* ═══ ASSINATURAS TAB ═══ */}
        <TabsContent value="signatures" className="space-y-6">
          {/* Biblioteca de Assinaturas */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2"><Pen className="w-5 h-5" /> Biblioteca de Assinaturas</CardTitle>
                  <CardDescription>Cadastre assinaturas reutilizáveis para todos os documentos impressos do sistema</CardDescription>
                </div>
                <Button onClick={openNewSlot} className="bg-amber-500 hover:bg-amber-600 text-slate-900" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Nova Assinatura
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSigs ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-500 mr-2" /> Carregando...</div>
              ) : signatureSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Pen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-2">Nenhuma assinatura cadastrada</p>
                  <p className="text-xs text-slate-400 mb-4">Clique em "Nova Assinatura" para começar. Você pode cadastrar assinaturas da empresa, clientes, funcionários e testemunhas.</p>
                  <Button onClick={openNewSlot} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Cadastrar Primeira Assinatura</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {signatureSlots.map((slot: any) => {
                    const scopeInfo = scopeLabelsMap[slot.scope] || { label: slot.scope, color: 'bg-gray-100 text-gray-700' };
                    const imgSrc = slot.imageUrl ? (slot.imageUrl.startsWith('/') ? `${(window as any).__API_BASE_URL || ''}${slot.imageUrl}` : slot.imageUrl) : null;
                    return (
                      <div key={slot.id} className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm text-slate-800">{slot.label}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-[10px] ${scopeInfo.color}`}>{scopeInfo.label}</Badge>
                              {slot.isDefault && <Badge className="text-[10px] bg-amber-100 text-amber-700">⭐ Padrão</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSlot(slot)}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => handleDeleteSlot(slot.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>

                        {/* Image preview */}
                        <div className="bg-gray-50 border rounded-lg p-3 min-h-[60px] flex items-center justify-center">
                          {imgSrc ? (
                            <img src={imgSrc} alt="Assinatura" className="max-h-[70px] max-w-full object-contain" />
                          ) : (
                            <div className="text-center cursor-pointer" onClick={() => { setUploadingSlotId(slot.id); setShowSignatureDialog(true); }}>
                              <Upload className="w-5 h-5 text-slate-300 mx-auto" />
                              <p className="text-[10px] text-slate-400 mt-1">Enviar imagem</p>
                            </div>
                          )}
                        </div>

                        {/* Signer info */}
                        <div className="space-y-1 text-xs text-slate-500">
                          {slot.signerName && <p>👤 {slot.signerName}</p>}
                          {slot.signerRole && <p>💼 {slot.signerRole}</p>}
                          {slot.signerDocument && <p>📋 {slot.signerDocument}</p>}
                        </div>

                        {/* Upload button if has image already */}
                        {imgSrc && (
                          <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => { setUploadingSlotId(slot.id); setShowSignatureDialog(true); }}>
                            <Upload className="w-3 h-3 mr-1" /> Trocar Imagem
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Explainer */}
          <Card>
            <CardHeader>
              <CardTitle>Como funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex gap-3 items-start"><span className="text-lg">🏢</span><div><p className="font-medium text-slate-800">Assinatura da Empresa</p><p>Cadastre a assinatura do diretor/responsável legal. Será usada como CONTRATADA em propostas, medições e contratos.</p></div></div>
              <div className="flex gap-3 items-start"><span className="text-lg">👷</span><div><p className="font-medium text-slate-800">Assinatura de Funcionário</p><p>Para engenheiros e técnicos. Cada obra pode ter um responsável diferente — selecione na hora de gerar o documento.</p></div></div>
              <div className="flex gap-3 items-start"><span className="text-lg">🏗️</span><div><p className="font-medium text-slate-800">Assinatura de Cliente</p><p>Clientes corporativos como MRV podem ter vários engenheiros responsáveis. Cadastre cada um e vincule por documento.</p></div></div>
              <div className="flex gap-3 items-start"><span className="text-lg">✍️</span><div><p className="font-medium text-slate-800">Testemunha</p><p>Pré-cadastre testemunhas que assinam frequentemente. Selecione por documento conforme necessário.</p></div></div>
            </CardContent>
          </Card>

          {/* Dialog: Nova/Editar Assinatura */}
          <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
            <DialogContent className="max-w-lg w-[95vw] md:w-auto">
              <DialogHeader>
                <DialogTitle>{editingSlot ? 'Editar Assinatura' : 'Nova Assinatura'}</DialogTitle>
                <DialogDescription>Cadastre os dados do signatário e envie a imagem da assinatura</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome da Assinatura *</Label><Input value={slotForm.label} onChange={e => setSlotForm(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Diretor Técnico, Eng. Marcos (MRV)" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Nome do Signatário</Label><Input value={slotForm.signerName} onChange={e => setSlotForm(p => ({ ...p, signerName: e.target.value }))} placeholder="João da Silva" /></div>
                  <div><Label>Cargo</Label><Input value={slotForm.signerRole} onChange={e => setSlotForm(p => ({ ...p, signerRole: e.target.value }))} placeholder="Diretor Técnico" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>CPF/CNPJ</Label><Input value={slotForm.signerDocument} onChange={e => setSlotForm(p => ({ ...p, signerDocument: e.target.value }))} placeholder="000.000.000-00" /></div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={slotForm.scope} onValueChange={v => setSlotForm(p => ({ ...p, scope: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">🏢 Empresa</SelectItem>
                        <SelectItem value="employee">👷 Funcionário</SelectItem>
                        <SelectItem value="client">🏗️ Cliente</SelectItem>
                        <SelectItem value="witness">✍️ Testemunha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={slotForm.isDefault} onCheckedChange={v => setSlotForm(p => ({ ...p, isDefault: v }))} />
                  <Label className="text-sm">Assinatura padrão para este tipo (usada como fallback automático)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSlotDialog(false)}>Cancelar</Button>
                <Button onClick={handleSaveSlot} className="bg-amber-500 hover:bg-amber-600 text-slate-900">{editingSlot ? 'Salvar' : 'Criar'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <SignatureCropDialog
            open={showSignatureDialog}
            onOpenChange={(v) => { setShowSignatureDialog(v); if (!v) setUploadingSlotId(null); }}
            currentSignatureUrl={uploadingSlotId ? signatureSlots.find((s: any) => s.id === uploadingSlotId)?.imageUrl : company?.signatureImageUrl}
            onSave={handleSaveSignatureImage}
            onRemove={handleRemoveSignature}
            title={uploadingSlotId ? 'Imagem da Assinatura' : 'Assinatura da Empresa'}
          />
        </TabsContent>

        {/* ═══ MARKUP TAB ═══ */}
        <TabsContent value="markup" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Regras de Markup</CardTitle>
                  <CardDescription>Configure as margens de lucro por escopo (global, categoria, tipo de fornecedor, etc.)</CardDescription>
                </div>
                <Button onClick={openNewMarkup} className="bg-amber-500 hover:bg-amber-600 text-slate-900" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Nova Regra
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMarkup ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-500 mr-2" /> Carregando...</div>
              ) : markupConfigs.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">Nenhuma regra de markup configurada. Clique em "Nova Regra" para começar.</p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Escopo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Multiplicador</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-center">Prioridade</TableHead>
                      <TableHead className="text-center">Ativo</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {markupConfigs.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{scopeLabels[m.scope] || m.scope}</Badge></TableCell>
                        <TableCell className="text-xs text-slate-500">{m.scopeValue || '—'}</TableCell>
                        <TableCell className="text-right">x{Number(m.markupMultiplier).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{Number(m.markupPercentage).toFixed(1)}%</TableCell>
                        <TableCell className="text-center">{m.priority}</TableCell>
                        <TableCell className="text-center">{m.isActive ? '✅' : '❌'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMarkup(m)}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => handleDeleteMarkup(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Markup Dialog */}
          <Dialog open={showMarkupDialog} onOpenChange={setShowMarkupDialog}>
            <DialogContent className="max-w-lg w-[95vw] md:w-auto">
              <DialogHeader>
                <DialogTitle>{editingMarkup ? 'Editar Regra' : 'Nova Regra de Markup'}</DialogTitle>
                <DialogDescription>Defina escopo e valores de markup</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome *</Label><Input value={markupForm.name} onChange={e => setMarkupForm(p => ({ ...p, name: e.target.value }))} placeholder="Markup Padrão" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Escopo</Label>
                    <Select value={markupForm.scope} onValueChange={v => setMarkupForm(p => ({ ...p, scope: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="category">Por Categoria</SelectItem>
                        <SelectItem value="activity_type">Por Tipo de Atividade</SelectItem>
                        <SelectItem value="supplier_type">Por Tipo Fornecedor</SelectItem>
                        <SelectItem value="client_type">Por Tipo Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {markupForm.scope !== 'global' && (
                    <div><Label>Valor do Escopo</Label><Input value={markupForm.scopeValue} onChange={e => setMarkupForm(p => ({ ...p, scopeValue: e.target.value }))} placeholder="Ex: BT, factory, material" /></div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><Label>Multiplicador</Label><Input type="number" step="0.01" value={markupForm.markupMultiplier} onChange={e => setMarkupForm(p => ({ ...p, markupMultiplier: Number(e.target.value) }))} /></div>
                  <div><Label>Percentual (%)</Label><Input type="number" step="0.1" value={markupForm.markupPercentage} onChange={e => setMarkupForm(p => ({ ...p, markupPercentage: Number(e.target.value) }))} /></div>
                  <div><Label>Margem Mín. (R$)</Label><Input type="number" step="0.01" value={markupForm.minimumMargin} onChange={e => setMarkupForm(p => ({ ...p, minimumMargin: Number(e.target.value) }))} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Prioridade</Label><Input type="number" value={markupForm.priority} onChange={e => setMarkupForm(p => ({ ...p, priority: Number(e.target.value) }))} /></div>
                  <div className="flex items-end gap-2 pb-1">
                    <Switch checked={markupForm.isActive} onCheckedChange={v => setMarkupForm(p => ({ ...p, isActive: v }))} />
                    <Label className="text-sm">Ativa</Label>
                  </div>
                </div>
                <div><Label>Descrição</Label><Input value={markupForm.description} onChange={e => setMarkupForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição opcional..." /></div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMarkupDialog(false)}>Cancelar</Button>
                  <Button onClick={handleSaveMarkup} className="bg-amber-500 hover:bg-amber-600 text-slate-900">{editingMarkup ? 'Salvar' : 'Criar'}</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
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

        {/* ═══ IA TAB ═══ */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> Configuração de IA</CardTitle>
              <CardDescription>Configure a chave de API e preferências do assistente inteligente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Chave de API (OpenAI)</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={aiApiKey}
                      onChange={e => setAiApiKey(e.target.value)}
                      placeholder="sk-..."
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">Obtenha em platform.openai.com → API Keys</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Modelo</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger className="w-full sm:w-64 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (rápido, econômico)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (mais inteligente)</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (mais barato)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Assistente IA</p>
                  <p className="text-sm text-slate-500">Habilitar o chat assistente no sistema</p>
                </div>
                <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
              </div>

              <Button onClick={handleSaveAiConfig} disabled={savingAi} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
                {savingAi ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar Configurações de IA</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex gap-3 items-start"><span className="text-lg">💬</span><div><p className="font-medium text-slate-800">Chat Assistente</p><p>Clique no botão ⚡ no canto inferior direito para conversar com a IA sobre materiais, estruturas, custos e normas.</p></div></div>
              <div className="flex gap-3 items-start"><span className="text-lg">📋</span><div><p className="font-medium text-slate-800">Análise de Materiais</p><p>Cole uma lista de materiais do fornecedor no chat e a IA identifica e faz matching com o catálogo.</p></div></div>
              <div className="flex gap-3 items-start"><span className="text-lg">🧠</span><div><p className="font-medium text-slate-800">Contexto Inteligente</p><p>A IA conhece seu catálogo, fornecedores, estruturas e regras de markup para respostas personalizadas.</p></div></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
