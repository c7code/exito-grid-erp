import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProposalStatus } from './proposal.entity';

// ═══════════════════════════════════════════════════════════════
// Nested DTO: ProposalItem
// ═══════════════════════════════════════════════════════════════

export class CreateProposalItemDto {
  @ApiPropertyOptional({ description: 'UUID do item (para updates)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Descrição do item' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Unidade (un, m, CDA, etc.)' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Tipo de serviço' })
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiProperty({ description: 'Preço unitário' })
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Quantidade', default: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ description: 'Total do item' })
  @IsNumber()
  total: number;

  @ApiPropertyOptional({ description: 'Item é pai de agrupamento (bundle)' })
  @IsOptional()
  @IsBoolean()
  isBundleParent?: boolean;

  @ApiPropertyOptional({ description: 'UUID do item pai (agrupamento)' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Exibir preços detalhados no PDF' })
  @IsOptional()
  @IsBoolean()
  showDetailedPrices?: boolean;

  @ApiPropertyOptional({ description: 'Exibir título do agrupamento no PDF' })
  @IsOptional()
  @IsBoolean()
  showGroupTitle?: boolean;

  @ApiPropertyOptional({ description: 'Preço cobrado (override manual)' })
  @IsOptional()
  @IsNumber()
  overridePrice?: number;

  @ApiPropertyOptional({ description: 'Item sugerido automaticamente' })
  @IsOptional()
  @IsBoolean()
  isSuggested?: boolean;

  @ApiPropertyOptional({ description: 'Regra que sugeriu o item' })
  @IsOptional()
  @IsString()
  suggestedByRule?: string;

  @ApiPropertyOptional({ description: 'Observações do item' })
  @IsOptional()
  @IsString()
  notes?: string;

  // ── SINAPI fields ──

  @ApiPropertyOptional({ description: 'Item vinculado a composição SINAPI' })
  @IsOptional()
  @IsBoolean()
  isSinapiLinked?: boolean;

  @ApiPropertyOptional({ description: 'Código da composição SINAPI' })
  @IsOptional()
  @IsString()
  sinapiCompositionCode?: string;

  @ApiPropertyOptional({ description: 'UUID da composição SINAPI' })
  @IsOptional()
  @IsUUID()
  sinapiCompositionId?: string;

  @ApiPropertyOptional({ description: 'Referência mensal SINAPI (UUID)' })
  @IsOptional()
  @IsUUID()
  sinapiReferenceId?: string;

  @ApiPropertyOptional({ description: 'Custo unitário SINAPI (congelado)' })
  @IsOptional()
  @IsNumber()
  sinapiUnitCost?: number;

  @ApiPropertyOptional({ description: 'BDI total aplicado (%)' })
  @IsOptional()
  @IsNumber()
  sinapiBdiPercent?: number;

  @ApiPropertyOptional({ description: 'Perfil de precificação SINAPI (UUID)' })
  @IsOptional()
  @IsUUID()
  sinapiPricingProfileId?: string;

  @ApiPropertyOptional({ description: 'Preço de venda calculado SINAPI' })
  @IsOptional()
  @IsNumber()
  sinapiSellingPrice?: number;

  @ApiPropertyOptional({ description: 'JSON snapshot da precificação SINAPI' })
  @IsOptional()
  @IsString()
  sinapiPricingSnapshot?: string;

  @ApiPropertyOptional({ description: 'Data de congelamento dos valores SINAPI' })
  @IsOptional()
  @Type(() => Date)
  sinapiFrozenAt?: Date;
}

// ═══════════════════════════════════════════════════════════════
// Nested DTO: Proposal data (the "proposal" object in body)
// ═══════════════════════════════════════════════════════════════

export class ProposalDataDto {
  @ApiPropertyOptional({ description: 'Título da proposta' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'UUID do cliente' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'UUID da oportunidade' })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @ApiPropertyOptional({ description: 'Status da proposta', enum: ProposalStatus })
  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;

  @ApiPropertyOptional({ description: 'Subtotal' })
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Desconto' })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ description: 'Total' })
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiPropertyOptional({ description: 'Data de validade' })
  @IsOptional()
  @Type(() => Date)
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Escopo da proposta' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Prazo de execução' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'Condições de pagamento' })
  @IsOptional()
  @IsString()
  paymentConditions?: string;

