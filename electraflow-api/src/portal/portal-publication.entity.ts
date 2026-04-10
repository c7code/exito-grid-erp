import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../clients/client.entity';
import { Work } from '../works/work.entity';
import { User } from '../users/user.entity';

export enum PortalContentType {
  PROPOSAL = 'proposal',
  CONTRACT = 'contract',
  RECEIPT = 'receipt',
  MEASUREMENT = 'measurement',
  SERVICE_ORDER = 'service_order',
  DOCUMENT = 'document',
  EMPLOYEE_DOC = 'employee_doc',
  FINANCIAL = 'financial',
}

@Entity('portal_publications')
export class PortalPublication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @ManyToOne(() => Client, { nullable: false })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  workId: string;

  @ManyToOne(() => Work, { nullable: true })
  @JoinColumn({ name: 'workId' })
  work: Work;

  @Column({ type: 'varchar', length: 50 })
  contentType: string;

  @Column()
  contentId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  publishedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'publishedById' })
  publishedBy: User;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  publishedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
