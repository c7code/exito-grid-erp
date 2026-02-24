import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

// ═══════════════════════════════════════════════════════════════
// Política de Retenção — define quanto tempo manter documentos
// Padrão: 5 anos, mas configurável por tipo de entidade
// ═══════════════════════════════════════════════════════════════
export enum RetentionAction {
    ARCHIVE = 'archive',   // Manter mas marcar como arquivado
    DELETE = 'delete',     // Excluir permanentemente
}

@Entity('retention_policies')
export class RetentionPolicy {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // "Documentos Ocupacionais - 5 anos"

    // Tipo de entidade que esta política se aplica
    @Column({ default: 'compliance_document' })
    entityType: string;

    @Column({ type: 'int', default: 5 })
    retentionYears: number;

    // Base para cálculo: data de upload ou data de vencimento
    @Column({ default: 'expiry_date' })
    retentionBase: string; // "upload_date" | "expiry_date"

    @Column({
        type: 'enum',
        enum: RetentionAction,
        default: RetentionAction.ARCHIVE,
    })
    actionOnExpiry: RetentionAction;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
