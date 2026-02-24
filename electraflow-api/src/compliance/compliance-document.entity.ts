import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { DocumentType } from './document-type.entity';
import { DocumentVersion } from './document-version.entity';
import { DocumentApproval } from './document-approval.entity';
import { EmployeeDocRequirement } from './employee-doc-requirement.entity';

// ═══════════════════════════════════════════════════════════════
// Documento de Conformidade — instância universal (ownerType/ownerId)
// Pode pertencer a Employee, Work, Equipment, Supplier, etc.
// ═══════════════════════════════════════════════════════════════
export enum ComplianceStatus {
    PENDING = 'pending',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRING = 'expiring',
    EXPIRED = 'expired',
    DISPENSED = 'dispensed',
}

@Entity('compliance_documents')
export class ComplianceDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // ═══ Vínculo com requirement (quando é employee)
    @Column({ nullable: true })
    requirementId: string;

    @ManyToOne(() => EmployeeDocRequirement, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'requirementId' })
    requirement: EmployeeDocRequirement;

    // ═══ Tipo de documento
    @Column()
    documentTypeId: string;

    @ManyToOne(() => DocumentType, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'documentTypeId' })
    documentType: DocumentType;

    // ═══ Owner universal (reutilizável por qualquer módulo)
    @Column({ default: 'employee' })
    ownerType: string; // "employee", "work", "equipment", "supplier", "contract"

    @Column()
    ownerId: string;

    // ═══ Status
    @Column({
        type: 'enum',
        enum: ComplianceStatus,
        default: ComplianceStatus.PENDING,
    })
    status: ComplianceStatus;

    // ═══ Datas
    @Column({ type: 'date', nullable: true })
    issueDate: Date;

    @Column({ type: 'date', nullable: true })
    expiryDate: Date;

    // ═══ Versão corrente
    @Column({ type: 'int', default: 1 })
    currentVersion: number;

    // ═══ Observações
    @Column({ type: 'text', nullable: true })
    observations: string;

    // ═══ Arquivamento (retenção)
    @Column({ default: false })
    isArchived: boolean;

    @Column({ nullable: true })
    archivedAt: Date;

    // ═══ Relações
    @OneToMany(() => DocumentVersion, v => v.complianceDocument, { cascade: true })
    versions: DocumentVersion[];

    @OneToMany(() => DocumentApproval, a => a.complianceDocument, { cascade: true })
    approvals: DocumentApproval[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
