const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
c.connect().then(async () => {
  // Check signature_slots
  const res = await c.query('SELECT id, label, "signerName", "signerRole", scope, "isDefault", LEFT("imageUrl", 50) as "imageUrlPreview", LENGTH("imageUrl") as "imageUrlLen" FROM "signature_slots" WHERE "deletedAt" IS NULL');
  console.log('=== Signature Slots ===');
  console.log(JSON.stringify(res.rows, null, 2));

  // Check document_signatures
  const res2 = await c.query('SELECT * FROM "document_signatures" LIMIT 10');
  console.log('\n=== Document Signatures ===');
  console.log(JSON.stringify(res2.rows, null, 2));

  await c.end();
}).catch(console.error);
