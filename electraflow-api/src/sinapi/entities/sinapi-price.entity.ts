import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SinapiInput } from './sinapi-input.entity';

// ============================================================
// SINAPI PRICE — Preço por UF e data de referência
// ============================================================

@Entity('sinapi_prices')
@Index(['inputId', 'state', 'referenceDate'])
export class SinapiPrice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    inputId: string;

    @ManyToOne(() => SinapiInput, (i) => i.prices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inputId' })
    input: SinapiInput;

    @Column({ type: 'char', length: 2 })
    state: string;                     // UF: "SP", "MG", "BA"

    @Column({ type: 'date' })
    referenceDate: Date;               // Data de referência: 2025-03-01

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    priceNotTaxed: number;             // Preço não desonerado

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    priceTaxed: number;                // Preço desonerado

    @Column({ default: 'sinapi' })
    source: string;

    @CreateDateColumn()
    createdAt: Date;
}
