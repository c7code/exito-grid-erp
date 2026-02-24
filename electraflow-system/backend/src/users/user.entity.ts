import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Work } from '../works/work.entity';
import { Task } from '../tasks/task.entity';
import { DeadlineApproval } from '../deadline-approvals/deadline-approval.entity';

export enum UserRole {
  ADMIN = 'admin',
  COMMERCIAL = 'commercial',
  ENGINEER = 'engineer',
  FINANCE = 'finance',
  VIEWER = 'viewer',
  EMPLOYEE = 'employee',
  CLIENT = 'client',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  avatarUrl: string; // compatibility with API

  @Column({ default: true })
  isActive: boolean; // compatibility with API

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @OneToMany(() => Work, (work) => work.responsible)
  works: Work[];

  @OneToMany(() => Task, (task) => task.assignedTo)
  tasks: Task[];

  @OneToMany(() => DeadlineApproval, (approval) => approval.requestedBy)
  deadlineRequests: DeadlineApproval[];

  @OneToMany(() => DeadlineApproval, (approval) => approval.approvedBy)
  deadlineApprovals: DeadlineApproval[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
