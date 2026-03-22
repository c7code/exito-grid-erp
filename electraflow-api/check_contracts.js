const { Client } = require('pg');
async function check() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();

    // Check ALL contracts (including soft-deleted)
    const r = await c.query('SELECT id, "contractNumber", title, status, "deletedAt" FROM contracts ORDER BY "createdAt" DESC');
    console.log('ALL contracts:', r.rowCount);
    r.rows.forEach(row => console.log(' ', JSON.stringify(row)));

    // Check if there's a unique constraint on contractNumber
    const constraints = await c.query(`
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints 
        WHERE table_name = 'contracts' AND constraint_type = 'UNIQUE'
    `);
    console.log('\nUnique constraints:');
    constraints.rows.forEach(row => console.log(' ', row.constraint_name, row.constraint_type));

    // Check if signatureToken unique constraint exists
    const indexes = await c.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'contracts' AND indexdef LIKE '%UNIQUE%'
    `);
    console.log('\nUnique indexes:');
    indexes.rows.forEach(row => console.log(' ', row.indexname));

    // Try creating a contract exactly as the service would
    console.log('\n=== Simulating TypeORM INSERT with all entity columns ===');
    const id = require('crypto').randomUUID();
    try {
        await c.query(`
            INSERT INTO contracts (
                id, "contractNumber", title, description, type, status,
                "originalValue", "addendumValue", "finalValue",
                "startDate", "endDate", version,
                scope, "paymentTerms", "paymentBank", penalties, warranty,
                confidentiality, termination, "forceMajeure", jurisdiction,
                "contractorObligations", "clientObligations", "generalProvisions", notes,
                "witness1Name", "witness1Document", "witness2Name", "witness2Document",
                "fileUrl", "signatureToken",
                "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, 'test', 'test desc', 'service', 'draft',
                20000, 0, 20000,
                '2026-03-22', '2026-03-24', 1,
                'test scope', NULL, NULL, NULL, NULL,
                NULL, NULL, NULL, NULL,
                NULL, NULL, NULL, NULL,
                NULL, NULL, NULL, NULL,
                NULL, NULL,
                now(), now()
            )
        `, [id, 'CT-TEST-' + Date.now()]);
        console.log('✅ Full INSERT works!');
        await c.query('DELETE FROM contracts WHERE id = $1', [id]);
    } catch (e) {
        console.log('❌ INSERT failed:', e.message);
        console.log('Detail:', e.detail);
    }

    await c.end();
}
check();
