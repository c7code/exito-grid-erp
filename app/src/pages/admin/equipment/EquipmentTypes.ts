export const STATUS_MAP: Record<string, { l: string; c: string }> = {
  available: { l: 'Disponível', c: 'bg-green-100 text-green-800' },
  rented: { l: 'Locado', c: 'bg-blue-100 text-blue-800' },
  maintenance: { l: 'Manutenção', c: 'bg-orange-100 text-orange-800' },
  inactive: { l: 'Inativo', c: 'bg-gray-100 text-gray-600' },
};
export const TYPE_MAP: Record<string, string> = {
  mobile: 'Móvel', stationary: 'Estacionário',
};
export const CAT_MAP: Record<string, string> = {
  munck: 'Munck', crane: 'Guindaste', truck: 'Caminhão', flatbed_truck: 'Caminhão Prancha',
  excavator: 'Retroescavadeira', backhoe: 'Pá Carregadeira', generator: 'Gerador',
  compressor: 'Compressor', aerial_platform: 'Plataforma Elevatória', forklift: 'Empilhadeira',
  concrete_mixer: 'Betoneira', welding_machine: 'Máquina de Solda', drill: 'Perfuratriz',
  roller: 'Rolo Compactador', mini_excavator: 'Mini Escavadeira', skid_loader: 'Mini Carregadeira',
  tractor: 'Trator', trailer: 'Carreta/Reboque', container: 'Container', scaffold: 'Andaime',
  water_truck: 'Caminhão Pipa', dump_truck: 'Caminhão Caçamba', boom_truck: 'Caminhão com Lança',
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
export const SVC_TYPE: Record<string, string> = { lifting: 'Içamento', transport: 'Transporte', installation: 'Instalação', removal: 'Remoção' };
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

// ═══ CLÁUSULAS INTELIGENTES POR CATEGORIA (proteção patrimonial) ═══
export const CATEGORY_CLAUSES: Record<string, string[]> = {
  // ── Pesado: Içamento ──
  munck: [
    'Operação exclusiva por operador habilitado e certificado pela CONTRATADA.',
    'ART de serviço de içamento/movimentação de carga é obrigatória e emitida pela CONTRATADA.',
    'O CONTRATANTE deve garantir solo firme, nivelado e com capacidade de suporte para estabilizadores hidráulicos.',
    'É proibido exceder a capacidade de carga conforme tabela de momentos do equipamento.',
    'Área de isolamento de segurança é obrigatória durante toda a operação de içamento.',
    'O CONTRATANTE deve informar previamente o peso e dimensões da carga a ser movimentada.',
  ],
  crane: [
    'Operação exclusiva por operador habilitado com curso de rigger/sinaleiro.',
    'ART de serviço de içamento obrigatória, emitida por engenheiro responsável.',
    'Plano de rigging obrigatório para cargas acima de 50% da capacidade nominal.',
    'Solo deve suportar a pressão dos estabilizadores conforme manual do fabricante.',
    'É proibido exceder a capacidade de carga conforme tabela de momentos e raio de operação.',
    'Isolamento de área num raio mínimo de 1,5x o comprimento da lança durante operação.',
  ],
  boom_truck: [
    'Operação exclusiva por operador habilitado e certificado.',
    'O CONTRATANTE deve garantir acesso rodoviário compatível com o gabarito do veículo.',
    'Solo firme e nivelado para estabilizadores durante operação da lança.',
    'Proibido exceder capacidade de carga conforme tabela de momentos do equipamento.',
    'Isolamento da área durante operação de movimentação de carga.',
  ],

  // ── Pesado: Veicular ──
  truck: [
    'Documentação veicular (CRLV) em dia, sob responsabilidade da CONTRATADA.',
    'O CONTRATANTE deve garantir vias de acesso compatíveis com peso bruto e gabarito do veículo.',
    'Proibido tráfego em vias com restrição de peso ou altura sem autorização prévia.',
    'Abastecimento de combustível conforme acordado nesta proposta.',
    'Danos causados por sobrecarga são de responsabilidade integral do CONTRATANTE.',
  ],
  flatbed_truck: [
    'Documentação veicular (CRLV) em dia, sob responsabilidade da CONTRATADA.',
    'O CONTRATANTE deve garantir vias de acesso compatíveis com peso bruto e comprimento do veículo.',
    'Carga e descarga são de responsabilidade do CONTRATANTE, salvo acordo em contrário.',
    'Amarração e acondicionamento de carga devem seguir normas do CONTRAN.',
    'Proibido exceder a capacidade de carga indicada no documento do veículo.',
  ],
  dump_truck: [
    'Documentação veicular (CRLV) em dia, sob responsabilidade da CONTRATADA.',
    'O CONTRATANTE deve garantir vias e área de basculamento compatíveis com o veículo.',
    'Proibido basculamento próximo a redes elétricas ou estruturas sem distância de segurança.',
    'Material a ser transportado deve ser informado previamente para verificação de compatibilidade.',
  ],
  water_truck: [
    'Documentação veicular (CRLV) em dia, sob responsabilidade da CONTRATADA.',
    'Abastecimento de água é de responsabilidade do CONTRATANTE, salvo acordo em contrário.',
    'Uso restrito a água potável ou água para construção civil conforme especificado.',
    'O CONTRATANTE deve fornecer ponto de abastecimento acessível ao veículo.',
  ],

  // ── Pesado: Terraplenagem ──
  excavator: [
    'O CONTRATANTE deve sinalizar e informar redes subterrâneas (água, gás, elétrica, telecom) na área de operação.',
    'Proibida operação em taludes com inclinação superior a 30° sem análise prévia de engenheiro.',
    'Abastecimento de combustível é de responsabilidade do CONTRATANTE, salvo acordo em contrário.',
    'Área de operação deve ser demarcada e sinalizada durante o trabalho.',
    'O CONTRATANTE é responsável por eventuais danos a redes subterrâneas não informadas.',
  ],
  backhoe: [
    'O CONTRATANTE deve informar e sinalizar redes subterrâneas na área de operação.',
    'Proibida operação em solos instáveis sem avaliação prévia.',
    'Abastecimento de combustível conforme acordado nesta proposta.',
    'Área de operação deve ser demarcada e sinalizada.',
  ],
  mini_excavator: [
    'O CONTRATANTE deve informar e sinalizar redes subterrâneas na área de operação.',
    'Garantir acesso adequado para transporte e deslocamento do equipamento.',
    'Abastecimento conforme acordado nesta proposta.',
    'Proibido uso em áreas confinadas sem ventilação adequada.',
  ],
  skid_loader: [
    'O CONTRATANTE deve garantir piso com capacidade de suporte para o equipamento.',
    'Sinalizar redes subterrâneas e obstáculos na área de operação.',
    'Abastecimento de combustível conforme acordado nesta proposta.',
  ],
  roller: [
    'O CONTRATANTE deve garantir que o material a ser compactado esteja preparado conforme especificação técnica.',
    'Abastecimento de água (para rolos lisos) é de responsabilidade do CONTRATANTE.',
    'Abastecimento de combustível conforme acordado nesta proposta.',
  ],
  tractor: [
    'Via de acesso compatível com dimensões e peso do equipamento.',
    'Verificar embreamento e acoplamento de implementos antes de cada operação.',
    'Velocidade máxima de operação conforme condições do terreno.',
    'Abastecimento de combustível conforme acordado nesta proposta.',
  ],

  // ── Médio: Energia/Ar ──
  generator: [
    'O CONTRATANTE deve fornecer local ventilado, protegido de intempéries e com piso nivelado.',
    'Instalação elétrica de interligação e quadro de transferência são de responsabilidade do CONTRATANTE.',
    'Abastecimento de combustível é de responsabilidade do CONTRATANTE, salvo acordo em contrário.',
    'Proibido exceder a carga nominal (kVA) do equipamento.',
    'O CONTRATANTE deve providenciar aterramento adequado no local de instalação.',
  ],
  compressor: [
    'O CONTRATANTE deve fornecer local ventilado e protegido para operação do equipamento.',
    'Mangueiras e conexões pneumáticas são de responsabilidade do CONTRATANTE, salvo se incluídas.',
    'Abastecimento de combustível (modelos diesel) conforme acordado nesta proposta.',
    'Proibido exceder a pressão máxima de operação indicada no manômetro.',
  ],
  welding_machine: [
    'O CONTRATANTE deve fornecer local com ventilação adequada e piso seco.',
    'Eletrodos, arames e consumíveis de solda são de responsabilidade do CONTRATANTE.',
    'Instalação elétrica compatível com a potência do equipamento é de responsabilidade do CONTRATANTE.',
    'O operador deve utilizar EPIs adequados (máscara, luvas, avental) durante toda a operação.',
  ],

  // ── Médio: Altura ──
  aerial_platform: [
    'O operador deve possuir curso NR-35 (Trabalho em Altura) válido e atualizado.',
    'O CONTRATANTE deve garantir piso nivelado, firme e com capacidade de carga para o equipamento.',
    'Proibido uso com ventos superiores a 40 km/h ou condições climáticas adversas.',
    'Carga máxima na plataforma conforme plaqueta do fabricante (inclui peso dos ocupantes).',
    'EPIs obrigatórios: cinto de segurança tipo paraquedista com talabarte preso à plataforma.',
  ],
  scaffold: [
    'Montagem e desmontagem exclusiva por equipe habilitada conforme NR-18.',
    'Verificar travamento, ancoragem e nivelamento antes de cada uso.',
    'Respeitar carga máxima por plataforma de trabalho conforme manual.',
    'NR-18 e NR-35 aplicáveis durante todo o período de uso.',
    'O CONTRATANTE é responsável pela guarda e integridade das peças durante o período de locação.',
  ],

  // ── Médio: Logístico ──
  forklift: [
    'Operação exclusiva por operador habilitado com CNH categoria B e curso de operação de empilhadeira.',
    'O CONTRATANTE deve manter piso limpo, nivelado e livre de obstáculos na área de operação.',
    'Carga máxima conforme plaqueta do equipamento — inclui peso do palete/acessório.',
    'Sinalização sonora (buzina de ré) e luminosa devem estar funcionais durante toda a operação.',
    'Abastecimento (GLP, diesel ou carga de bateria) conforme acordado nesta proposta.',
  ],
  container: [
    'O CONTRATANTE deve fornecer solo nivelado e com capacidade de suporte para apoio do container.',
    'O CONTRATANTE é responsável pela guarda e segurança do conteúdo armazenado.',
    'Proibido armazenar materiais inflamáveis, tóxicos ou perigosos sem autorização prévia por escrito.',
    'Não exceder carga máxima de empilhamento ou peso interno conforme especificação.',
    'Devolução nas mesmas condições de entrega — limpeza interna é de responsabilidade do CONTRATANTE.',
  ],
  trailer: [
    'O CONTRATANTE deve garantir via de acesso compatível com dimensões do reboque/carreta.',
    'Carga e descarga são de responsabilidade do CONTRATANTE.',
    'Amarração e acondicionamento de carga conforme normas vigentes.',
    'Verificar embreamento/acoplamento e sistema de freios antes de cada deslocamento.',
  ],

  // ── Leve: Ferramentas ──
  drill: [
    'Devolução limpa e em condições normais de uso, sem danos mecânicos.',
    'Acessórios consumíveis (brocas, discos, ponteiras) são de responsabilidade do CONTRATANTE.',
    'Uso conforme manual do fabricante — proibido uso em ambientes com risco de explosão.',
    'O CONTRATANTE é responsável por fornecer energia elétrica compatível com o equipamento.',
    'Danos por queda, impacto ou uso inadequado são de responsabilidade do CONTRATANTE.',
  ],
  concrete_mixer: [
    'Limpeza interna imediata após cada uso é obrigatória — danos por endurecimento de concreto são de responsabilidade do CONTRATANTE.',
    'Proibido misturar produtos químicos não especificados pelo fabricante.',
    'Verificar nível de óleo e estado das correias antes de cada uso.',
    'O CONTRATANTE deve fornecer energia elétrica compatível (modelos elétricos) ou combustível (modelos a gasolina).',
  ],

  // ── Leve: Monitoramento/Eletrônico ──
  other: [
    'Uso conforme manual e especificações técnicas do fabricante.',
    'Devolução nas mesmas condições de retirada — com todos os acessórios, cabos e embalagem original.',
    'Transporte em case/embalagem adequada para proteção contra impacto e umidade.',
    'Proibido uso em ambientes com temperatura ou umidade fora da faixa operacional especificada.',
    'Danos por mau uso, queda ou negligência são de responsabilidade integral do CONTRATANTE.',
    'Proibida sublocação, cessão ou empréstimo a terceiros sem autorização prévia por escrito.',
  ],
};

// Helper para obter cláusulas por categoria (com fallback para genérico)
export function getClausesForCategory(category: string): string[] {
  return CATEGORY_CLAUSES[category] || CATEGORY_CLAUSES['other'] || [];
}

// ═══ BILLING MODALITY LABELS ═══
export const BILLING_MODALITY_LABEL: Record<string, string> = {
  daily: 'Diária', monthly: 'Mensal', hourly: 'Por Hora', fixed_period: 'Período Fechado',
};

// ═══ RATE MODE LABELS ═══
export const RATE_MODE_LABEL: Record<string, string> = {
  percent: '%', fixed: 'R$',
};

export const fmt = (v: any) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fD = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
