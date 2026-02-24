import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    ManyToOne, JoinColumn,
} from 'typeorm';
import { ComplianceDocument } from './compliance-document.entity';
import { DocumentVersion } from './document-version.entity';

// ═══════════════════════════════════════════════════════════════
// Aprovação / Reprovação de Documento
// ═══════════════════════════════════════════════════════════════
export enum ApprovalAction {
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('document_approvals')
export class DocumentApproval {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    complianceDocumentId: string;

    @ManyToOne(() => ComplianceDocument, doc => doc.approvals, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'complianceDocumentId' })
    complianceDocument: ComplianceDocument;

    @Column({ nullable: true })
    versionId: string;

    @ManyToOne(() => DocumentVersion, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'versionId' })
    version: DocumentVersion;

    @Column({
        type: 'enum',
        enum: ApprovalAction,
    })
    action: ApprovalAction;

    @Column({ nullable: true })
    reviewedById: string;

    @Column({ nullable: true })
    reviewedByName: string; // cache para auditoria

    // Obrigatório quando reprovado
    @Column({ type: 'text', nullable: true })
    comments: string;

    @CreateDateColumn()
    reviewedAt: Date;
}
