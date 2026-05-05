import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

export enum InstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('payment_installments')
export class PaymentInstallment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  paymentId: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ type: 'int', default: 1 })
  installmentNumber: number;

  @Column({ type: 'int', default: 1 })
  totalInstallments: number;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column()
  dueDate: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ type: 'varchar', default: InstallmentStatus.PENDING })
  status: InstallmentStatus;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
