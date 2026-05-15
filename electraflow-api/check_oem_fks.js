const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });

  await c.connect();
  
  // Check if solar_projects table exists
  const r = await c.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'solar_projects'
  `);
  console.log('solar_projects exists:', r.rows.length > 0);
  
  // Check the FK on oem_usinas for projetoSolarId
  const fks = await c.query(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'oem_usinas' AND tc.constraint_type = 'FOREIGN KEY'
  `);
  console.log('\noem_usinas FKs:', fks.rows);

  await c.end();
}

main().catch(console.error);
