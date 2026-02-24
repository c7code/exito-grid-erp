import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    ManyToOne, JoinColumn,
} from 'typeorm';
import { ComplianceDocument } from './compliance-document.entity';

// ═══════════════════════════════════════════════════════════════
// Versão de Documento — histórico de arquivos enviados
// Cada upload cria nova versão (versões anteriores preservadas)
// ═══════════════════════════════════════════════════════════════
@Entity('document_versions')
export class DocumentVersion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    complianceDocumentId: string;

    @ManyToOne(() => ComplianceDocument, doc => doc.versions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'complianceDocumentId' })
    complianceDocument: ComplianceDocument;

    @Column({ type: 'int' })
    versionNumber: number;

    @Column()
    fileUrl: string;

    @Column()
    fileName: string;

    @Column({ nullable: true })
    mimeType: string;

    @Column({ type: 'int', nullable: true })
    fileSize: number; // em bytes

    @Column({ nullable: true })
    uploadedById: string;

    @Column({ nullable: true })
    uploadedByName: string; // cache do nome para auditoria

    @CreateDateColumn()
    uploadedAt: Date;
}
