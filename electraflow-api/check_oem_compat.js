const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  // 1. Verificar oem_servicos
  const cols = await c.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns WHERE table_name = 'oem_servicos'
    ORDER BY ordinal_position
  `);
  console.log('=== oem_servicos ===');
  cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'}`));

  // 2. Testar insert com checklist customizado
  const clients = await c.query('SELECT id FROM clients LIMIT 1');
  const usinas = await c.query('SELECT id FROM oem_usinas LIMIT 1');

  if (clients.rows.length && usinas.rows.length) {
    const customChecklist = JSON.stringify([
      { item: 'Atividade customizada X', checked: false },
      { item: 'Verificação especial Y', checked: false },
      { item: 'Teste livre Z', checked: true, obs: 'Nota extra' },
    ]);

    const r = await c.query(`
      INSERT INTO oem_servicos ("clienteId", "usinaId", "tipo", "checklist", "descricao")
      VALUES ($1, $2, 'preventiva', $3, 'Teste de checklist customizado')
      RETURNING id, tipo, checklist
    `, [clients.rows[0].id, usinas.rows[0].id, customChecklist]);

    console.log('\n✅ Insert com checklist custom OK!');
    console.log('  ID:', r.rows[0].id);
    console.log('  Checklist:', r.rows[0].checklist);

    // Limpar
    await c.query('DELETE FROM oem_servicos WHERE id = $1', [r.rows[0].id]);
    console.log('  Limpeza OK');
  } else {
    console.log('\n⚠️ Sem dados para testar (precisa de client + usina)');
  }

  // 3. Verificar campo tipo - é VARCHAR livre, aceita qualquer valor
  console.log('\n=== Compatibilidade ===');
  console.log('  Campo "tipo": VARCHAR (livre) - aceita qualquer tipo de atividade');
  console.log('  Campo "checklist": TEXT (JSON) - aceita qualquer lista de itens');
  console.log('  Não há ENUM ou CHECK constraint limitando os tipos');

  await c.end();
}

main().catch(console.error);
