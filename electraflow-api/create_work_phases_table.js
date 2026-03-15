const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Create work_phases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS work_phases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workId" UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        weight DECIMAL(5,2) DEFAULT 0,
        "order" INT DEFAULT 0,
        progress INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ
      );
    `);
    console.log('✅ work_phases table created');

    // Add phaseId column to tasks table if not exists
    const col = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'phaseId';
    `);
    if (col.rows.length === 0) {
      await client.query(`ALTER TABLE tasks ADD COLUMN "phaseId" UUID;`);
      console.log('✅ phaseId column added to tasks');
    } else {
      console.log('ℹ️ phaseId column already exists in tasks');
    }

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
