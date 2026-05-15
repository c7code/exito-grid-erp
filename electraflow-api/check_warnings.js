const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    const r = await c.query('SELECT id, "fileName", status, "insertedCount", "updatedCount", "skippedCount", "errorCount", "totalRows", "durationMs", errors, warnings, "createdAt" FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 1');
    const row = r.rows[0];
    if (!row) { console.log('No logs'); await c.end(); return; }
    
    console.log(`Status: ${row.status}`);
    console.log(`File: ${row.fileName}`);
    console.log(`Created: ${row.createdAt}`);
    console.log(`Duration: ${row.durationMs}ms`);
    console.log(`Inserted: ${row.insertedCount}, Updated: ${row.updatedCount}, Skipped: ${row.skippedCount}, Errors: ${row.errorCount}`);
    console.log(`TotalRows: ${row.totalRows}`);
    
    if (row.warnings) {
        try {
            const w = JSON.parse(row.warnings);
            console.log('\n=== ALL WARNINGS ===');
            for (const line of w) console.log(line);
        } catch { console.log('Warnings (raw):', row.warnings.substring(0, 2000)); }
    }
    
    if (row.errors) {
        try {
            const e = JSON.parse(row.errors);
            console.log('\n=== ALL ERRORS ===');
            for (const line of e) console.log(line);
        } catch { console.log('Errors (raw):', row.errors.substring(0, 2000)); }
    }
    
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
