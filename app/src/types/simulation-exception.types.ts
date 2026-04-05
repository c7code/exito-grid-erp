// ════════════════════════════════════════════════════════════════════
// Simulation Exception Types — Frontend
// ════════════════════════════════════════════════════════════════════

export type SimulationExceptionType =
  | 'cash_gap'
  | 'below_min_margin'
  | 'high_risk'
  | 'excessive_term'
  | 'capacity_exceeded'
  | 'blocked_override'
  | 'other';

export type SimulationExceptionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface SimulationExceptionSummary {
  id: string;
  sessionId: string | null;
  exceptionType: SimulationExceptionType;
  status: SimulationExceptionStatus;
  conditionId: string | null;
  conditionLabel: string | null;
  marginAtException: number | null;
  minMarginRequired: number | null;
  cashGapAmount: number | null;
  riskScoreAtException: number | null;
  justification: string;
  requestedById: string;
  approvedById: string | null;
  approvalNote: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Relações opcionais
  requestedBy?: { id: string; name: string } | null;
  approvedBy?: { id: string; name: string } | null;
  session?: { id: string; label: string } | null;
}

export interface SimulationExceptionDetail extends SimulationExceptionSummary {
  conditionSnapshot: string | null; // JSON da condição
}

export interface RequestExceptionDTO {
  sessionId?: string;
  exceptionType: SimulationExceptionType;
  conditionId?: string;
  conditionSnapshot?: string;
  conditionLabel?: string;
  marginAtException?: number;
  minMarginRequired?: number;
  cashGapAmount?: number;
  riskScoreAtException?: number;
  justification: string;
}

export interface ApproveRejectDTO {
  approvalNote?: string;
}

// ── Helpers ──

export function getExceptionTypeLabel(type: SimulationExceptionType): string {
  switch (type) {
    case 'cash_gap': return 'Meta de caixa não coberta';
    case 'below_min_margin': return 'Margem abaixo do mínimo';
    case 'high_risk': return 'Risco acima do limite';
    case 'excessive_term': return 'Prazo excessivo';
    case 'capacity_exceeded': return 'Parcela acima da capacidade';
    case 'blocked_override': return 'Override de bloqueio';
    case 'other': return 'Outro';
    default: return type;
  }
}

export function getExceptionTypeEmoji(type: SimulationExceptionType): string {
  switch (type) {
    case 'cash_gap': return '💰';
    case 'below_min_margin': return '📉';
    case 'high_risk': return '⚠️';
    case 'excessive_term': return '⏳';
    case 'capacity_exceeded': return '🔴';
    case 'blocked_override': return '🔓';
    case 'other': return '📝';
    default: return '📝';
  }
}

export function getExceptionStatusLabel(status: SimulationExceptionStatus): string {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'approved': return 'Aprovada';
    case 'rejected': return 'Rejeitada';
    case 'expired': return 'Expirada';
    default: return status;
  }
}

export function getExceptionStatusColor(status: SimulationExceptionStatus): string {
  switch (status) {
    case 'pending': return '#eab308';   // yellow
    case 'approved': return '#22c55e';  // green
    case 'rejected': return '#ef4444';  // red
    case 'expired': return '#6b7280';   // gray
    default: return '#6b7280';
  }
}
