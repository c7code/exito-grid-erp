import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProtocolStatus } from './protocol.entity';
import { ProtocolEventType } from './protocol-event.entity';

export class CreateProtocolDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concessionaria: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utilityCompany?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  submissionDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  expirationDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ enum: ProtocolStatus })
  @IsOptional()
  @IsEnum(ProtocolStatus)
  status?: ProtocolStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  slaDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;
}

export class UpdateProtocolDto extends PartialType(CreateProtocolDto) {}

export class CreateProtocolEventDto {
  @ApiPropertyOptional({ enum: ProtocolEventType })
  @IsOptional()
  @IsEnum(ProtocolEventType)
  type?: ProtocolEventType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  progress?: number;
}

export class UpdateProtocolEventDto extends PartialType(CreateProtocolEventDto) {}
