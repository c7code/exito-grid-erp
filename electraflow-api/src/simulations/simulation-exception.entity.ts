import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { SimulationSession } from './simulation-session.entity';

// ════════════════════════════════════════════════════════════════════
// SIMULATION EXCEPTION — Exceções e aprovações de condições fora da regra
// ════════════════════════════════════════════════════════════════════
// Registra quando um operador seleciona uma condição que viola regras
// de negócio (ex: margem abaixo do mínimo, caixa não coberto).
// Permite justificativa, aprovação e rastreabilidade completa.
// ════════════════════════════════════════════════════════════════════

export enum ExceptionType {
  CASH_GAP = 'cash_gap',               // Meta de caixa não coberta
  BELOW_MIN_MARGIN = 'below_min_margin', // Margem abaixo do mínimo
  HIGH_RISK = 'high_risk',             // Risco acima do limite
  EXCESSIVE_TERM = 'excessive_term',   // Prazo excessivo
  CAPACITY_EXCEEDED = 'capacity_exceeded', // Parcela acima da capacidade
  BLOCKED_OVERRIDE = 'blocked_override',   // Override de condição bloqueada
  OTHER = 'other',                     // Outros
}

export enum ExceptionStatus {
  PENDING = 'pending',       // Aguardando aprovação
  APPROVED = 'approved',     // Aprovada
  REJECTED = 'rejected',     // Rejeitada
  EXPIRED = 'expired',       // Expirou sem aprovação
}

@Entity('simulation_exceptions')
export class SimulationException {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Vínculo com sessão de simulação ──
  @Column({ nullable: true })
  sessionId: string;

  @ManyToOne(() => SimulationSession, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sessionId' })
  session: SimulationSession;

  // ── Tipo e status ──
  @Column({ type: 'varchar', default: ExceptionType.OTHER })
  exceptionType: string;

  @Column({ type: 'varchar', default: ExceptionStatus.PENDING })
  status: string;

  // ── Condição selecionada (dados no momento da exceção) ──
  @Column({ nullable: true })
  conditionId: string;

  @Column({ type: 'text', nullable: true })
  conditionSnapshot: string;   // JSON da EvaluatedCondition completa

  @Column({ nullable: true })
  conditionLabel: string;      // Nome legível (ex: "Personalizado 18x")

  // ── Valores-chave no momento da exceção (indexáveis) ──
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  marginAtException: number;       // Margem efetiva no momento

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  minMarginRequired: number;       // Margem mínima configurada

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  cashGapAmount: number;           // Gap de caixa (se aplicável)

  @Column({ type: 'integer', nullable: true })
  riskScoreAtException: number;    // Risk score no momento

  // ── Solicitante ──
  @Column({ nullable: true })
  requestedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @Column({ type: 'text', nullable: true })
  justification: string;          // Motivo do operador para a exceção

  // ── Aprovador ──
  @Column({ nullable: true })
  approvedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ type: 'text', nullable: true })
  approvalNote: string;           // Observação do aprovador

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  // ── Timestamps ──
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
