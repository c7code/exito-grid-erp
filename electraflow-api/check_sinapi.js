const { Client } = require('pg');
async function main() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    });
    await c.connect();

    const tables = ['sinapi_references','sinapi_inputs','sinapi_compositions','sinapi_input_prices','sinapi_composition_costs','sinapi_composition_items','sinapi_import_logs'];
    for (const t of tables) {
        const r = await c.query('SELECT COUNT(*) as c FROM "' + t + '"');
        console.log(t + ': ' + r.rows[0].c);
    }

    // Latest logs with debug warnings
    const logs = await c.query(`SELECT "fileName", status, "totalRows", "insertedCount", "skippedCount", "errorCount", "createdAt", warnings FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 6`);
    for (const l of logs.rows) {
        console.log('\n--- ' + l.fileName + ' [' + new Date(l.createdAt).toLocaleTimeString('pt-BR') + '] ---');
        console.log('  ' + l.status + ' | rows:' + l.totalRows + ' ins:' + l.insertedCount + ' skip:' + l.skippedCount + ' err:' + l.errorCount);
        if (l.warnings) {
            try {
                const w = JSON.parse(l.warnings);
                for (const msg of w.slice(0, 10)) console.log('  W: ' + String(msg).substring(0, 200));
            } catch {}
        }
    }

    // Sample data
    const inputs = await c.query('SELECT code, description, unit FROM sinapi_inputs LIMIT 3');
    console.log('\nSample inputs:', inputs.rows);
    const comps = await c.query('SELECT code, description, unit FROM sinapi_compositions LIMIT 3');
    console.log('Sample compositions:', comps.rows);

    await c.end();
}
main().catch(e => console.error(e));
