import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';

export enum ClientDocumentType {
    CONTRACT = 'contract',
    IDENTIFICATION = 'id',
    PROJECT = 'project',
    OTHER = 'other',
}

@Entity('client_documents')
export class ClientDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    clientId: string;

    @ManyToOne('Client', 'documents', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clientId' })
    client: Client;

    @Column()
    name: string;

    @Column({
        type: 'text',
        default: ClientDocumentType.OTHER,
    })
    type: ClientDocumentType;

    @Column()
    url: string;

    @Column({ nullable: true })
    issueDate: Date;

    @Column({ nullable: true })
    expiryDate: Date;

    @CreateDateColumn()
    createdAt: Date;
}
