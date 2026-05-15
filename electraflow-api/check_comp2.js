const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();

    // Check composition 106078
    for (const code of ['106078', '91998', '88264', '88247', '104658']) {
        const comp = await c.query(`SELECT id, code, description FROM sinapi_compositions WHERE code = $1`, [code]);
        if (comp.rows.length === 0) { console.log(`${code}: NOT FOUND`); continue; }
        const costs = await c.query(`SELECT state, "totalNotTaxed", "totalTaxed", "laborPercent" FROM sinapi_composition_costs WHERE "compositionId" = $1 ORDER BY state LIMIT 5`, [comp.rows[0].id]);
        console.log(`\n${code}: ${comp.rows[0].description?.substring(0, 50)}`);
        for (const r of costs.rows) console.log(`  ${r.state}: ND=${r.totalNotTaxed} D=${r.totalTaxed} %MO=${r.laborPercent}`);
        if (costs.rows.length === 0) console.log('  NO COSTS');
    }

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
