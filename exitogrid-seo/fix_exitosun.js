const fs = require('fs');
const file = 'c:/Users/Carlos Mendes/Downloads/public_html (4)/exitosun/index.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix counters
content = content.replace(/<div class="(stat-val|val)"([^>]*)>0<\/div>/g, (match, className, attrs) => {
  let count = '';
  let prefix = '';
  let suffix = '';
  
  const countMatch = attrs.match(/data-count="([^"]*)"/);
  if (countMatch) count = countMatch[1];
  
  const prefixMatch = attrs.match(/data-prefix="([^"]*)"/);
  if (prefixMatch) prefix = prefixMatch[1];
  
  const suffixMatch = attrs.match(/data-suffix="([^"]*)"/);
  if (suffixMatch) suffix = suffixMatch[1];
  
  return `<div class="${className}"${attrs}>${prefix}${count}${suffix}</div>`;
});

// 2. Fix testimonials avatars
// Carlos Mendes
content = content.replace(
  /<img class="test-avatar" src="[^"]*" alt="Foto de Carlos Mendes"[^>]*>/g,
  '<div class="test-avatar" style="background:var(--orange);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;border-radius:50%;width:42px;height:42px;font-size:16px;flex-shrink:0;">CM</div>'
);
// Fernanda Lima
content = content.replace(
  /<img class="test-avatar" src="[^"]*" alt="Foto de Fernanda Lima"[^>]*>/g,
  '<div class="test-avatar" style="background:var(--orange);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;border-radius:50%;width:42px;height:42px;font-size:16px;flex-shrink:0;">FL</div>'
);
// Roberto Silva
content = content.replace(
  /<img class="test-avatar" src="[^"]*" alt="Foto de Roberto Silva"[^>]*>/g,
  '<div class="test-avatar" style="background:var(--orange);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;border-radius:50%;width:42px;height:42px;font-size:16px;flex-shrink:0;">RS</div>'
);

// 3. Fix clients and utility logos
const oldClients = `<div class="clients-list"><span>MRV Engenharia</span><span>Direcional</span><span>Moura Dubeux</span><span>Neoenergia</span><span>Cemig</span><span>Energisa</span></div>`;
const newClients = `<div class="clients-list"><span>MRV Engenharia</span><span>Direcional</span><span>Moura Dubeux</span></div>
    </div>
    <div class="clients-bar reveal" style="margin-top:24px;border-top:1px solid var(--subtle);padding-top:24px;">
      <p style="color:var(--orange);">CREDENCIAMENTO OFICIAL</p>
      <div class="clients-list"><span>Neoenergia</span><span>Cemig</span><span>Energisa</span></div>`;
content = content.replace(oldClients, newClients);

fs.writeFileSync(file, content, 'utf8');
console.log('Exitosun fixes applied.');
