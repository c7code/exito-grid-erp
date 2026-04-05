import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Proposal } from '../proposals/proposal.entity';
import { Client } from '../clients/client.entity';

// ════════════════════════════════════════════════════════════════════
// SIMULATION SESSION — Persistência de simulações financeiras
// ════════════════════════════════════════════════════════════════════
// Permite salvar simulações avulsas (sem proposta) ou vinculadas.
// Complementa proposals.simulationData — que persiste apenas a condição
// selecionada dentro do contexto da proposta.
// ════════════════════════════════════════════════════════════════════

export enum SimulationSessionStatus {
  DRAFT = 'draft',           // Simulação salva mas não vinculada
  LINKED = 'linked',         // Vinculada a uma proposta
  EXPORTED = 'exported',     // Exportada (PDF, WhatsApp, etc)
  ARCHIVED = 'archived',     // Arquivada
}

@Entity('simulation_sessions')
export class SimulationSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Vínculo opcional com proposta ──
  @Column({ nullable: true })
  proposalId: string;

  @ManyToOne(() => Proposal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proposalId' })
  proposal: Proposal;

  // ── Vínculo opcional com cliente ──
  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  // ── Quem simulou ──
  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdByUser: User;

  // ── Dados da simulação ──
  @Column({ nullable: true })
  label: string;                          // Nome/apelido dado pelo operador

  @Column({ type: 'text', nullable: true })
  serviceDescription: string;             // Descrição do serviço simulado

  @Column({ type: 'text', nullable: true })
  inputData: string;                      // JSON do WizardInput completo

  @Column({ type: 'text', nullable: true })
  resultData: string;                     // JSON do SimulatorResult completo (condições, scores...)

  @Column({ nullable: true })
  selectedConditionId: string;            // ID da condição selecionada

  @Column({ nullable: true })
  detectedProfile: string;                // Perfil detectado (auto, low_installment, etc)

  // ── Métricas indexáveis (sem precisar parsear JSON) ──
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  basePrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  selectedTotal: number;                  // totalClient da condição selecionada

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  selectedMargin: number;                 // effectiveMargin da condição selecionada

  @Column({ default: 0 })
  totalConditions: number;

  @Column({ default: 0 })
  viableConditions: number;

  @Column({ default: 0 })
  blockedConditions: number;

  // ── Status ──
  @Column({ type: 'varchar', default: SimulationSessionStatus.DRAFT })
  status: string;

  // ── Audit Trail ──
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
