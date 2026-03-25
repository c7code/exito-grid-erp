import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';

// ============================================================
// SINAPI REFERENCE — Referência mensal (competência)
// Ex: SINAPI Jan/2025 - PE
// ============================================================

@Entity('sinapi_references')
@Index(['year', 'month', 'state'], { unique: true })
export class SinapiReference {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    year: number;                      // 2025

    @Column({ type: 'int' })
    month: number;                     // 1-12

    @Column({ type: 'char', length: 2 })
    state: string;                     // "PE", "SP", "BA"

    @Column({ nullable: true })
    label: string;                     // "SINAPI JAN/2025 - PE"

    @Column({ type: 'date', nullable: true })
    publishedAt: Date;                 // Data de publicação

    @Column({ default: 'sinapi_caixa' })
    source: string;                    // "sinapi_caixa" / "sicro"

    @Column({ default: 'active' })
    status: string;                    // "active" / "superseded"

    @OneToMany('SinapiInputPrice', 'reference')
    inputPrices: any[];

    @OneToMany('SinapiCompositionCost', 'reference')
    compositionCosts: any[];

    @CreateDateColumn()
    createdAt: Date;
}
