import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn,
} from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { DocumentType } from './document-type.entity';

// ═══════════════════════════════════════════════════════════════
// Checklist por funcionário — o que se aplica e o que não
// ═══════════════════════════════════════════════════════════════
export enum Applicability {
    APPLICABLE = 'applicable',
    NOT_APPLICABLE = 'not_applicable',
    PENDING_REVIEW = 'pending_review',
}

@Entity('employee_document_requirements')
export class EmployeeDocRequirement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    employeeId: string;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @Column()
    documentTypeId: string;

    @ManyToOne(() => DocumentType, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'documentTypeId' })
    documentType: DocumentType;

    @Column({
        type: 'enum',
        enum: Applicability,
        default: Applicability.PENDING_REVIEW,
    })
    applicability: Applicability;

    // Justificativa obrigatória quando "não aplica"
    @Column({ type: 'text', nullable: true })
    justification: string;

    // Quem dispensou (marcou "não aplica")
    @Column({ nullable: true })
    dispensedById: string;

    @Column({ nullable: true })
    dispensedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
