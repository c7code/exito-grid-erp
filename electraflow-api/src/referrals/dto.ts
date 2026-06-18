import {
  IsString, IsEmail, IsOptional, IsNumber, IsBoolean, IsUUID, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ─── PARTNER LOGIN ──────────────────────────────────────────────────────────────
export class PartnerLoginDto {
  @ApiProperty({ description: 'Email do parceiro', example: 'parceiro@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do parceiro', minLength: 1 })
  @IsString()
  @MinLength(1)
  password: string;
}

// ─── CONSULTANT ─────────────────────────────────────────────────────────────────
export class CreateConsultantDto {
  @ApiProperty({ description: 'Nome do consultor' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email do consultor' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'WhatsApp' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'CPF ou CNPJ' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ description: 'Percentual de comissão', example: 2.0 })
  @IsOptional()
  @IsNumber()
  commissionPercent?: number;

  @ApiPropertyOptional({ description: 'Tipo de comissão', example: 'percentage' })
  @IsOptional()
  @IsString()
  commissionType?: string;

  @ApiPropertyOptional({ description: 'Valor fixo de comissão' })
  @IsOptional()
  @IsNumber()
  commissionFixedValue?: number;

  @ApiPropertyOptional({ description: 'Canal de acesso', example: 'all' })
  @IsOptional()
  @IsString()
  accessChannel?: string;

  @ApiPropertyOptional({ description: 'Status do consultor', example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Rua' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Região' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'ID do usuário responsável' })
  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @ApiPropertyOptional({ description: 'Meta semanal' })
  @IsOptional()
  @IsNumber()
  weeklyGoal?: number;

  @ApiPropertyOptional({ description: 'Meta mensal' })
  @IsOptional()
  @IsNumber()
  monthlyGoal?: number;

  @ApiPropertyOptional({ description: 'Nome do banco' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Chave Pix' })
  @IsOptional()
  @IsString()
  pixKey?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateConsultantDto extends PartialType(CreateConsultantDto) {}

// ─── REFERRAL LEAD ──────────────────────────────────────────────────────────────
export class CreateReferralLeadDto {
  @ApiProperty({ description: 'Nome do lead' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Telefone do lead' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Email do lead' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Tipo de serviço' })
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiPropertyOptional({ description: 'Descrição / observações' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID do consultor indicador' })
  @IsUUID()
  consultantId: string;

  @ApiPropertyOptional({ description: 'Documento (CPF/CNPJ)' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Status do lead', example: 'new' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Potência estimada (kWp)' })
  @IsOptional()
  @IsNumber()
  potentialKwp?: number;

  @ApiPropertyOptional({ description: 'Valor potencial' })
  @IsOptional()
  @IsNumber()
  potentialValue?: number;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Bairro' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateReferralLeadDto extends PartialType(CreateReferralLeadDto) {}

// ─── PARTNER LEAD (criação pelo parceiro) ───────────────────────────────────────
export class CreatePartnerLeadDto {
  @ApiProperty({ description: 'Nome do lead' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Telefone do lead' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Email do lead' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Tipo de serviço' })
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsOptional()
  @IsString()
  address?: string;
}

// ─── LINK / ADD PROPOSAL ────────────────────────────────────────────────────────
export class LinkLeadProposalDto {
  @ApiProperty({ description: 'ID da proposta a vincular' })
  @IsUUID()
  proposalId: string;

  @ApiPropertyOptional({ description: 'Proposta visível para o parceiro?', default: false })
  @IsOptional()
  @IsBoolean()
  proposalVisible?: boolean;
}

export class AddLeadProposalDto {
  @ApiProperty({ description: 'ID da proposta' })
  @IsUUID()
  proposalId: string;

  @ApiPropertyOptional({ description: 'Visível para o parceiro?', default: false })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiPropertyOptional({ description: 'Permitir download?', default: false })
  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @ApiPropertyOptional({ description: 'Template da proposta', example: 'commercial' })
  @IsOptional()
  @IsString()
  proposalTemplate?: string;
}

export class ToggleProposalVisibilityDto {
  @ApiProperty({ description: 'Nova visibilidade da proposta' })
  @IsBoolean()
  visible: boolean;
}

export class UpdateLeadProposalAccessDto {
  @ApiPropertyOptional({ description: 'Visível para o parceiro?' })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiPropertyOptional({ description: 'Permitir download?' })
  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @ApiPropertyOptional({ description: 'Template da proposta' })
  @IsOptional()
  @IsString()
  proposalTemplate?: string;
}

// ─── PORTAL TOGGLE ──────────────────────────────────────────────────────────────
export class TogglePortalDto {
  @ApiProperty({ description: 'Ativar/desativar portal do parceiro' })
  @IsBoolean()
  isPortalActive: boolean;
}

// ─── COMMITMENT ─────────────────────────────────────────────────────────────────
export class CreateCommitmentDto {
  @ApiPropertyOptional({ description: 'ID do consultor' })
  @IsOptional()
  @IsUUID()
  consultantId?: string;

  @ApiPropertyOptional({ description: 'Tipo de compromisso', example: 'monthly' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Meta de quantidade', example: 0 })
  @IsOptional()
  @IsNumber()
  targetCount?: number;

  @ApiPropertyOptional({ description: 'Início do período' })
  @IsOptional()
  @Type(() => Date)
  periodStart?: Date;

  @ApiPropertyOptional({ description: 'Fim do período' })
  @IsOptional()
  @Type(() => Date)
  periodEnd?: Date;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCommitmentDto extends PartialType(CreateCommitmentDto) {}

// ─── FOLLOWUP ───────────────────────────────────────────────────────────────────
export class CreateFollowupDto {
  @ApiPropertyOptional({ description: 'ID do consultor' })
  @IsOptional()
  @IsUUID()
  consultantId?: string;

  @ApiPropertyOptional({ description: 'ID do lead' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Tipo de acompanhamento', example: 'internal_note' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Descrição do acompanhamento' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Resultado' })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional({ description: 'Data da próxima ação' })
  @IsOptional()
  @Type(() => Date)
  nextActionDate?: Date;

  @ApiPropertyOptional({ description: 'Descrição da próxima ação' })
  @IsOptional()
  @IsString()
  nextActionDescription?: string;

  @ApiPropertyOptional({ description: 'ID de quem criou' })
  @IsOptional()
  @IsString()
  createdById?: string;
}

export class UpdateFollowupDto extends PartialType(CreateFollowupDto) {}

// ─── COMMISSION ─────────────────────────────────────────────────────────────────
export class CreateCommissionDto {
  @ApiPropertyOptional({ description: 'ID do consultor' })
  @IsOptional()
  @IsUUID()
  consultantId?: string;

  @ApiPropertyOptional({ description: 'ID do lead' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ description: 'ID da proposta' })
  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @ApiPropertyOptional({ description: 'Valor da venda' })
  @IsOptional()
  @IsNumber()
  saleValue?: number;

  @ApiPropertyOptional({ description: 'Percentual de comissão' })
  @IsOptional()
  @IsNumber()
  commissionPercent?: number;

  @ApiPropertyOptional({ description: 'Valor da comissão' })
  @IsOptional()
  @IsNumber()
  commissionValue?: number;

  @ApiPropertyOptional({ description: 'Status da comissão', example: 'pending' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Data do pagamento' })
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Pago por' })
  @IsOptional()
  @IsString()
  paidBy?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCommissionDto extends PartialType(CreateCommissionDto) {}

// ─── DOCUMENT VISIBILITY ────────────────────────────────────────────────────────
export class UpdateDocVisibilityDto {
  @ApiProperty({ description: 'Visibilidade do documento', example: 'public' })
  @IsString()
  visibility: string;

  @ApiPropertyOptional({ description: 'ID do consultor alvo (para docs privados)' })
  @IsOptional()
  @IsUUID()
  targetConsultantId?: string;
}

export class UpdateLeadDocDescriptionDto {
  @ApiProperty({ description: 'Nova descrição do documento' })
  @IsString()
  description: string;
}

// ─── BROADCAST DOCUMENT ─────────────────────────────────────────────────────────
export class UpdateBroadcastDocDto {
  @ApiPropertyOptional({ description: 'Descrição do documento' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Canal alvo', example: 'all' })
  @IsOptional()
  @IsString()
  targetChannel?: string;
}

// ─── PARTNER BANK INFO ──────────────────────────────────────────────────────────
export class UpdatePartnerBankInfoDto {
  @ApiPropertyOptional({ description: 'Nome do banco' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Agência' })
  @IsOptional()
  @IsString()
  bankAgency?: string;

  @ApiPropertyOptional({ description: 'Conta' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ description: 'Chave Pix' })
  @IsOptional()
  @IsString()
  pixKey?: string;
}

// ─── WITHDRAWAL ─────────────────────────────────────────────────────────────────
export class RequestWithdrawalDto {
  @ApiProperty({ description: 'Valor solicitado para saque' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessWithdrawalDto {
  @ApiProperty({ description: 'Novo status da solicitação', example: 'approved' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Observações do admin' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
