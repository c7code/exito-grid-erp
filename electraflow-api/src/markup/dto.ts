import { IsString, IsOptional, IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateMarkupConfigDto {
  @ApiProperty({ description: 'Nome da configuração de markup' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Escopo do markup (global, category, activity_type, supplier_type, client_type)' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Valor do escopo (ID ou valor do critério)' })
  @IsOptional()
  @IsString()
  scopeValue?: string;

  @ApiPropertyOptional({ description: 'Multiplicador de markup (ex: 1.35 = 35%)' })
  @IsOptional()
  @IsNumber()
  markupMultiplier?: number;

  @ApiPropertyOptional({ description: 'Percentual de markup' })
  @IsOptional()
  @IsNumber()
  markupPercentage?: number;

  @ApiPropertyOptional({ description: 'Margem mínima em R$' })
  @IsOptional()
  @IsNumber()
  minimumMargin?: number;

  @ApiPropertyOptional({ description: 'Prioridade da regra' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ description: 'Configuração ativa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateMarkupConfigDto extends PartialType(CreateMarkupConfigDto) {}
