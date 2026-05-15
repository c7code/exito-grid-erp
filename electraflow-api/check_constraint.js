require('dotenv').config();
const { Client } = require('pg');

async function main() {
    const c = new Client({ connectionString: process.env.DATABASE_URL || process.env.DB_URL });
    await c.connect();

    // Find the constraint
    const r1 = await c.query(`
        SELECT conname, conrelid::regclass AS table_name, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
        WHERE conname = 'UQ_22e013993d377e74f9aa6638a08'
    `);
    console.log('=== Constraint UQ_22e013993d377e74f9aa6638a08 ===');
    console.log(JSON.stringify(r1.rows, null, 2));

    // Also check all unique constraints on solar_projects
    const r2 = await c.query(`
        SELECT conname, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
        WHERE conrelid = 'solar_projects'::regclass AND contype = 'u'
    `);
    console.log('\n=== All UNIQUE constraints on solar_projects ===');
    console.log(JSON.stringify(r2.rows, null, 2));

    // Check for duplicates in the code column
    const r3 = await c.query(`
        SELECT code, COUNT(*) as cnt FROM solar_projects GROUP BY code HAVING COUNT(*) > 1
    `);
    console.log('\n=== Duplicate codes ===');
    console.log(JSON.stringify(r3.rows, null, 2));

    // Show last 5 projects
    const r4 = await c.query(`
        SELECT id, code, title, status, "createdAt", "deletedAt" FROM solar_projects ORDER BY "createdAt" DESC LIMIT 5
    `);
    console.log('\n=== Last 5 solar projects ===');
    console.log(JSON.stringify(r4.rows, null, 2));

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
