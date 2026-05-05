export const STATUS_MAP: Record<string, { l: string; c: string }> = {
  available: { l: 'Disponível', c: 'bg-green-100 text-green-800' },
  rented: { l: 'Locado', c: 'bg-blue-100 text-blue-800' },
  maintenance: { l: 'Manutenção', c: 'bg-orange-100 text-orange-800' },
  inactive: { l: 'Inativo', c: 'bg-gray-100 text-gray-600' },
};
export const CAT_MAP: Record<string, string> = {
  munck: 'Munck', crane: 'Guindaste', truck: 'Caminhão', flatbed_truck: 'Caminhão Prancha',
  excavator: 'Retroescavadeira', backhoe: 'Pá Carregadeira', generator: 'Gerador',
  compressor: 'Compressor', aerial_platform: 'Plataforma Elevatória', forklift: 'Empilhadeira',
  concrete_mixer: 'Betoneira', welding_machine: 'Máquina de Solda', drill: 'Perfuratriz',
  roller: 'Rolo Compactador', mini_excavator: 'Mini Escavadeira', skid_loader: 'Mini Carregadeira',
  tractor: 'Trator', trailer: 'Carreta/Reboque', container: 'Container', scaffold: 'Andaime',
  water_truck: 'Caminhão Pipa', dump_truck: 'Caminhão Caçamba', boom_truck: 'Caminhão com Lança',
  other: 'Outro',
};

// Especificações por tipo de equipamento
export type SpecField = { key: string; label: string; type: 'text' | 'number' | 'select'; unit?: string; options?: string[] };

const TRUCK_SPECS: SpecField[] = [
  { key: 'axles', label: 'Eixos', type: 'select', options: ['2', '3', '4', '5', '6', 'Bi-trem', 'Rodo-trem'] },
  { key: 'gvw', label: 'PBT (kg)', type: 'number', unit: 'kg' },
  { key: 'payload', label: 'Capacidade de Carga (kg)', type: 'number', unit: 'kg' },
  { key: 'bodyType', label: 'Tipo de Carroceria', type: 'select', options: ['Aberta', 'Baú', 'Prancha', 'Caçamba', 'Tanque', 'Sider', 'Plataforma'] },
  { key: 'enginePower', label: 'Potência Motor', type: 'text', unit: 'CV' },
  { key: 'fuelType', label: 'Combustível', type: 'select', options: ['Diesel', 'Diesel S-10', 'Flex', 'Elétrico'] },
  { key: 'transmission', label: 'Câmbio', type: 'select', options: ['Manual', 'Automático', 'Automatizado'] },
  { key: 'length', label: 'Comprimento (m)', type: 'number', unit: 'm' },
  { key: 'height', label: 'Altura (m)', type: 'number', unit: 'm' },
  { key: 'renavam', label: 'RENAVAM', type: 'text' },
  { key: 'crlvDate', label: 'Vencimento CRLV', type: 'text' },
];

const MUNCK_CRANE_SPECS: SpecField[] = [
  { key: 'maxCapacity', label: 'Capacidade Máx. (ton)', type: 'number', unit: 'ton' },
  { key: 'maxReach', label: 'Alcance Máx. (m)', type: 'number', unit: 'm' },
  { key: 'maxHeight', label: 'Altura Máx. (m)', type: 'number', unit: 'm' },
  { key: 'boom', label: 'Lança/Braço', type: 'text' },
  { key: 'boomSections', label: 'Seções da Lança', type: 'number' },
  { key: 'stabilizers', label: 'Estabilizadores', type: 'select', options: ['2 patas', '4 patas', 'Hidráulicos', 'Mecânicos'] },
  { key: 'operatingRadius', label: 'Raio de Operação (m)', type: 'number', unit: 'm' },
  { key: 'mountedOn', label: 'Montado sobre', type: 'text' },
  { key: 'artNumber', label: 'Nº ART', type: 'text' },
  { key: 'inspectionDate', label: 'Última Inspeção', type: 'text' },
];

const GENERATOR_COMPRESSOR_SPECS: SpecField[] = [
  { key: 'power', label: 'Potência', type: 'text', unit: 'kVA/kW' },
  { key: 'voltage', label: 'Tensão', type: 'select', options: ['127V', '220V', '380V', '440V', 'Bivolt'] },
  { key: 'phase', label: 'Fase', type: 'select', options: ['Monofásico', 'Bifásico', 'Trifásico'] },
  { key: 'fuelType', label: 'Combustível', type: 'select', options: ['Diesel', 'Gasolina', 'Gás', 'Elétrico'] },
  { key: 'autonomy', label: 'Autonomia (h)', type: 'number', unit: 'h' },
  { key: 'noiseLevel', label: 'Nível de Ruído (dB)', type: 'number', unit: 'dB' },
  { key: 'tankCapacity', label: 'Tanque (L)', type: 'number', unit: 'L' },
  { key: 'soundproof', label: 'Carenado/Silencioso', type: 'select', options: ['Sim', 'Não'] },
];

