export const STATUS_MAP: Record<string, { l: string; c: string }> = {
  available: { l: 'Disponível', c: 'bg-green-100 text-green-800' },
  rented: { l: 'Locado', c: 'bg-blue-100 text-blue-800' },
  maintenance: { l: 'Manutenção', c: 'bg-orange-100 text-orange-800' },
  inactive: { l: 'Inativo', c: 'bg-gray-100 text-gray-600' },
};
export const CAT_MAP: Record<string, string> = { munck: 'Munck', generator: 'Gerador', excavator: 'Retroescavadeira', crane: 'Guindaste', truck: 'Caminhão', other: 'Outro' };
export const RENT_STATUS: Record<string, { l: string; c: string }> = {
  draft: { l: 'Rascunho', c: 'bg-gray-100 text-gray-700' }, quoted: { l: 'Cotado', c: 'bg-yellow-100 text-yellow-800' },
  confirmed: { l: 'Confirmado', c: 'bg-blue-100 text-blue-800' }, active: { l: 'Ativo', c: 'bg-green-100 text-green-800' },
  completed: { l: 'Concluído', c: 'bg-emerald-100 text-emerald-800' }, cancelled: { l: 'Cancelado', c: 'bg-red-100 text-red-800' },
};
export const MAINT_STATUS: Record<string, { l: string; c: string }> = {
  scheduled: { l: 'Agendado', c: 'bg-yellow-100 text-yellow-800' }, in_progress: { l: 'Em Andamento', c: 'bg-blue-100 text-blue-800' },
  completed: { l: 'Concluído', c: 'bg-green-100 text-green-800' },
};
export const SVC_TYPE: Record<string, string> = { lifting: 'Içamento', transport: 'Transporte', installation: 'Instalação', removal: 'Remoção', other: 'Outro' };
export const SVC_STATUS: Record<string, { l: string; c: string }> = {
  draft: { l: 'Rascunho', c: 'bg-gray-100 text-gray-700' }, scheduled: { l: 'Agendado', c: 'bg-yellow-100 text-yellow-800' },
  in_progress: { l: 'Em Andamento', c: 'bg-blue-100 text-blue-800' }, completed: { l: 'Concluído', c: 'bg-green-100 text-green-800' },
  cancelled: { l: 'Cancelado', c: 'bg-red-100 text-red-800' }, billed: { l: 'Faturado', c: 'bg-emerald-100 text-emerald-800' },
};
export const DAILY_STATUS: Record<string, { l: string; c: string }> = {
  registered: { l: 'Registrado', c: 'bg-yellow-100 text-yellow-800' }, billed: { l: 'Faturado', c: 'bg-green-100 text-green-800' },
  cancelled: { l: 'Cancelado', c: 'bg-red-100 text-red-800' },
};

// ═══ NEW: Billing modality ═══
export const BILLING_MODALITY: Record<string, string> = {
  daily: 'Diária', monthly: 'Mensal', hourly: 'Por Hora', fixed_period: 'Período Fechado',
};

export const RATE_MODE: Record<string, string> = {
  percent: 'Percentual (%)', fixed: 'Valor Fixo (R$)',
};

export const CLIENT_APPROVAL: Record<string, { l: string; c: string }> = {
  pending: { l: 'Pendente', c: 'bg-yellow-100 text-yellow-800' },
  approved: { l: 'Aprovado', c: 'bg-green-100 text-green-800' },
  disputed: { l: 'Contestado', c: 'bg-red-100 text-red-800' },
};

export const DEFAULT_CLAUSES = [
  'O operador tem autonomia para recusar operação em condições inseguras ou que ofereçam risco ao equipamento e pessoas.',
  'Danos causados por mau uso, posicionamento inadequado ou descumprimento das orientações do operador são de responsabilidade do CONTRATANTE.',
  'O CONTRATANTE é responsável por garantir acesso adequado e seguro ao local de operação do equipamento.',
  'O equipamento não poderá ser utilizado em áreas que excedam sua capacidade de carga ou especificações técnicas.',
  'Horas excedentes ao período contratado serão cobradas conforme adicional definido nesta proposta.',
  'Trabalho em horário noturno (22h às 05h) terá adicional conforme definido nesta proposta.',
  'Trabalho em feriados e dias não úteis terá adicional conforme definido nesta proposta.',
  'A mobilização e desmobilização do equipamento serão de responsabilidade da CONTRATADA, salvo acordo em contrário.',
];

export const fmt = (v: any) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fD = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
