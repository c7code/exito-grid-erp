import React from 'react';
import { User, CreditCard, Hash, DollarSign, MessageSquare, Handshake } from 'lucide-react';
import type { WizardInput, ClientProfile, PaymentPreference } from '../engine/simulatorTypes';
// profileClassifier used internally by engine

interface Props {
  input: WizardInput;
  updateInput: <K extends keyof WizardInput>(key: K, value: WizardInput[K]) => void;
}

const PROFILES: { value: ClientProfile; label: string; desc: string }[] = [
  { value: 'auto', label: '🔄 Sistema decide', desc: 'O motor analisa e escolhe o melhor perfil' },
  { value: 'low_installment', label: '🏷️ Quer parcela baixa', desc: 'Prioriza valor da parcela' },
  { value: 'low_total', label: '💰 Quer pagar menos no total', desc: 'Prioriza economia geral' },
  { value: 'fast_start', label: '⚡ Quer começar rápido', desc: 'Prioriza agilidade e mobilização' },
  { value: 'predictability', label: '📊 Quer previsibilidade', desc: 'Prioriza parcelas fixas e prazo confortável' },
];

const PAYMENTS: { value: PaymentPreference; label: string }[] = [
  { value: 'any', label: 'Sem preferência' },
  { value: 'pix', label: 'PIX / Transferência' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'mixed', label: 'Misto' },
];

function OptionalCurrencyInput({ label, icon: Icon, value, onChange, placeholder }: {
  label: string; icon: React.ElementType; value: number | undefined; onChange: (v: number) => void;
  placeholder?: string;
}) {
  const [display, setDisplay] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) {
      setDisplay(!value ? '' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
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
        <span className="text-xs text-gray-600 font-normal">(opcional)</span>
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onFocus={(e) => { setFocused(true); setTimeout(() => e.target.select(), 0); }}
          onBlur={() => { setFocused(false); }}
          placeholder={placeholder || 'Deixe vazio para o sistema calcular'}
          className="w-full bg-gray-800/80 border border-gray-600 text-cyan-300 font-mono rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-gray-600 placeholder:font-sans"
        />
      </div>
    </div>
  );
}

