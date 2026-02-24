import { useState, useMemo, useCallback } from 'react';
import {
    AlertTriangle, Eye, EyeOff, Calculator, TrendingUp,
    Star, Award, Filter, ChevronDown, ChevronUp,
    Sliders, Mail, MessageSquare, Printer, Download, CheckSquare,
    CreditCard, ToggleLeft, ToggleRight, Target, Zap,
    ThumbsUp, ArrowRight,
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts';
import type { SimInputs, Condition } from './financeTypes';
import { fmt } from './financeTypes';
import { simulate, findIdealCondition } from './financeEngine';
import { buildWhatsAppText, buildEmailText, buildEmailSubject, buildPrintHTML } from './financeExport';




// â”€â”€â”€ Gauge Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MarginGauge({ value }: { value: number }) {
    const color = value >= 30 ? '#22c55e' : value >= 15 ? '#eab308' : '#ef4444';
    const label = value >= 30 ? 'Excelente' : value >= 15 ? 'Aceitável' : 'Baixa';
    const pct = Math.min(Math.max(value, 0), 60);
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-24 h-12">
                <svg viewBox="0 0 100 55" className="w-full h-full">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" stroke="#374151" strokeWidth="10" fill="none" />
                    <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        stroke={color}
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${(pct / 60) * 125.6} 125.6`}
                    />
                </svg>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-mono font-bold" style={{ color }}>
                    {value.toFixed(1)}%
                </span>
            </div>
            <span className="text-xs" style={{ color }}>{label}</span>
        </div>
    );
}

// â”€â”€â”€ Sparkline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Sparkline({ data }: { data: { month: number; cumulative: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="cumulative" stroke="#06b6d4" strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// â”€â”€â”€ Select helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DarkSelect({ value, onChange, children }: {
    value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
        >
            {children}
        </select>
    );
}

function DarkInput({ label, value, onChange, prefix, step = '1', min = '0' }: {
    label: string; value: number; onChange: (v: number) => void;
    prefix?: string; step?: string; min?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
                <input
                    type="number"
                    step={step}
                    min={min}
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value) || 0)}
                    className={`bg-gray-800 border border-gray-600 text-cyan-300 font-mono rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full ${prefix ? 'pl-8 pr-3' : 'px-3'}`}
                />
            </div>
        </div>
    );
}

// â”€â”€â”€ Type badges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TYPE_COLOR: Record<string, string> = {
    avista: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    entrada: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    total: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    leasing: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    personalizado: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    capacidade: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    antecipacao: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

const TYPE_LABEL: Record<string, string> = {
    avista: 'À Vista',
    entrada: 'Entrada',
    total: 'Tabela Price',
    leasing: 'Leasing',
    personalizado: 'Custom',
    capacidade: 'Capacidade',
    antecipacao: 'Antecipação',
};

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function FinanceSimulator() {
    const [inputs, setInputs] = useState<SimInputs>({
        serviceDescription: 'Locação de Munck — Serviço Elétrico',
        custoImediato: 4000,
        custoTotal: 8500,
        profitMargin: 35,
        quantity: 1,
        correctionIndex: 'CDI',
        customRate: 1.0,
        atSightDiscount: 5,
        leasingSpread: 0.5,
        customEntry: 4500,
        customInstallments: 6,
        // Composição de entrada
        entryPayments: [{ method: 'pix' as const, amount: 0, taxa: 0 }],
        // Antecipação
        parcelasAntecipadas: 0,
        descontoAntecipacao: 50,
        // Intercaladas extras
        intercaladaEnabled: false,
        intercaladaValor: 500,
        intercaladaMeses: '6,12',
        intercaladaDescontoIndice: 50,
        // Margem e Capacidade
        margemMinima: 15,
        capacidadeEnabled: false,
        capacidadeMaxParcela: 500,
        capacidadeCartao: false,
        capacidadeTaxaCartao: 1.99,
        capacidadeIntercalada: 1,
        // Perfil do Cliente
        perfilEnabled: false,
        perfilParcelasDesejadas: 8,
        perfilOrcamentoMensal: 1200,
        perfilEntradaDisponivel: 5000,
        perfilPrefereCartao: false,
        // Motor Reverso
        reversoEnabled: false,
        reversoMaxParcela: 1200,
        reversoEntradaDisponivel: 5000,
        reversoAceitaIntercaladas: true,
        // Score Bilateral
        scorePesoCliente: 50,
    });

    const [viewMode, setViewMode] = useState<'internal' | 'client'>('internal');
    const [selectedId, setSelectedId] = useState<string | null>('avista');
    const [filterType, setFilterType] = useState<string>('all');
    const [showInputs, setShowInputs] = useState(true);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const toggleChecked = useCallback((id: string) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const upd = useCallback(<K extends keyof SimInputs>(key: K, val: SimInputs[K]) => {
        setInputs(prev => ({ ...prev, [key]: val }));
    }, []);

    const conditions = useMemo(() => simulate(inputs), [inputs]);

    const filteredConditions = useMemo(() =>
        filterType === 'all' ? conditions : conditions.filter(c => c.type === filterType),
        [conditions, filterType]);

    const bestClientTotal = useMemo(() =>
        Math.min(...conditions.map(c => c.totalClient)), [conditions]);

    const bestMarginId = useMemo(() => {
        const best = conditions.reduce((a, b) => a.effectiveMargin > b.effectiveMargin ? a : b);
        return best.id;
    }, [conditions]);

    const selectedCondition = conditions.find(c => c.id === selectedId);

    const basePrice = inputs.custoTotal * inputs.quantity / (1 - inputs.profitMargin / 100);
    const grossProfit = basePrice - inputs.custoTotal * inputs.quantity;

    const checkedConditions = useMemo(() =>
        conditions.filter(c => checkedIds.has(c.id)), [conditions, checkedIds]);

    const recommendation = useMemo(() => {
        if (!inputs.perfilEnabled) return null;
        return findIdealCondition(
            conditions,
            inputs.perfilParcelasDesejadas,
            inputs.perfilOrcamentoMensal,
            inputs.perfilEntradaDisponivel,
            inputs.perfilPrefereCartao,
            inputs.margemMinima,
        );
    }, [conditions, inputs.perfilEnabled, inputs.perfilParcelasDesejadas, inputs.perfilOrcamentoMensal, inputs.perfilEntradaDisponivel, inputs.perfilPrefereCartao, inputs.margemMinima]);

    const handleWhatsApp = useCallback(() => {
        const conds = checkedConditions.length > 0 ? checkedConditions : (selectedCondition ? [selectedCondition] : []);
        if (conds.length === 0) return;
        const text = buildWhatsAppText(conds, inputs.serviceDescription);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }, [checkedConditions, selectedCondition, inputs.serviceDescription]);

    const handleEmail = useCallback(() => {
        const conds = checkedConditions.length > 0 ? checkedConditions : (selectedCondition ? [selectedCondition] : []);
        if (conds.length === 0) return;
        const text = buildEmailText(conds, inputs.serviceDescription);
        const subject = buildEmailSubject(inputs.serviceDescription);
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, '_blank');
    }, [checkedConditions, selectedCondition, inputs.serviceDescription]);

    const handlePrint = useCallback(() => {
        const conds = checkedConditions.length > 0 ? checkedConditions : (selectedCondition ? [selectedCondition] : []);
        if (conds.length === 0) return;
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(buildPrintHTML(conds, inputs.serviceDescription));
        w.document.close();
        w.print();
    }, [checkedConditions, selectedCondition, inputs.serviceDescription]);

    const handleSavePDF = useCallback(() => { handlePrint(); }, [handlePrint]);

    // old buildCommercialText removed — now using persuasive export system

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 -m-6 p-3 sm:p-6">
            {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex flex-col gap-3 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                        <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Simulador de Investimento</h1>
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] sm:text-xs font-mono rounded-full border border-yellow-500/30">
                            MUNCK ERP
                        </span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{inputs.serviceDescription || 'Configure os inputs abaixo'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Toggle visÃ£o */}
                    <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('internal')}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'internal' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Interna
                        </button>
                        <button
                            onClick={() => setViewMode('client')}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'client' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Cliente
                        </button>
                    </div>
                    <button
                        onClick={() => setShowInputs(v => !v)}
                        className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm text-gray-300 transition-colors"
                    >
                        <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {showInputs ? 'Ocultar' : 'Mostrar'}
                        {showInputs ? <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                    </button>
                </div>
            </div>

            {/* â”€â”€ Alerta visÃ£o interna â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {viewMode === 'internal' && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-red-950 border border-red-700 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 mb-5 text-red-300 text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                    <span className="font-semibold uppercase tracking-wide">Visão Interna â€” NÃƒO COMPARTILHAR</span>
                    <span className="text-red-400 hidden sm:inline">• Exibe custos, margens e lucros diferenciados</span>
                </div>
            )}

            {/* â”€â”€ Inputs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {showInputs && (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-5 mb-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-semibold text-gray-200 uppercase tracking-wider">ParÃ¢metros do ServiÃ§o</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
                        <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">DescriÃ§Ã£o do ServiÃ§o</label>
                            <input
                                type="text"
                                value={inputs.serviceDescription}
                                onChange={e => upd('serviceDescription', e.target.value)}
                                className="bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Ex: LocaÃ§Ã£o de Munck â€” Obra XYZ"
                            />
                        </div>
                        <DarkInput label="Quantidade" value={inputs.quantity} onChange={v => upd('quantity', v)} min="1" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                        <DarkInput label="Custo Imediato" value={inputs.custoImediato} onChange={v => upd('custoImediato', v)} prefix="R$" step="100" />
                        <DarkInput label="Custo Total" value={inputs.custoTotal} onChange={v => upd('custoTotal', Math.max(v, inputs.custoImediato))} prefix="R$" step="100" />
                        <DarkInput label="Margem de Lucro" value={inputs.profitMargin} onChange={v => upd('profitMargin', Math.min(v, 95))} prefix="%" step="0.5" />
                        <DarkInput label="Desconto À Vista (sobre lucro)" value={inputs.atSightDiscount} onChange={v => upd('atSightDiscount', v)} prefix="%" step="0.5" />
                        <DarkInput label="Spread Leasing" value={inputs.leasingSpread} onChange={v => upd('leasingSpread', v)} prefix="%" step="0.1" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Índice de Correção</label>
                            <DarkSelect value={inputs.correctionIndex} onChange={v => upd('correctionIndex', v as SimInputs['correctionIndex'])}>
                                <option value="CDI">CDI (~0.87% a.m.)</option>
                                <option value="SELIC">SELIC (~0.87% a.m.)</option>
                                <option value="IPCA">IPCA (~0.38% a.m.)</option>
                                <option value="fixed">Taxa Fixa</option>
                            </DarkSelect>
                        </div>
                        {inputs.correctionIndex === 'fixed' && (
                            <DarkInput label="Taxa Fixa (% a.m.)" value={inputs.customRate} onChange={v => upd('customRate', v)} prefix="%" step="0.1" />
                        )}
                        <DarkInput label="Entrada Personalizada" value={inputs.customEntry} onChange={v => upd('customEntry', v)} prefix="R$" step="100" />
                        <DarkInput label="Parcelas (Personalizado)" value={inputs.customInstallments} onChange={v => upd('customInstallments', Math.max(1, v))} min="1" />
                        <DarkInput label="Margem Mínima (%)" value={inputs.margemMinima} onChange={v => upd('margemMinima', Math.max(0, v))} prefix="%" step="1" />
                    </div>

                    {/* ── Composição de Custos ─────────────────── */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Composição de Custos</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-800/40 border border-gray-700 rounded-lg p-3">
                            <div className="flex flex-col gap-1 justify-center">
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Custo Imediato</label>
                                <p className="font-mono text-yellow-300 text-sm">R$ {fmt(inputs.custoImediato)}</p>
                                <p className="text-[10px] text-gray-500">Deve ser coberto pela entrada</p>
                            </div>
                            <div className="flex flex-col gap-1 justify-center">
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Custo Total</label>
                                <p className="font-mono text-rose-300 text-sm">R$ {fmt(inputs.custoTotal * inputs.quantity)}</p>
                            </div>
                            <div className="flex flex-col gap-1 justify-center">
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Preço Base (c/ margem)</label>
                                <p className="font-mono text-emerald-300 text-sm">R$ {fmt(basePrice)}</p>
                            </div>
                        </div>
                    </div>



                    {/* â”€â”€ Antecipação de Parcelas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="mt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 bg-gray-800/40 border border-gray-700 rounded-lg p-3 sm:p-4">
                            <div className="col-span-full flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-pink-400" />
                                <span className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Antecipação de Parcelas</span>
                                <p className="text-xs text-gray-500 ml-2">Desconto no Ã­ndice para parcelas antecipadas</p>
                            </div>
                            <DarkInput
                                label="Parcelas Antecipadas"
                                value={inputs.parcelasAntecipadas}
                                onChange={v => upd('parcelasAntecipadas', Math.max(0, Math.floor(v)))}
                                min="0"
                            />
                            <DarkInput
                                label="Desconto no Ãndice (%)"
                                value={inputs.descontoAntecipacao}
                                onChange={v => upd('descontoAntecipacao', Math.max(0, Math.min(100, v)))}
                                prefix="%"
                                step="5"
                            />
                        </div>
                    </div>

                    {/* â”€â”€ Parcelas Intercaladas Extras â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="mt-3">
                        <button
                            onClick={() => upd('intercaladaEnabled', !inputs.intercaladaEnabled)}
                            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border transition-all ${inputs.intercaladaEnabled
                                ? 'bg-violet-950/40 border-violet-700/50 text-violet-300'
                                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                                }`}
                        >
                            {inputs.intercaladaEnabled
                                ? <ToggleRight className="w-5 h-5 text-violet-400" />
                                : <ToggleLeft className="w-5 h-5" />
                            }
                            <div>
                                <span className="text-sm font-semibold uppercase tracking-wider">Parcelas Intercaladas Extras</span>
                                <p className="text-xs text-gray-500 mt-0.5">Parcelas extras em meses especÃ­ficos (ex: 13Âº salÃ¡rio)</p>
                            </div>
                            {inputs.intercaladaEnabled && (
                                <span className="ml-auto px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs font-mono rounded-full border border-violet-500/30">
                                    ATIVO
                                </span>
                            )}
                        </button>

                        {inputs.intercaladaEnabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-3 animate-in slide-in-from-top-2">
                                <DarkInput
                                    label="Valor da Intercalada"
                                    value={inputs.intercaladaValor}
                                    onChange={v => upd('intercaladaValor', Math.max(0, v))}
                                    prefix="R$"
                                    step="50"
                                />
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">Meses (ex: 6,12)</label>
                                    <input
                                        type="text"
                                        value={inputs.intercaladaMeses}
                                        onChange={e => upd('intercaladaMeses', e.target.value)}
                                        className="bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder="6,12"
                                    />
                                </div>
                                <DarkInput
                                    label="Desconto Ãndice (%)"
                                    value={inputs.intercaladaDescontoIndice}
                                    onChange={v => upd('intercaladaDescontoIndice', Math.max(0, Math.min(100, v)))}
                                    prefix="%"
                                    step="5"
                                />
                            </div>
                        )}
                    </div>

                    {/* â”€â”€ Capacidade de Pagamento do Cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="mt-3 pt-4 border-t border-gray-700">
                        <button
                            onClick={() => upd('capacidadeEnabled', !inputs.capacidadeEnabled)}
                            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border transition-all ${inputs.capacidadeEnabled
                                ? 'bg-orange-950/40 border-orange-700/50 text-orange-300'
                                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                                }`}
                        >
                            {inputs.capacidadeEnabled
                                ? <ToggleRight className="w-5 h-5 text-orange-400" />
                                : <ToggleLeft className="w-5 h-5" />
                            }
                            <div>
                                <span className="text-sm font-semibold uppercase tracking-wider">Capacidade de Pagamento do Cliente</span>
                                <p className="text-xs text-gray-500 mt-0.5">Calcula parcelas com base no mÃ¡ximo que o cliente pode pagar por mÃªs</p>
                            </div>
                            {inputs.capacidadeEnabled && (
                                <span className="ml-auto px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-mono rounded-full border border-orange-500/30">
                                    ATIVO
                                </span>
                            )}
                        </button>

                        {inputs.capacidadeEnabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-3 animate-in slide-in-from-top-2">
                                <DarkInput
                                    label="Parcela MÃ¡xima do Cliente"
                                    value={inputs.capacidadeMaxParcela}
                                    onChange={v => upd('capacidadeMaxParcela', Math.max(1, v))}
                                    prefix="R$"
                                    step="50"
                                />
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">FrequÃªncia</label>
                                    <DarkSelect
                                        value={String(inputs.capacidadeIntercalada)}
                                        onChange={v => upd('capacidadeIntercalada', parseInt(v) || 1)}
                                    >
                                        <option value="1">Mensal</option>
                                        <option value="2">Bimestral (a cada 2m)</option>
                                        <option value="3">Trimestral (a cada 3m)</option>
                                        <option value="6">Semestral (a cada 6m)</option>
                                    </DarkSelect>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">CartÃ£o de CrÃ©dito?</label>
                                    <button
                                        onClick={() => upd('capacidadeCartao', !inputs.capacidadeCartao)}
                                        className={`flex items-center gap-2 h-[38px] rounded-lg border px-3 text-sm transition-all ${inputs.capacidadeCartao
                                            ? 'bg-orange-900/40 border-orange-600/50 text-orange-300'
                                            : 'bg-gray-800 border-gray-600 text-gray-400'
                                            }`}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        {inputs.capacidadeCartao ? 'Sim' : 'NÃ£o'}
                                    </button>
                                </div>
                                {inputs.capacidadeCartao && (
                                    <DarkInput
                                        label="Taxa CartÃ£o (% a.m.)"
                                        value={inputs.capacidadeTaxaCartao}
                                        onChange={v => upd('capacidadeTaxaCartao', Math.max(0, v))}
                                        prefix="%"
                                        step="0.1"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Summary bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-700">
                        <div className="bg-gray-800 rounded-lg p-2.5 sm:p-3 text-center flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-center">
                            <p className="text-xs text-gray-400 sm:mb-1">Preço Base</p>
                            <p className="font-mono font-bold text-white text-base sm:text-lg">R$ {fmt(basePrice)}</p>
                        </div>
                        <div className="bg-rose-950/50 border border-rose-800/30 rounded-lg p-2.5 sm:p-3 text-center flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-center">
                            <p className="text-xs text-gray-400 sm:mb-1">Custo Total</p>
                            <p className="font-mono font-bold text-rose-400 text-base sm:text-lg">R$ {fmt(inputs.custoTotal * inputs.quantity)}</p>
                        </div>
                        <div className="bg-emerald-950/50 border border-emerald-800/30 rounded-lg p-2.5 sm:p-3 text-center flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-center">
                            <p className="text-xs text-gray-400 sm:mb-1">Lucro Bruto</p>
                            <p className="font-mono font-bold text-emerald-400 text-base sm:text-lg">R$ {fmt(grossProfit)}</p>
                        </div>
                    </div>

                    {/* â”€â”€ Perfil do Cliente (Recomendação Inteligente) â”€â”€â”€â”€ */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <button
                            onClick={() => upd('perfilEnabled', !inputs.perfilEnabled)}
                            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border transition-all ${inputs.perfilEnabled
                                ? 'bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border-amber-600/50 text-amber-200'
                                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                                }`}
                        >
                            {inputs.perfilEnabled
                                ? <ToggleRight className="w-5 h-5 text-amber-400" />
                                : <ToggleLeft className="w-5 h-5" />
                            }
                            <div>
                                <span className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Perfil do Cliente â€” Recomendação Inteligente
                                </span>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Informe as necessidades do cliente e o sistema encontra a condiÃ§Ã£o ideal mantendo sua margem
                                </p>
                            </div>
                            {inputs.perfilEnabled && (
                                <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-mono rounded-full border border-amber-500/30 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> ATIVO
                                </span>
                            )}
                        </button>

                        {inputs.perfilEnabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-3 animate-in slide-in-from-top-2">
                                <DarkInput
                                    label="Parcelas Desejadas"
                                    value={inputs.perfilParcelasDesejadas}
                                    onChange={v => upd('perfilParcelasDesejadas', Math.max(0, Math.floor(v)))}
                                    min="0"
                                />
                                <DarkInput
                                    label="OrÃ§amento Mensal MÃ¡x."
                                    value={inputs.perfilOrcamentoMensal}
                                    onChange={v => upd('perfilOrcamentoMensal', Math.max(0, v))}
                                    prefix="R$"
                                    step="50"
                                />
                                <DarkInput
                                    label="Entrada DisponÃ­vel"
                                    value={inputs.perfilEntradaDisponivel}
                                    onChange={v => upd('perfilEntradaDisponivel', Math.max(0, v))}
                                    prefix="R$"
                                    step="100"
                                />
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">Prefere CartÃ£o?</label>
                                    <button
                                        onClick={() => upd('perfilPrefereCartao', !inputs.perfilPrefereCartao)}
                                        className={`flex items-center gap-2 h-[38px] rounded-lg border px-3 text-sm transition-all ${inputs.perfilPrefereCartao
                                            ? 'bg-amber-900/40 border-amber-600/50 text-amber-300'
                                            : 'bg-gray-800 border-gray-600 text-gray-400'
                                            }`}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        {inputs.perfilPrefereCartao ? 'Sim' : 'NÃ£o'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* â”€â”€ Filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap scrollbar-hide">
                <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                {['all', 'avista', 'entrada', 'antecipacao', 'total', 'leasing', 'personalizado', 'capacidade'].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0 ${filterType === t
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400'
                            }`}
                    >
                        {t === 'all' ? 'Todas' : TYPE_LABEL[t]}
                    </button>
                ))}
                <span className="ml-auto text-xs text-gray-500 flex-shrink-0">{filteredConditions.length} condiÃ§Ãµes</span>
            </div>

            {/* â”€â”€ Export Action Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {checkedIds.size > 0 && (
                <div className="mb-4 bg-cyan-950/40 border border-cyan-700/50 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-cyan-300 text-xs sm:text-sm font-medium mb-2 sm:mb-0">
                        <CheckSquare className="w-4 h-4" />
                        {checkedIds.size} selecionada(s)
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                        <button onClick={handleWhatsApp} className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors">
                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> WhatsApp
                        </button>
                        <button onClick={handleEmail} className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors">
                            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> E-mail
                        </button>
                        <button onClick={handlePrint} className="flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors">
                            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Imprimir
                        </button>
                        <button onClick={handleSavePDF} className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors">
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> PDF
                        </button>
                    </div>
                </div>
            )}

            {/* â”€â”€ Condição Ideal Recomendada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {recommendation && (
                <div className="mb-6 relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/50 via-gray-900 to-yellow-950/30 shadow-2xl shadow-amber-500/10">
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="relative p-4 sm:p-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-5">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-white">Condição Ideal Recomendada</h3>
                                    <p className="text-[10px] sm:text-xs text-amber-400/80">Otimizada para o perfil do cliente Ã— margem da empresa</p>
                                </div>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full border font-semibold self-start sm:self-auto ${TYPE_COLOR[recommendation.ideal.type]}`}>
                                {TYPE_LABEL[recommendation.ideal.type]}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
                            {/* Ideal condition details */}
                            <div className="lg:col-span-2">
                                <div className="bg-gray-900/80 border border-amber-700/30 rounded-xl p-3 sm:p-5">
                                    <p className="font-bold text-lg sm:text-xl text-white mb-1">{recommendation.ideal.label}</p>
                                    <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">{recommendation.ideal.detail}</p>

                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                                        {recommendation.ideal.entry > 0 && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                                                <p className="text-xs text-yellow-400/70 mb-1">Entrada</p>
                                                <p className="font-mono font-bold text-yellow-300">R$ {fmt(recommendation.ideal.entry)}</p>
                                            </div>
                                        )}
                                        {recommendation.ideal.installmentAmount > 0 && (
                                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                                                <p className="text-xs text-cyan-400/70 mb-1">{recommendation.ideal.installments}x de</p>
                                                <p className="font-mono font-bold text-cyan-300">R$ {fmt(recommendation.ideal.installmentAmount)}</p>
                                            </div>
                                        )}
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                                            <p className="text-xs text-gray-400 mb-1">Total Cliente</p>
                                            <p className="font-mono font-bold text-white">R$ {fmt(recommendation.ideal.totalClient)}</p>
                                        </div>
                                        {viewMode === 'internal' && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                                                <p className="text-xs text-emerald-400/70 mb-1">Margem Ef.</p>
                                                <p className={`font-mono font-bold ${recommendation.ideal.effectiveMargin >= 25 ? 'text-emerald-400' : recommendation.ideal.effectiveMargin >= 15 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                                    {recommendation.ideal.effectiveMargin.toFixed(1)}%
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reasons */}
                                    <div className="flex flex-wrap gap-2">
                                        {recommendation.reasons.map((r: string, i: number) => (
                                            <span key={i} className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs px-2.5 py-1 rounded-full">
                                                <ThumbsUp className="w-3 h-3" /> {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Alternatives */}
                            {recommendation.alternatives.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Alternativas próximas</p>
                                    {recommendation.alternatives.map((alt: Condition) => (
                                        <button
                                            key={alt.id}
                                            onClick={() => setSelectedId(alt.id)}
                                            className="bg-gray-900/60 border border-gray-700 hover:border-amber-600/40 rounded-lg p-3 text-left transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-sm text-gray-200 group-hover:text-white transition-colors">{alt.label}</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-amber-400 transition-colors" />
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2 line-clamp-1">{alt.detail}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs text-gray-300">R$ {fmt(alt.totalClient)}</span>
                                                {viewMode === 'internal' && (
                                                    <span className={`font-mono text-xs ${alt.effectiveMargin >= 25 ? 'text-emerald-400' : alt.effectiveMargin >= 15 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                                        {alt.effectiveMargin.toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* â”€â”€ Cards Grid + Detail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredConditions.map(cond => {
                        const isBestClient = cond.totalClient === bestClientTotal;
                        const isBestMargin = cond.id === bestMarginId;
                        const isSelected = selectedId === cond.id;

                        return (
                            <div
                                key={cond.id}
                                className={`text-left bg-gray-900 rounded-xl border transition-all p-4 relative overflow-hidden group cursor-pointer ${isSelected
                                    ? 'border-cyan-500 shadow-cyan-500/20 shadow-lg'
                                    : 'border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                {/* Checkbox */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleChecked(cond.id); }}
                                    className={`absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-all z-10 ${checkedIds.has(cond.id)
                                        ? 'bg-cyan-500 border-cyan-500 text-white'
                                        : 'border-gray-500 hover:border-cyan-400'
                                        }`}
                                >
                                    {checkedIds.has(cond.id) && <CheckSquare className="w-3.5 h-3.5" />}
                                </button>

                                <div onClick={() => setSelectedId(cond.id)}>
                                    {/* Badges */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                        {viewMode === 'internal' && isBestMargin && (
                                            <span className="flex items-center gap-1 bg-emerald-900/80 border border-emerald-600/50 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                                                <Award className="w-3 h-3" /> Maior Margem
                                            </span>
                                        )}
                                        {viewMode === 'client' && isBestClient && (
                                            <span className="flex items-center gap-1 bg-yellow-900/80 border border-yellow-600/50 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                                                <Star className="w-3 h-3" /> Melhor Condição
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[cond.type]}`}>
                                            {TYPE_LABEL[cond.type]}
                                        </span>
                                    </div>
                                    <p className="font-bold text-white text-base mb-0.5">{cond.label}</p>
                                    <p className="text-xs text-gray-500 mb-3">{cond.detail}</p>

                                    {/* Client view */}
                                    {viewMode === 'client' ? (
                                        <div className="space-y-1">
                                            {cond.entry > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-yellow-400">Entrada</span>
                                                    <span className="font-mono text-yellow-300">R$ {fmt(cond.entry)}</span>
                                                </div>
                                            )}
                                            {cond.installmentAmount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-cyan-400">{cond.installments}x de</span>
                                                    <span className="font-mono text-cyan-300">R$ {fmt(cond.installmentAmount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-700">
                                                <span className="text-gray-200">Total</span>
                                                <span className="font-mono text-white">R$ {fmt(cond.totalClient)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        // Internal view
                                        <div className="space-y-1">
                                            {cond.entry > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-yellow-400">Entrada</span>
                                                    <span className="font-mono text-yellow-300">R$ {fmt(cond.entry)}</span>
                                                </div>
                                            )}
                                            {cond.installmentAmount > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-cyan-400">{cond.installments}x de</span>
                                                    <span className="font-mono text-cyan-300">R$ {fmt(cond.installmentAmount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xs">
                                                <span className="text-emerald-400">Lucro</span>
                                                <span className="font-mono text-emerald-300">R$ {fmt(cond.totalProfit)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold border-t border-gray-700 pt-1">
                                                <span className="text-white">Margem Ef.</span>
                                                <span className={`font-mono ${cond.effectiveMargin >= 30 ? 'text-emerald-400' : cond.effectiveMargin >= 15 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                                    {cond.effectiveMargin.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sparkline */}
                                    <div className="mt-2 opacity-70">
                                        <Sparkline data={cond.cashFlow} />
                                    </div>

                                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Detail Panel */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-5 h-fit lg:sticky lg:top-24">
                    {!selectedCondition ? (
                        <div className="text-center text-gray-500 py-8">
                            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Selecione uma condiÃ§Ã£o para ver detalhes</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-bold text-white text-lg">{selectedCondition.label}</p>
                                    <p className="text-xs text-gray-400">{selectedCondition.detail}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[selectedCondition.type]}`}>
                                    {TYPE_LABEL[selectedCondition.type]}
                                </span>
                            </div>

                            {/* Client section */}
                            <div className="bg-gray-800/60 border border-gray-600 rounded-lg p-4 mb-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> Proposta ao Cliente
                                </p>
                                <div className="space-y-2">
                                    {selectedCondition.entry > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-yellow-400">Entrada</span>
                                            <span className="font-mono font-bold text-yellow-300">R$ {fmt(selectedCondition.entry)}</span>
                                        </div>
                                    )}
                                    {selectedCondition.installmentAmount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-cyan-400">{selectedCondition.installments}x de</span>
                                            <span className="font-mono font-bold text-cyan-300">R$ {fmt(selectedCondition.installmentAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-gray-600 pt-2">
                                        <span className="text-sm font-semibold text-white">Total</span>
                                        <span className="font-mono font-bold text-white text-lg">R$ {fmt(selectedCondition.totalClient)}</span>
                                    </div>
                                    {selectedCondition.type === 'avista' && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-yellow-400">Desconto</span>
                                            <span className="font-mono text-yellow-300">
                                                R$ {fmt(basePrice - selectedCondition.totalClient)} ({((basePrice - selectedCondition.totalClient) / basePrice * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Internal section */}
                            {viewMode === 'internal' && (
                                <>
                                    <div className="bg-red-950/40 border border-red-800/30 rounded-lg p-4 mb-3">
                                        <p className="text-xs text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Eye className="w-3.5 h-3.5" /> Visão Interna
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-rose-400">Custo Recuperado</span>
                                                <span className="font-mono text-rose-300">R$ {fmt(selectedCondition.costRecovered)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-emerald-400">Lucro Total</span>
                                                <span className="font-mono text-emerald-300">R$ {fmt(selectedCondition.totalProfit)}</span>
                                            </div>
                                            {selectedCondition.immediateProfit > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-yellow-400">â”” Lucro Imediato</span>
                                                    <span className="font-mono text-yellow-300">R$ {fmt(selectedCondition.immediateProfit)}</span>
                                                </div>
                                            )}
                                            {selectedCondition.deferredProfit > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-purple-400">â”” Lucro Diferido</span>
                                                    <span className="font-mono text-purple-300">R$ {fmt(selectedCondition.deferredProfit)}</span>
                                                </div>
                                            )}
                                            {selectedCondition.correctionAmount > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-400">Correção Monetária</span>
                                                    <span className="font-mono text-gray-300">R$ {fmt(selectedCondition.correctionAmount)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Gauge */}
                                    <div className="flex items-center justify-between bg-gray-800/60 border border-gray-600 rounded-lg p-4 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Margem Efetiva</p>
                                            <p className="text-2xl font-mono font-bold text-white">{selectedCondition.effectiveMargin.toFixed(1)}%</p>
                                        </div>
                                        <MarginGauge value={selectedCondition.effectiveMargin} />
                                    </div>

                                    {/* Cash flow chart */}
                                    <div className="bg-gray-800/60 border border-gray-600 rounded-lg p-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Fluxo de Caixa Acumulado
                                        </p>
                                        <ResponsiveContainer width="100%" height={120}>
                                            <LineChart data={selectedCondition.cashFlow} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `M${v}`} />
                                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                                <Tooltip
                                                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                                                    formatter={(v: number) => [`R$ ${fmt(v)}`, 'Cumulativo']}
                                                    labelFormatter={(l: number) => `MÃªs ${l}`}
                                                />
                                                <Line type="monotone" dataKey="cumulative" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
