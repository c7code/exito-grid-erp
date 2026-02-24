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
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';

export enum DocumentType {
  PROJECT = 'project',
  REPORT = 'report',
  ART = 'art',
  MEMORIAL = 'memorial',
  PHOTO = 'photo',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  CERTIFICATE = 'certificate',
  PROTOCOL = 'protocol',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
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

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Work, (work) => work.documents, { nullable: true })
  @JoinColumn({ name: 'workId' })
  work: Work;

  @ManyToOne(() => Task, (task) => task.documents, { nullable: true })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column({ type: 'uuid', nullable: true })
  folderId: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };

  @Column({ type: 'simple-json', nullable: true })
  versions: {
    id: string;
    filePath: string;
    size: number;
    createdAt: Date;
    createdBy: string;
  }[];

  @Column({ nullable: true })
  url: string; // compatibility with API

  @Column({ nullable: true })
  fileName: string; // compatibility with API

  @Column({ nullable: true })
  clientId: string;

  @Column({ nullable: true })
  proposalId: string;

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  previousVersionId: string;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
