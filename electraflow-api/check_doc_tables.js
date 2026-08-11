const jwt = require('jsonwebtoken');
const http = require('http');

const secret = 'your-super-secret-jwt-key-change-in-production';
const token = jwt.sign(
  { userId: '00000000-0000-0000-0000-000000000000', email: 'exitogrid@gmail.com', role: 'admin', sub: '00000000-0000-0000-0000-000000000000' },
  secret,
  { expiresIn: '1h' }
);

function httpGet(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, data: e.message }));
    req.end();
  });
}

async function main() {
  // Test ALL the main pages' loadData calls
  const endpoints = [
    { path: '/documents', name: 'Documents' },
    { path: '/documents/folders/root', name: 'Root Folders' },
    { path: '/documents/categories', name: 'Doc Categories' },
    { path: '/clients?pageSize=1000', name: 'Clients' },
    { path: '/proposals', name: 'Proposals' },
    { path: '/works', name: 'Works' },
    { path: '/contracts', name: 'Contracts' },
    { path: '/tasks', name: 'Tasks' },
    { path: '/leads', name: 'Leads' },
    { path: '/users', name: 'Users' },
    { path: '/service-orders', name: 'Service Orders' },
    { path: '/budgets', name: 'Budgets' },
    { path: '/dashboard/stats', name: 'Dashboard Stats' },
    { path: '/health/simple', name: 'Health' },
  ];

  console.log('=== TESTING ALL MAIN API ENDPOINTS ===\n');
  
  for (const ep of endpoints) {
    const res = await httpGet(ep.path);
    const count = Array.isArray(res.data) ? res.data.length : (res.data?.data?.length ?? '?');
    const status = res.status === 200 ? '✅' : '❌';
    console.log(`${status} ${ep.name.padEnd(20)} Status: ${res.status} | Items: ${count}`);
    if (res.status !== 200) {
      console.log(`   Error: ${JSON.stringify(res.data).substring(0, 200)}`);
    }
  }
}

main();
