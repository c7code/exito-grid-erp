const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Get all existing columns for proposals
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'proposals'`
  );
  const existingCols = new Set(res.rows.map(r => r.column_name.toLowerCase()));
  console.log('Existing columns count:', existingCols.size);

  // All columns from entity that might be missing
  const neededCols = [
    { name: 'pricingEngineData', type: 'TEXT' },
    { name: 'revisionNumber', type: 'INTEGER DEFAULT 1' },
    { name: 'createdById', type: 'VARCHAR' },
    { name: 'updatedById', type: 'VARCHAR' },
    { name: 'workDeadlineType', type: "VARCHAR DEFAULT 'calendar_days'" },
    { name: 'workDeadlineText', type: 'TEXT' },
    { name: 'objectiveType', type: 'VARCHAR' },
    { name: 'objectiveText', type: 'TEXT' },
    { name: 'thirdPartyDeadlines', type: 'TEXT' },
    { name: 'contractorObligations', type: 'TEXT' },
    { name: 'clientObligations', type: 'TEXT' },
    { name: 'generalProvisions', type: 'TEXT' },
    { name: 'activityType', type: 'VARCHAR' },
    { name: 'itemVisibilityMode', type: "VARCHAR DEFAULT 'detailed'" },
    { name: 'materialSummaryText', type: 'TEXT' },
    { name: 'serviceSummaryText', type: 'TEXT' },
    { name: 'summaryTotalLabel', type: 'VARCHAR' },
    // Cost fields
    { name: 'logisticsCostValue', type: 'DECIMAL(15,2)' },
    { name: 'logisticsCostMode', type: "VARCHAR DEFAULT 'visible'" },
    { name: 'logisticsCostPercent', type: 'DECIMAL(5,2)' },
    { name: 'logisticsCostApplyTo', type: "VARCHAR DEFAULT 'material'" },
    { name: 'logisticsCostEmbedMaterialPct', type: 'DECIMAL(5,2) DEFAULT 100' },
    { name: 'logisticsCostEmbedServicePct', type: 'DECIMAL(5,2) DEFAULT 0' },
    { name: 'logisticsCostDescription', type: 'TEXT' },
    { name: 'adminCostValue', type: 'DECIMAL(15,2)' },
    { name: 'adminCostMode', type: "VARCHAR DEFAULT 'visible'" },
    { name: 'adminCostPercent', type: 'DECIMAL(5,2)' },
    { name: 'adminCostApplyTo', type: "VARCHAR DEFAULT 'material'" },
    { name: 'adminCostEmbedMaterialPct', type: 'DECIMAL(5,2) DEFAULT 100' },
    { name: 'adminCostEmbedServicePct', type: 'DECIMAL(5,2) DEFAULT 0' },
    { name: 'adminCostDescription', type: 'TEXT' },
    { name: 'brokerageCostValue', type: 'DECIMAL(15,2)' },
    { name: 'brokerageCostMode', type: "VARCHAR DEFAULT 'visible'" },
    { name: 'brokerageCostPercent', type: 'DECIMAL(5,2)' },
    { name: 'brokerageCostApplyTo', type: "VARCHAR DEFAULT 'material'" },
    { name: 'brokerageCostEmbedMaterialPct', type: 'DECIMAL(5,2) DEFAULT 100' },
    { name: 'brokerageCostEmbedServicePct', type: 'DECIMAL(5,2) DEFAULT 0' },
    { name: 'brokerageCostDescription', type: 'TEXT' },
    { name: 'insuranceCostValue', type: 'DECIMAL(15,2)' },
    { name: 'insuranceCostMode', type: "VARCHAR DEFAULT 'visible'" },
    { name: 'insuranceCostPercent', type: 'DECIMAL(5,2)' },
    { name: 'insuranceCostApplyTo', type: "VARCHAR DEFAULT 'material'" },
    { name: 'insuranceCostEmbedMaterialPct', type: 'DECIMAL(5,2) DEFAULT 100' },
    { name: 'insuranceCostEmbedServicePct', type: 'DECIMAL(5,2) DEFAULT 0' },
    { name: 'insuranceCostDescription', type: 'TEXT' },
    // Compliance + signature
    { name: 'complianceText', type: 'TEXT' },
    { name: 'signatureToken', type: 'VARCHAR' },
    { name: 'signatureTokenExpiresAt', type: 'TIMESTAMP' },
    { name: 'signedAt', type: 'TIMESTAMP' },
    { name: 'signedByName', type: 'VARCHAR' },
    { name: 'signedByDocument', type: 'VARCHAR' },
    { name: 'signedByIP', type: 'VARCHAR' },
    { name: 'signedByUserAgent', type: 'TEXT' },
    { name: 'signatureVerificationCode', type: 'VARCHAR' },
    // Description fields
    { name: 'workDescription', type: 'TEXT' },
    { name: 'workAddress', type: 'TEXT' },
    { name: 'materialFornecimento', type: 'TEXT' },
    { name: 'materialFaturamento', type: 'TEXT' },
    { name: 'serviceDescription', type: 'TEXT' },
    { name: 'paymentBank', type: 'TEXT' },
    { name: 'paymentDueCondition', type: 'TEXT' },
    { name: 'workDeadlineDays', type: 'INTEGER' },
  ];

  let added = 0;
  for (const { name, type } of neededCols) {
    if (!existingCols.has(name.toLowerCase())) {
      try {
        await client.query(`ALTER TABLE "proposals" ADD COLUMN "${name}" ${type}`);
        console.log(`✅ Added ${name}`);
        added++;
      } catch (err) {
        console.error(`❌ ${name}: ${err.message}`);
      }
    }
  }

  // Also check proposal_items
  const piRes = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'proposal_items'`
  );
  const piCols = new Set(piRes.rows.map(r => r.column_name.toLowerCase()));
  
  const piNeeded = [
    { name: 'origin', type: 'VARCHAR' },
    { name: 'catalogItemId', type: 'VARCHAR' },
    { name: 'groupingId', type: 'VARCHAR' },
    { name: 'isGrouping', type: 'BOOLEAN DEFAULT false' },
    { name: 'groupingItems', type: 'TEXT' },
    { name: 'parentId', type: 'VARCHAR' },
  ];

  for (const { name, type } of piNeeded) {
    if (!piCols.has(name.toLowerCase())) {
      try {
        await client.query(`ALTER TABLE "proposal_items" ADD COLUMN "${name}" ${type}`);
        console.log(`✅ Added ${name} to proposal_items`);
        added++;
      } catch (err) {
        console.error(`❌ proposal_items.${name}: ${err.message}`);
      }
    }
  }

  console.log(`\nDone. ${added} columns added.`);
  await client.end();
}
run().catch(console.error);
