const fs = require('fs');
const path = require('path');
const walkSync = (d) => {
  let files = [];
  fs.readdirSync(d).forEach(file => {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) files = files.concat(walkSync(fullPath));
    else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) files.push(fullPath);
  });
  return files;
};
const files = walkSync('c:/Users/Carlos Mendes/Downloads/public_html (4)');
let found = false;
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  // Match  or typical double-encoded UTF-8 like Ã§, Ã£, Ã¡, Ã©, Ã³, Ãº, Ã­
  const matches = c.match(/(|Ã[£§¡©³úí])/g);
  if (matches) {
    console.log(f.substring(f.indexOf('public_html')), '->', [...new Set(matches)]);
    found = true;
  }
});
if (!found) console.log("No broken characters found.");
