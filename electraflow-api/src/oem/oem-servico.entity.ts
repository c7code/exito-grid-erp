import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { OemUsina } from './oem-usina.entity';

@Entity('oem_servicos')
export class OemServico {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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

    @Column({ nullable: true })
    proposalId: string; // Vínculo com proposta gerada no módulo Propostas

    @Column({ type: 'varchar' })
    tipo: string; // 'preventiva' | 'preditiva' | 'corretiva'

    @Column({ type: 'varchar', default: 'pendente' })
    status: string; // pendente | agendado | em_andamento | concluido | cancelado

    @Column({ type: 'varchar', default: 'normal' })
    prioridade: string; // baixa | normal | alta | urgente

    @Column({ type: 'text', nullable: true })
    descricao: string;

    @Column({ type: 'text', nullable: true })
    diagnostico: string; // Preenchido na conclusão

    @Column({ type: 'text', nullable: true })
    solucao: string; // Solução aplicada

    @Column({ type: 'text', nullable: true })
    componentesAfetados: string; // JSON: ['inversor', 'módulo 3', 'conector MC4']

    @Column({ type: 'date', nullable: true })
    dataAgendada: Date;

    @Column({ type: 'date', nullable: true })
    dataConclusao: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    valorEstimado: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    valorFinal: number;

    // ═══ CHECKLIST ════════════════════════════════════════════════
    @Column({ type: 'text', nullable: true })
    checklist: string; // JSON: [{ item: string, checked: boolean, obs?: string }]

    // ═══ FOTOS (antes/depois) ═════════════════════════════════════
    @Column({ type: 'text', nullable: true })
    fotosAntes: string; // JSON: [{ url, descricao, dataCaptura }]

    @Column({ type: 'text', nullable: true })
    fotosDepois: string; // JSON: [{ url, descricao, dataCaptura }]

    // ═══ RELATÓRIO TÉCNICO ════════════════════════════════════════
    @Column({ type: 'text', nullable: true })
    relatorioTecnico: string; // Texto do relatório (preditiva: resultados termografia, etc.)

    @Column({ type: 'text', nullable: true })
    recomendacoes: string; // Recomendações futuras

    // ═══ EXECUTOR ═════════════════════════════════════════════════
    @Column({ nullable: true })
    tecnicoResponsavel: string;

    @Column({ nullable: true })
    equipe: string; // JSON: ['nome1', 'nome2']

    @Column({ type: 'text', nullable: true })
    observacoes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
