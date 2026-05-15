const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    // Check counts
    const tables = ['sinapi_references', 'sinapi_inputs', 'sinapi_input_prices', 'sinapi_compositions', 'sinapi_composition_costs', 'sinapi_import_logs'];
    for (const t of tables) {
        const r = await c.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
        console.log(`${t}: ${r.rows[0].cnt}`);
    }
    
    // Check latest logs
    const logs = await c.query('SELECT id, "fileName", status, "insertedCount", "updatedCount", "errorCount", "totalRows", "durationMs", errors, warnings, "createdAt" FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 3');
    for (const row of logs.rows) {
        console.log(`\n--- Log ${row.id} ---`);
        console.log(`  File: ${row.fileName}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Created: ${row.createdAt}`);
        console.log(`  Inserted: ${row.insertedCount}, Updated: ${row.updatedCount}, Errors: ${row.errorCount}`);
        console.log(`  TotalRows: ${row.totalRows}, Duration: ${row.durationMs}ms`);
        if (row.errors) {
            try { const e = JSON.parse(row.errors); console.log(`  Errors:`, e.slice(0, 5)); } catch { console.log(`  Errors: ${row.errors.substring(0, 300)}`); }
        }
        if (row.warnings) {
            try { const w = JSON.parse(row.warnings); console.log(`  Warnings:`, w.slice(0, 10)); } catch { console.log(`  Warnings: ${row.warnings.substring(0, 500)}`); }
        }
    }
    
    // Check if columns exist
    const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'sinapi_input_prices' ORDER BY ordinal_position`);
    console.log('\nsinapi_input_prices columns:', cols.rows.map(r => r.column_name).join(', '));

    // Check indexes
    const idx = await c.query(`SELECT indexname FROM pg_indexes WHERE tablename IN ('sinapi_input_prices','sinapi_references','sinapi_composition_costs')`);
    console.log('\nIndexes:', idx.rows.map(r => r.indexname).join(', '));
    
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
