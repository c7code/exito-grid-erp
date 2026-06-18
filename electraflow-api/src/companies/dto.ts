import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString, IsNotEmpty, IsOptional, IsBoolean, IsDate, IsNumber, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ═══════════════════════════════════════════════════════════════
// Company DTOs
// ═══════════════════════════════════════════════════════════════

export class CreateCompanyDto {
    @ApiProperty({ description: 'Razão social' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Nome fantasia' })
    @IsString()
    @IsOptional()
    tradeName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    cnpj?: string;

    @ApiPropertyOptional({ description: 'Inscrição estadual' })
    @IsString()
    @IsOptional()
    stateRegistration?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    website?: string;

    // Endereço
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    cep?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    neighborhood?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    city?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    state?: string;

    // Identidade visual
    @ApiPropertyOptional({ description: 'URL ou path do logo' })
    @IsString()
    @IsOptional()
    logoUrl?: string;

    @ApiPropertyOptional({ description: 'Cor principal (hex)' })
    @IsString()
    @IsOptional()
    primaryColor?: string;

    @ApiPropertyOptional({ description: 'Cor secundária (hex)' })
    @IsString()
    @IsOptional()
    secondaryColor?: string;

    @ApiPropertyOptional({ description: 'Cor de destaque (hex)' })
    @IsString()
    @IsOptional()
    accentColor?: string;

    // Assinatura
    @ApiPropertyOptional({ description: 'URL da imagem da assinatura' })
    @IsString()
    @IsOptional()
    signatureImageUrl?: string;

    @ApiPropertyOptional({ description: 'Nome do responsável' })
    @IsString()
    @IsOptional()
    signatureSignerName?: string;

    @ApiPropertyOptional({ description: 'Cargo do responsável' })
    @IsString()
    @IsOptional()
    signatureSignerRole?: string;

    @ApiPropertyOptional({ description: 'Empresa matriz' })
    @IsBoolean()
    @IsOptional()
    isPrimary?: boolean;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

// ═══════════════════════════════════════════════════════════════
// CompanyDocument DTOs
// ═══════════════════════════════════════════════════════════════

export class CreateCompanyDocumentDto {
    @ApiProperty({ description: 'Nome do documento (ex: Alvará de Funcionamento)' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Grupo: identity, legal, safety_program, licensing, fiscal, certification' })
    @IsString()
    @IsOptional()
    documentGroup?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    fileUrl?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    fileName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    mimeType?: string;

    @ApiPropertyOptional({ description: 'Data de emissão' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    issueDate?: Date;

    @ApiPropertyOptional({ description: 'Data de vencimento' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    expiryDate?: Date;

    @ApiPropertyOptional({ description: 'Status: valid, expiring, expired, pending' })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiPropertyOptional({ description: 'Responsável técnico' })
    @IsString()
    @IsOptional()
    responsibleName?: string;

    @ApiPropertyOptional({ description: 'Nº registro (CREA, CRM, etc.)' })
    @IsString()
    @IsOptional()
    registrationNumber?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    observations?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

export class UpdateCompanyDocumentDto extends PartialType(CreateCompanyDocumentDto) {}
