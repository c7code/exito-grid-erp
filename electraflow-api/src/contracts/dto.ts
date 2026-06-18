import { IsString, IsOptional, IsNumber, IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ContractType } from './contract.entity';

// ════════════════════════════════════════════════════════════════
// CONTRACT DTOs
// ════════════════════════════════════════════════════════════════

export class CreateContractDto {
    @ApiProperty({ description: 'Número do contrato (único)', example: 'CTR-2026-001' })
    @IsString()
    @IsNotEmpty()
    contractNumber: string;

    @ApiProperty({ description: 'Título do contrato', example: 'Contrato de Instalação Elétrica' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Descrição do contrato' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Tipo do contrato', enum: ContractType, example: ContractType.SERVICE })
    @IsOptional()
    @IsEnum(ContractType)
    type?: ContractType;

    @ApiPropertyOptional({ description: 'ID da obra vinculada' })
    @IsOptional()
    @IsUUID()
    workId?: string;

    @ApiPropertyOptional({ description: 'ID do cliente vinculado' })
    @IsOptional()
    @IsUUID()
    clientId?: string;

    @ApiPropertyOptional({ description: 'ID da proposta vinculada' })
    @IsOptional()
    @IsUUID()
    proposalId?: string;

    @ApiPropertyOptional({ description: 'Valor original do contrato (R$)', example: 150000.00 })
    @IsOptional()
    @IsNumber()
    originalValue?: number;

    @ApiPropertyOptional({ description: 'Data de início', example: '2026-07-01' })
    @IsOptional()
    @Type(() => Date)
    startDate?: Date;

    @ApiPropertyOptional({ description: 'Data de término', example: '2026-12-31' })
    @IsOptional()
    @Type(() => Date)
    endDate?: Date;

    @ApiPropertyOptional({ description: 'Escopo do contrato' })
    @IsOptional()
    @IsString()
    scope?: string;

    @ApiPropertyOptional({ description: 'Condições de pagamento' })
    @IsOptional()
    @IsString()
    paymentTerms?: string;

    @ApiPropertyOptional({ description: 'Dados bancários para pagamento' })
    @IsOptional()
    @IsString()
    paymentBank?: string;

    @ApiPropertyOptional({ description: 'Penalidades contratuais' })
    @IsOptional()
    @IsString()
    penalties?: string;

    @ApiPropertyOptional({ description: 'Garantias' })
    @IsOptional()
    @IsString()
    warranty?: string;

    @ApiPropertyOptional({ description: 'Cláusula de confidencialidade' })
    @IsOptional()
    @IsString()
    confidentiality?: string;

    @ApiPropertyOptional({ description: 'Cláusula de rescisão' })
    @IsOptional()
    @IsString()
    termination?: string;

    @ApiPropertyOptional({ description: 'Cláusula de força maior' })
    @IsOptional()
    @IsString()
    forceMajeure?: string;

    @ApiPropertyOptional({ description: 'Foro / jurisdição' })
    @IsOptional()
    @IsString()
    jurisdiction?: string;

    @ApiPropertyOptional({ description: 'Obrigações do contratado' })
    @IsOptional()
    @IsString()
    contractorObligations?: string;

    @ApiPropertyOptional({ description: 'Obrigações do cliente' })
    @IsOptional()
    @IsString()
    clientObligations?: string;

    @ApiPropertyOptional({ description: 'Disposições gerais' })
    @IsOptional()
    @IsString()
    generalProvisions?: string;

