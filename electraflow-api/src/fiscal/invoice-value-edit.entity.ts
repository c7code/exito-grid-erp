import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

/**
 * Log de auditoria para alterações de valor em notas fiscais.
 * Cada registro representa uma edição de valor feita por um usuário.
 */
@Entity('fiscal_invoice_value_edits')
export class InvoiceValueEdit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    invoiceId: string;

    @ManyToOne('FiscalInvoice', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'invoiceId' })
    invoice: any;

    @Column({ nullable: true })
    userId: string;

    @Column({ nullable: true })
    userName: string;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    previousValue: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    newValue: number;

    @Column({ type: 'text', nullable: true })
    reason: string;

    @CreateDateColumn()
    createdAt: Date;
}
