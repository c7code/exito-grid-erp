const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Client } = require('pg');
const c = new Client({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.msuthinujxghpoygotqh',
  password: 'K8mPx2nQvR7tLwY4',
  ssl: { rejectUnauthorized: false }
});
c.connect().then(async () => {
  const tables = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('=== TABELAS NO BANCO ===');
  if (tables.rows.length === 0) {
    console.log('(NENHUMA TABELA ENCONTRADA - banco vazio)');
  } else {
    tables.rows.forEach(r => console.log(' -', r.table_name));
  }
  
  // Check if users table exists and its columns
  const userCols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position");
  if (userCols.rows.length > 0) {
    console.log('\n=== COLUNAS DA TABELA users ===');
    userCols.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
  }
  
  c.end();
}).catch(e => { console.error('ERRO:', e.message); process.exit(1); });
