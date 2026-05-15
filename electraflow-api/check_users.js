require('dotenv').config();
const { Client } = require('pg');

async function main() {
    const c = new Client({ connectionString: process.env.DATABASE_URL || process.env.DB_URL });
    await c.connect();

    const r1 = await c.query(`
        SELECT name, email, role, "isActive", status, "lastLoginAt"
        FROM users
        WHERE "deletedAt" IS NULL
        ORDER BY "lastLoginAt" DESC NULLS LAST
    `);
    
    console.log('USER | EMAIL | ROLE | ACTIVE | STATUS | LAST_LOGIN');
    console.log('---');
    r1.rows.forEach(u => {
        const login = u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().slice(0,16) : 'never';
        console.log(`${u.name} | ${u.email} | ${u.role} | ${u.isActive} | ${u.status} | ${login}`);
    });

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
