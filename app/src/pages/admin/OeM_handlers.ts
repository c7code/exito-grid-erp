// Shared types and default values for OeM module

export const TIPO_LABELS: Record<string, string> = {
  preventiva: 'Preventiva',
  preditiva: 'Preditiva',
  corretiva: 'Corretiva',
};

export const TIPO_COLORS: Record<string, string> = {
  preventiva: 'bg-blue-100 text-blue-700 border-blue-200',
  preditiva: 'bg-purple-100 text-purple-700 border-purple-200',
  corretiva: 'bg-red-100 text-red-700 border-red-200',
};

export const TIPO_ICONS: Record<string, string> = {
  preventiva: '🔧',
  preditiva: '📊',
  corretiva: '⚡',
};

export const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  agendado: 'bg-blue-100 text-blue-700',
  em_andamento: 'bg-orange-100 text-orange-700',
  concluido: 'bg-green-100 text-green-700',
  cancelado: 'bg-gray-100 text-gray-500',
};

export const PRIORIDADE_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const PRIORIDADE_COLORS: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  alta: 'bg-orange-100 text-orange-600',
  urgente: 'bg-red-100 text-red-600',
};

export const emptyUsina = { nome: '', potenciaKwp: '', qtdModulos: '', modeloModulos: '', qtdInversores: '1', modeloInversores: '', marcaInversor: '', dataInstalacao: new Date().toISOString().split('T')[0], tipoTelhado: '', endereco: '', geracaoMensalEsperadaKwh: '', clienteId: '', empresaId: '', status: 'ativa', observacoes: '' };

export const emptyPlano = { nome: '', descricao: '', tipoPlano: 'standard', incluiLimpeza: true, incluiInspecaoVisual: true, incluiTermografia: false, incluiTesteString: false, incluiMonitoramentoRemoto: false, incluiCorretivaPrioritaria: false, incluiSeguro: false, incluiRelatorio: true, garantiaPerformancePr: '', frequenciaPreventiva: 'semestral', frequenciaRelatorio: 'trimestral', precoBaseMensal: '', kwpLimiteBase: '10', precoKwpExcedente: '', unidadeCobranca: 'kWp', custoMobilizacao: '0', tempoRespostaSlaHoras: '48', tempoRespostaUrgenteHoras: '4', atendimentoHorario: 'comercial', coberturaMaxAnual: '', limiteCorretivas: '', abrangenciaKm: '', termosDuracaoMeses: '12', descontoAnualPercent: '0', exclusoes: '', penalidades: '', beneficios: '', ativo: true };

export const emptyContrato = { clienteId: '', usinaId: '', planoId: '', dataInicio: new Date().toISOString().split('T')[0], dataFim: '', valorMensal: '', indiceReajuste: 'IGPM', renovacaoAutomatica: true, status: 'ativo', observacoes: '' };

export const emptyServico = { tipo: 'preventiva', usinaId: '', clienteId: '', prioridade: 'normal', descricao: '', dataAgendada: '', valorEstimado: '', tecnicoResponsavel: '', observacoes: '', checklist: '[]' };

export const fmt = (v: any) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
