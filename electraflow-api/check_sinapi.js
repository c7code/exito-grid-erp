const { Client } = require('pg');

async function main() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    });
    await c.connect();
    
    // Delete old failed import logs (all had 0 inserted)
    const r = await c.query(`DELETE FROM sinapi_import_logs WHERE "insertedCount" = 0 OR "insertedCount" IS NULL`);
    console.log('Deleted old empty import logs:', r.rowCount);
    
    // Delete old references (they were created empty)
    const r2 = await c.query(`DELETE FROM sinapi_references`);
    console.log('Deleted old empty references:', r2.rowCount);
    
    // Verify clean state
    const tables = ['sinapi_references', 'sinapi_inputs', 'sinapi_compositions', 'sinapi_input_prices', 'sinapi_import_logs'];
    for (const t of tables) {
        const r = await c.query('SELECT COUNT(*) as c FROM "' + t + '"');
        console.log(t + ': ' + r.rows[0].c);
    }
    
    await c.end();
    console.log('\nDatabase cleaned. Ready for re-import with fixed parser.');
}
main().catch(e => console.error(e));
