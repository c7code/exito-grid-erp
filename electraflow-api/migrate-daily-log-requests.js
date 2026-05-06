const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database');

  // Create daily_log_requests table
  const checkReq = await client.query(`SELECT to_regclass('public.daily_log_requests')`);
  if (!checkReq.rows[0].to_regclass) {
    await client.query(`
      CREATE TABLE daily_log_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workId" UUID REFERENCES works(id) ON DELETE CASCADE,
        "dailyLogId" UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
        "createdById" UUID REFERENCES users(id),
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        "requestedTo" VARCHAR(100) NOT NULL,
        "requestedToEmail" VARCHAR(255),
        category VARCHAR(50) DEFAULT 'tecnica',
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pending',
        "requestDate" DATE NOT NULL,
        "resolvedDate" DATE,
        "responseTimeDays" INTEGER,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);
    console.log('✅ Created daily_log_requests table');
  } else {
    console.log('ℹ️ daily_log_requests already exists');
  }

  // Create daily_log_responses table
  const checkResp = await client.query(`SELECT to_regclass('public.daily_log_responses')`);
  if (!checkResp.rows[0].to_regclass) {
    await client.query(`
      CREATE TABLE daily_log_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestId" UUID NOT NULL REFERENCES daily_log_requests(id) ON DELETE CASCADE,
        "respondedBy" VARCHAR(100) NOT NULL,
        "responseDate" DATE NOT NULL,
        content TEXT NOT NULL,
        "attachmentUrl" VARCHAR(500),
        "createdById" UUID REFERENCES users(id),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);
    console.log('✅ Created daily_log_responses table');
  } else {
    console.log('ℹ️ daily_log_responses already exists');
  }

  await client.end();
  console.log('Done!');
}

migrate().catch(e => { console.error(e); process.exit(1); });
