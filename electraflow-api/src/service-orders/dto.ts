import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsNotEmpty, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ServiceOrderStatus, ServiceOrderPriority } from './service-order.entity';

export class CreateServiceOrderDto {
    @ApiProperty({ description: 'Título da ordem de serviço' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Descrição da ordem de serviço' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Status da ordem de serviço', enum: ServiceOrderStatus })
    @IsOptional()
    @IsEnum(ServiceOrderStatus)
    status?: ServiceOrderStatus;

    @ApiPropertyOptional({ description: 'Prioridade da ordem de serviço', enum: ServiceOrderPriority })
    @IsOptional()
    @IsEnum(ServiceOrderPriority)
    priority?: ServiceOrderPriority;

    @ApiPropertyOptional({ description: 'Categoria da ordem de serviço' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'ID da obra associada' })
    @IsOptional()
    @IsUUID()
    workId?: string;

    @ApiPropertyOptional({ description: 'ID do cliente' })
    @IsOptional()
    @IsUUID()
    clientId?: string;

    @ApiPropertyOptional({ description: 'ID do responsável atribuído' })
    @IsOptional()
    @IsUUID()
    assignedToId?: string;

    @ApiPropertyOptional({ description: 'Endereço' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Cidade' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'Estado' })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional({ description: 'Data agendada' })
    @IsOptional()
    @Type(() => Date)
    scheduledDate?: Date;

    @ApiPropertyOptional({ description: 'Hora de início' })
    @IsOptional()
    @IsString()
    startTime?: string;

    @ApiPropertyOptional({ description: 'Hora de término' })
    @IsOptional()
    @IsString()
    endTime?: string;

    @ApiPropertyOptional({ description: 'Checklist de itens', type: [Object] })
    @IsOptional()
    @IsArray()
    checklist?: any[];

    @ApiPropertyOptional({ description: 'Materiais utilizados', type: [Object] })
    @IsOptional()
    @IsArray()
    materialsUsed?: any[];

    @ApiPropertyOptional({ description: 'Fotos da ordem de serviço', type: [Object] })
    @IsOptional()
    @IsArray()
    photos?: { url: string; type: string; description?: string }[];

    @ApiPropertyOptional({ description: 'Observações do técnico' })
    @IsOptional()
    @IsString()
    technicianNotes?: string;

    @ApiPropertyOptional({ description: 'Custo de mão de obra' })
    @IsOptional()
    @IsNumber()
    laborCost?: number;

    @ApiPropertyOptional({ description: 'Custo de material' })
    @IsOptional()
    @IsNumber()
    materialCost?: number;
}

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) { }

export class ClientSignServiceOrderDto {
    @ApiProperty({ description: 'Assinatura do cliente (base64 ou URL)' })
    @IsString()
    @IsNotEmpty()
    signature: string;

    @ApiProperty({ description: 'Nome do cliente que assinou' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
