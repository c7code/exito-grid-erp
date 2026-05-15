const { Client } = require('pg');
async function main() {
    const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
    await c.connect();
    await c.query('DELETE FROM sinapi_input_prices');
    await c.query('DELETE FROM sinapi_composition_costs');
    await c.query('DELETE FROM sinapi_composition_items');
    await c.query('DELETE FROM sinapi_compositions');
    await c.query('DELETE FROM sinapi_inputs');
    await c.query('DELETE FROM sinapi_import_logs');
    await c.query('DELETE FROM sinapi_references');
    console.log('Purged all SINAPI data');
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
