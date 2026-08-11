const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://postgres.msuthinujxghpoygotqh:K8mPx2nQvR7tLwY4@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

c.connect().then(async () => {
  // 1. Ver colunas da tabela budgets
  const cols = await c.query(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='budgets' ORDER BY ordinal_position"
  );
  console.log('=== COLUNAS budgets ===');
  cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) nullable=${r.is_nullable}`));
  
  // 2. Contar registros
  const count = await c.query('SELECT COUNT(*) FROM budgets');
  console.log('\nTotal registros:', count.rows[0].count);
  
  // 3. Ver registros com name NULL
  const nullNames = await c.query('SELECT id, name FROM budgets WHERE name IS NULL LIMIT 5');
  console.log('Registros com name NULL:', nullNames.rows.length);
  
  // 4. Ver amostra de dados
  const sample = await c.query('SELECT id, name FROM budgets LIMIT 3');
  console.log('Amostra:', JSON.stringify(sample.rows));
  
  // 5. FIX: preencher name NULL
  const fixed = await c.query("UPDATE budgets SET name = 'Orçamento ' || id WHERE name IS NULL");
  console.log('\n✅ Registros corrigidos:', fixed.rowCount);
  
  c.end();
}).catch(e => { console.error('ERRO:', e.message); process.exit(1); });
