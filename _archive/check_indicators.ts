import pkg from 'pg';
const { Client } = pkg;

const replitClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const doClient = new Client({
  host: '143.198.136.16',
  port: 5433,
  user: 'postgres',
  password: 'I34y*efn12#j',
  database: 'clubedogrito',
  ssl: false
});

async function check() {
  try {
    await replitClient.connect();
    await doClient.connect();

    const replitIndicators = await replitClient.query('SELECT COUNT(*) FROM gv_mgmt_indicators');
    const doIndicators = await doClient.query('SELECT COUNT(*) FROM gv_mgmt_indicators');
    
    console.log(`Replit: ${replitIndicators.rows[0].count} indicadores`);
    console.log(`DO: ${doIndicators.rows[0].count} indicadores`);
    
    // Verificar quais IDs faltam
    const replitIds = await replitClient.query('SELECT id FROM gv_mgmt_indicators ORDER BY id');
    const doIds = await doClient.query('SELECT id FROM gv_mgmt_indicators ORDER BY id');
    
    const replitSet = new Set(replitIds.rows.map(r => r.id));
    const doSet = new Set(doIds.rows.map(r => r.id));
    
    const missing = [...replitSet].filter(id => !doSet.has(id));
    
    console.log(`\nIndicadores faltando no DO: ${missing.length}`);
    if (missing.length > 0) {
      console.log('IDs:', missing.slice(0, 20).join(', '));
    }
    
    await replitClient.end();
    await doClient.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

check();
