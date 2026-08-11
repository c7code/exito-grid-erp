require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();
  
  console.log('=== Executando migração de colunas documents ===\n');
  
  // 1. Verificar estado atual
  const before = await c.query(`
    SELECT column_name, udt_name FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name IN ('clientId', 'proposalId', 'contractId')
    ORDER BY column_name
  `);
  console.log('ANTES:');
  before.rows.forEach(r => console.log(`  ${r.column_name}: ${r.udt_name}`));
  
  // 2. Converter clientId de varchar para uuid
  try {
    const check = await c.query(`
      SELECT udt_name FROM information_schema.columns 
      WHERE table_name='documents' AND column_name='clientId'
    `);
    if (check.rows[0]?.udt_name !== 'uuid') {
      // Drop FK se existir
      try {
        await c.query(`ALTER TABLE documents DROP CONSTRAINT IF EXISTS "FK_document_client"`);
      } catch(e) {}
      
      // Converter coluna
      await c.query(`ALTER TABLE documents ALTER COLUMN "clientId" TYPE UUID USING "clientId"::uuid`);
      console.log('\n✅ documents.clientId convertido para UUID');
    } else {
      console.log('\n✅ documents.clientId já é UUID');
    }
  } catch(e) {
    console.error('❌ Erro ao converter clientId:', e.message);
  }
  
  // 3. Converter proposalId
  try {
    const check = await c.query(`
      SELECT udt_name FROM information_schema.columns 
      WHERE table_name='documents' AND column_name='proposalId'
    `);
    if (check.rows[0]?.udt_name !== 'uuid') {
      await c.query(`ALTER TABLE documents ALTER COLUMN "proposalId" TYPE UUID USING CASE WHEN "proposalId" ~ '^[0-9a-f]{8}-' THEN "proposalId"::uuid ELSE NULL END`);
      console.log('✅ documents.proposalId convertido para UUID');
    } else {
      console.log('✅ documents.proposalId já é UUID');
    }
  } catch(e) {
    console.error('❌ Erro ao converter proposalId:', e.message);
  }
  
  // 4. Converter contractId
  try {
    const check = await c.query(`
      SELECT udt_name FROM information_schema.columns 
      WHERE table_name='documents' AND column_name='contractId'
    `);
    if (check.rows[0]?.udt_name !== 'uuid') {
      await c.query(`ALTER TABLE documents ALTER COLUMN "contractId" TYPE UUID USING CASE WHEN "contractId" ~ '^[0-9a-f]{8}-' THEN "contractId"::uuid ELSE NULL END`);
      console.log('✅ documents.contractId convertido para UUID');
    } else {
      console.log('✅ documents.contractId já é UUID');
    }
  } catch(e) {
    console.error('❌ Erro ao converter contractId:', e.message);
  }
  
  // 5. Criar FK constraint
  try {
    await c.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_document_client') THEN
          ALTER TABLE documents ADD CONSTRAINT "FK_document_client" FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    console.log('✅ FK constraint FK_document_client criada');
  } catch(e) {
    console.error('❌ Erro ao criar FK:', e.message);
  }
  
  // 6. Verificar estado final
  const after = await c.query(`
    SELECT column_name, udt_name FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name IN ('clientId', 'proposalId', 'contractId')
    ORDER BY column_name
  `);
  console.log('\nDEPOIS:');
  after.rows.forEach(r => console.log(`  ${r.column_name}: ${r.udt_name}`));
  
  // 7. Verificar FK
  const fks = await c.query(`
    SELECT constraint_name, column_name FROM (
      SELECT tc.constraint_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'documents' AND tc.constraint_type = 'FOREIGN KEY'
    ) t ORDER BY constraint_name
  `);
  console.log('\nFK Constraints:');
  fks.rows.forEach(r => console.log(`  ${r.constraint_name}: ${r.column_name}`));
  
  await c.end();
  console.log('\n=== Migração concluída ===');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
