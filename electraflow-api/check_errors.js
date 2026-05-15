const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    const logs = await c.query(`SELECT warnings, errors FROM sinapi_import_logs WHERE "fileName" LIKE '%Refer%' ORDER BY "createdAt" DESC LIMIT 1`);
    if (logs.rows[0]) {
        const w = JSON.parse(logs.rows[0].warnings || '[]');
        const e = JSON.parse(logs.rows[0].errors || '[]');
        console.log('=== WARNINGS ===');
        for (const l of w) console.log(l);
        console.log('\n=== ERRORS (first 20) ===');
        for (const l of e.slice(0, 20)) console.log(l);
    }
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
