const { Client } = require('pg');

const DB_URL = 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:Exito2026Emg@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Get the latest solar projects with their equipment and kits data
  const res = await client.query(`
    SELECT id, code, title, status, 
           "clientId",
           pg_typeof(equipment) as eq_type,
           pg_typeof("commercialKits") as kits_type,
           equipment IS NULL as eq_null,
           "commercialKits" IS NULL as kits_null,
           CASE WHEN equipment IS NOT NULL THEN LEFT(equipment::text, 200) ELSE 'NULL' END as eq_preview,
           CASE WHEN "commercialKits" IS NOT NULL THEN LEFT("commercialKits"::text, 500) ELSE 'NULL' END as kits_preview,
           "commercialStrategyEnabled",
           "createdAt"
    FROM solar_projects
    WHERE "deletedAt" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 5
  `);

  console.log('=== SOLAR PROJECTS DATA ===\n');
  res.rows.forEach((p, i) => {
    console.log(`--- Project ${i + 1}: ${p.code} (${p.title || 'no title'}) ---`);
    console.log(`  Status: ${p.status}`);
    console.log(`  ClientId: ${p.clientId}`);
    console.log(`  Equipment type: ${p.eq_type} | null: ${p.eq_null}`);
    console.log(`  Equipment preview: ${p.eq_preview}`);
    console.log(`  CommercialKits type: ${p.kits_type} | null: ${p.kits_null}`);
    console.log(`  CommercialKits preview: ${p.kits_preview}`);
    console.log(`  commercialStrategyEnabled: ${p.commercialStrategyEnabled}`);
    console.log('');
  });

  // Also check column types
  const cols = await client.query(`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'solar_projects' 
    AND column_name IN ('equipment', 'commercialKits', 'commercialStrategyEnabled', 'paymentConditions')
  `);
  console.log('=== COLUMN TYPES ===');
  cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (${c.udt_name})`));

  await client.end();
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
