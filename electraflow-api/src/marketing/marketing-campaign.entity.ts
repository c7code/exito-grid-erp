import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('marketing_campaigns')
export class MarketingCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'other' })
  channel: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  goal: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  budget: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amountSpent: number;

  @Column({ type: 'int', default: 0 })
  targetLeads: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  targetRevenue: number;

  @Column({ type: 'uuid', nullable: true })
  responsibleId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
