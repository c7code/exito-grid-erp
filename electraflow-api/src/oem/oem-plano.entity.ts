import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('oem_planos')
export class OemPlano {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nome: string;

    @Column({ type: 'text', nullable: true })
    descricao: string;

    // ═══ SERVIÇOS INCLUÍDOS ══════════════════════════════════
    @Column({ type: 'boolean', default: true })
    incluiLimpeza: boolean;

    @Column({ type: 'boolean', default: true })
    incluiInspecaoVisual: boolean;

    @Column({ type: 'boolean', default: false })
    incluiTermografia: boolean;

    @Column({ type: 'boolean', default: false })
    incluiTesteString: boolean;

    @Column({ type: 'boolean', default: false })
    incluiMonitoramentoRemoto: boolean;

    @Column({ type: 'boolean', default: false })
    incluiCorretivaPrioritaria: boolean;

    // ═══ PERFORMANCE ═════════════════════════════════════════
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    garantiaPerformancePr: number; // PR mínimo garantido (ex: 75%)

    @Column({ type: 'varchar', default: 'semestral' })
    frequenciaPreventiva: string; // mensal | trimestral | semestral | anual

    // ═══ PRECIFICAÇÃO ════════════════════════════════════════
    // Preço base mensal (até X kWp)
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precoBaseMensal: number;

    // Limite de kWp incluído no preço base
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
    kwpLimiteBase: number;

    // Preço por kWp excedente
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    precoKwpExcedente: number;

    // ═══ FAIXAS DE PREÇO POR VOLUME (degressivo) ═════════════
    // JSONB com array de faixas: [{min, max, precoUnitario}]
    // Unidade de referência configurável (módulo, kWp, etc.)
    @Column({ type: 'varchar', default: 'kWp' })
    unidadeCobranca: string; // kWp | módulo | Wp | visita

    @Column({ type: 'simple-json', nullable: true })
    faixasPreco: {
        min: number;
        max: number | null; // null = sem limite
        precoUnitario: number;
    }[];

    // ═══ CUSTOS FIXOS POR VISITA ═════════════════════════════
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    custoMobilizacao: number; // dia-homem, transporte, etc.

    @Column({ type: 'simple-json', nullable: true })
    custosFixosDetalhados: {
        descricao: string;
        valor: number;
        unidade: string; // dia-homem, km, un
    }[];

    @Column({ type: 'boolean', default: true })
    ativo: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
