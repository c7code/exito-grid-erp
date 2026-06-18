import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsUUID, IsNotEmpty, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TaskPriority, TaskStatus, TaskType } from './task.entity';

export class CreateTaskDto {
  @ApiProperty({ description: 'Título da tarefa' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descrição da tarefa' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskType, description: 'Tipo da tarefa' })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Prioridade da tarefa' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Status da tarefa' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ description: 'ID da obra' })
  @IsOptional()
  @IsUUID()
  workId?: string;

  @ApiPropertyOptional({ description: 'ID da fase' })
  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @ApiPropertyOptional({ description: 'ID do responsável' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Checklist da tarefa' })
  @IsOptional()
  @IsArray()
  checklist?: any[];

  @ApiPropertyOptional({ description: 'Requer aprovação interna' })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Requer aprovação do cliente' })
  @IsOptional()
  @IsBoolean()
  requiresClientApproval?: boolean;

  @ApiPropertyOptional({ description: 'IDs dos resolvedores', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  resolverIds?: string[];

  @ApiPropertyOptional({ description: 'Horas estimadas' })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Peso percentual' })
  @IsOptional()
  @IsNumber()
  weightPercentage?: number;

  @ApiPropertyOptional({ description: 'Visibilidade da tarefa' })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional({ description: 'ID da tarefa pai' })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class CompleteTaskDto {
  @ApiPropertyOptional({ description: 'Resultado da tarefa' })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({ description: 'Tipo de resolução' })
  @IsOptional()
  @IsString()
  resolutionType?: string;

  @ApiPropertyOptional({ description: 'Notas de resolução' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class RejectTaskDto {
  @ApiProperty({ description: 'Motivo da rejeição' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class UpdateTaskResolversDto {
  @ApiProperty({ description: 'IDs dos resolvedores', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  resolverIds: string[];
}
