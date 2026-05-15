const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('C:/Users/Euller Matheus/Downloads/SINAPI_Referência_2026_02.xlsx', { type: 'file', raw: false });
const csd = wb.Sheets['CSD'];
const allRows = XLSX.utils.sheet_to_json(csd, { defval: '', header: 1, raw: false });

const out = [];
out.push('=== CSD HEADER ROWS (0-10) ===');
for (let r = 0; r < 10; r++) {
    out.push(`Row ${r}: ${JSON.stringify((allRows[r] || []).slice(0, 8))}`);
}

// Find 91998
out.push('\n=== ROW WITH 91998 ===');
for (let r = 0; r < allRows.length; r++) {
    const row = allRows[r] || [];
    if (row.some(v => String(v).includes('91998'))) {
        out.push(`Row ${r}: ${JSON.stringify(row.slice(0, 10))}`);
    }
}

// Show a data row sample (row 11)
out.push('\n=== DATA ROW (row 11) ===');
const dr = allRows[11] || [];
for (let c = 0; c < dr.length; c++) {
    out.push(`  col[${c}] = "${dr[c]}"`);
}

out.push(`\nTotal: ${allRows.length} rows, ${(allRows[11] || []).length} cols`);
fs.writeFileSync('csd_debug.txt', out.join('\n'), 'utf8');
console.log('Written to csd_debug.txt');
