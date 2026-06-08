import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_categories')
export class SystemCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  group: string;

  @Column({ type: 'varchar' })
  value: string;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'text', nullable: true, default: '{}' })
  config: string; // JSON stringified

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
