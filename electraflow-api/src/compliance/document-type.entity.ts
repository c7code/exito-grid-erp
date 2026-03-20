import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany,
} from 'typeorm';
import { DocumentTypeRule } from './document-type-rule.entity';

// Categorias padrão (referência — novas podem ser criadas dinamicamente)
export enum DocumentCategory {
    IDENTIFICATION = 'identification',     // Identificação / Admissional
    HEALTH = 'health',                     // Saúde Ocupacional
    SAFETY_NR = 'safety_nr',              // Segurança / NRs
    EPI_EPC = 'epi_epc',                  // EPI / EPC
    QUALIFICATION = 'qualification',       // Habilitações / Certificações
    OTHER = 'other',
}

// Labels padrão das categorias built-in
export const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
    identification: 'Identificação / Admissional',
    health: 'Saúde Ocupacional',
    safety_nr: 'Segurança / NRs',
    epi_epc: 'EPI / EPC',
    qualification: 'Habilitações / Certificações',
    other: 'Outros',
};

// ═══════════════════════════════════════════════════════════════
// Tipo de Documento (configurável — não enum fixo)
// ═══════════════════════════════════════════════════════════════
@Entity('document_types')
export class DocumentType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // "Atestado de Saúde Ocupacional"

    @Column({ unique: true })
    code: string; // "ASO"

    @Column({ type: 'varchar', default: 'other' })
    category: string;

    // NRs relacionadas (ex: ["NR-7", "NR-9"])
    @Column('simple-json', { nullable: true, default: '[]' })
    nrsRelated: string[];

    // Validade padrão em meses (null = sem validade)
    @Column({ type: 'int', nullable: true })
    defaultValidityMonths: number;

    @Column({ default: true })
    requiresApproval: boolean;

    @Column({ default: true })
    isMandatory: boolean;

    @Column({ default: true })
    allowsNotApplicable: boolean;

    @Column({ default: true })
    requiresJustification: boolean; // quando "não aplica"

    // Formatos de arquivo permitidos
    @Column('simple-json', { nullable: true, default: '["pdf","jpg","png","doc","docx"]' })
    allowedFormats: string[];

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: 0 })
    sortOrder: number;

    @OneToMany(() => DocumentTypeRule, rule => rule.documentType, { cascade: true })
    rules: DocumentTypeRule[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
