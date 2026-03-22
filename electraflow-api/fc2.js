const { Client } = require('pg');
async function fix() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();
    
    // Drop the signatureToken unique constraint
    try {
        await c.query('ALTER TABLE contracts DROP CONSTRAINT IF EXISTS "UQ_375897948211b379ad8726c5e63"');
        console.log('✅ Dropped signatureToken unique constraint');
    } catch (e) { console.log('⚠️', e.message); }
    
    // Also drop the unique index on signatureToken if it exists
    try {
        await c.query('DROP INDEX IF EXISTS "UQ_375897948211b379ad8726c5e63"');
        console.log('✅ Dropped signatureToken unique index');
    } catch (e) { console.log('⚠️', e.message); }

    // Verify remaining constraints
    const r = await c.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes WHERE tablename = 'contracts' AND indexdef LIKE '%UNIQUE%'
    `);
    console.log('\nRemaining unique indexes:');
    r.rows.forEach(row => console.log(' ', row.indexname, ':', row.indexdef));

    await c.end();
    console.log('\nDone!');
}
fix();
