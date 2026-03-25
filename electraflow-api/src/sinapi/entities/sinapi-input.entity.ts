import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { CatalogItem } from '../../catalog/catalog.entity';

// ============================================================
// SINAPI INPUT — Insumo SINAPI (material, mão de obra, equip.)
// ============================================================

@Entity('sinapi_inputs')
@Index(['code'], { unique: true })
export class SinapiInput {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    code: string;                      // Código SINAPI: "00000370"

    @Column({ type: 'text' })
    description: string;               // Descrição oficial

    @Column()
    unit: string;                      // UN, M, KG, H, M2, M3

    @Column({ default: 'material' })
    type: string;                      // 'material' | 'mao_de_obra' | 'equipamento'

    @Column({ default: 'sinapi' })
    origin: string;                    // 'sinapi' | 'sicro' | 'manual'

    @Column({ nullable: true })
    catalogItemId: string;             // Vínculo opcional com CatalogItem

    @ManyToOne(() => CatalogItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'catalogItemId' })
    catalogItem: CatalogItem;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany('SinapiPrice', 'input')
    prices: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
