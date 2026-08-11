const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:Exito2026Emg@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await c.connect();
  
  // Check signature_slots
  const slots = await c.query(`SELECT id, scope, "signerName", "signerRole", "isDefault", "imageUrl" FROM signature_slots ORDER BY scope`);
  console.log(`=== SIGNATURE SLOTS (${slots.rows.length}) ===`);
  for (const s of slots.rows) {
    console.log(`  scope: ${s.scope} | signer: ${s.signerName} | role: ${s.signerRole} | default: ${s.isDefault} | imageUrl: ${s.imageUrl ? s.imageUrl.substring(0, 70) + '...' : 'NULL'}`);
  }
  
  // Check document_signatures  
  try {
    const docSigs = await c.query(`SELECT id, "documentType", "documentId", "position", "imageUrl", "signerName" FROM document_signatures LIMIT 5`);
    console.log(`\n=== DOCUMENT SIGNATURES (${docSigs.rows.length}) ===`);
    for (const d of docSigs.rows) {
      console.log(`  type: ${d.documentType} | pos: ${d.position} | signer: ${d.signerName} | imageUrl: ${d.imageUrl ? d.imageUrl.substring(0, 70) + '...' : 'NULL'}`);
    }
  } catch(e) { console.log('No document_signatures table:', e.message); }
  
  await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
