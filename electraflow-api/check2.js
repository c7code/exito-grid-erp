const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:t0c4d0c03lh02026@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    console.log('\n=== TODAS AS EMPRESAS ===');
    const cos = await c.query('SELECT id, name, "tradeName", "isPrimary", cnpj FROM companies WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 5');
    console.log('Total:', cos.rows.length);
    for (const r of cos.rows) {
        console.log(` - ${r.tradeName || r.name} | isPrimary: ${r.isPrimary} | CNPJ: ${r.cnpj}`);
    }
    
    console.log('\n=== PROPOSTA PROP-2026-086 ===');
    const p086 = await c.query('SELECT id, "proposalNumber", "activityType", total, "clientId" FROM proposals WHERE "proposalNumber" = $1', ['PROP-2026-086']);
    console.log(JSON.stringify(p086.rows[0], null, 2));
    
    console.log('\n=== PROPOSTA PROP-2026-085 ===');
    const p085 = await c.query('SELECT id, "proposalNumber", "activityType", total, "clientId" FROM proposals WHERE "proposalNumber" = $1', ['PROP-2026-085']);
    console.log(JSON.stringify(p085.rows[0], null, 2));
    
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
