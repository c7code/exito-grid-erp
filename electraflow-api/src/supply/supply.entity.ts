import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { CatalogItem } from '../catalog/catalog.entity';

// ============================================================
// SUPPLIER — Cadastro de Fornecedor
// ============================================================

export enum SupplierSegment {
    MATERIAL = 'material',
    SERVICE = 'service',
    BOTH = 'both',
}

export enum SupplierStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    BLOCKED = 'blocked',
}

@Entity('suppliers')
export class Supplier {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    tradeName: string;

    @Column({ nullable: true })
    cnpj: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    whatsapp: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    @Column({ nullable: true })
    zipCode: string;

    @Column({ type: 'enum', enum: SupplierSegment, default: SupplierSegment.MATERIAL })
    segment: SupplierSegment;

    @Column({ type: 'enum', enum: SupplierStatus, default: SupplierStatus.ACTIVE })
    status: SupplierStatus;

    @Column({ type: 'int', default: 0 })
    rating: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ nullable: true })
    paymentTerms: string;

    @OneToMany(() => SupplierContact, (c) => c.supplier, { cascade: true })
    contacts: SupplierContact[];

    @OneToMany(() => QuotationResponse, (r) => r.supplier)
    quotationResponses: QuotationResponse[];

    @OneToMany(() => PriceHistory, (p) => p.supplier)
    priceHistory: PriceHistory[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// ============================================================
// SUPPLIER CONTACT
// ============================================================

@Entity('supplier_contacts')
export class SupplierContact {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    role: string;

    @Column({ default: false })
    isPrimary: boolean;

    @Column()
    supplierId: string;

    @ManyToOne(() => Supplier, (s) => s.contacts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier;

    @CreateDateColumn()
    createdAt: Date;
}

// ============================================================
// QUOTATION REQUEST — Solicitação de Cotação
// ============================================================

export enum QuotationStatus {
    DRAFT = 'draft',
    SENT = 'sent',
    RECEIVED = 'received',
    ANALYZED = 'analyzed',
    CLOSED = 'closed',
}

@Entity('quotation_requests')
export class QuotationRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column()
    title: string;

    @Column({ type: 'enum', enum: QuotationStatus, default: QuotationStatus.DRAFT })
    status: QuotationStatus;

    @Column({ type: 'date', nullable: true })
    deadline: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ nullable: true })
    requestedById: string;

    @OneToMany(() => QuotationItem, (i) => i.quotationRequest, { cascade: true })
    items: QuotationItem[];

    @OneToMany(() => QuotationResponse, (r) => r.quotationRequest, { cascade: true })
    responses: QuotationResponse[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// ============================================================
// QUOTATION ITEM — Item da Cotação
// ============================================================

@Entity('quotation_items')
export class QuotationItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    catalogItemId: string;

    @ManyToOne(() => CatalogItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'catalogItemId' })
    catalogItem: CatalogItem;

    @Column()
    description: string;

    @Column({ type: 'decimal', precision: 15, scale: 4 })
    quantity: number;

    @Column({ default: 'un' })
    unit: string;

    @Column()
    quotationRequestId: string;

    @ManyToOne(() => QuotationRequest, (q) => q.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quotationRequestId' })
    quotationRequest: QuotationRequest;

    @OneToMany(() => QuotationResponseItem, (ri) => ri.quotationItem)
    responseItems: QuotationResponseItem[];
}

// ============================================================
// QUOTATION RESPONSE — Resposta do Fornecedor
// ============================================================

export enum QuotationResponseStatus {
    PENDING = 'pending',
    RECEIVED = 'received',
    SELECTED = 'selected',
    REJECTED = 'rejected',
}

@Entity('quotation_responses')
export class QuotationResponse {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    supplierId: string;

    @ManyToOne(() => Supplier, (s) => s.quotationResponses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier;

    @Column()
    quotationRequestId: string;

    @ManyToOne(() => QuotationRequest, (q) => q.responses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quotationRequestId' })
    quotationRequest: QuotationRequest;

    @Column({ type: 'enum', enum: QuotationResponseStatus, default: QuotationResponseStatus.PENDING })
    status: QuotationResponseStatus;

    @Column({ type: 'timestamp', nullable: true })
    receivedAt: Date;

    @Column({ type: 'date', nullable: true })
    validUntil: Date;

    @Column({ type: 'int', nullable: true })
    deliveryDays: number;

    @Column({ nullable: true })
    paymentTerms: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @OneToMany(() => QuotationResponseItem, (ri) => ri.quotationResponse, { cascade: true })
    items: QuotationResponseItem[];

    @CreateDateColumn()
    createdAt: Date;
}

// ============================================================
// QUOTATION RESPONSE ITEM — Preço do Item por Fornecedor
// ============================================================

@Entity('quotation_response_items')
export class QuotationResponseItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    quotationItemId: string;

    @ManyToOne(() => QuotationItem, (qi) => qi.responseItems, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quotationItemId' })
    quotationItem: QuotationItem;

    @Column()
    quotationResponseId: string;

    @ManyToOne(() => QuotationResponse, (qr) => qr.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quotationResponseId' })
    quotationResponse: QuotationResponse;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    totalPrice: number;

    @Column({ type: 'text', nullable: true })
    notes: string;
}

// ============================================================
// PRICE HISTORY — Memorial de Preços
// ============================================================

export enum PriceSource {
    QUOTATION = 'quotation',
    MANUAL = 'manual',
    IMPORT = 'import',
}

@Entity('price_history')
export class PriceHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    catalogItemId: string;

    @ManyToOne(() => CatalogItem, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'catalogItemId' })
    catalogItem: CatalogItem;

    @Column()
    supplierId: string;

    @ManyToOne(() => Supplier, (s) => s.priceHistory, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    unitPrice: number;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'enum', enum: PriceSource, default: PriceSource.MANUAL })
    source: PriceSource;

    @Column({ nullable: true })
    quotationResponseId: string;

    @ManyToOne(() => QuotationResponse, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'quotationResponseId' })
    quotationResponse: QuotationResponse;

    @CreateDateColumn()
    createdAt: Date;
}
