const { Client } = require('pg');

async function run() {
  const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
  await c.connect();
  console.log('Connected to Supabase');
  
  await c.query('ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS "showGroupTitle" boolean DEFAULT true;');
  console.log('OK - Column showGroupTitle added to proposal_items');
  
  await c.end();
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
