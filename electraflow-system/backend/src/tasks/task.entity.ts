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
import { Work } from '../works/work.entity';
import { User } from '../users/user.entity';
import { Document } from '../documents/document.entity';
import { DeadlineApproval } from '../deadline-approvals/deadline-approval.entity';

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

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
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

  @ManyToOne(() => Work, (work) => work.tasks)
  @JoinColumn({ name: 'workId' })
  work: Work;

  @ManyToOne(() => User, (user) => user.tasks)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

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

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'int', nullable: true })
  actualHours: number;

  @Column({ type: 'simple-json', nullable: true })
  checklist: {
    id: string;
    text: string;
    completed: boolean;
    completedAt?: Date;
  }[];

  @Column({ type: 'enum', enum: TaskType, default: TaskType.INTERNAL })
  type: TaskType;

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
  completedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'completedById' })
  completedBy: User;

  @Column({ type: 'text', nullable: true })
  result: string;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurrenceRule: string;

  @Column({ default: false })
  requiresApproval: boolean;

  @Column({ default: false })
  requiresClientApproval: boolean;

  @Column({ type: 'uuid', nullable: true })
  parentTaskId: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => Document, (doc) => doc.task)
  documents: Document[];

  @OneToMany(() => DeadlineApproval, (approval) => approval.task)
  deadlineApprovals: DeadlineApproval[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
