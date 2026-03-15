const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
});

ds.initialize().then(async () => {
    console.log('Connected to database');
    try {
        await ds.query(`
            CREATE TABLE IF NOT EXISTS work_type_configs (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                key varchar(100) UNIQUE NOT NULL,
                label varchar(150) NOT NULL,
                "isActive" boolean DEFAULT true,
                "sortOrder" int DEFAULT 0,
                "createdAt" timestamp DEFAULT now(),
                "updatedAt" timestamp DEFAULT now()
            )
        `);
        console.log('✅ Table work_type_configs created successfully');
        const result = await ds.query('SELECT COUNT(*) FROM work_type_configs');
        console.log('Row count:', result[0].count);
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    await ds.destroy();
}).catch(e => console.error('Connection error:', e.message));
