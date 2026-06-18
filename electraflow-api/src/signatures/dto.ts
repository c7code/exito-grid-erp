import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ═══ SIGNATURE SLOTS ═════════════════════════════════════════════════════════

export class CreateSignatureSlotDto {
  @ApiProperty({ description: 'Rótulo da assinatura' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ description: 'Nome do signatário' })
  @IsOptional()
  @IsString()
  signerName?: string;

  @ApiPropertyOptional({ description: 'Cargo/função do signatário' })
  @IsOptional()
  @IsString()
  signerRole?: string;

  @ApiPropertyOptional({ description: 'Documento do signatário (CPF/CNPJ)' })
  @IsOptional()
  @IsString()
  signerDocument?: string;

  @ApiPropertyOptional({ description: 'URL da imagem da assinatura' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Escopo da assinatura (ex: contratada, contratante)' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'ID de referência (ex: empresa, pessoa)' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Se é a assinatura padrão do escopo' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateSignatureSlotDto extends PartialType(CreateSignatureSlotDto) {}

// ═══ DOCUMENT SIGNATURE BINDING ══════════════════════════════════════════════

export class BindDocumentSignatureDto {
  @ApiProperty({ description: 'Tipo do documento (ex: proposal, contract)' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ description: 'ID do documento' })
  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({ description: 'Posição do slot (ex: contratada, contratante)' })
  @IsString()
  @IsNotEmpty()
  slotPosition: string;

  @ApiProperty({ description: 'ID do slot de assinatura' })
  @IsUUID()
  @IsNotEmpty()
  signatureSlotId: string;

  @ApiPropertyOptional({ description: 'Sobrescrever nome do signatário' })
  @IsOptional()
  @IsString()
  overrideSignerName?: string;

  @ApiPropertyOptional({ description: 'Sobrescrever cargo do signatário' })
  @IsOptional()
  @IsString()
  overrideSignerRole?: string;
}
