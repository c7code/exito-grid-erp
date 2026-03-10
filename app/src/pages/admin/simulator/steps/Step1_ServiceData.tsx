import React, { useState } from 'react';
import { Briefcase, DollarSign, TrendingUp, Clock, Shield, Settings2, Percent } from 'lucide-react';
import type { WizardInput } from '../engine/simulatorTypes';
import { INDEX_RATES } from '../../financeTypes';

interface Props {
  input: WizardInput;
  updateInput: <K extends keyof WizardInput>(key: K, value: WizardInput[K]) => void;
}

// ─── Index options ────────────────────────────────────────────────────────────
const INDEX_OPTIONS: { value: WizardInput['correctionIndex']; label: string; desc: string }[] = [
  { value: 'CDI', label: 'CDI', desc: `${INDEX_RATES['CDI']?.toFixed(2) ?? '0.87'}% a.m.` },
  { value: 'SELIC', label: 'SELIC', desc: `${INDEX_RATES['SELIC']?.toFixed(2) ?? '0.87'}% a.m.` },
  { value: 'IPCA', label: 'IPCA', desc: `${INDEX_RATES['IPCA']?.toFixed(2) ?? '0.38'}% a.m.` },
  { value: 'fixed', label: 'Taxa Fixa', desc: 'Definir manualmente' },
];

function CurrencyInput({ label, icon: Icon, value, onChange, placeholder, helper }: {
  label: string; icon: React.ElementType; value: number; onChange: (v: number) => void;
  placeholder?: string; helper?: string;
}) {
  const [display, setDisplay] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) {
      setDisplay(value === 0 ? '' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits || digits === '0') { setDisplay(''); onChange(0); return; }
    const reais = parseInt(digits, 10) / 100;
    setDisplay(reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    onChange(reais);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Icon className="w-4 h-4 text-cyan-400" />
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onFocus={(e) => { setFocused(true); setTimeout(() => e.target.select(), 0); }}
          onBlur={() => { setFocused(false); if (!display) onChange(0); }}
          placeholder={placeholder || '0,00'}
          className="w-full bg-gray-800/80 border border-gray-600 text-cyan-300 font-mono rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        />
      </div>
      {helper && <p className="text-xs text-gray-500 ml-1">{helper}</p>}
    </div>
  );
}

function NumberInput({ label, icon: Icon, value, onChange, suffix, helper, placeholder }: {
  label: string; icon: React.ElementType; value: number; onChange: (v: number) => void;
  suffix?: string; helper?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Icon className="w-4 h-4 text-cyan-400" />
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder || '0'}
          className="w-full bg-gray-800/80 border border-gray-600 text-cyan-300 font-mono rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-gray-600"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{suffix}</span>}
      </div>
      {helper && <p className="text-xs text-gray-500 ml-1">{helper}</p>}
    </div>
  );
}

function PercentInput({ label, icon: Icon, value, onChange, helper, placeholder }: {
  label: string; icon: React.ElementType; value: number; onChange: (v: number) => void;
  helper?: string; placeholder?: string;
}) {
  const [display, setDisplay] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) {
      setDisplay(value === 0 ? '' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits || digits === '0') { setDisplay(''); onChange(0); return; }
    const pct = parseInt(digits, 10) / 100;
    setDisplay(pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    onChange(pct);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Icon className="w-4 h-4 text-cyan-400" />
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onFocus={(e) => { setFocused(true); setTimeout(() => e.target.select(), 0); }}
          onBlur={() => { setFocused(false); }}
          placeholder={placeholder || '0,00'}
          className="w-full bg-gray-800/80 border border-gray-600 text-cyan-300 font-mono rounded-xl px-3 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">%</span>
      </div>
      {helper && <p className="text-xs text-gray-500 ml-1">{helper}</p>}
    </div>
  );
}

