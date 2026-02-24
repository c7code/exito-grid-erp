import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Plus, Pencil, Trash2, Loader2, Package, Search, MoreVertical,
    FolderPlus, ArrowUpDown, AlertTriangle, ArrowDown, ArrowUp,
    FileText, Truck, X, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

// ═════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════

interface Category {
    id: string;
    name: string;
    type: 'material' | 'service';
    parentId: string | null;
    children?: Category[];
}

interface CatalogItem {
    id: string;
    name: string;
    description: string;
    unitPrice: number;
    costPrice: number;
    unit: string;
    categoryId: string;
    type: 'material' | 'service';
    category?: Category;
    sku: string;
    barcode: string;
    isActive: boolean;
    isSoldSeparately: boolean;
    isPos: boolean;
    commission: number;
    brand: string;
    model: string;
    weight: number;
    width: number;
    height: number;
    length: number;
    grossWeight: number;
    netWeight: number;
    ncm: string;
    cest: string;
    cfopInterno: string;
    cfopInterestadual: string;
    origem: number;
    codigoBeneficio: string;
    produtoEspecifico: string;
    numeroFci: string;
    trackStock: boolean;
    currentStock: number;
    minStock: number;
    maxStock: number;
    reservedStock: number;
    stockLocation: string;
    extraFields: { key: string; value: string }[];
}

interface NcmResult {
    code: string;
    description: string;
}

interface StockMov {
    id: string;
    type: string;
    quantity: number;
    stockAfter: number;
    reason: string;
    referenceType: string;
    createdBy: string;
    createdAt: string;
}

interface ProductSupplierLink {
    id: string;
    supplierId: string;
    supplier: { id: string; name: string; cnpj: string };
    supplierProductCode: string;
    lastPrice: number;
    leadTimeDays: number;
    notes: string;
}

const EMPTY_ITEM: Partial<CatalogItem> = {
    name: '', description: '', unitPrice: 0, costPrice: 0, unit: 'UN',
    categoryId: '', type: 'material', sku: '', barcode: '',
    isActive: true, isSoldSeparately: true, isPos: false, commission: 0,
    brand: '', model: '',
    weight: 0, width: 0, height: 0, length: 0, grossWeight: 0, netWeight: 0,
    ncm: '', cest: '', cfopInterno: '', cfopInterestadual: '', origem: 0,
    codigoBeneficio: '', produtoEspecifico: 'nao_usar', numeroFci: '',
    trackStock: false, currentStock: 0, minStock: 0, maxStock: 0,
    reservedStock: 0, stockLocation: '', extraFields: [],
};

const ORIGENS = [
    { value: 0, label: '0 - Nacional' },
    { value: 1, label: '1 - Estrangeira (import. direta)' },
    { value: 2, label: '2 - Estrangeira (mercado interno)' },
    { value: 3, label: '3 - Nacional (import. 40%-70%)' },
    { value: 4, label: '4 - Nacional (proc. básicos)' },
    { value: 5, label: '5 - Nacional (import. < 40%)' },
    { value: 6, label: '6 - Estrangeira (import. direta, sem similar)' },
    { value: 7, label: '7 - Estrangeira (merc. interno, sem similar)' },
    { value: 8, label: '8 - Nacional (import. > 70%)' },
];

// ═════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════

