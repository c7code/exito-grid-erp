const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Carlos Mendes/Downloads/public_html (4)';

const walkSync = (d) => {
  let files = [];
  fs.readdirSync(d).forEach(file => {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(walkSync(fullPath));
    } else {
      if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  });
  return files;
};

const whatsappIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.552 4.109 1.516 5.833L.022 23.978l6.284-1.647A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892c-1.99 0-3.85-.538-5.444-1.476l-.39-.232-4.046 1.061 1.08-3.943-.255-.404A9.847 9.847 0 0 1 2.108 12C2.108 6.53 6.53 2.108 12 2.108c5.47 0 9.892 4.422 9.892 9.892 0 5.47-4.422 9.892-9.892 9.892z"/></svg>`;
const phoneIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.19 15.86 19.79 19.79 0 0 1 .11 7.19 2 2 0 0 1 2.1 5h3a2 2 0 0 1 2 1.72 19.5 19.5 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.09 12.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 19.5 19.5 0 0 0 2.81.7A2 2 0 0 1 20 20.92z"/></svg>`;

const files = walkSync(dir);
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace tel: links
  if (content.includes('href="tel:')) {
    content = content.replace(/href="tel:\+?(\d+)"/g, (match, p1) => {
      // If it's a Brazilian mobile number like 5581988906429
      return `href="https://wa.me/${p1}" target="_blank"`;
    });
    changed = true;
  }

  // Replace "Fale pelo WhatsApp"
  if (content.includes('Fale pelo WhatsApp')) {
    content = content.replace(/Fale pelo WhatsApp/g, 'Fale pelo WhatsApp');
    changed = true;
  }

  // Find the exact line in index.html to change Telefone to WhatsApp
  if (file.endsWith('index.html') && content.includes('<small>Telefone</small>')) {
    content = content.replace(
      /<a href="https:\/\/wa.me\/5581988906429" target="_blank" class="contato-item"><div class="contato-icon">[\s\S]*?<\/div><div><small>Telefone<\/small><span>\(81\) 9 8890-6429<\/span><\/div><\/a>/,
      `<a href="https://wa.me/5581988906429" target="_blank" class="contato-item"><div class="contato-icon">${whatsappIcon}</div><div><small>WhatsApp - resposta em minutos</small><span>(81) 9 8890-6429</span></div></a>`
    );
    changed = true;
  }
  
  if (file.endsWith('index.html') && content.includes('<small>Telefone</small>')) {
    // If previous regex didn't catch it
    content = content.replace(/<small>Telefone<\/small>/g, '<small>WhatsApp - resposta em minutos</small>');
    content = content.replace(/<a href="https:\/\/wa.me\/5581988906429"[^>]*><div class="contato-icon"><svg[^>]*>.*?<\/svg><\/div><div><small>WhatsApp - resposta em minutos<\/small>/, 
    `<a href="https://wa.me/5581988906429" target="_blank" class="contato-item"><div class="contato-icon">${whatsappIcon}</div><div><small>WhatsApp - resposta em minutos</small>`);
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
}
