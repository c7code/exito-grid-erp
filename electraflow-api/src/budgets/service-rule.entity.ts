import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

// ════════════════════════════════════════════════════════════════
// SERVICE RULE — Regra de Serviço (Detecção + Faixas de Complexidade)
// ════════════════════════════════════════════════════════════════

export interface ServiceBand {
    label: string;          // "Simples", "Médio", "Complexo"
    minValue: number;       // 1
    maxValue: number;       // 3
    laborHours: number;     // 0.3 horas do profissional
    helperHours: number;    // 0.15 horas do ajudante
    notes: string;          // Descrição para o orçamentista
}

@Entity('service_rules')
export class ServiceRule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;                       // "Tomada de Embutir"

    @Column({ default: 'eletrica' })
    category: string;                   // "eletrica" | "hidraulica" | "civil" | "equipamento"

    // ═══ DETECÇÃO INTELIGENTE ═══
    @Column({ type: 'jsonb', default: '[]' })
    keywords: string[];                 // ["TOMADA", "EMBUTIR"] — TODAS devem existir

    @Column({ type: 'jsonb', default: '[]' })
    excludeKeywords: string[];          // ["COLAR", "PISO"] — exclui falsos positivos

    @Column({ nullable: true })
    parameterName: string;              // "módulos" | "disjuntores" | "diâmetro"

    @Column({ nullable: true })
    parameterRegex: string;             // "\\((\\d+)\\s*MÓDULO"

    // ═══ PROFISSIONAL SINAPI ═══
    @Column({ nullable: true })
    professionalCode: string;           // "2436" — Eletricista

    @Column({ nullable: true })
    professionalLabel: string;          // "Eletricista"

    @Column({ nullable: true })
    helperCode: string;                 // "247" — Ajudante

    @Column({ nullable: true })
    helperLabel: string;                // "Ajudante de Eletricista"

    // ═══ FAIXAS DE COMPLEXIDADE ═══
    @Column({ type: 'jsonb', default: '[]' })
    bands: ServiceBand[];

    // ═══ MARGEM ESPECÍFICA (override do padrão da empresa) ═══
    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    customProfitPercent: number;        // null = usa o da empresa; ex: 50% para quadros

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @Column({ nullable: true })
    companyId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
