import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { Lead } from '../leads/lead.entity';
import { Client } from '../clients/client.entity';
import { Work } from '../works/work.entity';
import { Proposal } from '../proposals/proposal.entity';

export enum OpportunityStage {
  LEAD_NEW = 'lead_new',
  QUALIFICATION = 'qualification',
  VISIT = 'visit',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  EXECUTION = 'execution',
  COMPLETED = 'completed',
}

@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: OpportunityStage, default: OpportunityStage.LEAD_NEW })
  stage: OpportunityStage;

  @Column({ nullable: true })
  leadId: string;

  @OneToOne(() => Lead, lead => lead.opportunity)
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  assignedToId: string;

  @Column({ nullable: true })
  serviceType: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  actualValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  probability: number;

  @Column({ nullable: true })
  expectedCloseDate: Date;

  @Column({ nullable: true })
  actualCloseDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  lossReason: string;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringValue: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Proposal, proposal => proposal.opportunity)
  proposals: Proposal[];

  @OneToOne(() => Work, work => work.opportunity)
  work: Work;
}
