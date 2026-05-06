import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';

export enum DebtType {
  LOAN = 'loan',                        // Empréstimo bancário
  FINANCING = 'financing',              // Financiamento (veículo, equipamento)
  CREDIT_CARD = 'credit_card',          // Cartão de crédito corporativo
  CREDIT_CARD_THIRD = 'credit_card_third', // Cartão de terceiros
  TAX_INSTALLMENT = 'tax_installment',  // Parcelamento tributário
  LEASING = 'leasing',                  // Leasing
  PERSONAL_CAPITAL = 'personal_capital', // Capital pessoal (sócio/investidor)
  THIRD_PARTY_CAPITAL = 'third_party_capital', // Capital de terceiros
  CORPORATE_CAPITAL = 'corporate_capital', // Capital corporativo
  SUPPLIER_DEBT = 'supplier_debt',      // Dívida com fornecedor
  JUDICIAL = 'judicial',                // Dívida judicial
  OTHER = 'other',
}

export enum DebtStatus {
  ACTIVE = 'active',
  PAID_OFF = 'paid_off',
  RENEGOTIATED = 'renegotiated',
  DEFAULTED = 'defaulted',
  FROZEN = 'frozen',                    // Congelada/em negociação
}

export enum DebtNature {
  GOOD = 'good',                        // Dívida boa (investimento produtivo)
  BAD = 'bad',                          // Dívida ruim (emergência, juros altos)
  NEUTRAL = 'neutral',
}

@Entity('debts')
export class Debt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  creditor: string;                     // Banco, pessoa, empresa

  @Column({ type: 'varchar', default: DebtType.OTHER })
  type: DebtType;

  @Column({ type: 'varchar', default: DebtNature.NEUTRAL })
  nature: DebtNature;                   // Boa, ruim, neutra

  @Column({ type: 'varchar', default: DebtStatus.ACTIVE })
  status: DebtStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  originalAmount: number;               // Valor original contratado

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentBalance: number;               // Saldo devedor atual

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPaid: number;                    // Total já pago

  @Column({ type: 'decimal', precision: 6, scale: 3, default: 0 })
  interestRate: number;                 // Taxa de juros (% ao mês)

  @Column({ type: 'varchar', default: 'monthly' })
  interestPeriod: string;               // monthly | yearly | daily

  @Column({ type: 'varchar', default: 'fixed' })
  interestType: string;                 // fixed | variable | compound

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;                        // Previsão de quitação

  @Column({ type: 'int', default: 0 })
  totalInstallments: number;

  @Column({ type: 'int', default: 0 })
  paidInstallments: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyPayment: number;              // Parcela mensal

  @Column({ nullable: true })
  nextDueDate: Date;                    // Próximo vencimento

  // ── Garantia ──
  @Column({ nullable: true })
  guaranteeType: string;               // none | real | fidejussoria | aval

  @Column({ type: 'text', nullable: true })
  guaranteeDescription: string;

  // ── Vínculo ──
  @Column({ nullable: true })
  bankAccountId: string;               // Conta bancária vinculada

  @Column({ nullable: true })
  contractNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ── Pagamentos da dívida ──
  @OneToMany(() => DebtPayment, dp => dp.debt, { cascade: true })
  payments: DebtPayment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

@Entity('debt_payments')
export class DebtPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  debtId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;                      // Valor pago

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  principalAmount: number;             // Parte do principal

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  interestAmount: number;              // Parte dos juros

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  method: string;                      // pix, boleto, debito_automatico

  @Column({ nullable: true })
  reference: string;                   // Nº comprovante

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true })
  installmentNumber: number;           // Nº da parcela

  // TypeORM relation (lazy, no eager)
  debt: Debt;

  @CreateDateColumn()
  createdAt: Date;
}
