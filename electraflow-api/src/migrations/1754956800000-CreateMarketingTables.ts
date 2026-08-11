import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketingTables1754956800000 implements MigrationInterface {
  name = 'CreateMarketingTables1754956800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela marketing_campaigns (idempotente)
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'marketing_campaigns'
        ) THEN
          CREATE TABLE marketing_campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL,
            description TEXT,
            channel VARCHAR NOT NULL DEFAULT 'other',
            status VARCHAR NOT NULL DEFAULT 'draft',
            goal VARCHAR,
            "startDate" DATE,
            "endDate" DATE,
            budget DECIMAL(14,2) NOT NULL DEFAULT 0,
            "amountSpent" DECIMAL(14,2) NOT NULL DEFAULT 0,
            "targetLeads" INTEGER NOT NULL DEFAULT 0,
            "targetRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
            "responsibleId" UUID,
            notes TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP
          );
        END IF;
      END $$;
    `);

    // Criar tabela marketing_actions (idempotente)
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'marketing_actions'
        ) THEN
          CREATE TABLE marketing_actions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "campaignId" UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
            title VARCHAR NOT NULL,
            description TEXT,
            type VARCHAR NOT NULL DEFAULT 'other',
            status VARCHAR NOT NULL DEFAULT 'planned',
            "scheduledDate" DATE,
            "completedDate" DATE,
            cost DECIMAL(14,2) NOT NULL DEFAULT 0,
            reach INTEGER NOT NULL DEFAULT 0,
            engagements INTEGER NOT NULL DEFAULT 0,
            "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
            "responsibleId" UUID,
            notes TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
          );
        END IF;
      END $$;
    `);

    // Adicionar campaignId em leads (idempotente)
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'leads' AND column_name = 'campaignId'
        ) THEN
          ALTER TABLE leads ADD COLUMN "campaignId" UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE leads DROP COLUMN IF EXISTS "campaignId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS marketing_actions`);
    await queryRunner.query(`DROP TABLE IF EXISTS marketing_campaigns`);
  }
}