export default function Step1ServiceData({ input, updateInput }: Props) {
  const [marginMode, setMarginMode] = useState<'percent' | 'value'>('percent');
  const [marginValue, setMarginValue] = useState(0);

  const currentRate = input.correctionIndex === 'fixed'
    ? (input.customRate ?? 1.0)
    : (INDEX_RATES[input.correctionIndex] ?? 0.87);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">📋 Dados do Serviço</h2>
        <p className="text-sm text-gray-400">Informe os dados essenciais da proposta. O sistema calcula o resto.</p>
      </div>

      <div className="bg-gray-900/80 border border-gray-700/50 rounded-2xl p-5 sm:p-6 space-y-5">
        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            Descrição do Serviço
          </label>
          <input
            type="text"
            value={input.serviceDescription}
            onChange={e => updateInput('serviceDescription', e.target.value)}
            placeholder="Ex: Projeto Elétrico BT — Residência Vila Nova"
            className="w-full bg-gray-800/80 border border-gray-600 text-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Valores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Custo de Mobilização"
            icon={DollarSign}
            value={input.immediateCost}
            onChange={v => updateInput('immediateCost', v)}
            helper="Custo que precisa ser coberto antes de iniciar"
          />
          <CurrencyInput
            label="Custo Total do Projeto"
            icon={DollarSign}
            value={input.totalCost}
            onChange={v => updateInput('totalCost', Math.max(v, input.immediateCost))}
            helper="Inclui mobilização, materiais, mão de obra"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ── Margem Mínima: Dual mode (% ou R$) ────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Shield className="w-4 h-4 text-cyan-400" />
              Margem Mínima
            </label>
            {/* Toggle % / R$ */}
            <div className="flex rounded-lg overflow-hidden border border-gray-600 mb-1">
              <button
                onClick={() => setMarginMode('percent')}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-all ${
                  marginMode === 'percent'
                    ? 'bg-cyan-600/30 text-cyan-300 border-r border-cyan-500/30'
                    : 'bg-gray-800 text-gray-500 border-r border-gray-600 hover:text-gray-300'
                }`}
              >
                % Percentual
              </button>
              <button
                onClick={() => setMarginMode('value')}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-all ${
                  marginMode === 'value'
                    ? 'bg-cyan-600/30 text-cyan-300'
                    : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                R$ Valor
              </button>
            </div>

            {marginMode === 'percent' ? (
              <PercentInput
                label=""
                icon={Shield}
                value={input.minMargin}
                onChange={v => updateInput('minMargin', Math.min(Math.max(v, 0), 90))}
                placeholder="Ex: 15"
              />
            ) : (
              <CurrencyInput
                label=""
                icon={DollarSign}
                value={marginValue}
                onChange={v => {
                  setMarginValue(v);
                  if (input.totalCost > 0) {
                    // margin% = lucro / precoVenda * 100
                    // precoVenda = custo + lucro => margin% = lucro / (custo + lucro) * 100
                    const pct = input.totalCost + v > 0
                      ? (v / (input.totalCost + v)) * 100
                      : 0;
                    updateInput('minMargin', Math.min(Math.round(pct * 100) / 100, 90));
                  }
                }}
                placeholder="Ex: 20.000"
              />
            )}

            {/* Computed readout */}
            {input.totalCost > 0 && input.minMargin > 0 && (
              <p className="text-xs text-gray-500 ml-1">
                {marginMode === 'percent' ? (
                  <>≈ R$ {(input.totalCost / (1 - input.minMargin / 100) - input.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} de lucro mínimo</>
                ) : (
                  <>{input.minMargin.toFixed(2)}% sobre o preço de venda</>
                )}
              </p>
            )}
          </div>

          <NumberInput
            label="Prazo Máximo"
            icon={Clock}
            value={input.maxTerm}
            onChange={v => updateInput('maxTerm', Math.max(0, Math.min(v, 120)))}
            suffix="meses"
            placeholder="Ex: 24"
            helper="Limite máximo de parcelas (até 120 meses)"
          />
        </div>
      </div>

      {/* ── Parâmetros Financeiros ──────────────────────────────────── */}
      <div className="mt-4 bg-gray-900/80 border border-gray-700/50 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">⚙️ Parâmetros Financeiros</h3>
          <span className="text-xs text-gray-600 font-normal ml-auto">Configura os juros e taxas da operação</span>
        </div>

        {/* Índice de Correção */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Índice de Correção</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {INDEX_OPTIONS.map(idx => (
              <button
                key={idx.value}
                onClick={() => updateInput('correctionIndex', idx.value)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  input.correctionIndex === idx.value
                    ? 'bg-amber-950/50 border-amber-600/50 ring-1 ring-amber-500/30'
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                }`}
              >
                <p className={`text-sm font-bold ${input.correctionIndex === idx.value ? 'text-amber-300' : 'text-gray-300'}`}>
                  {idx.label}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">{idx.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Taxa customizada (quando fixed) */}
        {input.correctionIndex === 'fixed' && (
          <PercentInput
            label="Taxa Fixa Mensal"
            icon={Percent}
            value={input.customRate ?? 1.0}
            onChange={v => updateInput('customRate', v)}
            helper="Taxa fixa mensal para cálculo de juros"
            placeholder="1,00"
          />
        )}

        {/* Desconto à vista */}
        <PercentInput
          label="Desconto à Vista"
          icon={Percent}
          value={input.atSightDiscount}
          onChange={v => updateInput('atSightDiscount', v)}
          helper="Desconto oferecido para pagamento integral"
          placeholder="5,00"
        />

        {/* Info box */}
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg px-3 py-2 text-xs text-gray-500">
          📊 Índice atual: <strong className="text-amber-300">{input.correctionIndex === 'fixed' ? 'Taxa Fixa' : input.correctionIndex}</strong> — 
          taxa mensal de <strong className="text-amber-300">{currentRate.toFixed(2)}%</strong> ({((Math.pow(1 + currentRate / 100, 12) - 1) * 100).toFixed(1)}% a.a.)
        </div>
      </div>

      {/* Preview do preço base */}
      {input.totalCost > 0 && input.minMargin > 0 && (
        <div className="mt-4 bg-gray-900/50 border border-gray-700/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-gray-400">Preço base estimado:</span>
          </div>
          <span className="font-mono font-bold text-emerald-400 text-lg">
            R$ {(input.totalCost / (1 - input.minMargin / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

