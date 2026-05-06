import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DailyLogRequest } from './daily-log-request.entity';
import { User } from '../users/user.entity';

@Entity('daily_log_responses')
export class DailyLogResponse {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    requestId: string;

    @ManyToOne(() => DailyLogRequest, r => r.responses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'requestId' })
    request: DailyLogRequest;

    @Column({ type: 'varchar', length: 100 })
    respondedBy: string;

    @Column({ type: 'date' })
    responseDate: Date;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    attachmentUrl: string;

    @Column({ nullable: true })
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
