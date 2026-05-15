const XLSX = require('xlsx');

const wb = XLSX.readFile('C:/Users/Euller Matheus/Downloads/SINAPI_Referência_2026_02.xlsx', { type: 'file', raw: false });
const csd = wb.Sheets['CSD'];
const allRows = XLSX.utils.sheet_to_json(csd, { defval: '', header: 1, raw: false });

const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const norm = (v) => String(v || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

// Simulate parseSheet logic
let ufRow = -1, labelRow = -1;
const KW = ['CODIGO', 'DESCRICAO', 'UNIDADE', 'CLASSIFICACAO', 'GRUPO', 'COEFICIENTE', 'COMPOSICAO', 'INSUMO', 'TIPO'];

for (let r = 0; r < 30; r++) {
    const vals = (allRows[r] || []).map(v => norm(v));
    const ufCount = vals.filter(v => UF_LIST.includes(v)).length;
    if (ufCount >= 10 && ufRow === -1) ufRow = r;

    let kwCount = 0;
    for (const val of vals) {
        if (val && KW.some(k => val.includes(k))) kwCount++;
    }
    if (kwCount >= 2 && (labelRow === -1 || kwCount > 2)) labelRow = r;
}

console.log('ufRow:', ufRow, '→', JSON.stringify((allRows[ufRow] || []).slice(0, 8)));
console.log('labelRow:', labelRow, '→', JSON.stringify((allRows[labelRow] || []).slice(0, 8)));

// Build headers
let headers = allRows[ufRow].map(v => String(v || '').replace(/[\r\n]+/g, ' ').trim());
if (labelRow > ufRow) {
    const labelVals = allRows[labelRow].map(v => String(v || '').replace(/[\r\n]+/g, ' ').trim());
    for (let c = 0; c < Math.max(headers.length, labelVals.length); c++) {
        const h = norm(headers[c] || '');
        const lv = labelVals[c] || '';
        if (!UF_LIST.includes(h) && lv && lv.length > 1) headers[c] = lv;
    }
}

console.log('\nFinal headers (first 12):');
for (let c = 0; c < 12; c++) {
    console.log(`  [${c}] = "${headers[c]}"`);
}

// Build sample row object
const dataRow = allRows[11]; // first data row after headers
const obj = {};
for (let c = 0; c < headers.length; c++) {
    if (headers[c]) obj[headers[c]] = dataRow[c] !== undefined ? String(dataRow[c]) : '';
}
console.log('\nSample row object keys:', Object.keys(obj).slice(0, 10));
console.log('Descrição:', obj['Descrição']);
console.log('Código da Composição:', obj['Código da Composição']);
console.log('Grupo:', obj['Grupo']);
console.log('AC:', obj['AC']);
