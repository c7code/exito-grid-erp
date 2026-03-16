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
import NewGroupingDialog from '@/components/NewGroupingDialog';

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
    isGrouping?: boolean;
    categories?: Category[];
    categoryIds?: string[];
}

interface GroupingItem {
    id?: string;
    childItemId: string;
    childItem?: CatalogItem;
    quantity: number;
    unit: string;
    sortOrder: number;
    notes: string;
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
    isGrouping: false,
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
    const [selectedCatFilter, setSelectedCatFilter] = useState('');

    // Dialog states
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [catDialogOpen, setCatDialogOpen] = useState(false);
    const [groupingDialogOpen, setGroupingDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<CatalogItem>>(EMPTY_ITEM);
    const [isEditing, setIsEditing] = useState(false);
    const [activeFormTab, setActiveFormTab] = useState('dados');

    // Category form
    const [catForm, setCatForm] = useState({ id: '', name: '', type: 'material' as string, parentId: '' });
    const [catFromProduct, setCatFromProduct] = useState(false);

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

    // Grouping (composição)
    const [groupingItems, setGroupingItems] = useState<GroupingItem[]>([]);
    const [groupingSearch, setGroupingSearch] = useState('');
    const [groupingSearchResults, setGroupingSearchResults] = useState<CatalogItem[]>([]);
    const groupingTimeout = useRef<any>(null);

    // Edit grouping
    const [editingGroupingItem, setEditingGroupingItem] = useState<CatalogItem | null>(null);
    const [groupingEditDialogOpen, setGroupingEditDialogOpen] = useState(false);

    const handleOpenGroupingEdit = (item: CatalogItem) => {
        setEditingGroupingItem(item);
        setGroupingEditDialogOpen(true);
    };

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
            setEditingItem({
                ...item,
                categoryIds: item.categories?.map((c: any) => c.id) || (item.categoryId ? [item.categoryId] : []),
            });
            setIsEditing(true);
        } else {
            setEditingItem({ ...EMPTY_ITEM, type: activeTab });
            setIsEditing(false);
        }
        setActiveFormTab('dados');
        setStockMovements([]);
        setProdSuppliers([]);
        setGroupingItems([]);
        setGroupingSearch('');
        setGroupingSearchResults([]);
        setItemDialogOpen(true);
    };

    const handleOpenGroupingDialog = () => {
        setGroupingDialogOpen(true);
    };

    const handleSaveItem = async () => {
        const catIds = editingItem.categoryIds || (editingItem.categoryId ? [editingItem.categoryId] : []);
        if (!editingItem.name) {
            toast.error('Nome do produto é obrigatório');
            return;
        }
        const payload: any = { ...editingItem, categoryIds: catIds, categoryId: catIds[0] || null };
        setSaving(true);
        try {
            if (isEditing && editingItem.id) {
                await api.updateCatalogItem(editingItem.id, payload);
                toast.success('Produto atualizado!');
                // Recalcular kits que contêm este item
                try {
                    const result = await api.recalcKitPrices(editingItem.id);
                    if (result.updatedKits > 0) {
                        toast.success(
                            `${result.updatedKits} agrupamento(s) atualizado(s) automaticamente`,
                            { duration: 3000 }
                        );
                    }
                } catch {
                    // Silently ignore — o item já foi salvo
                }
            } else {
                await api.createCatalogItem(payload);
                toast.success('Produto cadastrado!');
            }
            setItemDialogOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao salvar');
        }
        setSaving(false);
    };

    // ═══════════ GROUPING (COMPOSIÇÃO) ═══════════

    const loadGroupingItems = async (itemId: string) => {
        try {
            const data = await api.getGroupingItems(itemId);
            setGroupingItems(data.map((g: any) => ({
                id: g.id,
                childItemId: g.childItemId,
                childItem: g.childItem,
                quantity: Number(g.quantity),
                unit: g.unit || 'UN',
                sortOrder: g.sortOrder || 0,
                notes: g.notes || '',
            })));
        } catch { setGroupingItems([]); }
    };

    const handleSaveGrouping = async () => {
        if (!editingItem.id) return;
        setSaving(true);
        try {
            await api.saveGroupingItems(editingItem.id, groupingItems.map((g, idx) => ({
                childItemId: g.childItemId,
                quantity: g.quantity,
                unit: g.unit,
                sortOrder: idx,
                notes: g.notes,
            })));
            toast.success('Composição salva!');
            await loadGroupingItems(editingItem.id);
        } catch { toast.error('Erro ao salvar composição'); }
        setSaving(false);
    };

    const handleGroupingSearch = (query: string) => {
        setGroupingSearch(query);
        if (groupingTimeout.current) clearTimeout(groupingTimeout.current);
        if (query.length < 2) { setGroupingSearchResults([]); return; }
        groupingTimeout.current = setTimeout(async () => {
            try {
                const results = await api.searchCatalogItems(query);
                // Filtrar: não pode adicionar a si mesmo e não repetir
                const existingIds = new Set(groupingItems.map(g => g.childItemId));
                setGroupingSearchResults(results.filter((r: any) => r.id !== editingItem.id && !existingIds.has(r.id)));
            } catch { setGroupingSearchResults([]); }
        }, 300);
    };

    const addGroupingItem = (item: CatalogItem) => {
        setGroupingItems(prev => [...prev, {
            childItemId: item.id,
            childItem: item,
            quantity: 1,
            unit: item.unit || 'UN',
            sortOrder: prev.length,
            notes: '',
        }]);
        setGroupingSearch('');
        setGroupingSearchResults([]);
    };

    const removeGroupingItem = (childItemId: string) => {
        setGroupingItems(prev => prev.filter(g => g.childItemId !== childItemId));
    };

    const updateGroupingItem = (childItemId: string, field: keyof GroupingItem, value: any) => {
        setGroupingItems(prev => prev.map(g =>
            g.childItemId === childItemId ? { ...g, [field]: value } : g
        ));
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

    const handleOpenCatDialog = (cat?: Category, fromProduct = false) => {
        if (cat) setCatForm({ id: cat.id, name: cat.name, type: cat.type, parentId: cat.parentId || '' });
        else setCatForm({ id: '', name: '', type: editingItem.type || activeTab, parentId: '' });
        setCatFromProduct(fromProduct);
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
                const created = await api.createCatalogCategory(payload);
                toast.success('Categoria criada');
                if (catFromProduct && created?.id) {
                    setEditingItem(p => ({ ...p, categoryId: created.id }));
                }
            }
            setCatDialogOpen(false);
            setCatFromProduct(false);
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
        .filter(i => !selectedCatFilter || i.categoryId === selectedCatFilter || (i.categories && i.categories.some((c: any) => c.id === selectedCatFilter)))
        .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.sku?.toLowerCase().includes(search.toLowerCase()) ||
            i.ncm?.includes(search) ||
            i.barcode?.includes(search) ||
            i.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
            (i.categories && i.categories.some((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()))));

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
                    <Button variant="outline" size="sm" onClick={handleOpenGroupingDialog} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                        <Package className="h-4 w-4 mr-1" /> Novo Agrupamento
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
                        <div className="flex items-center gap-2 mb-4">
                            <Label className="text-xs text-gray-500 whitespace-nowrap">Filtrar por categoria:</Label>
                            <Select value={selectedCatFilter || '__ALL__'} onValueChange={v => setSelectedCatFilter(v === '__ALL__' ? '' : v)}>
                                <SelectTrigger className="w-[200px] h-8 text-sm">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__ALL__">Todas ({filteredCategories.length})</SelectItem>
                                    {filteredCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedCatFilter && (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar categoria" onClick={() => {
                                        const cat = filteredCategories.find(c => c.id === selectedCatFilter);
                                        if (cat) handleOpenCatDialog(cat);
                                    }}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" title="Excluir categoria" onClick={() => handleDeleteCategory(selectedCatFilter)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
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
                                        <TableRow
                                            key={item.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => item.isGrouping ? handleOpenGroupingEdit(item) : handleOpenItemDialog(item)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm">{item.name}</p>
                                                            {item.isGrouping && (
                                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">KIT</span>
                                                            )}
                                                        </div>
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
                                            <TableCell className="hidden md:table-cell text-sm text-gray-500">
                                                {item.categories && item.categories.length > 0
                                                    ? item.categories.map((c: any) => c.name).join(', ')
                                                    : item.category?.name || '—'}
                                            </TableCell>
                                            <TableCell onClick={e => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {item.isGrouping ? (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleOpenGroupingEdit(item)}>
                                                                    <Package className="h-4 w-4 mr-2 text-blue-600" /> Editar Agrupamento
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleOpenItemDialog(item)}>
                                                                    <Pencil className="h-4 w-4 mr-2" /> Editar Dados / Fiscal
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => handleOpenItemDialog(item)}>
                                                                <Pencil className="h-4 w-4 mr-2" /> Editar
                                                            </DropdownMenuItem>
                                                        )}
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
                        <TabsList className="flex flex-wrap gap-1 h-auto mb-4">
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
                                    <Label>Categorias <span className="text-gray-400 font-normal text-xs">(opcional)</span></Label>
                                    {/* Badges dos selecionados */}
                                    <div className="flex flex-wrap gap-1 mt-1 min-h-[28px]">
                                        {(editingItem.categoryIds || []).map(cid => {
                                            const cat = flatCats.find(c => c.id === cid);
                                            return cat ? (
                                                <Badge key={cid} variant="secondary" className="text-xs gap-1 pr-1">
                                                    {cat.name}
                                                    <button className="ml-0.5 hover:text-red-500" onClick={() =>
                                                        setEditingItem(p => {
                                                            const next = (p.categoryIds || []).filter(id => id !== cid);
                                                            return { ...p, categoryIds: next, categoryId: next[0] || '' };
                                                        })
                                                    }><X className="h-3 w-3" /></button>
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                    {/* Busca + lista filtrável */}
                                    <div className="mt-1 border rounded-md overflow-hidden">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar categoria..."
                                                className="w-full pl-8 pr-3 py-1.5 text-sm border-b outline-none focus:ring-1 focus:ring-blue-400"
                                                onChange={e => {
                                                    const el = e.target.closest('.border')?.querySelector('[data-cat-list]') as HTMLDivElement;
                                                    if (el) {
                                                        const q = e.target.value.toLowerCase();
                                                        el.querySelectorAll('[data-cat-item]').forEach((item: any) => {
                                                            item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div data-cat-list className="max-h-[130px] overflow-y-auto py-1">
                                            {flatCats.map(c => {
                                                const isChecked = (editingItem.categoryIds || []).includes(c.id);
                                                return (
                                                    <label key={c.id} data-cat-item className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2.5 py-1">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                setEditingItem(p => {
                                                                    const current = p.categoryIds || [];
                                                                    const next = e.target.checked
                                                                        ? [...current, c.id]
                                                                        : current.filter(id => id !== c.id);
                                                                    return { ...p, categoryIds: next, categoryId: next[0] || '' };
                                                                });
                                                            }}
                                                        />
                                                        <span>{c.name}</span>
                                                    </label>
                                                );
                                            })}
                                            {flatCats.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">Nenhuma categoria</p>}
                                        </div>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs mt-1" onClick={() => handleOpenCatDialog(undefined, true)}>
                                        <FolderPlus className="h-3 w-3 mr-1" /> Nova Categoria
                                    </Button>
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
                                    <Label>Unidade de medida</Label>
                                    <Select value={editingItem.unit || 'UN'} onValueChange={v => setEditingItem(p => ({ ...p, unit: v }))}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UN">UN - Unidade</SelectItem>
                                            <SelectItem value="M">M - Metro</SelectItem>
                                            <SelectItem value="M2">M² - Metro²</SelectItem>
                                            <SelectItem value="M3">M³ - Metro³</SelectItem>
                                            <SelectItem value="KG">KG - Quilograma</SelectItem>
                                            <SelectItem value="L">L - Litro</SelectItem>
                                            <SelectItem value="CX">CX - Caixa</SelectItem>
                                            <SelectItem value="PC">PC - Peça</SelectItem>
                                            <SelectItem value="RL">RL - Rolo</SelectItem>
                                            <SelectItem value="CDA">CDA - Cada</SelectItem>
                                            <SelectItem value="PAR">PAR - Par</SelectItem>
                                            <SelectItem value="JG">JG - Jogo</SelectItem>
                                            <SelectItem value="SC">SC - Saco</SelectItem>
                                            <SelectItem value="H">H - Hora</SelectItem>
                                            <SelectItem value="DIA">DIA - Diária</SelectItem>
                                            <SelectItem value="VB">VB - Verba</SelectItem>
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
                                        <Input type="text" inputMode="decimal" step="0.001" value={editingItem.weight || 0} onChange={e => setEditingItem(p => ({ ...p, weight: Number(e.target.value) }))} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Largura (m)</Label>
                                        <Input type="text" inputMode="decimal" step="0.001" value={editingItem.width || 0} onChange={e => setEditingItem(p => ({ ...p, width: Number(e.target.value) }))} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Altura (m)</Label>
                                        <Input type="text" inputMode="decimal" step="0.001" value={editingItem.height || 0} onChange={e => setEditingItem(p => ({ ...p, height: Number(e.target.value) }))} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Comprimento (m)</Label>
                                        <Input type="text" inputMode="decimal" step="0.001" value={editingItem.length || 0} onChange={e => setEditingItem(p => ({ ...p, length: Number(e.target.value) }))} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                            {/* ── COMPOSIÇÃO / AGRUPAMENTO ── */}
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-sm text-gray-700">🔗 Composição / Agrupamento</h4>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={editingItem.isGrouping || false}
                                            onCheckedChange={(checked) => {
                                                setEditingItem(p => ({ ...p, isGrouping: checked }));
                                                if (checked && isEditing && editingItem.id) loadGroupingItems(editingItem.id);
                                            }}
                                        />
                                        <Label className="text-xs">Este produto é um agrupamento</Label>
                                    </div>
                                </div>

                                {editingItem.isGrouping && (
                                    <div className="space-y-3">
                                        {!isEditing ? (
                                            <p className="text-sm text-gray-400 text-center py-4">Salve o produto primeiro para gerenciar a composição</p>
                                        ) : (
                                            <>
                                                {/* Busca inline */}
                                                <div className="relative">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            placeholder="Buscar item para adicionar..."
                                                            className="pl-9"
                                                            value={groupingSearch}
                                                            onChange={e => handleGroupingSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    {groupingSearchResults.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                                                            {groupingSearchResults.map(r => (
                                                                <button
                                                                    key={r.id}
                                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between items-center border-b last:border-0"
                                                                    onClick={() => addGroupingItem(r)}
                                                                >
                                                                    <span className="font-medium">{r.name}</span>
                                                                    <span className="text-xs text-gray-400">{r.unit || 'UN'} — R$ {Number(r.unitPrice || 0).toFixed(2)}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tabela de componentes */}
                                                {groupingItems.length === 0 ? (
                                                    <p className="text-xs text-gray-400 text-center py-4">Nenhum item na composição. Use a busca acima.</p>
                                                ) : (
                                                    <>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Item</TableHead>
                                                                    <TableHead className="w-20">Qtd</TableHead>
                                                                    <TableHead className="w-20">UN</TableHead>
                                                                    <TableHead className="text-right w-24">Preço</TableHead>
                                                                    <TableHead className="text-right w-24">Subtotal</TableHead>
                                                                    <TableHead className="w-10"></TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {groupingItems.map(g => (
                                                                    <TableRow key={g.childItemId}>
                                                                        <TableCell className="font-medium text-sm">{g.childItem?.name || '—'}</TableCell>
                                                                        <TableCell>
                                                                            <Input type="number" step="0.001" min="0.001" className="h-8 text-sm"
                                                                                value={g.quantity} onChange={e => updateGroupingItem(g.childItemId, 'quantity', parseFloat(e.target.value) || 0)} />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Input className="h-8 text-sm" value={g.unit}
                                                                                onChange={e => updateGroupingItem(g.childItemId, 'unit', e.target.value)} />
                                                                        </TableCell>
                                                                        <TableCell className="text-right text-sm">R$ {Number(g.childItem?.unitPrice || 0).toFixed(2)}</TableCell>
                                                                        <TableCell className="text-right text-sm font-medium">R$ {(Number(g.childItem?.unitPrice || 0) * g.quantity).toFixed(2)}</TableCell>
                                                                        <TableCell>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                                                                                onClick={() => removeGroupingItem(g.childItemId)}>
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        <div className="flex items-center justify-between pt-2 border-t">
                                                            <span className="text-xs text-gray-500">{groupingItems.length} componente(s)</span>
                                                            <span className="text-sm font-bold">Total: R$ {groupingItems.reduce((sum, g) => sum + Number(g.childItem?.unitPrice || 0) * g.quantity, 0).toFixed(2)}</span>
                                                        </div>
                                                        <Button onClick={handleSaveGrouping} disabled={saving} size="sm" className="w-full">
                                                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                                            Salvar Composição
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
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
                                    <Input type="text" inputMode="decimal" step="0.01" value={editingItem.commission || 0} onChange={e => setEditingItem(p => ({ ...p, commission: Number(e.target.value) }))} className="mt-1 max-w-[200px]" />
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Preço de Venda (R$)</Label>
                                    <Input type="text" inputMode="decimal" step="0.01" value={editingItem.unitPrice || 0} onChange={e => setEditingItem(p => ({ ...p, unitPrice: Number(e.target.value) }))} className="mt-1" />
                                </div>
                                <div>
                                    <Label>Preço de Custo (R$)</Label>
                                    <Input type="text" inputMode="decimal" step="0.01" value={editingItem.costPrice || 0} onChange={e => setEditingItem(p => ({ ...p, costPrice: Number(e.target.value) }))} className="mt-1" />
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
                                            <Input type="text" inputMode="decimal" step="0.001" value={editingItem.currentStock || 0} onChange={e => setEditingItem(p => ({ ...p, currentStock: Number(e.target.value) }))} className="mt-1" disabled={isEditing} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Estoque mínimo</Label>
                                            <Input type="text" inputMode="decimal" step="0.001" value={editingItem.minStock || 0} onChange={e => setEditingItem(p => ({ ...p, minStock: Number(e.target.value) }))} className="mt-1" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Estoque máximo</Label>
                                            <Input type="text" inputMode="decimal" step="0.001" value={editingItem.maxStock || 0} onChange={e => setEditingItem(p => ({ ...p, maxStock: Number(e.target.value) }))} className="mt-1" />
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
                                    <Input type="text" inputMode="decimal" step="0.001" value={editingItem.netWeight || 0} onChange={e => setEditingItem(p => ({ ...p, netWeight: Number(e.target.value) }))} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-xs">Peso bruto</Label>
                                    <Input type="text" inputMode="decimal" step="0.001" value={editingItem.grossWeight || 0} onChange={e => setEditingItem(p => ({ ...p, grossWeight: Number(e.target.value) }))} className="mt-1" />
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
                            <Input type="text" inputMode="decimal" step="0.001" value={movForm.quantity} onChange={e => setMovForm(p => ({ ...p, quantity: Number(e.target.value) }))} className="mt-1" />
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
                                <Input type="text" inputMode="decimal" step="0.01" value={supplierForm.lastPrice} onChange={e => setSupplierForm(p => ({ ...p, lastPrice: Number(e.target.value) }))} className="mt-1" />
                            </div>
                            <div>
                                <Label>Prazo (dias)</Label>
                                <Input type="text" inputMode="decimal" value={supplierForm.leadTimeDays} onChange={e => setSupplierForm(p => ({ ...p, leadTimeDays: Number(e.target.value) }))} className="mt-1" />
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

            {/* Grouping Dialog */}
            <NewGroupingDialog
                open={groupingDialogOpen}
                onOpenChange={setGroupingDialogOpen}
                onSuccess={loadData}
                categories={categories}
                activeTab={activeTab}
            />
            <NewGroupingDialog
                open={groupingEditDialogOpen}
                onOpenChange={(o) => { setGroupingEditDialogOpen(o); if (!o) setEditingGroupingItem(null); }}
                onSuccess={loadData}
                categories={categories}
                activeTab={activeTab}
                initialItem={editingGroupingItem}
            />
        </div>
    );
}
