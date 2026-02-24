import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Client } from '../clients/client.entity';
import { Opportunity } from '../opportunities/opportunity.entity';

export enum LeadSource {
  PORTAL = 'portal',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  INDICATION = 'indication',
  PROSPECTION = 'prospection',
  PHONE = 'phone',
}

export enum LeadStatus {
  NEW = 'new',
  QUALIFYING = 'qualifying',
  QUALIFIED = 'qualified',
  DISQUALIFIED = 'disqualified',
  CONVERTED = 'converted',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  whatsapp: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ type: 'enum', enum: LeadSource, default: LeadSource.PORTAL })
  source: LeadSource;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @Column({ nullable: true })
  serviceType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  estimatedValue: number;

  @Column({ nullable: true })
  assignedToId: string;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client, client => client.leads, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'simple-json', nullable: true })
  metadata: any;

  @Column({ nullable: true })
  convertedAt: Date;

  @Column({ nullable: true })
  lastContactAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Opportunity, opportunity => opportunity.lead)
  opportunity: Opportunity;
}
