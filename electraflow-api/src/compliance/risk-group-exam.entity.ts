import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { RiskGroup } from './risk-group.entity';
import { OccupationalExam } from './occupational-exam.entity';

// ═══════════════════════════════════════════════════════════════
// Matriz GHE × Exame — quais exames cada grupo precisa
// ═══════════════════════════════════════════════════════════════
@Entity('risk_group_exams')
export class RiskGroupExam {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    riskGroupId: string;

    @ManyToOne(() => RiskGroup, rg => rg.exams, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'riskGroupId' })
    riskGroup: RiskGroup;

    @Column()
    examId: string;

    @ManyToOne(() => OccupationalExam, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examId' })
    exam: OccupationalExam;

    @Column({ default: true })
    requiredOnAdmission: boolean;

    @Column({ default: true })
    requiredOnPeriodic: boolean;

    @Column({ default: false })
    requiredOnDismissal: boolean;

    @Column({ default: false })
    requiredOnReturn: boolean; // retorno ao trabalho

    @Column({ default: false })
    requiredOnFunctionChange: boolean; // mudança de função

    // Validade customizada (sobrescreve a do exame)
    @Column({ type: 'int', nullable: true })
    customValidityMonths: number;
}
