import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateRuleDto {
  @ApiProperty({ description: 'Nome da regra' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição da regra' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Prioridade da regra', default: 1 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ description: 'Condições da regra', type: 'array' })
  @IsArray()
  @IsNotEmpty()
  conditions: any[];

  @ApiProperty({ description: 'Ações da regra', type: 'array' })
  @IsArray()
  @IsNotEmpty()
  actions: any[];

  @ApiPropertyOptional({ description: 'Template de mensagem' })
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @ApiPropertyOptional({ description: 'Regra ativa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRuleDto extends PartialType(CreateRuleDto) {}

export class EvaluateRuleContextDto {
  @ApiProperty({ description: 'Contexto para avaliação de regras', type: 'object' })
  @IsObject()
  @IsNotEmpty()
  context: Record<string, any>;
}
