const fs = require('fs');
const path = 'c:/Users/Euller Matheus/exito-grid-erp/app/src/pages/admin/SolarProjects.tsx';
let t = fs.readFileSync(path, 'utf8');
const lines = t.split('\n');

// Line 1816 (index 1815): fix garbled em dash and Opcao -> Opção
const line = lines[1815];
if (line.includes('Opcao') || line.includes('\u00e2\u0080')) {
  lines[1815] = '                          {activePC.label || `Op\u00e7\u00e3o ${aPCIdx + 1}`} \u2014 Plano de Pagamento\r';
  console.log('Fixed line 1816');
} else {
  console.log('Line already OK:', JSON.stringify(line.trim()));
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Saved.');
