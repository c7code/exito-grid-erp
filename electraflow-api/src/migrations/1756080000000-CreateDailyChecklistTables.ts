import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDailyChecklistTables1756080000000 implements MigrationInterface {
  name = "CreateDailyChecklistTables1756080000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_checklists'
        ) THEN
          CREATE TABLE daily_checklists (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            date DATE NOT NULL,
            title VARCHAR,
            notes TEXT,
            "userId" UUID,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_checklist_items'
        ) THEN
          CREATE TABLE daily_checklist_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "checklistId" UUID NOT NULL REFERENCES daily_checklists(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            type VARCHAR NOT NULL DEFAULT 'task',
            done BOOLEAN NOT NULL DEFAULT false,
            "order" INTEGER NOT NULL DEFAULT 0,
            priority VARCHAR NOT NULL DEFAULT 'medium',
            notes TEXT,
            "completedAt" TIMESTAMP,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
          );
        END IF;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS daily_checklist_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS daily_checklists`);
  }
}
