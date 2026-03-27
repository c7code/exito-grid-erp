import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

// ════════════════════════════════════════════════════════════════
// COMPANY FINANCIALS — Parâmetros Financeiros Centralizados
// Composição do BDI detalhada (padrão DNIT/TCU)
// ════════════════════════════════════════════════════════════════

@Entity('company_financials')
export class CompanyFinancials {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 'default' })
    profileName: string;                // "Padrão", "Obra Pública", "Residencial"

    // ═══ ENCARGOS SOCIAIS (sobre folha) ═══
    @Column({ type: 'decimal', precision: 6, scale: 2, default: 68.47 })
    encargosPercent: number;            // INSS, FGTS, 13o, férias, etc.

    // ═══ COMPOSIÇÃO DO BDI (metodologia TCU) ═══
    @Column({ type: 'decimal', precision: 6, scale: 2, default: 4.00 })
    adminCentralPercent: number;        // Administração central

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0.80 })
    seguroPercent: number;              // Seguros e garantias

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 1.20 })
    riscoPercent: number;               // Riscos / imprevistos

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 1.40 })
    despesasFinanceirasPercent: number;  // Despesas financeiras

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 8.00 })
    lucroPercent: number;               // Lucro bruto

    // ═══ IMPOSTOS ═══
    @Column({ type: 'decimal', precision: 6, scale: 2, default: 3.65 })
    pisCofinPercent: number;            // PIS/COFINS

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 5.00 })
    issPercent: number;                 // ISS (varia por município)

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0.00 })
    icmsPercent: number;                // ICMS (quando aplicável)

    // ═══ MARGENS POR CATEGORIA ═══
    @Column({ type: 'jsonb', nullable: true })
    categoryMargins: {
        eletrica: number;
        hidraulica: number;
        civil: number;
        equipamento: number;
        geral: number;
    };

    // ═══ CALCULADOS ═══
    @Column({ type: 'decimal', precision: 6, scale: 2, default: 25.00 })
    bdiCalculated: number;              // BDI calculado automaticamente

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    companyId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
