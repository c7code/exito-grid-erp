const { Client } = require('./node_modules/pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  await client.query('ALTER TABLE structure_templates ADD COLUMN IF NOT EXISTS "markupPercent" decimal(5,2) DEFAULT 0');
  console.log('✅ markupPercent adicionado em structure_templates');
  const check = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='structure_templates' AND column_name='markupPercent'");
  console.log('Verificado:', JSON.stringify(check.rows[0]));
  await client.end();
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
