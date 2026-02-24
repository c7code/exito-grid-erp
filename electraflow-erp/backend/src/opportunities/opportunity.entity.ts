import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({
    type: 'enum',
    enum: OpportunityStage,
    default: OpportunityStage.LEAD_NEW,
  })
  stage: OpportunityStage;

  @Column({ nullable: true })
  leadId: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ nullable: true })
  assignedToId: string;

  @Column({ nullable: true })
  responsibleId: string; // Keep for legacy ERP compatibility

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
}
