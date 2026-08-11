const fs = require('fs');
const content = fs.readFileSync('exitosun/index.html', 'utf8');
const depoimentos = content.match(/<section[^>]*>[\s\S]*?depoimento[\s\S]*?<\/section>/i);
const stats = content.match(/class="[^"]*counter[^"]*"[^>]*>[\s\S]*?<\//gi);
const clients = content.match(/<section[^>]*>[\s\S]*?neoenergia[\s\S]*?cemig[\s\S]*?<\/section>/i);

console.log("STATS:");
console.log(stats);
console.log("\nDEPOIMENTOS:");
console.log(depoimentos ? depoimentos[0].substring(0, 500) + '...' : 'not found');
console.log("\nCLIENTS:");
console.log(clients ? clients[0].substring(0, 500) + '...' : 'not found');
