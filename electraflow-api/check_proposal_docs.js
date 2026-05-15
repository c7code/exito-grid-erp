// check_proposal_docs.js
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Conectado ao banco!\n');

  // 1. Verificar colunas da tabela documents
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'documents'
    ORDER BY ordinal_position
  `);
  console.log('=== COLUNAS da tabela documents ===');
  console.log(cols.rows.map(r => r.column_name).join(', '));

  // 2. Verificar se existe a coluna purpose
  const hasPurpose = cols.rows.some(r => r.column_name === 'purpose');
  const hasProposalId = cols.rows.some(r => r.column_name === 'proposalId');
  console.log(`\n  → Coluna "purpose": ${hasPurpose ? '✅ existe' : '❌ NÃO existe'}`);
  console.log(`  → Coluna "proposalId": ${hasProposalId ? '✅ existe' : '❌ NÃO existe'}`);

  // 3. Últimos 10 documentos e seus campos relevantes
  const recent = await client.query(`
    SELECT id, name, "proposalId", purpose, "mimeType", "createdAt"
    FROM documents
    WHERE "deletedAt" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 10
  `);
  console.log(`\n=== ÚLTIMOS 10 DOCUMENTOS ===`);
  recent.rows.forEach(r => {
    const propId = r.proposalId ? r.proposalId.substring(0,8) + '...' : 'null';
    console.log(`  ${r.name} | purpose=${r.purpose || 'null'} | proposalId=${propId} | ${String(r.createdAt).substring(0,16)}`);
  });

  // 4. Documentos com proposalId não nulo
  const withProposal = await client.query(`
    SELECT id, name, "proposalId", purpose, "createdAt"
    FROM documents
    WHERE "proposalId" IS NOT NULL AND "deletedAt" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 20
  `);
  console.log(`\n=== DOCUMENTOS COM proposalId (${withProposal.rows.length} total) ===`);
  withProposal.rows.forEach(r => {
    console.log(`  [${r.purpose || 'sem_purpose'}] ${r.name} → ${r.proposalId}`);
  });

  // 5. Documentos com purpose = proposal_external
  const external = await client.query(`
    SELECT id, name, "proposalId", purpose FROM documents
    WHERE purpose = 'proposal_external' AND "deletedAt" IS NULL
  `);
  console.log(`\n=== DOCUMENTOS proposal_external (${external.rows.length}) ===`);
  if (external.rows.length === 0) {
    console.log('  ⚠️  NENHUM encontrado! Possíveis causas:');
    console.log('  1. O arquivo foi enviado mas sem purpose=proposal_external');
    console.log('  2. O deploy ainda não entrou em produção');
    console.log('  3. O campo purpose não foi enviado no FormData');
  } else {
    external.rows.forEach(r => console.log(`  ✅ ${r.name} → proposta: ${r.proposalId}`));
  }

  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
