import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Zap, ArrowLeft, Save, Send, ChevronDown, ChevronUp,
  User, Building2, FileText, Plug, Shield, Clock,
  HardHat, Upload, DollarSign, MessageSquare, Search,
  Plus, X, CheckCircle2, AlertCircle, Loader2, Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

// ═══════════════════════════════════════════════════════════════
// TIPOS E CONSTANTES
// ═══════════════════════════════════════════════════════════════
const TIPO_IMOVEL = ['Residencial', 'Comercial', 'Industrial', 'Misto', 'Condomínio', 'Prédio Público', 'Rural', 'Outro'];
const FINALIDADE = [
  'Laudo de conformidade (NR-10 / NBR 5410)',
  'Laudo para seguro',
  'Laudo para habite-se / AVCB',
  'Laudo para aumento de carga',
  'Laudo para financiamento',
  'Reforma / modernização',
  'Manutenção preventiva',
  'Investigação de problema',
  'Outro',
];
const TENSAO = ['127/220V (Monofásico)', '220/380V (Trifásico)', '13.8kV', '34.5kV', '69kV', '138kV', 'Outro'];
const MODALIDADE_TARIFARIA = ['Convencional (B)', 'Horossazonal Verde (A)', 'Horossazonal Azul (A)', 'Outro'];
const PROBLEMAS_12M = [
  'Quedas de energia frequentes', 'Disjuntores desarmando', 'Aquecimento em cabos/conexões',
  'Curto-circuito', 'Choque em equipamentos', 'Variação de tensão',
  'Queima de equipamentos', 'Incêndio elétrico', 'Multa por fator de potência',
  'Problemas com aterramento', 'Nenhum problema',
];
const DOCUMENTOS_CHECKLIST = [
  'Conta de energia recente', 'Diagrama unifilar', 'Projeto elétrico original',
  'ART anterior', 'Laudo anterior', 'Planta baixa', 'Memorial descritivo',
  'Relatório de manutenção', 'Fotos do QD principal',
];

type FormData = Record<string, any>;

