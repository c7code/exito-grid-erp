const http = require('http');

const d = JSON.stringify({ canInvoiceMaterial: true });
const r = http.request({
    hostname: 'localhost', port: 3000,
    path: '/api/fiscal/config', method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) },
}, (res) => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => console.log('STATUS:', res.statusCode, '\nBODY:', b.substring(0, 1000)));
});
r.write(d);
r.end();
