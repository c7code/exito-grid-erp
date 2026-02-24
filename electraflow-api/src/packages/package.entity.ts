import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  basePrice: number;

  @Column({ type: 'simple-json', nullable: true })
  includedServices: string[];

  @Column({ type: 'simple-json', nullable: true })
  rules: {
    triggerServices?: string[];
    clientSegments?: string[];
    minConsumption?: number;
    maxConsumption?: number;
    concessionarias?: string[];
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  estimatedDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
