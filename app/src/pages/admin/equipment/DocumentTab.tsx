import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, FileText, Pencil, Trash2, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { fD } from './EquipmentTypes';

interface Props {
  documents: any[];
  equipment: any[];
  reload: () => void;
}

const DOC_CAT: Record<string, string> = {
  crlv: 'CRLV', seguro: 'Seguro', art: 'ART', inspecao: 'Inspeção',
  manual: 'Manual', certificado: 'Certificado', laudo: 'Laudo Técnico',
  nota_fiscal: 'Nota Fiscal', contrato: 'Contrato', outro: 'Outro',
};

const DOC_STATUS: Record<string, { l: string; c: string }> = {
  active: { l: 'Ativo', c: 'bg-green-100 text-green-800' },
  expired: { l: 'Vencido', c: 'bg-red-100 text-red-800' },
  archived: { l: 'Arquivado', c: 'bg-gray-100 text-gray-600' },
};

const defaultForm: Record<string, any> = {
  equipmentId: '', name: '', category: 'crlv', fileUrl: '',
  fileName: '', expiresAt: '', notes: '',
};

export default function DocumentTab({ documents, equipment, reload }: Props) {
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({ ...defaultForm });
  const [uploading, setUploading] = useState(false);

  const F = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }));

  function openNew() { setForm({ ...defaultForm }); setEditId(null); setDlgOpen(true); }

  function openEdit(doc: any) {
    setEditId(doc.id);
    setForm({
      equipmentId: doc.equipmentId || '', name: doc.name || '',
      category: doc.category || 'outro', fileUrl: doc.fileUrl || '',
      fileName: doc.fileName || '',
      expiresAt: doc.expiresAt ? String(doc.expiresAt).substring(0, 10) : '',
      notes: doc.notes || '',
    });
    setDlgOpen(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Convert to base64 data URL for storage
      const reader = new FileReader();
      reader.onload = () => {
        F('fileUrl', reader.result as string);
        F('fileName', file.name);
        toast.success('Arquivo carregado!');
        setUploading(false);
      };
      reader.onerror = () => { toast.error('Erro ao ler arquivo'); setUploading(false); };
      reader.readAsDataURL(file);
    } catch { toast.error('Erro ao carregar arquivo'); setUploading(false); }
  }

  async function save() {
    if (!form.equipmentId || !form.name) { toast.error('Equipamento e nome são obrigatórios'); return; }
    try {
      if (editId) {
        await api.updateEquipmentDocument(editId, form);
        toast.success('Documento atualizado!');
      } else {
        await api.createEquipmentDocument(form);
        toast.success('Documento adicionado!');
      }
      setDlgOpen(false); setEditId(null); reload();
    } catch { toast.error('Erro ao salvar'); }
  }

  async function remove(id: string) {
    if (!confirm('Excluir este documento?')) return;
    try { await api.deleteEquipmentDocument(id); toast.success('Documento excluído'); reload(); }
    catch { toast.error('Erro ao excluir'); }
  }

  // Group by equipment
  const grouped = equipment.map((eq: any) => ({
    equipment: eq,
    docs: documents.filter((d: any) => d.equipmentId === eq.id),
  })).filter(g => g.docs.length > 0);

  const unlinked = documents.filter((d: any) => !equipment.find((e: any) => e.id === d.equipmentId));

  // Check expiring docs
  const now = new Date();
  const expiringCount = documents.filter((d: any) => {
    if (!d.expiresAt) return false;
    const exp = new Date(d.expiresAt);
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  }).length;
  const expiredCount = documents.filter((d: any) => d.expiresAt && new Date(d.expiresAt) < now).length;

  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{documents.length} documento(s)</p>
          {expiredCount > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />{expiredCount} vencido(s)
            </Badge>
          )}
          {expiringCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />{expiringCount} vence(m) em 30 dias
            </Badge>
          )}
        </div>
        <Button onClick={openNew} className="bg-sky-600 hover:bg-sky-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />Novo Documento
        </Button>
      </div>

      {grouped.map(({ equipment: eq, docs }) => (
        <Card key={eq.id} className="overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b">
            <span className="font-semibold text-sm">{eq.name}</span>
            <span className="text-xs text-slate-400 ml-2">({eq.code})</span>
          </div>
          <div className="divide-y">
            {docs.map((doc: any) => {
              const isExpired = doc.expiresAt && new Date(doc.expiresAt) < now;
              const isExpiring = doc.expiresAt && !isExpired && ((new Date(doc.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 30;
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                  <FileText className={`h-5 w-5 shrink-0 ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-sky-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{doc.name}</span>
                      <Badge variant="outline" className="text-[10px]">{DOC_CAT[doc.category] || doc.category}</Badge>
                      <Badge className={DOC_STATUS[isExpired ? 'expired' : doc.status]?.c || ''}>{DOC_STATUS[isExpired ? 'expired' : doc.status]?.l || doc.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {doc.fileName && <span>{doc.fileName}</span>}
                      {doc.expiresAt && <span className={isExpired ? 'text-red-500 font-medium' : isExpiring ? 'text-amber-500' : ''}>Vence: {fD(doc.expiresAt)}</span>}
                    </div>
                    {doc.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {doc.fileUrl && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(doc.fileUrl, '_blank')} title="Visualizar/Download">
                        <Download className="h-3.5 w-3.5 text-sky-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(doc)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => remove(doc.id)} title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {unlinked.length > 0 && (
        <Card>
          <div className="bg-slate-50 px-5 py-3 border-b"><span className="font-semibold text-sm text-slate-500">Sem equipamento vinculado</span></div>
          {unlinked.map((doc: any) => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-3">
              <FileText className="h-5 w-5 text-slate-400" />
              <span className="text-sm flex-1">{doc.name}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(doc)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => remove(doc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {documents.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="h-14 w-14 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">Nenhum documento cadastrado</p>
          <p className="text-sm text-slate-400 mt-1">CRLV, seguros, ARTs, laudos, certificados e outros</p>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dlgOpen} onOpenChange={v => { if (!v) { setDlgOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Documento</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Equipamento *</Label>
              <Select value={form.equipmentId} onValueChange={v => F('equipmentId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.code} - {e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nome do Documento *</Label><Input value={form.name} onChange={e => F('name', e.target.value)} placeholder="Ex: CRLV 2024, Seguro Allianz..." /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => F('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_CAT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <span className="text-xs text-slate-400">Enviando...</span>}
              </div>
              {form.fileName && <p className="text-xs text-slate-500 mt-1">📎 {form.fileName}</p>}
              {!form.fileUrl && (
                <div className="mt-2">
                  <Label className="text-xs text-slate-400">Ou cole a URL do arquivo:</Label>
                  <Input value={form.fileUrl} onChange={e => F('fileUrl', e.target.value)} placeholder="https://..." className="mt-1" />
                </div>
              )}
            </div>
            <div><Label>Data de Vencimento</Label><Input type="date" value={form.expiresAt} onChange={e => F('expiresAt', e.target.value)} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => F('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDlgOpen(false); setEditId(null); }}>Cancelar</Button>
            <Button onClick={save} className="bg-sky-600 hover:bg-sky-700 text-white">{editId ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
