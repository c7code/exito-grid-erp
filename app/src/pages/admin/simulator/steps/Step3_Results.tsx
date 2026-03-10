import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import type { SimulatorResult, EvaluatedCondition, Alert } from '../engine/simulatorTypes';
import { getSecurityLevel, getSecurityLabel, getSecurityColor, fmt, getScoreClassification, getScoreLabel, getScoreEmoji, getScoreColor } from '../engine/simulatorTypes';
import { getProfileLabel, getProfileEmoji } from '../engine/profileClassifier';
import { generateHeadline } from '../engine/alertGenerator';

interface Props {
  result: SimulatorResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

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
}: {
  condition: EvaluatedCondition;
  isMain?: boolean;
  isSelected?: boolean;
  badge: string;
  badgeColor: string;
  headline: string;
  showInternal: boolean;
  onClick: () => void;
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
    </button>
  );
}

// ─── Main Step 3 ─────────────────────────────────────────────────────────────
export default function Step3Results({ result, selectedId, onSelect }: Props) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [viewMode, setViewMode] = useState<'client' | 'internal'>('client');

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
          />
          <ConditionCard
            condition={result.bestForMargin}
            isSelected={selectedId === result.bestForMargin.id}
            badge="🛡️ Melhor p/ Margem"
            badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            headline={generateHeadline(result.bestForMargin, false, false, true)}
            showInternal={showInternal}
            onClick={() => onSelect(result.bestForMargin.id)}
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
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
