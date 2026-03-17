import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('ai_action_tokens')
export class AiActionToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Quem criou o token (admin)
    @Column()
    createdById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    // Para quem: null = todos os usuários
    @Column({ nullable: true })
    targetUserId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'targetUserId' })
    targetUser: User;

    // Expiração
    @Column()
    expiresAt: Date;

    @Column({ default: true })
    isActive: boolean;

    // Descrição / motivo
    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;
}
