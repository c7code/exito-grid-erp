const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();

    // Check composition 91998
    const comp = await c.query(`SELECT * FROM sinapi_compositions WHERE code = '91998'`);
    console.log('=== COMPOSIÇÃO 91998 ===');
    console.log(JSON.stringify(comp.rows[0], null, 2));

    // Check costs for this composition
    const costs = await c.query(`SELECT cc.state, cc."totalNotTaxed", cc."totalTaxed", cc."laborPercent" FROM sinapi_composition_costs cc JOIN sinapi_compositions c ON c.id = cc."compositionId" WHERE c.code = '91998' LIMIT 5`);
    console.log('\n=== CUSTOS 91998 ===');
    for (const r of costs.rows) console.log(`  ${r.state}: ND=${r.totalNotTaxed} D=${r.totalTaxed} %MO=${r.laborPercent}`);

    // Global counts
    for (const t of ['sinapi_inputs','sinapi_input_prices','sinapi_compositions','sinapi_composition_items','sinapi_composition_costs']) {
        const r = await c.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
        console.log(`${t}: ${r.rows[0].cnt}`);
    }

    // How many costs have actual values?
    const withCost = await c.query(`SELECT COUNT(*) as cnt FROM sinapi_composition_costs WHERE "totalNotTaxed" IS NOT NULL AND "totalNotTaxed" > 0`);
    console.log(`\nCosts with totalNotTaxed > 0: ${withCost.rows[0].cnt}`);
    const withLP = await c.query(`SELECT COUNT(*) as cnt FROM sinapi_composition_costs WHERE "laborPercent" IS NOT NULL`);
    console.log(`Costs with laborPercent: ${withLP.rows[0].cnt}`);

    // Import logs
    const logs = await c.query('SELECT "fileName", status, "insertedCount", "updatedCount", "skippedCount", "errorCount", "durationMs" FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 5');
    console.log('\n=== IMPORT LOGS ===');
    for (const l of logs.rows) console.log(`${l.fileName} | ${l.status} | +${l.insertedCount} ~${l.updatedCount} skip=${l.skippedCount} err=${l.errorCount}`);

    // Check warnings from last reference import about CSD
    const ref = await c.query(`SELECT warnings FROM sinapi_import_logs WHERE "fileName" LIKE '%Refer%' ORDER BY "createdAt" DESC LIMIT 1`);
    if (ref.rows[0]?.warnings) {
        const w = JSON.parse(ref.rows[0].warnings);
        console.log('\n=== CSD RELATED WARNINGS ===');
        for (const l of w) {
            if (l.includes('CSD') || l.includes('COMP') || l.includes('comp') || l.includes('DEBUG') || l.includes('descToCode') || l.includes('ORDER')) console.log(l);
        }
    }

    // Composition items for 91998
    const items = await c.query(`SELECT ci."itemType", i.code as input_code, i.description as input_desc, ci.coefficient FROM sinapi_composition_items ci JOIN sinapi_compositions c ON c.id = ci."compositionId" LEFT JOIN sinapi_inputs i ON i.id = ci."inputId" WHERE c.code = '91998'`);
    console.log('\n=== ITENS 91998 ===');
    for (const r of items.rows) console.log(`  ${r.item_type || '?'} ${r.input_code || '?'} | coef=${r.coefficient} | ${(r.input_desc || '?').substring(0, 40)}`);

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
