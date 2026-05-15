// Script para adicionar coluna accessLevel na tabela documents
// Rodar: node add_access_level.js

const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Conectado ao banco.');

  // Verificar se a coluna já existe
  const checkCol = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'accessLevel'
  `);

  if (checkCol.rows.length > 0) {
    console.log('Coluna accessLevel já existe!');
  } else {
    console.log('Adicionando coluna accessLevel...');
    await client.query(`
      ALTER TABLE documents 
      ADD COLUMN "accessLevel" VARCHAR DEFAULT 'public'
    `);
    console.log('✅ Coluna accessLevel adicionada com sucesso!');
  }

  // Verificar se accessChangedById já existe
  const checkCol2 = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'accessChangedById'
  `);

  if (checkCol2.rows.length > 0) {
    console.log('Coluna accessChangedById já existe!');
  } else {
    console.log('Adicionando coluna accessChangedById...');
    await client.query(`
      ALTER TABLE documents 
      ADD COLUMN "accessChangedById" UUID
    `);
    console.log('✅ Coluna accessChangedById adicionada!');
  }

  // Verificar resultado
  const result = await client.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name IN ('accessLevel', 'accessChangedById')
    ORDER BY column_name
  `);
  console.log('\nColunas verificadas:');
  result.rows.forEach(r => {
    console.log(`  ${r.column_name}: ${r.data_type} (default: ${r.column_default || 'null'})`);
  });

  await client.end();
  console.log('\n✅ Migration concluída!');
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
