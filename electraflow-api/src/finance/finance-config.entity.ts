import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';

// ══════════════════════════════════════════════════════════════════
// DRE CATEGORIES — Hierarchical DRE structure
// ══════════════════════════════════════════════════════════════════
export enum DreCategoryType {
  RECEITA = 'receita',
  DESPESA = 'despesa',
  TOTALIZADOR = 'totalizador',
}

export enum DreCategorySignal {
  PLUS = '+',
  MINUS = '-',
  EQUALS = '=',
}

@Entity('dre_categories')
export class DreCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: DreCategoryType.DESPESA })
  type: DreCategoryType;

  @Column({ type: 'varchar', default: DreCategorySignal.MINUS })
  signal: DreCategorySignal;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => DreCategory, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: DreCategory;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean; // Cannot be deleted

  @Column({ nullable: true })
  transactionCategory: string; // Maps to TransactionCategory enum

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

// ══════════════════════════════════════════════════════════════════
// BANK ACCOUNTS
// ══════════════════════════════════════════════════════════════════
@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // "Conta Bradesco", "Caixa PJ"

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankCode: string;

  @Column({ nullable: true })
  agency: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  accountType: string; // corrente, poupanca, investimento

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  initialBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  pixKey: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

// ══════════════════════════════════════════════════════════════════
// COST CENTERS
// ══════════════════════════════════════════════════════════════════
@Entity('cost_centers')
export class CostCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

// ══════════════════════════════════════════════════════════════════
// CHART OF ACCOUNTS (Plano de Contas)
// ══════════════════════════════════════════════════════════════════
@Entity('chart_of_accounts')
export class ChartOfAccounts {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string; // "1.1.01"

  @Column()
  name: string;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => ChartOfAccounts, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: ChartOfAccounts;

  @Column({ type: 'varchar', default: 'analitica' })
  nature: string; // 'analitica' | 'sintetica'

  @Column({ type: 'varchar', default: 'despesa' })
  type: string; // 'receita' | 'despesa'

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

// ══════════════════════════════════════════════════════════════════
// CASH REGISTERS (Caixas)
// ══════════════════════════════════════════════════════════════════
@Entity('cash_registers')
export class CashRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  responsibleName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

// ══════════════════════════════════════════════════════════════════
// PAYMENT METHODS CONFIG
// ══════════════════════════════════════════════════════════════════
@Entity('payment_methods_config')
export class PaymentMethodConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // "PIX", "Boleto", "Cartão de Crédito"

  @Column({ nullable: true })
  code: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  defaultFeePercent: number; // Taxa padrão (ex: 2.5% cartão)

  @Column({ default: 0 })
  defaultInstallments: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
