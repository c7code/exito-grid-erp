import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';

// ═══════════════════════════════════════════
// 0. DOCUMENTO GERAL (BROADCAST)
// ═══════════════════════════════════════════
export type BroadcastChannel = 'all' | 'solar' | 'oem' | 'equipment';

@Entity('broadcast_documents')
export class BroadcastDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'int', nullable: true })
  size: number;

  @Column()
  url: string;

  // 'all' = todos os indicadores | 'solar' | 'oem' | 'equipment' = filtro por canal
  @Column({ default: 'all' })
  targetChannel: BroadcastChannel;

  @Column({ nullable: true })
  uploadedBy: string;

  @Column({ default: 'admin' })
  uploadedByRole: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}


// ═══════════════════════════════════════════
// 1. CONSULTOR / SDR
// ═══════════════════════════════════════════
export type ConsultantStatus = 'active' | 'inactive' | 'training' | 'idle';
export type AccessChannel = 'solar' | 'oem' | 'equipment' | 'all';

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
  whatsapp: string;

  @Column({ nullable: true })
  document: string; // CPF ou CNPJ

  @Column({ default: 'active' })
  status: ConsultantStatus;

  // ─── Endereço ───────────────────────────────
  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  region: string;

  // ─── Comercial ──────────────────────────────
  @Column({ nullable: true })
  responsibleUserId: string; // FK → users

  @Column({ type: 'int', nullable: true, default: 0 })
  weeklyGoal: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  monthlyGoal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 2.00 })
  commissionPercent: number;

  @Column({ nullable: true, default: 'all' })
  accessChannel: AccessChannel;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  pixKey: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ─── Portal de Acesso ────────────────────────
  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column({ nullable: true, default: false })
  isPortalActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // ─── Timestamps ─────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // ─── Relations ──────────────────────────────
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
  potentialKwp: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  potentialValue: number;

  @Column({ nullable: true })
  proposalId: string; // FK → proposals

  @Column({ nullable: true })
  clientId: string; // FK → clients

  @Column({ nullable: true })
  lostReason: string;

  // ═ Serviços de interesse (lista de tags) ═
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  services: string[];

  // ═ Localização complementar ═
  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  neighborhood: string;

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

  @OneToMany(() => LeadDocument, d => d.lead)
  documents: LeadDocument[];
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

  @Column({ default: 'monthly' })
  type: string;

  @Column({ type: 'int', default: 0 })
  targetCount: number;

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
// 6. DOCUMENTO DO LEAD (canal de documentos)
// ═══════════════════════════════════════════
export type LeadDocVisibility = 'public' | 'private';
export type LeadDocSenderRole = 'consultant' | 'admin' | 'team';
export type LeadDocType = 'upload' | 'share';

@Entity('lead_documents')
export class LeadDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  leadId: string;

  @ManyToOne(() => ReferralLead, l => l.documents, { nullable: false })
  @JoinColumn({ name: 'leadId' })
  lead: ReferralLead;

  // ─ Arquivo ─────────────────────────────────────────────────────────
  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'int', nullable: true })
  size: number;

  @Column()
  url: string;

  // ─ Metadados ────────────────────────────────────────────────────────
  @Column({ default: 'upload' })
  docType: LeadDocType;

  // 'public' = visível para todos no lead | 'private' = só para targetConsultantId
  @Column({ default: 'public' })
  visibility: LeadDocVisibility;

  @Column({ nullable: true })
  targetConsultantId: string;

  @Column({ nullable: true })
  uploadedBy: string;

  @Column({ default: 'consultant' })
  uploadedByRole: LeadDocSenderRole;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
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

  @Column({ default: 'internal_note' })
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
  createdById: string;

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
