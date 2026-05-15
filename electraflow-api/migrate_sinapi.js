const { Client } = require('pg');
async function main() {
    const c = new Client({
        connectionString: 'postgresql://postgres.ltlpyqyfamsvdhbmyvps:CA8627058CHRR97@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    });
    await c.connect();

    // 1. Purge all SINAPI data (wrong imports)
    const tables = [
        'sinapi_budget_links', 'sinapi_composition_items', 'sinapi_composition_costs',
        'sinapi_input_prices', 'sinapi_compositions', 'sinapi_inputs',
        'sinapi_import_logs', 'sinapi_references'
    ];
    for (const t of tables) {
        const r = await c.query(`DELETE FROM "${t}"`);
        console.log(`${t}: deleted ${r.rowCount}`);
    }

    // 2. Add state column to price tables
    await c.query(`ALTER TABLE sinapi_input_prices ADD COLUMN IF NOT EXISTS state CHAR(2)`);
    await c.query(`ALTER TABLE sinapi_composition_costs ADD COLUMN IF NOT EXISTS state CHAR(2)`);

    // 3. Drop old unique indexes and create new ones with state
    await c.query(`DROP INDEX IF EXISTS idx_sinapi_input_price_ref`);
    await c.query(`DROP INDEX IF EXISTS idx_sinapi_iprice_ref_input_state`);
    await c.query(`CREATE UNIQUE INDEX idx_sinapi_iprice_ref_input_state ON sinapi_input_prices("referenceId","inputId",state)`);

    await c.query(`DROP INDEX IF EXISTS idx_sinapi_comp_cost_ref`);
    await c.query(`DROP INDEX IF EXISTS idx_sinapi_ccost_ref_comp_state`);
    await c.query(`CREATE UNIQUE INDEX idx_sinapi_ccost_ref_comp_state ON sinapi_composition_costs("referenceId","compositionId",state)`);

    // 4. Add state indexes for fast filtering
    await c.query(`CREATE INDEX IF NOT EXISTS idx_sinapi_iprice_state ON sinapi_input_prices(state)`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_sinapi_ccost_state ON sinapi_composition_costs(state)`);

    // 5. Change sinapi_references unique index to (year, month) only — no state
    await c.query(`DROP INDEX IF EXISTS idx_sinapi_ref_year_month_state`);
    await c.query(`DROP INDEX IF EXISTS idx_sinapi_ref_year_month`);
    await c.query(`CREATE UNIQUE INDEX idx_sinapi_ref_year_month ON sinapi_references(year, month)`);

    console.log('Schema migration completed OK');
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
