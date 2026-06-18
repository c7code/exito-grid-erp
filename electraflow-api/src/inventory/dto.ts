import { IsString, IsOptional, IsNumber, IsUUID, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MovementType } from './inventory.entity';

// ════════════════════════════════════════════════════════════════
// INVENTORY ITEM DTOs
// ════════════════════════════════════════════════════════════════

export class CreateInventoryItemDto {
    @ApiProperty({ description: 'Nome do item', example: 'Disjuntor 32A' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Código interno', example: 'DIS-032A' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ description: 'Categoria', example: 'Proteção' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'Unidade de medida', example: 'un' })
    @IsOptional()
    @IsString()
    unit?: string;

    @ApiPropertyOptional({ description: 'Estoque atual', example: 50 })
    @IsOptional()
    @IsNumber()
    currentStock?: number;

    @ApiPropertyOptional({ description: 'Estoque mínimo', example: 10 })
    @IsOptional()
    @IsNumber()
    minimumStock?: number;

    @ApiPropertyOptional({ description: 'Custo unitário (R$)', example: 35.90 })
    @IsOptional()
    @IsNumber()
    unitCost?: number;

    @ApiPropertyOptional({ description: 'Localização no estoque', example: 'Almoxarifado Central' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'Fornecedor', example: 'Eletro Distribuidora' })
    @IsOptional()
    @IsString()
    supplier?: string;

    @ApiPropertyOptional({ description: 'Descrição detalhada' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateInventoryItemDto extends PartialType(CreateInventoryItemDto) {}

// ════════════════════════════════════════════════════════════════
// STOCK MOVEMENT DTOs
// ════════════════════════════════════════════════════════════════

export class CreateStockMovementDto {
    @ApiProperty({ description: 'ID do item de estoque' })
    @IsUUID()
    @IsNotEmpty()
    itemId: string;

    @ApiProperty({ description: 'Tipo de movimentação', enum: MovementType, example: MovementType.ENTRY })
    @IsEnum(MovementType)
    @IsNotEmpty()
    type: MovementType;

    @ApiProperty({ description: 'Quantidade', example: 20 })
    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @ApiPropertyOptional({ description: 'Custo unitário (R$)', example: 35.90 })
    @IsOptional()
    @IsNumber()
    unitCost?: number;

    @ApiPropertyOptional({ description: 'ID da obra vinculada' })
    @IsOptional()
    @IsUUID()
    workId?: string;

    @ApiPropertyOptional({ description: 'Local de origem', example: 'Almoxarifado Central' })
    @IsOptional()
    @IsString()
    origin?: string;

    @ApiPropertyOptional({ description: 'Local de destino', example: 'Obra Recife' })
    @IsOptional()
    @IsString()
    destination?: string;

    @ApiPropertyOptional({ description: 'Motivo da movimentação' })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({ description: 'Número da nota fiscal', example: 'NF-001234' })
    @IsOptional()
    @IsString()
    invoiceNumber?: string;
}
