const { Client } = require('pg');

async function checkTables() {
    const client = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    const tables = [
        'safety_programs', 'risk_groups', 'occupational_exams', 
        'risk_group_exams', 'exam_referrals', 'exam_referral_items',
        'company_documents'
    ];
    
    console.log('=== Checking tables ===');
    for (const t of tables) {
        try {
            const res = await client.query(`SELECT COUNT(*) FROM ${t}`);
            console.log(`✅ ${t}: exists (${res.rows[0].count} rows)`);
        } catch (e) {
            console.log(`❌ ${t}: ${e.message}`);
        }
    }
    
    // Check columns
    console.log('\n=== Checking new columns ===');
    try {
        await client.query(`SELECT "jobFunction", "riskGroupId" FROM employees LIMIT 0`);
        console.log('✅ employees.jobFunction + riskGroupId exist');
    } catch (e) {
        console.log(`❌ employees columns: ${e.message}`);
    }
    
    try {
        await client.query(`SELECT modality FROM suppliers LIMIT 0`);
        console.log('✅ suppliers.modality exists');
    } catch (e) {
        console.log(`❌ suppliers.modality: ${e.message}`);
    }
    
    await client.end();
}

checkTables().catch(console.error);
