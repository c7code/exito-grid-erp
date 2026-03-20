const { Client } = require('pg');
async function patch() {
    const client = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const patches = [
        // exam_referral_items missing columns
        `ALTER TABLE exam_referral_items ADD COLUMN IF NOT EXISTS "expiryDate" DATE`,
        `ALTER TABLE exam_referral_items ADD COLUMN IF NOT EXISTS "selected" BOOLEAN DEFAULT true`,
        `ALTER TABLE exam_referral_items ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0`,
        // exam_referrals - budgetValue fix (precision)
        `ALTER TABLE exam_referrals ALTER COLUMN "budgetValue" TYPE DECIMAL(15,2)`,
    ];
    for (const sql of patches) {
        try { await client.query(sql); console.log('✅', sql.substring(0, 70)); }
        catch (e) { console.log('⚠️', sql.substring(0, 40), e.message); }
    }
    await client.end();
    console.log('Done!');
}
patch();
