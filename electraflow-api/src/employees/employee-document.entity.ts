import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

export enum EmployeeDocumentType {
    // Identification
    CPF_RG = 'cpf_rg',
    CTPS = 'ctps',
    CONTRACT = 'contract',

    // Health & Safety NRs
    ASO = 'aso',
    NR10 = 'nr10',
    NR35 = 'nr35',
    NR12 = 'nr12',
    NR33 = 'nr33',
    NR06 = 'nr06',

    // Training & Certifications
    TRAINING = 'training',
    CERTIFICATION = 'certification',

    // Legacy
    IDENTIFICATION = 'identification',
    HEALTH = 'health',
    SAFETY = 'safety',
    OTHER = 'other',
}

@Entity('employee_documents')
export class EmployeeDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    employeeId: string;

    @ManyToOne('Employee', 'documents', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @Column()
    name: string;

    @Column({
        type: 'text',
        default: EmployeeDocumentType.OTHER,
    })
    type: EmployeeDocumentType;

    @Column()
    url: string;

    @Column({ nullable: true })
    issueDate: Date;

    @Column({ nullable: true })
    expiryDate: Date;

    @Column({ default: false })
    clientVisible: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
