import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
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

    @ManyToOne(() => Work)
    @JoinColumn({ name: 'workId' })
    work: Work;

    @Column()
    number: number;

    @Column({ type: 'enum', enum: MeasurementStatus, default: MeasurementStatus.DRAFT })
    status: MeasurementStatus;

    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

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

    @OneToMany('MeasurementItem', (item: any) => item.measurement, { cascade: true })
    items: MeasurementItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
