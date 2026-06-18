import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateOpportunityDto {
  @ApiProperty({ description: 'Título da oportunidade' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Estágio da oportunidade' })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional({ description: 'ID do lead associado' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID do responsável' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Tipo de serviço' })
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiPropertyOptional({ description: 'Valor estimado' })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiPropertyOptional({ description: 'Probabilidade de fechamento (%)' })
  @IsOptional()
  @IsNumber()
  probability?: number;

  @ApiPropertyOptional({ description: 'Data prevista de fechamento' })
  @IsOptional()
  @Type(() => Date)
  expectedCloseDate?: Date;

  @ApiPropertyOptional({ description: 'Descrição da oportunidade' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Nome do contato' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: 'Telefone do contato' })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiPropertyOptional({ description: 'Email do contato' })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiPropertyOptional({ description: 'Origem da oportunidade' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'É recorrente' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Valor recorrente' })
  @IsOptional()
  @IsNumber()
  recurringValue?: number;
}

export class UpdateOpportunityDto extends PartialType(CreateOpportunityDto) {}

export class MoveOpportunityStageDto {
  @ApiProperty({ description: 'Novo estágio da oportunidade' })
  @IsString()
  @IsNotEmpty()
  stage: string;
}
