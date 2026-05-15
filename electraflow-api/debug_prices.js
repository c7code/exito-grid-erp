require('dotenv').config();
const { Client } = require('pg');

async function check() {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // Check if reference exists
    const refs = await client.query(`SELECT id, year, month FROM sinapi_references ORDER BY "createdAt" DESC LIMIT 3`);
    console.log('=== References ===');
    refs.rows.forEach(r => console.log(`  ${r.id} | ${r.year}/${r.month}`));
    const refId = refs.rows[0]?.id;
    console.log(`Active ref: ${refId}\n`);

    // Search "tomada" compositions with cost
    const comps = await client.query(`
        SELECT c.id, c.code, c.description, c.unit, 'composition' as type,
               cc."totalNotTaxed" as price, cc."totalTaxed" as price_taxed
        FROM sinapi_compositions c
        LEFT JOIN sinapi_composition_costs cc ON cc."compositionId" = c.id AND cc."referenceId" = $2 AND cc.state = $3
        WHERE c."isActive" = true AND (c.code ILIKE $1 OR c.description ILIKE $1)
        ORDER BY c.code ASC LIMIT 5
    `, ['%tomada%', refId, 'PE']);
    
    console.log('=== Compositions "tomada" ===');
    comps.rows.forEach(r => console.log(`  ${r.code} | price=${r.price} | ${r.description?.substring(0, 60)}`));

    // Search inputs
    const inputs = await client.query(`
        SELECT i.id, i.code, i.description, i.unit, i.type as input_type, 'input' as type,
               ip."priceNotTaxed" as price, ip."priceTaxed" as price_taxed
        FROM sinapi_inputs i
        LEFT JOIN sinapi_input_prices ip ON ip."inputId" = i.id AND ip."referenceId" = $2 AND ip.state = $3
        WHERE i.code ILIKE $1 OR i.description ILIKE $1
        ORDER BY i.code ASC LIMIT 5
    `, ['%tomada%', refId, 'PE']);
    
    console.log('\n=== Inputs "tomada" ===');
    inputs.rows.forEach(r => console.log(`  ${r.code} | price=${r.price} | type=${r.input_type} | ${r.description?.substring(0, 60)}`));

    // Check composition_costs table structure
    const costCount = await client.query(`SELECT COUNT(*) as cnt FROM sinapi_composition_costs WHERE "referenceId" = $1 AND state = 'PE'`, [refId]);
    console.log(`\n=== Composition costs for PE with this ref: ${costCount.rows[0].cnt}`);

    const inputPriceCount = await client.query(`SELECT COUNT(*) as cnt FROM sinapi_input_prices WHERE "referenceId" = $1 AND state = 'PE'`, [refId]);
    console.log(`=== Input prices for PE with this ref: ${inputPriceCount.rows[0].cnt}`);

    // Check if costs exist for any state
    const anyState = await client.query(`SELECT state, COUNT(*) as cnt FROM sinapi_composition_costs WHERE "referenceId" = $1 GROUP BY state ORDER BY cnt DESC LIMIT 5`, [refId]);
    console.log('\n=== Costs by state ===');
    anyState.rows.forEach(r => console.log(`  ${r.state}: ${r.cnt}`));

    const anyInputState = await client.query(`SELECT state, COUNT(*) as cnt FROM sinapi_input_prices WHERE "referenceId" = $1 GROUP BY state ORDER BY cnt DESC LIMIT 5`, [refId]);
    console.log('\n=== Input prices by state ===');
    anyInputState.rows.forEach(r => console.log(`  ${r.state}: ${r.cnt}`));

    await client.end();
}

check().catch(e => { console.error(e); process.exit(1); });
