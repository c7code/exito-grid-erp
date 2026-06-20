import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, IsBoolean, IsNotEmpty, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ClientSegment, ClientType, ClientClassification } from './client.entity';
import { RequestType, RequestStatus } from './client-request.entity';
import { ClientDocumentType } from './client-document.entity';

export class CreateClientDto {
  @ApiProperty({ description: 'Nome do cliente' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o) => o.email !== '' && o.email != null)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({ enum: ClientSegment })
  @IsOptional()
  @IsEnum(ClientSegment)
  segment?: ClientSegment;

  @ApiPropertyOptional({ enum: ClientType })
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @ApiPropertyOptional({ enum: ClientClassification })
  @IsOptional()
  @IsEnum(ClientClassification)
  classification?: ClientClassification;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o) => o.contactEmail !== '' && o.contactEmail != null)
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  concessionaria?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  consumptionKwh?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  installedPower?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  voltage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Inscrição Estadual' })
  @IsOptional()
  @IsString()
  stateRegistration?: string;

  @ApiPropertyOptional({ description: 'Nome da Obra / Identificação do Projeto' })
  @IsOptional()
  @IsString()
  obraName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasPortalAccess?: boolean;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}

export class RespondToRequestDto {
  @ApiProperty({ description: 'Resposta do administrador' })
  @IsString()
  @IsNotEmpty()
  adminResponse: string;

  @ApiProperty({ enum: RequestStatus, description: 'Status da solicitação' })
  @IsEnum(RequestStatus)
  status: RequestStatus;
}

export class CreateClientDocumentDto {
  @ApiPropertyOptional({ enum: ClientDocumentType })
  @IsOptional()
  @IsEnum(ClientDocumentType)
  type?: ClientDocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  issueDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;
}

export class CreateClientRequestDto {
  @ApiProperty({ enum: RequestType, description: 'Tipo da solicitação' })
  @IsEnum(RequestType)
  @IsNotEmpty()
  type: RequestType;

  @ApiProperty({ description: 'Assunto da solicitação' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
