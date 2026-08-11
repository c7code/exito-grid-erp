const https = require('https');

// Simular exatamente o que o browser faz
// 1. Testar OPTIONS (preflight CORS)
// 2. Testar POST login

const API = 'exito-grid-erp-production.up.railway.app';

function testCORS() {
  return new Promise((resolve) => {
    const options = {
      hostname: API,
      path: '/api/auth/unified-login',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://exito-grid-erp-app-production.up.railway.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    };

    const req = https.request(options, (res) => {
      console.log('=== CORS PREFLIGHT ===');
      console.log('Status:', res.statusCode);
      console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin'] || 'MISSING!');
      console.log('Access-Control-Allow-Methods:', res.headers['access-control-allow-methods'] || 'MISSING!');
      console.log('Access-Control-Allow-Headers:', res.headers['access-control-allow-headers'] || 'MISSING!');
      console.log('All headers:', JSON.stringify(res.headers, null, 2));
      resolve();
    });
    req.on('error', (e) => { console.error('CORS Error:', e.message); resolve(); });
    req.end();
  });
}

function testLogin() {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email: 'exitogrid@gmail.com', password: '@94103581Awn' });
    const options = {
      hostname: API,
      path: '/api/auth/unified-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Origin': 'https://exito-grid-erp-app-production.up.railway.app',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('\n=== LOGIN POST ===');
        console.log('Status:', res.statusCode);
        console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin'] || 'MISSING!');
        try {
          const parsed = JSON.parse(body);
          if (parsed.portals) {
            console.log('Login OK! Portals:', parsed.portals.length);
            console.log('User:', parsed.portals[0]?.user?.name);
          } else {
            console.log('Response:', JSON.stringify(parsed, null, 2));
          }
        } catch { console.log('Body:', body); }
        resolve();
      });
    });
    req.on('error', (e) => { console.error('Login Error:', e.message); resolve(); });
    req.write(data);
    req.end();
  });
}

async function main() {
  await testCORS();
  await testLogin();
}
main();
