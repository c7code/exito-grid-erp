const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Create signature_slots table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "signature_slots" (
      "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      "label" VARCHAR NOT NULL,
      "signerName" VARCHAR,
      "signerRole" VARCHAR,
      "signerDocument" VARCHAR,
      "imageUrl" VARCHAR,
      "scope" VARCHAR DEFAULT 'company',
      "referenceId" VARCHAR,
      "isDefault" BOOLEAN DEFAULT false,
      "sortOrder" INT DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )
  `);
  console.log('✅ signature_slots table created');

  // Create document_signatures table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "document_signatures" (
      "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      "documentType" VARCHAR NOT NULL,
      "documentId" VARCHAR NOT NULL,
      "slotPosition" VARCHAR NOT NULL,
      "signatureSlotId" UUID REFERENCES "signature_slots"("id"),
      "overrideSignerName" VARCHAR,
      "overrideSignerRole" VARCHAR,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ document_signatures table created');

  // Migrate existing company signature
  const companyRes = await client.query(
    `SELECT "signatureImageUrl", "signatureSignerName", "signatureSignerRole" FROM "companies" WHERE "signatureImageUrl" IS NOT NULL LIMIT 1`
  );
  if (companyRes.rows.length > 0) {
    const c = companyRes.rows[0];
    const existing = await client.query(`SELECT id FROM "signature_slots" WHERE "label" = 'Assinatura Padrão da Empresa' LIMIT 1`);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO "signature_slots" ("label", "signerName", "signerRole", "imageUrl", "scope", "isDefault")
         VALUES ($1, $2, $3, $4, 'company', true)`,
        ['Assinatura Padrão da Empresa', c.signatureSignerName, c.signatureSignerRole, c.signatureImageUrl]
      );
      console.log('✅ Migrated existing company signature to signature_slots');
    } else {
      console.log('✓ Company signature already migrated');
    }
  } else {
    console.log('ℹ️ No existing company signature to migrate');
  }

  console.log('\n🎉 Migration complete!');
  await client.end();
}
run().catch(console.error);
