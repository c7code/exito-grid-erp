const fs = require('fs');
const t = fs.readFileSync('app/src/pages/admin/SolarProjects.tsx', 'utf8');
const lines = t.split('\n');

// Fix line 1329 (0-indexed: 1328) - competitiveness rating emojis
// The corrupted byte sequences, decoded as UTF-8 strings:
const line1329 = lines[1328];
let fixed1329 = line1329;

// Build replacement using Buffer manipulation
// 'Ã°Å¸â€Â¥' = bytes: C3B0 C385 C3A2 E282AC C382 C2A5 when in UTF-8
// Just replace by finding pattern and replacing with clean emoji
// Instead: rewrite the whole ternary expression cleanly
fixed1329 = fixed1329.replace(
  /'[^']*Muito competitivo!'[^:]*:[^']*'[^']*Dentro do mercado'[^:]*:[^']*'[^']*Acima do mercado'/,
  "'🏆 Muito competitivo!' : rWp < 5.5 ? '✅ Dentro do mercado' : '⚠️ Acima do mercado'"
);
if (fixed1329 !== line1329) {
  console.log('Line 1329 fixed!');
  lines[1328] = fixed1329;
} else {
  console.log('No match on 1329, trying hard replacement...');
  // Hard replace: rebuild the line entirely
  lines[1328] = "                          <p className={rWp < 5.5 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{rWp < 3.5 ? '🏆 Muito competitivo!' : rWp < 5.5 ? '✅ Dentro do mercado' : '⚠️ Acima do mercado'}</p>\r";
}

// Fix line 1567 (0-indexed: 1566) - equipment qty × symbol
const line1567 = lines[1566];
let fixed1567 = line1567.replace(/[^\x00-\x7F\u00C0-\u024F\u1E00-\u1EFF]{2,}[\s]*\{eq\.quantity\}/g, '× {eq.quantity}');
if (fixed1567 !== line1567) {
  console.log('Line 1567 fixed!');
  lines[1566] = fixed1567;
} else {
  // Hard replace
  lines[1566] = "                                     <p className=\"text-slate-400\">{eq.brand} {eq.model} \u00d7 {eq.quantity}</p>\r";
  console.log('Line 1567 hard replaced');
}

fs.writeFileSync('app/src/pages/admin/SolarProjects.tsx', lines.join('\n'), 'utf8');
console.log('Done!');
