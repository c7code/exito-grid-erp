const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse entity files for @Column decorators to find expected column names
function parseEntityColumns(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cols = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Match: @Column(...) or @PrimaryGeneratedColumn or @CreateDateColumn etc.
        if (line.match(/@(Column|PrimaryGeneratedColumn|CreateDateColumn|UpdateDateColumn|DeleteDateColumn)/)) {
            // Find the property name on next non-decorator line
            for (let j = i + 1; j < lines.length && j < i + 5; j++) {
                const nextLine = lines[j].trim();
                if (nextLine.startsWith('@')) continue; // skip more decorators
                const propMatch = nextLine.match(/^(\w+)[\?:]?\s*[:;]/);
                if (propMatch) {
                    cols.push(propMatch[1]);
                    break;
                }
            }
        }
    }
    // Remove relation properties (they don't map to columns)
    return cols.filter(c => !['work', 'client', 'proposal', 'addendums', 'createdByUser', 'items', 'assignedEngineer', 'assignedDesigner', 'opportunity', 'updatedByUser', 'supervisor', 'employee', 'clinicSupplier', 'company', 'safetyProgram', 'riskGroup', 'exam', 'exams'].includes(c));
}

async function check() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await c.connect();

    const base = 'C:/Users/Euller Matheus/exito-grid-erp/electraflow-api/src';
    const entities = [
        { name: 'works', file: path.join(base, 'works/work.entity.ts') },
        { name: 'proposals', file: path.join(base, 'proposals/proposal.entity.ts') },
        { name: 'clients', file: path.join(base, 'clients/client.entity.ts') },
    ];

    for (const ent of entities) {
        console.log(`\n=== ${ent.name} ===`);
        const entityCols = parseEntityColumns(ent.file);
        const missing = [];
        for (const col of entityCols) {
            try {
                await c.query(`SELECT "${col}" FROM ${ent.name} LIMIT 0`);
            } catch (e) {
                console.log(`  ❌ ${col}`);
                missing.push(col);
            }
        }
        if (!missing.length) console.log('  ✅ All columns present');
    }

    await c.end();
}
check();
