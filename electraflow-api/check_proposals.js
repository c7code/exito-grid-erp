const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:t0c4d0c03lh02026@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();

    console.log('\n=== PROPOSTAS VINCULADAS A LEADS DE PARCEIROS ===');
    const linked = await c.query(`
        SELECT 
            p.id, p."proposalNumber", p."activityType", p.total, p."clientId",
            lp.visible, lp."allowDownload",
            rl."consultantId",
            cl.name as client_name
        FROM referral_lead_proposals lp
        JOIN proposals p ON p.id = lp."proposalId"
        JOIN referral_leads rl ON rl.id = lp."leadId"
        LEFT JOIN clients cl ON cl.id = p."clientId"
        WHERE lp.visible = true
        ORDER BY p."createdAt" DESC
        LIMIT 10
    `);
    console.log(`Total propostas visiveis: ${linked.rows.length}`);
    for (const r of linked.rows) {
        console.log(`  Proposta: ${r.proposalNumber} | activityType: "${r.activityType}" | total: ${r.total} | clientId: ${r.clientId}`);
    }

    console.log('\n=== SOLAR PROJECTS - LINK COM PROPOSALS ===');
    const solar = await c.query(`
        SELECT sp.id, sp.code, sp."proposalId", sp."clientId", sp."systemPowerKwp", sp."monthlyGenerationKwh", sp."deletedAt"
        FROM solar_projects sp
        WHERE sp."deletedAt" IS NULL
        ORDER BY sp."createdAt" DESC
        LIMIT 10
    `);
    console.log(`Total solar_projects ativos: ${solar.rows.length}`);
    for (const r of solar.rows) {
        console.log(`  Projeto: ${r.code} | proposalId: ${r.proposalId || 'NULL'} | clientId: ${r.clientId} | ${r.systemPowerKwp}kWp`);
    }

    console.log('\n=== CRUZAMENTO: PROPOSTAS SOLAR vs SOLAR_PROJECTS ===');
    if (linked.rows.length > 0) {
        for (const proposal of linked.rows) {
            if (proposal.activityType === 'energia_solar') {
                // Busca por proposalId
                const byProp = await c.query(`SELECT id, code, "systemPowerKwp" FROM solar_projects WHERE "proposalId" = $1 LIMIT 1`, [proposal.id]);
                // Busca por clientId
                const byClient = await c.query(`SELECT id, code, "systemPowerKwp" FROM solar_projects WHERE "clientId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1`, [proposal.clientId]);
                console.log(`  Proposta ${proposal.proposalNumber}:`);
                console.log(`    Por proposalId: ${byProp.rows.length ? byProp.rows[0].code + ' ' + byProp.rows[0].systemPowerKwp + 'kWp' : 'NAO ENCONTRADO'}`);
                console.log(`    Por clientId:   ${byClient.rows.length ? byClient.rows[0].code + ' ' + byClient.rows[0].systemPowerKwp + 'kWp' : 'NAO ENCONTRADO'}`);
            }
        }
    }

    console.log('\n=== EMPRESA PRINCIPAL ===');
    const co = await c.query(`SELECT id, name, "tradeName", "isPrimary", cnpj FROM companies WHERE "isPrimary" = true AND "deletedAt" IS NULL LIMIT 3`);
    console.log(`Empresas primarias: ${co.rows.length}`);
    for (const r of co.rows) {
        console.log(`  ${r.tradeName || r.name} | CNPJ: ${r.cnpj} | isPrimary: ${r.isPrimary}`);
    }

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
