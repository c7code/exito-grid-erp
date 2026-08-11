const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:t0c4d0c03lh02026@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    const cols = await c.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'referral_lead_proposals' ORDER BY ordinal_position"
    );
    console.log('referral_lead_proposals colunas:');
    cols.rows.forEach(r => console.log(' -', r.column_name, ':', r.data_type));
    
    await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
