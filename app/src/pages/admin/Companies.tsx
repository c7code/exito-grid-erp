import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2, Plus, Pencil, Trash2, Upload, Star, Image as ImageIcon,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const emptyCompany = {
  name: '', tradeName: '', cnpj: '', stateRegistration: '',
  phone: '', email: '', website: '',
  cep: '', address: '', neighborhood: '', city: '', state: '',
  primaryColor: '#1a1a2e', secondaryColor: '#2563eb', accentColor: '#d4a017',
  isPrimary: false, notes: '',
};

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...emptyCompany });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCompanies();
      setCompanies(data);
    } catch { toast.error('Erro ao carregar empresas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (company?: any) => {
    if (company) {
      setEditing(company);
      setForm({ ...emptyCompany, ...company });
    } else {
      setEditing(null);
      setForm({ ...emptyCompany, isPrimary: companies.length === 0 });
    }
    setDialogOpen(true);
  };

  const handleCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    setForm((f: any) => ({ ...f, cep: clean }));
    if (clean.length === 8) {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await r.json();
        if (!data.erro) {
          setForm((f: any) => ({
            ...f, cep: clean,
            address: data.logradouro || f.address,
            neighborhood: data.bairro || f.neighborhood,
            city: data.localidade || f.city,
            state: data.uf || f.state,
          }));
          toast.success('Endereço preenchido via CEP!');
        }
      } catch { /* ignore */ }
    }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.updateCompany(editing.id, form);
        toast.success('Empresa atualizada!');
      } else {
        await api.createCompany(form);
        toast.success('Empresa cadastrada!');
      }
      setDialogOpen(false);
      load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta empresa?')) return;
    try {
      await api.deleteCompany(id);
      toast.success('Empresa excluída');
      load();
    } catch { toast.error('Erro ao excluir'); }
  };

  const handleLogoUpload = async (companyId: string, file: File) => {
    try {
      await api.uploadCompanyLogo(companyId, file);
      toast.success('Logo atualizado!');
      load();
    } catch { toast.error('Erro ao enviar logo'); }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await api.updateCompany(id, { isPrimary: true });
      toast.success('Empresa definida como principal!');
      load();
    } catch { toast.error('Erro ao atualizar'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-500" /> Empresas
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cadastre sua empresa matriz e empresas secundárias com identidade visual</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
          <Plus className="w-4 h-4 mr-2" /> Nova Empresa
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando...</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma empresa cadastrada</p>
          <p className="text-sm mt-1">Cadastre sua empresa para usar a logo e identidade visual nas propostas</p>
          <Button className="mt-4" onClick={() => handleOpen()}>
            <Plus className="w-4 h-4 mr-2" /> Cadastrar Empresa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((c: any) => (
            <div key={c.id} className={`relative rounded-xl border-2 p-5 space-y-3 transition-all ${
              c.isPrimary ? 'border-amber-400 bg-amber-50/30 shadow-md' : 'border-slate-200 bg-white hover:shadow-sm'
            }`}>
              {c.isPrimary && (
                <Badge className="absolute -top-2.5 left-4 bg-amber-500 text-white text-[10px]">
                  <Star className="w-3 h-3 mr-1 fill-white" /> EMPRESA PRINCIPAL
                </Badge>
              )}

              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="relative group">
                  <div className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center overflow-hidden ${
                    c.isPrimary ? 'border-amber-300 bg-amber-100' : 'border-slate-200 bg-slate-100'
                  }`}>
                    {c.logoUrl ? (
                      <img src={`${API_BASE}${c.logoUrl}`} alt={c.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      if (e.target.files?.[0]) handleLogoUpload(c.id, e.target.files[0]);
                    }} />
                  </label>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{c.tradeName || c.name}</h3>
                  {c.tradeName && <p className="text-xs text-slate-500 truncate">{c.name}</p>}
                  {c.cnpj && <p className="text-xs text-slate-400 font-mono mt-0.5">{c.cnpj}</p>}
                  {c.phone && <p className="text-xs text-slate-500 mt-0.5">{c.phone} {c.email && `• ${c.email}`}</p>}
                  {c.city && <p className="text-xs text-slate-400 mt-0.5">{c.address && `${c.address}, `}{c.neighborhood && `${c.neighborhood} - `}{c.city}/{c.state}</p>}
                </div>

                {/* Colors */}
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded border" style={{ backgroundColor: c.primaryColor || '#1a1a2e' }} title="Cor Principal" />
                    <div className="w-6 h-6 rounded border" style={{ backgroundColor: c.secondaryColor || '#2563eb' }} title="Cor Secundária" />
                    <div className="w-6 h-6 rounded border" style={{ backgroundColor: c.accentColor || '#d4a017' }} title="Cor de Destaque" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => handleOpen(c)}>
                  <Pencil className="w-3 h-3 mr-1" /> Editar
                </Button>
                {!c.isPrimary && (
                  <Button variant="outline" size="sm" onClick={() => handleSetPrimary(c.id)}>
                    <Star className="w-3 h-3 mr-1" /> Definir como Principal
                  </Button>
                )}
                {!c.isPrimary && (
                  <Button variant="ghost" size="sm" className="text-red-500 ml-auto" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Excluir
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Identidade */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Dados da Empresa</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Razão Social *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Nome Fantasia</Label><Input value={form.tradeName} onChange={e => setForm({ ...form, tradeName: e.target.value })} /></div>
                <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></div>
                <div><Label>Inscrição Estadual</Label><Input value={form.stateRegistration} onChange={e => setForm({ ...form, stateRegistration: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="col-span-2"><Label>Website</Label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://" /></div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Endereço</p>
              <div className="grid grid-cols-4 gap-3">
                <div><Label>CEP</Label><Input value={form.cep} onChange={e => handleCep(e.target.value)} placeholder="00000-000" maxLength={9} /></div>
                <div className="col-span-2"><Label>Endereço</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Bairro</Label><Input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></div>
                <div><Label>Cidade</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>UF</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} /></div>
              </div>
            </div>

            {/* Identidade Visual */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Identidade Visual (para propostas)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Cor Principal</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <Input value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="font-mono text-xs" />
                  </div>
                </div>
                <div>
                  <Label>Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <Input value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="font-mono text-xs" />
                  </div>
                </div>
                <div>
                  <Label>Cor de Destaque</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.accentColor} onChange={e => setForm({ ...form, accentColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <Input value={form.accentColor} onChange={e => setForm({ ...form, accentColor: e.target.value })} className="font-mono text-xs" />
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}>
                <div className="w-10 h-10 rounded-lg border-2 flex items-center justify-center" style={{ borderColor: form.accentColor, background: 'white' }}>
                  <Building2 className="w-5 h-5" style={{ color: form.primaryColor }} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{form.tradeName || form.name || 'Sua Empresa'}</p>
                  <p className="text-[10px] text-white/70">Preview da identidade visual na proposta</p>
                </div>
                <div className="ml-auto px-3 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: form.accentColor, color: form.primaryColor }}>
                  DESTAQUE
                </div>
              </div>
            </div>

            {/* Tipo */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPrimary} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} className="rounded" />
                <span className="text-sm font-medium">Empresa Principal (Matriz)</span>
              </label>
              <p className="text-xs text-slate-400">A empresa principal é usada como padrão nas propostas</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              {editing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
