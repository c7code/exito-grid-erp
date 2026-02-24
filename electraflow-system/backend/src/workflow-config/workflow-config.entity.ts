import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

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

export enum ProcessStage {
  PROJECT = 'project',
  APPROVAL = 'approval',
  PROTOCOL = 'protocol',
  EXECUTION = 'execution',
  INSPECTION = 'inspection',
  DELIVERY = 'delivery',
}

@Entity('workflow_configs')
export class WorkflowConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WorkType,
  })
  workType: WorkType;

  @Column({
    type: 'enum',
    enum: ProcessStage,
  })
  stage: ProcessStage;

  @Column()
  stepName: string;

  @Column({ type: 'int' })
  defaultDeadlineDays: number;

  @Column({ type: 'int', nullable: true })
  minDeadlineDays: number;

  @Column({ type: 'int', nullable: true })
  maxDeadlineDays: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ default: true })
  requiresApproval: boolean;

  @Column({ default: false })
  requiresClientApproval: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true })
  requiredDocuments: string[];

  @Column({ type: 'simple-json', nullable: true })
  checklistItems: string[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
