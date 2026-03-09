import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Work } from '../works/work.entity';
import { User } from '../users/user.entity';
import { Client } from '../clients/client.entity';

export enum ServiceOrderStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    ON_HOLD = 'on_hold',
}

export enum ServiceOrderPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

@Entity('service_orders')
export class ServiceOrder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true, unique: true })
    code: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'enum', enum: ServiceOrderStatus, default: ServiceOrderStatus.OPEN })
    status: ServiceOrderStatus;

    @Column({ type: 'enum', enum: ServiceOrderPriority, default: ServiceOrderPriority.MEDIUM })
    priority: ServiceOrderPriority;

    // Category/Type
    @Column({ nullable: true })
    category: string;

    // Work link (optional, can be standalone)
    @Column({ nullable: true })
    workId: string;

    @ManyToOne(() => Work)
    @JoinColumn({ name: 'workId' })
    work: Work;

    // Client link
    @Column({ nullable: true })
    clientId: string;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'clientId' })
    client: Client;

    // Assigned technician
    @Column({ nullable: true })
    assignedToId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assignedToId' })
    assignedTo: User;

    // Location
    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    // Scheduling
    @Column({ nullable: true })
    scheduledDate: Date;

    @Column({ nullable: true })
    startTime: string;

    @Column({ nullable: true })
    endTime: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    hoursWorked: number;

    // Execution details
    @Column({ type: 'simple-json', nullable: true })
    checklist: {
        item: string;
        completed: boolean;
        notes?: string;
    }[];

    @Column({ type: 'simple-json', nullable: true })
    materialsUsed: {
        name: string;
        quantity: number;
        unit: string;
        unitCost?: number;
    }[];

    @Column({ type: 'simple-json', nullable: true })
    photos: {
        url: string;
        type: string; // before, during, after
        description?: string;
    }[];

    // Signature
    @Column({ type: 'text', nullable: true })
    clientSignature: string;

    @Column({ nullable: true })
    clientSignedName: string;

    @Column({ nullable: true })
    clientSignedAt: Date;

    // Observations
    @Column({ type: 'text', nullable: true })
    technicianNotes: string;

    @Column({ type: 'text', nullable: true })
    clientNotes: string;

    // Financial
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    laborCost: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    materialCost: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalCost: number;

    @Column({ nullable: true })
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    @Column({ nullable: true })
    completedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
