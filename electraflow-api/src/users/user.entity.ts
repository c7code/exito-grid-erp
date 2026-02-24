import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

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

// Módulos disponíveis no sistema
export const AVAILABLE_MODULES = [
  'dashboard',
  'pipeline',
  'works',
  'tasks',
  'proposals',
  'protocols',
  'documents',
  'employees',
  'users',
  'clients',
  'finance',
  'finance-simulator',
  'catalog',
  'suppliers',
  'quotations',
  'price-history',
  'fiscal',
  'compliance',
  'client-requests',
  'settings',
] as const;

export type ModulePermission = typeof AVAILABLE_MODULES[number];

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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  avatar: string; // compatibility with system/erp

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  // === Permissões granulares por módulo ===
  @Column('simple-json', { nullable: true, default: '[]' })
  permissions: string[];

  // === Hierarquia de supervisão ===
  @Column({ nullable: true })
  supervisorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'supervisorId' })
  supervisor: User;

  // === Controle de convite ===
  @Column({ nullable: true })
  invitedAt: Date;

  @Column({ nullable: true })
  invitedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
