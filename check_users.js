const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:ch86270580982@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Conectado ao Supabase!\n');

  // Verificar usuários
  const usersResult = await client.query(`
    SELECT id, name, email, role, "isActive", status, "deletedAt"
    FROM users
    LIMIT 20
  `);
  console.log('=== USUÁRIOS ===');
  usersResult.rows.forEach(r => console.log(JSON.stringify(r)));

  // Verificar se a tabela existe com as colunas corretas
  const colResult = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log('\n=== COLUNAS DA TABELA USERS ===');
  colResult.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) nullable:${r.is_nullable}`));

  await client.end();
}

main().catch(e => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
