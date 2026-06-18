import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsNumber, IsBoolean, IsArray,
} from 'class-validator';
import { DocumentType, DocumentPurpose } from './document.entity';

// ═══════════════════════════════════════════════════════════════
// DocumentFolder DTOs
// ═══════════════════════════════════════════════════════════════

export class CreateDocumentFolderDto {
    @ApiProperty({ description: 'Nome da pasta' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'ID da pasta pai (para subpastas)' })
    @IsUUID()
    @IsOptional()
    parentId?: string;

    @ApiPropertyOptional({ description: 'ID da categoria da pasta' })
    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Categoria (nome string)' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional({ description: 'ID da obra associada' })
    @IsUUID()
    @IsOptional()
    workId?: string;

    @ApiPropertyOptional({ description: 'ID do cliente associado' })
    @IsUUID()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

export class UpdateDocumentFolderDto extends PartialType(CreateDocumentFolderDto) {}

// ═══════════════════════════════════════════════════════════════
// FolderCategory DTOs
// ═══════════════════════════════════════════════════════════════

export class CreateFolderCategoryDto {
    @ApiProperty({ description: 'Nome da categoria' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Cor da categoria (hex)' })
    @IsString()
    @IsOptional()
    color?: string;

    @ApiPropertyOptional({ description: 'Ícone da categoria' })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

// ═══════════════════════════════════════════════════════════════
// Upload DTO (campos do body no multipart/form-data)
// ═══════════════════════════════════════════════════════════════

export class UploadDocumentDto {
    @ApiPropertyOptional({ description: 'Nome do documento (padrão: nome do arquivo)' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ enum: DocumentType, description: 'Tipo do documento' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ description: 'ID da obra' })
    @IsUUID()
    @IsOptional()
    workId?: string;

    @ApiPropertyOptional({ description: 'ID da pasta' })
    @IsUUID()
    @IsOptional()
    folderId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Finalidade do documento' })
    @IsString()
    @IsOptional()
    purpose?: string;

    @ApiPropertyOptional({ description: 'Tags JSON string (array de strings)' })
    @IsString()
    @IsOptional()
    tags?: string;

    @ApiPropertyOptional({ description: 'Organização de origem (ABNT, Neoenergia, etc.)' })
    @IsString()
    @IsOptional()
    sourceOrganization?: string;

    @ApiPropertyOptional({ description: 'ID do contrato associado' })
    @IsUUID()
    @IsOptional()
    contractId?: string;

    @ApiPropertyOptional({ description: 'ID da proposta associada' })
    @IsUUID()
    @IsOptional()
    proposalId?: string;

    @ApiPropertyOptional({ description: 'ID do cliente associado' })
    @IsUUID()
    @IsOptional()
    clientId?: string;
}

// ═══════════════════════════════════════════════════════════════
// Document DTOs (criação manual via URL)
// ═══════════════════════════════════════════════════════════════

export class CreateDocumentDto {
    @ApiProperty({ description: 'Nome do documento' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Nome do arquivo' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiProperty({ description: 'URL do documento' })
    @IsString()
    @IsNotEmpty()
    url: string;

    @ApiPropertyOptional({ enum: DocumentType })
    @IsEnum(DocumentType)
    @IsOptional()
    type?: DocumentType;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    workId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    folderId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    proposalId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    contractId?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    size?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    mimeType?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    originalName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    filePath?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    purpose?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsArray()
    @IsOptional()
    tags?: string[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    sourceOrganization?: string;

    @ApiPropertyOptional({ description: 'Nível de acesso: public, view_only, hidden' })
    @IsString()
    @IsOptional()
    accessLevel?: string;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}

// ═══════════════════════════════════════════════════════════════
// Access Level DTO
// ═══════════════════════════════════════════════════════════════

export class ChangeDocumentAccessLevelDto {
    @ApiProperty({ description: 'Nível de acesso: public, view_only, hidden', enum: ['public', 'view_only', 'hidden'] })
    @IsString()
    @IsNotEmpty()
    accessLevel: string;
}
