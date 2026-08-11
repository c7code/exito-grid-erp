const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DB_URL = 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:Exito2026Emg@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  console.log('=== LISTANDO USUARIOS ===\n');
  
  // List all users with relevant fields
  const res = await client.query(`
    SELECT id, name, email, role, "isActive", status, "lastLoginAt", "createdAt"
    FROM users
    WHERE "deletedAt" IS NULL
    ORDER BY "createdAt" DESC
  `);
  
  res.rows.forEach((u, i) => {
    console.log(`${i + 1}. ${u.name} | ${u.email} | role: ${u.role} | active: ${u.isActive} | status: ${u.status} | lastLogin: ${u.lastLoginAt || 'never'}`);
  });
  
  console.log(`\nTotal: ${res.rows.length} usuarios\n`);
  
  // Reset password for exitogrid@gmail.com
  const NEW_PASSWORD = '@94103581Awn';
  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);
  
  const update = await client.query(`
    UPDATE users
    SET password = $1, "isActive" = true, status = 'active'
    WHERE email = 'exitogrid@gmail.com' AND "deletedAt" IS NULL
    RETURNING id, name, email, role, "isActive", status
  `, [hashed]);
  
  if (update.rows.length > 0) {
    console.log('=== SENHA RESETADA COM SUCESSO ===');
    console.log('Usuario:', update.rows[0].name);
    console.log('Email:', update.rows[0].email);
    console.log('Nova senha:', NEW_PASSWORD);
    console.log('Status:', update.rows[0].status);
    console.log('Ativo:', update.rows[0].isActive);
  } else {
    console.log('AVISO: Nenhum usuario encontrado com email exitogrid@gmail.com');
  }
  
  await client.end();
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
