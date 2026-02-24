import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProtocolEvent } from './protocol-event.entity';

@Entity('protocol_attachments')
export class ProtocolAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    url: string;

    @Column({ nullable: true })
    mimeType: string;

    @Column({ nullable: true })
    size: number;

    @Column({ type: 'uuid' })
    eventId: string;

    @ManyToOne(() => ProtocolEvent, (event) => event.attachments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event: ProtocolEvent;

    @CreateDateColumn()
    createdAt: Date;
}
