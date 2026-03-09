import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Work } from '../works/work.entity';
import { User } from '../users/user.entity';

// ============ INVENTORY ITEM (Warehouse items with stock) ============
@Entity('inventory_items')
export class InventoryItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    code: string;

    @Column({ nullable: true })
    category: string;

    @Column({ nullable: true })
    unit: string; // un, m, kg, m², etc.

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    currentStock: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    minimumStock: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    unitCost: number;

    @Column({ nullable: true })
    location: string; // Almoxarifado central, Obra X, etc.

    @Column({ nullable: true })
    supplier: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => StockMovement, mov => mov.item)
    movements: StockMovement[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}

// ============ STOCK MOVEMENT (Entry / Exit / Transfer) ============
export enum MovementType {
    ENTRY = 'entry',
    EXIT = 'exit',
    TRANSFER = 'transfer',
    ADJUSTMENT = 'adjustment',
    RETURN = 'return',
}

@Entity('stock_movements')
export class StockMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    itemId: string;

    @ManyToOne(() => InventoryItem, item => item.movements)
    @JoinColumn({ name: 'itemId' })
    item: InventoryItem;

    @Column({ type: 'enum', enum: MovementType })
    type: MovementType;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    quantity: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    unitCost: number;

    @Column({ nullable: true })
    workId: string;

    @ManyToOne(() => Work)
    @JoinColumn({ name: 'workId' })
    work: Work;

    @Column({ nullable: true })
    origin: string; // From location

    @Column({ nullable: true })
    destination: string; // To location

    @Column({ type: 'text', nullable: true })
    reason: string;

    @Column({ nullable: true })
    invoiceNumber: string;

    @Column({ nullable: true })
    performedById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'performedById' })
    performedBy: User;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
