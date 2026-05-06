import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Work } from './work.entity';

@Entity('work_phases')
export class WorkPhase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    workId: string;

    @ManyToOne(() => Work, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workId' })
    work: Work;

    @Column()
    title: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    weight: number; // percentage weight (e.g. 30 = 30% of total)

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({ type: 'int', default: 0 })
    progress: number; // 0-100 calculated from tasks or set manually

    @Column({ type: 'varchar', length: 20, default: 'pending' })
    status: string; // pending, in_progress, completed

    @Column({ type: 'uuid', nullable: true })
    parentId: string; // null = top-level phase, uuid = sub-phase of parent

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
