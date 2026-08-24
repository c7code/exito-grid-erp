import { useState, useEffect, useCallback } from "react";
import { api } from "@/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  CheckSquare, Square, Plus, Trash2, Pencil,
  RefreshCw, Calendar, ChevronDown, ChevronUp,
  Star, AlertTriangle, ArrowDown, Clipboard,
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  high:   { label: "Alta",   color: "text-red-500",    icon: AlertTriangle },
  medium: { label: "Média",  color: "text-amber-500",  icon: Star },
  low:    { label: "Baixa",  color: "text-slate-400",  icon: ArrowDown },
};
const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  task:  { label: "Tarefa",     color: "bg-blue-100 text-blue-700" },
  note:  { label: "Anotação",   color: "bg-amber-100 text-amber-700" },
  check: { label: "Verificação", color: "bg-green-100 text-green-700" },
  alert: { label: "Alerta",     color: "bg-red-100 text-red-700" },
};

const todayStr = () => new Date().toISOString().substring(0, 10);
const fmtDate = (d: string) => {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
};

const defaultItem = { description: "", type: "task", priority: "medium", notes: "" };

export default function DailyChecklist() {
  const [checklist, setChecklist] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [historyDetail, setHistoryDetail] = useState<Record<string, any>>({});
  const [showHistory, setShowHistory] = useState(false);

  // New item
  const [addOpen, setAddOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ ...defaultItem });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Inline text add
  const [quickText, setQuickText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [today, hist] = await Promise.all([
        api.getDailyChecklistToday(),
        api.getDailyChecklists(),
      ]);
      setChecklist(today);
      setHistory(hist.filter((h: any) => h.date !== todayStr()));
    } catch { toast.error("Erro ao carregar checklist"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleItem(itemId: string) {
    try {
      const updated = await api.toggleDailyChecklistItem(itemId);
      setChecklist((prev: any) => ({
        ...prev,
        items: prev.items.map((i: any) => i.id === itemId ? updated : i),
      }));
    } catch { toast.error("Erro ao atualizar item"); }
  }

  async function addQuick() {
    if (!quickText.trim()) return;
    try {
      const item = await api.addDailyChecklistItem(checklist.id, {
        description: quickText.trim(), type: "task", priority: "medium",
      });
      setChecklist((prev: any) => ({ ...prev, items: [...prev.items, item] }));
      setQuickText("");
    } catch { toast.error("Erro ao adicionar item"); }
  }

  async function saveItem() {
    if (!itemForm.description.trim()) { toast.error("Descrição obrigatória"); return; }
    setSaving(true);
    try {
      if (editingItem) {
        const updated = await api.updateDailyChecklistItem(editingItem.id, itemForm);
        setChecklist((prev: any) => ({
          ...prev,
          items: prev.items.map((i: any) => i.id === editingItem.id ? updated : i),
        }));
        toast.success("Item atualizado!");
      } else {
        const item = await api.addDailyChecklistItem(checklist.id, itemForm);
        setChecklist((prev: any) => ({ ...prev, items: [...prev.items, item] }));
        toast.success("Item adicionado!");
      }
      setAddOpen(false); setEditingItem(null); setItemForm({ ...defaultItem });
    } catch { toast.error("Erro ao salvar item"); }
    setSaving(false);
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Excluir este item?")) return;
    try {
      await api.deleteDailyChecklistItem(itemId);
      setChecklist((prev: any) => ({ ...prev, items: prev.items.filter((i: any) => i.id !== itemId) }));
    } catch { toast.error("Erro ao excluir"); }
  }

  function openEdit(item: any) {
    setEditingItem(item);
    setItemForm({ description: item.description, type: item.type, priority: item.priority, notes: item.notes || "" });
    setAddOpen(true);
  }

  async function loadHistoryDetail(id: string) {
    if (historyDetail[id]) { setExpandedHistory(expandedHistory === id ? null : id); return; }
    try {
      const d = await api.getDailyChecklist(id);
      setHistoryDetail(prev => ({ ...prev, [id]: d }));
      setExpandedHistory(id);
    } catch {}
  }

  const items = checklist?.items || [];
  const doneCount = items.filter((i: any) => i.done).length;
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clipboard className="w-7 h-7 text-violet-500" /> Checklist Diário
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 capitalize">
            {checklist ? fmtDate(checklist.date) : "Carregando..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { setEditingItem(null); setItemForm({ ...defaultItem }); setAddOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Adicionar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-violet-400" /></div>
      ) : (
        <>
          {/* Progress card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">{doneCount} de {items.length} concluídos</span>
              <span className="text-lg font-bold text-violet-600">{pct}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-violet-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct === 100 && items.length > 0 && (
              <p className="text-center text-emerald-600 font-semibold text-sm mt-2">🎉 Todos os itens concluídos!</p>
            )}
          </Card>

          {/* Quick add */}
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar tarefa rápida... (Enter para salvar)"
              value={quickText}
              onChange={e => setQuickText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addQuick(); }}
              className="flex-1"
            />
            <Button variant="outline" onClick={addQuick} disabled={!quickText.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Items */}
          <Card className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="p-12 text-center">
                <CheckSquare className="w-14 h-14 mx-auto mb-3 text-slate-200" />
                <p className="text-slate-500 font-medium">Nenhum item no checklist de hoje</p>
                <p className="text-sm text-slate-400 mt-1">Adicione tarefas ou anotações acima</p>
              </div>
            ) : (
              // Sort: pending first (by priority), then done
              [...items]
                .sort((a: any, b: any) => {
                  if (a.done !== b.done) return a.done ? 1 : -1;
                  const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
                  return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
                })
                .map((item: any) => {
                  const PriorityIcon = PRIORITY_CONFIG[item.priority]?.icon;
                  const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                  return (
                    <div key={item.id} className={`flex items-start gap-3 px-4 py-3 transition-colors group ${item.done ? "bg-slate-50/50" : "hover:bg-slate-50"}`}>
                      <button className="mt-0.5 shrink-0" onClick={() => toggleItem(item.id)}>
                        {item.done
                          ? <CheckSquare className="w-5 h-5 text-emerald-500" />
                          : <Square className="w-5 h-5 text-slate-300 group-hover:text-violet-400 transition-colors" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${item.done ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {item.description}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeConf.color}`}>
                            {typeConf.label}
                          </span>
                          {PriorityIcon && !item.done && (
                            <PriorityIcon className={`w-3.5 h-3.5 ${PRIORITY_CONFIG[item.priority]?.color}`} />
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>
                        )}
                        {item.done && item.completedAt && (
                          <p className="text-[10px] text-emerald-500 mt-0.5">
                            Concluído às {new Date(item.completedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5 text-blue-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  );
                })
            )}
          </Card>

          {/* Histórico */}
          <div>
            <Button variant="ghost" className="w-full text-slate-500 text-sm" onClick={() => setShowHistory(!showHistory)}>
              <Calendar className="w-4 h-4 mr-2" />
              {showHistory ? "Ocultar" : "Ver"} histórico ({history.length} dias anteriores)
              {showHistory ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>

            {showHistory && (
              <div className="mt-2 space-y-2">
                {history.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-4">Nenhum histórico ainda</p>
                )}
                {history.map((h: any) => (
                  <Card key={h.id} className="overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => loadHistoryDetail(h.id)}
                    >
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-700 flex-1 capitalize">{fmtDate(h.date)}</span>
                      <span className="text-xs text-slate-400">{h.title}</span>
                      {expandedHistory === h.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                    {expandedHistory === h.id && historyDetail[h.id] && (
                      <div className="border-t border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
                        {(historyDetail[h.id].items || []).length === 0 ? (
                          <p className="text-center text-slate-400 text-xs py-3">Sem itens</p>
                        ) : (
                          (historyDetail[h.id].items || []).map((item: any) => (
                            <div key={item.id} className="flex items-center gap-2 px-4 py-2">
                              {item.done
                                ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                                : <Square className="w-4 h-4 text-slate-300 shrink-0" />
                              }
                              <span className={`text-sm ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                                {item.description}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { if (!v) { setAddOpen(false); setEditingItem(null); setItemForm({ ...defaultItem }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Descrição *</Label>
              <Textarea
                value={itemForm.description}
                onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Descreva a tarefa ou anotação..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={itemForm.type} onValueChange={v => setItemForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">✅ Tarefa</SelectItem>
                    <SelectItem value="note">📝 Anotação</SelectItem>
                    <SelectItem value="check">🔍 Verificação</SelectItem>
                    <SelectItem value="alert">⚠️ Alerta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={itemForm.priority} onValueChange={v => setItemForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 Alta</SelectItem>
                    <SelectItem value="medium">🟡 Média</SelectItem>
                    <SelectItem value="low">🟢 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                value={itemForm.notes}
                onChange={e => setItemForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Detalhes adicionais..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditingItem(null); }}>Cancelar</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={saveItem} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : null}
              {editingItem ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
