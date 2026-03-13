import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Proposal } from './proposal.entity';

@Entity('proposal_revisions')
export class ProposalRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  proposalId: string;

  @ManyToOne(() => Proposal, proposal => proposal.revisions)
  @JoinColumn({ name: 'proposalId' })
  proposal: Proposal;

  @Column({ type: 'int' })
  revisionNumber: number;

  @Column({ type: 'text' })
  snapshotData: string; // JSON completo da proposta + itens no momento da revisão

  @Column({ nullable: true })
  changedBy: string;

  @Column({ type: 'text', nullable: true })
  changeDescription: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
