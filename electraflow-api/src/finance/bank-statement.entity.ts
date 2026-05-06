import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export enum StatementStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  RECONCILED = 'reconciled',
}

export enum MatchStatus {
  MATCHED = 'matched',
  UNMATCHED = 'unmatched',
  DIVERGENT = 'divergent',
  IGNORED = 'ignored',
}

@Entity('bank_statements')
export class BankStatement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bankAccountId: string;

  @Column({ type: 'varchar' })
  referenceMonth: string;              // YYYY-MM

  @Column({ nullable: true })
  fileName: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCredits: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDebits: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  closingBalance: number;

  @Column({ type: 'int', default: 0 })
  totalEntries: number;

  @Column({ type: 'int', default: 0 })
  matchedEntries: number;

  @Column({ type: 'varchar', default: StatementStatus.PENDING })
  status: StatementStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

@Entity('bank_statement_entries')
export class BankStatementEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  statementId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;                      // Positivo = crédito, Negativo = débito

  @Column({ type: 'varchar', default: 'credit' })
  entryType: string;                   // credit | debit

  @Column({ nullable: true })
  matchedPaymentId: string;            // Payment vinculado (null se não conciliado)

  @Column({ type: 'varchar', default: MatchStatus.UNMATCHED })
  matchStatus: MatchStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  matchDifference: number;             // Diferença entre extrato e lançamento

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  category: string;                    // Classificação automática

  @CreateDateColumn()
  createdAt: Date;
}
