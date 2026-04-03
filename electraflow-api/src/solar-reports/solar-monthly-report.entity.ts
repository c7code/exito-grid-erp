import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { OemUsina } from '../oem/oem-usina.entity';

@Entity('solar_monthly_reports')
export class SolarMonthlyReport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // ── Vínculos ──
    @Column()
    usinaId: string;

    @ManyToOne(() => OemUsina, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usinaId' })
    usina: OemUsina;

    @Column()
    clienteId: string;

    @ManyToOne(() => Client, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clienteId' })
    cliente: Client;

    @Column({ type: 'date' })
    mesReferencia: Date; // Sempre dia 1 do mês (ex: 2026-03-01)

    // ── Status ──
    @Column({ type: 'varchar', default: 'rascunho' })
    status: string; // rascunho | revisao | publicado | enviado

    @Column({ type: 'varchar', nullable: true })
    statusDesempenho: string; // bom | atencao | critico

    // ── Dados da Geração (inversor) ──
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    geracaoRealKwh: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    geracaoEsperadaKwh: number;

    @Column({ type: 'text', nullable: true })
    geracaoDiariaKwh: string; // JSON array [{dia: 1, kwh: 45.2}, ...]

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    picoGeracaoKw: number;

    @Column({ type: 'int', default: 0 })
    diasSemGeracao: number;

    @Column({ type: 'varchar', default: 'manual' })
    fonteGeracao: string; // manual | csv | pdf | api

    // ── Dados da Concessionária ──
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    consumoConcessionariaKwh: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    energiaInjetadaKwh: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    creditosAcumuladosKwh: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    valorContaRs: number;

    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    tarifaPraticadaRsKwh: number;

    @Column({ type: 'varchar', nullable: true })
    numeroUC: string;

    @Column({ type: 'varchar', default: 'manual' })
    fonteConcessionaria: string; // manual | pdf

    // ── Cálculos Automáticos ──
    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    performanceRatio: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    perdaGeracaoKwh: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    perdaFinanceiraRs: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    economiaGeradaRs: number;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    hspMedio: number;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    variacaoMesAnterior: number;

    // ── Snapshot da Usina ──
    @Column({ type: 'text', nullable: true })
    usinaSnapshot: string; // JSON

    // ── Resumo e Observações ──
    @Column({ type: 'text', nullable: true })
    resumoAutomatico: string;

    @Column({ type: 'text', nullable: true })
    resumoCustomizado: string;

    @Column({ type: 'text', nullable: true })
    observacoesTecnicas: string;

    // ── Arquivos ──
    @Column({ type: 'text', nullable: true })
    pdfConcessionariaUrl: string;

    @Column({ type: 'text', nullable: true })
    relatorioGeracaoUrl: string;

    @Column({ type: 'text', nullable: true })
    fotosAnexas: string; // JSON array de URLs

    // ── Período de consolidação ──
    @Column({ type: 'varchar', default: 'mensal' })
    tipoPeriodo: string; // mensal | trimestral | semestral | anual

    // ── Timestamps ──
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
