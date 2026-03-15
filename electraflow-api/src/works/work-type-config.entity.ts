import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

// ════════════════════════════════════════════════════
// WORK TYPE CONFIG — Tipos de Obra Cadastráveis
// Allows dynamic registration of work types beyond
// the hardcoded defaults. Stored in DB for persistence.
// ════════════════════════════════════════════════════

@Entity('work_type_configs')
export class WorkTypeConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    key: string;

    @Column({ type: 'varchar', length: 150 })
    label: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
