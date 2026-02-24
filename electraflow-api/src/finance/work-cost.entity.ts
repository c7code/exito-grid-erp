import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Work } from '../works/work.entity';
import { Supplier } from '../supply/supply.entity';
import { Employee } from '../employees/employee.entity';
import { Payment } from './payment.entity';

export enum WorkCostCategory {
    MATERIAL = 'material',
    LABOR = 'labor',
    SUBCONTRACT = 'subcontract',
    EQUIPMENT = 'equipment',
    TRANSPORT = 'transport',
    TAX = 'tax',
    RENTAL = 'rental',
    PPE = 'ppe',
    FOOD = 'food',
    LODGING = 'lodging',
    OTHER = 'other',
}

export enum WorkCostStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    PAID = 'paid',
    CANCELLED = 'cancelled',
}

@Entity('work_costs')
export class WorkCost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    workId: string;

    @ManyToOne(() => Work, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workId' })
    work: Work;

    // Quem prestou o serviço / forneceu
    @Column({ nullable: true })
    supplierId: string;

    @ManyToOne(() => Supplier, { nullable: true })
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier;

    @Column({ nullable: true })
    employeeId: string;

    @ManyToOne(() => Employee, { nullable: true })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    // Detalhes do custo
    @Column({ type: 'enum', enum: WorkCostCategory, default: WorkCostCategory.OTHER })
    category: WorkCostCategory;

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

    @Column({ nullable: true })
    date: Date;

    @Column({ nullable: true })
    invoiceNumber: string;

    @Column({ type: 'enum', enum: WorkCostStatus, default: WorkCostStatus.PENDING })
    status: WorkCostStatus;

    // Vínculo com pagamento realizado
    @Column({ nullable: true })
    paymentId: string;

    @ManyToOne(() => Payment, { nullable: true })
    @JoinColumn({ name: 'paymentId' })
    payment: Payment;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
