const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:t0c4d0c03lh02026@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    console.log('=== TODOS OS PARCEIROS ===');
    const r = await c.query(`SELECT id, name, email, status, "isPortalActive", "lastLoginAt" FROM referral_consultants WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 10`);
    r.rows.forEach(p => console.log(` ${p.name} | ${p.email} | ativo:${p.isPortalActive} | status:${p.status} | lastLogin:${p.lastLoginAt || 'nunca'}`));
    
    await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
