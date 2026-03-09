import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';

export enum NotificationType {
    NEW_TASK = 'new_task',
    OVERDUE_TASK = 'overdue_task',
    TASK_STARTED = 'task_started',
    TASK_COMPLETED = 'task_completed',
    AUTO_WORK_CREATED = 'auto_work_created',
    AUTO_COST_CREATED = 'auto_cost_created',
    STOCK_ALERT = 'stock_alert',
    PROPOSAL_ACCEPTED = 'proposal_accepted',
    OS_COMPLETED = 'os_completed',
    SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'varchar', default: 'system' })
    type: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ nullable: true })
    category: string;

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