    @ApiPropertyOptional({ description: 'Observações internas' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Nome da testemunha 1' })
    @IsOptional()
    @IsString()
    witness1Name?: string;

    @ApiPropertyOptional({ description: 'Documento da testemunha 1' })
    @IsOptional()
    @IsString()
    witness1Document?: string;

    @ApiPropertyOptional({ description: 'Nome da testemunha 2' })
    @IsOptional()
    @IsString()
    witness2Name?: string;

    @ApiPropertyOptional({ description: 'Documento da testemunha 2' })
    @IsOptional()
    @IsString()
    witness2Document?: string;

    @ApiPropertyOptional({ description: 'URL do arquivo anexado' })
    @IsOptional()
    @IsString()
    fileUrl?: string;
}

export class UpdateContractDto extends PartialType(CreateContractDto) {}

// ════════════════════════════════════════════════════════════════
// CONTRACT TEMPLATE DTOs
// ════════════════════════════════════════════════════════════════

export class CreateContractTemplateDto {
    @ApiProperty({ description: 'Nome do template', example: 'Modelo de Contrato de Serviço' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Tipo do template', enum: ContractType, example: ContractType.SERVICE })
    @IsOptional()
    @IsEnum(ContractType)
    type?: ContractType;

    @ApiPropertyOptional({ description: 'Escopo padrão do template' })
    @IsOptional()
    @IsString()
    scope?: string;

    @ApiPropertyOptional({ description: 'Condições de pagamento padrão' })
    @IsOptional()
    @IsString()
    paymentTerms?: string;

    @ApiPropertyOptional({ description: 'Penalidades padrão' })
    @IsOptional()
    @IsString()
    penalties?: string;

    @ApiPropertyOptional({ description: 'Garantias padrão' })
    @IsOptional()
    @IsString()
    warranty?: string;

    @ApiPropertyOptional({ description: 'Cláusula de rescisão padrão' })
    @IsOptional()
    @IsString()
    termination?: string;

    @ApiPropertyOptional({ description: 'Cláusula de confidencialidade padrão' })
    @IsOptional()
    @IsString()
    confidentiality?: string;

    @ApiPropertyOptional({ description: 'Cláusula de força maior padrão' })
    @IsOptional()
    @IsString()
    forceMajeure?: string;

    @ApiPropertyOptional({ description: 'Foro / jurisdição padrão' })
    @IsOptional()
    @IsString()
    jurisdiction?: string;

    @ApiPropertyOptional({ description: 'Obrigações do contratado padrão' })
    @IsOptional()
    @IsString()
    contractorObligations?: string;

    @ApiPropertyOptional({ description: 'Obrigações do cliente padrão' })
    @IsOptional()
    @IsString()
    clientObligations?: string;

    @ApiPropertyOptional({ description: 'Disposições gerais padrão' })
    @IsOptional()
    @IsString()
    generalProvisions?: string;
}

export class UpdateContractTemplateDto extends PartialType(CreateContractTemplateDto) {}

// ════════════════════════════════════════════════════════════════
// CONTRACT ADDENDUM DTOs
// ════════════════════════════════════════════════════════════════

export class CreateContractAddendumDto {
    @ApiProperty({ description: 'Título do aditivo', example: 'Aditivo de Prazo' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Descrição do aditivo' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Variação de valor (R$)', example: 25000.00 })
    @IsOptional()
    @IsNumber()
    valueChange?: number;

    @ApiPropertyOptional({ description: 'Nova data de término', example: '2027-06-30' })
    @IsOptional()
    @Type(() => Date)
    newEndDate?: Date;

    @ApiPropertyOptional({ description: 'Justificativa do aditivo' })
    @IsOptional()
    @IsString()
    justification?: string;

    @ApiPropertyOptional({ description: 'URL do arquivo anexado' })
    @IsOptional()
    @IsString()
    fileUrl?: string;
}

// ════════════════════════════════════════════════════════════════
// DIGITAL SIGNATURE DTOs
// ════════════════════════════════════════════════════════════════

export class ConfirmContractSignatureDto {
    @ApiProperty({ description: 'Nome do signatário', example: 'João da Silva' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Documento do signatário (CPF/CNPJ)', example: '123.456.789-00' })
    @IsString()
    @IsNotEmpty()
    document: string;

    @ApiPropertyOptional({ description: 'Imagem da assinatura (base64)' })
    @IsOptional()
    @IsString()
    signatureImage?: string;
}
