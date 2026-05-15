const { Client } = require('pg');
const fs = require('fs');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    const out = [];

    // 1. All tables and their columns
    out.push('=== SCHEMA ===');
    const tables = ['sinapi_references','sinapi_inputs','sinapi_input_prices','sinapi_compositions',
        'sinapi_composition_items','sinapi_composition_costs','sinapi_import_logs','sinapi_budget_links'];
    for (const t of tables) {
        try {
            const cols = await c.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [t]);
            const cnt = await c.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
            out.push(`\n${t} (${cnt.rows[0].cnt} rows):`);
            for (const col of cols.rows) out.push(`  ${col.column_name} ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default || ''}`);
        } catch(e) { out.push(`\n${t}: TABLE NOT FOUND`); }
    }

    // 2. Indexes
    out.push('\n=== INDEXES ===');
    const idx = await c.query(`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE tablename LIKE 'sinapi_%' ORDER BY tablename, indexname`);
    for (const i of idx.rows) out.push(`${i.tablename}: ${i.indexname}`);

    // 3. Import logs
    out.push('\n=== IMPORT LOGS ===');
    const logs = await c.query('SELECT id, "fileName", status, "insertedCount", "updatedCount", "skippedCount", "errorCount", "durationMs", "createdAt" FROM sinapi_import_logs ORDER BY "createdAt" DESC');
    for (const l of logs.rows) out.push(`${l.createdAt} | ${l.fileName} | ${l.status} | +${l.insertedCount} ~${l.updatedCount} skip=${l.skippedCount} err=${l.errorCount} | ${l.durationMs}ms`);

    // 4. Sample data checks
    out.push('\n=== SAMPLE INPUTS (first 3) ===');
    const inp = await c.query('SELECT code, description, unit, type FROM sinapi_inputs LIMIT 3');
    for (const i of inp.rows) out.push(`  ${i.code} | ${i.description} | ${i.unit} | ${i.type}`);

    out.push('\n=== SAMPLE COMPOSITIONS (first 3) ===');
    const comp = await c.query('SELECT code, description, unit, type, "classCode" FROM sinapi_compositions LIMIT 3');
    for (const co of comp.rows) out.push(`  ${co.code} | ${co.description} | ${co.unit} | ${co.type} | class=${co.classCode}`);

    // 5. Price coverage
    out.push('\n=== PRICE COVERAGE ===');
    const ipCount = await c.query('SELECT state, COUNT(*) as cnt FROM sinapi_input_prices GROUP BY state ORDER BY state');
    out.push('Input prices by UF:');
    for (const r of ipCount.rows) out.push(`  ${r.state}: ${r.cnt}`);

    const ccCount = await c.query('SELECT state, COUNT(*) as cnt FROM sinapi_composition_costs GROUP BY state ORDER BY state');
    out.push('Composition costs by UF:');
    for (const r of ccCount.rows) out.push(`  ${r.state}: ${r.cnt}`);

    // 6. Check laborPercent
    out.push('\n=== LABOR PERCENT ===');
    try {
        const lp = await c.query('SELECT COUNT(*) as cnt FROM sinapi_composition_costs WHERE "laborPercent" IS NOT NULL');
        out.push(`Records with laborPercent: ${lp.rows[0].cnt}`);
        const lpSample = await c.query('SELECT c.code, c.description, cc.state, cc."totalNotTaxed", cc."totalTaxed", cc."laborPercent" FROM sinapi_composition_costs cc JOIN sinapi_compositions c ON c.id = cc."compositionId" WHERE cc."laborPercent" IS NOT NULL LIMIT 5');
        for (const r of lpSample.rows) out.push(`  ${r.code} | ${r.description?.substring(0,40)} | ${r.state} | ND=${r.totalNotTaxed} D=${r.totalTaxed} | %MO=${r.laborPercent}`);
    } catch(e) { out.push(`laborPercent column error: ${e.message}`); }

    // 7. Check MO inputs
    out.push('\n=== MÃO DE OBRA ===');
    const mo = await c.query(`SELECT i.code, i.description, i.type, COUNT(p.id) as price_count FROM sinapi_inputs i LEFT JOIN sinapi_input_prices p ON p."inputId" = i.id WHERE i.type = 'mao_de_obra' GROUP BY i.code, i.description, i.type ORDER BY i.code LIMIT 10`);
    for (const r of mo.rows) out.push(`  ${r.code} | ${r.description} | prices=${r.price_count}`);
    const moTotal = await c.query(`SELECT COUNT(*) as cnt FROM sinapi_inputs WHERE type = 'mao_de_obra'`);
    out.push(`Total MO inputs: ${moTotal.rows[0].cnt}`);

    // 8. Composition items
    out.push('\n=== COMPOSITION ITEMS ===');
    const ci = await c.query('SELECT COUNT(*) as cnt FROM sinapi_composition_items');
    out.push(`Total composition items: ${ci.rows[0].cnt}`);
    const ciSample = await c.query(`SELECT c.code as comp_code, c.description as comp_desc, ci."itemType", i.code as input_code, i.description as input_desc, ci.coefficient FROM sinapi_composition_items ci JOIN sinapi_compositions c ON c.id = ci."compositionId" LEFT JOIN sinapi_inputs i ON i.id = ci."inputId" LIMIT 5`);
    for (const r of ciSample.rows) out.push(`  Comp ${r.comp_code} → ${r.item_type} ${r.input_code || '?'} | coef=${r.coefficient} | ${r.input_desc?.substring(0,30) || '?'}`);

    // 9. Refs
    out.push('\n=== REFERENCES ===');
    const refs = await c.query('SELECT * FROM sinapi_references');
    for (const r of refs.rows) out.push(`  ${r.id} | ${r.year}/${r.month} | ${r.label} | ${r.status}`);

    fs.writeFileSync('full_audit.txt', out.join('\n'), 'utf8');
    console.log('Written to full_audit.txt');
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
