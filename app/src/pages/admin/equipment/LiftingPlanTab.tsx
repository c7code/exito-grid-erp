import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, Anchor } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { fD } from './EquipmentTypes';

interface Props { liftingPlans: any[]; equipment: any[]; clients: any[]; rentals: any[]; reload: () => void; }

const OP_TYPE: Record<string,string> = { lifting:'Içamento', transport:'Transporte', assembly:'Montagem', disassembly:'Desmontagem', relocation:'Remanejamento' };
const GROUND: Record<string,string> = { asfalto:'Asfalto', concreto:'Concreto', terra:'Terra', lama:'Lama', cascalho:'Cascalho' };
const LP_STATUS: Record<string,{l:string;c:string}> = {
  draft:{l:'Rascunho',c:'bg-gray-100 text-gray-700'}, pending_approval:{l:'Aguardando Aprovação',c:'bg-yellow-100 text-yellow-800'},
  approved:{l:'Aprovado',c:'bg-green-100 text-green-800'}, in_execution:{l:'Em Execução',c:'bg-blue-100 text-blue-800'},
  completed:{l:'Concluído',c:'bg-emerald-100 text-emerald-800'}, cancelled:{l:'Cancelado',c:'bg-red-100 text-red-800'},
};

const defaultForm: Record<string,any> = {
  equipmentId:'', rentalId:'', clientId:'', title:'', description:'', operationType:'lifting',
  operationDate:'', operatorName:'', supervisorName:'', loadWeight:'', loadDescription:'',
  liftHeight:'', liftRadius:'', liftAngle:'', equipmentCapacity:'', groundCondition:'concreto',
  accessConditions:'', siteRestrictions:'', artNumber:'', address:'', notes:'',
  steps: [] as any[], riskAssessment: [] as any[], requiredPPE: [] as string[],
};

const DEFAULT_PPE = ['Capacete','Luvas','Óculos de Proteção','Cinto de Segurança','Botina','Protetor Auricular','Colete Refletivo'];

