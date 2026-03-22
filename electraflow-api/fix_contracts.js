const { Client } = require('pg');
async function check() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();

    // contracts entity columns
    const contractCols = [
        'id','contractNumber','title','description','type','status',
        'workId','clientId','proposalId',
        'originalValue','addendumValue','finalValue',
        'startDate','endDate','version',
        'scope','paymentTerms','paymentBank','penalties','warranty',
        'confidentiality','termination','forceMajeure','jurisdiction',
        'contractorObligations','clientObligations','generalProvisions','notes',
        'witness1Name','witness1Document','witness2Name','witness2Document',
        'fileUrl',
        'signatureToken','signatureTokenExpiresAt','signedAt',
        'signedByName','signedByDocument','signedByIP','signedByUserAgent',
        'signatureVerificationCode',
        'createdById','updatedById',
        'createdAt','updatedAt','deletedAt'
    ];

    console.log('=== contracts ===');
    const missing = [];
    for (const col of contractCols) {
        try {
            await c.query(`SELECT "${col}" FROM contracts LIMIT 0`);
        } catch (e) {
            console.log(`  ❌ ${col}: ${e.message}`);
            missing.push(col);
        }
    }
    if (!missing.length) console.log('  ✅ All columns present');

    // contract_addendums
    const addCols = ['id','contractId','title','description','valueChange','newEndDate','justification','fileUrl','approvedAt','approvedBy','createdAt','deletedAt'];
    console.log('\n=== contract_addendums ===');
    const missing2 = [];
    for (const col of addCols) {
        try {
            await c.query(`SELECT "${col}" FROM contract_addendums LIMIT 0`);
        } catch (e) {
            console.log(`  ❌ ${col}: ${e.message}`);
            missing2.push(col);
        }
    }
    if (!missing2.length) console.log('  ✅ All columns present');

    // Fix missing
    const fixes = {
        'contracts': {
            workId: 'UUID', clientId: 'UUID', proposalId: 'UUID',
            originalValue: 'DECIMAL(15,2) DEFAULT 0', addendumValue: 'DECIMAL(15,2) DEFAULT 0', finalValue: 'DECIMAL(15,2) DEFAULT 0',
            startDate: 'TIMESTAMP', endDate: 'TIMESTAMP', version: 'INT DEFAULT 1',
            scope: 'TEXT', paymentTerms: 'TEXT', paymentBank: 'TEXT', penalties: 'TEXT',
            warranty: 'TEXT', confidentiality: 'TEXT', termination: 'TEXT', forceMajeure: 'TEXT',
            jurisdiction: 'TEXT', contractorObligations: 'TEXT', clientObligations: 'TEXT',
            generalProvisions: 'TEXT', notes: 'TEXT',
            witness1Name: 'VARCHAR', witness1Document: 'VARCHAR', witness2Name: 'VARCHAR', witness2Document: 'VARCHAR',
            fileUrl: 'VARCHAR',
            signatureToken: 'VARCHAR', signatureTokenExpiresAt: 'TIMESTAMP', signedAt: 'TIMESTAMP',
            signedByName: 'VARCHAR', signedByDocument: 'VARCHAR', signedByIP: 'VARCHAR',
            signedByUserAgent: 'TEXT', signatureVerificationCode: 'VARCHAR',
            createdById: 'UUID', updatedById: 'UUID',
            createdAt: 'TIMESTAMP DEFAULT now()', updatedAt: 'TIMESTAMP DEFAULT now()', deletedAt: 'TIMESTAMP',
            contractNumber: 'VARCHAR', title: 'VARCHAR', description: 'TEXT', type: "VARCHAR DEFAULT 'service'", status: "VARCHAR DEFAULT 'draft'",
        },
        'contract_addendums': {
            contractId: 'UUID', title: 'VARCHAR', description: 'TEXT',
            valueChange: 'DECIMAL(15,2) DEFAULT 0', newEndDate: 'TIMESTAMP',
            justification: 'TEXT', fileUrl: 'VARCHAR', approvedAt: 'TIMESTAMP',
            approvedBy: 'VARCHAR', createdAt: 'TIMESTAMP DEFAULT now()', deletedAt: 'TIMESTAMP',
        }
    };

    if (missing.length > 0) {
        console.log('\n=== Fixing contracts ===');
        for (const col of missing) {
            const type = fixes.contracts[col] || 'VARCHAR';
            try {
                await c.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
                console.log(`  ✅ Fixed ${col}`);
            } catch (e) { console.log(`  ❌ ${col}: ${e.message}`); }
        }
    }

    if (missing2.length > 0) {
        console.log('\n=== Fixing contract_addendums ===');
        for (const col of missing2) {
            const type = fixes.contract_addendums[col] || 'VARCHAR';
            try {
                await c.query(`ALTER TABLE contract_addendums ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
                console.log(`  ✅ Fixed ${col}`);
            } catch (e) { console.log(`  ❌ ${col}: ${e.message}`); }
        }
    }

    await c.end();
    console.log('\nDone!');
}
check();
