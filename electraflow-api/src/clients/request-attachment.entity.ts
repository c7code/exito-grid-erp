import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ClientRequest } from './client-request.entity';

@Entity('request_attachments')
export class RequestAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    requestId: string;

    @ManyToOne(() => ClientRequest, (request) => request.attachments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'requestId' })
    request: ClientRequest;

    @Column()
    fileName: string;

    @Column()
    originalName: string;

    @Column()
    mimeType: string;

    @Column({ type: 'bigint' })
    size: number;

    @Column()
    url: string;

    @CreateDateColumn()
    createdAt: Date;
}
