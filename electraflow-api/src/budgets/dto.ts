import { IsString, IsOptional, IsNumber, IsUUID, IsBoolean, IsArray, IsInt, ValidateNested, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ════════════════════════════════════════════════════════════════
// BUDGET DTOs
// ════════════════════════════════════════════════════════════════

export class CreateBudgetDto {
    @ApiProperty({ description: 'Nome do orçamento', example: 'Instalação Elétrica - Casa Recife' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Observações gerais' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'UF base de preços SINAPI', example: 'PE', default: 'PE' })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional({ description: 'Tipo da obra', example: 'residencial', default: 'geral' })
    @IsOptional()
    @IsString()
    workType?: string;

    @ApiPropertyOptional({ description: 'BDI (Benefícios e Despesas Indiretas) %', example: 25.0 })
    @IsOptional()
    @IsNumber()
    bdiPercent?: number;

    @ApiPropertyOptional({ description: 'ID do usuário criador' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({ description: 'ID da empresa' })
    @IsOptional()
    @IsUUID()
    companyId?: string;
}

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {}

// ════════════════════════════════════════════════════════════════
// BUDGET ITEM DTOs
// ════════════════════════════════════════════════════════════════

export class AddBudgetItemDto {
    @ApiProperty({ description: 'Descrição do item' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ description: 'Unidade: UN, M, M2, H', example: 'UN', default: 'UN' })
    @IsOptional()
    @IsString()
    unit?: string;

    @ApiPropertyOptional({ description: 'Quantidade', example: 1 })
    @IsOptional()
    @IsNumber()
    quantity?: number;

    @ApiPropertyOptional({ description: 'Custo unitário (R$/unidade)', example: 0 })
    @IsOptional()
    @IsNumber()
    unitPrice?: number;

    @ApiPropertyOptional({ description: 'Categoria de custo: material | mao_de_obra | equipamento', example: 'material' })
    @IsOptional()
    @IsString()
    category?: string;
}

export class UpdateBudgetItemDto extends PartialType(AddBudgetItemDto) {}

// ════════════════════════════════════════════════════════════════
// SERVICE RULE DTOs
// ════════════════════════════════════════════════════════════════

export class ServiceBandDto {
    @ApiProperty({ description: 'Rótulo da faixa', example: 'Simples' })
    @IsString()
    label: string;

    @ApiProperty({ description: 'Valor mínimo da faixa', example: 1 })
    @IsNumber()
    minValue: number;

    @ApiProperty({ description: 'Valor máximo da faixa', example: 3 })
    @IsNumber()
    maxValue: number;

    @ApiProperty({ description: 'Horas de mão de obra profissional', example: 0.3 })
    @IsNumber()
    laborHours: number;

    @ApiProperty({ description: 'Horas de ajudante', example: 0.15 })
    @IsNumber()
    helperHours: number;

    @ApiPropertyOptional({ description: 'Notas / descrição para o orçamentista' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateServiceRuleDto {
    @ApiProperty({ description: 'Nome da regra de serviço', example: 'Tomada de Embutir' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Categoria: eletrica | hidraulica | civil | equipamento', example: 'eletrica', default: 'eletrica' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'Palavras-chave para detecção (TODAS devem existir)', example: ['TOMADA', 'EMBUTIR'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];

    @ApiPropertyOptional({ description: 'Palavras-chave de exclusão (falsos positivos)', example: ['COLAR', 'PISO'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    excludeKeywords?: string[];

    @ApiPropertyOptional({ description: 'Nome do parâmetro extraído', example: 'módulos' })
    @IsOptional()
    @IsString()
    parameterName?: string;

    @ApiPropertyOptional({ description: 'Regex para extração do parâmetro' })
    @IsOptional()
    @IsString()
    parameterRegex?: string;

    @ApiPropertyOptional({ description: 'Código SINAPI do profissional', example: '2436' })
    @IsOptional()
    @IsString()
    professionalCode?: string;

    @ApiPropertyOptional({ description: 'Rótulo do profissional', example: 'Eletricista' })
    @IsOptional()
    @IsString()
    professionalLabel?: string;

    @ApiPropertyOptional({ description: 'Código SINAPI do ajudante', example: '247' })
    @IsOptional()
    @IsString()
    helperCode?: string;

    @ApiPropertyOptional({ description: 'Rótulo do ajudante', example: 'Ajudante de Eletricista' })
    @IsOptional()
    @IsString()
    helperLabel?: string;

    @ApiPropertyOptional({ description: 'Faixas de complexidade', type: [ServiceBandDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ServiceBandDto)
    bands?: ServiceBandDto[];

    @ApiPropertyOptional({ description: 'Margem de lucro customizada (override)', example: 50.0 })
    @IsOptional()
    @IsNumber()
    customProfitPercent?: number;

    @ApiPropertyOptional({ description: 'Regra ativa?', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Ordem de exibição', example: 0 })
    @IsOptional()
    @IsInt()
    sortOrder?: number;

    @ApiPropertyOptional({ description: 'ID da empresa' })
    @IsOptional()
    @IsUUID()
    companyId?: string;
}

export class UpdateServiceRuleDto extends PartialType(CreateServiceRuleDto) {}

export class TestServiceRuleDto {
    @ApiProperty({ description: 'Descrição do serviço para testar regras', example: 'TOMADA DE EMBUTIR (2 MÓDULOS)' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ description: 'UF para busca de preços SINAPI', example: 'PE', default: 'PE' })
    @IsOptional()
    @IsString()
    state?: string;
}

// ════════════════════════════════════════════════════════════════
// COMPANY FINANCIALS DTO
// ════════════════════════════════════════════════════════════════

export class CategoryMarginsDto {
    @ApiPropertyOptional({ description: 'Margem para elétrica (%)', example: 40 })
    @IsOptional()
    @IsNumber()
    eletrica?: number;

    @ApiPropertyOptional({ description: 'Margem para hidráulica (%)', example: 35 })
    @IsOptional()
    @IsNumber()
    hidraulica?: number;

    @ApiPropertyOptional({ description: 'Margem para civil (%)', example: 30 })
    @IsOptional()
    @IsNumber()
    civil?: number;

    @ApiPropertyOptional({ description: 'Margem para equipamento (%)', example: 20 })
    @IsOptional()
    @IsNumber()
    equipamento?: number;

    @ApiPropertyOptional({ description: 'Margem geral (%)', example: 30 })
    @IsOptional()
    @IsNumber()
    geral?: number;
}

export class UpdateCompanyFinancialsDto {
    @ApiPropertyOptional({ description: 'Nome do perfil financeiro', example: 'Padrão' })
    @IsOptional()
    @IsString()
    profileName?: string;

    @ApiPropertyOptional({ description: 'Encargos sociais (%)', example: 68.47 })
    @IsOptional()
    @IsNumber()
    encargosPercent?: number;

    @ApiPropertyOptional({ description: 'Administração central (%)', example: 4.0 })
    @IsOptional()
    @IsNumber()
    adminCentralPercent?: number;

    @ApiPropertyOptional({ description: 'Seguros e garantias (%)', example: 0.8 })
    @IsOptional()
    @IsNumber()
    seguroPercent?: number;

    @ApiPropertyOptional({ description: 'Riscos / imprevistos (%)', example: 1.2 })
    @IsOptional()
    @IsNumber()
    riscoPercent?: number;

    @ApiPropertyOptional({ description: 'Despesas financeiras (%)', example: 1.4 })
    @IsOptional()
    @IsNumber()
    despesasFinanceirasPercent?: number;

    @ApiPropertyOptional({ description: 'Lucro bruto (%)', example: 8.0 })
    @IsOptional()
    @IsNumber()
    lucroPercent?: number;

    @ApiPropertyOptional({ description: 'PIS/COFINS (%)', example: 3.65 })
    @IsOptional()
    @IsNumber()
    pisCofinPercent?: number;

    @ApiPropertyOptional({ description: 'ISS (%)', example: 5.0 })
    @IsOptional()
    @IsNumber()
    issPercent?: number;

    @ApiPropertyOptional({ description: 'ICMS (%)', example: 0.0 })
    @IsOptional()
    @IsNumber()
    icmsPercent?: number;

    @ApiPropertyOptional({ description: 'Margens por categoria', type: CategoryMarginsDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => CategoryMarginsDto)
    categoryMargins?: CategoryMarginsDto;

    @ApiPropertyOptional({ description: 'Perfil ativo?' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'ID da empresa' })
    @IsOptional()
    @IsUUID()
    companyId?: string;
}
