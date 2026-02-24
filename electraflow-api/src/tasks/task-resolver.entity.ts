import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from './task.entity';
import { Employee } from '../employees/employee.entity';

@Entity('task_resolvers')
export class TaskResolver {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    taskId: string;

    @ManyToOne(() => Task, task => task.resolvers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'taskId' })
    task: Task;

    @Column()
    employeeId: string;

    @ManyToOne(() => Employee, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @Column({ nullable: true })
    role: string; // ex: 'executor', 'supervisor', 'apoio'

    @CreateDateColumn()
    assignedAt: Date;
}
