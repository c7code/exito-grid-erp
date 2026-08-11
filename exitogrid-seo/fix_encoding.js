const fs = require('fs');

const files = [
  'exitosun/index.html',
  'exitosun/exitosun.html',
  'conteudo site/aumento-carga-final.html',
  'conteudo site/deslocamento-rede-final.html',
  'conteudo site/extensao-rede-final.html',
  'conteudo site/instalacao-subestacao-final.html',
  'conteudo site/laudo-tecnico-instalacao-final.html',
  'conteudo site/modernizacao-instalacoes-final.html',
  'conteudo site/projeto-entrada-energia-final.html',
  'conteudo site/projeto-rede-aerea-final.html',
  'conteudo site/projeto-rede-subterranea-final.html',
  'conteudo site/quadro-distribuicao-final.html',
  'conteudo site/sistema-aterramento-final.html',
  'conteudo site/spda-para-raios-final.html',
  'conteudo site/vistoria-concessionaria-final.html'
];

const replacements = {
  'contesdo': 'conteúdo',
  'dsvidas': 'dúvidas',
  'instala\\b': 'instalação',
  'instalaes': 'instalações',
  'nfo': 'não',
  'servi': 'serviço',
  'solu\\b': 'solução',
  'solues': 'soluções',
  'subesta': 'subestação',
  'ms': 'mês',
  'y"': '📞',
  'recife': 'Recife -',
  'adequa': 'adequação',
  'navega': 'navegação',
  'for': 'força',
  'provis': 'provisória',
  'sico': 'fásico', // trifásico, monofásico
  'b': 'bá',
  'fo': 'ão',
  'o': 'ão',
  's': 'ês',
  '': 'ã' // fallback for other things, might be risky, let's omit the fallback
};

files.forEach(f => {
  const p = 'c:/Users/Carlos Mendes/Downloads/public_html (4)/' + f;
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  
  // ExitoSun specific replaces based on what we saw earlier
  c = c.replace(/Reduza sua conta de luz em at/g, 'Reduza sua conta de luz em até');
  c = c.replace(/Oramento/g, 'Orçamento');
  c = c.replace(/Grtis/g, 'Grátis');
  c = c.replace(/instalao/g, 'instalação');
  c = c.replace(/Servios/g, 'Serviços');
  c = c.replace(/Benefcios/g, 'Benefícios');
  c = c.replace(/Dvidas/g, 'Dúvidas');
  c = c.replace(/Voc est/g, 'Você está');
  c = c.replace(/Nossos projetos so/g, 'Nossos projetos são');
  c = c.replace(/at/g, 'até');
  c = c.replace(/voc/g, 'você');
  c = c.replace(/aprovao/g, 'aprovação');
  c = c.replace(/no/g, 'não');
  c = c.replace(/eltrica/g, 'elétrica');
  c = c.replace(/plos/g, 'pólos');
  c = c.replace(/tcnico/g, 'técnico');
  c = c.replace(/Tcnico/g, 'Técnico');
  c = c.replace(/manuteno/g, 'manutenção');
  c = c.replace(/Manuteno/g, 'Manutenção');
  c = c.replace(/[\uFFFD]/g, ''); // Remove any remaining broken chars
  
  fs.writeFileSync(p, c, 'utf8');
});
console.log('Encoding fixes applied.');
