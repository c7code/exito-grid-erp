import { useState } from 'react';
import { X, AlertTriangle, Send, Shield, FileText } from 'lucide-react';
import type { EvaluatedCondition, WizardInput } from '../engine/simulatorTypes';
import type { StructuringResult } from '../engine/paymentStructuringEngine';
import type { SimulationExceptionType, RequestExceptionDTO } from '../../../../types/simulation-exception.types';
import { getExceptionTypeLabel, getExceptionTypeEmoji } from '../../../../types/simulation-exception.types';
import { fmt } from '../engine/simulatorTypes';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RequestExceptionDTO) => Promise<void>;
  condition: EvaluatedCondition;
  input: WizardInput;
  structuring: StructuringResult | null;
  sessionId?: string;
}

/**
 * Detecta automaticamente os tipos de exceção baseado na condição selecionada.
 */
function detectExceptionTypes(
  condition: EvaluatedCondition,
  input: WizardInput,
  structuring: StructuringResult | null,
): { type: SimulationExceptionType; label: string; detail: string }[] {
  const types: { type: SimulationExceptionType; label: string; detail: string }[] = [];

  // Meta de caixa não coberta
  if (structuring && structuring.fundingGap > 0) {
    types.push({
      type: 'cash_gap',
      label: getExceptionTypeLabel('cash_gap'),
      detail: `Gap de R$ ${fmt(structuring.fundingGap)} (cobertura ${(structuring.immediateCoverageRatio * 100).toFixed(0)}%)`,
    });
  }

  // Margem abaixo do mínimo
  if (condition.effectiveMargin < input.minMargin) {
    types.push({
      type: 'below_min_margin',
      label: getExceptionTypeLabel('below_min_margin'),
      detail: `Margem ${condition.effectiveMargin.toFixed(1)}% < mínimo ${input.minMargin.toFixed(1)}%`,
    });
  }

  // Risco alto
  if (condition.riskScore < 30) {
    types.push({
      type: 'high_risk',
      label: getExceptionTypeLabel('high_risk'),
      detail: `Risk score ${condition.riskScore}/100 (${condition.riskLevel})`,
    });
  }

  // Prazo excessivo
  if (input.maxTerm > 0 && condition.installments > input.maxTerm) {
    types.push({
      type: 'excessive_term',
      label: getExceptionTypeLabel('excessive_term'),
      detail: `${condition.installments} meses > limite de ${input.maxTerm}`,
    });
  }

  // Parcela acima da capacidade
  if (input.monthlyCapacity && input.monthlyCapacity > 0 && condition.installmentAmount > input.monthlyCapacity) {
    const pct = Math.round((condition.installmentAmount / input.monthlyCapacity) * 100);
    types.push({
      type: 'capacity_exceeded',
      label: getExceptionTypeLabel('capacity_exceeded'),
      detail: `Parcela R$ ${fmt(condition.installmentAmount)} = ${pct}% da capacidade`,
    });
  }

  // Condição bloqueada (override)
  if (condition.blocked) {
    types.push({
      type: 'blocked_override',
      label: getExceptionTypeLabel('blocked_override'),
      detail: condition.blockReason || 'Condição bloqueada pelo motor',
    });
  }

  // Se nenhuma foi detectada, é "other"
  if (types.length === 0) {
    types.push({
      type: 'other',
      label: getExceptionTypeLabel('other'),
      detail: 'Exceção manual',
    });
  }

  return types;
}

export default function ExceptionRequestDialog({
  open,
  onClose,
  onSubmit,
  condition,
  input,
  structuring,
  sessionId,
}: Props) {
  const [justification, setJustification] = useState('');
  const [selectedType, setSelectedType] = useState<SimulationExceptionType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const detectedTypes = detectExceptionTypes(condition, input, structuring);

  // Auto-select if only one type
  const activeType = selectedType || (detectedTypes.length === 1 ? detectedTypes[0].type : null);

  const canSubmit = activeType && justification.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const dto: RequestExceptionDTO = {
        sessionId,
        exceptionType: activeType!,
        conditionId: condition.id,
        conditionSnapshot: JSON.stringify(condition),
        conditionLabel: condition.label || condition.commercialName,
        marginAtException: condition.effectiveMargin,
        minMarginRequired: input.minMargin,
        cashGapAmount: structuring?.fundingGap || 0,
        riskScoreAtException: condition.riskScore,
        justification: justification.trim(),
      };

      await onSubmit(dto);
      setJustification('');
      setSelectedType(null);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao solicitar exceção');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Solicitar Exceção</h3>
              <p className="text-xs text-gray-500">Justificar uso de condição fora da regra</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Condition summary */}
          <div className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Condição Selecionada</p>
            <p className="text-sm font-medium text-white">{condition.commercialName || condition.label}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
              {condition.entry > 0 && <span>Entrada: R$ {fmt(condition.entry)}</span>}
              {condition.installmentAmount > 0 && <span>{condition.installments}x de R$ {fmt(condition.installmentAmount)}</span>}
              <span>Total: R$ {fmt(condition.totalClient)}</span>
              <span>Margem: {condition.effectiveMargin.toFixed(1)}%</span>
            </div>
          </div>

          {/* Exception type selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-400" />
              Tipo de Exceção
            </label>
            <div className="space-y-2">
              {detectedTypes.map((dt) => (
                <button
                  key={dt.type}
                  onClick={() => setSelectedType(dt.type)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    activeType === dt.type
                      ? 'bg-amber-950/40 border-amber-600/50 ring-1 ring-amber-500/30'
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <span className="text-lg mt-0.5">{getExceptionTypeEmoji(dt.type)}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${activeType === dt.type ? 'text-amber-300' : 'text-gray-300'}`}>
                      {dt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{dt.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              <FileText className="w-4 h-4 inline mr-1 text-cyan-400" />
              Justificativa <span className="text-gray-600 font-normal">(mín. 10 caracteres)</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique por que esta condição deve ser aprovada fora da regra..."
              rows={3}
              className="w-full bg-gray-800/80 border border-gray-600 text-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-gray-600 resize-none"
            />
            <p className="text-[10px] text-gray-600 mt-1">
              {justification.length}/10 caracteres {justification.length >= 10 ? '✅' : ''}
            </p>
          </div>

          {/* Info box */}
          <div className="bg-blue-950/30 border border-blue-700/30 rounded-xl px-4 py-3 flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-400/80">
              A exceção será registrada e ficará <strong className="text-blue-300">pendente de aprovação</strong> por um gestor.
              Toda ação fica registrada na trilha de auditoria.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/50 border border-red-700/30 rounded-lg px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-xl text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              canSubmit && !submitting
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Enviando...' : 'Solicitar Exceção'}
          </button>
        </div>
      </div>
    </div>
  );
}