export default function Step2ClientProfile({ input, updateInput }: Props) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">👤 Perfil do Cliente</h2>
        <p className="text-sm text-gray-400">Campos opcionais — quanto mais informar, melhor a recomendação.</p>
      </div>

      <div className="bg-gray-900/80 border border-gray-700/50 rounded-2xl p-5 sm:p-6 space-y-5">
        {/* Nome do cliente */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <User className="w-4 h-4 text-cyan-400" />
            Nome do Cliente
            <span className="text-xs text-gray-600 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={input.clientName || ''}
            onChange={e => updateInput('clientName', e.target.value)}
            placeholder="Para personalizar a proposta"
            className="w-full bg-gray-800/80 border border-gray-600 text-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-gray-600"
          />
        </div>

        {/* Capacidade e entrada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OptionalCurrencyInput
            label="Capacidade Mensal"
            icon={DollarSign}
            value={input.monthlyCapacity}
            onChange={v => updateInput('monthlyCapacity', v)}
            placeholder="Máximo que paga por mês"
          />
          <OptionalCurrencyInput
            label="Entrada Disponível"
            icon={DollarSign}
            value={input.availableEntry}
            onChange={v => updateInput('availableEntry', v)}
            placeholder="Valor de entrada"
          />
        </div>

        {/* ── Método de Entrada ──────────────────────────────────── */}
        {(input.availableEntry ?? 0) > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Como paga a entrada?</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'pix' as const, label: '💳 PIX / Transf.', desc: 'Taxa 0%' },
                { value: 'credit_card' as const, label: '💳 Cartão', desc: 'Com markup' },
                { value: 'mixed' as const, label: '🔀 Misto', desc: 'PIX + Cartão' },
              ]).map(m => (
                <button
                  key={m.value}
                  onClick={() => updateInput('entryMethod', m.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    (input.entryMethod || 'pix') === m.value
                      ? 'bg-cyan-950/50 border-cyan-600/50 ring-1 ring-cyan-500/30'
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <p className={`text-sm font-bold ${(input.entryMethod || 'pix') === m.value ? 'text-cyan-300' : 'text-gray-300'}`}>
                    {m.label}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Card options — only when card is chosen */}
            {(input.entryMethod === 'credit_card' || input.entryMethod === 'mixed') && (
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-3 space-y-3">
                {/* Taxa da maquininha */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    Taxa da Maquininha
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={input.cardMachineRate || ''}
                      onChange={e => updateInput('cardMachineRate', parseFloat(e.target.value) || 0)}
                      placeholder="4,99"
                      className="w-full bg-gray-800/80 border border-gray-600 text-cyan-300 font-mono rounded-xl px-3 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">%</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Taxa cobrada pela operadora (será aplicada como markup)</p>
                </div>

                {/* Card entry amount for mixed */}
                {input.entryMethod === 'mixed' && (
                  <OptionalCurrencyInput
                    label="Valor desejado no Cartão"
                    icon={CreditCard}
                    value={input.cardEntryAmount}
                    onChange={v => updateInput('cardEntryAmount', Math.min(v, input.availableEntry ?? v))}
                    placeholder="Quanto o cliente quer pagar no cartão"
                  />
                )}

                {/* Markup callout */}
                {(() => {
                  const rate = input.cardMachineRate || 0;
                  if (rate <= 0 || rate >= 100) return null;
                  
                  const entryTotal = input.availableEntry ?? 0;
                  const desiredCardNet = input.entryMethod === 'credit_card'
                    ? entryTotal
                    : (input.cardEntryAmount ?? 0);
                  
                  if (desiredCardNet <= 0) return null;

                  // MARKUP: valor a cobrar = valor desejado / (1 - taxa%)
                  const chargeAmount = desiredCardNet / (1 - rate / 100);
                  const feeAmount = chargeAmount - desiredCardNet;
                  const pixPortion = input.entryMethod === 'mixed' ? Math.max(0, entryTotal - desiredCardNet) : 0;

                  return (
                    <div className="flex items-start gap-3 bg-purple-950/30 border border-purple-700/40 rounded-xl p-3">
                      <CreditCard className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-purple-300">💡 Cálculo por Markup (inversão de taxa)</p>
                        <p className="text-xs text-purple-300/80">
                          Para receber <strong className="text-purple-200">R$ {desiredCardNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> líquido → 
                          cobrar <strong className="text-white">R$ {chargeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> no cartão
                        </p>
                        <p className="text-[10px] text-purple-500/70">
                          Fórmula: R$ {desiredCardNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ÷ (1 - {rate.toFixed(2)}%) = R$ {chargeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          <span className="text-purple-400/60"> (markup R$ {feeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                        </p>
                        {pixPortion > 0 && (
                          <p className="text-[10px] text-gray-500">+ R$ {pixPortion.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} via PIX (sem taxa)</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Negotiation Quick Box — appears when monthlyCapacity is filled */}
        {input.monthlyCapacity && input.monthlyCapacity > 0 && (
          <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-700/40 rounded-xl p-4">
            <Handshake className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">💬 Negociação Rápida Ativada</p>
              <p className="text-xs text-amber-400/70 mt-1">
                O cliente informou que pode pagar <strong className="text-amber-300">R$ {input.monthlyCapacity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</strong>. 
                O motor vai calcular automaticamente a melhor combinação de entrada + parcelas que preserve a margem mínima.
              </p>
            </div>
          </div>
        )}

        {/* Parcelas e pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Hash className="w-4 h-4 text-cyan-400" />
              Parcelas Desejadas
              <span className="text-xs text-gray-600 font-normal">(opcional)</span>
            </label>
            <input
              type="number"
              value={input.desiredInstallments || ''}
              onChange={e => updateInput('desiredInstallments', parseInt(e.target.value) || 0)}
              placeholder="Ex: 6, 10, 12..."
              className="w-full bg-gray-800/80 border border-gray-600 text-cyan-300 font-mono rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-gray-600 placeholder:font-sans"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              Forma de Pagamento
              <span className="text-xs text-gray-600 font-normal">(opcional)</span>
            </label>
            <select
              value={input.preferredPayment || 'any'}
              onChange={e => updateInput('preferredPayment', e.target.value as PaymentPreference)}
              className="w-full bg-gray-800/80 border border-gray-600 text-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            >
              {PAYMENTS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Perfil */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Perfil do Cliente</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROFILES.map(p => (
              <button
                key={p.value}
                onClick={() => updateInput('clientProfile', p.value)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  input.clientProfile === p.value
                    ? 'bg-cyan-950/50 border-cyan-600/50 ring-1 ring-cyan-500/30'
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                }`}
              >
                <span className="text-lg mt-0.5">{p.label.split(' ')[0]}</span>
                <div>
                  <p className={`text-sm font-medium ${input.clientProfile === p.value ? 'text-cyan-300' : 'text-gray-300'}`}>
                    {p.label.substring(p.label.indexOf(' ') + 1)}
                  </p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            Observações
            <span className="text-xs text-gray-600 font-normal">(opcional)</span>
          </label>
          <textarea
            value={input.notes || ''}
            onChange={e => updateInput('notes', e.target.value)}
            placeholder="Informações adicionais sobre o cliente ou negociação..."
            rows={2}
            className="w-full bg-gray-800/80 border border-gray-600 text-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-gray-600 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
