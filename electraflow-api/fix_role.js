const { Client } = require('pg');

const DB_URL = 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:Exito2026Emg@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const res = await client.query(`
    UPDATE users
    SET role = 'admin', status = 'active', "isActive" = true
    WHERE email = 'exitogrid@gmail.com' AND "deletedAt" IS NULL
    RETURNING id, name, email, role, status, "isActive"
  `);

  if (res.rows.length > 0) {
    const u = res.rows[0];
    console.log('=== ROLE ATUALIZADO ===');
    console.log('Usuario:', u.name);
    console.log('Email:', u.email);
    console.log('Role:', u.role);
    console.log('Status:', u.status);
    console.log('Ativo:', u.isActive);
  } else {
    console.log('Nenhum usuario encontrado.');
  }

  await client.end();
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
