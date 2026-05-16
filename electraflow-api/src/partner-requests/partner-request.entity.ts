import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';

export type RequestCategory = 'fiscal' | 'commercial' | 'technical' | 'support' | 'document_request' | 'other';
export type RequestStatus   = 'open' | 'in_progress' | 'resolved' | 'closed';
export type RequestPriority = 'low' | 'medium' | 'high';
export type MessageSenderType = 'partner' | 'admin' | 'employee';

export interface MessageAttachment {
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
}

// ═══════════════════════════════════════════
// REQUISIÇÃO DO PARCEIRO
// ═══════════════════════════════════════════
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

  @Column({ nullable: true })
  customCategory: string;

  @Column({ default: 'open' })
  status: RequestStatus;

  @Column({ default: 'medium' })
  priority: RequestPriority;

  @Column()
  consultantId: string;

  @Column({ nullable: true })
  consultantName: string;

  @Column({ nullable: true })
  assignedToId: string;

  @Column({ nullable: true })
  assignedToName: string;

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
@Entity('partner_request_messages')
export class PartnerRequestMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nullable: mensagem pode ser só arquivo sem texto
  @Column({ type: 'text', nullable: true, default: '' })
  content: string;

  @Column({ default: 'admin' })
  senderType: MessageSenderType;

  @Column({ nullable: true })
  senderName: string;

  @Column()
  requestId: string;

  // Anexos: imagens, vídeos, documentos (até 5 por mensagem)
  @Column({ type: 'jsonb', nullable: true, default: [] })
  attachments: MessageAttachment[];

  // Soft delete: desabilitar mensagem sem excluir do banco
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @ManyToOne(() => PartnerRequest, (r) => r.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: PartnerRequest;

  @CreateDateColumn()
  createdAt: Date;
}
