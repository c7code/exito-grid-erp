const { Client } = require('pg');
async function check() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();

    // Just run the exact query the service runs
    console.log('=== Test: findAll query ===');
    try {
        const r = await c.query(`
            SELECT c.*, 
                work.id as "work_id", 
                client.id as "client_id",
                proposal.id as "proposal_id",
                addendums.id as "addendum_id",
                "createdByUser".id as "user_id"
            FROM contracts c
            LEFT JOIN works work ON c."workId" = work.id
            LEFT JOIN clients client ON c."clientId" = client.id
            LEFT JOIN proposals proposal ON c."proposalId" = proposal.id
            LEFT JOIN contract_addendums addendums ON addendums."contractId" = c.id AND addendums."deletedAt" IS NULL
            LEFT JOIN users "createdByUser" ON c."createdById" = "createdByUser".id
            WHERE c."deletedAt" IS NULL
            ORDER BY c."createdAt" DESC
            LIMIT 5
        `);
        console.log('✅ Query works! Rows:', r.rowCount);
    } catch (e) {
        console.log('❌ Query failed:', e.message);
    }

    // Test each table individually to find the problem
    const tables = ['works', 'clients', 'proposals', 'contract_addendums', 'users'];
    for (const table of tables) {
        try {
            const r = await c.query(`SELECT * FROM "${table}" LIMIT 0`);
            console.log(`✅ ${table}: ${r.fields.map(f=>f.name).join(', ')}`);
        } catch (e) {
            console.log(`❌ ${table}: ${e.message}`);
        }
    }

    await c.end();
}
check();
