import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Grupo da categoria' })
  @IsString()
  @IsNotEmpty()
  group: string;

  @ApiPropertyOptional({ description: 'Valor da categoria' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({ description: 'Label da categoria' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ description: 'Configuração JSON da categoria' })
  @IsOptional()
  @IsString()
  config?: string;

  @ApiPropertyOptional({ description: 'Ordem de exibição' })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Label da categoria' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Configuração JSON da categoria' })
  @IsOptional()
  @IsString()
  config?: string;

  @ApiPropertyOptional({ description: 'Ordem de exibição' })
  @IsOptional()
  @IsNumber()
  order?: number;
}
