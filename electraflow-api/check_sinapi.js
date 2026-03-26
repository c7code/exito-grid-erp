const { Client } = require('pg');
async function main() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    });
    await c.connect();
    
    // Test the exact query from searchInputs
    try {
        const sql = `
            SELECT i.*, p."priceNotTaxed", p."priceTaxed", p."medianPrice",
                   r.year as "refYear", r.month as "refMonth", r.state as "refState"
            FROM sinapi_inputs i
            LEFT JOIN LATERAL (
                SELECT ip."priceNotTaxed", ip."priceTaxed", ip."medianPrice", ip."referenceId"
                FROM sinapi_input_prices ip
                JOIN sinapi_references sr ON sr.id = ip."referenceId" AND sr.state = 'PE'
                WHERE ip."inputId" = i.id
                ORDER BY sr.year DESC, sr.month DESC
                LIMIT 1
            ) p ON true
            LEFT JOIN sinapi_references r ON r.id = p."referenceId"
            WHERE i."isActive" = true AND (i.code ILIKE $1 OR i.description ILIKE $1)
            ORDER BY i.code ASC
            LIMIT $2 OFFSET $3
        `;
        const result = await c.query(sql, ['%tomada%', 25, 0]);
        console.log('Query OK:', result.rows.length, 'rows');
        if (result.rows.length > 0) {
            const r = result.rows[0];
            console.log('Sample:', { code: r.code, unit: r.unit, type: r.type, priceNotTaxed: r.priceNotTaxed, priceTaxed: r.priceTaxed, refYear: r.refYear });
        }
    } catch (e) {
        console.error('QUERY ERROR:', e.message);
    }
    
    // Check if sinapi_input_prices has any data
    const prices = await c.query('SELECT COUNT(*) as c FROM sinapi_input_prices');
    console.log('sinapi_input_prices count:', prices.rows[0].c);
    
    // Check references
    const refs = await c.query('SELECT * FROM sinapi_references ORDER BY year DESC, month DESC LIMIT 5');
    console.log('References:', refs.rows.map(r => `${r.state} ${r.month}/${r.year} [${r.status}]`));
    
    await c.end();
}
main().catch(e => console.error(e));
