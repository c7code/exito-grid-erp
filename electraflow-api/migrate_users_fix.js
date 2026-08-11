/**
 * Script de migração: corrige tabela users e cria usuário admin
 * Roda uma vez para configurar o banco do ERP Electraflow
 */
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DB_URL = 'postgresql://postgres.msuthinujxghpoygotqh:K8mPx2nQvR7tLwY4@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function migrate() {
  const client = new Client({ 
    connectionString: DB_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  
  await client.connect();
  console.log('✅ Conectado ao banco de dados');

  // 1. Verificar se a tabela users atual é do ERP ou de outro sistema
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='users'
    ORDER BY ordinal_position
  `);
  const colNames = cols.rows.map(r => r.column_name);
  console.log('\n📋 Colunas atuais da tabela users:', colNames.join(', '));

  const isERPTable = colNames.includes('role') && colNames.includes('isActive');
  
  if (!isERPTable) {
    console.log('\n⚠️  Tabela users NÃO é do ERP. Renomeando para users_old_backup...');
    
    // Verificar se já existe backup
    const backupExists = await client.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='users_old_backup')
    `);
    
    if (backupExists.rows[0].exists) {
      console.log('   Backup anterior encontrado, removendo...');
      await client.query('DROP TABLE IF EXISTS users_old_backup CASCADE');
    }
    
    await client.query('ALTER TABLE users RENAME TO users_old_backup');
    console.log('   ✅ Tabela antiga renomeada para users_old_backup');
  }

  // 2. Criar tabela users do ERP (se não existir)
  console.log('\n🔧 Criando tabela users do ERP...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(255) NOT NULL,
      "email" VARCHAR(255) UNIQUE NOT NULL,
      "password" VARCHAR(255) NOT NULL,
      "role" VARCHAR(50) NOT NULL DEFAULT 'viewer',
      "phone" VARCHAR(50),
      "status" VARCHAR(50) NOT NULL DEFAULT 'active',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "avatarUrl" TEXT,
      "avatar" TEXT,
      "department" VARCHAR(255),
      "position" VARCHAR(255),
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
      CONSTRAINT "FK_users_supervisor" FOREIGN KEY ("supervisorId") REFERENCES users("id") ON DELETE SET NULL
    );
  `);
  console.log('   ✅ Tabela users criada');

  // 3. Criar tabela user_sessions (se não existir)
  console.log('\n🔧 Criando tabela user_sessions...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL,
      "loginAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "logoutAt" TIMESTAMP,
      "lastHeartbeat" TIMESTAMP NOT NULL DEFAULT NOW(),
      "durationMinutes" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      CONSTRAINT "FK_user_sessions_user" FOREIGN KEY ("userId") REFERENCES users("id") ON DELETE CASCADE
    );
  `);
  console.log('   ✅ Tabela user_sessions criada');

  // 4. Criar usuário admin padrão
  console.log('\n👤 Criando usuário admin...');
  const adminEmail = 'exitogrid@gmail.com';
  const adminPassword = 'Admin@2026';
  
  const existingAdmin = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  
  if (existingAdmin.rows.length === 0) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await client.query(`
      INSERT INTO users ("name", "email", "password", "role", "status", "isActive", "permissions")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'Administrador Exito',
      adminEmail,
      hashedPassword,
      'admin',
      'active',
      true,
      JSON.stringify(['all'])
    ]);
    console.log('   ✅ Usuário admin criado:');
    console.log('      📧 Email: ' + adminEmail);
    console.log('      🔑 Senha: ' + adminPassword);
  } else {
    console.log('   ℹ️  Usuário admin já existe, atualizando senha...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await client.query(`
      UPDATE users SET "password" = $1, "role" = 'admin', "isActive" = true, "status" = 'active'
      WHERE email = $2
    `, [hashedPassword, adminEmail]);
    console.log('      ✅ Senha atualizada para: ' + adminPassword);
  }

  // 5. Verificar resultado
  console.log('\n📊 Verificação final:');
  const userCount = await client.query('SELECT COUNT(*) FROM users');
  console.log('   Total de usuários:', userCount.rows[0].count);
  
  const finalCols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='users'
    ORDER BY ordinal_position
  `);
  console.log('   Colunas da tabela users:');
  finalCols.rows.forEach(r => console.log(`     - ${r.column_name} (${r.data_type})`));

  await client.end();
  console.log('\n🎉 Migração concluída com sucesso!');
}

migrate().catch(e => {
  console.error('\n❌ ERRO na migração:', e.message);
  process.exit(1);
});
