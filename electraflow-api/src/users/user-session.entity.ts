import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn()
    loginAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    logoutAt: Date;

    @Column({ type: 'timestamp' })
    lastHeartbeat: Date;

    @Column({ type: 'int', default: 0 })
    durationMinutes: number;

    @Column({ default: true })
    isActive: boolean;
}
