import { useState, useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, Plus, Trash2, RefreshCw,
  ChevronDown, ChevronUp, Loader2, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  alimentacao: { label: 'Alimentação', emoji: '🍱' },
  combustivel:  { label: 'Combustível', emoji: '⛽' },
  pedagio:      { label: 'Pedágio',     emoji: '🛣️' },
  manutencao:   { label: 'Manutenção',  emoji: '🔧' },
  imprevisto:   { label: 'Imprevisto',  emoji: '⚠️' },
  hospedagem:   { label: 'Hospedagem',  emoji: '🏨' },
  outro:        { label: 'Outro',       emoji: '📌' },
};

const PAID_BY: Record<string, { label: string; color: string }> = {
  empresa:  { label: 'Empresa pagou',              color: 'text-blue-600 bg-blue-50'   },
  operador: { label: 'Operador pagou (reembolso)', color: 'text-orange-600 bg-orange-50' },
};

const emptyForm = { category: 'alimentacao', description: '', amount: '', paidBy: 'empresa', notes: '' };

interface Props {
  rentalId: string;
  equipmentId: string;
  dailyLogId: string;   // vínculo à diária
  dailyDate: string;    // data para pré-popular expenseDate
  receita: number;      // totalValue da diária
}

export default function ExpensePanel({ rentalId, equipmentId, dailyLogId, dailyDate, receita }: Props) {
  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipmentExpenses(rentalId, dailyLogId);
      setExpenses(Array.isArray(data) ? data : []);
    } catch { setExpenses([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (open) load(); }, [open]);

  const totalDespesas = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const resultado = receita - totalDespesas;
  const pendentesReembolso = expenses.filter(e => e.paidBy === 'operador' && !e.reimbursed);

  async function addExpense() {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Informe o valor'); return; }
    setSaving(true);
    try {
      await api.addEquipmentExpense(rentalId, {
        equipmentId, dailyLogId,
        category: form.category,
        description: form.description || null,
        amount: Number(form.amount),
        paidBy: form.paidBy,
        expenseDate: dailyDate,
        notes: form.notes || null,
      });
      toast.success('Despesa registrada!');
      setForm({ ...emptyForm });
      setShowForm(false);
      load();
    } catch { toast.error('Erro ao salvar despesa'); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm('Excluir despesa?')) return;
    try { await api.deleteEquipmentExpense(id); toast.success('Removida'); load(); }
    catch { toast.error('Erro'); }
  }

  async function markReimbursed(id: string) {
    try { await api.markExpenseReimbursed(id); toast.success('Reembolso registrado!'); load(); }
    catch { toast.error('Erro'); }
  }

  const resultColor = resultado >= 0 ? 'text-emerald-700' : 'text-red-600';
  const badgePending = pendentesReembolso.length > 0;

  return (
    <div className="mt-1.5">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
          open ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
        }`}
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        💸 Custos
        {expenses.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-200 text-violet-800 text-[10px]">
            {expenses.length}
          </span>
        )}
        {badgePending && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-orange-200 text-orange-700 text-[10px]">
            ⟳ reembolso
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 border border-violet-200 rounded-xl bg-violet-50/40 overflow-hidden">
          {/* Resumo */}
          <div className="grid grid-cols-3 divide-x divide-violet-100 bg-white border-b border-violet-100">
            <div className="px-4 py-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Receita</p>
              <p className="text-sm font-bold text-emerald-700">{fmt(receita)}</p>
            </div>
            <div className="px-4 py-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Despesas</p>
              <p className="text-sm font-bold text-red-500">{fmt(totalDespesas)}</p>
            </div>
            <div className="px-4 py-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Resultado</p>
              <p className={`text-sm font-bold flex items-center justify-center gap-1 ${resultColor}`}>
                {resultado >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {fmt(resultado)}
              </p>
            </div>
          </div>

          {/* Lista de despesas */}
          <div className="p-3 space-y-1.5">
            {loading ? (
              <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-violet-400" /></div>
            ) : expenses.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-2">Nenhuma despesa registrada nesta diária.</p>
            ) : expenses.map(e => (
              <div key={e.id} className="flex items-center gap-2 bg-white rounded-lg border border-slate-100 px-3 py-2">
                <span className="text-base">{CATEGORIES[e.category]?.emoji || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700">
                    {CATEGORIES[e.category]?.label || e.category}
                    {e.description && <span className="text-slate-400 font-normal ml-1">— {e.description}</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PAID_BY[e.paidBy]?.color || ''}`}>
                      {PAID_BY[e.paidBy]?.label || e.paidBy}
                    </span>
                    {e.paidBy === 'operador' && e.reimbursed && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">✓ Reembolsado</span>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-800 shrink-0">{fmt(Number(e.amount))}</p>
                <div className="flex items-center gap-0.5">
                  {e.paidBy === 'operador' && !e.reimbursed && (
                    <button onClick={() => markReimbursed(e.id)}
                      className="p-1 rounded text-orange-500 hover:bg-orange-50 transition-colors" title="Marcar como reembolsado">
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  )}
                  <button onClick={() => remove(e.id)}
                    className="p-1 rounded text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Alerta reembolso pendente */}
            {badgePending && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-xs text-orange-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {pendentesReembolso.length} despesa(s) do operador pendente(s) de reembolso ({fmt(pendentesReembolso.reduce((s, e) => s + Number(e.amount), 0))})
              </div>
            )}

            {/* Formulário inline */}
            {showForm ? (
              <div className="bg-white border border-violet-200 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium uppercase">Categoria</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400">
                      {Object.entries(CATEGORIES).map(([k, v]) => (
                        <option key={k} value={k}>{v.emoji} {v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium uppercase">Valor (R$)</label>
                    <input type="number" step="0.01" value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0,00"
                      className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium uppercase">Descrição (opcional)</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Ex: Almoço operador + ajudante"
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium uppercase">Quem pagou?</label>
                  <div className="flex gap-2 mt-1">
                    {Object.entries(PAID_BY).map(([k, v]) => (
                      <button key={k}
                        onClick={() => setForm(f => ({ ...f, paidBy: k }))}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                          form.paidBy === k ? 'border-violet-400 bg-violet-100 text-violet-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => { setShowForm(false); setForm({ ...emptyForm }); }}
                    className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">
                    Cancelar
                  </button>
                  <button onClick={addExpense} disabled={saving}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    Registrar
                  </button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline"
                className="w-full text-xs border-dashed border-violet-300 text-violet-600 hover:bg-violet-50"
                onClick={() => setShowForm(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Despesa
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
