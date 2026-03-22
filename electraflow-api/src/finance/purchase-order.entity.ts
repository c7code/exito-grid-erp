import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Client } from '../clients/client.entity';
import { Supplier } from '../supply/supply.entity';

@Entity('purchase_orders')
export class PurchaseOrder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    orderNumber: string;

    @Column({ nullable: true })
    proposalId: string;

    @Column({ nullable: true })
    supplierId: string;

    @ManyToOne(() => Supplier, { nullable: true })
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier;

    @Column({ nullable: true })
    clientId: string;

    @ManyToOne(() => Client, { nullable: true })
    @JoinColumn({ name: 'clientId' })
    client: Client;

    // company_billing = empresa compra e revende, direct_billing = fatura direto pro cliente
    @Column({ type: 'varchar', default: 'company_billing' })
    type: string;

    @Column({ type: 'varchar', default: 'draft' })
    status: string; // draft | sent | confirmed | delivered | cancelled

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalValue: number;

    @Column({ type: 'text', nullable: true })
    paymentTerms: string;

    // Campos internos — NÃO visíveis no PDF do cliente/fornecedor
    @Column({ type: 'text', nullable: true })
    internalNotes: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    internalMargin: number;

    @Column({ nullable: true })
    deliveryDate: Date;

    @Column({ type: 'text', nullable: true })
    deliveryAddress: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'text', nullable: true })
    proposalNumber: string;

    @OneToMany(() => PurchaseOrderItem, item => item.purchaseOrder, { cascade: true })
    items: PurchaseOrderItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}

@Entity('purchase_order_items')
export class PurchaseOrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    purchaseOrderId: string;

    @ManyToOne(() => PurchaseOrder, po => po.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'purchaseOrderId' })
    purchaseOrder: PurchaseOrder;

    @Column()
    description: string;

    @Column({ type: 'decimal', precision: 15, scale: 4, default: 1 })
    quantity: number;

    @Column({ default: 'un' })
    unit: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalPrice: number;

    // Custo interno — só empresa vê (NÃO aparece no PDF)
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    internalCost: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;
}
