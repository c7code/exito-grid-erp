// ════════════════════════════════════════════════════════════════════
// Simulation Session Types — Frontend
// ════════════════════════════════════════════════════════════════════
// Interfaces para comunicação com o endpoint /simulations do backend.
// Reflete a entity SimulationSession da API.
// ════════════════════════════════════════════════════════════════════

export type SimulationSessionStatus = 'draft' | 'linked' | 'exported' | 'archived';

export interface SimulationSessionSummary {
  id: string;
  label: string | null;
  serviceDescription: string | null;
  status: SimulationSessionStatus;
  proposalId: string | null;
  clientId: string | null;
  createdById: string | null;
  selectedConditionId: string | null;
  detectedProfile: string | null;
  basePrice: number | null;
  selectedTotal: number | null;
  selectedMargin: number | null;
  totalConditions: number;
  viableConditions: number;
  blockedConditions: number;
  createdAt: string;
  updatedAt: string;

  // Relações opcionais (vindas com relations no GET)
  proposal?: { id: string; proposalNumber: string; title: string } | null;
  client?: { id: string; name: string } | null;
  createdByUser?: { id: string; name: string } | null;
}

export interface SimulationSessionDetail extends SimulationSessionSummary {
  inputData: string | null;    // JSON stringificado do WizardInput
  resultData: string | null;   // JSON stringificado do resultado completo
}

export interface CreateSimulationSessionDTO {
  proposalId?: string;
  clientId?: string;
  label?: string;
  serviceDescription?: string;
  inputData?: string;          // JSON.stringify(wizardInput)
  resultData?: string;         // JSON.stringify(simulationResult)
  selectedConditionId?: string;
  detectedProfile?: string;
  basePrice?: number;
  selectedTotal?: number;
  selectedMargin?: number;
  totalConditions?: number;
  viableConditions?: number;
  blockedConditions?: number;
  status?: SimulationSessionStatus;
}

export interface UpdateSelectionDTO {
  selectedConditionId: string;
  selectedTotal?: number;
  selectedMargin?: number;
}

// ── Helpers ──

/** Parse seguro do inputData JSON */
export function parseInputData(session: SimulationSessionDetail): Record<string, any> | null {
  if (!session.inputData) return null;
  try { return JSON.parse(session.inputData); } catch { return null; }
}

/** Parse seguro do resultData JSON */
export function parseResultData(session: SimulationSessionDetail): Record<string, any> | null {
  if (!session.resultData) return null;
  try { return JSON.parse(session.resultData); } catch { return null; }
}

/** Status badge label */
export function getSessionStatusLabel(status: SimulationSessionStatus): string {
  switch (status) {
    case 'draft': return 'Rascunho';
    case 'linked': return 'Vinculada';
    case 'exported': return 'Exportada';
    case 'archived': return 'Arquivada';
    default: return status;
  }
}

/** Status badge color (CSS) */
export function getSessionStatusColor(status: SimulationSessionStatus): string {
  switch (status) {
    case 'draft': return '#6b7280';    // gray
    case 'linked': return '#22c55e';   // green
    case 'exported': return '#3b82f6'; // blue
    case 'archived': return '#9ca3af'; // light gray
    default: return '#6b7280';
  }
}