export default function LiftingPlanTab({ liftingPlans, equipment, clients, reload }: Props) {
  const [dlg, setDlg] = useState(false);
  const [viewDlg, setViewDlg] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState<Record<string,any>>({...defaultForm});
  const [viewPlan, setViewPlan] = useState<any>(null);

  const F = (k:string,v:any) => setForm(p=>({...p,[k]:v}));

  function openNew() { setForm({...defaultForm, steps:[], riskAssessment:[], requiredPPE:[...DEFAULT_PPE]}); setEditId(null); setDlg(true); }

  function openEdit(p:any) {
    setEditId(p.id);
    setForm({
      equipmentId:p.equipmentId||'', rentalId:p.rentalId||'', clientId:p.clientId||'',
      title:p.title||'', description:p.description||'', operationType:p.operationType||'lifting',
      operationDate:p.operationDate?String(p.operationDate).substring(0,10):'',
      operatorName:p.operatorName||'', supervisorName:p.supervisorName||'',
      loadWeight:String(p.loadWeight||''), loadDescription:p.loadDescription||'',
      liftHeight:String(p.liftHeight||''), liftRadius:String(p.liftRadius||''),
      liftAngle:String(p.liftAngle||''), equipmentCapacity:String(p.equipmentCapacity||''),
      groundCondition:p.groundCondition||'concreto', accessConditions:p.accessConditions||'',
      siteRestrictions:p.siteRestrictions||'', artNumber:p.artNumber||'',
      address:p.address||'', notes:p.notes||'',
      steps:p.steps||[], riskAssessment:p.riskAssessment||[], requiredPPE:p.requiredPPE||[],
    });
    setDlg(true);
  }

  async function save() {
    if(!form.equipmentId||!form.title){toast.error('Equipamento e título obrigatórios');return;}
    try {
      const util = form.loadWeight && form.equipmentCapacity ? ((Number(form.loadWeight)/Number(form.equipmentCapacity))*100) : null;
      const data = {...form, loadWeight:Number(form.loadWeight)||null, liftHeight:Number(form.liftHeight)||null,
        liftRadius:Number(form.liftRadius)||null, liftAngle:Number(form.liftAngle)||null,
        equipmentCapacity:Number(form.equipmentCapacity)||null, utilizationPercent:util};
      if(editId){await api.updateEquipmentLiftingPlan(editId,data);toast.success('Plano atualizado!');}
      else{await api.createEquipmentLiftingPlan(data);toast.success('Plano criado!');}
      setDlg(false);setEditId(null);reload();
    } catch{toast.error('Erro ao salvar');}
  }

  async function remove(id:string) {
    if(!confirm('Excluir este plano?'))return;
    try{await api.deleteEquipmentLiftingPlan(id);toast.success('Excluído');reload();}catch{toast.error('Erro');}
  }

  function addStep(){F('steps',[...form.steps,{order:form.steps.length+1,description:'',responsible:''}]);}
  function removeStep(i:number){F('steps',form.steps.filter((_:any,idx:number)=>idx!==i));}
  function updateStep(i:number,k:string,v:string){const s=[...form.steps];s[i]={...s[i],[k]:v};F('steps',s);}

  function addRisk(){F('riskAssessment',[...form.riskAssessment,{risk:'',mitigation:'',severity:'medium'}]);}
  function removeRisk(i:number){F('riskAssessment',form.riskAssessment.filter((_:any,idx:number)=>idx!==i));}
  function updateRisk(i:number,k:string,v:string){const r=[...form.riskAssessment];r[i]={...r[i],[k]:v};F('riskAssessment',r);}

  function togglePPE(item:string){
    const list = form.requiredPPE||[];
    F('requiredPPE', list.includes(item)?list.filter((p:string)=>p!==item):[...list,item]);
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{liftingPlans.length} plano(s) de içamento</p>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-1.5"/>Novo Plano de Içamento
        </Button>
      </div>

      <div className="grid gap-4">
        {liftingPlans.map((p:any) => {
          const util = Number(p.utilizationPercent||0);
          return (
            <Card key={p.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{p.title}</span>
                    <Badge className={LP_STATUS[p.status]?.c||''}>{LP_STATUS[p.status]?.l||p.status}</Badge>
                    <Badge variant="outline" className="text-xs">{OP_TYPE[p.operationType]||p.operationType}</Badge>
                    <span className="text-xs text-slate-400">{p.code}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {p.equipment?.name||'—'} • {p.client?.name||'Sem cliente'} • {fD(p.operationDate)}
                  </p>
                  {p.loadWeight && (
                    <div className="flex gap-4 mt-2 text-xs">
                      <span>Carga: <strong>{Number(p.loadWeight).toLocaleString('pt-BR')} kg</strong></span>
                      {p.liftHeight && <span>Altura: <strong>{p.liftHeight}m</strong></span>}
                      {p.liftRadius && <span>Raio: <strong>{p.liftRadius}m</strong></span>}
                      {util > 0 && (
                        <span className={util > 85 ? 'text-red-600 font-bold' : util > 70 ? 'text-amber-600' : 'text-green-600'}>
                          Utilização: {util.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>{setViewPlan(p);setViewDlg(true);}}><Eye className="h-3.5 w-3.5 text-slate-400"/></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>openEdit(p)}><Pencil className="h-3.5 w-3.5"/></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={()=>remove(p.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                </div>
              </div>
            </Card>
          );
        })}
        {liftingPlans.length===0 && (
          <Card className="p-12 text-center">
            <Anchor className="h-14 w-14 mx-auto mb-3 text-slate-300"/>
            <p className="text-slate-500 font-medium">Nenhum plano de içamento</p>
            <p className="text-sm text-slate-400 mt-1">Planejamento técnico de operações de içamento, transporte e montagem</p>
          </Card>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDlg} onOpenChange={setViewDlg}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Plano de Içamento — {viewPlan?.code}</DialogTitle></DialogHeader>
          {viewPlan && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
                <div><span className="text-slate-400">Título:</span> <strong>{viewPlan.title}</strong></div>
                <div><span className="text-slate-400">Status:</span> <Badge className={LP_STATUS[viewPlan.status]?.c||''}>{LP_STATUS[viewPlan.status]?.l}</Badge></div>
                <div><span className="text-slate-400">Equipamento:</span> {viewPlan.equipment?.name||'—'}</div>
                <div><span className="text-slate-400">Cliente:</span> {viewPlan.client?.name||'—'}</div>
                <div><span className="text-slate-400">Data:</span> {fD(viewPlan.operationDate)}</div>
                <div><span className="text-slate-400">Tipo:</span> {OP_TYPE[viewPlan.operationType]||viewPlan.operationType}</div>
                <div><span className="text-slate-400">Operador:</span> {viewPlan.operatorName||'—'}</div>
                <div><span className="text-slate-400">Supervisor:</span> {viewPlan.supervisorName||'—'}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-indigo-50 p-3 rounded-lg">
                <div><span className="text-slate-400">Carga (kg):</span> <strong>{Number(viewPlan.loadWeight||0).toLocaleString('pt-BR')}</strong></div>
                <div><span className="text-slate-400">Descrição:</span> {viewPlan.loadDescription||'—'}</div>
                <div><span className="text-slate-400">Altura (m):</span> {viewPlan.liftHeight||'—'}</div>
                <div><span className="text-slate-400">Raio (m):</span> {viewPlan.liftRadius||'—'}</div>
                <div><span className="text-slate-400">Capacidade:</span> {viewPlan.equipmentCapacity||'—'}</div>
                <div><span className="text-slate-400">Utilização:</span> <span className={Number(viewPlan.utilizationPercent)>85?'text-red-600 font-bold':''}>{Number(viewPlan.utilizationPercent||0).toFixed(0)}%</span></div>
                <div><span className="text-slate-400">Solo:</span> {GROUND[viewPlan.groundCondition]||viewPlan.groundCondition}</div>
                <div><span className="text-slate-400">ART:</span> {viewPlan.artNumber||'—'}</div>
              </div>
              {viewPlan.steps?.length>0 && (
                <div><p className="font-semibold text-indigo-700 mb-1">Etapas da Operação</p>
                  {viewPlan.steps.map((s:any,i:number)=>(
                    <div key={i} className="flex gap-2 py-1 border-b border-slate-100">
                      <span className="text-slate-400 w-6">{s.order||i+1}.</span>
                      <span className="flex-1">{s.description}</span>
                      <span className="text-xs text-slate-400">{s.responsible}</span>
                    </div>
                  ))}
                </div>
              )}
              {viewPlan.riskAssessment?.length>0 && (
                <div><p className="font-semibold text-red-700 mb-1">Análise de Riscos</p>
                  {viewPlan.riskAssessment.map((r:any,i:number)=>(
                    <div key={i} className="py-1 border-b border-slate-100">
                      <span className="font-medium">{r.risk}</span> → <span className="text-green-700">{r.mitigation}</span>
                    </div>
                  ))}
                </div>
              )}
              {viewPlan.requiredPPE?.length>0 && (
                <div><p className="font-semibold text-amber-700 mb-1">EPI Necessário</p>
                  <div className="flex flex-wrap gap-1">{viewPlan.requiredPPE.map((p:string)=><Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dlg} onOpenChange={v=>{if(!v){setDlg(false);setEditId(null);}}}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId?'Editar':'Novo'} Plano de Içamento</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Título *</Label><Input value={form.title} onChange={e=>F('title',e.target.value)} placeholder="Ex: Içamento de transformador 5t"/></div>
              <div><Label>Equipamento *</Label>
                <Select value={form.equipmentId} onValueChange={v=>F('equipmentId',v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                  <SelectContent>{equipment.map(e=><SelectItem key={e.id} value={e.id}>{e.code} - {e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cliente</Label>
                <Select value={form.clientId} onValueChange={v=>F('clientId',v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                  <SelectContent>{clients.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tipo de Operação</Label>
                <Select value={form.operationType} onValueChange={v=>F('operationType',v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(OP_TYPE).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data da Operação</Label><Input type="date" value={form.operationDate} onChange={e=>F('operationDate',e.target.value)}/></div>
              <div><Label>Operador</Label><Input value={form.operatorName} onChange={e=>F('operatorName',e.target.value)}/></div>
              <div><Label>Supervisor</Label><Input value={form.supervisorName} onChange={e=>F('supervisorName',e.target.value)}/></div>
            </div>

            {/* Technical */}
            <div className="border rounded-lg p-4 bg-indigo-50/30">
              <p className="text-xs font-bold text-indigo-700 uppercase mb-3">Dados Técnicos</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Peso da Carga (kg)</Label><Input type="number" value={form.loadWeight} onChange={e=>F('loadWeight',e.target.value)}/></div>
                <div><Label className="text-xs">Altura Içamento (m)</Label><Input type="number" value={form.liftHeight} onChange={e=>F('liftHeight',e.target.value)}/></div>
                <div><Label className="text-xs">Raio Operação (m)</Label><Input type="number" value={form.liftRadius} onChange={e=>F('liftRadius',e.target.value)}/></div>
                <div><Label className="text-xs">Ângulo Lança (°)</Label><Input type="number" value={form.liftAngle} onChange={e=>F('liftAngle',e.target.value)}/></div>
                <div><Label className="text-xs">Capacidade Equip. (kg)</Label><Input type="number" value={form.equipmentCapacity} onChange={e=>F('equipmentCapacity',e.target.value)}/></div>
                <div><Label className="text-xs">Condição do Solo</Label>
                  <Select value={form.groundCondition} onValueChange={v=>F('groundCondition',v)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{Object.entries(GROUND).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {form.loadWeight && form.equipmentCapacity && (
                <div className="mt-2 text-sm">
                  Utilização: <strong className={(Number(form.loadWeight)/Number(form.equipmentCapacity)*100)>85?'text-red-600':'text-green-600'}>
                    {(Number(form.loadWeight)/Number(form.equipmentCapacity)*100).toFixed(1)}%
                  </strong>
                </div>
              )}
              <div className="mt-3"><Label className="text-xs">Descrição da Carga</Label><Input value={form.loadDescription} onChange={e=>F('loadDescription',e.target.value)}/></div>
              <div className="mt-2"><Label className="text-xs">Restrições do Local</Label><Textarea value={form.siteRestrictions} onChange={e=>F('siteRestrictions',e.target.value)} rows={2}/></div>
            </div>

            {/* Steps */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-slate-700 uppercase">Etapas da Operação</p>
                <Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3 w-3 mr-1"/>Etapa</Button>
              </div>
              {form.steps?.map((s:any,i:number)=>(
                <div key={i} className="flex gap-2 items-center mb-2">
                  <span className="text-xs text-slate-400 w-5">{i+1}.</span>
                  <Input className="flex-1" placeholder="Descrição da etapa" value={s.description} onChange={e=>updateStep(i,'description',e.target.value)}/>
                  <Input className="w-32" placeholder="Responsável" value={s.responsible} onChange={e=>updateStep(i,'responsible',e.target.value)}/>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={()=>removeStep(i)}><Trash2 className="h-3 w-3"/></Button>
                </div>
              ))}
            </div>

            {/* Risks */}
            <div className="border rounded-lg p-4 bg-red-50/30">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-red-700 uppercase">Análise de Riscos</p>
                <Button size="sm" variant="outline" onClick={addRisk}><Plus className="h-3 w-3 mr-1"/>Risco</Button>
              </div>
              {form.riskAssessment?.map((r:any,i:number)=>(
                <div key={i} className="flex gap-2 items-center mb-2">
                  <Input className="flex-1" placeholder="Risco identificado" value={r.risk} onChange={e=>updateRisk(i,'risk',e.target.value)}/>
                  <Input className="flex-1" placeholder="Medida mitigatória" value={r.mitigation} onChange={e=>updateRisk(i,'mitigation',e.target.value)}/>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={()=>removeRisk(i)}><Trash2 className="h-3 w-3"/></Button>
                </div>
              ))}
            </div>

            {/* PPE */}
            <div className="border rounded-lg p-4 bg-amber-50/30">
              <p className="text-xs font-bold text-amber-700 uppercase mb-2">EPI Necessário</p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_PPE.map(item=>(
                  <button key={item} type="button" onClick={()=>togglePPE(item)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${form.requiredPPE?.includes(item)?'bg-amber-100 border-amber-400 text-amber-800':'bg-white border-slate-200 text-slate-500'}`}
                  >{item}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nº ART</Label><Input value={form.artNumber} onChange={e=>F('artNumber',e.target.value)}/></div>
              <div><Label>Endereço</Label><Input value={form.address} onChange={e=>F('address',e.target.value)}/></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e=>F('notes',e.target.value)} rows={2}/></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={()=>{setDlg(false);setEditId(null);}}>Cancelar</Button>
            <Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700 text-white">{editId?'Salvar':'Criar Plano'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
