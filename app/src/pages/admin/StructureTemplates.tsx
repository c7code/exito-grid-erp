import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api } from '@/api';
import {
    Plus, Search, MoreVertical, Trash2, Edit, Loader2, Zap, Package, AlertTriangle,
    Layers, X, Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const concessionarias = ['neoenergia', 'cemig', 'enel', 'cpfl', 'energisa', 'equatorial', 'copel', 'outra'];
const tensionLevels = ['BT', 'MT', 'AT'];
const categories = ['extensao_rede', 'padrao_entrada', 'subestacao', 'iluminacao', 'transformador', 'medicao', 'protecao', 'outra'];

const categoryLabels: Record<string, string> = {
    extensao_rede: 'Extensão de Rede',
    padrao_entrada: 'Padrão de Entrada',
    subestacao: 'Subestação',
    iluminacao: 'Iluminação',
    transformador: 'Transformador',
    medicao: 'Medição',
    protecao: 'Proteção',
    outra: 'Outra',
};

const emptyTemplate = {
    code: '', name: '', concessionaria: '', normCode: '', tensionLevel: '',
    category: '', description: '', tags: [] as string[],
};

interface TemplateItem {
    id?: string;
    catalogItemId?: string;
    catalogItem?: any;
    description: string;
    quantity: number;
    unit: string;
    isOptional: boolean;
    sortOrder: number;
}

export default function StructureTemplates() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterConc, setFilterConc] = useState('');
    const [filterTension, setFilterTension] = useState('');

    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState(emptyTemplate);
    const [tagsInput, setTagsInput] = useState('');
    const [saving, setSaving] = useState(false);

    // Items management
    const [showItemDialog, setShowItemDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [items, setItems] = useState<TemplateItem[]>([]);
    const [newItem, setNewItem] = useState<TemplateItem>({
        description: '', quantity: 1, unit: 'UN', isOptional: false, sortOrder: 0,
    });

    // Catalog search
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogResults, setCatalogResults] = useState<any[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (filterConc && filterConc !== 'all') filters.concessionaria = filterConc;
            if (filterTension && filterTension !== 'all') filters.tensionLevel = filterTension;
            if (search) filters.search = search;
            const data = await api.getStructureTemplates(filters);
            setTemplates(data);
        } catch { toast.error('Erro ao carregar templates'); }
        setLoading(false);
    };

    useEffect(() => { load(); }, [filterConc, filterTension]);

    const handleSearch = () => load();

    const openNew = () => {
        setEditing(null);
        setForm({ ...emptyTemplate });
        setTagsInput('');
        setShowDialog(true);
    };

    const openEdit = (t: any) => {
        setEditing(t);
        setForm({
            code: t.code, name: t.name, concessionaria: t.concessionaria || '',
            normCode: t.normCode || '', tensionLevel: t.tensionLevel || '',
            category: t.category || '', description: t.description || '',
            tags: t.tags || [],
        });
        setTagsInput((t.tags || []).join(', '));
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!form.code || !form.name) { toast.error('Código e nome são obrigatórios'); return; }
        setSaving(true);
        try {
            const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
            const payload = { ...form, tags };
            if (editing) {
                await api.updateStructureTemplate(editing.id, payload);
                toast.success('Template atualizado!');
            } else {
                await api.createStructureTemplate(payload);
                toast.success('Template criado!');
            }
            setShowDialog(false);
            load();
        } catch { toast.error('Erro ao salvar template'); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este template?')) return;
        try { await api.deleteStructureTemplate(id); toast.success('Template excluído'); load(); }
        catch { toast.error('Erro ao excluir'); }
    };

    // Items management
    const openItems = (t: any) => {
        setSelectedTemplate(t);
        setItems(t.items || []);
        setNewItem({ description: '', quantity: 1, unit: 'UN', isOptional: false, sortOrder: items.length });
        setCatalogSearch('');
        setCatalogResults([]);
        setShowItemDialog(true);
    };

    const handleSearchCatalog = async (q: string) => {
        setCatalogSearch(q);
        if (q.length < 2) { setCatalogResults([]); return; }
        try {
            const results = await api.searchCatalogItems(q, 'material');
            setCatalogResults(results);
        } catch { setCatalogResults([]); }
    };

    const handleSelectCatalogItem = (ci: any) => {
        setNewItem(prev => ({
            ...prev,
            catalogItemId: ci.id,
            catalogItem: ci,
            description: ci.name,
            unit: ci.unit || 'UN',
        }));
        setCatalogSearch('');
        setCatalogResults([]);
    };

    const handleAddItem = async () => {
        if (!selectedTemplate || !newItem.description) return;
        setSaving(true);
        try {
            await api.addStructureTemplateItem(selectedTemplate.id, {
                ...newItem,
                sortOrder: items.length,
            });
            toast.success('Item adicionado');
            const updated = await api.getStructureTemplate(selectedTemplate.id);
            setSelectedTemplate(updated);
            setItems(updated.items || []);
            setNewItem({ description: '', quantity: 1, unit: 'UN', isOptional: false, sortOrder: 0 });
        } catch { toast.error('Erro ao adicionar item'); }
        setSaving(false);
    };

    const handleRemoveItem = async (itemId: string) => {
        try {
            await api.deleteStructureTemplateItem(itemId);
            setItems(prev => prev.filter(i => i.id !== itemId));
            toast.success('Item removido');
        } catch { toast.error('Erro ao remover item'); }
    };

    const totalCost = items.reduce((sum, i) => {
        const price = i.catalogItem?.costPrice || 0;
        return sum + Number(price) * Number(i.quantity);
    }, 0);

    const uncatalogedItems = items.filter(i => !i.catalogItemId).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-7 h-7 text-amber-500" /> Templates de Estrutura
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Cadastro padrão de estruturas elétricas (CE4, B1, N1...)</p>
                </div>
                <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" /> Novo Template
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por código ou nome..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={filterConc} onValueChange={setFilterConc}>
                        <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Concessionária" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {concessionarias.map(c => (
                                <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterTension} onValueChange={setFilterTension}>
                        <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Tensão" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {tensionLevels.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{templates.length}</p><p className="text-sm text-slate-500">Total</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{templates.filter(t => t.tensionLevel === 'BT').length}</p><p className="text-sm text-slate-500">BT</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{templates.filter(t => t.tensionLevel === 'MT').length}</p><p className="text-sm text-slate-500">MT</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{templates.filter(t => t.tensionLevel === 'AT').length}</p><p className="text-sm text-slate-500">AT</p></CardContent></Card>
            </div>

            {/* Template Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-3" />
                    <span className="text-slate-500">Carregando...</span>
                </div>
            ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Layers className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Nenhum template cadastrado</p>
                    <p className="text-sm">Clique em "Novo Template" para começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <Card key={t.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <Zap className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{t.code}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-1">{t.name}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(t)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openItems(t)}><Package className="w-4 h-4 mr-2" />Materiais</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-1.5 text-sm text-slate-600">
                                    {t.concessionaria && <p className="capitalize">🏢 {t.concessionaria}</p>}
                                    {t.normCode && <p>📋 {t.normCode}</p>}
                                    {t.description && <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>}
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                    <div className="flex gap-1.5 flex-wrap">
                                        {t.tensionLevel && (
                                            <Badge className={cn('text-xs',
                                                t.tensionLevel === 'BT' ? 'bg-blue-100 text-blue-700' :
                                                t.tensionLevel === 'MT' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            )}>{t.tensionLevel}</Badge>
                                        )}
                                        {t.category && (
                                            <Badge variant="outline" className="text-xs">{categoryLabels[t.category] || t.category}</Badge>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {(t.items || []).length} itens
                                    </span>
                                </div>

                                {t.tags && t.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {t.tags.map((tag: string, i: number) => (
                                            <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Template Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Template' : 'Novo Template'}</DialogTitle>
                        <DialogDescription>Defina o código, nome e propriedades da estrutura</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Código *</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="CE4" /></div>
                            <div><Label>Norma</Label><Input value={form.normCode} onChange={e => setForm(p => ({ ...p, normCode: e.target.value }))} placeholder="NTD-001" /></div>
                        </div>
                        <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Estrutura CE4 - Rede BT Monofásica" /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label>Concessionária</Label>
                                <Select value={form.concessionaria} onValueChange={v => setForm(p => ({ ...p, concessionaria: v === 'none' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        {concessionarias.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Tensão</Label>
                                <Select value={form.tensionLevel} onValueChange={v => setForm(p => ({ ...p, tensionLevel: v === 'none' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="Tensão" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        {tensionLevels.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Categoria</Label>
                                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v === 'none' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        {categories.map(c => <SelectItem key={c} value={c}>{categoryLabels[c] || c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div><Label>Descrição</Label><textarea className="w-full border rounded-md p-2 text-sm h-16 resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição da estrutura..." /></div>
                        <div>
                            <Label>Tags</Label>
                            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Separar por vírgula: monofasico, poste_9m, rural" />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Items Dialog */}
            <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-auto">
                    <DialogHeader>
                        <DialogTitle>Materiais — {selectedTemplate?.code} {selectedTemplate?.name}</DialogTitle>
                        <DialogDescription>Gerencie os materiais desta estrutura e vincule ao catálogo</DialogDescription>
                    </DialogHeader>

                    {/* Summary */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <Card className="flex-1"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{items.length}</p><p className="text-xs text-slate-500">Itens</p></CardContent></Card>
                        <Card className="flex-1"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-green-600">R$ {totalCost.toFixed(2)}</p><p className="text-xs text-slate-500">Custo Total</p></CardContent></Card>
                        {uncatalogedItems > 0 && (
                            <Card className="flex-1 border-amber-200 bg-amber-50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-600">{uncatalogedItems}</p><p className="text-xs text-amber-600">Sem catálogo</p></CardContent></Card>
                        )}
                    </div>

                    {/* Add item */}
                    <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
                        <p className="text-sm font-medium text-slate-700">Adicionar Material</p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar no catálogo..."
                                value={catalogSearch}
                                onChange={e => handleSearchCatalog(e.target.value)}
                                className="pl-10"
                            />
                            {catalogResults.length > 0 && (
                                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {catalogResults.map(ci => (
                                        <button
                                            key={ci.id}
                                            className="w-full text-left px-4 py-2 hover:bg-amber-50 text-sm flex justify-between items-center"
                                            onClick={() => handleSelectCatalogItem(ci)}
                                        >
                                            <div>
                                                <p className="font-medium">{ci.name}</p>
                                                <p className="text-xs text-slate-400">{ci.sku || ''} • {ci.category?.name || ''}</p>
                                            </div>
                                            <span className="text-xs text-green-600 font-medium">R$ {Number(ci.costPrice || 0).toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {newItem.catalogItem && (
                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                <Link2 className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-700">{newItem.catalogItem.name}</span>
                                <span className="text-xs text-green-500">R$ {Number(newItem.catalogItem.costPrice || 0).toFixed(2)}</span>
                                <button className="ml-auto" onClick={() => setNewItem(p => ({ ...p, catalogItemId: undefined, catalogItem: undefined }))}>
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="col-span-2">
                                <Input
                                    placeholder="Descrição do material"
                                    value={newItem.description}
                                    onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <Input
                                type="number"
                                placeholder="Qtd"
                                value={newItem.quantity}
                                onChange={e => setNewItem(p => ({ ...p, quantity: Number(e.target.value) }))}
                            />
                            <Select value={newItem.unit} onValueChange={v => setNewItem(p => ({ ...p, unit: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['UN', 'M', 'M²', 'KG', 'CX', 'PCT', 'JG', 'RL', 'PÇ'].map(u => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={newItem.isOptional} onChange={e => setNewItem(p => ({ ...p, isOptional: e.target.checked }))} />
                                Material opcional
                            </label>
                            <Button onClick={handleAddItem} disabled={!newItem.description || saving} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                                <Plus className="w-4 h-4 mr-1" /> Adicionar
                            </Button>
                        </div>
                    </div>

                    {/* Items list */}
                    {items.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-4">Nenhum material cadastrado nesta estrutura</p>
                    ) : (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Material</TableHead>
                                    <TableHead className="text-right">Qtd</TableHead>
                                    <TableHead>UN</TableHead>
                                    <TableHead className="text-right">Custo Unit.</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, idx) => {
                                    const unitCost = Number(item.catalogItem?.costPrice || 0);
                                    const subtotal = unitCost * Number(item.quantity);
                                    return (
                                        <TableRow key={item.id || idx}>
                                            <TableCell className="text-xs text-slate-400">{idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <p className="text-sm font-medium">{item.description}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            {item.catalogItemId ? (
                                                                <Badge className="text-[10px] bg-green-100 text-green-700">Catalogado</Badge>
                                                            ) : (
                                                                <Badge className="text-[10px] bg-amber-100 text-amber-700">
                                                                    <AlertTriangle className="w-3 h-3 mr-0.5" /> Sem catálogo
                                                                </Badge>
                                                            )}
                                                            {item.isOptional && <Badge variant="outline" className="text-[10px]">Opcional</Badge>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-sm">{Number(item.quantity)}</TableCell>
                                            <TableCell className="text-sm">{item.unit}</TableCell>
                                            <TableCell className="text-right text-sm text-slate-500">
                                                {unitCost > 0 ? `R$ ${unitCost.toFixed(2)}` : '—'}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-medium">
                                                {subtotal > 0 ? `R$ ${subtotal.toFixed(2)}` : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => item.id && handleRemoveItem(item.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