  @ApiPropertyOptional({ description: 'JSON da simulação financeira' })
  @IsOptional()
  @IsString()
  simulationData?: string;

  @ApiPropertyOptional({ description: 'Obrigações' })
  @IsOptional()
  @IsString()
  obligations?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Motivo de rejeição' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  // ── Campos de contrato / proposta comercial ──

  @ApiPropertyOptional({ description: 'Descrição/nome da obra' })
  @IsOptional()
  @IsString()
  workDescription?: string;

  @ApiPropertyOptional({ description: 'Endereço da obra' })
  @IsOptional()
  @IsString()
  workAddress?: string;

  @ApiPropertyOptional({ description: 'Cláusula fornecimento de materiais' })
  @IsOptional()
  @IsString()
  materialFornecimento?: string;

  @ApiPropertyOptional({ description: 'Cláusula faturamento direto' })
  @IsOptional()
  @IsString()
  materialFaturamento?: string;

  @ApiPropertyOptional({ description: 'Cláusula execução do serviço' })
  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @ApiPropertyOptional({ description: 'Dados bancários' })
  @IsOptional()
  @IsString()
  paymentBank?: string;

  @ApiPropertyOptional({ description: 'Condição de vencimento/NF' })
  @IsOptional()
  @IsString()
  paymentDueCondition?: string;

  @ApiPropertyOptional({ description: 'Prazo em dias' })
  @IsOptional()
  @IsNumber()
  workDeadlineDays?: number;

  @ApiPropertyOptional({ description: 'Tipo de prazo: business_days | calendar_days' })
  @IsOptional()
  @IsString()
  workDeadlineType?: string;

  @ApiPropertyOptional({ description: 'Texto editável do prazo' })
  @IsOptional()
  @IsString()
  workDeadlineText?: string;

  @ApiPropertyOptional({ description: 'Tipo de objetivo: service_only | supply_only | supply_and_service' })
  @IsOptional()
  @IsString()
  objectiveType?: string;

  @ApiPropertyOptional({ description: 'Texto descritivo do objetivo' })
  @IsOptional()
  @IsString()
  objectiveText?: string;

  @ApiPropertyOptional({ description: 'JSON: prazos de terceiros' })
  @IsOptional()
  @IsString()
  thirdPartyDeadlines?: string;

  @ApiPropertyOptional({ description: 'Obrigações CONTRATADA' })
  @IsOptional()
  @IsString()
  contractorObligations?: string;

  @ApiPropertyOptional({ description: 'Obrigações CONTRATANTE' })
  @IsOptional()
  @IsString()
  clientObligations?: string;

  @ApiPropertyOptional({ description: 'Disposições gerais' })
  @IsOptional()
  @IsString()
  generalProvisions?: string;

  @ApiPropertyOptional({ description: 'Tipo de atividade (extensao_rede, energia_solar, etc.)' })
  @IsOptional()
  @IsString()
  activityType?: string;

  // ── Visibilidade dos itens ──

  @ApiPropertyOptional({ description: 'Modo de visibilidade: detailed | summary | text_only' })
  @IsOptional()
  @IsString()
  itemVisibilityMode?: string;

  @ApiPropertyOptional({ description: 'Texto comercial para materiais' })
  @IsOptional()
  @IsString()
  materialSummaryText?: string;

  @ApiPropertyOptional({ description: 'Texto comercial para serviços' })
  @IsOptional()
  @IsString()
  serviceSummaryText?: string;

  @ApiPropertyOptional({ description: 'Label do valor total no modo resumo' })
  @IsOptional()
  @IsString()
  summaryTotalLabel?: string;

  // ── Custos adicionais: Logístico ──

  @ApiPropertyOptional({ description: 'Valor do custo logístico' })
  @IsOptional()
  @IsNumber()
  logisticsCostValue?: number;

  @ApiPropertyOptional({ description: 'Modo custo logístico: visible | embedded | evidenciado' })
  @IsOptional()
  @IsString()
  logisticsCostMode?: string;

  @ApiPropertyOptional({ description: 'Percentual custo logístico' })
  @IsOptional()
  @IsNumber()
  logisticsCostPercent?: number;

