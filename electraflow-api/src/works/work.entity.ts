import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { Client } from '../clients/client.entity';
import { Opportunity } from '../opportunities/opportunity.entity';
import { Process } from '../processes/process.entity';
import { Document } from '../documents/document.entity';
import { WorkUpdate } from './work-update.entity';
import { Task } from '../tasks/task.entity';

export enum WorkType {
  PDE = 'pde',
  PDE_BT = 'pde_bt',
  PDE_AT = 'pde_at',
  PROJECT_BT = 'project_bt',
  PROJECT_MT = 'project_mt',
  PROJECT_AT = 'project_at',
  SOLAR = 'solar',
  DONATION = 'donation',
  NETWORK_DONATION = 'network_donation',
  NETWORK_WORK = 'network_work',
  ADEQUACY = 'adequacy',
  SPDA = 'spda',
  GROUNDING = 'grounding',
  MAINTENANCE = 'maintenance',
  REPORT = 'report',
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
}

export enum WorkStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  WAITING_UTILITY = 'waiting_utility',
  WAITING_CLIENT = 'waiting_client',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ProcessStage {
  PROJECT = 'project',
  APPROVAL = 'approval',
  PROTOCOL = 'protocol',
  EXECUTION = 'execution',
  INSPECTION = 'inspection',
  DELIVERY = 'delivery',
}

@Entity('works')
export class Work {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true })
  code: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: WorkType })
  type: WorkType;

  @Column({ type: 'enum', enum: WorkStatus, default: WorkStatus.PENDING })
  status: WorkStatus;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client, client => client.works)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  opportunityId: string;

  @OneToOne(() => Opportunity, opp => opp.work)
  @JoinColumn({ name: 'opportunityId' })
  opportunity: Opportunity;

  @Column({ nullable: true })
  assignedEngineerId: string;

  @Column({ nullable: true })
  assignedDesignerId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cost: number;

  @Column({
    type: 'enum',
    enum: WorkPriority,
    default: WorkPriority.MEDIUM,
  })
  priority: WorkPriority;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date; // mapped to actualEndDate in system

  @Column({ nullable: true })
  expectedEndDate: Date;

  @Column({ nullable: true })
  actualEndDate: Date;

  @Column({ nullable: true })
  deadline: Date;

  @Column({
    type: 'enum',
    enum: ProcessStage,
    default: ProcessStage.PROJECT,
  })
  currentStage: ProcessStage;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

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
  responsibleId: string; // ERP/System compatibility

  @Column({ nullable: true })
  protocolNumber: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 0 })
  progress: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Process, process => process.work)
  process: Process;

  @OneToMany(() => Document, doc => doc.work)
  documents: Document[];

  @OneToMany(() => WorkUpdate, update => update.work)
  updates: WorkUpdate[];

  @OneToMany(() => Task, task => task.work)
  tasks: Task[];
}
