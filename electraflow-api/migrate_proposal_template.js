const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:t0c4d0c03lh02026@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    // Adiciona coluna proposalTemplate com default 'commercial' (solar usa o template comercial por padrao)
    await c.query(`
        ALTER TABLE referral_lead_proposals 
        ADD COLUMN IF NOT EXISTS "proposalTemplate" varchar(20) DEFAULT 'commercial'
    `);
    console.log('Coluna proposalTemplate adicionada com sucesso');
    
    // Verifica
    const cols = await c.query(
        "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'referral_lead_proposals' ORDER BY ordinal_position"
    );
    cols.rows.forEach(r => console.log(' -', r.column_name, ':', r.data_type, '| default:', r.column_default));
    
    await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
