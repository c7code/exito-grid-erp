import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SinapiComposition } from './sinapi-composition.entity';
import { SinapiReference } from './sinapi-reference.entity';

// ============================================================
// SINAPI BUDGET LINK — Vínculo Orçamento ↔ SINAPI
// Ponte entre itens de proposta e composições SINAPI
// ============================================================

@Entity('sinapi_budget_links')
@Index(['proposalId'])
@Index(['compositionId'])
export class SinapiBudgetLink {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    proposalId: string;                // → proposals.id

    @Column()
    proposalItemId: string;            // ID do item na proposta (JSON items array)

    @Column()
    compositionId: string;

    @ManyToOne(() => SinapiComposition, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'compositionId' })
    composition: SinapiComposition;

    @Column()
    referenceId: string;

    @ManyToOne(() => SinapiReference, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'referenceId' })
    reference: SinapiReference;

    @Column({ type: 'decimal', precision: 15, scale: 6, default: 1 })
    coefficient: number;               // Quantidade/coeficiente aplicado

    @Column({ type: 'decimal', precision: 15, scale: 4 })
    sinapiUnitCost: number;            // Custo unitário SINAPI no momento (congelado)

    @Column({ type: 'decimal', precision: 15, scale: 4 })
    budgetUnitPrice: number;           // Preço unitário orçado (com BDI)

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    bdiPercent: number;                // BDI aplicado (%)

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;
}
