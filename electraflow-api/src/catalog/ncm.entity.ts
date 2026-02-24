import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

// ═══════════════════════════════════════════════════════════════
// Tabela NCM — Nomenclatura Comum do Mercosul
// ═══════════════════════════════════════════════════════════════

@Entity('ncm_codes')
export class NcmCode {
    @PrimaryColumn({ length: 10 })
    code: string;                          // Código NCM (8 dígitos, com ou sem pontos)

    @Column({ type: 'text' })
    @Index()
    description: string;                   // Descrição completa

    @Column({ length: 2, nullable: true })
    chapter: string;                       // Capítulo (2 primeiros dígitos)
}
