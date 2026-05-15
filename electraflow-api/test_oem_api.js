// Test API request to understand the 500 error
const https = require('https');

async function testApi() {
  // First, login to get a token
  const loginData = JSON.stringify({
    email: 'euller@exitogrid.com.br',
    password: 'Exito@2024',
  });

  const loginOptions = {
    hostname: 'exito-grid-erp-production.up.railway.app',
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  const token = await new Promise((resolve, reject) => {
    const req = https.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('Login status:', res.statusCode);
          resolve(json.access_token || json.token);
        } catch (e) {
          console.log('Login response:', data.substring(0, 200));
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  if (!token) {
    console.log('No token received!');
    return;
  }
  console.log('Token:', token.substring(0, 20) + '...');

  // Now test POST /api/oem/usinas
  const testData = JSON.stringify({
    nome: 'Test Usina API',
    clienteId: '5ddd1744-6fe6-4459-a3df-4e386bb0082c',
    potenciaKwp: 5.5,
    qtdModulos: 10,
    dataInstalacao: '2026-01-01',
    endereco: 'Rua Teste, 123',
    status: 'ativa',
  });

  const postOptions = {
    hostname: 'exito-grid-erp-production.up.railway.app',
    path: '/api/oem/usinas',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  const result = await new Promise((resolve, reject) => {
    const req = https.request(postOptions, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        console.log('\nPOST /api/oem/usinas status:', res.statusCode);
        console.log('Response:', data.substring(0, 500));
        resolve(data);
      });
    });
    req.on('error', reject);
    req.write(testData);
    req.end();
  });
}

testApi().catch(console.error);
