import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
    ManyToOne, JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';

// ═══════════════════════════════════════════════════════════════
// Documento da Empresa — certidões, alvarás, registros, programas
// ═══════════════════════════════════════════════════════════════
@Entity('company_documents')
export class CompanyDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    companyId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    // Grupo: identity, legal, safety_program, licensing, fiscal, certification
    @Column({ type: 'varchar', default: 'other' })
    documentGroup: string;

    @Column()
    name: string; // "Alvará de Funcionamento", "CNPJ", etc.

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    fileUrl: string;

    @Column({ nullable: true })
    fileName: string;

    @Column({ nullable: true })
    mimeType: string;

    @Column({ type: 'date', nullable: true })
    issueDate: Date;

    @Column({ type: 'date', nullable: true })
    expiryDate: Date;

    // valid, expiring, expired, pending
    @Column({ type: 'varchar', default: 'pending' })
    status: string;

    @Column({ nullable: true })
    responsibleName: string; // Responsável técnico

    @Column({ nullable: true })
    registrationNumber: string; // Nº CREA, CRM, etc.

    @Column({ type: 'text', nullable: true })
    observations: string;

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
