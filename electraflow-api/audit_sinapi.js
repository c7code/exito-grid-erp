const { Client } = require('pg');

async function main() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    });
    await c.connect();

    // Get all sinapi table names
    const allTables = await c.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name ILIKE '%sinapi%'
        ORDER BY table_name
    `);

    const output = [];
    
    for (const { table_name } of allTables.rows) {
        const cnt = await c.query(`SELECT COUNT(*)::int as total FROM "${table_name}"`);
        const cols = await c.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1 ORDER BY ordinal_position
        `, [table_name]);

        let samples = [];
        if (cnt.rows[0].total > 0) {
            const s = await c.query(`SELECT * FROM "${table_name}" LIMIT 3`);
            samples = s.rows;
        }

        output.push({
            name: table_name,
            rows: cnt.rows[0].total,
            columns: cols.rows,
            samples
        });
    }
    
    await c.end();

    // Write to file as JSON
    const fs = require('fs');
    fs.writeFileSync('sinapi_audit.json', JSON.stringify(output, null, 2), 'utf8');
    console.log('Written to sinapi_audit.json');
    console.log('Tables found: ' + output.map(t => t.name).join(', '));
}

main().catch(e => console.error(e));
