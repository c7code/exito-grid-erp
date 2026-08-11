const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:t0c4d0c03lh02026@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    await c.query(`ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS "commissionType" VARCHAR DEFAULT 'percentage'`);
    await c.query(`ALTER TABLE referral_consultants ADD COLUMN IF NOT EXISTS "commissionFixedValue" NUMERIC(15,2)`);
    
    console.log('Colunas adicionadas com sucesso');
    const r = await c.query(`SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'referral_consultants' AND column_name IN ('commissionType','commissionFixedValue','commissionPercent')`);
    r.rows.forEach(row => console.log(' -', row.column_name, ':', row.data_type, '| default:', row.column_default));
    
    await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
