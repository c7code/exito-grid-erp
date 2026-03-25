const { Client } = require('pg');

async function main() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    });
    await c.connect();

    // Check import log timestamps to see if these are new or old
    const logs = await c.query(`SELECT "fileName", status, "fileType", "totalRows", "insertedCount", "skippedCount", "errorCount", "createdAt", errors, warnings FROM sinapi_import_logs ORDER BY "createdAt" DESC LIMIT 6`);
    console.log('=== IMPORT LOGS WITH TIMESTAMPS ===');
    for (const l of logs.rows) {
        console.log('\n' + l.fileName);
        console.log('  Created: ' + l.createdAt);
        console.log('  Status: ' + l.status + ' | type: ' + l.fileType + ' | rows: ' + l.totalRows);
        console.log('  ins: ' + l.insertedCount + ' | skip: ' + l.skippedCount + ' | err: ' + l.errorCount);
        if (l.warnings) {
            const w = JSON.parse(l.warnings);
            console.log('  WARNINGS (' + w.length + '):', w.slice(0, 5));
        }
        if (l.errors) {
            const e = JSON.parse(l.errors);
            console.log('  ERRORS (' + e.length + '):', e.slice(0, 5));
        }
    }

    await c.end();
}
main().catch(e => console.error(e));
