import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsUUID, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProcessStatus } from './process.entity';

export class CreateProcessDto {
  @ApiProperty({ description: 'Nome do processo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'ID da obra associada' })
  @IsOptional()
  @IsUUID()
  workId?: string;

  @ApiPropertyOptional({ description: 'Status do processo', enum: ProcessStatus })
  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;

  @ApiPropertyOptional({ description: 'Progresso (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}

export class UpdateProcessDto extends PartialType(CreateProcessDto) {}

export class CreateProcessStageDto {
  @ApiProperty({ description: 'Nome da etapa' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição da etapa' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ordem da etapa' })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateProcessStageDto extends PartialType(CreateProcessStageDto) {}

export class CreateChecklistItemDto {
  @ApiProperty({ description: 'Label do item do checklist' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ description: 'Documento obrigatório (nome)' })
  @IsOptional()
  @IsString()
  documentRequired?: string;
}

export class ToggleChecklistDto {
  @ApiProperty({ description: 'Item completado' })
  @IsBoolean()
  completed: boolean;
}
