const { Client } = require('pg');
const fs = require('fs');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    const r = await c.query('SELECT * FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 1');
    const row = r.rows[0];
    const output = [];
    output.push(`Status: ${row.status}`);
    output.push(`Inserted: ${row.insertedCount}, Updated: ${row.updatedCount}, Skipped: ${row.skippedCount}, Errors: ${row.errorCount}`);
    output.push(`TotalRows: ${row.totalRows}, Duration: ${row.durationMs}ms`);
    if (row.warnings) {
        try { const w = JSON.parse(row.warnings); for (const l of w) output.push(l); } catch { output.push(row.warnings); }
    }
    if (row.errors) {
        try { const e = JSON.parse(row.errors); output.push('=== ERRORS ==='); for (const l of e) output.push(l); } catch { output.push(row.errors); }
    }
    // Also get counts
    for (const t of ['sinapi_references','sinapi_inputs','sinapi_input_prices','sinapi_compositions','sinapi_composition_costs']) {
        const r2 = await c.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
        output.push(`${t}: ${r2.rows[0].cnt}`);
    }
    fs.writeFileSync('import_debug.txt', output.join('\n'), 'utf8');
    console.log('Written to import_debug.txt');
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
