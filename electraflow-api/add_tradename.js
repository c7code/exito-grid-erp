const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  // Add tradeName column to clients if not exists
  try {
    const check = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tradeName'`);
    if (check.rows.length === 0) {
      await client.query(`ALTER TABLE "clients" ADD COLUMN "tradeName" VARCHAR DEFAULT NULL`);
      console.log('✅ Added tradeName to clients');
    } else {
      console.log('✓ tradeName already exists in clients');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Check proposals table for issues
  try {
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'proposals' ORDER BY ordinal_position`);
    console.log('\n📋 Proposals columns:', res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error('Error checking proposals:', err.message);
  }

  await client.end();
}
run().catch(console.error);
