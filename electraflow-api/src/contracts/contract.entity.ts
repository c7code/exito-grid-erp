import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Work } from '../works/work.entity';
import { Client } from '../clients/client.entity';
import { Proposal } from '../proposals/proposal.entity';

export enum ContractStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
}

export enum ContractType {
    SERVICE = 'service',
    SUPPLY = 'supply',
    SUBCONTRACT = 'subcontract',
    MAINTENANCE = 'maintenance',
    CONSULTING = 'consulting',
    OTHER = 'other',
}

@Entity('contracts')
export class Contract {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    contractNumber: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', default: ContractType.SERVICE })
    type: string;

    @Column({ type: 'varchar', default: ContractStatus.DRAFT })
    status: string;

    // ── Work Link ──
    @Column({ nullable: true })
    workId: string;

    @ManyToOne(() => Work, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'workId' })
    work: Work;

    // ── Client Link ──
    @Column({ nullable: true })
    clientId: string;

    @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'clientId' })
    client: Client;

    // ── Proposal Link ──
    @Column({ nullable: true })
    proposalId: string;

    @ManyToOne(() => Proposal, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'proposalId' })
    proposal: Proposal;

    // ── Values ──
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    originalValue: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    addendumValue: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    finalValue: number;

    // ── Dates ──
    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

    // ── Version Control ──
    @Column({ default: 1 })
    version: number;

    // ── Legal Clauses ──
    @Column({ type: 'text', nullable: true })
    scope: string;

    @Column({ type: 'text', nullable: true })
    paymentTerms: string;

    @Column({ type: 'text', nullable: true })
    paymentBank: string;

    @Column({ type: 'text', nullable: true })
    penalties: string;

    @Column({ type: 'text', nullable: true })
    warranty: string;

    @Column({ type: 'text', nullable: true })
    confidentiality: string;

    @Column({ type: 'text', nullable: true })
    termination: string;

    @Column({ type: 'text', nullable: true })
    forceMajeure: string;

    @Column({ type: 'text', nullable: true })
    jurisdiction: string;

    @Column({ type: 'text', nullable: true })
    contractorObligations: string;

    @Column({ type: 'text', nullable: true })
    clientObligations: string;

    @Column({ type: 'text', nullable: true })
    generalProvisions: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    // ── Witness Fields ──
    @Column({ nullable: true })
    witness1Name: string;

    @Column({ nullable: true })
    witness1Document: string;

    @Column({ nullable: true })
    witness2Name: string;

    @Column({ nullable: true })
    witness2Document: string;

    @Column({ nullable: true })
    fileUrl: string;

    // ── Assinatura Digital ──
    @Column({ nullable: true, unique: true })
    signatureToken: string;

    @Column({ nullable: true })
    signatureTokenExpiresAt: Date;

    @Column({ nullable: true })
    signedAt: Date;

    @Column({ nullable: true })
    signedByName: string;

    @Column({ nullable: true })
    signedByDocument: string;

    @Column({ nullable: true })
    signedByIP: string;

    @Column({ type: 'text', nullable: true })
    signedByUserAgent: string;

    @Column({ nullable: true })
    signatureVerificationCode: string;

    @OneToMany(() => ContractAddendum, addendum => addendum.contract, { cascade: true })
    addendums: ContractAddendum[];

    // ── Audit Trail ──
    @Column({ nullable: true })
    createdById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdByUser: User;

    @Column({ nullable: true })
    updatedById: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}

@Entity('contract_addendums')
export class ContractAddendum {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    contractId: string;

    @ManyToOne(() => Contract, contract => contract.addendums, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contractId' })
    contract: Contract;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    valueChange: number;

    @Column({ nullable: true })
    newEndDate: Date;

    @Column({ type: 'text', nullable: true })
    justification: string;

    @Column({ nullable: true })
    fileUrl: string;

    @Column({ nullable: true })
    approvedAt: Date;

    @Column({ nullable: true })
    approvedBy: string;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
