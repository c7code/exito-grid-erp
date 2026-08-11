const https = require('https');

const API = 'exito-grid-erp-production.up.railway.app';

// Simular exatamente o que o frontend faz ao salvar um projeto solar
const data = JSON.stringify({
  title: 'Teste Debug Solar',
  clientId: '',
  billingCategory: 'BT',
  consumptionKwh: 500,
  tariff: 0.85,
  connectionType: 'biphasic',
  installationType: 'roof',
  roofOrientation: 'norte',
  equipment: [],
  margin: 15,
});

// First get a token
const loginData = JSON.stringify({ email: 'exitogrid@gmail.com', password: '@94103581Awn' });

function doLogin() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: API,
      path: '/api/auth/unified-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.portals?.[0]?.token);
        } catch { reject(new Error('Parse error')); }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

function testCreateSolar(token) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: API,
      path: '/api/solar-projects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`,
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('=== CREATE SOLAR PROJECT ===');
        console.log('Status:', res.statusCode);
        try {
          const parsed = JSON.parse(body);
          console.log('Response:', JSON.stringify(parsed, null, 2));
        } catch { console.log('Body:', body); }
        resolve();
      });
    });
    req.on('error', (e) => { console.error('Error:', e.message); resolve(); });
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Fazendo login...');
  const token = await doLogin();
  if (!token) { console.error('Login falhou'); return; }
  console.log('Token OK, testando criação de projeto solar...\n');
  await testCreateSolar(token);
}

main().catch(e => console.error(e));
