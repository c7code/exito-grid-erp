import {
    IsString,
    IsOptional,
    IsBoolean,
    IsUUID,
    IsNumber,
    IsArray,
    IsEnum,
    ValidateNested,
    ArrayMinSize,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { SupplierSegment, SupplierStatus, PriceSource } from './supply.entity';

// ============================================================
// SUPPLIER DTOs
// ============================================================

export class CreateSupplierDto {
    @ApiProperty({ description: 'Nome do fornecedor' })
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tradeName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cnpj?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    whatsapp?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    zipCode?: string;

    @ApiPropertyOptional({ enum: SupplierSegment })
    @IsOptional()
    @IsEnum(SupplierSegment)
    segment?: SupplierSegment;

    @ApiPropertyOptional({ enum: SupplierStatus })
    @IsOptional()
    @IsEnum(SupplierStatus)
    status?: SupplierStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    supplierType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    modality?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    paymentTerms?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) { }

// ============================================================
// SUPPLIER CONTACT DTOs
// ============================================================

export class CreateSupplierContactDto {
    @ApiProperty({ description: 'Nome do contato' })
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    role?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;
}

export class UpdateSupplierContactDto extends PartialType(CreateSupplierContactDto) { }

// ============================================================
// QUOTATION DTOs
// ============================================================

export class CreateQuotationItemDto {
    @ApiPropertyOptional({ description: 'ID do item do catálogo' })
    @IsOptional()
    @IsUUID()
    catalogItemId?: string;

    @ApiProperty({ description: 'Descrição do item' })
    @IsString()
    description: string;

    @ApiProperty({ description: 'Quantidade' })
    @IsNumber()
    @Min(0)
    quantity: number;

    @ApiPropertyOptional({ default: 'un' })
    @IsOptional()
    @IsString()
    unit?: string;

    @ApiPropertyOptional({ description: 'Preço unitário estimado' })
    @IsOptional()
    @IsNumber()
    estimatedUnitPrice?: number;

    @ApiPropertyOptional({ description: 'IDs dos fornecedores alvo', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    targetSupplierIds?: string[];
}

export class CreateQuotationDto {
    @ApiProperty({ description: 'Título da cotação' })
    @IsString()
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Itens da cotação', type: [CreateQuotationItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateQuotationItemDto)
    items: CreateQuotationItemDto[];

    @ApiPropertyOptional({ description: 'Data limite para respostas' })
    @IsOptional()
    @Type(() => Date)
    deadline?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'ID da obra vinculada' })
    @IsOptional()
    @IsUUID()
    workId?: string;
}

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) { }

// ============================================================
// QUOTATION RESPONSE DTOs
// ============================================================

export class CreateQuotationResponseItemDto {
    @ApiProperty({ description: 'ID do item da cotação' })
    @IsUUID()
    quotationItemId: string;

    @ApiProperty({ description: 'Preço unitário' })
    @IsNumber()
    @Min(0)
    unitPrice: number;

    @ApiProperty({ description: 'Preço total' })
    @IsNumber()
    @Min(0)
    totalPrice: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateQuotationResponseDto {
    @ApiProperty({ description: 'ID do fornecedor' })
    @IsUUID()
    supplierId: string;

    @ApiProperty({ description: 'Itens da resposta', type: [CreateQuotationResponseItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateQuotationResponseItemDto)
    items: CreateQuotationResponseItemDto[];

    @ApiPropertyOptional({ description: 'Data de validade da proposta' })
    @IsOptional()
    @Type(() => Date)
    validUntil?: Date;

    @ApiPropertyOptional({ description: 'Prazo de entrega (dias)' })
    @IsOptional()
    @IsNumber()
    deliveryDays?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    paymentTerms?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

// ============================================================
// PRICE HISTORY DTOs
// ============================================================

export class CreatePriceHistoryDto {
    @ApiProperty({ description: 'ID do item do catálogo' })
    @IsUUID()
    catalogItemId: string;

    @ApiProperty({ description: 'ID do fornecedor' })
    @IsUUID()
    supplierId: string;

    @ApiProperty({ description: 'Preço unitário' })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ enum: PriceSource })
    @IsOptional()
    @IsEnum(PriceSource)
    source?: PriceSource;

    @ApiPropertyOptional({ description: 'Data do preço' })
    @IsOptional()
    @Type(() => Date)
    date?: Date;
}

// ============================================================
// MARKUP & COMPARISON DTOs
// ============================================================

export class CalculateMarkupDto {
    @ApiProperty({ description: 'ID do item do catálogo' })
    @IsUUID()
    catalogItemId: string;

    @ApiProperty({ description: 'Percentual de markup' })
    @IsNumber()
    @Min(0)
    markupPercent: number;

    @ApiPropertyOptional({ description: 'ID do fornecedor (para usar preço específico)' })
    @IsOptional()
    @IsUUID()
    supplierId?: string;
}

export class PriceComparisonDto {
    @ApiProperty({ description: 'IDs dos itens do catálogo para comparação', type: [String] })
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    catalogItemIds: string[];
}