  @ApiPropertyOptional({ description: 'Aplicar custo logístico a' })
  @IsOptional()
  @IsString()
  logisticsCostApplyTo?: string;

  @ApiPropertyOptional({ description: '% embutir em Material (logístico)' })
  @IsOptional()
  @IsNumber()
  logisticsCostEmbedMaterialPct?: number;

  @ApiPropertyOptional({ description: '% embutir em Serviço (logístico)' })
  @IsOptional()
  @IsNumber()
  logisticsCostEmbedServicePct?: number;

  @ApiPropertyOptional({ description: 'Texto descritivo custo logístico' })
  @IsOptional()
  @IsString()
  logisticsCostDescription?: string;

  // ── Custos adicionais: Administrativo ──

  @ApiPropertyOptional({ description: 'Valor do custo administrativo' })
  @IsOptional()
  @IsNumber()
  adminCostValue?: number;

  @ApiPropertyOptional({ description: 'Modo custo administrativo' })
  @IsOptional()
  @IsString()
  adminCostMode?: string;

  @ApiPropertyOptional({ description: 'Percentual custo administrativo' })
  @IsOptional()
  @IsNumber()
  adminCostPercent?: number;

  @ApiPropertyOptional({ description: 'Aplicar custo administrativo a' })
  @IsOptional()
  @IsString()
  adminCostApplyTo?: string;

  @ApiPropertyOptional({ description: '% embutir em Material (admin)' })
  @IsOptional()
  @IsNumber()
  adminCostEmbedMaterialPct?: number;

  @ApiPropertyOptional({ description: '% embutir em Serviço (admin)' })
  @IsOptional()
  @IsNumber()
  adminCostEmbedServicePct?: number;

  @ApiPropertyOptional({ description: 'Texto descritivo custo administrativo' })
  @IsOptional()
  @IsString()
  adminCostDescription?: string;

  // ── Custos adicionais: Corretagem ──

  @ApiPropertyOptional({ description: 'Valor do custo de corretagem' })
  @IsOptional()
  @IsNumber()
  brokerageCostValue?: number;

  @ApiPropertyOptional({ description: 'Modo custo corretagem' })
  @IsOptional()
  @IsString()
  brokerageCostMode?: string;

  @ApiPropertyOptional({ description: 'Percentual custo corretagem' })
  @IsOptional()
  @IsNumber()
  brokerageCostPercent?: number;

  @ApiPropertyOptional({ description: 'Aplicar custo corretagem a' })
  @IsOptional()
  @IsString()
  brokerageCostApplyTo?: string;

  @ApiPropertyOptional({ description: '% embutir em Material (corretagem)' })
  @IsOptional()
  @IsNumber()
  brokerageCostEmbedMaterialPct?: number;

  @ApiPropertyOptional({ description: '% embutir em Serviço (corretagem)' })
  @IsOptional()
  @IsNumber()
  brokerageCostEmbedServicePct?: number;

  @ApiPropertyOptional({ description: 'Texto descritivo custo corretagem' })
  @IsOptional()
  @IsString()
  brokerageCostDescription?: string;

  // ── Custos adicionais: Seguro ──

  @ApiPropertyOptional({ description: 'Valor do custo de seguro' })
  @IsOptional()
  @IsNumber()
  insuranceCostValue?: number;

  @ApiPropertyOptional({ description: 'Modo custo seguro' })
  @IsOptional()
  @IsString()
  insuranceCostMode?: string;

  @ApiPropertyOptional({ description: 'Percentual custo seguro' })
  @IsOptional()
  @IsNumber()
  insuranceCostPercent?: number;

  @ApiPropertyOptional({ description: 'Aplicar custo seguro a' })
  @IsOptional()
  @IsString()
  insuranceCostApplyTo?: string;

  @ApiPropertyOptional({ description: '% embutir em Material (seguro)' })
  @IsOptional()
  @IsNumber()
  insuranceCostEmbedMaterialPct?: number;

  @ApiPropertyOptional({ description: '% embutir em Serviço (seguro)' })
  @IsOptional()
  @IsNumber()
  insuranceCostEmbedServicePct?: number;

  @ApiPropertyOptional({ description: 'Texto descritivo custo seguro' })
  @IsOptional()
  @IsString()
  insuranceCostDescription?: string;

