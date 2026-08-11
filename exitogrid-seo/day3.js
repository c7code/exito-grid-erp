const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Carlos Mendes/Downloads/public_html (4)';

const landlineIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.19 15.86 19.79 19.79 0 0 1 .11 7.19 2 2 0 0 1 2.1 5h3a2 2 0 0 1 2 1.72 19.5 19.5 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.09 12.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 19.5 19.5 0 0 0 2.81.7A2 2 0 0 1 20 20.92z"/></svg>`;
const landlineLink = `\n          <a href="tel:+558130000000" class="contato-item"><div class="contato-icon">${landlineIcon}</div><div><small>Fixo</small><span>(81) 3000-0000</span></div></a>`;

// 1. Add landline to index.html contact section
let indexFile = path.join(dir, 'index.html');
if (fs.existsSync(indexFile)) {
  let content = fs.readFileSync(indexFile, 'utf8');
  if (!content.includes('>Fixo</small>')) {
    content = content.replace(/(<a href="mailto:contato@exitogrid.com.br"[^>]*>[\s\S]*?<\/a>)/, `$1${landlineLink}`);
    fs.writeFileSync(indexFile, content, 'utf8');
  }
}

// 2. Create structure for Bahia and RN pages
const templatePath = path.join(dir, 'recife', 'index.html');
if (fs.existsSync(templatePath)) {
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Bahia
  const baDir = path.join(dir, 'salvador-bahia');
  if (!fs.existsSync(baDir)) fs.mkdirSync(baDir);
  let baContent = template.replace(/Recife/g, 'Salvador').replace(/Pernambuco/g, 'Bahia').replace(/PE/g, 'BA');
  fs.writeFileSync(path.join(baDir, 'index.html'), baContent, 'utf8');
  
  // RN
  const rnDir = path.join(dir, 'natal-rn');
  if (!fs.existsSync(rnDir)) fs.mkdirSync(rnDir);
  let rnContent = template.replace(/Recife/g, 'Natal').replace(/Pernambuco/g, 'Rio Grande do Norte').replace(/PE/g, 'RN');
  fs.writeFileSync(path.join(rnDir, 'index.html'), rnContent, 'utf8');
}

// 3. Create blog post template
const blogDir = path.join(dir, 'blog');
if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir);

const blogTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Importância do Projeto Elétrico | Exitogrid Engenharia</title>
<meta name="description" content="Saiba a importância do projeto elétrico e como a Exitogrid pode ajudar a aprovar seu projeto na Neoenergia.">
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
</head>
<body>
  <!-- Header Include Placeholder -->
  
  <main>
    <article class="blog-post">
      <h1>Por que o Projeto Elétrico é Fundamental para sua Obra?</h1>
      <p>Um projeto elétrico bem elaborado evita dores de cabeça e garante a segurança da sua instalação...</p>
      
      <h2>1. Segurança contra incêndios</h2>
      <p>A maior causa de incêndios...</p>
      
      <h2>2. Economia de Materiais</h2>
      <p>Com o dimensionamento correto...</p>
      
      <!-- Internal link pointing to sales page -->
      <div class="cta">
        <p>Precisa de um projeto elétrico aprovado na Neoenergia?</p>
        <a href="/projeto-entrada-energia/">Conheça nosso serviço de Projeto de Entrada de Energia</a>
      </div>
    </article>
  </main>
  
  <!-- Footer Include Placeholder -->
</body>
</html>`;

const blogPostDir = path.join(blogDir, 'importancia-do-projeto-eletrico');
if (!fs.existsSync(blogPostDir)) fs.mkdirSync(blogPostDir);
fs.writeFileSync(path.join(blogPostDir, 'index.html'), blogTemplate, 'utf8');

console.log('Day 3 updates applied.');
