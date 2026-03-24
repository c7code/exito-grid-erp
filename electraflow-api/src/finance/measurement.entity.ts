import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Work } from '../works/work.entity';
import { MeasurementItem } from './measurement-item.entity';

export enum MeasurementStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    APPROVED = 'approved',
    BILLED = 'billed',
    PAID = 'paid',
}

@Entity('measurements')
export class Measurement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    workId: string;

    @ManyToOne(() => Work, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workId' })
    work: Work;

    @Column()
    number: number;

    @Column({ type: 'varchar', default: MeasurementStatus.DRAFT })
    status: MeasurementStatus;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

    // ═══ Valor do Contrato e Faturamento Direto ═══

    /** Valor total do contrato (ex: R$ 100.000) */
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    contractValue: number;

    /** Total de faturamento direto (materiais debitados) */
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    directBillingTotal: number;

    /** Saldo base = contractValue - directBillingTotal */
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    baseValue: number;

    /** Percentual executado nesta medição (0-100) */
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    executedPercentage: number;

    /** Percentual acumulado de todas as medições (0-100) */
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    accumulatedPercentage: number;

    /** Itens de faturamento direto (fornecedor, CNPJ, material, qtd, preço, total) */
    @Column({ type: 'text', nullable: true })
    directBillingItems: string;

    // ═══ Totais ═══

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalAmount: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    retentionAmount: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    taxAmount: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    netAmount: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    // ═══ Vínculos opcionais ═══

    @Column({ nullable: true })
    proposalId: string;

    @Column({ nullable: true })
    contractId: string;

    @OneToMany('MeasurementItem', (item: any) => item.measurement, { cascade: true })
    items: MeasurementItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
