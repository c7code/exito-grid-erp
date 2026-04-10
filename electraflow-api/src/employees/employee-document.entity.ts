import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
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

    // Trabalhista / Mensal
    HOLERITE = 'holerite',
    FGTS_GUIA = 'fgts_guia',
    INSS_GPS = 'inss_gps',
    VALE_TRANSPORTE = 'vale_transporte',
    PONTO = 'ponto',

    // Legacy
    IDENTIFICATION = 'identification',
    HEALTH = 'health',
    SAFETY = 'safety',
    OTHER = 'other',
}

// Categorias ampliadas para agrupamento
export enum EmployeeDocCategory {
    SSMA = 'ssma',                 // Segurança, Saúde e Meio Ambiente
    TRABALHISTA = 'trabalhista',   // Holerite, FGTS, INSS, Contrato
    FISCAL = 'fiscal',             // CND, certidões
    ADMINISTRATIVO = 'administrativo', // Crachá, foto, comprovante
    IDENTIFICACAO = 'identificacao',   // RG, CPF, CTPS
    QUALIFICACAO = 'qualificacao',     // NRs, certificações
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

    // Categoria ampliada (ssma, trabalhista, fiscal, administrativo...)
    @Column({ type: 'varchar', length: 50, default: 'other' })
    documentCategory: string;

    @Column()
    url: string;

    @Column({ nullable: true })
    issueDate: Date;

    @Column({ nullable: true })
    expiryDate: Date;

    // Competência mensal (ex: "2026-04") — para holerite, FGTS, INSS
    @Column({ type: 'varchar', length: 7, nullable: true })
    referenceMonth: string;

    @Column({ default: false })
    clientVisible: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
