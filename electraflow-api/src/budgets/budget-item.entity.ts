import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Budget } from './budget.entity';

// ============================================================
// BUDGET ITEM — Item do orçamento (composição ou insumo SINAPI)
// ============================================================

@Entity('budget_items')
export class BudgetItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    budgetId: string;

    @ManyToOne(() => Budget, budget => budget.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'budgetId' })
    budget: Budget;

    @Column({ nullable: true })
    sinapiCode: string;                    // Código SINAPI (ex: "91998")

    @Column({ nullable: true })
    sinapiCompositionId: string;           // UUID da composição SINAPI

    @Column({ type: 'text' })
    description: string;                   // Descrição do item

    @Column({ default: 'UN' })
    unit: string;                          // Unidade: UN, M, M2, H

    @Column({ default: 'composicao' })
    itemType: string;                      // composicao | insumo | mao_de_obra | custom

    @Column({ default: 'material' })
    costCategory: string;                  // material | mao_de_obra | equipamento

    // === Coeficiente/Quantidade ===
    @Column({ type: 'decimal', precision: 14, scale: 6, default: 1 })
    quantity: number;                      // Quantidade (editável pelo orçamentista)

    @Column({ type: 'decimal', precision: 14, scale: 6, nullable: true })
    sinapiCoefficient: number;             // Coeficiente original SINAPI (referência)

    // === Preços ===
    @Column({ type: 'decimal', precision: 14, scale: 4, default: 0 })
    unitCost: number;                      // Custo unitário (R$/unidade ou R$/hora)

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    subtotal: number;                      // quantity × unitCost

    @Column({ nullable: true })
    priceSource: string;                   // 'sinapi_csd' | 'sinapi_isd' | 'manual'

    @Column({ type: 'integer', default: 0 })
    sortOrder: number;

    @Column({ nullable: true })
    notes: string;                         // Observações do orçamentista

    @CreateDateColumn()
    createdAt: Date;
}
