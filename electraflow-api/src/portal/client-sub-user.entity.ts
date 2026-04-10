import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';

/**
 * Sub-usuário do cliente no portal.
 * O cliente "owner" pode criar sub-contas com perfis restritos.
 * O admin tem autoridade final sobre todos os sub-usuários.
 */

export enum ClientSubUserRole {
  OWNER = 'owner',       // Dono da conta (já é o próprio user do client)
  MANAGER = 'manager',   // Gestor - acesso total delegado pelo dono
  SAFETY = 'safety',     // Segurança do trabalho - docs de funcionários
  VIEWER = 'viewer',     // Somente visualização
}

@Entity('client_sub_users')
export class ClientSubUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', default: 'viewer' })
  role: ClientSubUserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  position: string; // cargo no cliente (ex: "Engenheiro de Segurança")

  @Column({ default: true })
  isActive: boolean;

  // Módulos que este sub-usuário pode acessar (array JSON)
  // Se null, herda do cliente owner
  @Column('simple-json', { nullable: true, default: null })
  allowedModules: string[] | null;

  // Obras específicas que pode ver (array de workIds)
  // Se null, pode ver todas as obras do cliente
  @Column('simple-json', { nullable: true, default: null })
  allowedWorks: string[] | null;

  @Column({ nullable: true })
  createdById: string; // pode ser o user admin ou o client owner

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
