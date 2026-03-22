import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../clients/client.entity';

@Entity('payment_receipts')
export class PaymentReceipt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    receiptNumber: string;

    @Column({ nullable: true })
    proposalId: string;

    @Column({ nullable: true })
    clientId: string;

    @ManyToOne(() => Client, { nullable: true })
    @JoinColumn({ name: 'clientId' })
    client: Client;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalProposalValue: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
    percentage: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount: number;

    @Column({ nullable: true })
    paymentMethod: string;

    @Column({ nullable: true })
    paidAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'varchar', default: 'issued' })
    status: string; // draft | issued | cancelled

    @Column({ type: 'text', nullable: true })
    proposalNumber: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
