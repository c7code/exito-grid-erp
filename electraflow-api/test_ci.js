const { Client } = require('pg');
async function test() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();

    // Simulate what TypeORM contractRepo.save() does
    const id = require('crypto').randomUUID();
    const contractNumber = 'CT-2026-TEST';
    
    console.log('=== Test INSERT into contracts ===');
    try {
        await c.query(`
            INSERT INTO contracts (id, "contractNumber", title, description, type, status, "originalValue", "finalValue", "startDate", "endDate", version, scope, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
        `, [id, contractNumber, 'energia solar', 'instalação de energia solar', 'service', 'draft', 20000, 20000, '2026-03-22', '2026-03-24', 1, 'instalação de energia solar']);
        console.log('✅ INSERT worked! id:', id);
        
        // Now test the findOne query with relations (what create() returns)
        console.log('\n=== Test SELECT with JOINs ===');
        const r = await c.query(`
            SELECT c.*
            FROM contracts c
            LEFT JOIN works work ON c."workId" = work.id
            LEFT JOIN clients client ON c."clientId" = client.id  
            LEFT JOIN proposals proposal ON c."proposalId" = proposal.id
            LEFT JOIN contract_addendums addendums ON addendums."contractId" = c.id
            WHERE c.id = $1
        `, [id]);
        console.log('✅ SELECT with joins worked! Cols:', r.fields.length);
        
        // Clean up
        await c.query('DELETE FROM contracts WHERE id = $1', [id]);
        console.log('✅ Cleaned up test row');
    } catch (e) {
        console.log('❌ ERROR:', e.message);
        console.log('Detail:', e.detail);
        console.log('Code:', e.code);
        // Clean up on error
        try { await c.query('DELETE FROM contracts WHERE id = $1', [id]); } catch {}
    }

    // Check if there are existing contracts with unique constraint issues
    console.log('\n=== Check existing contracts ===');
    const r = await c.query('SELECT id, "contractNumber", title FROM contracts WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 5');
    console.log('Existing:', r.rowCount);
    r.rows.forEach(row => console.log('  -', row.contractNumber, ':', row.title));

    // Check count (used for generating contract number)
    const countR = await c.query('SELECT count(*) FROM contracts');
    console.log('Total count (incl deleted):', countR.rows[0].count);

    await c.end();
}
test();
