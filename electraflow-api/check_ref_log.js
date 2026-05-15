const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();

    const ref = await c.query(`SELECT status, warnings, errors, "durationMs", "insertedCount", "updatedCount", "errorCount", "createdAt" FROM sinapi_import_logs WHERE "fileName" LIKE '%Refer%' ORDER BY "createdAt" DESC LIMIT 1`);
    const r = ref.rows[0];
    console.log('Status:', r.status);
    console.log('Duration:', r.durationMs, 'ms');
    console.log('Created:', r.createdAt);
    console.log('Inserted:', r.insertedCount, 'Updated:', r.updatedCount, 'Errors:', r.errorCount);
    
    const w = JSON.parse(r.warnings || '[]');
    console.log('\nWarnings (' + w.length + '):');
    for (const l of w) console.log('  ' + l);
    
    const e = JSON.parse(r.errors || '[]');
    console.log('\nErrors (' + e.length + '):');
    for (const l of e.slice(0, 10)) console.log('  ' + l);

    // Table counts
    for (const t of ['sinapi_compositions', 'sinapi_composition_items', 'sinapi_composition_costs']) {
        const r2 = await c.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
        console.log(`${t}: ${r2.rows[0].cnt}`);
    }

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
