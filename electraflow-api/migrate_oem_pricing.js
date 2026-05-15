const { Client } = require('pg');

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres' });
  await client.connect();
  console.log('Connected to database');

  const queries = [
    // oem_usinas: new columns
    `ALTER TABLE oem_usinas ADD COLUMN IF NOT EXISTS "geracaoMensalAtualKwh" DECIMAL(10,2)`,
    `ALTER TABLE oem_usinas ADD COLUMN IF NOT EXISTS "tarifaEnergiaRsKwh" DECIMAL(8,4)`,
    // proposals: pricing engine data
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS "pricingEngineData" TEXT`,
  ];

  for (const q of queries) {
    try {
      await client.query(q);
      console.log('✅', q.substring(0, 80));
    } catch (err) {
      console.log('⚠️', err.message, '|', q.substring(0, 80));
    }
  }

  // Verify
  const res1 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'oem_usinas' AND column_name IN ('geracaoMensalAtualKwh', 'tarifaEnergiaRsKwh')`);
  console.log('\noem_usinas new cols:', res1.rows.map(r => r.column_name));

  const res2 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'proposals' AND column_name = 'pricingEngineData'`);
  console.log('proposals new cols:', res2.rows.map(r => r.column_name));

  await client.end();
  console.log('\n✅ Migration complete!');
}

migrate().catch(err => { console.error('FATAL:', err); process.exit(1); });
