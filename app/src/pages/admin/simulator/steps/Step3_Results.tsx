import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, AlertTriangle, Banknote, ArrowDownToLine, TrendingUp, ShieldAlert, CreditCard, Wallet, Shield } from 'lucide-react';
import type { SimulatorResult, EvaluatedCondition, Alert, ConditionExplanation, WizardInput } from '../engine/simulatorTypes';
import type { StructuringResult, EntrySliceDetail } from '../engine/paymentStructuringEngine';
import type { RequestExceptionDTO } from '../../../../types/simulation-exception.types';
import { getSecurityLevel, getSecurityLabel, getSecurityColor, fmt, getScoreClassification, getScoreLabel, getScoreEmoji, getScoreColor } from '../engine/simulatorTypes';
import { getProfileLabel, getProfileEmoji } from '../engine/profileClassifier';
import { generateHeadline } from '../engine/alertGenerator';
import ExceptionRequestDialog from './ExceptionRequestDialog';

interface Props {
  result: SimulatorResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
  structuring?: StructuringResult | null;
  wizardInput?: WizardInput;
  onRequestException?: (data: RequestExceptionDTO) => Promise<void>;
  sessionId?: string;
}

// ═══ Payment Method Labels ═══════════════════════════════════════════════════
const METHOD_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  pix: { label: 'PIX / Transf.', emoji: '💳', color: 'text-emerald-400' },
  cartao_vista: { label: 'Cartão à Vista', emoji: '💳', color: 'text-purple-400' },
  cartao_parcelado: { label: 'Cartão Parcelado', emoji: '💳', color: 'text-purple-300' },
  cheque: { label: 'Cheque', emoji: '📝', color: 'text-amber-400' },
  boleto: { label: 'Boleto', emoji: '📄', color: 'text-blue-400' },
};

// ─── Security Bar ────────────────────────────────────────────────────────────
function SecurityBar({ score }: { score: number }) {
  const level = getSecurityLevel(score);
  const label = getSecurityLabel(level);
  const color = getSecurityColor(level);
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium whitespace-nowrap" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ─── Score Classification Badge ──────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const classification = getScoreClassification(score);
  const label = getScoreLabel(classification);
  const emoji = getScoreEmoji(classification);
  const color = getScoreColor(classification);

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color,
      }}
    >
      {emoji} {label}
    </span>
  );
}

