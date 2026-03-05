import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';

export enum NotificationType {
    NEW_TASK = 'new_task',
    OVERDUE_TASK = 'overdue_task',
    TASK_STARTED = 'task_started',
    TASK_COMPLETED = 'task_completed',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'enum', enum: NotificationType })
    type: NotificationType;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ nullable: true })
    taskId: string;

    @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'taskId' })
    task: Task;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
