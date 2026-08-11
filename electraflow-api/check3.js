const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:t0c4d0c03lh02026@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    console.log('\n=== PV-0009 DADOS COMPLETOS ===');
    const sp = await c.query('SELECT * FROM solar_projects WHERE code = $1', ['PV-0009']);
    if (sp.rows.length) {
        const r = sp.rows[0];
        console.log('systemPowerKwp:', r.systemPowerKwp);
        console.log('moduleCount:', r.moduleCount);
        console.log('monthlyGenerationKwh:', r.monthlyGenerationKwh);
        console.log('consumptionKwh:', r.consumptionKwh);
        console.log('tariff:', r.tariff);
        console.log('monthlySavings:', r.monthlySavings);
        console.log('paybackMonths:', r.paybackMonths);
        console.log('totalInvestment:', r.totalInvestment);
        console.log('roiPercent:', r.roiPercent);
        console.log('commercialKits:', r.commercialKits ? 'SIM ('+JSON.stringify(r.commercialKits).length+' bytes)' : 'NULL');
        console.log('equipment:', r.equipment ? 'SIM ('+JSON.stringify(r.equipment).length+' bytes)' : 'NULL');
        console.log('proposalId:', r.proposalId);
        console.log('clientId:', r.clientId);
        console.log('companyId:', r.companyId);
    }
    
    console.log('\n=== SIMULACAO getPartnerProposal para PROP-2026-086 ===');
    const proposalId = '0d35c4d2-95d0-439d-a03a-c55a7cf053aa';
    const byProp = await c.query(`SELECT id, code, "systemPowerKwp" FROM solar_projects WHERE "proposalId" = $1`, [proposalId]);
    console.log('Por proposalId:', byProp.rows.length ? byProp.rows[0] : 'NAO ENCONTRADO');
    
    const company = await c.query(`SELECT * FROM companies WHERE "isPrimary" = true AND "deletedAt" IS NULL LIMIT 1`);
    console.log('Company:', company.rows.length ? company.rows[0].name : 'NAO ENCONTRADO - ZERO EMPRESAS!');
    
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
