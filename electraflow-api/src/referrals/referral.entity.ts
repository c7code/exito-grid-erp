import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';

// ═══════════════════════════════════════════
// 1. CONSULTOR / SDR
// ═══════════════════════════════════════════
export type ConsultantStatus = 'active' | 'inactive' | 'training' | 'idle';

@Entity('referral_consultants')
export class ReferralConsultant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  document: string; // CPF ou CNPJ

  @Column({ default: 'active' })
  status: ConsultantStatus;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  responsibleUserId: string; // FK → users

  @Column({ type: 'int', nullable: true, default: 0 })
  weeklyGoal: number; // meta semanal de indicações

  @Column({ type: 'int', nullable: true, default: 0 })
  monthlyGoal: number; // meta mensal de indicações

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 2.00 })
  commissionPercent: number; // % padrão de comissão

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => ReferralLead, l => l.consultant)
  leads: ReferralLead[];

  @OneToMany(() => ReferralCommitment, c => c.consultant)
  commitments: ReferralCommitment[];

  @OneToMany(() => ReferralFollowup, f => f.consultant)
  followups: ReferralFollowup[];

  @OneToMany(() => ReferralCommission, c => c.consultant)
  commissions: ReferralCommission[];
}

// ═══════════════════════════════════════════
// 2. LEAD INDICADO
// ═══════════════════════════════════════════
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'account_analysis'
  | 'proposal_sent'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'no_profile';

@Entity('referral_leads')
export class ReferralLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  document: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  consultantId: string;

  @ManyToOne(() => ReferralConsultant, c => c.leads, { nullable: true, eager: false })
  @JoinColumn({ name: 'consultantId' })
  consultant: ReferralConsultant;

  @Column({ default: 'new' })
  status: LeadStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  potentialKwp: number; // estimativa de kWp instalado

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  potentialValue: number; // estimativa R$

  @Column({ nullable: true })
  proposalId: string; // FK → proposals (quando virar proposta)

  @Column({ nullable: true })
  clientId: string; // FK → clients (quando virar cliente)

  @Column({ nullable: true })
  lostReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => ReferralFollowup, f => f.lead)
  followups: ReferralFollowup[];

  @OneToMany(() => ReferralCommission, c => c.lead)
  commissions: ReferralCommission[];
}

// ═══════════════════════════════════════════
// 3. COMPROMISSO / META
// ═══════════════════════════════════════════
@Entity('referral_commitments')
export class ReferralCommitment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  consultantId: string;

  @ManyToOne(() => ReferralConsultant, c => c.commitments, { nullable: true })
  @JoinColumn({ name: 'consultantId' })
  consultant: ReferralConsultant;

  @Column({ default: 'monthly' }) // 'weekly' | 'monthly' | 'annual'
  type: string;

  @Column({ type: 'int', default: 0 })
  targetCount: number; // qtd de indicações prometidas

  @Column({ nullable: true })
  periodStart: Date;

  @Column({ nullable: true })
  periodEnd: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ═══════════════════════════════════════════
// 4. ACOMPANHAMENTO / HISTÓRICO
// ═══════════════════════════════════════════
@Entity('referral_followups')
export class ReferralFollowup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  consultantId: string;

  @ManyToOne(() => ReferralConsultant, c => c.followups, { nullable: true })
  @JoinColumn({ name: 'consultantId' })
  consultant: ReferralConsultant;

  @Column({ nullable: true })
  leadId: string;

  @ManyToOne(() => ReferralLead, l => l.followups, { nullable: true })
  @JoinColumn({ name: 'leadId' })
  lead: ReferralLead;

  @Column({ default: 'internal_note' }) // 'call' | 'meeting' | 'whatsapp' | 'email' | 'visit' | 'internal_note'
  type: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  outcome: string;

  @Column({ nullable: true })
  nextActionDate: Date;

  @Column({ nullable: true })
  nextActionDescription: string;

  @Column({ nullable: true })
  createdById: string; // FK → users

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ═══════════════════════════════════════════
// 5. COMISSÃO
// ═══════════════════════════════════════════
export type CommissionStatus = 'pending' | 'approved' | 'paid';

@Entity('referral_commissions')
export class ReferralCommission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  consultantId: string;

  @ManyToOne(() => ReferralConsultant, c => c.commissions, { nullable: true })
  @JoinColumn({ name: 'consultantId' })
  consultant: ReferralConsultant;

  @Column({ nullable: true })
  leadId: string;

  @ManyToOne(() => ReferralLead, l => l.commissions, { nullable: true })
  @JoinColumn({ name: 'leadId' })
  lead: ReferralLead;

  @Column({ nullable: true })
  proposalId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  saleValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  commissionPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  commissionValue: number;

  @Column({ default: 'pending' })
  status: CommissionStatus;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  paidBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
