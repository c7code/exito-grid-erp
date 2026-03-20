const { Client } = require('pg');
async function check() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();

    // risk_group_exams entity columns
    const cols = ['id','riskGroupId','examId','requiredOnAdmission','requiredOnPeriodic','requiredOnDismissal','requiredOnReturn','requiredOnFunctionChange','customValidityMonths'];
    console.log('=== risk_group_exams ===');
    const missing = [];
    for (const col of cols) {
        try {
            await c.query(`SELECT "${col}" FROM risk_group_exams LIMIT 0`);
            console.log(`  ✅ ${col}`);
        } catch (e) {
            console.log(`  ❌ ${col}: ${e.message}`);
            missing.push(col);
        }
    }

    // Fix missing columns
    if (missing.length > 0) {
        console.log('\n=== Fixing missing columns ===');
        const fixes = {
            requiredOnAdmission: 'BOOLEAN DEFAULT true',
            requiredOnPeriodic: 'BOOLEAN DEFAULT true',
            requiredOnDismissal: 'BOOLEAN DEFAULT false',
            requiredOnReturn: 'BOOLEAN DEFAULT false',
            requiredOnFunctionChange: 'BOOLEAN DEFAULT false',
            customValidityMonths: 'INT',
        };
        for (const col of missing) {
            const type = fixes[col] || 'VARCHAR';
            const sql = `ALTER TABLE risk_group_exams ADD COLUMN IF NOT EXISTS "${col}" ${type}`;
            try { await c.query(sql); console.log(`  ✅ Fixed ${col}`); }
            catch (e) { console.log(`  ❌ ${col}: ${e.message}`); }
        }
    }

    await c.end();
    console.log('\nDone!');
}
check();
