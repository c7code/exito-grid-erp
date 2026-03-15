import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CatalogItem } from './catalog.entity';

// ============================================================
// CATALOG GROUPING ITEM — Composição de um produto agrupador
// Ex: CE1 = 3x Alça + 2x Parafuso + 3kg Grampo
// ============================================================

@Entity('catalog_grouping_items')
export class CatalogGroupingItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    parentItemId: string;

    @ManyToOne(() => CatalogItem, (item) => item.groupingItems, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentItemId' })
    parentItem: CatalogItem;

    @Column()
    childItemId: string;

    @ManyToOne(() => CatalogItem, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'childItemId' })
    childItem: CatalogItem;

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 1 })
    quantity: number;

    @Column({ default: 'UN' })
    unit: string;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
