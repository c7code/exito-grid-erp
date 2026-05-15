const { Client } = require('pg');
async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const cols = [
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "tipoPlano" VARCHAR DEFAULT 'standard'`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "tempoRespostaSlaHoras" INTEGER DEFAULT 48`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "tempoRespostaUrgenteHoras" INTEGER DEFAULT 4`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "coberturaMaxAnual" DECIMAL(10,2)`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "exclusoes" TEXT`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "termosDuracaoMeses" INTEGER DEFAULT 12`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "descontoAnualPercent" DECIMAL(5,2) DEFAULT 0`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "atendimentoHorario" VARCHAR DEFAULT 'comercial'`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "incluiRelatorio" BOOLEAN DEFAULT true`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "frequenciaRelatorio" VARCHAR DEFAULT 'trimestral'`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "incluiSeguro" BOOLEAN DEFAULT false`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "limiteCorretivas" INTEGER`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "abrangenciaKm" INTEGER`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "penalidades" TEXT`],
    [`ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "beneficios" TEXT`],
  ];
  for (const [sql] of cols) {
    try { await c.query(sql); } catch (e) { console.warn(e.message); }
  }
  console.log('✅ Colunas adicionadas em oem_planos!');
  const r = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='oem_planos' ORDER BY ordinal_position`);
  console.log('Colunas:', r.rows.map(r => r.column_name).join(', '));
  await c.end();
}
main().catch(console.error);
