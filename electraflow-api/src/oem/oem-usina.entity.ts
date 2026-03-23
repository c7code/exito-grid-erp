import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { Company } from '../companies/company.entity';
import { SolarProject } from '../solar/solar-project.entity';

@Entity('oem_usinas')
export class OemUsina {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    clienteId: string;

    @ManyToOne(() => Client, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clienteId' })
    cliente: Client;

    @Column({ nullable: true })
    empresaId: string;

    @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'empresaId' })
    empresa: Company;

    @Column({ nullable: true })
    projetoSolarId: string;

    @ManyToOne(() => SolarProject, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'projetoSolarId' })
    projetoSolar: SolarProject;

    @Column()
    nome: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    potenciaKwp: number;

    @Column({ type: 'int' })
    qtdModulos: number;

    @Column({ nullable: true })
    modeloModulos: string;

    @Column({ type: 'int', default: 1 })
    qtdInversores: number;

    @Column({ nullable: true })
    modeloInversores: string;

    @Column({ nullable: true })
    marcaInversor: string;

    @Column({ type: 'simple-json', nullable: true })
    serialInversores: string[];

    @Column({ type: 'date' })
    dataInstalacao: Date;

    @Column({ nullable: true })
    tipoTelhado: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    inclinacaoGraus: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    azimuteGraus: number;

    @Column()
    endereco: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    geracaoMensalEsperadaKwh: number;

    @Column({ nullable: true })
    apiMonitoramentoTipo: string; // growatt | sungrow | fronius | huawei

    @Column({ type: 'simple-json', nullable: true })
    apiMonitoramentoCredentials: Record<string, any>;

    @Column({ type: 'varchar', default: 'ativa' })
    status: string; // ativa | inativa | descomissionada

    @Column({ type: 'text', nullable: true })
    observacoes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
