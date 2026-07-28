import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeasurementNewFields1753732800000 implements MigrationInterface {
    name = 'AddMeasurementNewFields1753732800000';

    async up(queryRunner: QueryRunner): Promise<void> {
        // Adiciona novas colunas com verificacao IF NOT EXISTS — idempotente
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='measurements' AND column_name='measurementType'
                ) THEN
                    ALTER TABLE measurements ADD COLUMN "measurementType" varchar NOT NULL DEFAULT 'contract';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='measurements' AND column_name='additiveValue'
                ) THEN
                    ALTER TABLE measurements ADD COLUMN "additiveValue" decimal(15,2) DEFAULT 0;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='measurements' AND column_name='additiveDescription'
                ) THEN
                    ALTER TABLE measurements ADD COLUMN "additiveDescription" varchar;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='measurements' AND column_name='includeMemorial'
                ) THEN
                    ALTER TABLE measurements ADD COLUMN "includeMemorial" boolean NOT NULL DEFAULT false;
                END IF;
            END $$;
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE measurements
                DROP COLUMN IF EXISTS "measurementType",
                DROP COLUMN IF EXISTS "additiveValue",
                DROP COLUMN IF EXISTS "additiveDescription",
                DROP COLUMN IF EXISTS "includeMemorial"
        `);
    }
}
