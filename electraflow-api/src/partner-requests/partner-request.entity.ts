import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';

// ═══════════════════════════════════════════
// REQUISIÇÃO DO PARCEIRO
// ═══════════════════════════════════════════
export type RequestCategory = 'fiscal' | 'commercial' | 'technical' | 'support' | 'other';
export type RequestStatus   = 'open' | 'in_progress' | 'resolved' | 'closed';
export type RequestPriority = 'low' | 'medium' | 'high';

@Entity('partner_requests')
export class PartnerRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'other' })
  category: RequestCategory;

  @Column({ default: 'open' })
  status: RequestStatus;

  @Column({ default: 'medium' })
  priority: RequestPriority;

  // Consultor (parceiro) que abriu o chamado
  @Column()
  consultantId: string;

  @Column({ nullable: true })
  consultantName: string;

  // Admin/Employee responsável (atribuído ao atender)
  @Column({ nullable: true })
  assignedToId: string;

  @Column({ nullable: true })
  assignedToName: string;

  // Mensagens da thread
  @OneToMany(() => PartnerRequestMessage, (m) => m.request, { cascade: true })
  messages: PartnerRequestMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

// ═══════════════════════════════════════════
// MENSAGEM DA THREAD
// ═══════════════════════════════════════════
export type MessageSenderType = 'partner' | 'admin' | 'employee';

@Entity('partner_request_messages')
export class PartnerRequestMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'admin' })
  senderType: MessageSenderType;

  @Column({ nullable: true })
  senderName: string;

  @Column()
  requestId: string;

  @ManyToOne(() => PartnerRequest, (r) => r.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: PartnerRequest;

  @CreateDateColumn()
  createdAt: Date;
}
