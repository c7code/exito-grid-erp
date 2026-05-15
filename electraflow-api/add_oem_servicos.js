const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  console.log('Conectado.');

  const check = await c.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'oem_servicos'`);
  if (check.rows.length > 0) {
    console.log('✅ oem_servicos já existe.');
  } else {
    console.log('Criando oem_servicos...');
    await c.query(`
      CREATE TABLE oem_servicos (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "usinaId" UUID NOT NULL,
        "clienteId" UUID NOT NULL,
        "proposalId" UUID,
        "tipo" VARCHAR NOT NULL,
        "status" VARCHAR DEFAULT 'pendente',
        "prioridade" VARCHAR DEFAULT 'normal',
        "descricao" TEXT,
        "diagnostico" TEXT,
        "solucao" TEXT,
        "componentesAfetados" TEXT,
        "dataAgendada" DATE,
        "dataConclusao" DATE,
        "valorEstimado" DECIMAL(10,2),
        "valorFinal" DECIMAL(10,2),
        "checklist" TEXT,
        "fotosAntes" TEXT,
        "fotosDepois" TEXT,
        "relatorioTecnico" TEXT,
        "recomendacoes" TEXT,
        "tecnicoResponsavel" VARCHAR,
        "equipe" TEXT,
        "observacoes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);
    console.log('✅ oem_servicos criada!');
  }

  await c.end();
  console.log('✅ Migration concluída!');
}

main().catch(err => { console.error('Erro:', err.message); process.exit(1); });
