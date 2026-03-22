const { Client } = require('pg');
async function fix() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();

    // Drop ALL signatureToken unique indexes
    try {
        await c.query('ALTER TABLE contracts DROP CONSTRAINT IF EXISTS "UQ_6ff264f8a51d450032db1aed27d"');
        console.log('✅ Dropped constraint UQ_6ff...');
    } catch (e) { console.log('⚠️', e.message); }

    try {
        await c.query('DROP INDEX IF EXISTS "UQ_6ff264f8a51d450032db1aed27d"');
        console.log('✅ Dropped index UQ_6ff...');
    } catch (e) { console.log('⚠️', e.message); }

    // Verify
    const r = await c.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'contracts' AND indexdef LIKE '%UNIQUE%'");
    console.log('\nRemaining unique indexes:');
    r.rows.forEach(row => console.log(' ', row.indexname));

    await c.end();
}
fix();
