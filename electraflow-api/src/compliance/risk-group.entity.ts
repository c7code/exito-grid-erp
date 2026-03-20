import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
    ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { SafetyProgram } from './safety-program.entity';

// ═══════════════════════════════════════════════════════════════
// GHE — Grupo Homogêneo de Exposição (riscos por função)
// ═══════════════════════════════════════════════════════════════
@Entity('risk_groups')
export class RiskGroup {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    programId: string;

    @ManyToOne(() => SafetyProgram, p => p.riskGroups, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'programId' })
    safetyProgram: SafetyProgram;

    @Column()
    name: string; // "GHE-01 Eletricistas", "GHE-02 Administrativo"

    @Column({ nullable: true })
    code: string; // "GHE-01"

    // Funções vinculadas a este GHE
    @Column('simple-json', { nullable: true, default: '[]' })
    jobFunctions: string[]; // ["Eletricista", "Técnico Eletrotécnico"]

    // Riscos deste grupo
    @Column('simple-json', { nullable: true, default: '[]' })
    risks: { type: string; agent: string; nr?: string; description?: string }[];

    // Periodicidade padrão em meses
    @Column({ type: 'int', default: 12 })
    examFrequencyMonths: number;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany('RiskGroupExam', 'riskGroup', { cascade: true })
    exams: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
