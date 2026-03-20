import { useState, useEffect } from 'react';
import { api } from '../../api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Building2, FileText, Plus, Pencil, Trash2, Search, AlertTriangle,
    CheckCircle2, Clock, XCircle, Loader2,
} from 'lucide-react';

const DOC_GROUPS: Record<string, string> = {
    identity: 'Identidade / Cadastro',
    legal: 'Jurídico / Contratual',
    licensing: 'Licenças / Alvarás',
    fiscal: 'Fiscal / Tributário',
    certification: 'Certificações',
    safety_program: 'Programas de Segurança',
    other: 'Outros',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    valid: { label: 'Válido', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    expiring: { label: 'Vencendo', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    expired: { label: 'Vencido', color: 'bg-red-100 text-red-700', icon: XCircle },
    pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-600', icon: AlertTriangle },
};

export default function CompanyDocuments() {
    const [docs, setDocs] = useState<any[]>([]);
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({
        name: '', documentGroup: 'identity', description: '', issueDate: '', expiryDate: '',
        responsibleName: '', registrationNumber: '', observations: '', fileUrl: '',
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setLoading(true);
            const companies = await api.getCompanies().catch(() => []);
            const comp = companies?.[0] || null;
            setCompany(comp);
            if (comp?.id) {
                const documents = await api.getCompanyDocuments(comp.id);
                setDocs(documents);
            }
        } catch { toast.error('Erro ao carregar documentos'); }
        finally { setLoading(false); }
    }

    function openCreate() {
        setEditing(null);
        setForm({ name: '', documentGroup: 'identity', description: '', issueDate: '', expiryDate: '', responsibleName: '', registrationNumber: '', observations: '', fileUrl: '' });
        setDialogOpen(true);
    }

    function openEdit(doc: any) {
        setEditing(doc);
        setForm({
            name: doc.name || '', documentGroup: doc.documentGroup || 'other',
            description: doc.description || '', issueDate: doc.issueDate?.split('T')[0] || '',
            expiryDate: doc.expiryDate?.split('T')[0] || '', responsibleName: doc.responsibleName || '',
            registrationNumber: doc.registrationNumber || '', observations: doc.observations || '',
            fileUrl: doc.fileUrl || '',
        });
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
        if (!company?.id) { toast.error('Empresa não configurada'); return; }
        try {
            if (editing) {
                await api.updateCompanyDocument(editing.id, form);
                toast.success('Documento atualizado');
            } else {
                await api.createCompanyDocument(company.id, form);
                toast.success('Documento criado');
            }
            setDialogOpen(false);
            loadData();
        } catch { toast.error('Erro ao salvar'); }
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir este documento?')) return;
        try {
            await api.deleteCompanyDocument(id);
            toast.success('Removido');
            loadData();
        } catch { toast.error('Erro ao excluir'); }
    }

    const filtered = docs.filter(d => {
        if (groupFilter !== 'all' && d.documentGroup !== groupFilter) return false;
        if (searchTerm && !d.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const grouped = Object.keys(DOC_GROUPS).reduce((acc, g) => {
        acc[g] = filtered.filter(d => d.documentGroup === g);
        return acc;
    }, {} as Record<string, any[]>);

    const stats = {
        total: docs.length,
        valid: docs.filter(d => d.status === 'valid').length,
        expiring: docs.filter(d => d.status === 'expiring').length,
        expired: docs.filter(d => d.status === 'expired').length,
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" /> Documentos da Empresa</h1>
                    <p className="text-muted-foreground">{company?.tradeName || company?.name || 'Empresa'}</p>
                </div>
                <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo Documento</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
                <Card className="border-l-4 border-l-green-500"><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Válidos</p><p className="text-2xl font-bold text-green-600">{stats.valid}</p></CardContent></Card>
                <Card className="border-l-4 border-l-yellow-500"><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Vencendo</p><p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p></CardContent></Card>
                <Card className="border-l-4 border-l-red-500"><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Vencidos</p><p className="text-2xl font-bold text-red-600">{stats.expired}</p></CardContent></Card>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" /></div>
                <Select value={groupFilter} onValueChange={setGroupFilter}><SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Grupos</SelectItem>{Object.entries(DOC_GROUPS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
            </div>

            {/* Docs by group */}
            {Object.entries(grouped).map(([group, items]) => {
                if (!items.length) return null;
                return (
                    <Card key={group}>
                        <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">{DOC_GROUPS[group]} <Badge variant="secondary" className="ml-2">{items.length}</Badge></CardTitle></CardHeader>
                        <CardContent className="divide-y">
                            {items.map((doc: any) => {
                                const st = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
                                const StIcon = st.icon;
                                return (
                                    <div key={doc.id} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{doc.name}</p>
                                                {doc.expiryDate && <p className="text-xs text-muted-foreground">Vencimento: {new Date(doc.expiryDate).toLocaleDateString('pt-BR')}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={st.color}><StIcon className="h-3 w-3 mr-1" />{st.label}</Badge>
                                            <Button size="icon" variant="ghost" onClick={() => openEdit(doc)}><Pencil className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                );
            })}

            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum documento cadastrado</p>}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editing ? 'Editar Documento' : 'Novo Documento'}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Alvará de Funcionamento" /></div>
                        <div><Label>Grupo</Label><Select value={form.documentGroup} onValueChange={v => setForm({ ...form, documentGroup: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(DOC_GROUPS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Data Emissão</Label><Input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} /></div>
                            <div><Label>Vencimento</Label><Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Responsável</Label><Input value={form.responsibleName} onChange={e => setForm({ ...form, responsibleName: e.target.value })} /></div>
                            <div><Label>Nº Registro</Label><Input value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} placeholder="CREA, CRM..." /></div>
                        </div>
                        <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                        <div><Label>Observações</Label><Textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} rows={2} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Salvar</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
