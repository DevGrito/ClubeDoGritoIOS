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

    // Verificar assignments que serão migrados
    const assignments = await replitClient.query(`
      SELECT DISTINCT project_id FROM gv_indicator_assignments WHERE id > 114
    `);
    
    console.log('Project IDs nos assignments a migrar:');
    for (const row of assignments.rows) {
      const existsInDO = await doClient.query(
        'SELECT id, name FROM gv_projects WHERE id = $1', 
        [row.project_id]
      );
      
      if (existsInDO.rows.length === 0) {
        const projInReplit = await replitClient.query(
          'SELECT id, name FROM gv_projects WHERE id = $1',
          [row.project_id]
        );
        console.log(`  ❌ Projeto ${row.project_id} (${projInReplit.rows[0]?.name}) - FALTA NO DO`);
      } else {
        console.log(`  ✓ Projeto ${row.project_id} (${existsInDO.rows[0].name}) - OK`);
      }
    }
    
    await replitClient.end();
    await doClient.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

check();
