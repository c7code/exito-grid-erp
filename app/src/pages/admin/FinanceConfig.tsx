import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Loader2, Building2, Landmark, Tag, Layers, Wallet, CreditCard, CheckCircle, X, Settings } from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

type ConfigEntity = { id?: string; name: string; [key: string]: any };

// Generic CRUD table component
function ConfigTable({ title, icon: Icon, items, fields, onAdd, onEdit, onDelete, loading }: {
  title: string; icon: any; items: any[]; fields: { key: string; label: string; render?: (v: any, item: any) => any }[];
  onAdd: () => void; onEdit: (item: any) => void; onDelete: (id: string) => void; loading: boolean;
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Icon className="w-4 h-4 text-amber-500" /> {title}</CardTitle>
        <Button size="sm" onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : (
          <Table>
            <TableHeader><TableRow className="bg-slate-50">{fields.map(f => <TableHead key={f.key} className="text-xs uppercase">{f.label}</TableHead>)}<TableHead className="w-[100px] text-xs uppercase">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.length === 0 ? <TableRow><TableCell colSpan={fields.length + 1} className="text-center text-sm text-slate-400 py-6">Nenhum registro</TableCell></TableRow> :
                items.map(item => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50">
                    {fields.map(f => <TableCell key={f.key} className="text-sm">{f.render ? f.render(item[f.key], item) : (item[f.key] ?? '—')}</TableCell>)}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}><Edit2 className="w-3.5 h-3.5 text-blue-500" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(item.id)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function FinanceConfig() {
  const [activeTab, setActiveTab] = useState('dre-categories');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Data stores
  const [dreCategories, setDreCategories] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  const [cashRegisters, setCashRegisters] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dre, banks, centers, chart, cash, methods] = await Promise.all([
        api.getDreCategories().catch(() => []),
        api.getBankAccounts().catch(() => []),
        api.getCostCenters().catch(() => []),
        api.getChartOfAccounts().catch(() => []),
        api.getCashRegisters().catch(() => []),
        api.getPaymentMethodsConfig().catch(() => []),
      ]);
      setDreCategories(dre); setBankAccounts(banks); setCostCenters(centers);
      setChartOfAccounts(chart); setCashRegisters(cash); setPaymentMethods(methods);
    } catch { toast.error('Erro ao carregar configurações'); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const openDialog = (type: string, item?: any) => {
    setDialogType(type);
    setEditingItem(item || null);
    setFormData(item ? { ...item } : {});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const isEdit = !!editingItem?.id;
      switch (dialogType) {
        case 'dre': isEdit ? await api.updateDreCategory(editingItem.id, formData) : await api.createDreCategory(formData); break;
        case 'bank': isEdit ? await api.updateBankAccount(editingItem.id, formData) : await api.createBankAccount(formData); break;
        case 'cost': isEdit ? await api.updateCostCenter(editingItem.id, formData) : await api.createCostCenter(formData); break;
        case 'chart': isEdit ? await api.updateChartAccount(editingItem.id, formData) : await api.createChartAccount(formData); break;
        case 'cash': isEdit ? await api.updateCashRegister(editingItem.id, formData) : await api.createCashRegister(formData); break;
        case 'method': isEdit ? await api.updatePaymentMethodConfig(editingItem.id, formData) : await api.createPaymentMethodConfig(formData); break;
      }
      toast.success(isEdit ? 'Atualizado com sucesso!' : 'Criado com sucesso!');
      setDialogOpen(false);
      loadAll();
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Remover este registro?')) return;
    try {
      switch (type) {
        case 'dre': await api.deleteDreCategory(id); break;
        case 'bank': await api.deleteBankAccount(id); break;
        case 'cost': await api.deleteCostCenter(id); break;
        case 'chart': await api.deleteChartAccount(id); break;
        case 'cash': await api.deleteCashRegister(id); break;
        case 'method': await api.deletePaymentMethodConfig(id); break;
      }
      toast.success('Removido!');
      loadAll();
    } catch { toast.error('Erro ao remover'); }
  };

  const handleSeedDre = async () => {
    try { await api.seedDreCategories(); toast.success('Categorias DRE padrão criadas!'); loadAll(); }
    catch { toast.error('Erro ao criar seed'); }
  };

  const fld = (key: string, label: string) => (
    <div className="space-y-1.5" key={key}>
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      <Input value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })} className="h-9" />
    </div>
  );

  const signalBadge = (signal: string) => {
    const colors: Record<string, string> = { '+': 'bg-emerald-100 text-emerald-700', '-': 'bg-rose-100 text-rose-700', '=': 'bg-blue-100 text-blue-700' };
    return <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-bold ${colors[signal] || 'bg-slate-100'}`}>({signal})</span>;
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = { receita: 'bg-emerald-50 text-emerald-600', despesa: 'bg-rose-50 text-rose-600', totalizador: 'bg-blue-50 text-blue-600' };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[type] || 'bg-slate-50'}`}>{type === 'receita' ? 'Receitas' : type === 'despesa' ? 'Despesas' : 'Totalizador'}</span>;
  };

  const activeBadge = (v: boolean) => v ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-slate-300" />;

  // Group DRE categories by parent
  const dreCatParents = dreCategories.filter(c => !c.parentId);
  const dreCatFlat = dreCatParents.flatMap(p => [p, ...dreCategories.filter(c => c.parentId === p.id)]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5 text-amber-500" /> Opções Auxiliares — Financeiro</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dre-categories" className="text-xs">Categorias DRE</TabsTrigger>
          <TabsTrigger value="bank-accounts" className="text-xs">Contas Bancárias</TabsTrigger>
          <TabsTrigger value="cost-centers" className="text-xs">Centros de Custo</TabsTrigger>
          <TabsTrigger value="chart" className="text-xs">Plano de Contas</TabsTrigger>
          <TabsTrigger value="cash-registers" className="text-xs">Caixas</TabsTrigger>
          <TabsTrigger value="payment-methods" className="text-xs">Formas Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="dre-categories" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSeedDre} variant="outline" className="text-xs">Gerar Categorias Padrão</Button>
          </div>
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Layers className="w-4 h-4 text-amber-500" /> Categorias DRE</CardTitle>
              <Button size="sm" onClick={() => openDialog('dre')} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-xs uppercase w-[400px]">Nome</TableHead><TableHead className="text-xs uppercase">Tipo</TableHead><TableHead className="text-xs uppercase text-center">Ativo</TableHead><TableHead className="w-[100px] text-xs uppercase">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {dreCatFlat.map(cat => (
                    <TableRow key={cat.id} className={`hover:bg-slate-50/50 ${!cat.parentId ? 'font-semibold bg-slate-50/40' : ''}`}>
                      <TableCell className="text-sm" style={{ paddingLeft: cat.parentId ? '2.5rem' : '1rem' }}>
                        {signalBadge(cat.signal)} <span className="ml-1.5">{cat.name}</span>
                      </TableCell>
                      <TableCell>{typeBadge(cat.type)}</TableCell>
                      <TableCell className="text-center">{activeBadge(cat.isActive)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog('dre', cat)}><Edit2 className="w-3.5 h-3.5 text-blue-500" /></Button>
                          {!cat.isSystem && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete('dre', cat.id)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {dreCatFlat.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">Nenhuma categoria. Clique "Gerar Categorias Padrão" para começar.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-accounts" className="mt-4">
          <ConfigTable title="Contas Bancárias" icon={Landmark} items={bankAccounts} loading={loading}
            fields={[
              { key: 'name', label: 'Nome' },
              { key: 'bankName', label: 'Banco' },
              { key: 'agency', label: 'Agência' },
              { key: 'accountNumber', label: 'Conta' },
              { key: 'accountType', label: 'Tipo', render: v => v === 'corrente' ? 'Corrente' : v === 'poupanca' ? 'Poupança' : v || '—' },
              { key: 'currentBalance', label: 'Saldo', render: v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
              { key: 'isActive', label: 'Ativo', render: v => activeBadge(v) },
            ]}
            onAdd={() => openDialog('bank')} onEdit={item => openDialog('bank', item)} onDelete={id => handleDelete('bank', id)}
          />
        </TabsContent>

        <TabsContent value="cost-centers" className="mt-4">
          <ConfigTable title="Centros de Custo" icon={Tag} items={costCenters} loading={loading}
            fields={[{ key: 'code', label: 'Código' }, { key: 'name', label: 'Nome' }, { key: 'description', label: 'Descrição' }, { key: 'isActive', label: 'Ativo', render: v => activeBadge(v) }]}
            onAdd={() => openDialog('cost')} onEdit={item => openDialog('cost', item)} onDelete={id => handleDelete('cost', id)}
          />
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <ConfigTable title="Plano de Contas" icon={Layers} items={chartOfAccounts} loading={loading}
            fields={[
              { key: 'code', label: 'Código' }, { key: 'name', label: 'Nome' },
              { key: 'nature', label: 'Natureza', render: v => v === 'analitica' ? 'Analítica' : 'Sintética' },
              { key: 'type', label: 'Tipo', render: v => typeBadge(v) },
              { key: 'isActive', label: 'Ativo', render: v => activeBadge(v) },
            ]}
            onAdd={() => openDialog('chart')} onEdit={item => openDialog('chart', item)} onDelete={id => handleDelete('chart', id)}
          />
        </TabsContent>

        <TabsContent value="cash-registers" className="mt-4">
          <ConfigTable title="Caixas" icon={Wallet} items={cashRegisters} loading={loading}
            fields={[
              { key: 'name', label: 'Nome' }, { key: 'description', label: 'Descrição' }, { key: 'responsibleName', label: 'Responsável' },
              { key: 'balance', label: 'Saldo', render: v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
              { key: 'isActive', label: 'Ativo', render: v => activeBadge(v) },
            ]}
            onAdd={() => openDialog('cash')} onEdit={item => openDialog('cash', item)} onDelete={id => handleDelete('cash', id)}
          />
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-4">
          <ConfigTable title="Formas de Pagamento" icon={CreditCard} items={paymentMethods} loading={loading}
            fields={[
              { key: 'name', label: 'Nome' }, { key: 'code', label: 'Código' },
              { key: 'defaultFeePercent', label: 'Taxa (%)', render: v => `${Number(v || 0).toFixed(2)}%` },
              { key: 'isActive', label: 'Ativo', render: v => activeBadge(v) },
            ]}
            onAdd={() => openDialog('method')} onEdit={item => openDialog('method', item)} onDelete={id => handleDelete('method', id)}
          />
        </TabsContent>
      </Tabs>

      {/* ═══ Universal CRUD Dialog ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Novo'} {
              dialogType === 'dre' ? 'Categoria DRE' : dialogType === 'bank' ? 'Conta Bancária' :
              dialogType === 'cost' ? 'Centro de Custo' : dialogType === 'chart' ? 'Plano de Contas' :
              dialogType === 'cash' ? 'Caixa' : 'Forma de Pagamento'
            }</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {dialogType === 'dre' && (<>
              {fld('name', 'Nome')}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Tipo</Label>
                  <Select value={formData.type || 'despesa'} onValueChange={v => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="receita">Receitas</SelectItem><SelectItem value="despesa">Despesas</SelectItem><SelectItem value="totalizador">Totalizador</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Sinal</Label>
                  <Select value={formData.signal || '-'} onValueChange={v => setFormData({ ...formData, signal: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="+">( + ) Receita</SelectItem><SelectItem value="-">( - ) Despesa</SelectItem><SelectItem value="=">( = ) Totalizador</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Categoria pai</Label>
                <Select value={formData.parentId || '_none'} onValueChange={v => setFormData({ ...formData, parentId: v === '_none' ? null : v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Nenhum (raiz) —</SelectItem>
                    {dreCategories.filter(c => !c.parentId).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>)}
            {dialogType === 'bank' && (<>
              {fld('name', 'Nome da Conta')} {fld('bankName', 'Nome do Banco')} {fld('bankCode', 'Código do Banco')}
              <div className="grid grid-cols-2 gap-3">{fld('agency', 'Agência')}{fld('accountNumber', 'Número da Conta')}</div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Tipo de Conta</Label>
                <Select value={formData.accountType || 'corrente'} onValueChange={v => setFormData({ ...formData, accountType: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="corrente">Corrente</SelectItem><SelectItem value="poupanca">Poupança</SelectItem><SelectItem value="investimento">Investimento</SelectItem></SelectContent>
                </Select>
              </div>
              {fld('initialBalance', 'Saldo Inicial (R$)')} {fld('pixKey', 'Chave PIX')} {fld('notes', 'Observações')}
            </>)}
            {dialogType === 'cost' && (<>{fld('code', 'Código')}{fld('name', 'Nome')}{fld('description', 'Descrição')}</>)}
            {dialogType === 'chart' && (<>
              {fld('code', 'Código (ex: 1.1.01)')}{fld('name', 'Nome')}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Natureza</Label>
                  <Select value={formData.nature || 'analitica'} onValueChange={v => setFormData({ ...formData, nature: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="analitica">Analítica</SelectItem><SelectItem value="sintetica">Sintética</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Tipo</Label>
                  <Select value={formData.type || 'despesa'} onValueChange={v => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </>)}
            {dialogType === 'cash' && (<>{fld('name', 'Nome do Caixa')}{fld('description', 'Descrição')}{fld('responsibleName', 'Responsável')}{fld('balance', 'Saldo Inicial (R$)')}</>)}
            {dialogType === 'method' && (<>{fld('name', 'Nome (ex: PIX, Boleto)')}{fld('code', 'Código')}{fld('defaultFeePercent', 'Taxa padrão (%)')}</>)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
