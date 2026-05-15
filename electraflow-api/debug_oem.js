const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });

  await c.connect();
  
  // Check table structure
  const cols = await c.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'oem_usinas'
    ORDER BY ordinal_position
  `);
  console.log('=== oem_usinas columns ===');
  cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'} ${r.column_default || ''}`));
  
  // Check constraints
  const constraints = await c.query(`
    SELECT conname, contype, pg_get_constraintdef(oid) as def
    FROM pg_constraint 
    WHERE conrelid = 'oem_usinas'::regclass
  `);
  console.log('\n=== oem_usinas constraints ===');
  constraints.rows.forEach(r => console.log(`  ${r.conname}: ${r.def}`));

  // Try a test insert
  console.log('\n=== Test insert ===');
  try {
    // First get a client ID
    const clients = await c.query('SELECT id FROM clients LIMIT 1');
    if (clients.rows.length === 0) {
      console.log('No clients found!');
      await c.end();
      return;
    }
    const clientId = clients.rows[0].id;
    console.log('Using client:', clientId);

    const result = await c.query(`
      INSERT INTO oem_usinas ("clienteId", "nome", "potenciaKwp", "qtdModulos", "dataInstalacao", "endereco")
      VALUES ($1, 'Test Usina', 5.5, 10, '2026-01-01', 'Rua Teste')
      RETURNING id
    `, [clientId]);
    console.log('Insert OK! ID:', result.rows[0].id);
    
    // Clean up
    await c.query('DELETE FROM oem_usinas WHERE id = $1', [result.rows[0].id]);
    console.log('Cleaned up test row');
  } catch (err) {
    console.error('Insert error:', err.message);
    console.error('Detail:', err.detail);
  }
  
  await c.end();
}

main().catch(console.error);
