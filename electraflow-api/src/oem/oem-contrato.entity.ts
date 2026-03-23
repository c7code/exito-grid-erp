import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { OemUsina } from './oem-usina.entity';
import { OemPlano } from './oem-plano.entity';

@Entity('oem_contratos')
export class OemContrato {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    clienteId: string;

    @ManyToOne(() => Client, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clienteId' })
    cliente: Client;

    @Column()
    usinaId: string;

    @ManyToOne(() => OemUsina, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usinaId' })
    usina: OemUsina;

    @Column()
    planoId: string;

    @ManyToOne(() => OemPlano, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'planoId' })
    plano: OemPlano;

    @Column({ type: 'date' })
    dataInicio: Date;

    @Column({ type: 'date', nullable: true })
    dataFim: Date; // null = indeterminado

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    valorMensal: number;

    @Column({ nullable: true })
    indiceReajuste: string; // IGPM | IPCA | fixo

    @Column({ type: 'date', nullable: true })
    dataProximoReajuste: Date;

    @Column({ type: 'boolean', default: true })
    renovacaoAutomatica: boolean;

    @Column({ type: 'varchar', default: 'ativo' })
    status: string; // ativo | suspenso | cancelado | encerrado

    @Column({ type: 'text', nullable: true })
    motivoCancelamento: string;

    @Column({ nullable: true })
    parceiroId: string; // FK → parceiros (EPN)

    @Column({ type: 'text', nullable: true })
    observacoes: string;

    // Detalhes do cálculo (para auditoria)
    @Column({ type: 'simple-json', nullable: true })
    calculoDetalhado: {
        precoBase: number;
        kwpExcedente: number;
        valorExcedente: number;
        custoMobilizacao: number;
        frequencia: string;
        totalAnual: number;
    };

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
