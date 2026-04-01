import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { api } from '@/api';
import {
  ChevronLeft, ChevronRight, Check, Save,
  FileText, Wrench, Clock, DollarSign,
  Droplets, Eye, Thermometer, BarChart3, Wifi, Zap, FileBarChart, Shield,
} from 'lucide-react';
import { emptyPlano, fmt } from './OeM_handlers';

interface PlanoWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  initialData?: any;
  onSaved: () => void;
}

const STEPS = [
  { id: 1, title: 'Identificação', icon: FileText, color: 'text-blue-600' },
  { id: 2, title: 'Serviços', icon: Wrench, color: 'text-green-600' },
  { id: 3, title: 'SLA & Termos', icon: Clock, color: 'text-purple-600' },
  { id: 4, title: 'Precificação', icon: DollarSign, color: 'text-amber-600' },
];

const SERVICOS = [
  { key: 'incluiLimpeza', label: 'Limpeza dos Módulos', desc: 'Lavagem com água deionizada e escova macia para remoção de sujidades', icon: Droplets, color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { key: 'incluiInspecaoVisual', label: 'Inspeção Visual Completa', desc: 'Verificação de módulos, estrutura metálica, cabos e conectores', icon: Eye, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { key: 'incluiTermografia', label: 'Termografia Infravermelha', desc: 'Detecção de hotspots e pontos de aquecimento anormal', icon: Thermometer, color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { key: 'incluiTesteString', label: 'Teste de String (I-V)', desc: 'Curva I-V dos módulos para análise de degradação', icon: BarChart3, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'incluiMonitoramentoRemoto', label: 'Monitoramento Remoto', desc: 'Acompanhamento da geração em tempo real 24/7', icon: Wifi, color: 'bg-green-50 border-green-200 text-green-700' },
  { key: 'incluiCorretivaPrioritaria', label: 'Corretiva Prioritária', desc: 'Atendimento emergencial com prioridade no SLA', icon: Zap, color: 'bg-red-50 border-red-200 text-red-700' },
  { key: 'incluiRelatorio', label: 'Relatório de Performance', desc: 'Análise detalhada de geração e indicadores periódicos', icon: FileBarChart, color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { key: 'incluiSeguro', label: 'Seguro Contra Danos', desc: 'Cobertura para sinistros, eventos climáticos e acidentes', icon: Shield, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
];

const CATEGORIAS = [
  { value: 'basico', label: '🥉 Básico', desc: 'Essencial para usinas residenciais', color: 'bg-slate-100 text-slate-700' },
  { value: 'standard', label: '🥈 Standard', desc: 'Ideal para comercial e industrial', color: 'bg-blue-100 text-blue-700' },
  { value: 'premium', label: '🥇 Premium', desc: 'Máxima proteção e monitoramento', color: 'bg-amber-100 text-amber-700' },
  { value: 'enterprise', label: '💎 Enterprise', desc: 'Personalizado para grandes usinas', color: 'bg-purple-100 text-purple-700' },
];

export default function PlanoWizardDialog({ open, onOpenChange, editingId, initialData, onSaved }: PlanoWizardDialogProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>({ ...emptyPlano });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      if (initialData) {
        setForm({ ...initialData });
      } else {
        setForm({ ...emptyPlano });
      }
    }
  }, [open, initialData]);

  const updateField = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const canProceed = () => {
    if (step === 1) return form.nome?.trim();
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      if (step === 1) toast.warning('Informe o nome do plano');
      return;
    }
    setStep(Math.min(step + 1, 4));
  };

  const handlePrev = () => setStep(Math.max(step - 1, 1));

  const handleSave = async () => {
    if (!form.nome?.trim()) { toast.error('Nome do plano é obrigatório'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.updateOemPlano(editingId, form);
        toast.success('Plano atualizado com sucesso!');
      } else {
        await api.createOemPlano(form);
        toast.success('Plano criado com sucesso!');
      }
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const selectedServicesCount = SERVICOS.filter(s => form[s.key]).length;

  // ── Cálculo preview (para uma usina exemplo de 10 kWp) ──
  const previewKwp = 10;
  const precoBase = Number(form.precoBaseMensal) || 0;
  const kwpLimite = Number(form.kwpLimiteBase) || 10;
  const precoExcedente = Number(form.precoKwpExcedente) || 0;
  const custoMobilizacao = Number(form.custoMobilizacao) || 0;
  const kwpExcedente = Math.max(0, previewKwp - kwpLimite);
  const valorExcedente = kwpExcedente * precoExcedente;
  const valorMensalBase = precoBase + valorExcedente;
  const freqMap: Record<string, number> = { mensal: 12, trimestral: 4, semestral: 2, anual: 1 };
  const freqAnual = freqMap[form.frequenciaPreventiva] || 2;
  const mobilizacaoAnual = custoMobilizacao * freqAnual;
  const valorMensal = Math.round(((valorMensalBase * 12 + mobilizacaoAnual) / 12) * 100) / 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        {/* ═══ HEADER COM PROGRESSO ═══ */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-50 to-white">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {editingId ? '✏️ Editar Plano de Manutenção' : '🆕 Novo Plano de Manutenção'}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-0.5">Configure todos os parâmetros do plano de O&M recorrente</p>

          {/* Stepper */}
          <div className="flex items-center gap-1 mt-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => { if (isDone || isActive) setStep(s.id); }}
                    className={`flex items-center gap-2 w-full py-2 px-3 rounded-lg transition-all text-left ${
                      isActive
                        ? 'bg-white shadow-md border border-slate-200 ring-2 ring-amber-400/40'
                        : isDone
                          ? 'bg-green-50 border border-green-200 cursor-pointer hover:bg-green-100'
                          : 'bg-slate-50 border border-slate-100 opacity-60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-amber-500 text-white' : isDone ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-slate-900' : isDone ? 'text-green-700' : 'text-slate-400'}`}>
                        {s.title}
                      </p>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`w-4 h-0.5 shrink-0 mx-0.5 ${isDone ? 'bg-green-300' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* ═══ CONTEÚDO DA ETAPA ═══ */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── ETAPA 1: IDENTIFICAÇÃO ── */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Nome do Plano *</Label>
                <Input
                  value={form.nome}
                  onChange={e => updateField('nome', e.target.value)}
                  placeholder="Ex: Premium Solar, Básico Residencial, Enterprise Industrial..."
                  className="h-11 text-base"
                />
                <p className="text-xs text-slate-400">Nome comercial que aparecerá para o cliente na proposta</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Categoria do Plano</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => updateField('tipoPlano', cat.value)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        form.tipoPlano === cat.value
                          ? 'border-amber-400 bg-amber-50/50 shadow-sm ring-1 ring-amber-200'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl shrink-0">{cat.label.split(' ')[0]}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900">{cat.label.split(' ').slice(1).join(' ')}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Descrição Comercial</Label>
                <Textarea
                  value={form.descricao}
                  onChange={e => updateField('descricao', e.target.value)}
                  rows={3}
                  placeholder="Descreva os diferenciais e o público-alvo deste plano. Esta descrição aparecerá na proposta para o cliente..."
                  className="resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Benefícios Destacados</Label>
                <Textarea
                  value={form.beneficios}
                  onChange={e => updateField('beneficios', e.target.value)}
                  rows={3}
                  placeholder="• Aumento da vida útil do sistema em até 30%&#10;• Garantia de performance de geração&#10;• Atendimento prioritário em emergências&#10;• Relatórios técnicos detalhados..."
                  className="resize-none"
                />
                <p className="text-xs text-slate-400">Estes benefícios aparecerão na proposta PDF para o cliente</p>
              </div>
            </div>
          )}

          {/* ── ETAPA 2: SERVIÇOS ── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-green-600" />
                    Selecione os serviços incluídos
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">Marque os serviços que fazem parte deste plano</p>
                </div>
                <Badge variant="outline" className={`${selectedServicesCount > 0 ? 'bg-green-50 text-green-700 border-green-300' : 'bg-slate-50 text-slate-500'} text-sm px-3 py-1`}>
                  {selectedServicesCount} de {SERVICOS.length} selecionados
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {SERVICOS.map(({ key, label, desc, icon: Icon, color }) => {
                  const isActive = form[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateField(key, !isActive)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isActive
                          ? `border-green-400 bg-green-50/60 shadow-sm`
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-green-500 text-white shadow-lg shadow-green-200' : `${color.split(' ')[0]} ${color.split(' ')[2]}`
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isActive ? 'text-green-800' : 'text-slate-700'}`}>{label}</p>
                        <p className={`text-xs mt-0.5 ${isActive ? 'text-green-600' : 'text-slate-400'}`}>{desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isActive ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                      }`}>
                        {isActive && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ETAPA 3: SLA & TERMOS ── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* SLA */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Acordo de Nível de Serviço (SLA)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-blue-700">Resposta Normal</Label>
                    <div className="relative">
                      <Input value={form.tempoRespostaSlaHoras} onChange={e => updateField('tempoRespostaSlaHoras', e.target.value)} type="number" className="pr-14" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">horas</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-blue-700">Resposta Urgente</Label>
                    <div className="relative">
                      <Input value={form.tempoRespostaUrgenteHoras} onChange={e => updateField('tempoRespostaUrgenteHoras', e.target.value)} type="number" className="pr-14" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">horas</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-blue-700">Horário de Atendimento</Label>
                    <Select value={form.atendimentoHorario} onValueChange={v => updateField('atendimentoHorario', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comercial">☀️ Comercial (8h–18h)</SelectItem>
                        <SelectItem value="estendido">🌅 Estendido (7h–22h)</SelectItem>
                        <SelectItem value="24x7">🔄 24×7 (24 horas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Frequências */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-xl p-4 space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">🔧 Frequência Preventiva</Label>
                  <Select value={form.frequenciaPreventiva} onValueChange={v => updateField('frequenciaPreventiva', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal (12×/ano)</SelectItem>
                      <SelectItem value="trimestral">Trimestral (4×/ano)</SelectItem>
                      <SelectItem value="semestral">Semestral (2×/ano)</SelectItem>
                      <SelectItem value="anual">Anual (1×/ano)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-white border rounded-xl p-4 space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">📄 Frequência Relatório</Label>
                  <Select value={form.frequenciaRelatorio} onValueChange={v => updateField('frequenciaRelatorio', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cobertura & Limites */}
              <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-purple-800 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Cobertura e Limites
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-purple-700">Cobertura Máx. Anual</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                      <Input value={form.coberturaMaxAnual} onChange={e => updateField('coberturaMaxAnual', e.target.value)} type="number" step="0.01" placeholder="∞ Sem limite" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-purple-700">Limite Corretivas/Ano</Label>
                    <Input value={form.limiteCorretivas} onChange={e => updateField('limiteCorretivas', e.target.value)} type="number" placeholder="∞ Ilimitado" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-purple-700">Abrangência (km)</Label>
                    <div className="relative">
                      <Input value={form.abrangenciaKm} onChange={e => updateField('abrangenciaKm', e.target.value)} type="number" placeholder="Raio" className="pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">km</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-purple-700">Exclusões (o que NÃO está coberto)</Label>
                  <Textarea value={form.exclusoes} onChange={e => updateField('exclusoes', e.target.value)} rows={2} placeholder="Ex: Danos por vandalismo, fenômenos naturais, desgaste normal..." className="resize-none" />
                </div>
              </div>

              {/* Penalidades & Contrato */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-xl p-4 space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">⚖️ Penalidades SLA</Label>
                  <Textarea value={form.penalidades} onChange={e => updateField('penalidades', e.target.value)} rows={2} placeholder="Ex: Desconto de 5% para cada dia de atraso..." className="resize-none text-sm" />
                </div>
                <div className="bg-white border rounded-xl p-4 space-y-3">
                  <Label className="text-sm font-semibold text-slate-700">📜 Contrato</Label>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Duração Mínima</Label>
                    <div className="relative">
                      <Input value={form.termosDuracaoMeses} onChange={e => updateField('termosDuracaoMeses', e.target.value)} type="number" className="pr-16" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">meses</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={form.ativo} onCheckedChange={v => updateField('ativo', v)} />
                    <Label className="text-sm">Plano Ativo</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ETAPA 4: PRECIFICAÇÃO ── */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-5 gap-5">
                {/* ── CAMPOS DE PREÇOS (3 colunas) ── */}
                <div className="col-span-3 space-y-5">
                  {/* Bloco: Preço Base */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-amber-800 flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4" />
                      Preço Base Mensal
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-amber-700">Valor Mensal *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">R$</span>
                          <Input
                            value={form.precoBaseMensal}
                            onChange={e => updateField('precoBaseMensal', e.target.value)}
                            type="number" step="0.01"
                            className="pl-10 h-11 text-lg font-bold"
                            placeholder="0,00"
                          />
                        </div>
                        <p className="text-xs text-amber-600">Preço para usinas até o limite kWp abaixo</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-amber-700">Limite kWp Incluso</Label>
                        <div className="relative">
                          <Input value={form.kwpLimiteBase} onChange={e => updateField('kwpLimiteBase', e.target.value)} type="number" step="0.01" className="pr-12 h-11" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">kWp</span>
                        </div>
                        <p className="text-xs text-slate-400">Usinas acima cobram excedente</p>
                      </div>
                    </div>
                  </div>

                  {/* Bloco: Excedente */}
                  <div className="bg-white border rounded-xl p-5 space-y-4">
                    <h3 className="font-semibold text-slate-700 text-sm">📐 Excedente por kWp</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-600">Preço por kWp Excedente</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                          <Input value={form.precoKwpExcedente} onChange={e => updateField('precoKwpExcedente', e.target.value)} type="number" step="0.01" className="pl-10" placeholder="0,00" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-600">Unidade de Cobrança</Label>
                        <Select value={form.unidadeCobranca} onValueChange={v => updateField('unidadeCobranca', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kWp">kWp</SelectItem>
                            <SelectItem value="módulo">Módulo</SelectItem>
                            <SelectItem value="Wp">Wp</SelectItem>
                            <SelectItem value="visita">Visita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Bloco: Custos Adicionais */}
                  <div className="bg-white border rounded-xl p-5 space-y-4">
                    <h3 className="font-semibold text-slate-700 text-sm">🚗 Custos Adicionais</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-600">Custo Mobilização/Visita</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                          <Input value={form.custoMobilizacao} onChange={e => updateField('custoMobilizacao', e.target.value)} type="number" step="0.01" className="pl-10" placeholder="0,00" />
                        </div>
                        <p className="text-xs text-slate-400">Cobrado por visita ({form.frequenciaPreventiva})</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-600">Desconto Anual (%)</Label>
                        <div className="relative">
                          <Input value={form.descontoAnualPercent} onChange={e => updateField('descontoAnualPercent', e.target.value)} type="number" step="0.1" className="pr-8" placeholder="0" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                        <p className="text-xs text-slate-400">Para pagamento anual antecipado</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-600">Garantia Performance (PR %)</Label>
                      <div className="relative max-w-xs">
                        <Input value={form.garantiaPerformancePr} onChange={e => updateField('garantiaPerformancePr', e.target.value)} type="number" step="0.01" className="pr-8" placeholder="75" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── PREVIEW DE PREÇO (2 colunas) ── */}
                <div className="col-span-2">
                  <div className="sticky top-0 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">SIMULAÇÃO</p>
                        <p className="text-sm font-semibold">Usina de {previewKwp} kWp</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Preço base</span>
                        <span className="font-medium">{fmt(precoBase)}</span>
                      </div>
                      {kwpExcedente > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Excedente ({kwpExcedente.toFixed(1)} kWp)</span>
                          <span className="font-medium">{fmt(valorExcedente)}</span>
                        </div>
                      )}
                      {custoMobilizacao > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Mobilização ({freqAnual}×/ano)</span>
                          <span className="font-medium">{fmt(mobilizacaoAnual)} /ano</span>
                        </div>
                      )}

                      <div className="border-t border-slate-700 pt-3 mt-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">Valor Mensal</span>
                          <span className="text-2xl font-black text-amber-400">{fmt(valorMensal)}</span>
                        </div>
                        <p className="text-right text-xs text-slate-500 mt-1">{fmt(valorMensal * 12)} /ano</p>
                      </div>
                    </div>

                    {/* Mini-resumo do plano */}
                    <div className="bg-slate-800/60 rounded-lg p-3 space-y-2 mt-3 border border-slate-700/50">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resumo do Plano</p>
                      <p className="text-sm font-bold text-white">{form.nome || 'Sem nome'}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge className="text-[10px] bg-slate-700 text-slate-300 border-0">
                          {CATEGORIAS.find(c => c.value === form.tipoPlano)?.label.split(' ').slice(1).join(' ') || 'Standard'}
                        </Badge>
                        <Badge className="text-[10px] bg-green-900/50 text-green-300 border-0">
                          {selectedServicesCount} serviços
                        </Badge>
                        <Badge className="text-[10px] bg-blue-900/50 text-blue-300 border-0">
                          SLA {form.tempoRespostaSlaHoras}h
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ FOOTER COM NAVEGAÇÃO ═══ */}
        <DialogFooter className="px-6 py-4 border-t bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {step > 1 && (
              <Button variant="outline" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 4 ? (
              <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600 text-white">
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[160px]"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Salvando...' : editingId ? 'Atualizar Plano' : 'Criar Plano'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
