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

    console.log('📋 Estrutura da tabela gv_projects:\n');
    
    const replitCols = await replitClient.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'gv_projects' 
      ORDER BY ordinal_position
    `);
    
    const doCols = await doClient.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'gv_projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('REPLIT:');
    replitCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
    
    console.log('\nDIGITAL OCEAN:');
    doCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
    
    // Verificar os dados do projeto 42
    const proj42 = await replitClient.query('SELECT * FROM gv_projects WHERE id = 42');
    console.log('\n📦 Dados do Projeto 42 (Marketing):');
    console.log(proj42.rows[0]);
    
    await replitClient.end();
    await doClient.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkSchema();
