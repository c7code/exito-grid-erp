import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CatalogItem } from './catalog.entity';
import { Supplier } from '../supply/supply.entity';

// ═══════════════════════════════════════════════════════════════
// Vínculo Produto ↔ Fornecedor
// ═══════════════════════════════════════════════════════════════

@Entity('product_suppliers')
export class ProductSupplier {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    catalogItemId: string;

    @ManyToOne(() => CatalogItem, (item) => item.productSuppliers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'catalogItemId' })
    catalogItem: CatalogItem;

    @Column()
    supplierId: string;

    @ManyToOne(() => Supplier, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier;

    @Column({ nullable: true })
    supplierProductCode: string;           // Código do produto no fornecedor

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    lastPrice: number;                     // Último preço

    @Column({ type: 'int', nullable: true })
    leadTimeDays: number;                  // Prazo de entrega (dias)

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;
}
