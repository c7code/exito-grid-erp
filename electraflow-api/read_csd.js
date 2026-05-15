const XLSX = require('xlsx');

const wb = XLSX.readFile('C:/Users/Euller Matheus/Downloads/SINAPI_Referência_2026_02.xlsx', { type: 'file', raw: false });
console.log('Sheets:', wb.SheetNames);

// Look at CSD sheet
const csd = wb.Sheets['CSD'];
const allRows = XLSX.utils.sheet_to_json(csd, { defval: '', header: 1, raw: false });

console.log('\n=== CSD First 15 rows (first 8 cols) ===');
for (let r = 0; r < 15 && r < allRows.length; r++) {
    const row = allRows[r].slice(0, 8);
    console.log(`Row ${r}: ${JSON.stringify(row)}`);
}

// Now find a specific composition - 91998
console.log('\n=== Searching for 91998 ===');
for (let r = 0; r < allRows.length; r++) {
    const row = allRows[r];
    const hasCode = row.some(v => String(v).includes('91998'));
    if (hasCode) {
        console.log(`Row ${r}: ${JSON.stringify(row.slice(0, 10))}`);
    }
}

// Show row count
console.log(`\nTotal CSD rows: ${allRows.length}`);
