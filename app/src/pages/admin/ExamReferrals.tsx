import { useState, useEffect } from 'react';
import { api } from '../../api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, Plus, Trash2, Send, Loader2, Search, Eye } from 'lucide-react';

const ET: Record<string, string> = { admissional: 'Admissional', periodico: 'Periódico', retorno: 'Retorno ao Trabalho', demissional: 'Demissional', mudanca_funcao: 'Mudança de Função', consulta: 'Consulta' };
const ST: Record<string, { l: string; c: string }> = {
    draft: { l: 'Rascunho', c: 'bg-gray-100 text-gray-600' }, sent: { l: 'Enviada', c: 'bg-blue-100 text-blue-700' },
    budget_received: { l: 'Orçamento', c: 'bg-yellow-100 text-yellow-700' }, scheduled: { l: 'Agendada', c: 'bg-purple-100 text-purple-700' },
    completed: { l: 'Concluída', c: 'bg-green-100 text-green-700' }, cancelled: { l: 'Cancelada', c: 'bg-red-100 text-red-700' },
};

export default function ExamReferrals() {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [clinics, setClinics] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [dlg, setDlg] = useState(false);
    const [_editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ employeeId: '', clinicSupplierId: '', examType: 'periodico', observations: '' });
    const [selExams, setSelExams] = useState<Set<string>>(new Set());

    const [detailDlg, setDetailDlg] = useState(false);
    const [detail, setDetail] = useState<any>(null);

    const [statusDlg, setStatusDlg] = useState(false);
    const [statusId, setStatusId] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [budgetVal, setBudgetVal] = useState('');
    const [schedDate, setSchedDate] = useState('');

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            setLoading(true);
            const [refs, emps, cls, exs] = await Promise.all([
                api.getExamReferrals().catch(() => []),
                api.getEmployees().catch(() => []),
                api.getClinicSuppliers().catch(() => []),
                api.getOccupationalExams().catch(() => []),
            ]);
            setReferrals(refs); setEmployees(emps); setClinics(cls); setExams(exs);
        } finally { setLoading(false); }
    }

    function openCreate() {
        setEditing(null);
        setForm({ employeeId: '', clinicSupplierId: '', examType: 'periodico', observations: '' });
        setSelExams(new Set());
        setDlg(true);
    }

    async function handleSave() {
        if (!form.employeeId) { toast.error('Selecione o colaborador'); return; }
        if (selExams.size === 0) { toast.error('Selecione pelo menos um exame'); return; }
        try {
            const items = Array.from(selExams).map(examId => {
                const exam = exams.find(e => e.id === examId);
                return { examId, examName: exam?.name || '', examGroup: exam?.group || 'laboratorial', selected: true };
            });
            await api.createExamReferral({ ...form, items });
            toast.success('Guia criada');
            setDlg(false); load();
        } catch { toast.error('Erro ao criar guia'); }
    }

    function openDetail(r: any) { setDetail(r); setDetailDlg(true); }

    function openStatusUpdate(r: any) {
        setStatusId(r.id); setNewStatus(r.status);
        setBudgetVal(r.budgetValue?.toString() || ''); setSchedDate(r.scheduledDate?.split('T')[0] || '');
        setStatusDlg(true);
    }

    async function saveStatus() {
        try {
            const data: any = { status: newStatus };
            if (newStatus === 'sent') data.sentAt = new Date().toISOString();
            if (newStatus === 'budget_received' && budgetVal) { data.budgetValue = parseFloat(budgetVal); data.budgetReceivedAt = new Date().toISOString(); }
            if (newStatus === 'scheduled' && schedDate) data.scheduledDate = schedDate;
            if (newStatus === 'completed') data.completedAt = new Date().toISOString();
            await api.updateExamReferral(statusId, data);
            toast.success('Status atualizado'); setStatusDlg(false); load();
        } catch { toast.error('Erro'); }
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir guia?')) return;
        try { await api.deleteExamReferral(id); toast.success('Removida'); load(); } catch { toast.error('Erro'); }
    }

    const filtered = referrals.filter(r => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (search) {
            const empName = r.employee?.name || '';
            const num = r.referralNumber || '';
            if (!empName.toLowerCase().includes(search.toLowerCase()) && !num.toLowerCase().includes(search.toLowerCase())) return false;
        }
        return true;
    });

    const stats = { total: referrals.length, draft: referrals.filter(r => r.status === 'draft').length, sent: referrals.filter(r => r.status === 'sent').length, completed: referrals.filter(r => r.status === 'completed').length };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6" /> Guias de Encaminhamento</h1><p className="text-muted-foreground">Encaminhamento para exames ocupacionais</p></div>
                <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nova Guia</Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
                <Card className="border-l-4 border-l-gray-400"><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Rascunho</p><p className="text-2xl font-bold">{stats.draft}</p></CardContent></Card>
                <Card className="border-l-4 border-l-blue-500"><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Enviadas</p><p className="text-2xl font-bold text-blue-600">{stats.sent}</p></CardContent></Card>
                <Card className="border-l-4 border-l-green-500"><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Concluídas</p><p className="text-2xl font-bold text-green-600">{stats.completed}</p></CardContent></Card>
            </div>

            <div className="flex gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por funcionário ou nº..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{Object.entries(ST).map(([k, v]) => <SelectItem key={k} value={k}>{v.l}</SelectItem>)}</SelectContent></Select>
            </div>

            <div className="space-y-3">
                {filtered.map(r => { const s = ST[r.status] || ST.draft; return (
                    <Card key={r.id}>
                        <CardContent className="pt-4 pb-4 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2"><h3 className="font-semibold">{r.referralNumber}</h3><Badge className={s.c}>{s.l}</Badge><Badge variant="outline">{ET[r.examType] || r.examType}</Badge></div>
                                <p className="text-sm text-muted-foreground mt-1">{r.employee?.name || '—'} • {r.jobFunction || '—'} • {(r.items || []).length} exames{r.clinicSupplier && ` • ${r.clinicSupplier.name}`}</p>
                                <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('pt-BR')}{r.budgetValue != null && ` • R$ ${Number(r.budgetValue).toFixed(2)}`}{r.scheduledDate && ` • Agendado: ${new Date(r.scheduledDate).toLocaleDateString('pt-BR')}`}</p>
                            </div>
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => openDetail(r)} title="Ver detalhes"><Eye className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => openStatusUpdate(r)} title="Atualizar status"><Send className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ); })}
                {!filtered.length && <p className="text-center text-muted-foreground py-8">Nenhuma guia encontrada</p>}
            </div>

            {/* Create Dialog */}
            <Dialog open={dlg} onOpenChange={setDlg}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Guia de Encaminhamento</DialogTitle></DialogHeader><div className="space-y-4">
                <div><Label>Colaborador *</Label><Select value={form.employeeId} onValueChange={v => setForm({...form, employeeId: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} {e.jobFunction ? `(${e.jobFunction})` : ''}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Clínica</Label><Select value={form.clinicSupplierId} onValueChange={v => setForm({...form, clinicSupplierId: v})}><SelectTrigger><SelectValue placeholder="Selecione uma clínica" /></SelectTrigger><SelectContent>{clinics.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}<SelectItem value="">Nenhuma</SelectItem></SelectContent></Select></div>
                <div><Label>Tipo</Label><Select value={form.examType} onValueChange={v => setForm({...form, examType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ET).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Observações</Label><Textarea value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} rows={2} /></div>
                <div><Label className="text-base font-semibold">Selecionar Exames</Label>
                    {['laboratorial','complementar','clinico'].map(g => { const ge = exams.filter(e => e.group === g); if (!ge.length) return null; return (
                        <div key={g} className="mt-3"><p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{g==='laboratorial'?'Laboratoriais':g==='complementar'?'Complementares':'Clínicos'}</p>
                        <div className="grid grid-cols-2 gap-2">{ge.map(e => (
                            <label key={e.id} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 cursor-pointer">
                                <Checkbox checked={selExams.has(e.id)} onCheckedChange={c => { const n = new Set(selExams); c ? n.add(e.id) : n.delete(e.id); setSelExams(n); }} />
                                <span className="text-sm">{e.name}</span>
                            </label>
                        ))}</div></div>); })}
                </div>
            </div><DialogFooter><Button variant="outline" onClick={() => setDlg(false)}>Cancelar</Button><Button onClick={handleSave}>Criar Guia</Button></DialogFooter></DialogContent></Dialog>

            {/* Detail Dialog */}
            <Dialog open={detailDlg} onOpenChange={setDetailDlg}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Guia {detail?.referralNumber}</DialogTitle></DialogHeader>{detail && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-muted-foreground">Colaborador</p><p className="font-medium">{detail.employee?.name}</p></div><div><p className="text-xs text-muted-foreground">Função</p><p className="font-medium">{detail.jobFunction || '—'}</p></div></div>
                    <div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-muted-foreground">Tipo</p><p>{ET[detail.examType]}</p></div><div><p className="text-xs text-muted-foreground">Status</p><Badge className={ST[detail.status]?.c}>{ST[detail.status]?.l}</Badge></div></div>
                    {detail.clinicSupplier && <div><p className="text-xs text-muted-foreground">Clínica</p><p>{detail.clinicSupplier.name}</p></div>}
                    {(detail.risks||[]).length > 0 && <div><p className="text-xs text-muted-foreground">Riscos</p><div className="flex flex-wrap gap-1">{detail.risks.map((r: any, i: number) => <Badge key={i} variant="outline">{r.agent}</Badge>)}</div></div>}
                    <div><p className="text-xs text-muted-foreground font-semibold mb-2">EXAMES ({(detail.items||[]).length})</p>{(detail.items||[]).map((it: any) => <div key={it.id} className="py-1 border-b last:border-0"><p className="text-sm">{it.examName} <Badge variant="secondary" className="ml-2 text-xs">{it.examGroup}</Badge>{it.isRenewal && <Badge className="ml-1 bg-yellow-100 text-yellow-700 text-xs">Renovação</Badge>}</p></div>)}</div>
                    {detail.observations && <div><p className="text-xs text-muted-foreground">Observações</p><p className="text-sm">{detail.observations}</p></div>}
                </div>
            )}</DialogContent></Dialog>

            {/* Status Update Dialog */}
            <Dialog open={statusDlg} onOpenChange={setStatusDlg}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Atualizar Status</DialogTitle></DialogHeader><div className="space-y-3">
                <div><Label>Novo Status</Label><Select value={newStatus} onValueChange={setNewStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ST).map(([k,v]) => <SelectItem key={k} value={k}>{v.l}</SelectItem>)}</SelectContent></Select></div>
                {newStatus === 'budget_received' && <div><Label>Valor do Orçamento (R$)</Label><Input type="number" value={budgetVal} onChange={e => setBudgetVal(e.target.value)} step="0.01" /></div>}
                {newStatus === 'scheduled' && <div><Label>Data Agendada</Label><Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} /></div>}
            </div><DialogFooter><Button variant="outline" onClick={() => setStatusDlg(false)}>Cancelar</Button><Button onClick={saveStatus}>Salvar</Button></DialogFooter></DialogContent></Dialog>
        </div>
    );
}
