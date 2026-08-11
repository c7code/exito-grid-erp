const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:Exito9924Emg136@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Conectado ao Supabase!\n');

  // 1. Buscar a usuária pelo nome
  const findResult = await client.query(`
    SELECT id, name, email, role, status, "isActive"
    FROM users
    WHERE LOWER(name) LIKE '%rhayanna%'
       OR LOWER(email) LIKE '%rhayanna%'
  `);

  if (findResult.rows.length === 0) {
    console.log('❌ Usuária "rhayanna" não encontrada.');
    await client.end();
    return;
  }

  console.log('=== USUÁRIA ENCONTRADA ===');
  findResult.rows.forEach(r => console.log(JSON.stringify(r)));
  console.log('');

  // 2. Atualizar o role para admin
  const userId = findResult.rows[0].id;
  const updateResult = await client.query(`
    UPDATE users
    SET role = 'admin', "updatedAt" = NOW()
    WHERE id = $1
    RETURNING id, name, email, role
  `, [userId]);

  console.log('✅ Role atualizado com sucesso!');
  console.log(JSON.stringify(updateResult.rows[0]));

  await client.end();
}

main().catch(e => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
