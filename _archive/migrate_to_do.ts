import pkg from 'pg';
const { Client } = pkg;

// Conexão com Replit
const replitClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Conexão com Digital Ocean
const doClient = new Client({
  host: '143.198.136.16',
  port: 5433,
  user: 'postgres',
  password: 'I34y*efn12#j',
  database: 'clubedogrito',
  ssl: false
});

async function migrate() {
  try {
    console.log('🔌 Conectando aos bancos...\n');
    await replitClient.connect();
    await doClient.connect();
    console.log('✅ Conexões estabelecidas!\n');

    // 1. Migrar indicator assignments (apenas novos)
    console.log('📋 Migrando indicator assignments...');
    const assignments = await replitClient.query(`
      SELECT * FROM gv_indicator_assignments 
      WHERE id > 114 
      ORDER BY id
    `);
    
    let assignmentsAdded = 0;
    for (const row of assignments.rows) {
      const exists = await doClient.query(
        'SELECT id FROM gv_indicator_assignments WHERE id = $1',
        [row.id]
      );
      
      if (exists.rows.length === 0) {
        await doClient.query(`
          INSERT INTO gv_indicator_assignments 
          (id, indicator_id, project_id, is_primary, weight, active, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [row.id, row.indicator_id, row.project_id, row.is_primary, row.weight, row.active, row.created_at]);
        assignmentsAdded++;
      }
    }
    console.log(`  ✓ ${assignmentsAdded} novos indicator assignments migrados\n`);

    // 2. Migrar dados mensais (apenas novos)
    console.log('📊 Migrando dados mensais...');
    const monthlyData = await replitClient.query(`
      SELECT * FROM gv_monthly_data 
      WHERE year = 2025 
      ORDER BY id
    `);
    
    let dataAdded = 0;
    for (const row of monthlyData.rows) {
      const exists = await doClient.query(
        'SELECT id FROM gv_monthly_data WHERE id = $1',
        [row.id]
      );
      
      if (exists.rows.length === 0) {
        await doClient.query(`
          INSERT INTO gv_monthly_data 
          (id, assignment_id, year, month, month_name, target_value, actual_value, 
           recurrence, quarterly_avg, semester_avg, annual_value, data_source, 
           imported_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          row.id, row.assignment_id, row.year, row.month, row.month_name,
          row.target_value, row.actual_value, row.recurrence, row.quarterly_avg,
          row.semester_avg, row.annual_value, row.data_source, row.imported_at,
          row.created_at, row.updated_at
        ]);
        dataAdded++;
      }
    }
    console.log(`  ✓ ${dataAdded} registros de dados mensais migrados\n`);

    // 3. Atualizar sequence
    console.log('🔄 Atualizando sequences...');
    await doClient.query(`
      SELECT setval('gv_indicator_assignments_id_seq', 
        (SELECT MAX(id) FROM gv_indicator_assignments), true)
    `);
    await doClient.query(`
      SELECT setval('gv_monthly_data_id_seq', 
        (SELECT MAX(id) FROM gv_monthly_data), true)
    `);
    console.log('  ✓ Sequences atualizadas\n');

    // Resumo final
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log(`\n📊 Resumo:`);
    console.log(`  - ${assignmentsAdded} indicator assignments adicionados`);
    console.log(`  - ${dataAdded} dados mensais adicionados`);
    
    await replitClient.end();
    await doClient.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrate();
