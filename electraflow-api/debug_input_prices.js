const { DataSource } = require('typeorm');
require('dotenv').config();

async function main() {
    const ds = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });
    await ds.initialize();

    const refs = await ds.query(`SELECT id FROM sinapi_references ORDER BY "createdAt" DESC LIMIT 1`);
    const refId = refs[0]?.id;
    console.log('RefId:', refId);

    // Search inputs for "tomada" with PE price
    const inputs = await ds.query(`
        SELECT i.id, i.code, i.description, i.unit, i.type,
               ip."priceNotTaxed" as price_pe
        FROM sinapi_inputs i
        LEFT JOIN sinapi_input_prices ip ON ip."inputId" = i.id AND ip."referenceId" = $1 AND ip.state = 'PE'
        WHERE i.description ILIKE '%tomada%'
        ORDER BY i.code ASC LIMIT 10
    `, [refId]);

    console.log('\n=== Inputs "tomada" with PE price ===');
    for (const inp of inputs) {
        let avgPrice = null;
        let avgCnt = 0;
        if (!inp.price_pe) {
            const avg = await ds.query(
                `SELECT AVG(CAST("priceNotTaxed" AS numeric)) as avg, COUNT(*) as cnt
                 FROM sinapi_input_prices WHERE "inputId" = $1 AND "referenceId" = $2 AND CAST("priceNotTaxed" AS numeric) > 0`,
                [inp.id, refId]
            );
            avgPrice = avg[0]?.avg ? Number(Number(avg[0].avg).toFixed(2)) : null;
            avgCnt = Number(avg[0]?.cnt || 0);
        }
        console.log(`  ${inp.code} | PE=${inp.price_pe || 'NULL'} | avg=${avgPrice || '-'} (${avgCnt} states) | type=${inp.type} | ${inp.description?.substring(0, 60)}`);
    }

    // Test "cabo" and "disjuntor"
    for (const term of ['cabo', 'disjuntor', 'fio']) {
        console.log(`\n=== Inputs "${term}" ===`);
        const items = await ds.query(`
            SELECT i.id, i.code, i.description, i.type,
                   ip."priceNotTaxed" as price_pe
            FROM sinapi_inputs i
            LEFT JOIN sinapi_input_prices ip ON ip."inputId" = i.id AND ip."referenceId" = $1 AND ip.state = 'PE'
            WHERE i.description ILIKE $2
            ORDER BY i.code ASC LIMIT 5
        `, [refId, `%${term}%`]);
        for (const inp of items) {
            console.log(`  ${inp.code} | PE=${inp.price_pe || 'NULL'} | type=${inp.type} | ${inp.description?.substring(0, 60)}`);
        }
    }

    // Count how many inputs have PE prices
    const totalInputs = await ds.query(`SELECT COUNT(*) as cnt FROM sinapi_inputs WHERE "isActive" = true`);
    const withPE = await ds.query(`SELECT COUNT(DISTINCT ip."inputId") as cnt FROM sinapi_input_prices ip WHERE ip."referenceId" = $1 AND ip.state = 'PE'`, [refId]);
    console.log(`\n=== Stats ===`);
    console.log(`Total active inputs: ${totalInputs[0]?.cnt}`);
    console.log(`Inputs with PE price: ${withPE[0]?.cnt}`);

    await ds.destroy();
}
main().catch(e => { console.error(e); process.exit(1); });
