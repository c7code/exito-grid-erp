import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
} from 'typeorm';

// ============================================================
// SINAPI CONFIG — Configurações do módulo SINAPI
// ============================================================

@Entity('sinapi_configs')
export class SinapiConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string;                       // 'default_state', 'default_bdi', 'last_import_date'

    @Column({ type: 'text', nullable: true })
    value: string;

    @UpdateDateColumn()
    updatedAt: Date;
}
