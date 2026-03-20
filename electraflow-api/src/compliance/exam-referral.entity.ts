import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
    ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { Supplier } from '../supply/supply.entity';

// ═══════════════════════════════════════════════════════════════
// Guia de Encaminhamento para Exames Ocupacionais
// ═══════════════════════════════════════════════════════════════
@Entity('exam_referrals')
export class ExamReferral {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    referralNumber: string; // "GE-2026-001"

    @Column()
    employeeId: string;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @Column({ nullable: true })
    clinicSupplierId: string;

    @ManyToOne(() => Supplier, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'clinicSupplierId' })
    clinicSupplier: Supplier;

    // admissional, periodico, retorno, demissional, mudanca_funcao, consulta
    @Column({ type: 'varchar', default: 'periodico' })
    examType: string;

    // draft, sent, budget_received, scheduled, completed, cancelled
    @Column({ type: 'varchar', default: 'draft' })
    status: string;

    // Snapshot dos dados do funcionário no momento da geração
    @Column({ nullable: true })
    jobFunction: string;

    @Column('simple-json', { nullable: true, default: '[]' })
    risks: { type: string; agent: string; nr?: string }[];

    @Column({ type: 'text', nullable: true })
    observations: string;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    budgetValue: number;

    @Column({ type: 'timestamp', nullable: true })
    budgetReceivedAt: Date;

    @Column({ type: 'date', nullable: true })
    scheduledDate: Date;

    @Column({ type: 'date', nullable: true })
    completedAt: Date;

    @OneToMany('ExamReferralItem', 'referral', { cascade: true })
    items: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// Itens da Guia — exames individuais
// ═══════════════════════════════════════════════════════════════
@Entity('exam_referral_items')
export class ExamReferralItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    referralId: string;

    @ManyToOne('ExamReferral', 'items', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'referralId' })
    referral: ExamReferral;

    @Column({ nullable: true })
    examId: string; // FK → occupational_exams (nullable se exame ad-hoc)

    @Column()
    examName: string; // Snapshot do nome

    // laboratorial, complementar, clinico
    @Column({ type: 'varchar', default: 'laboratorial' })
    examGroup: string;

    @Column({ default: false })
    isRenewal: boolean;

    @Column({ type: 'date', nullable: true })
    lastExamDate: Date;

    @Column({ type: 'date', nullable: true })
    expiryDate: Date;

    @Column({ default: true })
    selected: boolean; // Marcado para esta guia

    @Column({ default: 0 })
    sortOrder: number;
}
