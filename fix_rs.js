const fs = require('fs');
const path = 'c:/Users/Euller Matheus/exito-grid-erp/app/src/pages/admin/SolarProjects.tsx';
let t = fs.readFileSync(path, 'utf8');

// Fix line 1986: "R$ ${fmt(line.unitValue)}" -> "${fmt(line.unitValue)}" (fmt already has R$)
t = t.replace(
  '`${line.qty}x ${fmt(line.unitValue)}` : `R$ ${fmt(line.unitValue)}`',
  '`${line.qty}x ${fmt(line.unitValue)}` : `${fmt(line.unitValue)}`'
);

// Fix lineTotal to use Math.max(1, qty) so qty=0 doesn't break calculation
// Actually the || 1 default is fine for calculation purposes, let's just fix the display
// The real fix: change qty input to use numVal(line.qty ?? 1) so 0 shows as empty
// but store actual value. Already done.

// Also fix the qty display in subtotal: "12x R$ 1.545,99" has double R$?
// Let's check: fmt(line.unitValue) returns "R$ 1.545,99", and the template is
// `${line.qty}x ${fmt(line.unitValue)}` = "12x R$ 1.545,99" - that's fine, no double R$

fs.writeFileSync(path, t, 'utf8');

// Verify no more double R$
const remaining = t.split('\n').filter(l => l.includes('R$ ${fmt(') || l.includes('R$ {fmt('));
if (remaining.length === 0) {
  console.log('All double R$ issues fixed!');
} else {
  console.log('Still have issues:');
  remaining.forEach(l => console.log(' -', l.trim().substring(0, 120)));
}
