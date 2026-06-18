import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { WorkStatus, WorkPriority } from './work.entity';

// ═══════ WORK DTOs ═══════

export class CreateWorkDto {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ enum: WorkStatus })
  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedEngineerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedDesignerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  responsibleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional({ enum: WorkPriority })
  @IsOptional()
  @IsEnum(WorkPriority)
  priority?: WorkPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  deadline?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  concessionaria?: string;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  technicalData?: object;
}

export class UpdateWorkDto extends PartialType(CreateWorkDto) {}

// ═══════ WORK TYPE DTOs ═══════

export class CreateWorkTypeDto {
  @ApiProperty()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  key?: string;
}

export class UpdateWorkTypeDto extends PartialType(CreateWorkTypeDto) {}

// ═══════ WORK PROGRESS DTO ═══════

export class UpdateWorkProgressDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;
}

// ═══════ WORK UPDATE DTOs ═══════

export class CreateWorkUpdateDto {
  @ApiProperty()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  progress: number;
}

export class UpdateWorkUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  progress?: number;
}

// ═══════ WORK PHASE DTOs ═══════

export class CreateWorkPhaseDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class UpdateWorkPhaseDto extends PartialType(CreateWorkPhaseDto) {}
