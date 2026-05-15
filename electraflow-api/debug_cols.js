// List columns of each SINAPI sheet by reading a sample from the preview endpoint
const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    
    // The warnings from the import tell us the sheet names and structure
    // But we need actual column names. Let me check the first processed row
    // by looking at what getField attempts
    
    // Let's query the log warnings more carefully - we need to actually read the XLSX
    // Since we can't read the XLSX directly, let's add a debug endpoint temporarily
    // OR: use the preview endpoint on the deployed API
    
    // Actually, let's try a different approach - call the preview API
    const https = require('https');
    
    // Check if API is up first
    const url = 'https://exito-grid-erp-production.up.railway.app/api/sinapi/stats';
    
    https.get(url, { headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' } }, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
            console.log('API Status:', res.statusCode);
            console.log('Stats:', data.substring(0, 500));
        });
    }).on('error', (e) => {
        console.log('API Error:', e.message);
    });
    
    // Let's just trace the column issue. The ISD sheet has headers that start somewhere.
    // From the old warnings we saw: "Origem de preço:, C = COLETADO, CR = COEFICIENTE DE REPRESENTATIVIDADE"
    // which means the header row detection picked the WRONG row
    // The real headers should be something like: Tipo Item, Código do Item, Descrição, Unidade, AC, AL, ...
    
    console.log('\nThe problem: getCode() searches for columns named:');
    console.log('  Código, CODIGO, CÓDIGO, Código SINAPI, CODIGO SINAPI,');
    console.log('  Código da Composição, COD, Código do Insumo');
    console.log('\nBut the actual SINAPI ISD columns might be named differently.');
    console.log('\nLet me check what column names the parser actually finds...');
    
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
