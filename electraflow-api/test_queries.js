const { Client } = require('pg');
async function test() {
    const client = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    // Test the exact query that TypeORM would generate for findAllPrograms
    console.log('=== Test 1: SELECT * FROM safety_programs ===');
    try {
        const r = await client.query('SELECT * FROM safety_programs LIMIT 1');
        console.log('✅ Columns:', r.fields.map(f => f.name).join(', '));
        console.log('   Rows:', r.rowCount);
    } catch (e) { console.log('❌', e.message); }

    // Test columns the entity expects
    console.log('\n=== Test 2: safety_programs all entity columns ===');
    const spCols = ['id','companyId','programType','name','nrReference','responsibleName','responsibleRegistration','validFrom','validUntil','status','fileUrl','fileName','observations','createdAt','updatedAt','deletedAt'];
    for (const col of spCols) {
        try {
            await client.query(`SELECT "${col}" FROM safety_programs LIMIT 0`);
            console.log(`  ✅ ${col}`);
        } catch (e) { console.log(`  ❌ ${col}: ${e.message}`); }
    }

    // Test risk_groups columns
    console.log('\n=== Test 3: risk_groups all entity columns ===');
    const rgCols = ['id','programId','name','code','jobFunctions','risks','examFrequencyMonths','isActive','createdAt','updatedAt','deletedAt'];
    for (const col of rgCols) {
        try {
            await client.query(`SELECT "${col}" FROM risk_groups LIMIT 0`);
            console.log(`  ✅ ${col}`);
        } catch (e) { console.log(`  ❌ ${col}: ${e.message}`); }
    }

    // Test occupational_exams columns
    console.log('\n=== Test 4: occupational_exams all entity columns ===');
    const oeCols = ['id','name','code','group','validityMonths','description','isActive','sortOrder','createdAt','updatedAt','deletedAt'];
    for (const col of oeCols) {
        try {
            await client.query(`SELECT "${col}" FROM occupational_exams LIMIT 0`);
            console.log(`  ✅ ${col}`);
        } catch (e) { console.log(`  ❌ ${col}: ${e.message}`); }
    }

    // Test join query (what findAllPrograms does with relations)
    console.log('\n=== Test 5: JOIN safety_programs → companies ===');
    try {
        await client.query('SELECT sp.*, c.id as "company_id" FROM safety_programs sp LEFT JOIN companies c ON sp."companyId" = c.id LIMIT 0');
        console.log('✅ JOIN works');
    } catch (e) { console.log('❌ JOIN error:', e.message); }

    await client.end();
    console.log('\nDone!');
}
test();
