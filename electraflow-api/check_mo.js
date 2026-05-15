const { Client } = require('pg');
const fs = require('fs');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    // All import logs
    const logs = await c.query('SELECT id, "fileName", status, "insertedCount", "updatedCount", "skippedCount", "errorCount", "totalRows", "durationMs", warnings FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 5');
    const output = [];
    for (const row of logs.rows) {
        output.push(`\n=== ${row.fileName} (${row.status}) ===`);
        output.push(`  Inserted: ${row.insertedCount}, Updated: ${row.updatedCount}, Skipped: ${row.skippedCount}, Errors: ${row.errorCount}`);
        output.push(`  TotalRows: ${row.totalRows}, Duration: ${row.durationMs}ms`);
        if (row.warnings) {
            try {
                const w = JSON.parse(row.warnings);
                for (const l of w) output.push(`  ${l}`);
            } catch { output.push(`  Warnings: ${row.warnings.substring(0, 500)}`); }
        }
    }
    
    // Counts
    for (const t of ['sinapi_references','sinapi_inputs','sinapi_input_prices','sinapi_compositions','sinapi_composition_costs']) {
        const r = await c.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
        output.push(`\n${t}: ${r.rows[0].cnt}`);
    }
    
    // Check prices with MO type
    const mo = await c.query(`SELECT COUNT(*) as cnt FROM sinapi_inputs WHERE type = 'mao_de_obra'`);
    output.push(`\nInputs type=mao_de_obra: ${mo.rows[0].cnt}`);
    
    // Check if any MO has prices
    const moP = await c.query(`SELECT COUNT(*) as cnt FROM sinapi_input_prices p JOIN sinapi_inputs i ON i.id = p."inputId" WHERE i.type = 'mao_de_obra'`);
    output.push(`MO prices: ${moP.rows[0].cnt}`);
    
    // Sample MO inputs
    const moS = await c.query(`SELECT i.code, i.description, i.unit, p."priceNotTaxed", p."priceTaxed", p.state FROM sinapi_inputs i LEFT JOIN sinapi_input_prices p ON p."inputId" = i.id WHERE i.type = 'mao_de_obra' LIMIT 5`);
    output.push(`\nSample MO inputs:`);
    for (const r of moS.rows) {
        output.push(`  ${r.code} | ${r.description} | ND=${r.priceNotTaxed} D=${r.priceTaxed} | ${r.state}`);
    }
    
    fs.writeFileSync('mo_debug.txt', output.join('\n'), 'utf8');
    console.log('Written to mo_debug.txt');
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
