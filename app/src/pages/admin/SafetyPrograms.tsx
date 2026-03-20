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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Loader2, FileText, Users, Stethoscope, Database, Upload, Download } from 'lucide-react';

const PT: Record<string, { l: string; n: string }> = {
    pgr: { l: 'PGR - Gerenciamento de Riscos', n: 'NR-1' },
    pcmso: { l: 'PCMSO - Controle Médico', n: 'NR-7' },
    ltcat: { l: 'LTCAT - Condições Ambientais', n: 'CLT 58' },
    ppp: { l: 'PPP - Perfil Profissiográfico', n: 'IN128' },
    aet: { l: 'AET - Análise Ergonômica', n: 'NR-17' },
    apr: { l: 'APR - Análise Preliminar', n: 'NR-1' },
    cipa: { l: 'CIPA', n: 'NR-5' },
    os_seg: { l: 'Ordem de Serviço Seg.', n: 'NR-1' },
    outro: { l: 'Outro (personalizado)', n: '' },
};
const SC: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700', expired: 'bg-red-100 text-red-700', reviewing: 'bg-yellow-100 text-yellow-700' };

export default function SafetyPrograms() {
    const [tab, setTab] = useState('programs');
    const [programs, setPrograms] = useState<any[]>([]);
    const [riskGroups, setRiskGroups] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [progDlg, setProgDlg] = useState(false);
    const [editProg, setEditProg] = useState<any>(null);
    const [pf, setPf] = useState({ programType: 'pgr', name: '', nrReference: '', responsibleName: '', responsibleRegistration: '', validFrom: '', validUntil: '', status: 'draft', observations: '' });
    const [rgDlg, setRgDlg] = useState(false);
    const [editRg, setEditRg] = useState<any>(null);
    const [rf, setRf] = useState({ name: '', code: '', programId: '', jobFunctions: '', risks: '[]', examFrequencyMonths: '12' });
    const [examDlg, setExamDlg] = useState(false);
    const [editEx, setEditEx] = useState<any>(null);
    const [ef, setEf] = useState({ name: '', code: '', group: 'laboratorial', validityMonths: '12', description: '' });
    const [linkDlg, setLinkDlg] = useState<{ open: boolean; rgId?: string }>({ open: false });
    const [linkId, setLinkId] = useState('');
    const [expRg, setExpRg] = useState<Set<string>>(new Set());
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);

    useEffect(() => { load(); }, []);
    async function load() {
        try { setLoading(true); const [p, r, e] = await Promise.all([api.getSafetyPrograms().catch(() => []), api.getRiskGroups().catch(() => []), api.getOccupationalExams().catch(() => [])]); setPrograms(p); setRiskGroups(r); setExams(e); } finally { setLoading(false); }
    }
    function newProg() { setEditProg(null); setPf({ programType: 'pgr', name: '', nrReference: 'NR-1', responsibleName: '', responsibleRegistration: '', validFrom: '', validUntil: '', status: 'draft', observations: '' }); setFileToUpload(null); setProgDlg(true); }
    function editP(p: any) {
        const knownType = PT[p.programType] ? p.programType : 'outro';
        setEditProg(p);
        setPf({ programType: knownType, name: p.name, nrReference: p.nrReference || '', responsibleName: p.responsibleName || '', responsibleRegistration: p.responsibleRegistration || '', validFrom: p.validFrom?.split('T')[0] || '', validUntil: p.validUntil?.split('T')[0] || '', status: p.status, observations: p.observations || '' });
        setFileToUpload(null); setProgDlg(true);
    }
    async function saveP() {
        if (!pf.name.trim()) { toast.error('Nome obrigatório'); return; }
        try {
            const payload = { ...pf };
            // Se tipo 'outro', o programType fica como a nrReference digitada ou 'outro'
            if (pf.programType === 'outro' && pf.nrReference) {
                payload.programType = pf.nrReference.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            }
            const saved = editProg ? await api.updateSafetyProgram(editProg.id, payload) : await api.createSafetyProgram(payload);
            // Upload do arquivo se selecionado
            if (fileToUpload && saved?.id) {
                await api.uploadSafetyProgramFile(saved.id, fileToUpload);
            }
            toast.success('Salvo'); setProgDlg(false); setFileToUpload(null); load();
        } catch { toast.error('Erro'); }
    }
    async function delP(id: string) { if (!confirm('Excluir?')) return; try { await api.deleteSafetyProgram(id); toast.success('Removido'); load(); } catch { toast.error('Erro'); } }
    function newRg() { setEditRg(null); setRf({ name: '', code: '', programId: programs[0]?.id || '', jobFunctions: '', risks: '[]', examFrequencyMonths: '12' }); setRgDlg(true); }
    function editR(rg: any) { setEditRg(rg); setRf({ name: rg.name, code: rg.code || '', programId: rg.programId || '', jobFunctions: (rg.jobFunctions || []).join(', '), risks: JSON.stringify(rg.risks || [], null, 2), examFrequencyMonths: String(rg.examFrequencyMonths || 12) }); setRgDlg(true); }
    async function saveR() { if (!rf.name.trim()) { toast.error('Nome obrigatório'); return; } try { const d = { ...rf, jobFunctions: rf.jobFunctions.split(',').map(s => s.trim()).filter(Boolean), risks: JSON.parse(rf.risks || '[]'), examFrequencyMonths: parseInt(rf.examFrequencyMonths) || 12 }; editRg ? await api.updateRiskGroup(editRg.id, d) : await api.createRiskGroup(d); toast.success('Salvo'); setRgDlg(false); load(); } catch { toast.error('Erro'); } }
    async function delR(id: string) { if (!confirm('Excluir?')) return; try { await api.deleteRiskGroup(id); load(); } catch { toast.error('Erro'); } }
    function newEx() { setEditEx(null); setEf({ name: '', code: '', group: 'laboratorial', validityMonths: '12', description: '' }); setExamDlg(true); }
    function editE(e: any) { setEditEx(e); setEf({ name: e.name, code: e.code, group: e.group, validityMonths: String(e.validityMonths ?? ''), description: e.description || '' }); setExamDlg(true); }
    async function saveE() { if (!ef.name.trim() || !ef.code.trim()) { toast.error('Nome e código obrigatórios'); return; } try { const d = { ...ef, validityMonths: ef.validityMonths ? parseInt(ef.validityMonths) : null }; editEx ? await api.updateOccupationalExam(editEx.id, d) : await api.createOccupationalExam(d); toast.success('Salvo'); setExamDlg(false); load(); } catch { toast.error('Erro'); } }
    async function delE(id: string) { if (!confirm('Excluir?')) return; try { await api.deleteOccupationalExam(id); load(); } catch { toast.error('Erro'); } }
    async function seed() { try { const r = await api.seedOccupationalExams(); toast.success(`Criados: ${r.created}, já existiam: ${r.skipped}`); load(); } catch { toast.error('Erro'); } }
    async function linkExam() { if (!linkDlg.rgId || !linkId) return; try { await api.addExamToRiskGroup(linkDlg.rgId, { examId: linkId }); toast.success('Vinculado'); setLinkDlg({ open: false }); setLinkId(''); load(); } catch { toast.error('Erro'); } }
    async function unlinkExam(id: string) { try { await api.removeExamFromRiskGroup(id); load(); } catch { toast.error('Erro'); } }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> Programas de Segurança</h1><p className="text-muted-foreground">PGR, PCMSO, LTCAT e Grupos de Risco (GHE)</p></div>
            <Tabs value={tab} onValueChange={setTab}>
                <TabsList><TabsTrigger value="programs"><FileText className="h-4 w-4 mr-1" />Programas</TabsTrigger><TabsTrigger value="riskGroups"><Users className="h-4 w-4 mr-1" />GHE</TabsTrigger><TabsTrigger value="exams"><Stethoscope className="h-4 w-4 mr-1" />Exames</TabsTrigger></TabsList>

                <TabsContent value="programs" className="space-y-4">
                    <div className="flex justify-end"><Button onClick={newProg}><Plus className="h-4 w-4 mr-2" />Novo</Button></div>
                    {programs.map(p => (<Card key={p.id}><CardContent className="pt-4 pb-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><h3 className="font-semibold">{p.name}</h3><Badge className={SC[p.status] || 'bg-gray-100'}>{p.status}</Badge><Badge variant="outline">{PT[p.programType]?.n || p.programType.toUpperCase()}</Badge>{p.fileUrl && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => window.open(api.getSafetyProgramFileUrl(p.id), '_blank')}><Download className="h-3 w-3" />{p.fileName || 'Arquivo'}</Badge>}</div><p className="text-sm text-muted-foreground mt-1">{PT[p.programType]?.l || p.programType.toUpperCase()}{p.responsibleName && ` • ${p.responsibleName}`}{p.validFrom && ` • ${new Date(p.validFrom).toLocaleDateString('pt-BR')}`}{p.validUntil && ` → ${new Date(p.validUntil).toLocaleDateString('pt-BR')}`}</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => editP(p)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => delP(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></CardContent></Card>))}
                    {!programs.length && <p className="text-center text-muted-foreground py-8">Nenhum programa</p>}
                </TabsContent>

                <TabsContent value="riskGroups" className="space-y-4">
                    <div className="flex justify-end"><Button onClick={newRg}><Plus className="h-4 w-4 mr-2" />Novo GHE</Button></div>
                    {riskGroups.map(rg => { const o = expRg.has(rg.id); return (
                        <Card key={rg.id}>
                            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => setExpRg(prev => { const n = new Set(prev); n.has(rg.id) ? n.delete(rg.id) : n.add(rg.id); return n; })}>
                                <div className="flex items-center gap-2">{o ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}<h3 className="font-semibold">{rg.code ? `${rg.code} — ` : ''}{rg.name}</h3><Badge variant="secondary">{(rg.exams||[]).length} exames</Badge></div>
                                <div className="flex gap-1" onClick={e => e.stopPropagation()}><Button size="sm" variant="outline" onClick={() => setLinkDlg({ open: true, rgId: rg.id })}><Plus className="h-3 w-3 mr-1" />Exame</Button><Button size="icon" variant="ghost" onClick={() => editR(rg)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => delR(rg.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                            </div>
                            {o && <CardContent className="border-t pt-3"><div className="grid grid-cols-2 gap-4 mb-3"><div><p className="text-xs text-muted-foreground font-semibold">FUNÇÕES</p><p className="text-sm">{(rg.jobFunctions||[]).join(', ')||'—'}</p></div><div><p className="text-xs text-muted-foreground font-semibold">RISCOS</p><div className="flex flex-wrap gap-1">{(rg.risks||[]).map((r: any, i: number) => <Badge key={i} variant="outline" className="text-xs">{r.agent}{r.nr ? ` (${r.nr})`:''}</Badge>)}{(!rg.risks||!rg.risks.length) && <span className="text-sm text-muted-foreground">—</span>}</div></div></div><p className="text-xs text-muted-foreground font-semibold mb-2">EXAMES VINCULADOS</p>{(rg.exams||[]).map((x: any) => <div key={x.id} className="flex items-center justify-between py-2 border-b last:border-0"><div><p className="text-sm font-medium">{x.exam?.name||'—'}</p><p className="text-xs text-muted-foreground">{x.requiredOnAdmission&&'✓Adm '}{x.requiredOnPeriodic&&'✓Per '}{x.requiredOnDismissal&&'✓Dem '}{x.requiredOnReturn&&'✓Ret '}</p></div><Button size="icon" variant="ghost" onClick={() => unlinkExam(x.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button></div>)}{!(rg.exams||[]).length && <p className="text-sm text-muted-foreground">Nenhum exame</p>}</CardContent>}
                        </Card>); })}
                    {!riskGroups.length && <p className="text-center text-muted-foreground py-8">Nenhum GHE</p>}
                </TabsContent>

                <TabsContent value="exams" className="space-y-4">
                    <div className="flex justify-end gap-2"><Button variant="outline" onClick={seed}><Database className="h-4 w-4 mr-2" />Popular Padrão</Button><Button onClick={newEx}><Plus className="h-4 w-4 mr-2" />Novo</Button></div>
                    {['laboratorial','complementar','clinico'].map(g => { const ge = exams.filter(e => e.group === g); if (!ge.length) return null; return (
                        <Card key={g}><CardHeader className="pb-2"><CardTitle className="text-sm uppercase">{g==='laboratorial'?'Laboratoriais':g==='complementar'?'Complementares':'Clínicos'} <Badge variant="secondary">{ge.length}</Badge></CardTitle></CardHeader><CardContent className="divide-y">{ge.map(e => <div key={e.id} className="flex items-center justify-between py-2"><div><p className="text-sm font-medium">{e.name}</p><p className="text-xs text-muted-foreground">{e.code} • {e.validityMonths ? `${e.validityMonths}m` : '∞'}</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => editE(e)}><Pencil className="h-3 w-3" /></Button><Button size="icon" variant="ghost" onClick={() => delE(e.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button></div></div>)}</CardContent></Card>); })}
                    {!exams.length && <p className="text-center text-muted-foreground py-8">Catálogo vazio. Use "Popular Padrão".</p>}
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <Dialog open={progDlg} onOpenChange={setProgDlg}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editProg ? 'Editar' : 'Novo'} Programa</DialogTitle></DialogHeader><div className="space-y-3">
                <div><Label>Tipo</Label><Select value={pf.programType} onValueChange={v => setPf({ ...pf, programType: v, nrReference: PT[v]?.n||pf.nrReference })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PT).map(([k,v]) => <SelectItem key={k} value={k}>{v.l}</SelectItem>)}</SelectContent></Select></div>
                {pf.programType === 'outro' && <div><Label>Sigla / NR de Referência *</Label><Input value={pf.nrReference} onChange={e => setPf({...pf,nrReference:e.target.value})} placeholder="Ex: NR-18, PCA, PPR..." /></div>}
                <div><Label>Nome *</Label><Input value={pf.name} onChange={e => setPf({...pf,name:e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3"><div><Label>Responsável</Label><Input value={pf.responsibleName} onChange={e => setPf({...pf,responsibleName:e.target.value})} /></div><div><Label>Registro</Label><Input value={pf.responsibleRegistration} onChange={e => setPf({...pf,responsibleRegistration:e.target.value})} /></div></div>
                <div className="grid grid-cols-2 gap-3"><div><Label>De</Label><Input type="date" value={pf.validFrom} onChange={e => setPf({...pf,validFrom:e.target.value})} /></div><div><Label>Até</Label><Input type="date" value={pf.validUntil} onChange={e => setPf({...pf,validUntil:e.target.value})} /></div></div>
                <div><Label>Status</Label><Select value={pf.status} onValueChange={v => setPf({...pf,status:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="active">Ativo</SelectItem><SelectItem value="reviewing">Em Revisão</SelectItem><SelectItem value="expired">Expirado</SelectItem></SelectContent></Select></div>
                <div><Label>Obs</Label><Textarea value={pf.observations} onChange={e => setPf({...pf,observations:e.target.value})} rows={2} /></div>
                <div className="border-t pt-3">
                    <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Documento (PDF, DOC, DOCX)</Label>
                    {editProg?.fileUrl && !fileToUpload && <p className="text-sm text-green-600 mt-1 flex items-center gap-1"><Download className="h-3 w-3" /> Arquivo atual: <span className="font-medium cursor-pointer underline" onClick={() => window.open(api.getSafetyProgramFileUrl(editProg.id), '_blank')}>{editProg.fileName || 'Ver arquivo'}</span></p>}
                    <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" className="mt-2" onChange={e => { const f = e.target.files?.[0]; if (f) setFileToUpload(f); }} />
                    {fileToUpload && <p className="text-xs text-blue-600 mt-1">📎 {fileToUpload.name} ({(fileToUpload.size / 1024).toFixed(0)} KB)</p>}
                </div>
            </div><DialogFooter><Button variant="outline" onClick={() => setProgDlg(false)}>Cancelar</Button><Button onClick={saveP}>Salvar</Button></DialogFooter></DialogContent></Dialog>

            <Dialog open={rgDlg} onOpenChange={setRgDlg}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editRg ? 'Editar' : 'Novo'} GHE</DialogTitle></DialogHeader><div className="space-y-3">
                <div className="grid grid-cols-2 gap-3"><div><Label>Código</Label><Input value={rf.code} onChange={e => setRf({...rf,code:e.target.value})} placeholder="GHE-01" /></div><div><Label>Nome *</Label><Input value={rf.name} onChange={e => setRf({...rf,name:e.target.value})} /></div></div>
                <div><Label>Programa</Label><Select value={rf.programId} onValueChange={v => setRf({...rf,programId:v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Funções (vírgula)</Label><Input value={rf.jobFunctions} onChange={e => setRf({...rf,jobFunctions:e.target.value})} placeholder="Eletricista, Técnico" /></div>
                <div><Label>Periodicidade (meses)</Label><Input type="number" value={rf.examFrequencyMonths} onChange={e => setRf({...rf,examFrequencyMonths:e.target.value})} /></div>
                <div><Label>Riscos (JSON)</Label><Textarea value={rf.risks} onChange={e => setRf({...rf,risks:e.target.value})} rows={3} placeholder='[{"type":"Físico","agent":"Altura","nr":"NR-35"}]' /></div>
            </div><DialogFooter><Button variant="outline" onClick={() => setRgDlg(false)}>Cancelar</Button><Button onClick={saveR}>Salvar</Button></DialogFooter></DialogContent></Dialog>

            <Dialog open={examDlg} onOpenChange={setExamDlg}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editEx ? 'Editar' : 'Novo'} Exame</DialogTitle></DialogHeader><div className="space-y-3">
                <div><Label>Nome *</Label><Input value={ef.name} onChange={e => setEf({...ef,name:e.target.value})} /></div>
                <div><Label>Código *</Label><Input value={ef.code} onChange={e => setEf({...ef,code:e.target.value.toUpperCase()})} /></div>
                <div><Label>Grupo</Label><Select value={ef.group} onValueChange={v => setEf({...ef,group:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="laboratorial">Laboratorial</SelectItem><SelectItem value="complementar">Complementar</SelectItem><SelectItem value="clinico">Clínico</SelectItem></SelectContent></Select></div>
                <div><Label>Validade (meses)</Label><Input type="number" value={ef.validityMonths} onChange={e => setEf({...ef,validityMonths:e.target.value})} /></div>
            </div><DialogFooter><Button variant="outline" onClick={() => setExamDlg(false)}>Cancelar</Button><Button onClick={saveE}>Salvar</Button></DialogFooter></DialogContent></Dialog>

            <Dialog open={linkDlg.open} onOpenChange={o => setLinkDlg({...linkDlg,open:o})}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Vincular Exame</DialogTitle></DialogHeader><div><Label>Exame</Label><Select value={linkId} onValueChange={setLinkId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.code})</SelectItem>)}</SelectContent></Select></div><DialogFooter><Button variant="outline" onClick={() => setLinkDlg({open:false})}>Cancelar</Button><Button onClick={linkExam} disabled={!linkId}>Vincular</Button></DialogFooter></DialogContent></Dialog>
        </div>
    );
}
