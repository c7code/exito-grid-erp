import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsUUID,
    IsArray, IsDateString, IsIn, IsObject, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ═══════════════════════════════════════════════════════════════
// Nested DTOs (auxiliares)
// ═══════════════════════════════════════════════════════════════

export class FaixaPrecoDto {
    @ApiProperty({ description: 'Valor mínimo da faixa' })
    @IsNumber()
    min: number;

    @ApiPropertyOptional({ description: 'Valor máximo da faixa (null = sem limite)', nullable: true })
    @IsNumber()
    @IsOptional()
    max: number | null;

    @ApiProperty({ description: 'Preço unitário para esta faixa' })
    @IsNumber()
    precoUnitario: number;
}

export class CustoFixoDetalhadoDto {
    @ApiProperty({ description: 'Descrição do custo' })
    @IsString()
    @IsNotEmpty()
    descricao: string;

    @ApiProperty({ description: 'Valor do custo' })
    @IsNumber()
    valor: number;

    @ApiProperty({ description: 'Unidade: dia-homem, km, un' })
    @IsString()
    @IsNotEmpty()
    unidade: string;
}

export class CalculoDetalhadoDto {
    @ApiProperty()
    @IsNumber()
    precoBase: number;

    @ApiProperty()
    @IsNumber()
    kwpExcedente: number;

    @ApiProperty()
    @IsNumber()
    valorExcedente: number;

    @ApiProperty()
    @IsNumber()
    custoMobilizacao: number;

    @ApiProperty()
    @IsString()
    frequencia: string;

    @ApiProperty()
    @IsNumber()
    totalAnual: number;
}

// ═══════════════════════════════════════════════════════════════
// OEM Usina DTOs
// ═══════════════════════════════════════════════════════════════

export class CreateOemUsinaDto {
    @ApiProperty({ description: 'ID do cliente' })
    @IsUUID()
    @IsNotEmpty()
    clienteId: string;

    @ApiPropertyOptional({ description: 'ID da empresa' })
    @IsUUID()
    @IsOptional()
    empresaId?: string;

    @ApiPropertyOptional({ description: 'ID do projeto solar vinculado' })
    @IsUUID()
    @IsOptional()
    projetoSolarId?: string;

    @ApiProperty({ description: 'Nome da usina' })
    @IsString()
    @IsNotEmpty()
    nome: string;

    @ApiProperty({ description: 'Potência em kWp' })
    @IsNumber()
    potenciaKwp: number;

    @ApiProperty({ description: 'Quantidade de módulos' })
    @IsNumber()
    @Min(1)
    qtdModulos: number;

    @ApiPropertyOptional({ description: 'Modelo dos módulos' })
    @IsString()
    @IsOptional()
    modeloModulos?: string;

    @ApiPropertyOptional({ description: 'Quantidade de inversores', default: 1 })
    @IsNumber()
    @IsOptional()
    qtdInversores?: number;

    @ApiPropertyOptional({ description: 'Modelo dos inversores' })
    @IsString()
    @IsOptional()
    modeloInversores?: string;

    @ApiPropertyOptional({ description: 'Marca do inversor' })
    @IsString()
    @IsOptional()
    marcaInversor?: string;

