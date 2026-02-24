import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Client } from './client.entity';
import { Work } from '../works/work.entity';
import { RequestAttachment } from './request-attachment.entity';

export enum RequestType {
    INFORMATION = 'information',
    SERVICE = 'service',
    COMPLAINT = 'complaint',
    APPROVAL = 'approval',
    OTHER = 'other',
}

export enum RequestStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

export enum RequestPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

@Entity('client_requests')
export class ClientRequest {
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

    @Column({ type: 'enum', enum: RequestType, default: RequestType.INFORMATION })
    type: RequestType;

    @Column()
    subject: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.OPEN })
    status: RequestStatus;

    @Column({ type: 'enum', enum: RequestPriority, default: RequestPriority.MEDIUM })
    priority: RequestPriority;

    @Column({ type: 'text', nullable: true })
    adminResponse: string;

    @Column({ nullable: true })
    respondedAt: Date;

    @Column({ nullable: true })
    respondedBy: string;

    @OneToMany(() => RequestAttachment, (attachment) => attachment.request, { cascade: true, eager: true })
    attachments: RequestAttachment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
