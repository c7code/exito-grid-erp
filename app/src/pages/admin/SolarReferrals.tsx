import { useState, useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { UserPlus, Users, TrendingUp, DollarSign, Target, Plus, Pencil, Trash2, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LS: Record<string,{label:string;color:string}> = {
  new:{label:'Novo Lead',color:'bg-slate-100 text-slate-700'},
  contacted:{label:'Em Contato',color:'bg-blue-100 text-blue-700'},
  qualified:{label:'Qualificado',color:'bg-cyan-100 text-cyan-700'},
  account_analysis:{label:'Analise',color:'bg-yellow-100 text-yellow-700'},
  proposal_sent:{label:'Proposta Enviada',color:'bg-orange-100 text-orange-700'},
  negotiation:{label:'Negociacao',color:'bg-purple-100 text-purple-700'},
  closed_won:{label:'Venda Fechada',color:'bg-green-100 text-green-700'},
  closed_lost:{label:'Venda Perdida',color:'bg-red-100 text-red-700'},
  no_profile:{label:'Sem Perfil',color:'bg-gray-100 text-gray-500'},
};
const CS: Record<string,{label:string;color:string}> = {
  active:{label:'Ativo',color:'bg-green-100 text-green-700'},
  inactive:{label:'Inativo',color:'bg-red-100 text-red-700'},
  training:{label:'Treinamento',color:'bg-blue-100 text-blue-700'},
  idle:{label:'Sem Movimentacao',color:'bg-gray-100 text-gray-500'},
};

export default function SolarReferrals() {
  const [tab, setTab] = useState('dashboard');
  const [dash, setDash] = useState<any>(null);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [cDialog, setCDialog] = useState(false);
  const [cEdit, setCEdit] = useState<any>(null);
  const [cForm, setCForm] = useState<any>({name:'',email:'',phone:'',document:'',status:'active',city:'',state:'',monthlyGoal:0,commissionPercent:2,notes:''});
  const [lDialog, setLDialog] = useState(false);
  const [lEdit, setLEdit] = useState<any>(null);
  const [lForm, setLForm] = useState<any>({name:'',phone:'',email:'',city:'',state:'',consultantId:'',status:'new',potentialKwp:'',potentialValue:'',notes:''});
  const [fDialog, setFDialog] = useState(false);
  const [fLead, setFLead] = useState<any>(null);
  const [fForm, setFForm] = useState({type:'internal_note',description:''});
  const [followups, setFollowups] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [d,c,l,cm] = await Promise.all([api.getReferralsDashboard(),api.getReferralConsultants(),api.getReferralLeads(),api.getReferralCommissions()]);
      setDash(d); setConsultants(Array.isArray(c)?c:[]); setLeads(Array.isArray(l)?l:[]); setCommissions(Array.isArray(cm)?cm:[]);
    } catch { toast.error('Erro ao carregar dados.'); }
  }

  async function saveConsultant() {
    try {
      if (cEdit) await api.updateReferralConsultant(cEdit.id,cForm); else await api.createReferralConsultant(cForm);
      toast.success('Salvo!'); setCDialog(false); loadAll();
    } catch { toast.error('Erro ao salvar.'); }
  }
  async function delConsultant(id:string){ if(!confirm('Excluir?'))return; await api.deleteReferralConsultant(id); toast.success('Removido.'); loadAll(); }
  async function saveLead() {
    try {
      if (lEdit) await api.updateReferralLead(lEdit.id,lForm); else await api.createReferralLead(lForm);
      toast.success('Salvo!'); setLDialog(false); loadAll();
    } catch { toast.error('Erro ao salvar.'); }
  }
  async function delLead(id:string){ if(!confirm('Excluir?'))return; await api.deleteReferralLead(id); toast.success('Removido.'); loadAll(); }
  async function openFollowup(lead:any){ setFLead(lead); setFForm({type:'internal_note',description:''}); const d=await api.getReferralFollowups({leadId:lead.id}); setFollowups(Array.isArray(d)?d:[]); setFDialog(true); }
  async function saveFollowup(){ if(!fForm.description.trim())return; await api.createReferralFollowup({...fForm,leadId:fLead.id}); toast.success('Registrado!'); const d=await api.getReferralFollowups({leadId:fLead.id}); setFollowups(Array.isArray(d)?d:[]); setFForm({type:'internal_note',description:''}); }
  async function updComm(id:string,status:string){ await api.updateReferralCommission(id,{status}); toast.success('Atualizado!'); loadAll(); }

  const openC=()=>{setCEdit(null);setCForm({name:'',email:'',phone:'',document:'',status:'active',city:'',state:'',monthlyGoal:0,commissionPercent:2,notes:''});setCDialog(true);};
  const editC=(c:any)=>{setCEdit(c);setCForm({name:c.name,email:c.email||'',phone:c.phone||'',document:c.document||'',status:c.status,city:c.city||'',state:c.state||'',monthlyGoal:c.monthlyGoal||0,commissionPercent:c.commissionPercent||2,notes:c.notes||''});setCDialog(true);};
  const openL=()=>{setLEdit(null);setLForm({name:'',phone:'',email:'',city:'',state:'',consultantId:'',status:'new',potentialKwp:'',potentialValue:'',notes:''});setLDialog(true);};
  const editL=(l:any)=>{setLEdit(l);setLForm({name:l.name,phone:l.phone||'',email:l.email||'',city:l.city||'',state:l.state||'',consultantId:l.consultantId||'',status:l.status,potentialKwp:l.potentialKwp||'',potentialValue:l.potentialValue||'',notes:l.notes||''});setLDialog(true);};

  const R=(v:number)=>'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2});
  const SC=({icon:I,label,value,color}:any)=>(<div className="bg-white rounded-xl border p-5 flex items-center gap-4"><div className={"w-12 h-12 rounded-xl flex items-center justify-center "+color}><I className="w-6 h-6"/></div><div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-800">{value}</p></div></div>);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">?? Canal de Indicacoes Solar</h1><p className="text-slate-500 text-sm">Gerencie consultores, leads e comissoes</p></div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="consultants">Consultores</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="commissions">Comissoes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {dash&&(<>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SC icon={Users} label="Consultores" value={dash.totalConsultants||0} color="bg-slate-100 text-slate-700"/>
              <SC icon={UserPlus} label="Ativos" value={dash.activeConsultants||0} color="bg-green-100 text-green-700"/>
              <SC icon={Target} label="Leads no Mes" value={dash.leadsThisMonth||0} color="bg-blue-100 text-blue-700"/>
              <SC icon={TrendingUp} label="Vendas Fechadas" value={dash.closedWon||0} color="bg-amber-100 text-amber-700"/>
              <SC icon={Star} label="Taxa Conversao" value={(dash.conversionRate||0)+'%'} color="bg-purple-100 text-purple-700"/>
              <SC icon={Target} label="Propostas Enviadas" value={dash.proposalsSent||0} color="bg-orange-100 text-orange-700"/>
              <SC icon={DollarSign} label="Comissoes Pendentes" value={R(Number(dash.pendingCommissions||0))} color="bg-yellow-100 text-yellow-700"/>
              <SC icon={DollarSign} label="Comissoes Pagas" value={R(Number(dash.paidCommissions||0))} color="bg-emerald-100 text-emerald-700"/>
            </div>
            {dash.belowGoal?.length>0&&(<div className="bg-white rounded-xl border p-5"><h3 className="font-semibold text-slate-700 mb-3">?? Abaixo da Meta</h3><div className="space-y-2">{dash.belowGoal.map((c:any)=>(<div key={c.id} className="flex justify-between p-3 bg-red-50 rounded-lg border border-red-100"><span className="font-medium">{c.name}</span><span className="text-sm text-red-600">{c.leadsthismonth||0}/{c.monthlyGoal} leads</span></div>))}</div></div>)}
            {dash.leadsByConsultant?.length>0&&(<div className="bg-white rounded-xl border p-5"><h3 className="font-semibold text-slate-700 mb-3">Leads por Consultor</h3><Table><TableHeader><TableRow><TableHead>Consultor</TableHead><TableHead>Leads</TableHead><TableHead>Vendas</TableHead></TableRow></TableHeader><TableBody>{dash.leadsByConsultant.map((c:any)=>(<TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell>{c.total}</TableCell><TableCell>{c.won}</TableCell></TableRow>))}</TableBody></Table></div>)}
          </>)}
          {!dash&&<p className="text-slate-400 text-center py-12">Carregando...</p>}
        </TabsContent>

        <TabsContent value="consultants" className="mt-4">
          <div className="flex justify-end mb-4"><Button onClick={openC}><Plus className="w-4 h-4 mr-2"/>Novo Consultor</Button></div>
          <div className="bg-white rounded-xl border"><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Cidade</TableHead><TableHead>Status</TableHead><TableHead>Meta/Mes</TableHead><TableHead>Comissao</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{consultants.map(c=>{const st=CS[c.status]||CS.active;return(<TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.phone||'—'}</TableCell><TableCell>{c.city||'—'}</TableCell><TableCell><Badge className={st.color}>{st.label}</Badge></TableCell><TableCell>{c.monthlyGoal||0} leads</TableCell><TableCell>{c.commissionPercent||2}%</TableCell><TableCell><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>editC(c)}><Pencil className="w-3 h-3"/></Button><Button size="sm" variant="outline" className="text-red-600" onClick={()=>delConsultant(c.id)}><Trash2 className="w-3 h-3"/></Button></div></TableCell></TableRow>);})}</TableBody></Table>
          {consultants.length===0&&<p className="text-center text-slate-400 py-8">Nenhum consultor cadastrado.</p>}</div>
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <div className="flex justify-end mb-4"><Button onClick={openL}><Plus className="w-4 h-4 mr-2"/>Novo Lead</Button></div>
          <div className="bg-white rounded-xl border"><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Consultor</TableHead><TableHead>Cidade</TableHead><TableHead>Status</TableHead><TableHead>kWp</TableHead><TableHead>Valor Est.</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{leads.map(l=>{const st=LS[l.status]||LS.new;return(<TableRow key={l.id}><TableCell className="font-medium">{l.name}</TableCell><TableCell>{l.consultant?.name||'—'}</TableCell><TableCell>{l.city||'—'}</TableCell><TableCell><Badge className={st.color}>{st.label}</Badge></TableCell><TableCell>{l.potentialKwp?Number(l.potentialKwp).toFixed(1):'—'}</TableCell><TableCell>{l.potentialValue?R(Number(l.potentialValue)):'—'}</TableCell><TableCell><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>openFollowup(l)} title="Acompanhamento"><Phone className="w-3 h-3"/></Button><Button size="sm" variant="outline" onClick={()=>editL(l)}><Pencil className="w-3 h-3"/></Button><Button size="sm" variant="outline" className="text-red-600" onClick={()=>delLead(l.id)}><Trash2 className="w-3 h-3"/></Button></div></TableCell></TableRow>);})}</TableBody></Table>
          {leads.length===0&&<p className="text-center text-slate-400 py-8">Nenhum lead cadastrado.</p>}</div>
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <div className="bg-white rounded-xl border"><Table><TableHeader><TableRow><TableHead>Consultor</TableHead><TableHead>Lead</TableHead><TableHead>Valor Venda</TableHead><TableHead>Comissao</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{commissions.map(cm=>(<TableRow key={cm.id}><TableCell>{cm.consultant?.name||'—'}</TableCell><TableCell>{cm.lead?.name||'—'}</TableCell><TableCell>{cm.saleValue?R(Number(cm.saleValue)):'—'}</TableCell><TableCell className="font-semibold text-green-700">{cm.commissionValue?R(Number(cm.commissionValue)):'—'}</TableCell><TableCell><Badge className={cm.status==='paid'?'bg-green-100 text-green-700':cm.status==='approved'?'bg-blue-100 text-blue-700':'bg-yellow-100 text-yellow-700'}>{cm.status==='paid'?'Paga':cm.status==='approved'?'Aprovada':'Pendente'}</Badge></TableCell><TableCell><div className="flex gap-2">{cm.status==='pending'&&<Button size="sm" variant="outline" onClick={()=>updComm(cm.id,'approved')}>Aprovar</Button>}{cm.status==='approved'&&<Button size="sm" onClick={()=>updComm(cm.id,'paid')}>Marcar Paga</Button>}</div></TableCell></TableRow>))}</TableBody></Table>
          {commissions.length===0&&<p className="text-center text-slate-400 py-8">Nenhuma comissao registrada.</p>}</div>
        </TabsContent>
      </Tabs>

      {/* Dialog Consultor */}
      <Dialog open={cDialog} onOpenChange={setCDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{cEdit?'Editar':'Novo'} Consultor</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label>Nome*</Label><Input value={cForm.name} onChange={e=>setCForm({...cForm,name:e.target.value})} placeholder="Nome completo"/></div>
            <div><Label>Telefone</Label><Input value={cForm.phone} onChange={e=>setCForm({...cForm,phone:e.target.value})}/></div>
            <div><Label>Email</Label><Input value={cForm.email} onChange={e=>setCForm({...cForm,email:e.target.value})}/></div>
            <div><Label>CPF/CNPJ</Label><Input value={cForm.document} onChange={e=>setCForm({...cForm,document:e.target.value})}/></div>
            <div><Label>Status</Label><Select value={cForm.status} onValueChange={v=>setCForm({...cForm,status:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem><SelectItem value="training">Treinamento</SelectItem><SelectItem value="idle">Sem Movimentacao</SelectItem></SelectContent></Select></div>
            <div><Label>Cidade</Label><Input value={cForm.city} onChange={e=>setCForm({...cForm,city:e.target.value})}/></div>
            <div><Label>Estado (UF)</Label><Input value={cForm.state} onChange={e=>setCForm({...cForm,state:e.target.value})} maxLength={2} placeholder="SP"/></div>
            <div><Label>Meta Mensal (leads)</Label><Input type="number" value={cForm.monthlyGoal} onChange={e=>setCForm({...cForm,monthlyGoal:Number(e.target.value)})}/></div>
            <div><Label>Comissao (%)</Label><Input type="number" step="0.5" value={cForm.commissionPercent} onChange={e=>setCForm({...cForm,commissionPercent:Number(e.target.value)})}/></div>
            <div className="col-span-2"><Label>Observacoes</Label><Textarea value={cForm.notes} onChange={e=>setCForm({...cForm,notes:e.target.value})} rows={2}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setCDialog(false)}>Cancelar</Button><Button onClick={saveConsultant}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Lead */}
      <Dialog open={lDialog} onOpenChange={setLDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{lEdit?'Editar':'Novo'} Lead Indicado</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label>Nome*</Label><Input value={lForm.name} onChange={e=>setLForm({...lForm,name:e.target.value})} placeholder="Nome do cliente potencial"/></div>
            <div><Label>Telefone</Label><Input value={lForm.phone} onChange={e=>setLForm({...lForm,phone:e.target.value})}/></div>
            <div><Label>Email</Label><Input value={lForm.email} onChange={e=>setLForm({...lForm,email:e.target.value})}/></div>
            <div className="col-span-2"><Label>Consultor Indicador</Label><Select value={lForm.consultantId} onValueChange={v=>setLForm({...lForm,consultantId:v})}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{consultants.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={lForm.status} onValueChange={v=>setLForm({...lForm,status:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(LS).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Cidade</Label><Input value={lForm.city} onChange={e=>setLForm({...lForm,city:e.target.value})}/></div>
            <div><Label>kWp Estimado</Label><Input type="number" value={lForm.potentialKwp} onChange={e=>setLForm({...lForm,potentialKwp:e.target.value})}/></div>
            <div><Label>Valor Est. (R$)</Label><Input type="number" value={lForm.potentialValue} onChange={e=>setLForm({...lForm,potentialValue:e.target.value})}/></div>
            <div className="col-span-2"><Label>Observacoes</Label><Textarea value={lForm.notes} onChange={e=>setLForm({...lForm,notes:e.target.value})} rows={2}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setLDialog(false)}>Cancelar</Button><Button onClick={saveLead}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Acompanhamento */}
      <Dialog open={fDialog} onOpenChange={setFDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Acompanhamentos — {fLead?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">{followups.map(f=>(<div key={f.id} className="bg-slate-50 rounded-lg p-3 border"><div className="flex justify-between mb-1"><Badge className="bg-slate-200 text-slate-700 text-xs">{f.type}</Badge><span className="text-xs text-slate-400">{new Date(f.createdAt).toLocaleDateString('pt-BR')}</span></div><p className="text-sm text-slate-700">{f.description}</p></div>))}{followups.length===0&&<p className="text-slate-400 text-sm text-center py-4">Sem acompanhamentos.</p>}</div>
          <div className="border-t pt-3 space-y-2">
            <Select value={fForm.type} onValueChange={v=>setFForm({...fForm,type:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="call">Ligacao</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="meeting">Reuniao</SelectItem><SelectItem value="visit">Visita</SelectItem><SelectItem value="internal_note">Nota Interna</SelectItem></SelectContent></Select>
            <Textarea placeholder="Descricao do contato..." value={fForm.description} onChange={e=>setFForm({...fForm,description:e.target.value})} rows={2}/>
            <Button className="w-full" onClick={saveFollowup}>Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
