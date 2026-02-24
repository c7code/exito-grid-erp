import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Work } from '../works/work.entity';

export enum ProcessStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
}

@Entity('processes')
export class Process {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  workId: string;

  @OneToOne(() => Work, work => work.process)
  @JoinColumn({ name: 'workId' })
  work: Work;

  @Column({ type: 'enum', enum: ProcessStatus, default: ProcessStatus.NOT_STARTED })
  status: ProcessStatus;

  @Column({ default: 0 })
  progress: number;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProcessStage, stage => stage.process, { cascade: true })
  stages: ProcessStage[];
}

@Entity('process_stages')
export class ProcessStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  order: number;

  @Column({ nullable: true })
  processId: string;

  @ManyToOne(() => Process, process => process.stages)
  @JoinColumn({ name: 'processId' })
  process: Process;

  @Column({ type: 'enum', enum: ProcessStatus, default: ProcessStatus.NOT_STARTED })
  status: ProcessStatus;

  @Column({ nullable: true })
  assignedToId: string;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChecklistItem, item => item.stage, { cascade: true })
  checklist: ChecklistItem[];
}

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  stageId: string;

  @ManyToOne(() => ProcessStage, stage => stage.checklist)
  @JoinColumn({ name: 'stageId' })
  stage: ProcessStage;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  completedById: string;

  @Column({ nullable: true })
  documentRequired: string;

  @Column({ nullable: true })
  documentUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
