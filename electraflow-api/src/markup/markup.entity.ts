import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';

// ============================================================
// MARKUP CONFIG — Configuração de Markup por critério
// ============================================================

export enum MarkupScope {
    GLOBAL = 'global',           // Markup padrão do sistema
    CATEGORY = 'category',       // Por categoria de produto
    ACTIVITY_TYPE = 'activity_type', // Por tipo de atividade (BT, MT, solar)
    SUPPLIER_TYPE = 'supplier_type', // Por tipo de fornecedor
    CLIENT_TYPE = 'client_type',     // Por tipo de cliente
}

@Entity('markup_configs')
export class MarkupConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;                  // "Markup Padrão", "Markup BT", "Markup Fábrica"

    @Column({ type: 'varchar', default: 'global' })
    scope: string;                 // global | category | activity_type | supplier_type | client_type

    @Column({ nullable: true })
    scopeValue: string;            // ID ou valor do critério (ex: categoryId, "BT", "factory")

    @Column({ type: 'decimal', precision: 8, scale: 4, default: 1.0 })
    markupMultiplier: number;      // Multiplicador: 1.35 = 35% markup

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    markupPercentage: number;      // Percentual alternativo: 35.00

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    minimumMargin: number;         // Margem mínima em R$

    @Column({ type: 'int', default: 0 })
    priority: number;              // Prioridade: regras mais específicas têm maior prioridade

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
