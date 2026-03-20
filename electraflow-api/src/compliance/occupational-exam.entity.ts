import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

// ═══════════════════════════════════════════════════════════════
// Catálogo de Exames Ocupacionais
// ═══════════════════════════════════════════════════════════════
@Entity('occupational_exams')
export class OccupationalExam {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // "Audiometria", "Hemograma Completo"

    @Column({ unique: true })
    code: string; // "AUDIO", "HEMOGRAMA"

    // laboratorial, complementar, clinico
    @Column({ type: 'varchar', default: 'laboratorial' })
    group: string;

    // Validade em meses (null = sem validade)
    @Column({ type: 'int', nullable: true })
    validityMonths: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
