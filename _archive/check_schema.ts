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

async function checkSchema() {
  try {
    await replitClient.connect();
    await doClient.connect();

    console.log('📋 Colunas da tabela gv_mgmt_indicators:\n');
    
    const replitCols = await replitClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gv_mgmt_indicators' 
      ORDER BY ordinal_position
    `);
    
    const doCols = await doClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gv_mgmt_indicators' 
      ORDER BY ordinal_position
    `);
    
    console.log('REPLIT:');
    replitCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));
    
    console.log('\nDIGITAL OCEAN:');
    doCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));
    
    await replitClient.end();
    await doClient.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkSchema();
