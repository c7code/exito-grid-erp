const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database');
  
  // Add parentId column to work_phases if it doesn't exist
  const check = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'work_phases' AND column_name = 'parentId'
  `);
  
  if (check.rows.length === 0) {
    await client.query(`ALTER TABLE work_phases ADD COLUMN "parentId" UUID NULL`);
    console.log('✅ Added parentId column to work_phases');
  } else {
    console.log('ℹ️ parentId column already exists');
  }
  
  await client.end();
  console.log('Done!');
}

migrate().catch(e => { console.error(e); process.exit(1); });
