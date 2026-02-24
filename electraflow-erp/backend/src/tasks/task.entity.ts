import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Work } from '../works/work.entity';
import { User } from '../users/user.entity';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  CLIENT_REVIEW = 'client_review',
  CLIENT_APPROVED = 'client_approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskType {
  CALL = 'call',
  EMAIL = 'email',
  VISIT = 'visit',
  DOCUMENT = 'document',
  FOLLOW_UP = 'follow_up',
  INTERNAL = 'internal',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TaskType, default: TaskType.INTERNAL })
  type: TaskType;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ default: 0 })
  progress: number;

  @Column({ nullable: true })
  workId: string;

  @ManyToOne(() => Work, (work) => work.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workId' })
  work: Work;

  @Column({ nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, (user) => user.tasks)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  relatedToType: string;

  @Column({ nullable: true })
  relatedToId: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  completedById: string;

  @Column({ type: 'text', nullable: true })
  result: string;

  @Column({ type: 'decimal', precision: 6, scale: 1, nullable: true })
  estimatedHours: number;

  @Column({ type: 'decimal', precision: 6, scale: 1, nullable: true })
  actualHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  weightPercentage: number;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurrenceRule: string;

  @Column({ type: 'simple-json', nullable: true })
  checklist: {
    id: string;
    text: string;
    completed: boolean;
    completedAt?: Date;
  }[];

  @Column({ default: false })
  requiresApproval: boolean;

  @Column({ default: false })
  requiresClientApproval: boolean;

  @Column({ type: 'uuid', nullable: true })
  parentTaskId: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
