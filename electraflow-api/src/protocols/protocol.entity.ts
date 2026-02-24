import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Work } from '../works/work.entity';
import { Client } from '../clients/client.entity';
import { Task } from '../tasks/task.entity';
import { ProtocolEvent } from './protocol-event.entity';

export enum ProtocolStatus {
  OPEN = 'open',
  PENDING = 'pending',
  IN_ANALYSIS = 'in_analysis',
  REQUIREMENT = 'requirement',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CLOSED = 'closed',
}

@Entity('protocols')
export class Protocol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  protocolNumber: string;

  @Column({ nullable: true, unique: true })
  code: string; // compatibility with ERP

  @Column({ nullable: true })
  utilityCompany: string; // compatibility with ERP

  @Column({ nullable: true })
  submissionDate: Date; // compatibility with ERP (mapped to openedAt)

  @Column({ nullable: true })
  expirationDate: Date;

  @Column({ nullable: true })
  remainingDays: number;

  @Column({ nullable: true })
  workId: string;

  @ManyToOne(() => Work)
  @JoinColumn({ name: 'workId' })
  work: Work;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  taskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  concessionaria: string;

  @Column({ type: 'enum', enum: ProtocolStatus, default: ProtocolStatus.OPEN })
  status: ProtocolStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  slaDays: number;

  @Column({ nullable: true })
  openedAt: Date;

  @Column({ nullable: true })
  respondedAt: Date;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ type: 'text', nullable: true })
  requirementDescription: string;

  @Column({ nullable: true })
  requirementDeadline: Date;

  @Column({ nullable: true })
  type: string; // e.g., 'utility', 'municipal', 'environmental'

  @Column({ nullable: true })
  priority: string; // e.g., 'low', 'medium', 'high', 'critical'

  @OneToMany(() => ProtocolEvent, (event) => event.protocol)
  events: ProtocolEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
