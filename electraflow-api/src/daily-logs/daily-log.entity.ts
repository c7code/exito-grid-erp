import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Work } from '../works/work.entity';
import { User } from '../users/user.entity';

export enum WeatherCondition {
    SUNNY = 'sunny',
    CLOUDY = 'cloudy',
    RAINY = 'rainy',
    STORMY = 'stormy',
    WINDY = 'windy',
    FOGGY = 'foggy',
}

@Entity('daily_logs')
export class DailyLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ nullable: true })
    workId: string;

    @ManyToOne(() => Work)
    @JoinColumn({ name: 'workId' })
    work: Work;

    @Column({ nullable: true })
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    // Weather
    @Column({ type: 'enum', enum: WeatherCondition, default: WeatherCondition.SUNNY })
    weatherMorning: WeatherCondition;

    @Column({ type: 'enum', enum: WeatherCondition, default: WeatherCondition.SUNNY })
    weatherAfternoon: WeatherCondition;

    // Workforce
    @Column({ default: 0 })
    workersPresent: number;

    @Column({ default: 0 })
    workersAbsent: number;

    @Column({ type: 'simple-json', nullable: true })
    workforce: {
        role: string;
        count: number;
        company?: string;
    }[];

    // Activities
    @Column({ type: 'text', nullable: true })
    activitiesPerformed: string;

    @Column({ type: 'text', nullable: true })
    activitiesPlanned: string;

    // Occurrences
    @Column({ type: 'text', nullable: true })
    occurrences: string;

    @Column({ type: 'text', nullable: true })
    safetyNotes: string;

    // Materials
    @Column({ type: 'simple-json', nullable: true })
    materialsUsed: {
        name: string;
        quantity: number;
        unit: string;
    }[];

    // Equipment
    @Column({ type: 'simple-json', nullable: true })
    equipmentUsed: {
        name: string;
        hours?: number;
        status?: string;
    }[];

    // Photos
    @Column({ type: 'simple-json', nullable: true })
    photos: {
        url: string;
        description?: string;
        timestamp?: string;
    }[];

    // Observations
    @Column({ type: 'text', nullable: true })
    observations: string;

    // Work hours
    @Column({ nullable: true })
    startTime: string;

    @Column({ nullable: true })
    endTime: string;

    @Column({ type: 'boolean', default: false })
    workedOvertime: boolean;

    // Signature
    @Column({ nullable: true })
    signedBy: string;

    @Column({ type: 'boolean', default: false })
    isSigned: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
