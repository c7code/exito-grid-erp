import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { SinapiReference } from './sinapi-reference.entity';

// ============================================================
// SINAPI IMPORT LOG — Registro de cada importação
// ============================================================

export enum ImportLogStatus {
    RUNNING = 'running',
    SUCCESS = 'success',
    PARTIAL = 'partial',
    ERROR = 'error',
}

@Entity('sinapi_import_logs')
export class SinapiImportLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    referenceId: string;

    @ManyToOne(() => SinapiReference, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'referenceId' })
    reference: SinapiReference;

    @Column({ nullable: true })
    fileName: string;                  // Nome do arquivo original

    @Column({ default: 'inputs' })
    fileType: string;                  // 'inputs' | 'compositions' | 'prices' | 'mixed'

    @Column({ type: 'char', length: 2, nullable: true })
    state: string;                     // UF detectada

    @Column({ type: 'int', nullable: true })
    year: number;

    @Column({ type: 'int', nullable: true })
    month: number;

    @Column({ default: 'nao_desonerado' })
    taxRegime: string;                 // 'desonerado' | 'nao_desonerado'

    @Column({ type: 'varchar', default: ImportLogStatus.RUNNING })
    status: ImportLogStatus;

    @Column({ type: 'int', default: 0 })
    totalRows: number;                 // Total de linhas lidas

    @Column({ type: 'int', default: 0 })
    insertedCount: number;

    @Column({ type: 'int', default: 0 })
    updatedCount: number;

    @Column({ type: 'int', default: 0 })
    skippedCount: number;

    @Column({ type: 'int', default: 0 })
    errorCount: number;

    @Column({ type: 'text', nullable: true })
    errors: string;                    // JSON array of error messages

    @Column({ type: 'text', nullable: true })
    warnings: string;                  // JSON array of warnings

    @Column({ type: 'int', nullable: true })
    durationMs: number;                // Duração em milissegundos

    @CreateDateColumn()
    createdAt: Date;
}
