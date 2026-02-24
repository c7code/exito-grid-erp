import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Protocol } from './protocol.entity';

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
