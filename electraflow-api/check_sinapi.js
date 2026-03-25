const { Client } = require('pg');
async function main() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    });
    await c.connect();

    // Counts
    const tables = ['sinapi_inputs','sinapi_compositions','sinapi_input_prices'];
    for (const t of tables) {
        const r = await c.query('SELECT COUNT(*) as c FROM "' + t + '"');
        console.log(t + ': ' + r.rows[0].c);
    }

    // Latest logs with errors + warnings
    const logs = await c.query(`SELECT "fileName", status, "totalRows", "insertedCount", "updatedCount", "skippedCount", "errorCount", "createdAt", errors, warnings FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 5`);
    for (const l of logs.rows) {
        console.log('\n--- ' + l.fileName + ' [' + new Date(l.createdAt).toLocaleTimeString('pt-BR') + '] ---');
        console.log('  ' + l.status + ' | rows:' + l.totalRows + ' ins:' + l.insertedCount + ' upd:' + l.updatedCount + ' skip:' + l.skippedCount + ' errors:' + l.errorCount);
        if (l.errors) {
            try {
                const e = JSON.parse(l.errors);
                console.log('  ERRORS (' + e.length + '):');
                for (const msg of e.slice(0, 10)) console.log('    ❌ ' + String(msg).substring(0, 250));
            } catch { console.log('  ERRORS: ' + l.errors); }
        }
        if (l.warnings) {
            try {
                const w = JSON.parse(l.warnings);
                console.log('  WARNINGS (' + w.length + '):');
                for (const msg of w.slice(0, 10)) console.log('    ⚠️ ' + String(msg).substring(0, 250));
            } catch { console.log('  WARNINGS: ' + l.warnings); }
        }
    }

    await c.end();
}
main().catch(e => console.error(e));
