import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Work } from '../works/work.entity';
import { Client } from '../clients/client.entity';
import { Measurement } from './measurement.entity';
import { Supplier } from '../supply/supply.entity';
import { Employee } from '../employees/employee.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  BOLETO = 'boleto',
  CASH = 'cash',
}

export enum PaymentType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionCategory {
  MATERIALS = 'materials',
  LABOR = 'labor',
  EQUIPMENT = 'equipment',
  TAX = 'tax',
  OFFICE = 'office',
  PROJECT = 'project',
  UTILITIES = 'utilities',
  MARKETING = 'marketing',
  OTHER = 'other',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  workId: string;

  @ManyToOne(() => Work)
  @JoinColumn({ name: 'workId' })
  work: Work;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  measurementId: string;

  @ManyToOne(() => Measurement, { nullable: true })
  @JoinColumn({ name: 'measurementId' })
  measurement: Measurement;

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

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.INCOME })
  type: PaymentType;

  @Column({ type: 'enum', enum: TransactionCategory, nullable: true })
  category: TransactionCategory;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  billingDate: Date;

  @Column({ nullable: true })
  scheduledPaymentDate: Date;

  // ─── Retenção ───────────────────────────────────────────────────────────────
  /** Percentual de retenção sobre o valor bruto */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxWithholding: number;

  /** Valor da retenção em R$ */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxWithholdingAmount: number;

  /** Percentual de retenção sobre o valor bruto (alias explícito) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  retentionPercentage: number;

  // ─── Impostos Municipais ─────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxISS: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxISSAmount: number;

  // ─── Impostos Federais ───────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxCSLL: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxCSLLAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxPISCOFINS: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxPISCOFINSAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxIRRF: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxIRRFAmount: number;

  // ─── Impostos Estaduais ──────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxICMS: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxICMSAmount: number;

  /** Observações sobre as retenções/impostos */
  @Column({ type: 'text', nullable: true })
  taxObservation: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxCost: number;

  // ─── Nota Fiscal ─────────────────────────────────────────────────────────
  /** Caminho do arquivo da Nota Fiscal no servidor */
  @Column({ nullable: true })
  invoiceFile: string;

  /** Nome original do arquivo da NF */
  @Column({ nullable: true })
  invoiceFileName: string;

  // ─── Rateio ──────────────────────────────────────────────────────────────
  /**
   * Array de rateio: [{ description: string, percentage: number, amount: number }]
   */
  @Column({ type: 'simple-json', nullable: true })
  apportionmentItems: Array<{ description: string; percentage: number; amount: number }>;

  // ─── Centro de Custo e Origem ─────────────────────────────────────────────
  @Column({ nullable: true })
  costCenter: string;

  @Column({ nullable: true })
  financialOrigin: string;

  // ─── Anexos ──────────────────────────────────────────────────────────────
  @Column({ type: 'simple-array', nullable: true })
  attachments: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
