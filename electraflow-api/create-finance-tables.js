// Script para criar as tabelas de configuração financeira no Supabase
// Executar: npx ts-node src/finance/create-finance-tables.ts

const { DataSource } = require('typeorm');
require('dotenv').config();

async function createTables() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
  });

  await ds.initialize();
  console.log('Connected to database');

  const queries = [
    `CREATE TABLE IF NOT EXISTS "dre_categories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar NOT NULL,
      "type" varchar NOT NULL DEFAULT 'despesa',
      "signal" varchar NOT NULL DEFAULT '-',
      "parentId" uuid,
      "sortOrder" int DEFAULT 0,
      "isActive" boolean DEFAULT true,
      "isSystem" boolean DEFAULT false,
      "transactionCategory" varchar,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP,
      CONSTRAINT "FK_dre_parent" FOREIGN KEY ("parentId") REFERENCES "dre_categories"("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "bank_accounts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar NOT NULL,
      "bankName" varchar,
      "bankCode" varchar,
      "agency" varchar,
      "accountNumber" varchar,
      "accountType" varchar,
      "initialBalance" decimal(15,2) DEFAULT 0,
      "currentBalance" decimal(15,2) DEFAULT 0,
      "isActive" boolean DEFAULT true,
      "pixKey" varchar,
      "notes" varchar,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "cost_centers" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar NOT NULL,
      "code" varchar,
      "description" varchar,
      "isActive" boolean DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "code" varchar NOT NULL,
      "name" varchar NOT NULL,
      "parentId" uuid,
      "nature" varchar DEFAULT 'analitica',
      "type" varchar DEFAULT 'despesa',
      "isActive" boolean DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP,
      CONSTRAINT "FK_chart_parent" FOREIGN KEY ("parentId") REFERENCES "chart_of_accounts"("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "cash_registers" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar NOT NULL,
      "description" varchar,
      "balance" decimal(15,2) DEFAULT 0,
      "isActive" boolean DEFAULT true,
      "responsibleName" varchar,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "payment_methods_config" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar NOT NULL,
      "code" varchar,
      "isActive" boolean DEFAULT true,
      "defaultFeePercent" decimal(5,2) DEFAULT 0,
      "defaultInstallments" int DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
  ];

  for (const sql of queries) {
    try {
      await ds.query(sql);
      const tableName = sql.match(/"(\w+)"/)?.[1];
      console.log(`✅ Table ${tableName} created/verified`);
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  }

  await ds.destroy();
  console.log('\nDone! All tables created.');
}

createTables().catch(console.error);
