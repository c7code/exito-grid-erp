const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });

  await c.connect();
  const r = await c.query('SELECT id, name, "tradeName", "logoUrl" FROM companies LIMIT 5');
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
}

main().catch(console.error);
