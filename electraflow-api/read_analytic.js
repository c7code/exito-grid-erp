const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('C:/Users/Euller Matheus/Downloads/SINAPI_Referência_2026_02.xlsx', { type: 'file', raw: false });

// Find Analítico sheet
const analyticName = wb.SheetNames.find(s => s.includes('nalítico') || s.includes('nalitico'));
console.log('Analytic sheet:', analyticName);

const sheet = wb.Sheets[analyticName];
const allRows = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1, raw: false });

const out = [];
out.push(`Sheet: ${analyticName}, Total rows: ${allRows.length}`);
out.push('\n=== FIRST 12 ROWS ===');
for (let r = 0; r < 12 && r < allRows.length; r++) {
    out.push(`Row ${r}: ${JSON.stringify((allRows[r] || []).slice(0, 10))}`);
}

// Find composition 91998
out.push('\n=== ROWS WITH 91998 ===');
for (let r = 0; r < allRows.length; r++) {
    const row = allRows[r] || [];
    if (row.some(v => String(v).includes('91998'))) {
        out.push(`Row ${r}: ${JSON.stringify(row.slice(0, 10))}`);
        // Also show next 5 rows (items of that composition)
        for (let i = 1; i <= 5 && r + i < allRows.length; i++) {
            out.push(`Row ${r+i}: ${JSON.stringify((allRows[r+i] || []).slice(0,10))}`);
        }
        break;
    }
}

fs.writeFileSync('analytic_debug.txt', out.join('\n'), 'utf8');
console.log('Written to analytic_debug.txt');
