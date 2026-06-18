import {
  IsString, IsOptional, IsNotEmpty, IsUUID, IsBoolean, IsNumber,
  IsArray, IsEnum, IsInt, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ConditionOperator, RuleResult } from './document-type-rule.entity';
import { RetentionAction } from './retention-policy.entity';
import { Applicability } from './employee-doc-requirement.entity';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT CATEGORIES
// ═══════════════════════════════════════════════════════════════

export class CreateComplianceCategoryDto {
  @ApiPropertyOptional({ description: 'Slug da categoria (gerado automaticamente se omitido)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Label da categoria' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT TYPES
// ═══════════════════════════════════════════════════════════════

export class CreateDocumentTypeDto {
  @ApiProperty({ description: 'Nome do tipo de documento' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Código único (ex: ASO)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Categoria do documento', default: 'other' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'NRs relacionadas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nrsRelated?: string[];

  @ApiPropertyOptional({ description: 'Validade padrão em meses (null = sem validade)' })
  @IsOptional()
  @IsInt()
  defaultValidityMonths?: number | null;

  @ApiPropertyOptional({ description: 'Requer aprovação?', default: true })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'É obrigatório?', default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ description: 'Permite marcar como não aplicável?', default: true })
  @IsOptional()
  @IsBoolean()
  allowsNotApplicable?: boolean;

  @ApiPropertyOptional({ description: 'Requer justificativa quando não aplica?', default: true })
  @IsOptional()
  @IsBoolean()
  requiresJustification?: boolean;

  @ApiPropertyOptional({ description: 'Formatos de arquivo permitidos', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFormats?: string[];

  @ApiPropertyOptional({ description: 'Descrição do tipo de documento' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ativo?', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateDocumentTypeDto extends PartialType(CreateDocumentTypeDto) {}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT TYPE RULES
// ═══════════════════════════════════════════════════════════════

export class CreateDocumentTypeRuleDto {
  @ApiProperty({ description: 'Campo do funcionário a avaliar (ex: role, specialty)' })
  @IsString()
  @IsNotEmpty()
  conditionField: string;

  @ApiPropertyOptional({ description: 'Operador da condição', enum: ConditionOperator, default: ConditionOperator.EQUALS })
  @IsOptional()
  @IsEnum(ConditionOperator)
  conditionOperator?: ConditionOperator;

  @ApiProperty({ description: 'Valor para comparação (JSON se operador = in)' })
  @IsString()
  @IsNotEmpty()
  conditionValue: string;

  @ApiPropertyOptional({ description: 'Resultado da regra', enum: RuleResult, default: RuleResult.MANDATORY })
  @IsOptional()
  @IsEnum(RuleResult)
  result?: RuleResult;
}

// ═══════════════════════════════════════════════════════════════
// EMPLOYEE REQUIREMENTS (manual add)
// ═══════════════════════════════════════════════════════════════

export class AddManualRequirementDto {
  @ApiPropertyOptional({ description: 'ID do tipo de documento existente' })
  @IsOptional()
  @IsUUID()
  documentTypeId?: string;

  @ApiPropertyOptional({ description: 'Nome customizado (quando não usa tipo existente)' })
  @IsOptional()
  @IsString()
  customName?: string;

  @ApiPropertyOptional({ description: 'Categoria customizada' })
  @IsOptional()
  @IsString()
  customCategory?: string;

  @ApiPropertyOptional({ description: 'NRs customizadas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customNrs?: string[];

  @ApiPropertyOptional({ description: 'Validade em meses customizada' })
  @IsOptional()
  @IsNumber()
  customValidityMonths?: number | null;

  @ApiPropertyOptional({ description: 'Requer aprovação customizada?' })
  @IsOptional()
  @IsBoolean()
  customRequiresApproval?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// APPLICABILITY
// ═══════════════════════════════════════════════════════════════

export class SetApplicabilityDto {
  @ApiProperty({ description: 'Aplicabilidade do requisito (applicable, not_applicable, pending_review)', enum: Applicability })
  @IsEnum(Applicability)
  @IsNotEmpty()
  applicability: Applicability;

  @ApiPropertyOptional({ description: 'Justificativa (obrigatória quando não aplica)' })
  @IsOptional()
  @IsString()
  justification?: string;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE DOC TYPE NAME
// ═══════════════════════════════════════════════════════════════

export class UpdateDocTypeNameDto {
  @ApiProperty({ description: 'Novo nome do tipo de documento' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE DOCUMENTS
// ═══════════════════════════════════════════════════════════════

export class CreateComplianceDocumentDto {
  @ApiPropertyOptional({ description: 'ID do requisito vinculado' })
  @IsOptional()
  @IsUUID()
  requirementId?: string;

  @ApiProperty({ description: 'ID do tipo de documento' })
  @IsUUID()
  @IsNotEmpty()
  documentTypeId: string;

  @ApiProperty({ description: 'Tipo do proprietário (employee, work, equipment, supplier, contract)' })
  @IsString()
  @IsNotEmpty()
  ownerType: string;

  @ApiProperty({ description: 'ID do proprietário' })
  @IsUUID()
  @IsNotEmpty()
  ownerId: string;

  @ApiPropertyOptional({ description: 'Data de emissão' })
  @IsOptional()
  @Type(() => Date)
  issueDate?: Date;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateComplianceDocumentDto {
  @ApiPropertyOptional({ description: 'Data de emissão' })
  @IsOptional()
  @Type(() => Date)
  issueDate?: Date;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observations?: string;
}

// ═══════════════════════════════════════════════════════════════
// APPROVAL / REJECTION
// ═══════════════════════════════════════════════════════════════

export class ApproveDocumentDto {
  @ApiPropertyOptional({ description: 'Comentários da aprovação' })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class RejectDocumentDto {
  @ApiProperty({ description: 'Motivo da rejeição' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ═══════════════════════════════════════════════════════════════
// RETENTION POLICIES
// ═══════════════════════════════════════════════════════════════

export class CreateRetentionPolicyDto {
  @ApiProperty({ description: 'Nome da política' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Tipo de entidade', default: 'compliance_document' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Tempo de retenção em anos', default: 5 })
  @IsOptional()
  @IsInt()
  retentionYears?: number;

  @ApiPropertyOptional({ description: 'Base para cálculo (upload_date ou expiry_date)', default: 'expiry_date' })
  @IsOptional()
  @IsString()
  retentionBase?: string;

  @ApiPropertyOptional({ description: 'Ação ao expirar', enum: RetentionAction, default: RetentionAction.ARCHIVE })
  @IsOptional()
  @IsEnum(RetentionAction)
  actionOnExpiry?: RetentionAction;

  @ApiPropertyOptional({ description: 'Política ativa?', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ZIP DOWNLOAD
// ═══════════════════════════════════════════════════════════════

export class DownloadZipDto {
  @ApiProperty({ description: 'IDs dos funcionários', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds: string[];

  @ApiPropertyOptional({ description: 'Categorias para filtrar', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'IDs dos tipos de documento para filtrar', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentTypeIds?: string[];
}

// ═══════════════════════════════════════════════════════════════
// SAFETY PROGRAMS
// ═══════════════════════════════════════════════════════════════

export class CreateSafetyProgramDto {
  @ApiPropertyOptional({ description: 'ID da empresa' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Tipo do programa (pgr, pcmso, ltcat, ppp, aet, apr, cipa, os_seg)' })
  @IsString()
  @IsNotEmpty()
  programType: string;

  @ApiProperty({ description: 'Nome do programa' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'NR de referência (ex: NR-7, NR-1)' })
  @IsOptional()
  @IsString()
  nrReference?: string;

  @ApiPropertyOptional({ description: 'Nome do responsável (Engenheiro / Médico)' })
  @IsOptional()
  @IsString()
  responsibleName?: string;

  @ApiPropertyOptional({ description: 'Registro do responsável (CREA / CRM)' })
  @IsOptional()
  @IsString()
  responsibleRegistration?: string;

  @ApiPropertyOptional({ description: 'Válido desde' })
  @IsOptional()
  @Type(() => Date)
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Válido até' })
  @IsOptional()
  @Type(() => Date)
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Status (draft, active, expired, reviewing)', default: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'URL do arquivo' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Nome do arquivo' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateSafetyProgramDto extends PartialType(CreateSafetyProgramDto) {}

// ═══════════════════════════════════════════════════════════════
// RISK GROUPS (GHE)
// ═══════════════════════════════════════════════════════════════

export class RiskItemDto {
  @ApiProperty({ description: 'Tipo do risco' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Agente de risco' })
  @IsString()
  agent: string;

  @ApiPropertyOptional({ description: 'NR relacionada' })
  @IsOptional()
  @IsString()
  nr?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRiskGroupDto {
  @ApiPropertyOptional({ description: 'ID do programa de segurança' })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiProperty({ description: 'Nome do GHE (ex: GHE-01 Eletricistas)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Código do GHE (ex: GHE-01)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Funções vinculadas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jobFunctions?: string[];

  @ApiPropertyOptional({ description: 'Riscos do grupo', type: [RiskItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskItemDto)
  risks?: RiskItemDto[];

  @ApiPropertyOptional({ description: 'Periodicidade de exames em meses', default: 12 })
  @IsOptional()
  @IsInt()
  examFrequencyMonths?: number;

  @ApiPropertyOptional({ description: 'GHE ativo?', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRiskGroupDto extends PartialType(CreateRiskGroupDto) {}

// ═══════════════════════════════════════════════════════════════
// RISK GROUP EXAMS
// ═══════════════════════════════════════════════════════════════

export class AddExamToRiskGroupDto {
  @ApiProperty({ description: 'ID do exame ocupacional' })
  @IsUUID()
  @IsNotEmpty()
  examId: string;

  @ApiPropertyOptional({ description: 'Obrigatório na admissão?', default: true })
  @IsOptional()
  @IsBoolean()
  requiredOnAdmission?: boolean;

  @ApiPropertyOptional({ description: 'Obrigatório no periódico?', default: true })
  @IsOptional()
  @IsBoolean()
  requiredOnPeriodic?: boolean;

  @ApiPropertyOptional({ description: 'Obrigatório na demissão?', default: false })
  @IsOptional()
  @IsBoolean()
  requiredOnDismissal?: boolean;

  @ApiPropertyOptional({ description: 'Obrigatório no retorno ao trabalho?', default: false })
  @IsOptional()
  @IsBoolean()
  requiredOnReturn?: boolean;

  @ApiPropertyOptional({ description: 'Obrigatório na mudança de função?', default: false })
  @IsOptional()
  @IsBoolean()
  requiredOnFunctionChange?: boolean;

  @ApiPropertyOptional({ description: 'Validade customizada em meses (sobrescreve a do exame)' })
  @IsOptional()
  @IsInt()
  customValidityMonths?: number;
}

export class UpdateRiskGroupExamDto extends PartialType(AddExamToRiskGroupDto) {}

// ═══════════════════════════════════════════════════════════════
// OCCUPATIONAL EXAMS (catálogo)
// ═══════════════════════════════════════════════════════════════

export class CreateOccExamDto {
  @ApiProperty({ description: 'Nome do exame' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Código único do exame (ex: AUDIO)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Grupo (laboratorial, complementar, clinico)', default: 'laboratorial' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ description: 'Validade em meses (null = sem validade)' })
  @IsOptional()
  @IsInt()
  validityMonths?: number | null;

  @ApiPropertyOptional({ description: 'Descrição do exame' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Exame ativo?', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateOccExamDto extends PartialType(CreateOccExamDto) {}

// ═══════════════════════════════════════════════════════════════
// EXAM REFERRALS (guias de encaminhamento)
// ═══════════════════════════════════════════════════════════════

export class ExamReferralItemDto {
  @ApiPropertyOptional({ description: 'ID do exame ocupacional (nullable para exame ad-hoc)' })
  @IsOptional()
  @IsUUID()
  examId?: string;

  @ApiProperty({ description: 'Nome do exame (snapshot)' })
  @IsString()
  @IsNotEmpty()
  examName: string;

  @ApiPropertyOptional({ description: 'Grupo do exame (laboratorial, complementar, clinico)', default: 'laboratorial' })
  @IsOptional()
  @IsString()
  examGroup?: string;

  @ApiPropertyOptional({ description: 'É renovação?', default: false })
  @IsOptional()
  @IsBoolean()
  isRenewal?: boolean;

  @ApiPropertyOptional({ description: 'Data do último exame' })
  @IsOptional()
  @Type(() => Date)
  lastExamDate?: Date;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Selecionado para esta guia?', default: true })
  @IsOptional()
  @IsBoolean()
  selected?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateExamReferralDto {
  @ApiProperty({ description: 'ID do funcionário' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiPropertyOptional({ description: 'ID da clínica/fornecedor' })
  @IsOptional()
  @IsUUID()
  clinicSupplierId?: string;

  @ApiProperty({ description: 'Tipo do exame (admissional, periodico, retorno, demissional, mudanca_funcao, consulta)' })
  @IsString()
  @IsNotEmpty()
  examType: string;

  @ApiPropertyOptional({ description: 'Status (draft, sent, budget_received, scheduled, completed, cancelled)', default: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Função do funcionário (snapshot)' })
  @IsOptional()
  @IsString()
  jobFunction?: string;

  @ApiPropertyOptional({ description: 'Riscos do funcionário', type: [Object] })
  @IsOptional()
  @IsArray()
  risks?: { type: string; agent: string; nr?: string }[];

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({ description: 'Valor do orçamento' })
  @IsOptional()
  @IsNumber()
  budgetValue?: number;

  @ApiPropertyOptional({ description: 'Data agendada' })
  @IsOptional()
  @Type(() => Date)
  scheduledDate?: Date;

  @ApiPropertyOptional({ description: 'Itens da guia', type: [ExamReferralItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamReferralItemDto)
  items?: ExamReferralItemDto[];
}

export class UpdateExamReferralDto extends PartialType(CreateExamReferralDto) {}

export class UpdateExamReferralItemsDto {
  @ApiProperty({ description: 'Itens atualizados da guia', type: [ExamReferralItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamReferralItemDto)
  items: ExamReferralItemDto[];
}