// ─── Alert Badge ─────────────────────────────────────────────────────────────
function AlertBadge({ alert }: { alert: Alert }) {
  const bgClass = alert.type === 'success'
    ? 'bg-emerald-950/50 border-emerald-700/30 text-emerald-400'
    : alert.type === 'warning'
    ? 'bg-amber-950/50 border-amber-700/30 text-amber-400'
    : 'bg-red-950/50 border-red-700/30 text-red-400';

  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${bgClass}`}>
      <span className="flex-shrink-0">{alert.icon}</span>
      <span>{alert.message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Structuring Panel — Painel de Estruturação Financeira
// ═══════════════════════════════════════════════════════════════════════════════
function StructuringPanel({ structuring }: { structuring: StructuringResult }) {
  const [expanded, setExpanded] = useState(true);
  const coverageOk = structuring.immediateCoverageRatio >= 1;
  const hasGap = structuring.fundingGap > 0;

  const policyLabels: Record<string, string> = {
    company: 'Empresa absorve',
    client: 'Cliente absorve',
    shared: 'Compartilhada',
  };

  return (
    <div className="bg-gray-900/90 border border-gray-700/50 rounded-2xl overflow-hidden mb-6">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Banknote className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">Estruturação Financeira</p>
            <p className="text-xs text-gray-500">Composição de entrada, cobertura de caixa e saldo financiado</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick status badge */}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
            coverageOk
              ? 'bg-emerald-950/50 border-emerald-700/40 text-emerald-400'
              : 'bg-red-950/50 border-red-700/40 text-red-400'
          }`}>
            {coverageOk ? '✅ Caixa coberto' : `⚠️ Gap R$ ${fmt(structuring.fundingGap)}`}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-800/50 pt-4">
          {/* ── Row 1: Coverage Metrics ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Meta de Caixa"
              value={`R$ ${fmt(structuring.immediateNetTarget)}`}
              icon={<ArrowDownToLine className="w-3.5 h-3.5" />}
              color="text-amber-300"
            />
            <MetricCard
              label="Líquido Recebido"
              value={`R$ ${fmt(structuring.immediateNetReceived)}`}
              icon={<Wallet className="w-3.5 h-3.5" />}
              color={coverageOk ? 'text-emerald-400' : 'text-red-400'}
            />
            <MetricCard
              label="Cobertura"
              value={`${(structuring.immediateCoverageRatio * 100).toFixed(0)}%`}
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              color={coverageOk ? 'text-emerald-400' : 'text-red-400'}
            />
            <MetricCard
              label={hasGap ? 'Déficit' : 'Folga'}
              value={`R$ ${fmt(hasGap ? structuring.fundingGap : structuring.fundingSurplus)}`}
              icon={hasGap ? <ShieldAlert className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              color={hasGap ? 'text-red-400' : 'text-cyan-400'}
            />
          </div>

          {/* ── Row 2: Entry Composition ── */}
          <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              💳 Composição da Entrada
            </p>
            <div className="space-y-2">
              {structuring.entry.slices.map((slice, i) => (
                <EntrySliceRow key={i} slice={slice} />
              ))}
            </div>
            {/* Totals */}
            <div className="mt-3 pt-3 border-t border-gray-700/30 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-gray-500">Bruto</p>
                <p className="font-mono text-sm font-bold text-white">R$ {fmt(structuring.entry.grossTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Taxas</p>
                <p className="font-mono text-sm font-bold text-orange-400">-R$ {fmt(structuring.entry.totalFees)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Líquido</p>
                <p className="font-mono text-sm font-bold text-emerald-400">R$ {fmt(structuring.entry.netReceived)}</p>
              </div>
            </div>

            {/* Fee policy badge */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-gray-600">Política de taxa:</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700/50 border border-gray-600/30 text-gray-400 font-medium">
                {policyLabels[structuring.financialPolicyApplied] || structuring.financialPolicyApplied}
              </span>
              {structuring.entry.companyAbsorbedFees > 0 && (
                <span className="text-[10px] text-amber-500/70">
                  (empresa absorve R$ {fmt(structuring.entry.companyAbsorbedFees)})
                </span>
              )}
            </div>
          </div>

          {/* ── Row 3: Financed Balance ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Saldo Financiado"
              value={`R$ ${fmt(structuring.financedBalance)}`}
              icon={<Banknote className="w-3.5 h-3.5" />}
              color="text-cyan-300"
            />
            {structuring.financedInstallment > 0 && (
              <MetricCard
                label={`${structuring.financedTerm}x de`}
                value={`R$ ${fmt(structuring.financedInstallment)}`}
                icon={<CreditCard className="w-3.5 h-3.5" />}
                color="text-cyan-300"
              />
            )}
            {structuring.clientCapacityUsed > 0 && (
              <MetricCard
                label="Capacidade Usada"
                value={`${structuring.clientCapacityUsed.toFixed(0)}%`}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                color={structuring.installmentFitsCapacity ? 'text-emerald-400' : 'text-red-400'}
              />
            )}
            <MetricCard
              label="Total Cliente"
              value={`R$ ${fmt(structuring.totalClientPays)}`}
              icon={<Wallet className="w-3.5 h-3.5" />}
              color="text-white"
            />
          </div>

          {/* ── Alerts ── */}
          {structuring.alerts.length > 0 && (
            <div className="space-y-1.5">
              {structuring.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${
                    alert.type === 'danger'
                      ? 'bg-red-950/50 border-red-700/30 text-red-400'
                      : alert.type === 'warning'
                      ? 'bg-amber-950/50 border-amber-700/30 text-amber-400'
                      : 'bg-cyan-950/50 border-cyan-700/30 text-cyan-400'
                  }`}
                >
                  <span className="flex-shrink-0">
                    {alert.type === 'danger' ? '🔴' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon, color }: {
  label: string; value: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-gray-500">{icon}</span>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`font-mono text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Entry Slice Row ─────────────────────────────────────────────────────────
function EntrySliceRow({ slice }: { slice: EntrySliceDetail }) {
  const config = METHOD_LABELS[slice.method] || { label: slice.method, emoji: '💰', color: 'text-gray-300' };

  return (
    <div className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">{config.emoji}</span>
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        {slice.rate > 0 && (
          <span className="text-[10px] text-gray-600">({slice.rate.toFixed(2)}%)</span>
        )}
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="text-[10px] text-gray-600">Bruto</p>
          <p className="font-mono text-xs text-gray-300">R$ {fmt(slice.grossAmount)}</p>
        </div>
        {slice.feeAmount > 0 && (
          <div>
            <p className="text-[10px] text-gray-600">Taxa</p>
            <p className="font-mono text-xs text-orange-400">-R$ {fmt(slice.feeAmount)}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-gray-600">Líquido</p>
          <p className="font-mono text-xs text-emerald-400">R$ {fmt(slice.netAmount)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Condition Card ──────────────────────────────────────────────────────────
function ConditionCard({
  condition,
  isMain,
  isSelected,
  badge,
  badgeColor,
  headline,
  showInternal,
  onClick,
  explanation,
}: {
  condition: EvaluatedCondition;
  isMain?: boolean;
  isSelected?: boolean;
  badge: string;
  badgeColor: string;
  headline: string;
  showInternal: boolean;
  onClick: () => void;
  explanation?: ConditionExplanation;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border transition-all ${
        isMain ? 'p-5 sm:p-6' : 'p-4'
      } ${
        isSelected
          ? 'border-cyan-500 shadow-lg shadow-cyan-500/15 bg-gray-900/90'
          : 'border-gray-700 hover:border-gray-500 bg-gray-900/60'
      }`}
    >
      {/* Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${badgeColor}`}>
          {badge}
        </span>
        {condition.tags.length > 0 && (
          <div className="flex gap-1">
            {condition.tags.slice(0, 2).map((t, i) => (
              <span key={i} className="text-xs bg-gray-800 border border-gray-600 rounded-full px-2 py-0.5 text-gray-400">
                {t.emoji} {t.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Headline */}
      <p className={`text-gray-400 text-xs mb-3 ${isMain ? 'sm:text-sm' : ''}`}>
        {headline}
      </p>

      {/* Values */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {condition.entry > 0 && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Entrada</p>
            <p className="font-mono font-bold text-yellow-300 text-sm">R$ {fmt(condition.entry)}</p>
          </div>
        )}
        {condition.installmentAmount > 0 && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{condition.installments}x de</p>
            <p className="font-mono font-bold text-cyan-300 text-sm">R$ {fmt(condition.installmentAmount)}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
          <p className="font-mono font-bold text-white text-sm">R$ {fmt(condition.totalClient)}</p>
        </div>
      </div>

      {/* Security */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Segurança</p>
        <SecurityBar score={condition.riskScore} />
      </div>

      {/* Internal view */}
      {showInternal && (
        <div className="pt-3 border-t border-gray-700/50 space-y-2">
          {/* Score classification badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">Classificação</span>
            <ScoreBadge score={condition.finalScore} />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <p className="text-[10px] text-gray-500">Margem</p>
              <p className={`font-mono text-xs font-bold ${condition.effectiveMargin >= 25 ? 'text-emerald-400' : condition.effectiveMargin >= 15 ? 'text-yellow-400' : 'text-rose-400'}`}>
                {condition.effectiveMargin.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Margem Real</p>
              <p className="font-mono text-xs font-bold text-gray-300">{condition.realMargin.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">IRR Anual</p>
              <p className="font-mono text-xs font-bold text-purple-300">{condition.irrAnnual.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Payback</p>
              <p className="font-mono text-xs text-gray-300">Mês {condition.paybackMonth}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Score</p>
              <p className="font-mono text-xs text-gray-300">{condition.finalScore}/100</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Atratividade</p>
              <p className="font-mono text-xs text-cyan-300">{condition.attractivenessScore}/100</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Toler. Atraso</p>
              <p className="font-mono text-xs text-gray-300">
                {condition.delayImpact.maxSafeDelay > 0 
                  ? `Até ${condition.delayImpact.maxSafeDelay} mês${condition.delayImpact.maxSafeDelay > 1 ? 'es' : ''}` 
                  : 'Nenhum'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Risco</p>
              <p className="font-mono text-xs text-gray-300">{condition.defaultRisk.toFixed(1)}%</p>
            </div>
            {condition.correctionAmount > 0 && (
              <div>
                <p className="text-[10px] text-gray-500">Juros Embutidos</p>
                <p className="font-mono text-xs text-emerald-300">R$ {fmt(condition.correctionAmount)}</p>
              </div>
            )}
          </div>

          {/* Delay impact mini-card */}
          {condition.delayImpact.delay1m.marginLoss > 0 && (
            <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-[10px] text-gray-500">
              Se atrasar 1m: margem cai {condition.delayImpact.delay1m.marginLoss.toFixed(1)}pp → {condition.delayImpact.delay1m.realMargin.toFixed(1)}%
              {condition.delayImpact.delay1m.cashGap > 0 && (
                <span className="text-amber-400/70"> | Gap: R$ {fmt(condition.delayImpact.delay1m.cashGap)}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {condition.alerts.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {condition.alerts.slice(0, isMain ? 2 : 1).map((a, i) => (
            <AlertBadge key={i} alert={a} />
          ))}
        </div>
      )}

      {/* Explanation Panel (internal view, when available) */}
      {showInternal && explanation && (
        <div className="mt-3 pt-3 border-t border-gray-700/30 space-y-2">
          {/* Recommendation reason */}
          <p className="text-xs font-medium text-gray-300">
            {explanation.recommendation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Immediate receipt */}
            <div className="bg-gray-800/30 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Recebimento Imediato</p>
              <p className="text-xs text-emerald-400">{explanation.immediateReceipt}</p>
            </div>

            {/* Financed summary */}
            <div className="bg-gray-800/30 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Saldo Financiado</p>
              <p className="text-xs text-cyan-400">{explanation.financedSummary}</p>
            </div>
          </div>

          {/* Flexibility cost */}
          <div className="bg-gray-800/30 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Custo de Flexibilidade</p>
            <p className="text-xs text-amber-400/80">{explanation.flexibilityCost}</p>
          </div>

          {/* Financial summary */}
          <p className="text-[10px] text-gray-600">{explanation.financialSummary}</p>

          {/* Block explanation */}
          {explanation.blockExplanation && (
            <div className="bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2">
              {explanation.blockExplanation.split('\n').map((line, i) => (
                <p key={i} className="text-xs text-red-400/80">{line}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Main Step 3 ─────────────────────────────────────────────────────────────
export default function Step3Results({ result, selectedId, onSelect, structuring, wizardInput, onRequestException, sessionId }: Props) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [viewMode, setViewMode] = useState<'client' | 'internal'>('client');
  const [exceptionTarget, setExceptionTarget] = useState<EvaluatedCondition | null>(null);

  const showInternal = viewMode === 'internal';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">⭐ Melhores Condições</h2>
          <p className="text-sm text-gray-400">
            {result.summary.totalViable} condições viáveis de {result.summary.totalConditionsGenerated} analisadas
            {result.blockedCount > 0 && (
              <span className="text-gray-600"> • {result.blockedCount} eliminadas automaticamente</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {getProfileEmoji(result.detectedProfile)} {getProfileLabel(result.detectedProfile)}
          </span>
          <button
            onClick={() => setViewMode(v => v === 'client' ? 'internal' : 'client')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showInternal
                ? 'bg-red-950/50 border-red-700/40 text-red-400'
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            {showInternal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showInternal ? 'Interna' : 'Cliente'}
          </button>
        </div>
      </div>

      {showInternal && (
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2 mb-4 text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Visão interna — NÃO compartilhar com cliente</span>
        </div>
      )}

      {/* ── Structuring Panel (appears in internal view or always if there's a gap) ── */}
      {structuring && (showInternal || structuring.fundingGap > 0) && (
        <StructuringPanel structuring={structuring} />
      )}

      {/* ── Top 3 Cards ──────────────────────────────────────────────── */}
      <div className="space-y-4 mb-6">
        {/* Recommended (main card) */}
        <ConditionCard
          condition={result.recommended}
          isMain
          isSelected={selectedId === result.recommended.id}
          badge="⭐ Recomendada"
          badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/40"
          headline={generateHeadline(result.recommended, true, false, false)}
          showInternal={showInternal}
          onClick={() => onSelect(result.recommended.id)}
          explanation={result.explanations?.get(result.recommended.id)}
        />

        {/* Two alternatives side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ConditionCard
            condition={result.bestForClosing}
            isSelected={selectedId === result.bestForClosing.id}
            badge="🎯 Melhor p/ Fechar"
            badgeColor="bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
            headline={generateHeadline(result.bestForClosing, false, true, false)}
            showInternal={showInternal}
            onClick={() => onSelect(result.bestForClosing.id)}
            explanation={result.explanations?.get(result.bestForClosing.id)}
          />
          <ConditionCard
            condition={result.bestForMargin}
            isSelected={selectedId === result.bestForMargin.id}
            badge="🛡️ Melhor p/ Margem"
            badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            headline={generateHeadline(result.bestForMargin, false, false, true)}
            showInternal={showInternal}
            onClick={() => onSelect(result.bestForMargin.id)}
            explanation={result.explanations?.get(result.bestForMargin.id)}
          />
        </div>
      </div>

      {/* ── Alternatives (collapsible) ────────────────────────────────── */}
      {result.alternatives.length > 0 && (
        <div>
          <button
            onClick={() => setShowAlternatives(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-3"
          >
            {showAlternatives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAlternatives ? 'Ocultar' : 'Ver'} mais {result.alternatives.length} opções
          </button>

          {showAlternatives && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-2">
              {result.alternatives.map(c => (
                <ConditionCard
                  key={c.id}
                  condition={c}
                  isSelected={selectedId === c.id}
                  badge={c.label}
                  badgeColor="bg-gray-500/20 text-gray-300 border-gray-500/40"
                  headline={c.detail}
                  showInternal={showInternal}
                  onClick={() => onSelect(c.id)}
                  explanation={result.explanations?.get(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Exception Request Button (internal view) ── */}
      {showInternal && wizardInput && onRequestException && selectedId && (() => {
        const selectedCondition = [result.recommended, result.bestForClosing, result.bestForMargin, ...result.alternatives]
          .find(c => c.id === selectedId);
        if (!selectedCondition) return null;

        // Show button if condition has any violation
        const hasViolation = selectedCondition.blocked ||
          selectedCondition.effectiveMargin < wizardInput.minMargin ||
          selectedCondition.riskScore < 30 ||
          (wizardInput.monthlyCapacity && selectedCondition.installmentAmount > wizardInput.monthlyCapacity) ||
          (structuring && structuring.fundingGap > 0);

        if (!hasViolation) return null;

        return (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setExceptionTarget(selectedCondition)}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-700/40 text-amber-300 rounded-xl text-sm font-medium transition-all"
            >
              <Shield className="w-4 h-4" />
              Solicitar Exceção para Condição Selecionada
            </button>
          </div>
        );
      })()}

      {/* ── Exception Dialog ── */}
      {exceptionTarget && wizardInput && onRequestException && (
        <ExceptionRequestDialog
          open={!!exceptionTarget}
          onClose={() => setExceptionTarget(null)}
          onSubmit={onRequestException}
          condition={exceptionTarget}
          input={wizardInput}
          structuring={structuring || null}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}
