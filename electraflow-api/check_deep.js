const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();

    // Import status
    const logs = await c.query('SELECT "fileName", status, "insertedCount", "updatedCount", "errorCount", "durationMs" FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 5');
    for (const l of logs.rows) console.log(`${l.fileName} | ${l.status} | +${l.insertedCount} ~${l.updatedCount} err=${l.errorCount} | ${l.durationMs}ms`);

    // Count costs by state
    const sc = await c.query('SELECT COUNT(DISTINCT "compositionId") as cnt FROM sinapi_composition_costs WHERE "totalNotTaxed" IS NOT NULL AND "totalNotTaxed" > 0');
    console.log(`\nDistinct compositions with totalNotTaxed: ${sc.rows[0].cnt}`);

    // Sample a comp with cost
    const sample = await c.query(`
        SELECT c.code, c.description, cc.state, cc."totalNotTaxed"
        FROM sinapi_composition_costs cc 
        JOIN sinapi_compositions c ON c.id = cc."compositionId" 
        WHERE cc."totalNotTaxed" IS NOT NULL AND cc."totalNotTaxed" > 0
        LIMIT 5
    `);
    console.log('\nSamples with cost:');
    for (const r of sample.rows) console.log(`  ${r.code}: ${r.description?.substring(0,50)} | ${r.state}=${r.totalNotTaxed}`);

    // Composition_costs total
    const total = await c.query('SELECT COUNT(*) as cnt FROM sinapi_composition_costs');
    console.log(`\nTotal composition_costs: ${total.rows[0].cnt}`);

    // Check if CSD/CCD done
    const ref = await c.query(`SELECT warnings FROM sinapi_import_logs WHERE "fileName" LIKE '%Refer%' ORDER BY "createdAt" DESC LIMIT 1`);
    if (ref.rows[0]?.warnings) {
        const w = JSON.parse(ref.rows[0].warnings);
        for (const l of w) {
            if (l.includes('RESULT') || l.includes('DEBUG') || l.includes('COMP')) console.log(l);
        }
    }

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
