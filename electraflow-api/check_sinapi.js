const { Client } = require('pg');
async function main() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    });
    await c.connect();

    // 1. Table structure
    const tables = ['sinapi_inputs', 'sinapi_input_prices', 'sinapi_compositions', 'sinapi_references', 'sinapi_import_logs'];
    for (const t of tables) {
        const cols = await c.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${t}' ORDER BY ordinal_position`);
        console.log(`\n=== ${t} (${cols.rows.length} cols) ===`);
        console.log(cols.rows.map(r => `  ${r.column_name} (${r.data_type}${r.is_nullable === 'YES' ? ', null' : ''})`).join('\n'));
    }

    // 2. Sample data from sinapi_inputs
    const sample = await c.query('SELECT id, code, description, unit, type, origin, "groupClass", "isActive" FROM sinapi_inputs LIMIT 3');
    console.log('\n=== SAMPLE sinapi_inputs ===');
    for (const r of sample.rows) {
        console.log(`  ${r.code} | ${r.unit} | ${r.type} | desc: "${String(r.description).substring(0, 100)}"`);
    }

    // 3. Counts
    for (const t of tables) {
        const cnt = await c.query(`SELECT COUNT(*) as c FROM "${t}"`);
        console.log(`${t}: ${cnt.rows[0].c}`);
    }

    // 4. Sample prices
    const prices = await c.query('SELECT * FROM sinapi_input_prices LIMIT 3');
    console.log('\n=== sinapi_input_prices samples ===');
    console.log(JSON.stringify(prices.rows, null, 2));

    // 5. References
    const refs = await c.query('SELECT * FROM sinapi_references');
    console.log('\n=== sinapi_references ===');
    console.log(JSON.stringify(refs.rows, null, 2));

    // 6. Import logs
    const logs = await c.query('SELECT "fileName", status, "totalRows", "insertedCount", "updatedCount", "errorCount" FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 5');
    console.log('\n=== Recent imports ===');
    for (const l of logs.rows) {
        console.log(`  ${l.fileName} [${l.status}] rows:${l.totalRows} ins:${l.insertedCount} upd:${l.updatedCount} err:${l.errorCount}`);
    }

    await c.end();
}
main().catch(e => console.error(e));
