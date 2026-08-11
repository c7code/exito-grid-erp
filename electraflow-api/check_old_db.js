const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Client } = require('pg');

const configs = [
  { host: 'aws-0-us-east-1.pooler.supabase.com', user: 'postgres.ltlpyqyfamsvdhbmyvps', password: 'Exito2026Emg', label: 'Pooler aws-0' },
  { host: 'aws-1-us-east-1.pooler.supabase.com', user: 'postgres.ltlpyqyfamsvdhbmyvps', password: 'Exito2026Emg', label: 'Pooler aws-1' },
  { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: 'postgres.ltlpyqyfamsvdhbmyvps', password: 'Exito2026Emg', label: 'Pooler aws-0 :6543' },
];

async function tryAll() {
  for (const cfg of configs) {
    const c = new Client({
      host: cfg.host, port: cfg.port || 5432, database: 'postgres',
      user: cfg.user, password: cfg.password,
      ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000,
    });
    try {
      await c.connect();
      console.log(`✅ ${cfg.label}: CONECTOU!`);
      const t = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
      console.log(`   Tabelas: ${t.rows.length}`);
      t.rows.forEach(x => console.log('    -', x.table_name));
      const counts = ['users','clients','proposals','works','leads','employees'];
      for (const table of counts) {
        try { const r = await c.query(`SELECT COUNT(*) FROM "${table}"`); console.log(`   ${table}: ${r.rows[0].count}`); } catch(e) {}
      }
      await c.end();
      return;
    } catch(e) {
      console.log(`❌ ${cfg.label}: ${e.message}`);
      try { await c.end(); } catch(x) {}
    }
  }
}
tryAll();
