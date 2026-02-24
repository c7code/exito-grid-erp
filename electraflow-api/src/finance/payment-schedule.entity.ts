import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Work } from '../works/work.entity';
import { Supplier } from '../supply/supply.entity';
import { Employee } from '../employees/employee.entity';
import { Payment } from './payment.entity';

export enum ScheduleStatus {
    SCHEDULED = 'scheduled',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
}

@Entity('payment_schedules')
export class PaymentSchedule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    workId: string;

    @ManyToOne(() => Work, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workId' })
    work: Work;

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

    @Column()
    description: string;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount: number;

    @Column()
    dueDate: Date;

    @Column({ default: 1 })
    installmentNumber: number;

    @Column({ default: 1 })
    totalInstallments: number;

    @Column({ type: 'enum', enum: ScheduleStatus, default: ScheduleStatus.SCHEDULED })
    status: ScheduleStatus;

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
