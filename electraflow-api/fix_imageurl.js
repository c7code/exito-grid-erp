const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
c.connect().then(async () => {
  await c.query('ALTER TABLE "signature_slots" ALTER COLUMN "imageUrl" TYPE TEXT');
  console.log('Done: imageUrl changed to TEXT');
  await c.end();
}).catch(console.error);
