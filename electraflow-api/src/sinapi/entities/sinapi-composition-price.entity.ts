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

// ============================================================
// SINAPI COMPOSITION PRICE — Preço calculado da composição
// ============================================================

@Entity('sinapi_composition_prices')
@Index(['compositionId', 'state'])
export class SinapiCompositionPrice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    compositionId: string;

    @ManyToOne(() => SinapiComposition, (c) => c.prices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'compositionId' })
    composition: SinapiComposition;

    @Column({ type: 'char', length: 2 })
    state: string;                     // UF

    @Column({ type: 'date' })
    referenceDate: Date;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    totalNotTaxed: number;             // Preço total não desonerado

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    totalTaxed: number;                // Preço total desonerado

    @CreateDateColumn()
    createdAt: Date;
}
