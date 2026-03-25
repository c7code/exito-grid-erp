import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

// ═══════════════════════════════════════════════════════════════
// SINAPI PRICING PROFILE — Perfil de precificação comercial
// ═══════════════════════════════════════════════════════════════
// Um perfil contém todos os % e valores fixos para transformar
// custo técnico SINAPI em preço comercial (preço de venda).
// Cada empresa pode ter múltiplos perfis (ex: "Padrão", "Obra pública",
// "Residencial", "Industrial") — o perfil ativo é vinculado à proposta.

@Entity('sinapi_pricing_profiles')
export class SinapiPricingProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;                          // "Padrão", "Obra Pública", etc.

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: false })
    isDefault: boolean;                    // Perfil padrão da empresa

    @Column({ default: true })
    isActive: boolean;

    // ═══ COMPONENTES DO BDI (%) ═══
    // BDI = Benefícios e Despesas Indiretas

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    bdiAdminPercent: number;               // Administração central (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    bdiFinancialPercent: number;           // Despesas financeiras (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    bdiInsurancePercent: number;           // Seguros + garantias (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    bdiProfitPercent: number;              // Lucro bruto (%)

    // ═══ CUSTOS DIRETOS ADICIONAIS (%) ═══

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    mobilizationPercent: number;           // Mobilização/desmob. (% sobre custo)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    localAdminPercent: number;             // Administração local (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    logisticsPercent: number;              // Logística/frete (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    contingencyPercent: number;            // Contingência/risco (%)

    // ═══ CUSTOS FIXOS (R$) ═══

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    technicalVisitCost: number;            // Custo de visita técnica (R$)

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    artPermitCost: number;                 // ART / laudo / projeto (R$)

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    otherFixedCosts: number;               // Outros custos fixos (R$)

    // ═══ IMPOSTOS (%) ═══

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    issPercent: number;                    // ISS (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    pisPercent: number;                    // PIS (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    cofinsPercent: number;                 // COFINS (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    irpjPercent: number;                   // IRPJ (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    csllPercent: number;                   // CSLL (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    inssPercent: number;                   // INSS/CPP (%)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
    otherTaxPercent: number;               // Outros tributos (%)

    // ═══ ARREDONDAMENTO ═══

    @Column({ type: 'varchar', default: 'none' })
    roundingMode: string;                  // 'none' | 'ceil_10' | 'ceil_50' | 'ceil_100' | 'round_10' | 'round_50' | 'round_100' | 'custom'

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    customRoundingValue: number;           // Valor para arredondamento custom

    // ═══ FÓRMULA DE CÁLCULO ═══

    @Column({ type: 'varchar', default: 'standard' })
    calculationMethod: string;             // 'standard' | 'tcpo' | 'custom'
    // standard = PV = CD × (1 + BDI)
    // tcpo     = PV = CD / (1 - BDI)  (formula TCPO/Pini)

    // ═══ METADADOS ═══

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
