const { DataSource } = require('typeorm');
require('dotenv').config();

(async () => {
  const ds = new DataSource({ type: 'postgres', url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await ds.initialize();

  // Check compliance_documents columns
  const cols = await ds.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'compliance_documents' 
    ORDER BY ordinal_position
  `);
  console.log('=== compliance_documents columns ===');
  cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));

  // Check document_versions columns
  const vCols = await ds.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'document_versions' 
    ORDER BY ordinal_position
  `);
  console.log('\n=== document_versions columns ===');
  vCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));

  // Check document_approvals columns
  const aCols = await ds.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'document_approvals' 
    ORDER BY ordinal_position
  `);
  console.log('\n=== document_approvals columns ===');
  aCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));

  // Try to query compliance docs
  try {
    const docs = await ds.query(`SELECT COUNT(*) as cnt FROM compliance_documents`);
    console.log('\nCompliance docs count:', docs[0].cnt);
  } catch(e) {
    console.log('\nERROR querying compliance_documents:', e.message);
  }

  // Try to query document_versions
  try {
    const vers = await ds.query(`SELECT COUNT(*) as cnt FROM document_versions`);
    console.log('Document versions count:', vers[0].cnt);
  } catch(e) {
    console.log('ERROR querying document_versions:', e.message);
  }

  // Check employee_document_requirements
  const rCols = await ds.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'employee_document_requirements' 
    ORDER BY ordinal_position
  `);
  console.log('\n=== employee_document_requirements columns ===');
  rCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

  await ds.destroy();
})();
