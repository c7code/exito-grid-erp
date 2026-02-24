import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Work } from '../works/work.entity';
import { Client } from '../clients/client.entity';
import { Task } from '../tasks/task.entity';

export enum ProtocolStatus {
    OPEN = 'open',
    PENDING = 'pending',
    IN_ANALYSIS = 'in_analysis',
    REQUIREMENT = 'requirement',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
    CLOSED = 'closed',
}

@Entity('protocols')
export class Protocol {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    protocolNumber: string;

    @Column({ nullable: true, unique: true })
    code: string;

    @Column({ nullable: true })
    utilityCompany: string;

    @Column({ nullable: true })
    submissionDate: Date;

    @Column({ nullable: true })
    expirationDate: Date;

    @Column({ nullable: true })
    workId: string;

    @ManyToOne(() => Work)
    @JoinColumn({ name: 'workId' })
    work: Work;

    @Column({ nullable: true })
    clientId: string;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'clientId' })
    client: Client;

    @Column({ nullable: true })
    taskId: string;

    @ManyToOne(() => Task)
    @JoinColumn({ name: 'taskId' })
    task: Task;

    @Column({ nullable: true })
    concessionaria: string;

    @Column({ type: 'enum', enum: ProtocolStatus, default: ProtocolStatus.OPEN })
    status: ProtocolStatus;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    slaDays: number;

    @Column({ nullable: true })
    openedAt: Date;

    @Column({ nullable: true })
    respondedAt: Date;

    @Column({ nullable: true })
    closedAt: Date;

    @Column({ type: 'text', nullable: true })
    requirementDescription: string;

    @Column({ nullable: true })
    requirementDeadline: Date;

    @Column({ nullable: true })
    remainingDays: number;

    @Column({ nullable: true })
    type: string;

    @Column({ nullable: true })
    priority: string;

    @OneToMany(() => ProtocolEvent, (event) => event.protocol)
    events: ProtocolEvent[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

export enum ProtocolEventType {
    STATUS_CHANGE = 'status_change',
    COMMENT = 'comment',
    DOCUMENT_ATTACHED = 'document_attached',
    EXTERNAL_UPDATE = 'external_update',
    SLA_WARNING = 'sla_warning',
    REQUIREMENT_RECEIVED = 'requirement_received',
}

@Entity('protocol_events')
export class ProtocolEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    protocolId: string;

    @ManyToOne(() => Protocol, (protocol) => protocol.events, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'protocolId' })
    protocol: Protocol;

    @Column({
        type: 'enum',
        enum: ProtocolEventType,
        default: ProtocolEventType.COMMENT,
    })
    type: ProtocolEventType;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'simple-json', nullable: true })
    metadata: any;

    @Column({ type: 'uuid', nullable: true })
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
