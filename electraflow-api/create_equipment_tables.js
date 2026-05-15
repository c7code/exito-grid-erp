const { DataSource } = require('typeorm');
require('dotenv').config();

(async () => {
  const ds = new DataSource({ type: 'postgres', url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await ds.initialize();
  console.log('Conectado ao banco.');

  // ═══ EQUIPMENT ═══
  await ds.query(`
    CREATE TABLE IF NOT EXISTS equipment (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR UNIQUE NOT NULL,
      name VARCHAR NOT NULL,
      description TEXT,
      type VARCHAR DEFAULT 'mobile',
      category VARCHAR DEFAULT 'munck',
      brand VARCHAR,
      model VARCHAR,
      year VARCHAR,
      plate VARCHAR,
      "serialNumber" VARCHAR,
      "chassisNumber" VARCHAR,
      status VARCHAR DEFAULT 'available',
      "hourlyRate" DECIMAL(15,2) DEFAULT 0,
      "dailyRate" DECIMAL(15,2) DEFAULT 0,
      "monthlyRate" DECIMAL(15,2) DEFAULT 0,
      "currentOperatorId" VARCHAR,
      location VARCHAR,
      "lastMaintenanceDate" TIMESTAMP,
      "nextMaintenanceDate" TIMESTAMP,
      "totalHoursUsed" DECIMAL(10,1) DEFAULT 0,
      "totalRentals" INTEGER DEFAULT 0,
      photos JSONB,
      notes TEXT,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    );
  `);
  console.log('✅ Tabela equipment criada');

  // ═══ EQUIPMENT RENTALS ═══
  await ds.query(`
    CREATE TABLE IF NOT EXISTS equipment_rentals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR UNIQUE NOT NULL,
      "equipmentId" UUID NOT NULL REFERENCES equipment(id),
      "clientId" UUID REFERENCES clients(id),
      "operatorId" VARCHAR,
      "operatorName" VARCHAR,
      status VARCHAR DEFAULT 'draft',
      "rentalType" VARCHAR DEFAULT 'with_operator',
      "billingType" VARCHAR DEFAULT 'daily',
      "unitRate" DECIMAL(15,2) DEFAULT 0,
      quantity DECIMAL(10,2) DEFAULT 1,
      "totalValue" DECIMAL(15,2) DEFAULT 0,
      "startDate" TIMESTAMP,
      "endDate" TIMESTAMP,
      "actualEndDate" TIMESTAMP,
      "deliveryAddress" VARCHAR,
      "deliveryCity" VARCHAR,
      "deliveryState" VARCHAR,
      "proposalId" VARCHAR,
      "contractId" VARCHAR,
      "serviceOrderId" VARCHAR,
      notes TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    );
  `);
  console.log('✅ Tabela equipment_rentals criada');

  // ═══ EQUIPMENT MAINTENANCE ═══
  await ds.query(`
    CREATE TABLE IF NOT EXISTS equipment_maintenance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "equipmentId" UUID NOT NULL REFERENCES equipment(id),
      type VARCHAR DEFAULT 'preventive',
      description VARCHAR NOT NULL,
      cost DECIMAL(15,2) DEFAULT 0,
      "performedBy" VARCHAR,
      "performedAt" TIMESTAMP,
      "nextDueDate" TIMESTAMP,
      "nextDueHours" DECIMAL(10,1),
      status VARCHAR DEFAULT 'scheduled',
      notes TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela equipment_maintenance criada');

  // Verificar
  const tables = await ds.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema='public' AND table_name LIKE 'equipment%' ORDER BY table_name
  `);
  console.log('\n=== Tabelas criadas ===');
  tables.forEach(t => console.log('  ✓', t.table_name));

  await ds.destroy();
  console.log('\n✅ Migração completa!');
})();
