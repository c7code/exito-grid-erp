const { Client } = require('pg');

async function check() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();

    // Get actual columns from DB tables
    const tables = ['proposals', 'proposal_items', 'contracts', 'works', 'clients', 'users'];
    for (const t of tables) {
        const r = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [t]);
        console.log(`\n${t} (${r.rowCount} cols):`);
        console.log('  ' + r.rows.map(x => x.column_name).join(', '));
    }

    // Now simulate what TypeORM generates for the findAll contracts query
    // by doing SELECT * on each table with proper column aliases
    console.log('\n=== Simulating TypeORM contract query ===');
    try {
        const r = await c.query(`
            SELECT c.*
            FROM contracts c
            WHERE c."deletedAt" IS NULL
            LIMIT 1
        `);
        console.log('✅ contracts select OK');
    } catch (e) {
        console.log('❌ contracts select:', e.message);
    }

    // Check if the contract module itself is working
    console.log('\n=== Check contract_addendums table exists ===');
    try {
        const r = await c.query('SELECT count(*) FROM contract_addendums');
        console.log(`✅ contract_addendums count: ${r.rows[0].count}`);
    } catch (e) {
        console.log('❌', e.message);
    }

    await c.end();
}
check();
