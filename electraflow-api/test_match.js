const XLSX = require('xlsx');
const { Client } = require('pg');
const fs = require('fs');

async function main() {
    const wb = XLSX.readFile('C:/Users/Euller Matheus/Downloads/SINAPI_Referência_2026_02.xlsx', { type: 'file', raw: false });
    const csd = wb.Sheets['CSD'];
    const allRows = XLSX.utils.sheet_to_json(csd, { defval: '', header: 1, raw: false });

    // Row 9 = header, Row 10+ = data
    // col[2] = Descrição
    const csdDescs = [];
    for (let r = 10; r < allRows.length; r++) {
        const desc = String(allRows[r][2] || '').trim();
        if (desc) csdDescs.push(desc);
    }

    // Get DB descriptions
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    const comps = await c.query('SELECT code, description FROM sinapi_compositions');
    
    // Build the same lookup map as the import service
    const descToCode = new Map();
    for (const ec of comps.rows) {
        const full = String(ec.description || '').trim().toUpperCase();
        if (!full) continue;
        for (const len of [80, 60, 40, 28]) {
            const key = full.substring(0, len);
            if (key.length >= 15 && !descToCode.has(key)) {
                descToCode.set(key, ec.code);
            }
        }
    }

    // Check how many CSD descriptions match
    let matched = 0, unmatched = 0;
    const unmatchedSamples = [];
    for (const desc of csdDescs) {
        const nd = desc.trim().toUpperCase();
        let found = false;
        for (const len of [80, 60, 40, 28]) {
            const key = nd.substring(0, len);
            if (descToCode.has(key)) { found = true; break; }
        }
        if (found) matched++;
        else {
            unmatched++;
            if (unmatchedSamples.length < 5) {
                unmatchedSamples.push({
                    csd: nd.substring(0, 80),
                });
            }
        }
    }

    console.log(`CSD descriptions total: ${csdDescs.length}`);
    console.log(`Matched: ${matched}`);
    console.log(`Unmatched: ${unmatched}`);
    console.log(`Match rate: ${((matched / csdDescs.length) * 100).toFixed(1)}%`);
    
    console.log('\nUnmatched samples:');
    for (const s of unmatchedSamples) {
        console.log(`  CSD: "${s.csd}"`);
        // Try to find closest in DB
        const csdFirst28 = s.csd.substring(0, 28);
        for (const ec of comps.rows) {
            const dbFirst28 = String(ec.description || '').trim().toUpperCase().substring(0, 28);
            if (dbFirst28 === csdFirst28) {
                console.log(`  DB:  "${String(ec.description).trim().toUpperCase().substring(0, 80)}" (code=${ec.code})`);
                console.log(`  MATCH at 28 but not at higher lengths!`);
                break;
            }
        }
    }

    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
