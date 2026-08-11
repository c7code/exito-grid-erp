/**
 * Renomeia todas as tabelas do outro sistema que conflitam com o ERP
 * TypeORM vai criar as tabelas corretas com synchronize=true
 */
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Client } = require('pg');

const DB_URL = 'postgresql://postgres.msuthinujxghpoygotqh:K8mPx2nQvR7tLwY4@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

// Tabelas do ERP (definidas nas entities)
const ERP_TABLES = [
  'users', 'user_sessions',
  'clients', 'client_documents', 'client_requests', 'request_attachments',
  'companies', 'company_documents',
  'works', 'work_phases', 'work_type_configs', 'work_updates',
  'proposals', 'proposal_items', 'proposal_revisions',
  'payments', 'payment_installments', 'payment_receipts', 'payment_schedules',
  'measurements', 'measurement_items',
  'purchase_orders', 'purchase_order_items',
  'work_costs', 'debts', 'debt_payments',
  'bank_statements', 'bank_statement_entries',
  'dre_categories', 'bank_accounts', 'cost_centers', 'chart_of_accounts',
  'cash_registers', 'payment_methods_config',
  'catalog_categories', 'catalog_items', 'catalog_grouping_items',
  'fiscal_rules', 'ncm_codes', 'product_suppliers', 'stock_movements',
  'suppliers', 'supplier_contacts',
  'quotation_requests', 'quotation_items', 'quotation_responses', 'quotation_response_items',
  'price_history',
  'fiscal_config', 'fiscal_invoices', 'fiscal_invoice_value_edits',
  'equipment', 'equipment_rentals', 'equipment_maintenance',
  'equipment_daily_logs', 'equipment_daily_expenses',
  'equipment_services', 'equipment_checklists', 'equipment_documents', 'equipment_lifting_plans',
  'tasks', 'task_resolvers',
  'employees', 'employee_documents',
  'document_folder_categories', 'document_folders', 'documents',
  'audit_logs',
  'system_categories', 'categories',
  'contracts', 'contract_addendums', 'contract_templates',
  'daily_logs', 'daily_log_requests', 'daily_log_responses',
  'leads', 'opportunities', 'notifications',
  'protocols', 'protocol_events', 'protocol_attachments',
  'processes', 'process_stages', 'checklist_items',
  'inventory_items',
  'technical_norms', 'norm_chunks',
  'laudo_atendimentos', 'markup_configs', 'packages', 'rules',
  'service_orders',
  'signature_slots', 'document_signatures',
  'simulation_sessions', 'simulation_exceptions',
  'solar_projects', 'solar_plans', 'solar_plan_subscriptions', 'solar_monthly_reports',
  'structure_templates', 'structure_template_items',
  'budgets', 'budget_items', 'company_financials', 'service_rules',
  'oem_contratos', 'oem_planos', 'oem_servicos', 'oem_usinas',
  'broadcast_documents', 'referral_consultants', 'referral_leads',
  'referral_commitments', 'lead_documents', 'referral_followups', 'referral_commissions',
  'partner_requests', 'partner_request_messages',
  'client_sub_users', 'portal_publications',
  'sinapi_budget_links', 'sinapi_composition_items', 'sinapi_composition_costs',
  'sinapi_compositions', 'sinapi_configs', 'sinapi_import_logs',
  'sinapi_inputs', 'sinapi_input_prices', 'sinapi_pricing_profiles', 'sinapi_references',
  'compliance_documents', 'document_approvals', 'document_type_rules',
  'document_types', 'document_versions', 'employee_doc_requirements',
  'exam_referral_items', 'exam_referrals', 'occupational_exams',
  'retention_policies', 'risk_group_exams', 'risk_groups', 'safety_programs',
];

async function fixConflicts() {
  const client = new Client({ 
    connectionString: DB_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  
  await client.connect();
  console.log('✅ Conectado ao banco\n');

  // Obter todas as tabelas existentes
  const existing = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const existingTables = new Set(existing.rows.map(r => r.table_name));

  let renamed = 0;
  let skipped = 0;

  for (const table of ERP_TABLES) {
    if (!existingTables.has(table)) continue;
    if (table === 'users') continue; // já renomeamos antes
    
    // Verificar se a tabela tem schema do ERP (UUID id) ou outro sistema (integer id)
    const idCol = await client.query(
      "SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name='id'",
      [table]
    );
    
    if (idCol.rows.length === 0) continue;
    
    const idType = idCol.rows[0].data_type;
    
    // Se o id é integer, é do outro sistema - renomear
    if (idType === 'integer' || idType === 'bigint') {
      const backupName = `_old_${table}`;
      try {
        await client.query(`DROP TABLE IF EXISTS "${backupName}" CASCADE`);
        await client.query(`ALTER TABLE "${table}" RENAME TO "${backupName}"`);
        console.log(`  🔄 ${table} (id=${idType}) → ${backupName}`);
        renamed++;
      } catch (e) {
        console.log(`  ⚠️  ${table}: erro ao renomear - ${e.message}`);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   Renomeadas (outro sistema): ${renamed}`);
  console.log(`   Mantidas (ERP ou UUID): ${skipped}`);
  console.log(`   Total tabelas no banco: ${existingTables.size}`);
  
  await client.end();
  console.log('\n🎉 Pronto! O TypeORM synchronize vai criar as tabelas corretas do ERP.');
}

fixConflicts().catch(e => {
  console.error('❌ ERRO:', e.message);
  process.exit(1);
});
