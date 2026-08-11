const { Client } = require('pg');

const c = new Client('postgresql://postgres.ltlpyqyfamsvdhbmyvps:Exito2026Emg@aws-1-us-east-1.pooler.supabase.com:5432/postgres');

async function main() {
  await c.connect();
  
  // Check ALL users to understand the full picture
  const r = await c.query('SELECT id, email, name, role, "isActive", "createdAt", "updatedAt" FROM users ORDER BY "createdAt" DESC');
  console.log('=== Todos os usuarios ===');
  r.rows.forEach(u => {
    console.log(`  ${u.email} | role=${u.role} | active=${u.isActive} | created=${u.createdAt} | updated=${u.updatedAt}`);
  });

  // Check if there are user_sessions
  const sessions = await c.query('SELECT COUNT(*) as cnt FROM user_sessions');
  console.log('\nSessions:', sessions.rows[0].cnt);

  await c.end();
}

main().catch(e => { console.error('ERR:', e.message); c.end(); });
