import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import { Work } from '../works/work.entity';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ApprovalType {
  EMPLOYEE_DEADLINE = 'employee_deadline',
  STAGE_TRANSITION = 'stage_transition',
  CLIENT_REVIEW = 'client_review',
}

@Entity('deadline_approvals')
export class DeadlineApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ApprovalType,
  })
  type: ApprovalType;

  @ManyToOne(() => Task, (task) => task.deadlineApprovals)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => Work, { nullable: true })
  @JoinColumn({ name: 'workId' })
  work: Work;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ type: 'date', nullable: true })
  proposedStartDate: Date;

  @Column({ type: 'date', nullable: true })
  proposedEndDate: Date;

  @Column({ type: 'int', nullable: true })
  proposedDeadlineDays: number;

  @Column({ type: 'text', nullable: true })
  justification: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ type: 'date', nullable: true })
  adminApprovedAt: Date;

  @Column({ type: 'date', nullable: true })
  clientApprovedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  clientId: string;

  @Column({ type: 'text', nullable: true })
  clientNotes: string;

  @Column({ type: 'simple-json', nullable: true })
  documents: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
