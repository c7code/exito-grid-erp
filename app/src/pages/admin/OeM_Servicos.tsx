import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { api } from '@/api';
import { Plus, Pencil, Trash2, FileSignature, CheckCircle2, ClipboardList } from 'lucide-react';
import {
  TIPO_LABELS, TIPO_COLORS, TIPO_ICONS,
  STATUS_LABELS, STATUS_COLORS,
  PRIORIDADE_LABELS, PRIORIDADE_COLORS,
  emptyServico, fmt,
} from './OeM_handlers';

interface Props {
  servicos: any[];
  usinas: any[];
  clients: any[];
  onReload: () => void;
}

export default function OeMServicos({ servicos, usinas, clients, onReload }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [concluirOpen, setConcluirOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...emptyServico });
  const [concluirForm, setConcluirForm] = useState<any>({ diagnostico: '', solucao: '', valorFinal: '', recomendacoes: '', relatorioTecnico: '' });
  const [concluirId, setConcluirId] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState('todos');
  const [checklist, setChecklist] = useState<any[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');

  const getClientName = (id: string) => { const c = clients.find((c: any) => c.id === id); return c?.name || c?.razaoSocial || '—'; };

  const loadChecklist = async (tipo: string) => {
    try {
      const cl = await api.getOemChecklist(tipo);
      setChecklist(cl);
      setForm((f: any) => ({ ...f, checklist: JSON.stringify(cl) }));
    } catch { /* use empty */ }
  };

  const handleNew = (tipo: string = 'preventiva') => {
    setEditingId(null);
    setForm({ ...emptyServico, tipo });
    loadChecklist(tipo);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.usinaId) { toast.error('Selecione uma usina'); return; }
    if (!form.clienteId) { toast.error('Selecione um cliente'); return; }
    try {
      const data = { ...form, checklist: JSON.stringify(checklist) };
      if (!data.valorEstimado) data.valorEstimado = null;
      if (!data.dataAgendada) data.dataAgendada = null;
      if (editingId) { await api.updateOemServico(editingId, data); toast.success('Serviço atualizado'); }
      else { await api.createOemServico(data); toast.success('Serviço criado'); }
      setDialogOpen(false); setEditingId(null); onReload();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erro ao salvar'); }
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    const cl = s.checklist ? (typeof s.checklist === 'string' ? JSON.parse(s.checklist) : s.checklist) : [];
    setChecklist(cl);
    setForm({
      tipo: s.tipo, usinaId: s.usinaId || '', clienteId: s.clienteId || '',
      prioridade: s.prioridade || 'normal', descricao: s.descricao || '',
      dataAgendada: s.dataAgendada?.split('T')[0] || '', valorEstimado: String(s.valorEstimado || ''),
      tecnicoResponsavel: s.tecnicoResponsavel || '', observacoes: s.observacoes || '',
      checklist: JSON.stringify(cl),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => { if (!confirm('Excluir serviço?')) return; try { await api.deleteOemServico(id); toast.success('Excluído'); onReload(); } catch { toast.error('Erro'); } };

  const handleGerarProposta = async (id: string) => {
    try {
      const result = await api.gerarPropostaServico(id);
      toast.success(`Proposta ${result.proposalNumber} gerada! Acesse o módulo Propostas.`);
      onReload();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erro ao gerar proposta'); }
  };

  const handleConcluir = (s: any) => {
    setConcluirId(s.id);
    setConcluirForm({ diagnostico: s.diagnostico || '', solucao: s.solucao || '', valorFinal: String(s.valorFinal || s.valorEstimado || ''), recomendacoes: s.recomendacoes || '', relatorioTecnico: s.relatorioTecnico || '' });
    setConcluirOpen(true);
  };

  const handleSaveConcluir = async () => {
    if (!concluirId) return;
    try {
      await api.concluirOemServico(concluirId, { ...concluirForm, valorFinal: concluirForm.valorFinal ? Number(concluirForm.valorFinal) : null });
      toast.success('Serviço concluído!');
      setConcluirOpen(false); onReload();
    } catch { toast.error('Erro ao concluir'); }
  };

  const toggleCheckItem = (idx: number) => {
    const updated = [...checklist];
    updated[idx] = { ...updated[idx], checked: !updated[idx].checked };
    setChecklist(updated);
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist([...checklist, { item: newCheckItem.trim(), checked: false }]);
    setNewCheckItem('');
  };

  const removeCheckItem = (idx: number) => {
    setChecklist(checklist.filter((_, i) => i !== idx));
  };

  const filtered = filterTipo === 'todos' ? servicos : servicos.filter((s: any) => s.tipo === filterTipo);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => handleNew('preventiva')} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1" />Preventiva</Button>
        <Button onClick={() => handleNew('preditiva')} className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-1" />Preditiva</Button>
        <Button onClick={() => handleNew('corretiva')} className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-1" />Corretiva</Button>
        <div className="ml-auto">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="preventiva">Preventiva</SelectItem>
              <SelectItem value="preditiva">Preditiva</SelectItem>
              <SelectItem value="corretiva">Corretiva</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 && <p className="text-slate-400 text-center py-8">Nenhum serviço registrado</p>}
      <div className="grid gap-3">
        {filtered.map((s: any) => (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-lg">{TIPO_ICONS[s.tipo]}</span>
                    <Badge className={TIPO_COLORS[s.tipo]}>{TIPO_LABELS[s.tipo]}</Badge>
                    <Badge className={STATUS_COLORS[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                    <Badge variant="outline" className={PRIORIDADE_COLORS[s.prioridade]}>{PRIORIDADE_LABELS[s.prioridade]}</Badge>
                    {s.proposalId && <Badge variant="outline" className="bg-green-50 text-green-600"><FileSignature className="w-3 h-3 mr-1" />Proposta vinculada</Badge>}
                  </div>
                  <p className="font-semibold text-slate-900">{s.usina?.nome || '—'}</p>
                  <p className="text-sm text-slate-500 line-clamp-2">{s.descricao || 'Sem descrição'}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span>Cliente: {s.cliente?.name || s.cliente?.razaoSocial || getClientName(s.clienteId)}</span>
                    {s.dataAgendada && <span>Agendado: {s.dataAgendada.split('T')[0]}</span>}
                    {s.tecnicoResponsavel && <span>Técnico: {s.tecnicoResponsavel}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {(s.valorEstimado || s.valorFinal) && <p className="text-lg font-bold text-amber-600">{fmt(s.valorFinal || s.valorEstimado)}</p>}
                  <div className="flex gap-1 mt-2">
                    {s.status !== 'concluido' && s.status !== 'cancelado' && (
                      <>
                        {!s.proposalId && <Button variant="outline" size="sm" title="Gerar Proposta" onClick={() => handleGerarProposta(s.id)}><FileSignature className="w-3.5 h-3.5" /></Button>}
                        <Button variant="outline" size="sm" title="Concluir" className="text-green-600" onClick={() => handleConcluir(s)}><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ NOVO/EDITAR SERVIÇO ═══ */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditingId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Serviço' : `Novo Serviço — ${TIPO_LABELS[form.tipo]}`}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => { setForm({ ...form, tipo: v }); if (!editingId) loadChecklist(v); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventiva">🔧 Preventiva</SelectItem>
                    <SelectItem value="preditiva">📊 Preditiva</SelectItem>
                    <SelectItem value="corretiva">⚡ Corretiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={v => setForm({ ...form, prioridade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">🔶 Alta</SelectItem>
                    <SelectItem value="urgente">🔴 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Usina *</Label>
                <Select value={form.usinaId} onValueChange={v => { const u = usinas.find((u: any) => u.id === v); setForm({ ...form, usinaId: v, clienteId: u?.clienteId || form.clienteId }); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{usinas.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.nome} ({Number(u.potenciaKwp).toFixed(1)} kWp)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Cliente *</Label>
                <Select value={form.clienteId} onValueChange={v => setForm({ ...form, clienteId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name || c.razaoSocial}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Dados técnicos da usina selecionada */}
            {form.usinaId && (() => {
              const u = usinas.find((u: any) => u.id === form.usinaId);
              if (!u) return null;
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <h3 className="font-bold text-amber-800 text-sm flex items-center gap-2">⚡ Dados Técnicos da Usina — {u.nome}</h3>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Potência:</span><span className="font-semibold">{Number(u.potenciaKwp || 0).toFixed(1)} kWp</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Módulos:</span><span className="font-semibold">{u.qtdModulos || '—'} un</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Inversores:</span><span className="font-semibold">{u.qtdInversores || 1} un</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Modelo Módulo:</span><span className="font-medium">{u.modeloModulos || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Modelo Inversor:</span><span className="font-medium">{u.modeloInversores || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Marca Inversor:</span><span className="font-medium">{u.marcaInversor || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tipo Telhado:</span><span className="font-medium">{u.tipoTelhado || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Instalação:</span><span className="font-medium">{u.dataInstalacao?.split('T')[0] || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Geração Esp.:</span><span className="font-medium">{u.geracaoMensalEsperadaKwh ? `${Number(u.geracaoMensalEsperadaKwh).toFixed(0)} kWh/mês` : '—'}</span></div>
                    <div className="col-span-3 flex justify-between"><span className="text-slate-500">Endereço:</span><span className="font-medium">{u.endereco || '—'}</span></div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Data Agendada</Label><Input type="date" value={form.dataAgendada} onChange={e => setForm({ ...form, dataAgendada: e.target.value })} /></div>
              <div className="space-y-1"><Label>Valor Estimado (R$)</Label><Input type="number" step="0.01" value={form.valorEstimado} onChange={e => setForm({ ...form, valorEstimado: e.target.value })} /></div>
              <div className="col-span-2 space-y-1"><Label>Técnico Responsável</Label><Input value={form.tecnicoResponsavel} onChange={e => setForm({ ...form, tecnicoResponsavel: e.target.value })} /></div>
              <div className="col-span-2 space-y-1"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} placeholder="Descreva o serviço a ser realizado..." /></div>
            </div>

            {/* Checklist */}
            <div className="bg-slate-50 border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-700">Checklist — {TIPO_LABELS[form.tipo] || form.tipo}</h3>
              </div>
              {checklist.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <Checkbox checked={item.checked} onCheckedChange={() => toggleCheckItem(idx)} />
                  <span className={`text-sm flex-1 ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.item}</span>
                  <button type="button" onClick={() => removeCheckItem(idx)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity" title="Remover item">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {checklist.length === 0 && <p className="text-xs text-slate-400">Nenhum item no checklist</p>}
              {/* Adicionar novo item */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <Input
                  value={newCheckItem}
                  onChange={e => setNewCheckItem(e.target.value)}
                  placeholder="Adicionar nova atividade..."
                  className="text-sm h-8"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addCheckItem} className="shrink-0 h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" />Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-1"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Salvar Serviço</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CONCLUIR SERVIÇO ═══ */}
      <Dialog open={concluirOpen} onOpenChange={setConcluirOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle><CheckCircle2 className="w-5 h-5 inline mr-2 text-green-600" />Concluir Serviço</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Diagnóstico Técnico *</Label><Textarea value={concluirForm.diagnostico} onChange={e => setConcluirForm({ ...concluirForm, diagnostico: e.target.value })} rows={3} placeholder="Descreva o que foi encontrado..." /></div>
            <div className="space-y-1"><Label>Solução Aplicada *</Label><Textarea value={concluirForm.solucao} onChange={e => setConcluirForm({ ...concluirForm, solucao: e.target.value })} rows={3} placeholder="Descreva a solução executada..." /></div>
            <div className="space-y-1"><Label>Valor Final (R$)</Label><Input type="number" step="0.01" value={concluirForm.valorFinal} onChange={e => setConcluirForm({ ...concluirForm, valorFinal: e.target.value })} /></div>
            <div className="space-y-1"><Label>Relatório Técnico</Label><Textarea value={concluirForm.relatorioTecnico} onChange={e => setConcluirForm({ ...concluirForm, relatorioTecnico: e.target.value })} rows={3} placeholder="Detalhes técnicos, medições, resultados de termografia..." /></div>
            <div className="space-y-1"><Label>Recomendações Futuras</Label><Textarea value={concluirForm.recomendacoes} onChange={e => setConcluirForm({ ...concluirForm, recomendacoes: e.target.value })} rows={2} placeholder="Próximos passos recomendados..." /></div>
          </div>
          <DialogFooter><Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveConcluir}><CheckCircle2 className="w-4 h-4 mr-1" />Concluir Serviço</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
