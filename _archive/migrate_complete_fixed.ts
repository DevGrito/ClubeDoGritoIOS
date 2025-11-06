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

async function migrate() {
  try {
    console.log('🔌 Conectando aos bancos...\n');
    await replitClient.connect();
    await doClient.connect();
    console.log('✅ Conexões estabelecidas!\n');

    // 0. Migrar projeto Marketing (ID 42)
    console.log('📁 Migrando projeto Marketing...');
    const projects = await replitClient.query('SELECT * FROM gv_projects WHERE id = 42');
    
    let projectsAdded = 0;
    for (const row of projects.rows) {
      const exists = await doClient.query('SELECT id FROM gv_projects WHERE id = $1', [row.id]);
      
      if (exists.rows.length === 0) {
        await doClient.query(`
          INSERT INTO gv_projects 
          (id, name, slug, description, sector_id, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [row.id, row.name, row.slug, row.description, row.sector_id, row.active, row.created_at, row.updated_at]);
        projectsAdded++;
        console.log(`  ✓ Projeto ${row.id}: ${row.name}`);
      }
    }
    console.log(`  Total: ${projectsAdded} projetos\n`);

    // 1. Migrar indicadores (IDs > 66)
    console.log('📊 Migrando indicadores...');
    const indicators = await replitClient.query('SELECT * FROM gv_mgmt_indicators WHERE id > 66 ORDER BY id');
    
    let indicatorsAdded = 0;
    for (const row of indicators.rows) {
      const exists = await doClient.query('SELECT id FROM gv_mgmt_indicators WHERE id = $1', [row.id]);
      
      if (exists.rows.length === 0) {
        await doClient.query(`
          INSERT INTO gv_mgmt_indicators 
          (id, name, description, unit, calculation_method, data_source, 
           update_frequency, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          row.id, row.name, row.description, row.unit, 
          row.calculation_method, row.data_source, row.update_frequency,
          row.active, row.created_at, row.updated_at
        ]);
        indicatorsAdded++;
      }
    }
    console.log(`  Total: ${indicatorsAdded} indicadores\n`);

    // 2. Migrar assignments (IDs > 114)
    console.log('📋 Migrando assignments...');
    const assignments = await replitClient.query('SELECT * FROM gv_indicator_assignments WHERE id > 114 ORDER BY id');
    
    let assignmentsAdded = 0;
    for (const row of assignments.rows) {
      const exists = await doClient.query('SELECT id FROM gv_indicator_assignments WHERE id = $1', [row.id]);
      
      if (exists.rows.length === 0) {
        await doClient.query(`
          INSERT INTO gv_indicator_assignments 
          (id, indicator_id, project_id, is_primary, weight, active, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [row.id, row.indicator_id, row.project_id, row.is_primary, row.weight, row.active, row.created_at]);
        assignmentsAdded++;
      }
    }
    console.log(`  Total: ${assignmentsAdded} assignments\n`);

    // 3. Migrar dados mensais 2025
    console.log('📊 Migrando dados mensais (2025)...');
    const monthlyData = await replitClient.query('SELECT * FROM gv_monthly_data WHERE year = 2025 ORDER BY id');
    
    let dataAdded = 0;
    for (const row of monthlyData.rows) {
      const exists = await doClient.query('SELECT id FROM gv_monthly_data WHERE id = $1', [row.id]);
      
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
    console.log(`  Total: ${dataAdded} registros\n`);

    // 4. Atualizar sequences
    console.log('🔄 Atualizando sequences...');
    await doClient.query(`SELECT setval('gv_projects_id_seq', COALESCE((SELECT MAX(id) FROM gv_projects), 1), true)`);
    await doClient.query(`SELECT setval('gv_mgmt_indicators_id_seq', COALESCE((SELECT MAX(id) FROM gv_mgmt_indicators), 1), true)`);
    await doClient.query(`SELECT setval('gv_indicator_assignments_id_seq', COALESCE((SELECT MAX(id) FROM gv_indicator_assignments), 1), true)`);
    await doClient.query(`SELECT setval('gv_monthly_data_id_seq', COALESCE((SELECT MAX(id) FROM gv_monthly_data), 1), true)`);
    console.log('  ✓ OK\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  • ${projectsAdded} projeto(s)`);
    console.log(`  • ${indicatorsAdded} indicador(es)`);
    console.log(`  • ${assignmentsAdded} assignment(s)`);
    console.log(`  • ${dataAdded} dado(s) mensal(is) - AGO/SET PEC`);
    console.log('═══════════════════════════════════════════════════\n');
    
    await replitClient.end();
    await doClient.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await replitClient.end();
    await doClient.end();
    process.exit(1);
  }
}

migrate();
