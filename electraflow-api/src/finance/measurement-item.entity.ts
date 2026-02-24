import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Measurement } from './measurement.entity';
import { Task } from '../tasks/task.entity';

@Entity('measurement_items')
export class MeasurementItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    measurementId: string;

    @ManyToOne(() => Measurement, measurement => measurement.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'measurementId' })
    measurement: Measurement;

    @Column({ nullable: true })
    taskId: string;

    @ManyToOne(() => Task)
    @JoinColumn({ name: 'taskId' })
    task: Task;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    previousProgress: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    currentProgress: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    weightPercentage: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    calculatedValue: number;

    @CreateDateColumn()
    createdAt: Date;
}
