const { Client } = require('pg');
async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const { rows: p } = await c.query(`SELECT id, "proposalNumber", title FROM proposals WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 3`);
  console.log('Latest proposals:');
  p.forEach(pr => console.log(pr.proposalNumber, '-', pr.title));
  for (const pr of p) {
    const { rows: items } = await c.query(`SELECT id, description, "unitPrice", quantity, total, "isBundleParent", "parentId", "deletedAt" FROM proposal_items WHERE "proposalId" = $1 ORDER BY "isBundleParent" DESC, "createdAt" ASC`, [pr.id]);
    console.log('\n---', pr.proposalNumber, ':', items.length, 'items ---');
    items.forEach(i => {
      const type = i.isBundleParent ? 'PARENT' : i.parentId ? 'CHILD ' : 'ITEM  ';
      console.log(`${type} | ${i.description} | unit: ${i.unitPrice} | qty: ${i.quantity} | total: ${i.total} | parentId: ${i.parentId || 'null'} | deleted: ${i.deletedAt || 'no'}`);
    });
  }
  await c.end();
}
main().catch(e => console.error('ERR:', e.message));
