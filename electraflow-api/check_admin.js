const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:Exito9924Emg136@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Conectado!\n');

  // Buscar conta exitogrid@gmail.com
  const res = await client.query(`
    SELECT id, name, email, role, status, "isActive"
    FROM users
    WHERE email = 'exitogrid@gmail.com'
  `);

  if (res.rows.length === 0) {
    console.log('⚠️ Conta exitogrid@gmail.com não encontrada no banco.');
    console.log('Listando todos os admins existentes:');
    const admins = await client.query(`SELECT id, name, email, role FROM users WHERE role = 'admin' ORDER BY "createdAt"`);
    admins.rows.forEach(r => console.log(JSON.stringify(r)));
  } else {
    console.log('=== SUA CONTA ===');
    console.log(JSON.stringify(res.rows[0]));

    // Garantir que é admin
    if (res.rows[0].role !== 'admin') {
      const upd = await client.query(`
        UPDATE users SET role = 'admin', "updatedAt" = NOW()
        WHERE email = 'exitogrid@gmail.com'
        RETURNING id, name, email, role
      `);
      console.log('\n✅ Role atualizado para admin!');
      console.log(JSON.stringify(upd.rows[0]));
    } else {
      console.log('\n✅ Você já é admin!');
    }
  }

  await client.end();
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
