require('dotenv').config();
const { Client } = require('pg');

async function main() {
    const c = new Client({ connectionString: process.env.DATABASE_URL || process.env.DB_URL });
    await c.connect();

    // Update Andielisson's role from 'client' to 'employee'
    const r = await c.query(`
        UPDATE users
        SET role = 'employee'
        WHERE email = 'andielissoneelsolar@gmail.com'
        RETURNING id, name, email, role, "isActive", status
    `);

    if (r.rows.length > 0) {
        console.log('=== ATUALIZADO COM SUCESSO ===');
        console.log(JSON.stringify(r.rows[0], null, 2));
    } else {
        console.log('Usuario nao encontrado com esse email');
    }

    // Verify
    const r2 = await c.query(`
        SELECT name, email, role, "isActive", status
        FROM users
        WHERE email = 'andielissoneelsolar@gmail.com'
    `);
    console.log('\n=== VERIFICACAO ===');
    console.log(JSON.stringify(r2.rows[0], null, 2));

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
