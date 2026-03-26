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
import { SinapiComposition } from './sinapi-composition.entity';

// ============================================================
// SINAPI COMPOSITION COST — Custo final da composição
// ============================================================

@Entity('sinapi_composition_costs')
@Index(['referenceId', 'compositionId', 'state'], { unique: true })
@Index(['compositionId'])
@Index(['state'])
export class SinapiCompositionCost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    referenceId: string;

    @ManyToOne(() => SinapiReference, (r) => r.compositionCosts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'referenceId' })
    reference: SinapiReference;

    @Column({ type: 'char', length: 2 })
    state: string;                     // UF: "PE", "SP", "AC"...

    @Column()
    compositionId: string;

    @ManyToOne(() => SinapiComposition, (c) => c.costs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'compositionId' })
    composition: SinapiComposition;

    @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
    totalNotTaxed: number;             // Custo total não desonerado

    @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
    totalTaxed: number;                // Custo total desonerado

    @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
    materialCost: number;              // Custo materiais

    @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
    laborCost: number;                 // Custo mão de obra

    @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
    equipmentCost: number;             // Custo equipamento

    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    laborPercent: number;              // % mão de obra (da planilha MO)

    @Column({ default: 'imported' })
    calculationMethod: string;         // 'imported' | 'calculated'

    @CreateDateColumn()
    createdAt: Date;
}
