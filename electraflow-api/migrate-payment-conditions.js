const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected');

  // Add paymentConditions column to solar_projects
  const check = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='solar_projects' AND column_name='paymentConditions'`);
  if (check.rows.length === 0) {
    await client.query(`ALTER TABLE solar_projects ADD COLUMN "paymentConditions" TEXT`);
    console.log('✅ Added paymentConditions column');
  } else {
    console.log('ℹ️ paymentConditions already exists');
  }

  await client.end();
  console.log('Done!');
}

migrate().catch(e => { console.error(e); process.exit(1); });
