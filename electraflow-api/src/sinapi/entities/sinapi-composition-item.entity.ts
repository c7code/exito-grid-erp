import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { SinapiComposition } from './sinapi-composition.entity';
import { SinapiInput } from './sinapi-input.entity';

// ============================================================
// SINAPI COMPOSITION ITEM — Insumo dentro de uma composição
// ============================================================

@Entity('sinapi_composition_items')
export class SinapiCompositionItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    compositionId: string;

    @ManyToOne(() => SinapiComposition, (c) => c.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'compositionId' })
    composition: SinapiComposition;

    @Column({ nullable: true })
    inputId: string;

    @ManyToOne(() => SinapiInput, { nullable: true, onDelete: 'SET NULL', eager: true })
    @JoinColumn({ name: 'inputId' })
    input: SinapiInput;

    // Uma composição pode conter outra composição (composição auxiliar)
    @Column({ nullable: true })
    childCompositionId: string;

    @ManyToOne(() => SinapiComposition, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'childCompositionId' })
    childComposition: SinapiComposition;

    @Column({ type: 'decimal', precision: 15, scale: 6 })
    coefficient: number;               // Coeficiente/quantidade

    @CreateDateColumn()
    createdAt: Date;
}