export default function AdminCatalogManagement() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState<'material' | 'service'>('material');
    const [search, setSearch] = useState('');

    // Dialog states
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [catDialogOpen, setCatDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<CatalogItem>>(EMPTY_ITEM);
    const [isEditing, setIsEditing] = useState(false);
    const [activeFormTab, setActiveFormTab] = useState('dados');

    // Category form
    const [catForm, setCatForm] = useState({ id: '', name: '', type: 'material' as string, parentId: '' });

    // NCM Search
    const [, setNcmQuery] = useState('');
    const [ncmResults, setNcmResults] = useState<NcmResult[]>([]);
    const [, setNcmSearching] = useState(false);
    const ncmTimeout = useRef<any>(null);

    // Stock movements
    const [stockMovements, setStockMovements] = useState<StockMov[]>([]);
    const [movDialog, setMovDialog] = useState(false);
    const [movForm, setMovForm] = useState({ type: 'entrada', quantity: 0, reason: '' });

    // Product suppliers
    const [prodSuppliers, setProdSuppliers] = useState<ProductSupplierLink[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierForm, setSupplierForm] = useState({ supplierId: '', supplierProductCode: '', lastPrice: 0, leadTimeDays: 0 });

    // ═══════════ DATA LOADING ═══════════

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [itemsData, catsData] = await Promise.all([
                api.getCatalogItems(),
                api.getCatalogCategories(),
            ]);
            setItems(itemsData);
            setCategories(catsData);
        } catch (err) {
            toast.error('Erro ao carregar dados');
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ═══════════ NCM SEARCH ═══════════

    const handleNcmSearch = (query: string) => {
        setNcmQuery(query);
        if (ncmTimeout.current) clearTimeout(ncmTimeout.current);
        if (query.length < 2) { setNcmResults([]); return; }
        setNcmSearching(true);
        ncmTimeout.current = setTimeout(async () => {
            try {
                const results = await api.searchNcm(query);
                setNcmResults(results);
            } catch { setNcmResults([]); }
            setNcmSearching(false);
        }, 300);
    };

    const selectNcm = (ncm: NcmResult) => {
        setEditingItem(prev => ({ ...prev, ncm: ncm.code }));
        setNcmQuery('');
        setNcmResults([]);
    };

    // ═══════════ ITEM CRUD ═══════════

    const handleOpenItemDialog = (item?: CatalogItem) => {
        if (item) {
            setEditingItem({ ...item });
            setIsEditing(true);
        } else {
            setEditingItem({ ...EMPTY_ITEM, type: activeTab });
            setIsEditing(false);
        }
        setActiveFormTab('dados');
        setStockMovements([]);
        setProdSuppliers([]);
        setItemDialogOpen(true);
    };

    const handleSaveItem = async () => {
        if (!editingItem.name || !editingItem.categoryId) {
            toast.error('Nome e categoria são obrigatórios');
            return;
        }
        setSaving(true);
        try {
            if (isEditing && editingItem.id) {
                await api.updateCatalogItem(editingItem.id, editingItem);
                toast.success('Produto atualizado!');
            } else {
                await api.createCatalogItem(editingItem);
                toast.success('Produto cadastrado!');
            }
            setItemDialogOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao salvar');
        }
        setSaving(false);
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Deseja excluir este produto?')) return;
        try {
            await api.deleteCatalogItem(id);
            toast.success('Produto excluído');
            loadData();
        } catch { toast.error('Erro ao excluir'); }
    };

    // ═══════════ CATEGORY CRUD ═══════════

    const handleOpenCatDialog = (cat?: Category) => {
        if (cat) setCatForm({ id: cat.id, name: cat.name, type: cat.type, parentId: cat.parentId || '' });
        else setCatForm({ id: '', name: '', type: activeTab, parentId: '' });
        setCatDialogOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!catForm.name) { toast.error('Nome obrigatório'); return; }
        setSaving(true);
        try {
            const payload = { name: catForm.name, type: catForm.type, parentId: catForm.parentId || null };
            if (catForm.id) {
                await api.updateCatalogCategory(catForm.id, payload);
                toast.success('Categoria atualizada');
            } else {
                await api.createCatalogCategory(payload);
                toast.success('Categoria criada');
            }
            setCatDialogOpen(false);
            loadData();
        } catch { toast.error('Erro ao salvar categoria'); }
        setSaving(false);
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Excluir categoria e todos os itens?')) return;
        try {
            await api.deleteCatalogCategory(id);
            toast.success('Categoria excluída');
            loadData();
        } catch { toast.error('Erro ao excluir'); }
    };

    // ═══════════ STOCK MOVEMENTS ═══════════

    const loadStockMovements = async (itemId: string) => {
        try {
            const movs = await api.getStockMovements(itemId);
            setStockMovements(movs);
        } catch { setStockMovements([]); }
    };

    const handleCreateMovement = async () => {
        if (!editingItem.id || movForm.quantity <= 0) { toast.error('Quantidade inválida'); return; }
        setSaving(true);
        try {
            await api.createStockMovement({
                catalogItemId: editingItem.id,
                type: movForm.type,
                quantity: movForm.quantity,
                reason: movForm.reason,
            });
            toast.success('Movimentação registrada');
            setMovDialog(false);
            setMovForm({ type: 'entrada', quantity: 0, reason: '' });
            loadStockMovements(editingItem.id);
            loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro na movimentação');
        }
        setSaving(false);
    };

    // ═══════════ PRODUCT SUPPLIERS ═══════════

    const loadProductSuppliers = async (itemId: string) => {
        try {
            const [sups, allSups] = await Promise.all([
                api.getProductSuppliers(itemId),
                api.getSuppliers(),
            ]);
            setProdSuppliers(sups);
            setAllSuppliers(allSups);
        } catch { setProdSuppliers([]); }
    };

    const handleLinkSupplier = async () => {
        if (!editingItem.id || !supplierForm.supplierId) return;
        setSaving(true);
        try {
            await api.linkProductSupplier(editingItem.id, supplierForm);
            toast.success('Fornecedor vinculado');
            setSupplierDialog(false);
            setSupplierForm({ supplierId: '', supplierProductCode: '', lastPrice: 0, leadTimeDays: 0 });
            loadProductSuppliers(editingItem.id);
        } catch { toast.error('Erro ao vincular'); }
        setSaving(false);
    };

    const handleUnlinkSupplier = async (supplierId: string) => {
        if (!editingItem.id) return;
        try {
            await api.unlinkProductSupplier(editingItem.id, supplierId);
            toast.success('Fornecedor desvinculado');
            loadProductSuppliers(editingItem.id);
        } catch { toast.error('Erro ao desvincular'); }
    };

    // ═══════════ HELPERS ═══════════

    const flattenCategories = (cats: Category[], prefix = ''): { id: string; name: string }[] => {
        let result: { id: string; name: string }[] = [];
        for (const cat of cats) {
            result.push({ id: cat.id, name: prefix + cat.name });
            if (cat.children) result = result.concat(flattenCategories(cat.children, prefix + cat.name + ' > '));
        }
        return result;
    };

    const filteredCategories = categories.filter(c => c.type === activeTab);
    const flatCats = flattenCategories(filteredCategories);
    const filteredItems = items
        .filter(i => i.type === activeTab)
        .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.sku?.toLowerCase().includes(search.toLowerCase()) ||
            i.ncm?.includes(search) ||
            i.barcode?.includes(search));

    const getStockBadge = (item: CatalogItem) => {
        if (!item.trackStock) return null;
        if (Number(item.currentStock) <= 0) return <Badge variant="destructive" className="text-xs">Sem estoque</Badge>;
        if (Number(item.minStock) > 0 && Number(item.currentStock) <= Number(item.minStock))
            return <Badge variant="outline" className="text-xs text-amber-600 border-amber-300"><AlertTriangle className="h-3 w-3 mr-1" /> Baixo</Badge>;
        return <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">{Number(item.currentStock)} {item.unit}</Badge>;
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    );

    // ═══════════ RENDER ═══════════

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Produtos & Estoque</h1>
                    <p className="text-sm text-gray-500 mt-1">Cadastro de materiais e serviços com dados fiscais e controle de estoque</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenCatDialog()}>
                        <FolderPlus className="h-4 w-4 mr-1" /> Nova Categoria
                    </Button>
                    <Button size="sm" onClick={() => handleOpenItemDialog()}>
                        <Plus className="h-4 w-4 mr-1" /> Novo Produto
                    </Button>
                </div>
            </div>

            {/* Tabs Material / Serviço */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'material' | 'service')}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <TabsList>
                        <TabsTrigger value="material"><Package className="h-4 w-4 mr-1" /> Materiais</TabsTrigger>
                        <TabsTrigger value="service"><FileText className="h-4 w-4 mr-1" /> Serviços</TabsTrigger>
                    </TabsList>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nome, SKU, NCM ou código..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <TabsContent value={activeTab} className="mt-4">
                    {/* Categories */}
                    {filteredCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {filteredCategories.map(cat => (
                                <Badge key={cat.id} variant="secondary" className="gap-1 cursor-pointer hover:bg-gray-200 transition">
                                    {cat.name}
                                    <button className="ml-1 hover:text-blue-600" onClick={() => handleOpenCatDialog(cat)}><Pencil className="h-3 w-3" /></button>
                                    <button className="hover:text-red-600" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-3 w-3" /></button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Items Table */}
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produto</TableHead>
                                        <TableHead className="hidden md:table-cell">SKU</TableHead>
                                        <TableHead className="hidden lg:table-cell">NCM</TableHead>
                                        <TableHead className="text-right">Preço Venda</TableHead>
                                        <TableHead className="hidden md:table-cell text-right">Custo</TableHead>
                                        <TableHead className="hidden lg:table-cell">Estoque</TableHead>
                                        <TableHead className="hidden md:table-cell">Categoria</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                                                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                                Nenhum {activeTab === 'material' ? 'material' : 'serviço'} cadastrado
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredItems.map(item => (
                                        <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleOpenItemDialog(item)}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <p className="font-medium text-sm">{item.name}</p>
                                                        {item.brand && <p className="text-xs text-gray-400">{item.brand} {item.model && `- ${item.model}`}</p>}
                                                    </div>
                                                    {!item.isActive && <Badge variant="outline" className="text-xs text-gray-400">Inativo</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-gray-500">{item.sku || '—'}</TableCell>
                                            <TableCell className="hidden lg:table-cell text-sm text-gray-500 font-mono">{item.ncm || '—'}</TableCell>
                                            <TableCell className="text-right text-sm font-medium">R$ {Number(item.unitPrice).toFixed(2)}</TableCell>
                                            <TableCell className="hidden md:table-cell text-right text-sm text-gray-500">R$ {Number(item.costPrice || 0).toFixed(2)}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{getStockBadge(item)}</TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-gray-500">{item.category?.name || '—'}</TableCell>
                                            <TableCell onClick={e => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenItemDialog(item)}>
                                                            <Pencil className="h-4 w-4 mr-2" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteItem(item.id)}>
                                                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ═══════════ ITEM DIALOG (MULTI-TAB FORM) ═══════════ */}
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                        <DialogDescription>Preencha as informações nas abas abaixo</DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeFormTab} onValueChange={(v) => {
                        setActiveFormTab(v);
                        if (v === 'estoque' && isEditing && editingItem.id) loadStockMovements(editingItem.id);
                        if (v === 'fornecedores' && isEditing && editingItem.id) loadProductSuppliers(editingItem.id);
                    }}>
                        <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-4">
                            <TabsTrigger value="dados">Dados</TabsTrigger>
                            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                            <TabsTrigger value="valores">Valores</TabsTrigger>
                            <TabsTrigger value="estoque">Estoque</TabsTrigger>
                            <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
                            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
                        </TabsList>

                        {/* ── ABA DADOS ── */}
                        <TabsContent value="dados" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label>Nome do Produto *</Label>
                                    <Input value={editingItem.name || ''} onChange={e => setEditingItem(p => ({ ...p, name: e.target.value }))} className="mt-1" placeholder="Ex: Cabo XLPE 3x95mm²" />
                                </div>
                                <div>
                                    <Label>Categoria *</Label>
                                    <Select value={editingItem.categoryId || ''} onValueChange={v => setEditingItem(p => ({ ...p, categoryId: v }))}>
                                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            {flatCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Tipo</Label>
                                    <Select value={editingItem.type || 'material'} onValueChange={v => setEditingItem(p => ({ ...p, type: v as any }))}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="material">Material</SelectItem>
                                            <SelectItem value="service">Serviço</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>SKU / Código interno</Label>
                                    <Input value={editingItem.sku || ''} onChange={e => setEditingItem(p => ({ ...p, sku: e.target.value }))} className="mt-1" placeholder="EX-001" />
                                </div>
                                <div>
                                    <Label>Código de barras (EAN)</Label>
                                    <Input value={editingItem.barcode || ''} onChange={e => setEditingItem(p => ({ ...p, barcode: e.target.value }))} className="mt-1" placeholder="7898..." />
                                </div>
                                <div>
                                    <Label>Marca</Label>
                                    <Input value={editingItem.brand || ''} onChange={e => setEditingItem(p => ({ ...p, brand: e.target.value }))} className="mt-1" />
                                </div>
                                <div>
                                    <Label>Modelo</Label>
                                    <Input value={editingItem.model || ''} onChange={e => setEditingItem(p => ({ ...p, model: e.target.value }))} className="mt-1" />
                                </div>
                                <div className="col-span-2">
                                    <Label>Descrição do produto</Label>
                                    <textarea
                                        className="mt-1 w-full min-h-[80px] rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editingItem.description || ''}
                                        onChange={e => setEditingItem(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Descrição detalhada..."
                                    />
                                </div>
                            </div>

                            {/* Pesos e dimensões */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-sm text-gray-700 mb-3">📦 Pesos e dimensões</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <Label className="text-xs">Peso (kg)</Label>
                                        <Input type="number" step="0.001" value={editingItem.weight || 0} onChange={e => setEditingItem(p => ({ ...p, weight: Number(e.target.value) }))} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Largura (m)</Label>
                                        <Input type="number" step="0.001" value={editingItem.width || 0} onChange={e => setEditingItem(p => ({ ...p, width: Number(e.target.value) }))} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Altura (m)</Label>
                                        <Input type="number" step="0.001" value={editingItem.height || 0} onChange={e => setEditingItem(p => ({ ...p, height: Number(e.target.value) }))} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Comprimento (m)</Label>
                                        <Input type="number" step="0.001" value={editingItem.length || 0} onChange={e => setEditingItem(p => ({ ...p, length: Number(e.target.value) }))} className="mt-1" />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── ABA DETALHES ── */}
                        <TabsContent value="detalhes" className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div><Label>Produto ativo</Label><p className="text-xs text-gray-400">Aparece nas buscas e propostas</p></div>
                                    <Switch checked={editingItem.isActive ?? true} onCheckedChange={v => setEditingItem(p => ({ ...p, isActive: v }))} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div><Label>Vendido separadamente</Label><p className="text-xs text-gray-400">Pode ser vendido individualmente</p></div>
                                    <Switch checked={editingItem.isSoldSeparately ?? true} onCheckedChange={v => setEditingItem(p => ({ ...p, isSoldSeparately: v }))} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div><Label>Comercializável no PDV</Label><p className="text-xs text-gray-400">Disponível no ponto de venda</p></div>
                                    <Switch checked={editingItem.isPos ?? false} onCheckedChange={v => setEditingItem(p => ({ ...p, isPos: v }))} />
                                </div>
                                <div>
                                    <Label>Comissão (%)</Label>
                                    <Input type="number" step="0.01" value={editingItem.commission || 0} onChange={e => setEditingItem(p => ({ ...p, commission: Number(e.target.value) }))} className="mt-1 max-w-[200px]" />
                                </div>
                            </div>

                            {/* Campos Extras */}
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-sm text-gray-700">🏷️ Campos extras</h4>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        setEditingItem(p => ({ ...p, extraFields: [...(p.extraFields || []), { key: '', value: '' }] }));
                                    }}>
                                        <Plus className="h-3 w-3 mr-1" /> Adicionar campo
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">Campos personalizados como: Marca, Modelo, Cor, etc.</p>
                                {(editingItem.extraFields || []).map((field, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <Input placeholder="Nome do campo" value={field.key} onChange={e => {
                                            const fields = [...(editingItem.extraFields || [])];
                                            fields[idx] = { ...fields[idx], key: e.target.value };
                                            setEditingItem(p => ({ ...p, extraFields: fields }));
                                        }} className="flex-1" />
                                        <Input placeholder="Valor" value={field.value} onChange={e => {
                                            const fields = [...(editingItem.extraFields || [])];
                                            fields[idx] = { ...fields[idx], value: e.target.value };
                                            setEditingItem(p => ({ ...p, extraFields: fields }));
                                        }} className="flex-1" />
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                                            const fields = (editingItem.extraFields || []).filter((_, i) => i !== idx);
                                            setEditingItem(p => ({ ...p, extraFields: fields }));
                                        }}><X className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* ── ABA VALORES ── */}
                        <TabsContent value="valores" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Preço de Venda (R$)</Label>
                                    <Input type="number" step="0.01" value={editingItem.unitPrice || 0} onChange={e => setEditingItem(p => ({ ...p, unitPrice: Number(e.target.value) }))} className="mt-1" />
                                </div>
                                <div>
                                    <Label>Preço de Custo (R$)</Label>
                                    <Input type="number" step="0.01" value={editingItem.costPrice || 0} onChange={e => setEditingItem(p => ({ ...p, costPrice: Number(e.target.value) }))} className="mt-1" />
                                </div>
                                <div>
                                    <Label>Unidade</Label>
                                    <Select value={editingItem.unit || 'UN'} onValueChange={v => setEditingItem(p => ({ ...p, unit: v }))}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['UN', 'M', 'M²', 'M³', 'KG', 'TON', 'L', 'CX', 'PCT', 'HR', 'CDA', 'PÇ', 'JG', 'RL', 'SC'].map(u => (
                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {Number(editingItem.costPrice) > 0 && Number(editingItem.unitPrice) > 0 && (
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="py-3">
                                        <p className="text-sm text-blue-700">
                                            <strong>Margem:</strong> {(((Number(editingItem.unitPrice) - Number(editingItem.costPrice)) / Number(editingItem.costPrice)) * 100).toFixed(1)}%
                                            &ensp;|&ensp;
                                            <strong>Lucro:</strong> R$ {(Number(editingItem.unitPrice) - Number(editingItem.costPrice)).toFixed(2)}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* ── ABA ESTOQUE ── */}
                        <TabsContent value="estoque" className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div><Label>Controlar estoque</Label><p className="text-xs text-gray-400">Ativar controle de entrada e saída</p></div>
                                <Switch checked={editingItem.trackStock ?? false} onCheckedChange={v => setEditingItem(p => ({ ...p, trackStock: v }))} />
                            </div>

                            {editingItem.trackStock && (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label className="text-xs">Estoque atual</Label>
                                            <Input type="number" step="0.001" value={editingItem.currentStock || 0} onChange={e => setEditingItem(p => ({ ...p, currentStock: Number(e.target.value) }))} className="mt-1" disabled={isEditing} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Estoque mínimo</Label>
                                            <Input type="number" step="0.001" value={editingItem.minStock || 0} onChange={e => setEditingItem(p => ({ ...p, minStock: Number(e.target.value) }))} className="mt-1" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Estoque máximo</Label>
                                            <Input type="number" step="0.001" value={editingItem.maxStock || 0} onChange={e => setEditingItem(p => ({ ...p, maxStock: Number(e.target.value) }))} className="mt-1" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Localização</Label>
                                            <Input value={editingItem.stockLocation || ''} onChange={e => setEditingItem(p => ({ ...p, stockLocation: e.target.value }))} className="mt-1" placeholder="Galpão A" />
                                        </div>
                                    </div>

                                    {isEditing && editingItem.id && (
                                        <div className="border-t pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-sm text-gray-700">📋 Movimentações</h4>
                                                <Button size="sm" onClick={() => setMovDialog(true)}>
                                                    <ArrowUpDown className="h-4 w-4 mr-1" /> Nova Movimentação
                                                </Button>
                                            </div>
                                            {stockMovements.length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-4">Nenhuma movimentação registrada</p>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Data</TableHead>
                                                            <TableHead>Tipo</TableHead>
                                                            <TableHead className="text-right">Qtd</TableHead>
                                                            <TableHead className="text-right">Estoque Após</TableHead>
                                                            <TableHead>Motivo</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {stockMovements.slice(0, 10).map(mov => (
                                                            <TableRow key={mov.id}>
                                                                <TableCell className="text-xs">{new Date(mov.createdAt).toLocaleString('pt-BR')}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant={mov.type === 'entrada' ? 'default' : mov.type === 'saida' ? 'destructive' : 'secondary'} className="text-xs">
                                                                        {mov.type === 'entrada' && <ArrowDown className="h-3 w-3 mr-1" />}
                                                                        {mov.type === 'saida' && <ArrowUp className="h-3 w-3 mr-1" />}
                                                                        {mov.type}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right text-sm font-mono">{Number(mov.quantity).toFixed(1)}</TableCell>
                                                                <TableCell className="text-right text-sm">{Number(mov.stockAfter).toFixed(1)}</TableCell>
                                                                <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">{mov.reason || '—'}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        {/* ── ABA FISCAL ── */}
                        <TabsContent value="fiscal" className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                                ℹ️ Estas informações aparecerão na hora de emitir a NF-e
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-xs">Cód. benefício</Label>
                                    <Input value={editingItem.codigoBeneficio || ''} onChange={e => setEditingItem(p => ({ ...p, codigoBeneficio: e.target.value }))} className="mt-1" />
                                </div>
                                <div className="relative">
                                    <Label className="text-xs">NCM (Nomenclatura Comum do Mercosul)</Label>
                                    <div className="relative mt-1">
                                        <Input
                                            value={editingItem.ncm || ''}
                                            onChange={e => {
                                                setEditingItem(p => ({ ...p, ncm: e.target.value }));
                                                handleNcmSearch(e.target.value);
                                            }}
                                            placeholder="Digite para buscar"
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                    {ncmResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {ncmResults.map(ncm => (
                                                <button key={ncm.code} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-0"
                                                    onClick={() => selectNcm(ncm)}>
                                                    <span className="font-mono font-medium text-blue-600">{ncm.code}</span>
                                                    <span className="ml-2 text-gray-600">{ncm.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs">CEST</Label>
                                    <Input value={editingItem.cest || ''} onChange={e => setEditingItem(p => ({ ...p, cest: e.target.value }))} className="mt-1" placeholder="Digite para buscar" />
                                </div>
                                <div>
                                    <Label className="text-xs">Origem</Label>
                                    <Select value={String(editingItem.origem ?? 0)} onValueChange={v => setEditingItem(p => ({ ...p, origem: Number(v) }))}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ORIGENS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-xs">Peso líquido</Label>
                                    <Input type="number" step="0.001" value={editingItem.netWeight || 0} onChange={e => setEditingItem(p => ({ ...p, netWeight: Number(e.target.value) }))} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-xs">Peso bruto</Label>
                                    <Input type="number" step="0.001" value={editingItem.grossWeight || 0} onChange={e => setEditingItem(p => ({ ...p, grossWeight: Number(e.target.value) }))} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-xs">Número FCI</Label>
                                    <Input value={editingItem.numeroFci || ''} onChange={e => setEditingItem(p => ({ ...p, numeroFci: e.target.value }))} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-xs">Produto específico</Label>
                                    <Select value={editingItem.produtoEspecifico || 'nao_usar'} onValueChange={v => setEditingItem(p => ({ ...p, produtoEspecifico: v }))}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nao_usar">Não usar</SelectItem>
                                            <SelectItem value="combustivel">Combustível</SelectItem>
                                            <SelectItem value="veiculo">Veículo</SelectItem>
                                            <SelectItem value="medicamento">Medicamento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* CFOP */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-sm text-gray-700 mb-3">📋 CFOP (Código Fiscal de Operações)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs">CFOP Interno</Label>
                                        <Input value={editingItem.cfopInterno || ''} onChange={e => setEditingItem(p => ({ ...p, cfopInterno: e.target.value }))} className="mt-1" placeholder="Ex: 5102" />
                                        <p className="text-xs text-gray-400 mt-1">Operações dentro do estado</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs">CFOP Interestadual</Label>
                                        <Input value={editingItem.cfopInterestadual || ''} onChange={e => setEditingItem(p => ({ ...p, cfopInterestadual: e.target.value }))} className="mt-1" placeholder="Ex: 6102" />
                                        <p className="text-xs text-gray-400 mt-1">Operações entre estados</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── ABA FORNECEDORES ── */}
                        <TabsContent value="fornecedores" className="space-y-4">
                            {!isEditing ? (
                                <p className="text-sm text-gray-400 text-center py-8">Salve o produto primeiro para vincular fornecedores</p>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm text-gray-700">Fornecedores vinculados</h4>
                                        <Button size="sm" variant="outline" onClick={() => setSupplierDialog(true)}>
                                            <Plus className="h-4 w-4 mr-1" /> Vincular Fornecedor
                                        </Button>
                                    </div>
                                    {prodSuppliers.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <Truck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Nenhum fornecedor vinculado</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fornecedor</TableHead>
                                                    <TableHead>Cód. Fornecedor</TableHead>
                                                    <TableHead className="text-right">Último Preço</TableHead>
                                                    <TableHead>Prazo (dias)</TableHead>
                                                    <TableHead className="w-12"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {prodSuppliers.map(ps => (
                                                    <TableRow key={ps.id}>
                                                        <TableCell className="font-medium text-sm">{ps.supplier?.name || '—'}</TableCell>
                                                        <TableCell className="text-sm text-gray-500">{ps.supplierProductCode || '—'}</TableCell>
                                                        <TableCell className="text-right text-sm">R$ {Number(ps.lastPrice || 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-sm">{ps.leadTimeDays || '—'}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"
                                                                onClick={() => handleUnlinkSupplier(ps.supplierId)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </>
                            )}
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveItem} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════ CATEGORY DIALOG ═══════════ */}
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{catForm.id ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Nome *</Label>
                            <Input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} className="mt-1" />
                        </div>
                        <div>
                            <Label>Tipo</Label>
                            <Select value={catForm.type} onValueChange={v => setCatForm(p => ({ ...p, type: v }))}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="material">Material</SelectItem>
                                    <SelectItem value="service">Serviço</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Categoria pai (opcional)</Label>
                            <Select value={catForm.parentId || 'none'} onValueChange={v => setCatForm(p => ({ ...p, parentId: v === 'none' ? '' : v }))}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                                    {flatCats.filter(c => c.id !== catForm.id).map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveCategory} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════ STOCK MOVEMENT DIALOG ═══════════ */}
            <Dialog open={movDialog} onOpenChange={setMovDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
                        <DialogDescription>{editingItem.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Tipo</Label>
                            <Select value={movForm.type} onValueChange={v => setMovForm(p => ({ ...p, type: v }))}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrada">📥 Entrada</SelectItem>
                                    <SelectItem value="saida">📤 Saída</SelectItem>
                                    <SelectItem value="ajuste">⚙️ Ajuste (definir estoque)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Quantidade</Label>
                            <Input type="number" step="0.001" value={movForm.quantity} onChange={e => setMovForm(p => ({ ...p, quantity: Number(e.target.value) }))} className="mt-1" />
                        </div>
                        <div>
                            <Label>Motivo / Observação</Label>
                            <Input value={movForm.reason} onChange={e => setMovForm(p => ({ ...p, reason: e.target.value }))} className="mt-1" placeholder="Ex: Compra NF 1234" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMovDialog(false)}>Cancelar</Button>
                        <Button onClick={handleCreateMovement} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Registrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════ SUPPLIER LINK DIALOG ═══════════ */}
            <Dialog open={supplierDialog} onOpenChange={setSupplierDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Vincular Fornecedor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Fornecedor *</Label>
                            <Select value={supplierForm.supplierId} onValueChange={v => setSupplierForm(p => ({ ...p, supplierId: v }))}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    {allSuppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Código do produto no fornecedor</Label>
                            <Input value={supplierForm.supplierProductCode} onChange={e => setSupplierForm(p => ({ ...p, supplierProductCode: e.target.value }))} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Último preço (R$)</Label>
                                <Input type="number" step="0.01" value={supplierForm.lastPrice} onChange={e => setSupplierForm(p => ({ ...p, lastPrice: Number(e.target.value) }))} className="mt-1" />
                            </div>
                            <div>
                                <Label>Prazo (dias)</Label>
                                <Input type="number" value={supplierForm.leadTimeDays} onChange={e => setSupplierForm(p => ({ ...p, leadTimeDays: Number(e.target.value) }))} className="mt-1" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSupplierDialog(false)}>Cancelar</Button>
                        <Button onClick={handleLinkSupplier} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Vincular
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
