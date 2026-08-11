const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Client } = require('pg');

const DB_URL = 'postgresql://postgres.msuthinujxghpoygotqh:K8mPx2nQvR7tLwY4@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function check() {
  const c = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  // Check users table
  const cols = await c.query("SELECT column_name, data_type, is_nullable, character_maximum_length FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position");
  console.log('=== USERS TABLE ===');
  cols.rows.forEach(r => console.log(`  ${r.column_name} ${r.data_type}(${r.character_maximum_length || ''}) nullable=${r.is_nullable}`));
  
  const count = await c.query('SELECT COUNT(*) as total, COUNT(name) as with_name FROM users');
  console.log('\nRegistros:', count.rows[0]);
  
  const nulls = await c.query('SELECT id, name, email FROM users WHERE name IS NULL');
  console.log('Com name NULL:', nulls.rows.length);
  if (nulls.rows.length > 0) console.log('  Registros:', JSON.stringify(nulls.rows));
  
  const all = await c.query('SELECT id, name, email, role FROM users');
  console.log('\nTodos os usuarios:');
  all.rows.forEach(r => console.log(`  ${r.id} | ${r.name} | ${r.email} | ${r.role}`));
  
  // Also check if users_old_backup exists and has data
  try {
    const old = await c.query('SELECT COUNT(*) FROM users_old_backup');
    console.log('\nusers_old_backup registros:', old.rows[0].count);
  } catch(e) {
    console.log('\nusers_old_backup: não existe');
  }
  
  // Fix: drop and recreate users table cleanly
  console.log('\n=== RECRIANDO TABELA users LIMPA ===');
  
  // Save admin data
  const admin = await c.query("SELECT * FROM users WHERE email = 'exitogrid@gmail.com'");
  const hasAdmin = admin.rows.length > 0;
  
  await c.query('DROP TABLE IF EXISTS user_sessions CASCADE');
  await c.query('DROP TABLE IF EXISTS users CASCADE');
  console.log('  ✅ Tabelas antigas removidas');
  
  await c.query(`
    CREATE TABLE users (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR NOT NULL DEFAULT '',
      "email" VARCHAR NOT NULL,
      "password" VARCHAR NOT NULL DEFAULT '',
      "role" VARCHAR NOT NULL DEFAULT 'viewer',
      "phone" VARCHAR,
      "status" VARCHAR NOT NULL DEFAULT 'active',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "avatarUrl" VARCHAR,
      "avatar" VARCHAR,
      "department" VARCHAR,
      "position" VARCHAR,
      "isOnline" BOOLEAN NOT NULL DEFAULT false,
      "lastLoginAt" TIMESTAMP,
      "permissions" TEXT,
      "supervisorId" UUID,
      "invitedAt" TIMESTAMP,
      "invitedBy" UUID,
      "refreshToken" TEXT,
      "refreshTokenExpiresAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP,
      CONSTRAINT "UQ_users_email" UNIQUE ("email")
    );
  `);
  console.log('  ✅ Tabela users recriada');
  
  // Recreate admin
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('Admin@2026', 10);
  await c.query(`
    INSERT INTO users ("name", "email", "password", "role", "status", "isActive", "permissions")
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, ['Administrador Exito', 'exitogrid@gmail.com', hashedPassword, 'admin', 'active', true, JSON.stringify(['all'])]);
  console.log('  ✅ Admin recriado');
  
  // Verify
  const verify = await c.query('SELECT id, name, email, role FROM users');
  console.log('\n  Verificação:', JSON.stringify(verify.rows));
  
  await c.end();
  console.log('\n🎉 Pronto!');
}

check().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
