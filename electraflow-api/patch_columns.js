const { Client } = require('pg');
async function patch() {
    const client = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const patches = [
        `ALTER TABLE occupational_exams ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0`,
        `ALTER TABLE occupational_exams ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`,
        `ALTER TABLE risk_groups ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true`,
        `ALTER TABLE safety_programs ADD COLUMN IF NOT EXISTS "fileName" VARCHAR`,
        `ALTER TABLE safety_programs ADD COLUMN IF NOT EXISTS description TEXT`,
    ];
    for (const sql of patches) {
        try { await client.query(sql); console.log('✅', sql.substring(0, 60)); }
        catch (e) { console.log('❌', e.message); }
    }
    await client.end();
    console.log('Done!');
}
patch();
