const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:Exito2026Emg@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
  });
  await c.connect();
  console.log('Conectado ao Supabase!');

  // === Criar colunas faltantes ===
  
  const migrations = [
    // fiscal_config
    "ALTER TABLE fiscal_config ADD COLUMN IF NOT EXISTS \"companyBairro\" varchar",
    "ALTER TABLE fiscal_config ADD COLUMN IF NOT EXISTS \"companyPhone\" varchar",
    "ALTER TABLE fiscal_config ADD COLUMN IF NOT EXISTS \"companyEmail\" varchar",
    "ALTER TABLE fiscal_config ADD COLUMN IF NOT EXISTS \"defaultPaymentType\" varchar DEFAULT '01'",
    
    // notifications
    "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS \"link\" varchar",
    
    // tasks
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS \"rejectionReason\" varchar",
    
    // leads - opportunityId (FIX 12)
    "ALTER TABLE leads ADD COLUMN IF NOT EXISTS \"opportunityId\" uuid",
  ];

  console.log('\n=== APLICANDO MIGRACOES ===');
  for (const sql of migrations) {
    try {
      await c.query(sql);
      var col = sql.match(/"(\w+)"/g);
      console.log('OK  ' + sql.split('ADD COLUMN')[0].replace('ALTER TABLE ', '').trim() + '.' + (col ? col[col.length - 1] : ''));
    } catch (e) {
      console.log('ERRO  ' + e.message);
    }
  }

  // === Verificar resultado ===
  console.log('\n=== VERIFICACAO FINAL ===');
  var cols = await c.query(
    "SELECT table_name, column_name, data_type FROM information_schema.columns " +
    "WHERE (table_name = 'fiscal_config' AND column_name IN ('companyBairro', 'companyPhone', 'companyEmail', 'defaultPaymentType')) " +
    "OR (table_name = 'notifications' AND column_name = 'link') " +
    "OR (table_name = 'tasks' AND column_name = 'rejectionReason') " +
    "OR (table_name = 'leads' AND column_name = 'opportunityId') " +
    "ORDER BY table_name, column_name"
  );

  cols.rows.forEach(function(r) {
    console.log('OK  ' + r.table_name + '.' + r.column_name + ' (' + r.data_type + ')');
  });
  console.log('\nTotal colunas criadas: ' + cols.rows.length + '/7');

  await c.end();
  console.log('\nMigracao concluida!');
}

main().catch(function(e) { console.error('ERRO: ' + e.message); process.exit(1); });
