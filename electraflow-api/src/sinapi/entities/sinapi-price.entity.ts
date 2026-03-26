import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SinapiReference } from './sinapi-reference.entity';
import { SinapiInput } from './sinapi-input.entity';

// ============================================================
// SINAPI INPUT PRICE — Preço do insumo por referência mensal
// ============================================================

@Entity('sinapi_input_prices')
@Index(['referenceId', 'inputId', 'state'], { unique: true })
@Index(['inputId'])
@Index(['state'])
export class SinapiInputPrice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    referenceId: string;

    @ManyToOne(() => SinapiReference, (r) => r.inputPrices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'referenceId' })
    reference: SinapiReference;

    @Column({ type: 'char', length: 2 })
    state: string;                     // UF: "PE", "SP", "AC"...

    @Column()
    inputId: string;

    @ManyToOne(() => SinapiInput, (i) => i.prices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inputId' })
    input: SinapiInput;

    @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
    priceNotTaxed: number;             // Preço não desonerado

    @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
    priceTaxed: number;                // Preço desonerado

    @Column({ default: 'sinapi' })
    origin: string;

    @CreateDateColumn()
    createdAt: Date;
}
