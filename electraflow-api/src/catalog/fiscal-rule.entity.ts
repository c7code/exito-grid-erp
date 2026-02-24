import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CatalogCategory } from './catalog.entity';

// ═══════════════════════════════════════════════════════════════
// Regras Fiscais — por NCM ou por Grupo de Produtos
// ═══════════════════════════════════════════════════════════════

export enum FiscalRuleType {
    NCM = 'ncm',
    GROUP = 'group',
}

@Entity('fiscal_rules')
export class FiscalRule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: FiscalRuleType })
    ruleType: FiscalRuleType;

    // Se ruleType = 'ncm'
    @Column({ nullable: true })
    ncmCode: string;                       // NCM alvo

    // Se ruleType = 'group'
    @Column({ nullable: true })
    categoryId: string;

    @ManyToOne(() => CatalogCategory, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'categoryId' })
    category: CatalogCategory;

    @Column({ nullable: true })
    taxGroup: string;                      // Grupo de tributação

    @Column({ nullable: true })
    cfopInterno: string;                   // CFOP operação interna

    @Column({ nullable: true })
    cfopInterestadual: string;             // CFOP operação interestadual

    @Column({ default: false })
    segmentByNatureOp: boolean;            // Segmentar por natureza de operação

    @Column({ type: 'text', nullable: true })
    description: string;                   // Descrição da regra

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
