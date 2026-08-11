const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Carlos Mendes/Downloads/public_html (4)';

// 1. ExitoSun htaccess for redirection
fs.writeFileSync(path.join(dir, 'exitosun', '.htaccess'), 'Redirect 301 /exitosun.html https://exitosun.exitogrid.com.br/', 'utf8');

const walkSync = (d) => {
  let files = [];
  fs.readdirSync(d).forEach(file => {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(walkSync(fullPath));
    } else {
      if (fullPath.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  });
  return files;
};

const htmlFiles = walkSync(dir);

const ga4Code = `\n<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>\n</head>`;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add GA4 if not exists
  if (content.includes('</head>') && !content.includes('G-XXXXXXXXXX')) {
    content = content.replace('</head>', ga4Code);
    changed = true;
  }
  
  // ExitoSun og:image
  if (file.includes('exitosun') && content.includes('og:image')) {
    const newContent = content.replace(/content="https:\/\/images\.unsplash\.com[^"]*"/g, 'content="https://exitosun.exitogrid.com.br/og-image.png"');
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }
  
  // Lazy loading & fetchpriority
  if (content.includes('<img ')) {
    let lines = content.split('\n');
    let heroImgFound = false;
    for (let i=0; i<lines.length; i++) {
      if (lines[i].includes('<img ')) {
        if (!heroImgFound && lines[i].includes('hero')) {
          if (!lines[i].includes('fetchpriority')) {
            lines[i] = lines[i].replace('<img ', '<img fetchpriority="high" ');
            changed = true;
          }
          heroImgFound = true;
        } else {
          if (!lines[i].includes('loading="lazy"') && !lines[i].includes('loading="eager"')) {
            lines[i] = lines[i].replace('<img ', '<img loading="lazy" ');
            changed = true;
          }
        }
      }
    }
    content = lines.join('\n');
  }

  if (file.endsWith('index.html') && !file.includes('exitosun') && !file.includes('blog') && !file.includes('conteudo')) {
    // Main site index.html
    const newTitle = '<title>Projetos Elétricos e Laudos | Especialistas Credenciados | Recife e Nordeste</title>';
    const newDesc = '<meta name="description" content="Engenharia elétrica especializada em projetos, subestações e laudos com aprovação garantida. Empresa credenciada Neoenergia. Atendemos Recife, PE, AL, PB e RN.">';
    
    if (content.includes('<title>Exitogrid')) {
      content = content.replace(/<title>.*?<\/title>/, newTitle);
      changed = true;
    }
    if (content.includes('<meta name="description"')) {
      content = content.replace(/<meta name="description" content="[^"]*">/, newDesc);
      changed = true;
    }
    
    if (content.includes('"@type":"Electrician"')) {
      content = content.replace(/"@type":"Electrician"/g, '"@type":"ProfessionalService"');
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

// Add click events to GA4
const scriptFile = path.join(dir, 'script.js');
if (fs.existsSync(scriptFile)) {
  let scriptContent = fs.readFileSync(scriptFile, 'utf8');
  if (!scriptContent.includes('gtag(')) {
    // In handleFormSubmit
    scriptContent = scriptContent.replace(/window\.open\([^)]*\);/, (match) => {
      return match + `\n  if(typeof gtag === 'function') gtag('event', 'generate_lead', { method: 'WhatsApp_Form' });`;
    });
    // Find WhatsApp buttons
    scriptContent += `\n
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
    el.addEventListener('click', () => {
      if(typeof gtag === 'function') gtag('event', 'contact', { method: 'WhatsApp_Click' });
    });
  });
});
`;
    fs.writeFileSync(scriptFile, scriptContent, 'utf8');
  }
}

console.log('SEO updates applied.');