    @ApiPropertyOptional({ description: 'Números de série dos inversores', type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    serialInversores?: string[];

    @ApiProperty({ description: 'Data de instalação (ISO 8601)' })
    @IsDateString()
    @IsNotEmpty()
    dataInstalacao: string;

    @ApiPropertyOptional({ description: 'Tipo de telhado' })
    @IsString()
    @IsOptional()
    tipoTelhado?: string;

    @ApiPropertyOptional({ description: 'Inclinação em graus' })
    @IsNumber()
    @IsOptional()
    inclinacaoGraus?: number;

    @ApiPropertyOptional({ description: 'Azimute em graus' })
    @IsNumber()
    @IsOptional()
    azimuteGraus?: number;

    @ApiProperty({ description: 'Endereço da usina' })
    @IsString()
    @IsNotEmpty()
    endereco: string;

    @ApiPropertyOptional({ description: 'Latitude' })
    @IsNumber()
    @IsOptional()
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude' })
    @IsNumber()
    @IsOptional()
    longitude?: number;

    @ApiPropertyOptional({ description: 'Geração mensal esperada em kWh' })
    @IsNumber()
    @IsOptional()
    geracaoMensalEsperadaKwh?: number;

    @ApiPropertyOptional({ description: 'Geração mensal real atual em kWh' })
    @IsNumber()
    @IsOptional()
    geracaoMensalAtualKwh?: number;

    @ApiPropertyOptional({ description: 'Tarifa de energia R$/kWh' })
    @IsNumber()
    @IsOptional()
    tarifaEnergiaRsKwh?: number;

    @ApiPropertyOptional({ description: 'Tipo de API de monitoramento: growatt | sungrow | fronius | huawei' })
    @IsString()
    @IsOptional()
    apiMonitoramentoTipo?: string;

    @ApiPropertyOptional({ description: 'Credenciais da API de monitoramento' })
    @IsObject()
    @IsOptional()
    apiMonitoramentoCredentials?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Status: ativa | inativa | descomissionada', default: 'ativa' })
    @IsString()
    @IsOptional()
    @IsIn(['ativa', 'inativa', 'descomissionada'])
    status?: string;

    @ApiPropertyOptional({ description: 'Valor estimado da usina R$' })
    @IsNumber()
    @IsOptional()
    valorEstimadoUsina?: number;

    @ApiPropertyOptional({ description: 'Percentual de manutenção (%)', default: 10 })
    @IsNumber()
    @IsOptional()
    percentualManutencao?: number;

    @ApiPropertyOptional({ description: 'Observações' })
    @IsString()
    @IsOptional()
    observacoes?: string;
}

export class UpdateOemUsinaDto extends PartialType(CreateOemUsinaDto) {}

// ═══════════════════════════════════════════════════════════════
// OEM Serviço DTOs
// ═══════════════════════════════════════════════════════════════

export class CreateOemServicoDto {
    @ApiProperty({ description: 'ID da usina' })
    @IsUUID()
    @IsNotEmpty()
    usinaId: string;

    @ApiProperty({ description: 'ID do cliente' })
    @IsUUID()
    @IsNotEmpty()
    clienteId: string;

    @ApiPropertyOptional({ description: 'ID da proposta vinculada' })
    @IsUUID()
    @IsOptional()
    proposalId?: string;

    @ApiProperty({ description: 'Tipo: preventiva | preditiva | corretiva' })
    @IsString()
    @IsNotEmpty()
    @IsIn(['preventiva', 'preditiva', 'corretiva'])
    tipo: string;

    @ApiPropertyOptional({ description: 'Status: pendente | agendado | em_andamento | concluido | cancelado', default: 'pendente' })
    @IsString()
    @IsOptional()
    @IsIn(['pendente', 'agendado', 'em_andamento', 'concluido', 'cancelado'])
    status?: string;

    @ApiPropertyOptional({ description: 'Prioridade: baixa | normal | alta | urgente', default: 'normal' })
    @IsString()
    @IsOptional()
    @IsIn(['baixa', 'normal', 'alta', 'urgente'])
    prioridade?: string;

    @ApiPropertyOptional({ description: 'Descrição do serviço' })
    @IsString()
    @IsOptional()
    descricao?: string;

    @ApiPropertyOptional({ description: 'Diagnóstico (preenchido na conclusão)' })
    @IsString()
    @IsOptional()
    diagnostico?: string;

    @ApiPropertyOptional({ description: 'Solução aplicada' })
    @IsString()
    @IsOptional()
    solucao?: string;

    @ApiPropertyOptional({ description: 'Componentes afetados (JSON string)' })
    @IsString()
    @IsOptional()
    componentesAfetados?: string;

    @ApiPropertyOptional({ description: 'Data agendada (ISO 8601)' })
    @IsDateString()
    @IsOptional()
    dataAgendada?: string;

    @ApiPropertyOptional({ description: 'Data de conclusão (ISO 8601)' })
    @IsDateString()
    @IsOptional()
    dataConclusao?: string;

    @ApiPropertyOptional({ description: 'Valor estimado R$' })
    @IsNumber()
    @IsOptional()
    valorEstimado?: number;

    @ApiPropertyOptional({ description: 'Valor final R$' })
    @IsNumber()
    @IsOptional()
    valorFinal?: number;

    @ApiPropertyOptional({ description: 'Checklist JSON: [{ item, checked, obs? }]' })
    @IsString()
    @IsOptional()
    checklist?: string;

    @ApiPropertyOptional({ description: 'Fotos antes JSON: [{ url, descricao, dataCaptura }]' })
    @IsString()
    @IsOptional()
    fotosAntes?: string;

    @ApiPropertyOptional({ description: 'Fotos depois JSON: [{ url, descricao, dataCaptura }]' })
    @IsString()
    @IsOptional()
    fotosDepois?: string;

    @ApiPropertyOptional({ description: 'Relatório técnico' })
    @IsString()
    @IsOptional()
    relatorioTecnico?: string;

    @ApiPropertyOptional({ description: 'Recomendações futuras' })
    @IsString()
    @IsOptional()
    recomendacoes?: string;

    @ApiPropertyOptional({ description: 'Técnico responsável' })
    @IsString()
    @IsOptional()
    tecnicoResponsavel?: string;

    @ApiPropertyOptional({ description: 'Equipe (JSON string)' })
    @IsString()
    @IsOptional()
    equipe?: string;

    @ApiPropertyOptional({ description: 'Materiais utilizados (JSON string)' })
    @IsString()
    @IsOptional()
    materiaisUtilizados?: string;

    @ApiPropertyOptional({ description: 'Observações' })
    @IsString()
    @IsOptional()
    observacoes?: string;

    // ═══ Proposta Customizada O&M ═════════════════════════════
    @ApiPropertyOptional({ description: 'Título personalizado da proposta' })
    @IsString()
    @IsOptional()
    proposalTitle?: string;

    @ApiPropertyOptional({ description: 'Validade da proposta (data ISO)' })
    @IsString()
    @IsOptional()
    proposalValidUntil?: string;

    @ApiPropertyOptional({ description: 'Modo da proposta: servico | material | misto', default: 'servico' })
    @IsString()
    @IsOptional()
    @IsIn(['servico', 'material', 'misto'])
    proposalMode?: string;

    @ApiPropertyOptional({ description: 'Seções visíveis no PDF (JSON string)' })
    @IsString()
    @IsOptional()
    sectionToggles?: string;

    @ApiPropertyOptional({ description: 'Materiais O&M (JSON string)' })
    @IsString()
    @IsOptional()
    oemMateriais?: string;

    @ApiPropertyOptional({ description: 'Incluir materiais no total da proposta', default: false })
    @IsBoolean()
    @IsOptional()
    incluirMateriaisNoTotal?: boolean;

    @ApiPropertyOptional({ description: 'Subtotal serviços' })
    @IsNumber()
    @IsOptional()
    totalServicos?: number;

    @ApiPropertyOptional({ description: 'Subtotal materiais' })
    @IsNumber()
    @IsOptional()
    totalMateriais?: number;

    @ApiPropertyOptional({ description: 'ID da proposta O&M gerada' })
    @IsString()
    @IsOptional()
    oemProposalId?: string;

    @ApiPropertyOptional({ description: 'Itens extras livres (JSON string)' })
    @IsString()
    @IsOptional()
    oemExtraItems?: string;

    @ApiPropertyOptional({ description: 'Modo de exibição de preços: com_valor | sem_valor | texto' })
    @IsString()
    @IsOptional()
    @IsIn(['com_valor', 'sem_valor', 'texto'])
    oemItemDisplayMode?: string;

    // ═══ Textos Editáveis da Proposta ═════════════════════════
    @ApiPropertyOptional({ description: 'Condições de pagamento' })
    @IsString()
    @IsOptional()
    paymentConditions?: string;

    @ApiPropertyOptional({ description: 'Obrigações da contratada' })
    @IsString()
    @IsOptional()
    contractorObligations?: string;

    @ApiPropertyOptional({ description: 'Obrigações do cliente' })
    @IsString()
    @IsOptional()
    clientObligations?: string;

    @ApiPropertyOptional({ description: 'Disposições gerais' })
    @IsString()
    @IsOptional()
    generalProvisions?: string;

    @ApiPropertyOptional({ description: 'Texto de conformidade' })
    @IsString()
    @IsOptional()
    complianceText?: string;
}

export class UpdateOemServicoDto extends PartialType(CreateOemServicoDto) {}

export class ConcluirServicoDto {
    @ApiPropertyOptional({ description: 'Diagnóstico do serviço' })
    @IsString()
    @IsOptional()
    diagnostico?: string;

    @ApiPropertyOptional({ description: 'Solução aplicada' })
    @IsString()
    @IsOptional()
    solucao?: string;

    @ApiPropertyOptional({ description: 'Data de conclusão (ISO 8601)' })
    @IsDateString()
    @IsOptional()
    dataConclusao?: string;

    @ApiPropertyOptional({ description: 'Valor final R$' })
    @IsNumber()
    @IsOptional()
    valorFinal?: number;

    @ApiPropertyOptional({ description: 'Checklist atualizado (JSON string)' })
    @IsString()
    @IsOptional()
    checklist?: string;

    @ApiPropertyOptional({ description: 'Fotos depois (JSON string)' })
    @IsString()
    @IsOptional()
    fotosDepois?: string;

    @ApiPropertyOptional({ description: 'Relatório técnico' })
    @IsString()
    @IsOptional()
    relatorioTecnico?: string;

    @ApiPropertyOptional({ description: 'Recomendações futuras' })
    @IsString()
    @IsOptional()
    recomendacoes?: string;

    @ApiPropertyOptional({ description: 'Materiais utilizados (JSON string)' })
    @IsString()
    @IsOptional()
    materiaisUtilizados?: string;

    @ApiPropertyOptional({ description: 'Observações' })
    @IsString()
    @IsOptional()
    observacoes?: string;
}

// ═══════════════════════════════════════════════════════════════
// OEM Plano DTOs
// ═══════════════════════════════════════════════════════════════

export class CreateOemPlanoDto {
    @ApiProperty({ description: 'Nome do plano' })
    @IsString()
    @IsNotEmpty()
    nome: string;

    @ApiPropertyOptional({ description: 'Descrição do plano' })
    @IsString()
    @IsOptional()
    descricao?: string;

    // ═══ Serviços Incluídos ═══════════════════════════════════
    @ApiPropertyOptional({ description: 'Inclui limpeza', default: true })
    @IsBoolean()
    @IsOptional()
    incluiLimpeza?: boolean;

    @ApiPropertyOptional({ description: 'Inclui inspeção visual', default: true })
    @IsBoolean()
    @IsOptional()
    incluiInspecaoVisual?: boolean;

    @ApiPropertyOptional({ description: 'Inclui termografia', default: false })
    @IsBoolean()
    @IsOptional()
    incluiTermografia?: boolean;

    @ApiPropertyOptional({ description: 'Inclui teste de string', default: false })
    @IsBoolean()
    @IsOptional()
    incluiTesteString?: boolean;

    @ApiPropertyOptional({ description: 'Inclui monitoramento remoto', default: false })
    @IsBoolean()
    @IsOptional()
    incluiMonitoramentoRemoto?: boolean;

    @ApiPropertyOptional({ description: 'Inclui corretiva prioritária', default: false })
    @IsBoolean()
    @IsOptional()
    incluiCorretivaPrioritaria?: boolean;

    // ═══ Performance ═════════════════════════════════════════
    @ApiPropertyOptional({ description: 'PR mínimo garantido (ex: 75%)' })
    @IsNumber()
    @IsOptional()
    garantiaPerformancePr?: number;

    @ApiPropertyOptional({ description: 'Frequência: mensal | trimestral | semestral | anual', default: 'semestral' })
    @IsString()
    @IsOptional()
    @IsIn(['mensal', 'trimestral', 'semestral', 'anual'])
    frequenciaPreventiva?: string;

    // ═══ Precificação ════════════════════════════════════════
    @ApiProperty({ description: 'Preço base mensal R$' })
    @IsNumber()
    precoBaseMensal: number;

    @ApiPropertyOptional({ description: 'Limite de kWp incluído no preço base', default: 10 })
    @IsNumber()
    @IsOptional()
    kwpLimiteBase?: number;

    @ApiPropertyOptional({ description: 'Preço por kWp excedente' })
    @IsNumber()
    @IsOptional()
    precoKwpExcedente?: number;

    // ═══ Faixas de Preço ═════════════════════════════════════
    @ApiPropertyOptional({ description: 'Unidade de cobrança: kWp | módulo | Wp | visita', default: 'kWp' })
    @IsString()
    @IsOptional()
    @IsIn(['kWp', 'módulo', 'Wp', 'visita'])
    unidadeCobranca?: string;

    @ApiPropertyOptional({ description: 'Faixas de preço degressivas', type: [FaixaPrecoDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FaixaPrecoDto)
    @IsOptional()
    faixasPreco?: FaixaPrecoDto[];

    // ═══ Custos Fixos ════════════════════════════════════════
    @ApiPropertyOptional({ description: 'Custo de mobilização R$', default: 0 })
    @IsNumber()
    @IsOptional()
    custoMobilizacao?: number;

    @ApiPropertyOptional({ description: 'Custos fixos detalhados', type: [CustoFixoDetalhadoDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustoFixoDetalhadoDto)
    @IsOptional()
    custosFixosDetalhados?: CustoFixoDetalhadoDto[];

    @ApiPropertyOptional({ description: 'Plano ativo', default: true })
    @IsBoolean()
    @IsOptional()
    ativo?: boolean;

    // ═══ Tipo do Plano ═══════════════════════════════════════
    @ApiPropertyOptional({ description: 'Tipo: basico | standard | premium | enterprise', default: 'standard' })
    @IsString()
    @IsOptional()
    @IsIn(['basico', 'standard', 'premium', 'enterprise'])
    tipoPlano?: string;

    // ═══ SLA ═════════════════════════════════════════════════
    @ApiPropertyOptional({ description: 'Tempo de resposta SLA em horas', default: 48 })
    @IsNumber()
    @IsOptional()
    tempoRespostaSlaHoras?: number;

    @ApiPropertyOptional({ description: 'Tempo de resposta urgente em horas', default: 4 })
    @IsNumber()
    @IsOptional()
    tempoRespostaUrgenteHoras?: number;

    @ApiPropertyOptional({ description: 'Horário de atendimento: comercial | estendido | 24x7', default: 'comercial' })
    @IsString()
    @IsOptional()
    @IsIn(['comercial', 'estendido', '24x7'])
    atendimentoHorario?: string;

    // ═══ Cobertura e Limites ═════════════════════════════════
    @ApiPropertyOptional({ description: 'Cobertura máxima anual R$' })
    @IsNumber()
    @IsOptional()
    coberturaMaxAnual?: number;

    @ApiPropertyOptional({ description: 'Limite de corretivas/ano incluídas' })
    @IsNumber()
    @IsOptional()
    limiteCorretivas?: number;

    @ApiPropertyOptional({ description: 'Raio máximo de atendimento em km' })
    @IsNumber()
    @IsOptional()
    abrangenciaKm?: number;

    @ApiPropertyOptional({ description: 'Inclui seguro', default: false })
    @IsBoolean()
    @IsOptional()
    incluiSeguro?: boolean;

    // ═══ Relatórios ══════════════════════════════════════════
    @ApiPropertyOptional({ description: 'Inclui relatório', default: true })
    @IsBoolean()
    @IsOptional()
    incluiRelatorio?: boolean;

    @ApiPropertyOptional({ description: 'Frequência do relatório: mensal | trimestral | semestral | anual', default: 'trimestral' })
    @IsString()
    @IsOptional()
    @IsIn(['mensal', 'trimestral', 'semestral', 'anual'])
    frequenciaRelatorio?: string;

    // ═══ Termos do Contrato ══════════════════════════════════
    @ApiPropertyOptional({ description: 'Duração em meses', default: 12 })
    @IsNumber()
    @IsOptional()
    termosDuracaoMeses?: number;

    @ApiPropertyOptional({ description: 'Desconto anual (%)', default: 0 })
    @IsNumber()
    @IsOptional()
    descontoAnualPercent?: number;

    @ApiPropertyOptional({ description: 'Exclusões (o que NÃO está coberto)' })
    @IsString()
    @IsOptional()
    exclusoes?: string;

    @ApiPropertyOptional({ description: 'Penalidades por descumprimento de SLA' })
    @IsString()
    @IsOptional()
    penalidades?: string;

    @ApiPropertyOptional({ description: 'Benefícios extras do plano' })
    @IsString()
    @IsOptional()
    beneficios?: string;
}

export class UpdateOemPlanoDto extends PartialType(CreateOemPlanoDto) {}

// ═══════════════════════════════════════════════════════════════
// OEM Contrato DTOs
// ═══════════════════════════════════════════════════════════════

export class CreateOemContratoDto {
    @ApiProperty({ description: 'ID do cliente' })
    @IsUUID()
    @IsNotEmpty()
    clienteId: string;

    @ApiProperty({ description: 'ID da usina' })
    @IsUUID()
    @IsNotEmpty()
    usinaId: string;

    @ApiProperty({ description: 'ID do plano' })
    @IsUUID()
    @IsNotEmpty()
    planoId: string;

    @ApiProperty({ description: 'Data de início (ISO 8601)' })
    @IsDateString()
    @IsNotEmpty()
    dataInicio: string;

    @ApiPropertyOptional({ description: 'Data de fim (null = indeterminado)' })
    @IsDateString()
    @IsOptional()
    dataFim?: string;

    @ApiProperty({ description: 'Valor mensal R$' })
    @IsNumber()
    valorMensal: number;

    @ApiPropertyOptional({ description: 'Índice de reajuste: IGPM | IPCA | fixo' })
    @IsString()
    @IsOptional()
    @IsIn(['IGPM', 'IPCA', 'fixo'])
    indiceReajuste?: string;

    @ApiPropertyOptional({ description: 'Data do próximo reajuste (ISO 8601)' })
    @IsDateString()
    @IsOptional()
    dataProximoReajuste?: string;

    @ApiPropertyOptional({ description: 'Renovação automática', default: true })
    @IsBoolean()
    @IsOptional()
    renovacaoAutomatica?: boolean;

    @ApiPropertyOptional({ description: 'Status: ativo | suspenso | cancelado | encerrado', default: 'ativo' })
    @IsString()
    @IsOptional()
    @IsIn(['ativo', 'suspenso', 'cancelado', 'encerrado'])
    status?: string;

    @ApiPropertyOptional({ description: 'Motivo do cancelamento' })
    @IsString()
    @IsOptional()
    motivoCancelamento?: string;

    @ApiPropertyOptional({ description: 'ID do parceiro (EPN)' })
    @IsString()
    @IsOptional()
    parceiroId?: string;

    @ApiPropertyOptional({ description: 'Observações' })
    @IsString()
    @IsOptional()
    observacoes?: string;

    @ApiPropertyOptional({ description: 'Detalhes do cálculo de preço', type: CalculoDetalhadoDto })
    @ValidateNested()
    @Type(() => CalculoDetalhadoDto)
    @IsOptional()
    calculoDetalhado?: CalculoDetalhadoDto;
}

export class UpdateOemContratoDto extends PartialType(CreateOemContratoDto) {}

// ═══════════════════════════════════════════════════════════════
// Calculate Price DTO
// ═══════════════════════════════════════════════════════════════

export class CalculateOemPriceDto {
    @ApiProperty({ description: 'ID da usina' })
    @IsUUID()
    @IsNotEmpty()
    usinaId: string;

    @ApiProperty({ description: 'ID do plano' })
    @IsUUID()
    @IsNotEmpty()
    planoId: string;
}
