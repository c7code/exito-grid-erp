import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreatePackageDto {
  @ApiProperty({ description: 'Código do pacote' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Nome do pacote' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do pacote' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Preço base', type: Number })
  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Serviços incluídos', type: [String] })
  @IsOptional()
  @IsArray()
  includedServices?: string[];

  @ApiPropertyOptional({ description: 'Regras do pacote', type: 'object' })
  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Pacote ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Dias estimados para execução' })
  @IsOptional()
  @IsNumber()
  estimatedDays?: number;
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {}
