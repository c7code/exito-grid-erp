import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

// ═══════════════════════════════════════════════════════════════
// Trilha de Auditoria — registra TODA alteração no sistema
// Universal: pode ser usado por qualquer módulo
// ═══════════════════════════════════════════════════════════════
@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Tipo de entidade afetada
    @Column()
    entityType: string; // "compliance_document", "requirement", "document_type", etc.

    @Column()
    entityId: string;

    // Ação realizada
    @Column()
    action: string; // "created", "updated", "deleted", "approved", "rejected", "dispensed", "archived"

    // Snapshots do before/after (JSONB para consultas)
    @Column({ type: 'jsonb', nullable: true })
    oldValues: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    newValues: Record<string, any>;

    // Quem fez
    @Column({ nullable: true })
    performedById: string;

    @Column({ nullable: true })
    performedByName: string;

    // Descrição legível
    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn()
    performedAt: Date;
}
