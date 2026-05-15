const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();

    // Get CSD warnings
    const ref = await c.query(`SELECT warnings, errors, status, "insertedCount" FROM sinapi_import_logs WHERE "fileName" LIKE '%Refer%' ORDER BY "createdAt" DESC LIMIT 1`);
    console.log('Status:', ref.rows[0].status, 'Inserted:', ref.rows[0].insertedCount);
    
    const w = JSON.parse(ref.rows[0].warnings || '[]');
    for (const l of w) {
        if (l.includes('COMP') || l.includes('comp') || l.includes('descToCode') || l.includes('SKIP') || l.includes('DEBUG')) console.log(l);
    }

    const e = JSON.parse(ref.rows[0].errors || '[]');
    console.log('\nErrors:', e.length);
    for (const l of e.slice(0, 10)) console.log(l);

    // Check: can we find 91998 description in CSD?
    // The desc from DB is: "TOMADA BAIXA DE EMBUTIR (1 MÓDULO), 2P+T 10 A, SEM SUPORTE E SEM PLACA - FORNECIMENTO E INSTALAÇÃO. AF_03/2023"
    // First 28 chars: "TOMADA BAIXA DE EMBUTIR (1 M"
    // First 40 chars: "TOMADA BAIXA DE EMBUTIR (1 MÓDULO), 2P+"
    // First 60 chars: "TOMADA BAIXA DE EMBUTIR (1 MÓDULO), 2P+T 10 A, SEM SUPORTE"
    // In CSD the desc is probably truncated differently

    // How many composition_costs have totalNotTaxed > 0?
    const withCost = await c.query(`SELECT COUNT(*) as cnt FROM sinapi_composition_costs WHERE "totalNotTaxed" IS NOT NULL AND "totalNotTaxed" > 0`);
    console.log('\ntotalNotTaxed > 0:', withCost.rows[0].cnt);
    
    // How many distinct compositions have costs?
    const distinctComps = await c.query(`SELECT COUNT(DISTINCT "compositionId") as cnt FROM sinapi_composition_costs WHERE "totalNotTaxed" IS NOT NULL AND "totalNotTaxed" > 0`);
    console.log('Distinct compositions with costs:', distinctComps.rows[0].cnt);
    
    // Total compositions
    const totalComps = await c.query(`SELECT COUNT(*) as cnt FROM sinapi_compositions`);
    console.log('Total compositions:', totalComps.rows[0].cnt);
    console.log('Coverage:', ((parseInt(distinctComps.rows[0].cnt) / parseInt(totalComps.rows[0].cnt)) * 100).toFixed(1) + '%');

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