const EXCAVATOR_LOADER_SPECS: SpecField[] = [
  { key: 'operatingWeight', label: 'Peso Operacional (kg)', type: 'number', unit: 'kg' },
  { key: 'bucketCapacity', label: 'Capacidade da Caçamba (m³)', type: 'number', unit: 'm³' },
  { key: 'digDepth', label: 'Profundidade de Escavação (m)', type: 'number', unit: 'm' },
  { key: 'enginePower', label: 'Potência Motor (HP)', type: 'number', unit: 'HP' },
  { key: 'tracks', label: 'Esteiras/Pneus', type: 'select', options: ['Esteiras', 'Pneus', 'Misto'] },
  { key: 'fuelType', label: 'Combustível', type: 'select', options: ['Diesel', 'Elétrico'] },
];

const AERIAL_PLATFORM_SPECS: SpecField[] = [
  { key: 'maxHeight', label: 'Altura Máx. (m)', type: 'number', unit: 'm' },
  { key: 'maxCapacity', label: 'Capacidade (kg)', type: 'number', unit: 'kg' },
  { key: 'platformType', label: 'Tipo', type: 'select', options: ['Tesoura', 'Articulada', 'Telescópica', 'Mastro Vertical'] },
  { key: 'drive', label: 'Tração', type: 'select', options: ['Elétrica', 'Diesel', '4x4'] },
  { key: 'horizontalReach', label: 'Alcance Horizontal (m)', type: 'number', unit: 'm' },
];

const FORKLIFT_SPECS: SpecField[] = [
  { key: 'maxCapacity', label: 'Capacidade (kg)', type: 'number', unit: 'kg' },
  { key: 'liftHeight', label: 'Altura de Elevação (m)', type: 'number', unit: 'm' },
  { key: 'fuelType', label: 'Combustível', type: 'select', options: ['Diesel', 'GLP', 'Elétrica'] },
  { key: 'mastType', label: 'Tipo Mastro', type: 'select', options: ['Simples', 'Duplo', 'Triplo'] },
  { key: 'tireType', label: 'Tipo Pneu', type: 'select', options: ['Maciço', 'Pneumático', 'Superelástico'] },
];

const GENERIC_SPECS: SpecField[] = [
  { key: 'maxCapacity', label: 'Capacidade', type: 'text' },
  { key: 'power', label: 'Potência', type: 'text' },
  { key: 'dimensions', label: 'Dimensões (CxLxA)', type: 'text' },
  { key: 'weight', label: 'Peso (kg)', type: 'number', unit: 'kg' },
  { key: 'fuelType', label: 'Combustível', type: 'select', options: ['Diesel', 'Gasolina', 'Elétrico', 'N/A'] },
];

export const SPEC_FIELDS: Record<string, SpecField[]> = {
  munck: MUNCK_CRANE_SPECS,
  crane: MUNCK_CRANE_SPECS,
  boom_truck: MUNCK_CRANE_SPECS,
  truck: TRUCK_SPECS,
  flatbed_truck: TRUCK_SPECS,
  dump_truck: TRUCK_SPECS,
  water_truck: TRUCK_SPECS,
  generator: GENERATOR_COMPRESSOR_SPECS,
  compressor: GENERATOR_COMPRESSOR_SPECS,
  welding_machine: GENERATOR_COMPRESSOR_SPECS,
  excavator: EXCAVATOR_LOADER_SPECS,
  backhoe: EXCAVATOR_LOADER_SPECS,
  mini_excavator: EXCAVATOR_LOADER_SPECS,
  skid_loader: EXCAVATOR_LOADER_SPECS,
  roller: EXCAVATOR_LOADER_SPECS,
  tractor: EXCAVATOR_LOADER_SPECS,
  aerial_platform: AERIAL_PLATFORM_SPECS,
  forklift: FORKLIFT_SPECS,
  drill: GENERIC_SPECS,
  concrete_mixer: GENERIC_SPECS,
  trailer: GENERIC_SPECS,
  container: GENERIC_SPECS,
  scaffold: GENERIC_SPECS,
  other: GENERIC_SPECS,
};
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
