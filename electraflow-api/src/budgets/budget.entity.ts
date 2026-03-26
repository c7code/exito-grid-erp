import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { BudgetItem } from './budget-item.entity';

// ============================================================
// BUDGET — Orçamento paramétrico de construção civil
// ============================================================

@Entity('budgets')
export class Budget {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;                          // "Instalação Elétrica - Casa Recife"

    @Column({ nullable: true })
    description: string;                   // Observações gerais

    @Column({ default: 'PE' })
    state: string;                         // UF base de preços SINAPI

    @Column({ default: 'geral' })
    workType: string;                      // residencial | comercial | industrial | manutencao | geral

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    bdiPercent: number;                    // BDI (Benefícios e Despesas Indiretas) %

    @Column({ default: 'rascunho' })
    status: string;                        // rascunho | finalizado | aprovado

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    totalMaterial: number;

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    totalLabor: number;

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    totalEquipment: number;

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    subtotal: number;                      // material + labor + equipment

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    bdiValue: number;                      // subtotal * bdiPercent / 100

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    total: number;                         // subtotal + bdiValue

    @Column({ nullable: true })
    userId: string;                        // Quem criou

    @Column({ nullable: true })
    companyId: string;                     // Empresa

    @OneToMany(() => BudgetItem, item => item.budget, { cascade: true })
    items: BudgetItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
