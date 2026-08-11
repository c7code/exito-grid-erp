const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:t0c4d0c03lh02026@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    console.log('=== BUSCANDO eulerfmat2000@gmail.com ===');
    const r1 = await c.query(`SELECT name, email, role, "isActive", status, "lastLoginAt" FROM users WHERE email ILIKE $1`, ['%eulerfmat%']);
    console.log('Resultado:', r1.rows.length ? JSON.stringify(r1.rows, null, 2) : 'NÃO ENCONTRADO');
    
    console.log('\n=== TODOS ADMINS ATIVOS ===');
    const r2 = await c.query(`SELECT name, email, role, "isActive", status FROM users WHERE role IN ('admin','employee') AND "isActive" = true AND "deletedAt" IS NULL`);
    r2.rows.forEach(u => console.log(` ${u.role} | ${u.email} | active:${u.isActive} | status:${u.status}`));
    
    await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
