const fs = require('fs');
let t = fs.readFileSync('c:/Users/Euller Matheus/exito-grid-erp/app/src/pages/admin/SolarProjects.tsx', 'utf8');

// Fix the broken Radix Select for Tipo with native select
const oldBlock = /<Select value=\{line\.type \|\| 'parcelas'\} onValueChange=\{v => setLine\(aPCIdx, li, 'type', v\)\}>\s*<SelectTrigger[^>]*>[\s\S]*?<\/SelectTrigger>\s*<SelectContent>[\s\S]*?<\/SelectContent>\s*<\/Select>/;

const newSelect = [
  '<select',
  "                                     value={line.type || 'parcelas'}",
  '                                     onChange={e => setLine(aPCIdx, li, \'type\', e.target.value)}',
  '                                     className="h-7 text-xs border border-slate-200 rounded px-2 bg-white cursor-pointer font-semibold w-[120px]">',
  '                                     <option value="entrada">Entrada</option>',
  '                                     <option value="parcelas">Parcelas</option>',
  '                                     <option value="financiamento">Financiamento</option>',
  '                                     <option value="avista">\u00c0 Vista</option>',
  '                                     <option value="desconto">Desconto</option>',
  '                                     <option value="outro">Outro</option>',
  '                                   </select>',
].join('\n');

const matched = oldBlock.test(t);
console.log('Pattern found:', matched);

if (matched) {
  t = t.replace(oldBlock, newSelect);
  fs.writeFileSync('c:/Users/Euller Matheus/exito-grid-erp/app/src/pages/admin/SolarProjects.tsx', t, 'utf8');
  console.log('Select replaced successfully');
} else {
  // Try line-by-line approach
  const lines = t.split('\n');
  let start = -1, end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<Select value={line.type') && lines[i].includes('onValueChange')) {
      start = i;
    }
    if (start >= 0 && lines[i].includes('</Select>')) {
      end = i;
      break;
    }
  }
  console.log('Line range:', start + 1, 'to', end + 1);
  if (start >= 0 && end >= 0) {
    const before = lines.slice(0, start);
    const after = lines.slice(end + 1);
    const replacement = newSelect.split('\n');
    const result = [...before, ...replacement, ...after].join('\n');
    fs.writeFileSync('c:/Users/Euller Matheus/exito-grid-erp/app/src/pages/admin/SolarProjects.tsx', result, 'utf8');
    console.log('Select replaced via line-by-line approach');
  }
}
