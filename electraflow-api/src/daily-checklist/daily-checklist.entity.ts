import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from "typeorm";

@Entity("daily_checklists")
export class DailyChecklist {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "varchar", nullable: true })
  title: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "uuid", nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

@Entity("daily_checklist_items")
export class DailyChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  checklistId: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "varchar", default: "task" })
  type: string;

  @Column({ type: "boolean", default: false })
  done: boolean;

  @Column({ type: "int", default: 0 })
  order: number;

  @Column({ type: "varchar", default: "medium" })
  priority: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
