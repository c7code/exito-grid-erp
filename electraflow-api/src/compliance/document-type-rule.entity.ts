import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { DocumentType } from './document-type.entity';

// ═══════════════════════════════════════════════════════════════
// Motor de Regras — define quando um tipo se aplica ao funcionário
// ═══════════════════════════════════════════════════════════════
export enum ConditionOperator {
    EQUALS = 'equals',
    NOT_EQUALS = 'not_equals',
    IN = 'in',
    NOT_IN = 'not_in',
    CONTAINS = 'contains',
}

export enum RuleResult {
    MANDATORY = 'mandatory',
    CONDITIONAL = 'conditional',
    OPTIONAL = 'optional',
}

@Entity('document_type_rules')
export class DocumentTypeRule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    documentTypeId: string;

    @ManyToOne(() => DocumentType, dt => dt.rules, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'documentTypeId' })
    documentType: DocumentType;

    // Campo do funcionário a avaliar
    // ex: "role", "specialty", "employmentType", "operationType"
    @Column()
    conditionField: string;

    @Column({
        type: 'enum',
        enum: ConditionOperator,
        default: ConditionOperator.EQUALS,
    })
    conditionOperator: ConditionOperator;

    // Valor para comparar (pode ser JSON array se operator = "in")
    @Column()
    conditionValue: string;

    @Column({
        type: 'enum',
        enum: RuleResult,
        default: RuleResult.MANDATORY,
    })
    result: RuleResult;

    @CreateDateColumn()
    createdAt: Date;
}
