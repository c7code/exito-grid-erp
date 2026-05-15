const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    const logs = await c.query(`SELECT warnings FROM sinapi_import_logs WHERE "fileName" LIKE '%Refer%' ORDER BY "createdAt" DESC LIMIT 1`);
    if (logs.rows[0]) {
        const w = JSON.parse(logs.rows[0].warnings || '[]');
        // Look for CSD lines
        for (const l of w) {
            if (l.includes('CSD') || l.includes('CSE') || l.includes('CCD')) console.log(l);
        }
    }
    // Sample a composition cost
    const cc = await c.query('SELECT * FROM sinapi_composition_costs LIMIT 3');
    console.log('\nSample costs:', JSON.stringify(cc.rows, null, 2));
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
