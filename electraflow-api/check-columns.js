const { Client } = require('pg');
const c = new Client('postgresql://postgres:CA8627058CHRR97@db.ltlpyqyfamsvdhbmyvps.supabase.co:5432/postgres');

async function main() {
  await c.connect();

  // Step 1: Check before
  const before = await c.query(
    "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE attisdropped) as dropped " +
    "FROM pg_attribute a JOIN pg_class cl ON a.attrelid = cl.oid " +
    "JOIN pg_namespace n ON n.oid = cl.relnamespace " +
    "WHERE n.nspname = 'public' AND cl.relname = 'stock_movements' AND a.attnum > 0"
  );
  console.log('BEFORE:');
  console.log('  Total attrs: ' + before.rows[0].total + ', Dropped: ' + before.rows[0].dropped);

  // Step 2: Get the CREATE TABLE statement by inspecting columns
  const cols = await c.query(
    "SELECT column_name, data_type, character_maximum_length, column_default, is_nullable, udt_name " +
    "FROM information_schema.columns " +
    "WHERE table_schema = 'public' AND table_name = 'stock_movements' " +
    "ORDER BY ordinal_position"
  );
  console.log('\nActive columns:');
  for (const col of cols.rows) {
    console.log('  ' + col.column_name + ' (' + col.udt_name + ')');
  }

  // Step 3: Get row count
  const count = await c.query("SELECT COUNT(*) as cnt FROM stock_movements");
  console.log('\nRow count: ' + count.rows[0].cnt);

  // Step 4: Recreate table (CREATE AS SELECT + swap)
  console.log('\nRecreating table...');
  
  // Drop foreign keys referencing stock_movements
  const fks = await c.query(
    "SELECT tc.constraint_name, tc.table_name " +
    "FROM information_schema.referential_constraints rc " +
    "JOIN information_schema.table_constraints tc ON tc.constraint_name = rc.constraint_name " +
    "WHERE rc.unique_constraint_catalog = current_catalog " +
    "AND EXISTS (SELECT 1 FROM information_schema.constraint_column_usage ccu " +
    "WHERE ccu.constraint_name = rc.unique_constraint_name AND ccu.table_name = 'stock_movements')"
  );
  console.log('Foreign keys referencing stock_movements: ' + fks.rows.length);

  // Get constraints/indexes on stock_movements
  const constraints = await c.query(
    "SELECT conname, contype, pg_get_constraintdef(oid) as def " +
    "FROM pg_constraint " +
    "WHERE conrelid = 'stock_movements'::regclass"
  );
  console.log('\nConstraints on stock_movements:');
  for (const con of constraints.rows) {
    console.log('  ' + con.conname + ' (' + con.contype + '): ' + con.def);
  }

  // Get indexes
  const indexes = await c.query(
    "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'stock_movements'"
  );
  console.log('\nIndexes:');
  for (const idx of indexes.rows) {
    console.log('  ' + idx.indexname + ': ' + idx.indexdef);
  }

  // Get enum type used
  const enumCheck = await c.query(
    "SELECT column_name, udt_name FROM information_schema.columns " +
    "WHERE table_name = 'stock_movements' AND data_type = 'USER-DEFINED'"
  );
  console.log('\nEnum columns:');
  for (const e of enumCheck.rows) {
    console.log('  ' + e.column_name + ': ' + e.udt_name);
  }

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
