// ============================================================
// SINAPI Response DTOs — Contratos de response para a API
// ============================================================

// ── References ──
export interface SinapiReferenceDto {
    id: string;
    year: number;
    month: number;
    state: string;
    label: string;
    publishedAt: string | null;
    source: string;
    status: string;
    createdAt: string;
}

// ── Inputs ──
export interface SinapiInputDto {
    id: string;
    code: string;
    description: string;
    unit: string;
    type: string;            // 'material' | 'mao_de_obra' | 'equipamento'
    groupClass: string | null;
    origin: string;
    catalogItemId: string | null;
    isActive: boolean;
}

export interface SinapiInputWithPriceDto extends SinapiInputDto {
    price: {
        priceNotTaxed: number | null;
        priceTaxed: number | null;
        reference: SinapiReferenceDto;
    } | null;
}

export interface SinapiInputSearchResponse {
    items: SinapiInputDto[];
    total: number;
    page: number;
    limit: number;
}

// ── Compositions ──
export interface SinapiCompositionDto {
    id: string;
    code: string;
    description: string;
    unit: string;
    classCode: string | null;
    className: string | null;
    type: string;
    isActive: boolean;
}

export interface SinapiCompositionSearchResponse {
    items: SinapiCompositionDto[];
    total: number;
    page: number;
    limit: number;
}

// ── Composition Tree Node ──
export interface CompositionTreeNode {
    code: string;
    description: string;
    unit: string;
    type: string;            // 'insumo' | 'composicao_auxiliar'
    coefficient: number;
    // Preenchido se for insumo
    inputId?: string;
    inputType?: string;
    price?: {
        priceNotTaxed: number | null;
        priceTaxed: number | null;
    };
    subtotal?: {
        notTaxed: number | null;
        taxed: number | null;
    };
    // Preenchido se for composição auxiliar (recursivo)
    compositionId?: string;
    children?: CompositionTreeNode[];
    compositionCost?: {
        totalNotTaxed: number | null;
        totalTaxed: number | null;
    };
}

export interface CompositionTreeResponse {
    composition: SinapiCompositionDto;
    reference: SinapiReferenceDto | null;
    tree: CompositionTreeNode[];
    consolidatedCost: {
        totalNotTaxed: number;
        totalTaxed: number;
        materialCost: number;
        laborCost: number;
        equipmentCost: number;
    };
}

// ── Input Price History ──
export interface InputPriceHistoryItem {
    id: string;
    priceNotTaxed: number | null;
    priceTaxed: number | null;
    reference: SinapiReferenceDto;
}

// ── Composition Cost History ──
export interface CompositionCostHistoryItem {
    id: string;
    totalNotTaxed: number | null;
    totalTaxed: number | null;
    materialCost: number | null;
    laborCost: number | null;
    equipmentCost: number | null;
    calculationMethod: string;
    reference: SinapiReferenceDto;
}

// ── Stats ──
export interface SinapiStatsResponse {
    references: number;
    inputs: number;
    compositions: number;
    inputPrices: number;
    compositionCosts: number;
    budgetLinks: number;
    defaultState: string;
    activeReference: string | null;
}
