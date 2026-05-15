const fs = require('fs');
const path = 'c:/Users/Euller Matheus/exito-grid-erp/app/src/pages/admin/SolarProjects.tsx';
let t = fs.readFileSync(path, 'utf8');
const lines = t.split('\n');

// Remove typeLabels block (lines 1685-1688, indices 1684-1687)
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const typeLabels: Record')) {
    start = i;
    break;
  }
}

if (start >= 0) {
  // Find the closing }; of typeLabels
  let end = start;
  for (let i = start; i < start + 10; i++) {
    if (lines[i].includes('};') && i > start) {
      end = i;
      break;
    }
  }
  console.log('Removing typeLabels from line', start + 1, 'to', end + 1);
  lines.splice(start, end - start + 1);
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log('Done. typeLabels removed.');
} else {
  console.log('typeLabels not found');
}
