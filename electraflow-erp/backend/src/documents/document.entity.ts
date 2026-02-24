import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DocumentType {
  PROJECT = 'project',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  REPORT = 'report',
  PHOTO = 'photo',
  CERTIFICATE = 'certificate',
  PROTOCOL = 'protocol',
  OTHER = 'other',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  originalName: string;

  @Column()
  filePath: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  type: DocumentType;

  @Column({ type: 'uuid', nullable: true })
  workId: string;

  @Column({ type: 'uuid' })
  uploadedById: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ nullable: true })
  fileName: string; // compatibility with API

  @Column({ nullable: true })
  url: string; // compatibility with API

  @Column({ nullable: true })
  taskId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
