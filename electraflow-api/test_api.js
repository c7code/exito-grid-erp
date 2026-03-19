const https = require('https');
const { Client } = require('pg');

// 1. Test if the API is alive
function testAPI() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://exito-grid-erp-production.up.railway.app/api', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('API Status:', res.statusCode);
        console.log('API Response:', data.substring(0, 200));
        resolve(res.statusCode);
      });
    });
    req.on('error', err => {
      console.log('API ERROR:', err.message);
      resolve(0);
    });
    req.setTimeout(5000, () => { req.destroy(); resolve(0); });
  });
}

// 2. Test POST /api/proposals with minimal payload
function testCreateProposal(token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      proposal: {
        title: 'TEST-DELETE-ME',
        status: 'draft',
        subtotal: 100,
        discount: 0,
        total: 100,
      },
      items: [
        { description: 'Test Item', serviceType: 'material', unitPrice: 100, quantity: 1, total: 100, unit: 'un' }
      ]
    });

    const options = {
      hostname: 'exito-grid-erp-production.up.railway.app',
      path: '/api/proposals',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\nPOST /api/proposals Status:', res.statusCode);
        console.log('Response:', data.substring(0, 500));
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', err => {
      console.log('POST ERROR:', err.message);
      resolve({ status: 0, data: err.message });
    });
    req.setTimeout(10000, () => { req.destroy(); resolve({ status: 0, data: 'timeout' }); });
    req.write(payload);
    req.end();
  });
}

// 3. Login to get a token
function login() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ email: 'admin@exitogrid.com.br', password: 'admin123' });
    const options = {
      hostname: 'exito-grid-erp-production.up.railway.app',
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Login Status:', res.statusCode);
        try {
          const json = JSON.parse(data);
          console.log('Token:', json.access_token ? json.access_token.substring(0, 20) + '...' : 'NO TOKEN');
          resolve(json.access_token);
        } catch {
          console.log('Login Response:', data.substring(0, 200));
          resolve(null);
        }
      });
    });
    req.on('error', err => { console.log('Login ERROR:', err.message); resolve(null); });
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== TESTING PRODUCTION API ===');
  
  // Test if API is alive
  const apiStatus = await testAPI();
  if (!apiStatus) {
    console.log('\nAPI IS DOWN! Railway deployment may be crashed.');
    return;
  }

  // Login
  const token = await login();
  if (!token) {
    console.log('\nCannot login - trying without auth...');
  }

  // Test create proposal
  const result = await testCreateProposal(token);
  
  if (result.status === 201 || result.status === 200) {
    console.log('\n✅ Proposal created successfully! Cleaning up...');
    // Delete the test proposal
    try {
      const created = JSON.parse(result.data);
      if (created.id) {
        // Delete it
        await new Promise((resolve) => {
          const delReq = https.request({
            hostname: 'exito-grid-erp-production.up.railway.app',
            path: '/api/proposals/' + created.id,
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          }, (res) => {
            console.log('Delete Status:', res.statusCode);
            resolve();
          });
          delReq.on('error', () => resolve());
          delReq.end();
        });
      }
    } catch {}
  } else {
    console.log('\n❌ CREATE FAILED with status', result.status);
  }

  // Also check diagnose-schema endpoint
  if (token) {
    await new Promise((resolve) => {
      const req = https.request({
        hostname: 'exito-grid-erp-production.up.railway.app',
        path: '/api/proposals/diagnose-schema',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('\nDiagnose Schema Status:', res.statusCode);
          console.log('Schema:', data.substring(0, 500));
          resolve();
        });
      });
      req.on('error', err => { console.log('Schema ERROR:', err.message); resolve(); });
      req.setTimeout(10000, () => { req.destroy(); resolve(); });
      req.end();
    });
  }
}

main().catch(e => console.error('ERR:', e.message));
