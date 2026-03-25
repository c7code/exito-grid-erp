const { Client } = require('pg');

async function main() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    });
    await c.connect();
    
    const tables = ['sinapi_references','sinapi_inputs','sinapi_compositions','sinapi_input_prices','sinapi_composition_costs','sinapi_import_logs'];
    for (const t of tables) {
        try {
            const r = await c.query('SELECT COUNT(*) as c FROM ' + t);
            console.log(t + ': ' + r.rows[0].c);
        } catch(e) {
            console.log(t + ': NOT EXISTS - ' + e.message.substring(0,80));
        }
    }
    
    const logs = await c.query(`SELECT "fileName", status, "fileType", "totalRows", "insertedCount", "skippedCount", "errorCount", errors, warnings FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 5`);
    for (const l of logs.rows) {
        console.log('\n' + l.fileName + ' | ' + l.status + ' | type:' + l.fileType + ' | rows:' + l.totalRows + ' ins:' + l.insertedCount + ' skip:' + l.skippedCount + ' err:' + l.errorCount);
        if (l.errors) console.log('  ERR:', l.errors.substring(0, 500));
        if (l.warnings) console.log('  WARN:', l.warnings.substring(0, 500));
    }
    
    await c.end();
}
main().catch(e => console.error(e));
