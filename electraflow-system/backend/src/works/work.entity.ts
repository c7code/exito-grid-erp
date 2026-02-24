import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Document } from '../documents/document.entity';
import { WorkType, ProcessStage } from '../workflow-config/workflow-config.entity';

export enum WorkStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('works')
export class Work {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WorkType,
  })
  type: WorkType;

  @Column({
    type: 'enum',
    enum: WorkStatus,
    default: WorkStatus.DRAFT,
  })
  status: WorkStatus;

  @Column({
    type: 'enum',
    enum: WorkPriority,
    default: WorkPriority.MEDIUM,
  })
  priority: WorkPriority;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalValue: number;

  @ManyToOne(() => Client, (client) => client.works)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => User, (user) => user.works)
  @JoinColumn({ name: 'responsibleId' })
  responsible: User;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedEndDate: Date;

  @Column({ nullable: true })
  actualEndDate: Date;

  @Column({ nullable: true })
  endDate: Date; // mapped to actualEndDate in system

  @Column({ nullable: true })
  deadline: Date;

  @Column({
    type: 'enum',
    enum: ProcessStage,
    default: ProcessStage.PROJECT,
  })
  currentStage: ProcessStage;

  @Column({ type: 'simple-json', nullable: true })
  technicalData: {
    voltage?: string;
    power?: number;
    consumption?: number;
    units?: number;
    area?: number;
    location?: string;
    notes?: string;
  };

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  concessionaria: string;

  @Column({ nullable: true })
  protocolNumber: string;

  @Column({ nullable: true })
  opportunityId: string;

  @Column({ nullable: true })
  assignedEngineerId: string;

  @Column({ nullable: true })
  assignedDesignerId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Task, (task) => task.work)
  tasks: Task[];

  @OneToMany(() => Document, (doc) => doc.work)
  documents: Document[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
