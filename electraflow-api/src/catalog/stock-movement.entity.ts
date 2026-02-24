import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CatalogItem } from './catalog.entity';

// ═══════════════════════════════════════════════════════════════
// Movimentação de Estoque
// ═══════════════════════════════════════════════════════════════

export enum StockMovementType {
    ENTRADA = 'entrada',
    SAIDA = 'saida',
    AJUSTE = 'ajuste',
    RESERVA = 'reserva',
    CANCELAMENTO = 'cancelamento',
}

@Entity('stock_movements')
export class StockMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    catalogItemId: string;

    @ManyToOne(() => CatalogItem, (item) => item.stockMovements, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'catalogItemId' })
    catalogItem: CatalogItem;

    @Column({ type: 'enum', enum: StockMovementType })
    type: StockMovementType;

    @Column({ type: 'decimal', precision: 15, scale: 3 })
    quantity: number;                      // Quantidade (positiva = entrada, negativa = saída)

    @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
    stockAfter: number;                    // Estoque após movimentação

    @Column({ type: 'text', nullable: true })
    reason: string;                        // Motivo

    @Column({ nullable: true })
    referenceType: string;                 // 'proposal' | 'quotation' | 'manual' | 'invoice'

    @Column({ nullable: true })
    referenceId: string;                   // ID da proposta/cotação/NF

    @Column({ nullable: true })
    createdBy: string;                     // Usuário que fez a movimentação

    @CreateDateColumn()
    createdAt: Date;
}
