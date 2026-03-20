import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
    ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Company } from '../companies/company.entity';

// ═══════════════════════════════════════════════════════════════
// Programa de Segurança do Trabalho (PGR, PCMSO, LTCAT, etc.)
// ═══════════════════════════════════════════════════════════════
@Entity('safety_programs')
export class SafetyProgram {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    companyId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    // Tipo: pgr, pcmso, ltcat, ppp, aet, apr, cipa, os_seg
    @Column({ type: 'varchar' })
    programType: string;

    @Column()
    name: string; // "PCMSO 2026", "PGR - Rev.03"

    @Column({ nullable: true })
    nrReference: string; // "NR-7", "NR-1"

    @Column({ nullable: true })
    responsibleName: string; // Engenheiro / Médico

    @Column({ nullable: true })
    responsibleRegistration: string; // CREA / CRM

    @Column({ type: 'date', nullable: true })
    validFrom: Date;

    @Column({ type: 'date', nullable: true })
    validUntil: Date;

    // draft, active, expired, reviewing
    @Column({ type: 'varchar', default: 'draft' })
    status: string;

    @Column({ nullable: true })
    fileUrl: string;

    @Column({ nullable: true })
    fileName: string;

    @Column({ type: 'text', nullable: true })
    observations: string;

    @OneToMany('RiskGroup', 'safetyProgram', { cascade: true })
    riskGroups: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
