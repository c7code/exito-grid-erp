import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('system_configs')
export class SystemConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string;              // 'ai_api_key', 'ai_model', 'ai_enabled'

    @Column({ type: 'text' })
    value: string;

    @Column({ default: false })
    isSecret: boolean;        // Se true, o valor é mascarado na leitura

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