  // ── Conformidade / Assinatura / Pricing ──

  @ApiPropertyOptional({ description: 'Texto de conformidade normativa' })
  @IsOptional()
  @IsString()
  complianceText?: string;

  @ApiPropertyOptional({ description: 'JSON snapshot da precificação OeM' })
  @IsOptional()
  @IsString()
  pricingEngineData?: string;

  @ApiPropertyOptional({ description: 'Número da revisão' })
  @IsOptional()
  @IsNumber()
  revisionNumber?: number;

  @ApiPropertyOptional({ description: 'Rótulo/label customizado' })
  @IsOptional()
  @IsString()
  customLabel?: string;

  @ApiPropertyOptional({ description: 'UUID do consultor indicador' })
  @IsOptional()
  @IsUUID()
  referralConsultantId?: string;
}

// ═══════════════════════════════════════════════════════════════
// 1. CreateProposalDto
// ═══════════════════════════════════════════════════════════════

export class CreateProposalDto {
  @ApiProperty({ description: 'Dados da proposta', type: ProposalDataDto })
  @ValidateNested()
  @Type(() => ProposalDataDto)
  proposal: ProposalDataDto;

  @ApiProperty({ description: 'Itens da proposta', type: [CreateProposalItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  items: CreateProposalItemDto[];
}

// ═══════════════════════════════════════════════════════════════
// 2. UpdateProposalDto
//    Accepts { proposal?, items? } merged with Partial<Proposal> fields
// ═══════════════════════════════════════════════════════════════

export class UpdateProposalDto extends PartialType(ProposalDataDto) {
  @ApiPropertyOptional({ description: 'Dados da proposta (objeto aninhado)', type: ProposalDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProposalDataDto)
  proposal?: ProposalDataDto;

  @ApiPropertyOptional({ description: 'Itens da proposta', type: [CreateProposalItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  items?: CreateProposalItemDto[];
}

// ═══════════════════════════════════════════════════════════════
// 3. UpdateProposalItemsDto
// ═══════════════════════════════════════════════════════════════

export class UpdateProposalItemsDto {
  @ApiProperty({ description: 'Itens da proposta', type: [CreateProposalItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  items: CreateProposalItemDto[];
}

// ═══════════════════════════════════════════════════════════════
// 4. RejectProposalDto
// ═══════════════════════════════════════════════════════════════

export class RejectProposalDto {
  @ApiPropertyOptional({ description: 'Motivo da rejeição' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ═══════════════════════════════════════════════════════════════
// 5. DuplicateProposalDto
// ═══════════════════════════════════════════════════════════════

export class DuplicateProposalDto {
  @ApiPropertyOptional({ description: 'UUID do novo cliente' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Rótulo personalizado para a cópia' })
  @IsOptional()
  @IsString()
  customLabel?: string;
}

// ═══════════════════════════════════════════════════════════════
// 6. UpdateProposalLabelDto
// ═══════════════════════════════════════════════════════════════

export class UpdateProposalLabelDto {
  @ApiProperty({ description: 'Rótulo personalizado da proposta' })
  @IsString()
  @IsNotEmpty()
  customLabel: string;
}

// ═══════════════════════════════════════════════════════════════
// 7. RestoreRevisionDto
// ═══════════════════════════════════════════════════════════════

export class RestoreRevisionDto {
  @ApiProperty({ description: 'UUID da revisão a restaurar' })
  @IsString()
  @IsNotEmpty()
  revisionId: string;
}

// ═══════════════════════════════════════════════════════════════
// 8. DeleteRevisionDto
// ═══════════════════════════════════════════════════════════════

export class DeleteRevisionDto {
  @ApiProperty({ description: 'UUID da revisão a excluir' })
  @IsString()
  @IsNotEmpty()
  revisionId: string;
}

// ═══════════════════════════════════════════════════════════════
// 9. ConfirmProposalSignatureDto (público)
// ═══════════════════════════════════════════════════════════════

export class ConfirmProposalSignatureDto {
  @ApiProperty({ description: 'Nome do signatário' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'CPF/CNPJ do signatário' })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiPropertyOptional({ description: 'Imagem da assinatura em Base64' })
  @IsOptional()
  @IsString()
  signatureImage?: string;
}
