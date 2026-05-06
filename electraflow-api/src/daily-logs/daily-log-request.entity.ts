import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Work } from '../works/work.entity';
import { User } from '../users/user.entity';
import { DailyLog } from './daily-log.entity';

@Entity('daily_log_requests')
export class DailyLogRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    workId: string;

    @ManyToOne(() => Work, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workId' })
    work: Work;

    @Column({ nullable: true })
    dailyLogId: string;

    @ManyToOne(() => DailyLog, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'dailyLogId' })
    dailyLog: DailyLog;

    @Column({ nullable: true })
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    @Column()
    subject: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 100 })
    requestedTo: string; // nome/cargo da pessoa

    @Column({ type: 'varchar', length: 255, nullable: true })
    requestedToEmail: string;

    @Column({ type: 'varchar', length: 50, default: 'tecnica' })
    category: string; // tecnica, material, aprovacao, financeira, documentacao, outro

    @Column({ type: 'varchar', length: 20, default: 'normal' })
    priority: string; // normal, urgent, critical

    @Column({ type: 'varchar', length: 20, default: 'pending' })
    status: string; // pending, answered, resolved, cancelled

    @Column({ type: 'date' })
    requestDate: Date;

    @Column({ type: 'date', nullable: true })
    resolvedDate: Date;

    @Column({ type: 'int', nullable: true })
    responseTimeDays: number; // auto-calculated

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    // Virtual: responses loaded via relation
    @OneToMany('DailyLogResponse', 'request', { cascade: true })
    responses: any[];
}
