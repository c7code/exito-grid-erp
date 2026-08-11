/**
 * Fix: preencher valores NULL em colunas que o TypeORM vai marcar como NOT NULL
 * Isso permite que o synchronize rode sem erros
 */
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Client } = require('pg');

const DB_URL = 'postgresql://postgres.msuthinujxghpoygotqh:K8mPx2nQvR7tLwY4@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function fixNulls() {
  const client = new Client({ 
    connectionString: DB_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  
  await client.connect();
  console.log('✅ Conectado ao banco');

  // Lista de fixes: [tabela, coluna, valor_default]
  const fixes = [
    // budgets
    ['budgets', 'name', 'Orçamento sem nome'],
    ['budgets', 'status', 'draft'],
    ['budgets', 'totalCost', '0'],
    ['budgets', 'totalPrice', '0'],
    
    // Outras tabelas que podem ter problemas similares
    ['categories', 'name', 'Sem categoria'],
    ['equipment_checklists', 'name', 'Checklist'],
    ['equipment_custom_options', 'name', 'Opção'],
    ['equipment_daily_expenses', 'description', 'Despesa'],
    ['equipment_daily_logs', 'status', 'draft'],
    ['equipment_documents', 'name', 'Documento'],
    ['equipment_services', 'name', 'Serviço'],
    ['oem_contratos', 'nome', 'Contrato'],
    ['oem_contratos', 'status', 'ativo'],
    ['oem_planos', 'nome', 'Plano'],
    ['oem_servicos', 'descricao', 'Serviço OEM'],
    ['oem_usinas', 'nome', 'Usina'],
    ['partner_requests', 'name', 'Solicitação'],
    ['partner_requests', 'status', 'pending'],
    ['partner_request_messages', 'message', ''],
    ['portal_publications', 'title', 'Publicação'],
    ['referral_consultants', 'name', 'Consultor'],
    ['referral_consultants', 'email', 'sem@email.com'],
    ['referral_leads', 'name', 'Lead'],
    ['referral_commissions', 'status', 'pending'],
    ['simulation_sessions', 'status', 'draft'],
    ['structure_templates', 'name', 'Template'],
    ['structure_template_items', 'name', 'Item'],
    ['system_categories', 'name', 'Categoria'],
    ['system_categories', 'module', 'general'],
    ['document_folder_categories', 'name', 'Pasta'],
    ['sinapi_compositions', 'code', '0'],
    ['sinapi_compositions', 'description', 'Composição SINAPI'],
    ['sinapi_inputs', 'code', '0'],
    ['sinapi_inputs', 'description', 'Insumo SINAPI'],
    ['sinapi_configs', 'name', 'Config'],
  ];

  let fixCount = 0;
  for (const [table, column, defaultVal] of fixes) {
    try {
      // Verificar se a tabela e coluna existem
      const exists = await client.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name=$1 AND column_name=$2
      `, [table, column]);
      
      if (exists.rows.length > 0) {
        const result = await client.query(
          `UPDATE "${table}" SET "${column}" = $1 WHERE "${column}" IS NULL`,
          [defaultVal]
        );
        if (result.rowCount > 0) {
          console.log(`  ✅ ${table}.${column}: ${result.rowCount} registro(s) corrigido(s)`);
          fixCount += result.rowCount;
        }
      }
    } catch (e) {
      // Ignorar erros de tabelas/colunas que não existem
    }
  }

  // Fix genérico: encontrar TODAS as colunas varchar/text com nulls em tabelas existentes
  console.log('\n🔍 Buscando outras colunas com nulls potencialmente problemáticas...');
  const allTables = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name
  `);
  
  for (const row of allTables.rows) {
    const table = row.table_name;
    // Pular tabelas de backup e tabelas do sistema
    if (table.includes('_old_') || table.includes('_backup')) continue;
    
    try {
      const cols = await client.query(`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_schema='public' AND table_name=$1 
          AND is_nullable='YES'
          AND data_type IN ('character varying', 'text')
          AND column_name IN ('name', 'title', 'status', 'type', 'code', 'description', 'email')
      `, [table]);
      
      for (const col of cols.rows) {
        const defaultVal = col.column_name === 'status' ? 'active' 
          : col.column_name === 'type' ? 'other'
          : col.column_name === 'email' ? 'sem@email.com'
          : 'N/A';
        
        const result = await client.query(
          `UPDATE "${table}" SET "${col.column_name}" = $1 WHERE "${col.column_name}" IS NULL`,
          [defaultVal]
        );
        if (result.rowCount > 0) {
          console.log(`  ✅ ${table}.${col.column_name}: ${result.rowCount} registro(s) corrigido(s)`);
          fixCount += result.rowCount;
        }
      }
    } catch (e) {
      // Ignorar
    }
  }

  console.log(`\n🎉 Total: ${fixCount} valor(es) NULL corrigido(s)`);
  
  await client.end();
}

fixNulls().catch(e => {
  console.error('❌ ERRO:', e.message);
  process.exit(1);
});
