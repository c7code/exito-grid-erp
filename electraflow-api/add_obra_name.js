const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:ch86270580982@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Conectado ao Supabase...');

  const res = await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS "obraName" varchar;`);
  console.log('✅ Coluna obraName adicionada com sucesso! Resultado:', res.command);

  await client.end();
}

run().catch(err => {
  console.error('❌ Erro:', err.message);
  client.end();
});
