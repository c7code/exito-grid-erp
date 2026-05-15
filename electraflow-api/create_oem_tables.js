const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });

  await c.connect();
  console.log('Conectado ao banco.');

  // ═══ TABELA: oem_usinas ═══
  const checkUsinas = await c.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'oem_usinas'
  `);
  if (checkUsinas.rows.length > 0) {
    console.log('✅ oem_usinas já existe.');
  } else {
    console.log('Criando oem_usinas...');
    await c.query(`
      CREATE TABLE oem_usinas (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clienteId" UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        "empresaId" UUID REFERENCES companies(id) ON DELETE SET NULL,
        "projetoSolarId" UUID,
        "nome" VARCHAR NOT NULL,
        "potenciaKwp" DECIMAL(10,2) NOT NULL,
        "qtdModulos" INT NOT NULL,
        "modeloModulos" VARCHAR,
        "qtdInversores" INT DEFAULT 1,
        "modeloInversores" VARCHAR,
        "marcaInversor" VARCHAR,
        "serialInversores" TEXT,
        "dataInstalacao" DATE NOT NULL,
        "tipoTelhado" VARCHAR,
        "inclinacaoGraus" DECIMAL(5,2),
        "azimuteGraus" DECIMAL(5,2),
        "endereco" VARCHAR NOT NULL,
        "latitude" DECIMAL(10,7),
        "longitude" DECIMAL(10,7),
        "geracaoMensalEsperadaKwh" DECIMAL(10,2),
        "apiMonitoramentoTipo" VARCHAR,
        "apiMonitoramentoCredentials" TEXT,
        "status" VARCHAR DEFAULT 'ativa',
        "observacoes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);
    console.log('✅ oem_usinas criada!');
  }

  // ═══ TABELA: oem_planos ═══
  const checkPlanos = await c.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'oem_planos'
  `);
  if (checkPlanos.rows.length > 0) {
    console.log('✅ oem_planos já existe.');
  } else {
    console.log('Criando oem_planos...');
    await c.query(`
      CREATE TABLE oem_planos (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nome" VARCHAR NOT NULL,
        "descricao" TEXT,
        "incluiLimpeza" BOOLEAN DEFAULT true,
        "incluiInspecaoVisual" BOOLEAN DEFAULT true,
        "incluiTermografia" BOOLEAN DEFAULT false,
        "incluiTesteString" BOOLEAN DEFAULT false,
        "incluiMonitoramentoRemoto" BOOLEAN DEFAULT false,
        "incluiCorretivaPrioritaria" BOOLEAN DEFAULT false,
        "garantiaPerformancePr" DECIMAL(5,2),
        "frequenciaPreventiva" VARCHAR DEFAULT 'semestral',
        "precoBaseMensal" DECIMAL(10,2) NOT NULL,
        "kwpLimiteBase" DECIMAL(10,2) DEFAULT 10,
        "precoKwpExcedente" DECIMAL(10,2),
        "unidadeCobranca" VARCHAR DEFAULT 'kWp',
        "faixasPreco" TEXT,
        "custoMobilizacao" DECIMAL(10,2) DEFAULT 0,
        "custosFixosDetalhados" TEXT,
        "ativo" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ oem_planos criada!');
  }

  // ═══ TABELA: oem_contratos ═══
  const checkContratos = await c.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'oem_contratos'
  `);
  if (checkContratos.rows.length > 0) {
    console.log('✅ oem_contratos já existe.');
  } else {
    console.log('Criando oem_contratos...');
    await c.query(`
      CREATE TABLE oem_contratos (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clienteId" UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        "usinaId" UUID NOT NULL REFERENCES oem_usinas(id) ON DELETE CASCADE,
        "planoId" UUID NOT NULL REFERENCES oem_planos(id) ON DELETE CASCADE,
        "dataInicio" DATE NOT NULL,
        "dataFim" DATE,
        "valorMensal" DECIMAL(10,2) NOT NULL,
        "indiceReajuste" VARCHAR,
        "dataProximoReajuste" DATE,
        "renovacaoAutomatica" BOOLEAN DEFAULT true,
        "status" VARCHAR DEFAULT 'ativo',
        "motivoCancelamento" TEXT,
        "parceiroId" VARCHAR,
        "observacoes" TEXT,
        "calculoDetalhado" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);
    console.log('✅ oem_contratos criada!');
  }

  await c.end();
  console.log('\n✅ Migration OEM concluída!');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