interface Props {
  laudoId?: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// SEÇÃO COLAPSÁVEL
// ═══════════════════════════════════════════════════════════════
function Section({ title, icon: Icon, number, children, defaultOpen = false, complete = false }: {
  title: string; icon: any; number: number; children: React.ReactNode; defaultOpen?: boolean; complete?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {complete ? <CheckCircle2 className="w-4 h-4" /> : number}
        </div>
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-sm font-semibold text-slate-700 flex-1">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t space-y-4">{children}</div>}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// CAMPO CONDICIONAL INFRAESTRUTURA
// ═══════════════════════════════════════════════════════════════
function InfraItem({ label, field, form, F, extra }: {
  label: string; field: string; form: FormData; F: (k: string, v: any) => void;
  extra?: { label: string; field: string; placeholder?: string }[];
}) {
  const checked = !!form[field];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Switch checked={checked} onCheckedChange={v => F(field, v)} />
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      {checked && extra?.map(e => (
        <div key={e.field} className="ml-11">
          <Label className="text-xs text-slate-500">{e.label}</Label>
          <Input className="mt-1 h-9 text-sm" placeholder={e.placeholder} value={form[e.field] || ''} onChange={ev => F(e.field, ev.target.value)} />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function LaudoForm({ laudoId, onSaved, onCancel }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({});
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [docsPendentes, setDocsPendentes] = useState<string[]>([]);
  const [currentLaudoId, setCurrentLaudoId] = useState<string | null>(laudoId || null);
  const autoSaveTimer = useRef<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const F = useCallback((field: string, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  }, []);

  // ─── Carregar clientes para busca ───
  useEffect(() => {
    api.getClients({ pageSize: 2000 }).then(setClients).catch(() => {});
  }, []);

  // ─── Carregar laudo existente ───
  useEffect(() => {
    if (!laudoId) return;
    api.getLaudo(laudoId).then(laudo => {
      const dados = laudo.dados ? (typeof laudo.dados === 'string' ? JSON.parse(laudo.dados) : laudo.dados) : {};
      setForm(dados);
      if (laudo.client) {
        setSelectedClient(laudo.client);
        setClientSearch(laudo.client.name || '');
      }
      const docList = laudo.documentos ? (typeof laudo.documentos === 'string' ? JSON.parse(laudo.documentos) : laudo.documentos) : [];
      setDocs(docList);
      if (dados._docsPendentes) setDocsPendentes(dados._docsPendentes);
    }).catch(() => toast.error('Erro ao carregar atendimento'));
  }, [laudoId]);

  // ─── Fechar dropdown ao clicar fora ───
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowClientDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── Auto-save (debounce 3s) ───
  useEffect(() => {
    if (!currentLaudoId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      doSave(true);
    }, 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form, currentLaudoId]);

  // ─── Filtro de clientes ───
  const filteredClients = clients.filter(c => {
    if (!clientSearch.trim()) return false;
    const q = clientSearch.toLowerCase();
    return (c.name?.toLowerCase().includes(q) || c.document?.includes(q) || c.tradeName?.toLowerCase().includes(q));
  }).slice(0, 8);

  // ─── Selecionar cliente ───
  function selectClient(c: any) {
    setSelectedClient(c);
    setClientSearch(c.name);
    setShowClientDropdown(false);
    F('clientId', c.id);
    F('clientName', c.name);
    F('clientPhone', c.phone || c.whatsapp || '');
    F('clientEmail', c.email || '');
  }

  // ─── Criar cliente rápido ───
  async function createQuickClient() {
    if (!clientSearch.trim()) return;
    try {
      const newClient = await api.createClient({ name: clientSearch.trim(), type: 'company', segment: 'commercial' });
      toast.success(`Cliente "${newClient.name}" criado!`);
      setClients(prev => [newClient, ...prev]);
      selectClient(newClient);
    } catch { toast.error('Erro ao criar cliente'); }
  }

  // ─── Salvar ───
  async function doSave(silent = false) {
    if (saving) return;
    setSaving(true);
    try {
      const payload: any = {
        dados: { ...form, _docsPendentes: docsPendentes },
        status: 'aberto',
      };
      if (selectedClient) payload.clientId = selectedClient.id;

      if (currentLaudoId) {
        await api.updateLaudo(currentLaudoId, payload);
        if (!silent) toast.success('Atendimento salvo!');
      } else {
        if (!selectedClient) { toast.error('Selecione um cliente'); setSaving(false); return; }
        const created = await api.createLaudo(payload);
        setCurrentLaudoId(created.id);
        if (!silent) toast.success('Atendimento criado!');
      }
    } catch (err) {
      if (!silent) toast.error('Erro ao salvar');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // ─── Enviar para orçamento ───
  async function doSubmit() {
    if (!selectedClient) { toast.error('Selecione um cliente antes de enviar'); return; }
    if (!form.endereco) { toast.error('Preencha o endereço do imóvel'); return; }
    setSubmitting(true);
    try {
      // Salvar primeiro
      await doSave(true);
      // Depois mudar status
      if (currentLaudoId) {
        await api.updateLaudoStatus(currentLaudoId, 'enviado_orcamento');
        toast.success('Atendimento enviado para orçamento!');
        onSaved?.();
      }
    } catch { toast.error('Erro ao enviar para orçamento'); }
    finally { setSubmitting(false); }
  }

  // ─── Upload de documento ───
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentLaudoId) {
      // Criar laudo primeiro
      if (!selectedClient) { toast.error('Selecione um cliente primeiro'); return; }
      await doSave(false);
    }
    if (!currentLaudoId) { toast.error('Salve o atendimento antes de enviar documentos'); return; }
    setUploading(true);
    try {
      const result = await api.uploadLaudoDocument(currentLaudoId, file);
      setDocs(prev => [...prev, { fileName: file.name, originalName: file.name, url: result.url, filePath: result.filePath, size: file.size, mimeType: file.type, uploadedAt: new Date().toISOString() }]);
      toast.success(`"${file.name}" enviado!`);
    } catch { toast.error('Erro no upload'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  // ─── Toggle doc pendente ───
  function toggleDocPendente(doc: string) {
    setDocsPendentes(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
  }

  // ─── Remover doc ───
  async function removeDoc(filePath: string) {
    if (!currentLaudoId) return;
    try {
      await api.removeLaudoDocument(currentLaudoId, filePath);
      setDocs(prev => prev.filter(d => d.filePath !== filePath));
      toast.success('Documento removido');
    } catch { toast.error('Erro ao remover'); }
  }

  // ─── Completude das seções ───
  const sectionComplete = {
    s1: !!selectedClient,
    s2: !!(form.tipo_imovel && form.endereco),
    s3: !!form.finalidade,
    s4: !!form.tensao,
    s5: Object.keys(form).some(k => k.startsWith('infra_') && form[k]),
    s6: !!(form.ultimo_laudo || form.problemas_12m?.length),
    s7: !!form.horario_acesso,
    s8: docs.length > 0 || docsPendentes.length > 0,
    s9: !!(form.decisor || form.orcamento_disponivel),
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onCancel?.()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800">
            {laudoId ? 'Editar Atendimento' : 'Novo Atendimento'}
          </h1>
          <p className="text-xs text-slate-400">Preencha as seções abaixo • Salvamento automático</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => doSave(false)} disabled={saving} className="text-xs">
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* ═══ SEÇÃO 1: Cliente e Contato ═══ */}
      <Section title="Cliente e Contato" icon={User} number={1} defaultOpen={true} complete={sectionComplete.s1}>
        <div className="pt-3 space-y-3">
          <div ref={searchRef} className="relative">
            <Label className="text-xs">Cliente *</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9 h-10"
                placeholder="Buscar por nome, CNPJ ou razão social..."
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                onFocus={() => clientSearch && setShowClientDropdown(true)}
              />
            </div>
            {showClientDropdown && clientSearch.trim() && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border shadow-lg max-h-64 overflow-y-auto">
                {filteredClients.map(c => (
                  <button key={c.id} type="button" onClick={() => selectClient(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-50 transition-colors border-b last:border-0">
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.document || 'Sem CNPJ'} {c.city ? `• ${c.city}` : ''}</p>
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-slate-500 mb-2">Nenhum cliente encontrado</p>
                    <Button size="sm" variant="outline" onClick={createQuickClient} className="text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Criar "{clientSearch.trim()}"
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          {selectedClient && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800 truncate">{selectedClient.name}</p>
                <p className="text-xs text-emerald-600">{selectedClient.document || ''} {selectedClient.phone ? `• ${selectedClient.phone}` : ''}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedClient(null); setClientSearch(''); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Telefone de contato</Label>
              <Input className="mt-1 h-9 text-sm" placeholder="(00) 00000-0000" value={form.clientPhone || ''} onChange={e => F('clientPhone', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">E-mail de contato</Label>
              <Input className="mt-1 h-9 text-sm" placeholder="email@empresa.com" value={form.clientEmail || ''} onChange={e => F('clientEmail', e.target.value)} />
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ SEÇÃO 2: Imóvel ═══ */}
      <Section title="Imóvel" icon={Building2} number={2} complete={sectionComplete.s2}>
        <div className="pt-3 space-y-3">
          <div>
            <Label className="text-xs">Tipo de imóvel</Label>
            <Select value={form.tipo_imovel || ''} onValueChange={v => F('tipo_imovel', v)}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{TIPO_IMOVEL.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Endereço completo *</Label>
            <Input className="mt-1 h-9 text-sm" placeholder="Rua, nº, bairro, cidade — UF" value={form.endereco || ''} onChange={e => F('endereco', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Área aprox. (m²)</Label>
              <Input className="mt-1 h-9 text-sm" type="number" placeholder="500" value={form.area || ''} onChange={e => F('area', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Ano de construção</Label>
              <Input className="mt-1 h-9 text-sm" type="number" placeholder="2010" value={form.ano_construcao || ''} onChange={e => F('ano_construcao', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Pavimentos</Label>
              <Input className="mt-1 h-9 text-sm" type="number" placeholder="2" value={form.pavimentos || ''} onChange={e => F('pavimentos', e.target.value)} />
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ SEÇÃO 3: Motivo do Laudo ═══ */}
      <Section title="Motivo do Laudo" icon={FileText} number={3} complete={sectionComplete.s3}>
        <div className="pt-3 space-y-3">
          <div>
            <Label className="text-xs">Finalidade</Label>
            <Select value={form.finalidade || ''} onValueChange={v => F('finalidade', v)}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{FINALIDADE.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Gatilho declarado (o que motivou o cliente)</Label>
            <Textarea className="mt-1 text-sm" rows={2} placeholder="Ex: 'O seguradora exigiu laudo para renovação'" value={form.gatilho || ''} onChange={e => F('gatilho', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Prazo desejado</Label>
              <Input className="mt-1 h-9 text-sm" placeholder="Ex: 15 dias" value={form.prazo_desejado || ''} onChange={e => F('prazo_desejado', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Prazo fatal (se houver)</Label>
              <Input className="mt-1 h-9 text-sm" type="date" value={form.prazo_fatal || ''} onChange={e => F('prazo_fatal', e.target.value)} />
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ SEÇÃO 4: Suprimento Elétrico ═══ */}
      <Section title="Suprimento Elétrico" icon={Plug} number={4} complete={sectionComplete.s4}>
        <div className="pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tensão de fornecimento</Label>
              <Select value={form.tensao || ''} onValueChange={v => F('tensao', v)}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{TENSAO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Demanda contratada (kW)</Label>
              <Input className="mt-1 h-9 text-sm" type="number" placeholder="75" value={form.demanda_contratada || ''} onChange={e => F('demanda_contratada', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Modalidade tarifária</Label>
              <Select value={form.modalidade_tarifaria || ''} onValueChange={v => F('modalidade_tarifaria', v)}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{MODALIDADE_TARIFARIA.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Concessionária</Label>
              <Input className="mt-1 h-9 text-sm" placeholder="Ex: CEMIG, CPFL, Enel" value={form.concessionaria || ''} onChange={e => F('concessionaria', e.target.value)} />
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ SEÇÃO 5: Infraestrutura Existente ═══ */}
      <Section title="Infraestrutura Existente" icon={Shield} number={5} complete={sectionComplete.s5}>
        <div className="pt-3 space-y-3">
          <InfraItem label="Subestação" field="infra_subestacao" form={form} F={F}
            extra={[{ label: 'Tipo / Potência', field: 'infra_subestacao_tipo', placeholder: 'Ex: Abrigada, 300 kVA' }]} />
          <InfraItem label="Gerador" field="infra_gerador" form={form} F={F}
            extra={[{ label: 'Potência / Combustível', field: 'infra_gerador_pot', placeholder: 'Ex: 150 kVA diesel' }]} />
          <InfraItem label="SPDA (Para-raios)" field="infra_spda" form={form} F={F}
            extra={[{ label: 'Última manutenção', field: 'infra_spda_manut', placeholder: 'Ex: 2024' }]} />
          <InfraItem label="Aterramento" field="infra_aterramento" form={form} F={F}
            extra={[{ label: 'Tipo', field: 'infra_aterramento_tipo', placeholder: 'Ex: TN-S, TT' }]} />
          <InfraItem label="Sistema Solar Fotovoltaico" field="infra_solar" form={form} F={F}
            extra={[{ label: 'Potência instalada', field: 'infra_solar_pot', placeholder: 'Ex: 50 kWp' }]} />
          <InfraItem label="Carregador de Veículo Elétrico" field="infra_ev" form={form} F={F}
            extra={[{ label: 'Quantidade / Potência', field: 'infra_ev_qtd', placeholder: 'Ex: 2x 22kW' }]} />
          <InfraItem label="Banco de Capacitores" field="infra_capacitor" form={form} F={F}
            extra={[{ label: 'Potência reativa', field: 'infra_capacitor_kvar', placeholder: 'Ex: 150 kVAr' }]} />
          <InfraItem label="No-break / UPS" field="infra_nobreak" form={form} F={F}
            extra={[{ label: 'Potência / Autonomia', field: 'infra_nobreak_pot', placeholder: 'Ex: 30 kVA, 15min' }]} />
          <InfraItem label="Diagrama Unifilar atualizado" field="infra_diagrama" form={form} F={F} />
          <InfraItem label="PIE (Prontuário de Instalações Elétricas)" field="infra_pie" form={form} F={F}
            extra={[{ label: 'Ano da última revisão', field: 'infra_pie_ano', placeholder: 'Ex: 2023' }]} />
        </div>
      </Section>

      {/* ═══ SEÇÃO 6: Histórico ═══ */}
      <Section title="Histórico" icon={Clock} number={6} complete={sectionComplete.s6}>
        <div className="pt-3 space-y-3">
          <div>
            <Label className="text-xs">Último laudo realizado</Label>
            <Input className="mt-1 h-9 text-sm" placeholder="Ex: 2021, empresa XYZ" value={form.ultimo_laudo || ''} onChange={e => F('ultimo_laudo', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs mb-2 block">Problemas nos últimos 12 meses</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROBLEMAS_12M.map(p => {
                const checked = (form.problemas_12m || []).includes(p);
                return (
                  <label key={p} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={checked} onChange={() => {
                      const list = form.problemas_12m || [];
                      F('problemas_12m', checked ? list.filter((x: string) => x !== p) : [...list, p]);
                    }} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                    {p}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="text-xs">Detalhes adicionais do histórico</Label>
            <Textarea className="mt-1 text-sm" rows={2} placeholder="Outros eventos relevantes..." value={form.historico_detalhe || ''} onChange={e => F('historico_detalhe', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* ═══ SEÇÃO 7: Acesso e Logística ═══ */}
      <Section title="Acesso e Logística" icon={HardHat} number={7} complete={sectionComplete.s7}>
        <div className="pt-3 space-y-3">
          <div>
            <Label className="text-xs">Horário permitido para acesso</Label>
            <Input className="mt-1 h-9 text-sm" placeholder="Ex: Seg a Sex, 8h às 18h" value={form.horario_acesso || ''} onChange={e => F('horario_acesso', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <Switch checked={!!form.necessita_parada} onCheckedChange={v => F('necessita_parada', v)} />
              <span className="text-sm text-slate-700">Necessidade de parada / desligamento</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={!!form.eletricista_local} onCheckedChange={v => F('eletricista_local', v)} />
              <span className="text-sm text-slate-700">Eletricista local disponível</span>
            </div>
          </div>
          {form.necessita_parada && (
            <div>
              <Label className="text-xs">Detalhes sobre a parada</Label>
              <Input className="mt-1 h-9 text-sm" placeholder="Duração, área afetada..." value={form.parada_detalhe || ''} onChange={e => F('parada_detalhe', e.target.value)} />
            </div>
          )}
          <div>
            <Label className="text-xs">EPIs necessários / restrições de acesso</Label>
            <Input className="mt-1 h-9 text-sm" placeholder="Ex: Capacete, bota, NR-35 para altura" value={form.epi || ''} onChange={e => F('epi', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Observações de logística</Label>
            <Textarea className="mt-1 text-sm" rows={2} placeholder="Estacionamento, contato do porteiro..." value={form.logistica_obs || ''} onChange={e => F('logistica_obs', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* ═══ SEÇÃO 8: Documentos ═══ */}
      <Section title="Documentos" icon={Paperclip} number={8} complete={sectionComplete.s8}>
        <div className="pt-3 space-y-3">
          <p className="text-xs text-slate-500">Marque os documentos que o cliente vai enviar depois ou anexe agora.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOCUMENTOS_CHECKLIST.map(doc => {
              const isPendente = docsPendentes.includes(doc);
              const isUploaded = docs.some(d => d.originalName?.includes(doc) || d.fileName?.includes(doc));
              return (
                <label key={doc} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm border transition-colors ${
                  isUploaded ? 'bg-emerald-50 border-emerald-200' : isPendente ? 'bg-amber-50 border-amber-200' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input type="checkbox" checked={isPendente || isUploaded} onChange={() => toggleDocPendente(doc)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" disabled={isUploaded} />
                  <span className="flex-1">{doc}</span>
                  {isUploaded && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {isPendente && !isUploaded && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                </label>
              );
            })}
          </div>

          {/* Upload */}
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-amber-300 transition-colors">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.dwg" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-sm">
              {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
              {uploading ? 'Enviando...' : 'Anexar Documento'}
            </Button>
            <p className="text-xs text-slate-400 mt-1.5">PDF, JPG, PNG, DOC, DWG — até 50MB</p>
          </div>

          {/* Docs enviados */}
          {docs.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Documentos anexados</Label>
              {docs.map((d, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={d.url} target="_blank" rel="noopener" className="flex-1 truncate text-blue-600 hover:underline">{d.originalName || d.fileName}</a>
                  <span className="text-xs text-slate-400 shrink-0">{d.size ? `${(d.size / 1024 / 1024).toFixed(1)}MB` : ''}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeDoc(d.filePath)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ═══ SEÇÃO 9: Qualificação Comercial ═══ */}
      <Section title="Qualificação Comercial" icon={DollarSign} number={9} complete={sectionComplete.s9}>
        <div className="pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Quem decide / aprova?</Label>
              <Input className="mt-1 h-9 text-sm" placeholder="Nome e cargo" value={form.decisor || ''} onChange={e => F('decisor', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Precisa de aprovação?</Label>
              <Select value={form.aprovacao || ''} onValueChange={v => F('aprovacao', v)}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não, decide na hora</SelectItem>
                  <SelectItem value="diretoria">Sim, precisa de diretoria</SelectItem>
                  <SelectItem value="licitacao">Licitação / processo formal</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Orçamento disponível?</Label>
              <Select value={form.orcamento_disponivel || ''} onValueChange={v => F('orcamento_disponivel', v)}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim, já tem verba</SelectItem>
                  <SelectItem value="parcial">Parcialmente</SelectItem>
                  <SelectItem value="nao">Não definido</SelectItem>
                  <SelectItem value="precisa_proposta">Precisa da proposta para aprovar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Há concorrência?</Label>
              <Select value={form.concorrencia || ''} onValueChange={v => F('concorrencia', v)}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="sim_1">Sim, 1 concorrente</SelectItem>
                  <SelectItem value="sim_varios">Sim, vários</SelectItem>
                  <SelectItem value="indicacao">Indicação direta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Forma de pagamento preferida</Label>
            <Input className="mt-1 h-9 text-sm" placeholder="Ex: Boleto, parcelado 3x, entrada + medição" value={form.pagamento || ''} onChange={e => F('pagamento', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* ═══ SEÇÃO 10: Observações ═══ */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <Label className="text-sm font-semibold text-slate-700">Observações Livres</Label>
        </div>
        <Textarea
          rows={4}
          placeholder="Qualquer informação adicional sobre o atendimento..."
          value={form.observacoes_livres || ''}
          onChange={e => F('observacoes_livres', e.target.value)}
          className="text-sm"
        />
      </Card>

      {/* ═══ Botões Finais ═══ */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => onCancel?.()}
          className="sm:flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={() => doSave(false)}
          variant="outline"
          disabled={saving}
          className="sm:flex-1"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
          Salvar Rascunho
        </Button>
        <Button
          onClick={doSubmit}
          disabled={submitting || !selectedClient}
          className="sm:flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold h-11 shadow-md shadow-amber-200/50"
        >
          {submitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
          Enviar para Orçamento
        </Button>
      </div>
    </div>
  );
}
