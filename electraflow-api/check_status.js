const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    const logs = await c.query('SELECT "fileName", status, "insertedCount", "updatedCount", "skippedCount", "errorCount", "durationMs", "createdAt" FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 5');
    for (const l of logs.rows) {
        console.log(`${l.fileName} | ${l.status} | +${l.insertedCount} ~${l.updatedCount} skip=${l.skippedCount} err=${l.errorCount} | ${l.durationMs}ms`);
    }
    for (const t of ['sinapi_inputs','sinapi_input_prices','sinapi_compositions','sinapi_composition_items','sinapi_composition_costs']) {
        const r = await c.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
        console.log(`${t}: ${r.rows[0].cnt}`);
    }
    // Check laborPercent
    const lp = await c.query('SELECT COUNT(*) as cnt FROM sinapi_composition_costs WHERE "laborPercent" IS NOT NULL');
    console.log(`laborPercent preenchido: ${lp.rows[0].cnt}`);
    const tc = await c.query('SELECT COUNT(*) as cnt FROM sinapi_composition_costs WHERE "totalNotTaxed" IS NOT NULL');
    console.log(`totalNotTaxed preenchido: ${tc.rows[0].cnt}`);
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
