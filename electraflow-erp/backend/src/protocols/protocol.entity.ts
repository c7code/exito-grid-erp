import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProtocolEvent } from './protocol-event.entity';
import { Work } from '../works/work.entity';
import { Client } from '../clients/client.entity';
import { Task } from '../tasks/task.entity';

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

  @Column({ unique: true })
  code: string;

  @Column({ type: 'uuid', nullable: true })
  workId: string;

  @ManyToOne(() => Work)
  @JoinColumn({ name: 'workId' })
  work: Work;

  @Column({ type: 'uuid', nullable: true })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'uuid', nullable: true })
  taskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  utilityCompany: string;

  @Column({
    type: 'enum',
    enum: ProtocolStatus,
    default: ProtocolStatus.PENDING,
  })
  status: ProtocolStatus;

  @Column({ type: 'date' })
  submissionDate: Date;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date;

  @Column({ type: 'int', nullable: true })
  slaDays: number;

  @Column({ nullable: true })
  protocolNumber: string; // compatibility with API

  @Column({ nullable: true })
  concessionaria: string; // compatibility with API

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  openedAt: Date; // compatibility with API (mapped to submissionDate)

  @Column({ nullable: true })
  respondedAt: Date;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ type: 'text', nullable: true })
  requirementDescription: string;

  @Column({ nullable: true })
  requirementDeadline: Date;

  @Column({ type: 'int', nullable: true })
  remainingDays: number;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  priority: string;

  @OneToMany(() => ProtocolEvent, (event) => event.protocol)
  events: ProtocolEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
