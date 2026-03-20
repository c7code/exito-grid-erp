const { Client } = require('pg');
async function fix() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();
    await c.query('ALTER TABLE safety_programs ADD COLUMN IF NOT EXISTS "companyId" UUID');
    console.log('✅ companyId added to safety_programs');
    await c.end();
}
fix().catch(e => { console.error('❌', e.message); process.exit(1); });
